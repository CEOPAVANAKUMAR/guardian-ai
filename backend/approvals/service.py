"""Human-in-the-loop approval management service for GuardianAI.

Implements strict cryptographic binding between human approval and canonical action hash.
"""

import time
import uuid
from typing import Dict, List, Optional, Tuple

from backend.config import settings
from backend.approvals.dry_run import DryRunService
from backend.approvals.signing import CapabilityTokenService
from shared.constants import (
    ApprovalStatus,
    Decision,
    RiskLevel,
    REASON_ACTION_HASH_MISMATCH,
)
from shared.schemas import (
    ActionRequest,
    ApprovalItem,
    ImpactPreview,
)

class ApprovalService:
    def __init__(
        self,
        token_service: CapabilityTokenService,
        dry_run_service: DryRunService,
        incident_service=None,
    ):
        self.token_service = token_service
        self.dry_run = dry_run_service
        self.incident_service = incident_service
        self._approvals: Dict[str, ApprovalItem] = {}

    def create_approval_request(
        self,
        request: ActionRequest,
        risk_level: RiskLevel,
        reason: str,
    ) -> ApprovalItem:
        approval_id = f"appr_{uuid.uuid4().hex[:10]}"
        action_hash = request.get_action_hash()
        now = time.time()
        expires_at = now + settings.APPROVAL_TTL_SECONDS

        impact = self.dry_run.preview_impact(request)

        item = ApprovalItem(
            id=approval_id,
            agent_id=request.agent_id,
            session_id=request.session_id,
            task_id=request.task_id,
            action_type=request.action_type,
            resource=request.resource,
            params=request.params,
            action_hash=action_hash,
            risk_level=risk_level,
            impact_preview=impact,
            reason=reason,
            status=ApprovalStatus.PENDING,
            created_at=now,
            expires_at=expires_at,
        )
        self._approvals[approval_id] = item
        return item

    def approve(
        self,
        approval_id: str,
        override_action_hash: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """Approves a pending request and issues a capability token bound to the verified action hash."""
        item = self._approvals.get(approval_id)
        if not item:
            return False, None, "Approval request not found"

        now = time.time()
        if now > item.expires_at:
            item.status = ApprovalStatus.EXPIRED
            return False, None, "Approval request has expired"

        if item.status != ApprovalStatus.PENDING:
            return False, None, f"Approval request is already in status: {item.status.value}"

        # Tampering check / action hash mismatch check
        hash_to_verify = override_action_hash or item.action_hash
        if hash_to_verify != item.action_hash:
            # Action was tampered or modified!
            if self.incident_service:
                self.incident_service.create_incident(
                    agent=item.agent_id,
                    task=item.task_id,
                    action="ACTION_HASH_MISMATCH",
                    target=item.resource,
                    risk_level=RiskLevel.CRITICAL.value,
                    decision=Decision.DENY.value,
                    reasons=[
                        f"{REASON_ACTION_HASH_MISMATCH}: Action was altered after request creation",
                        f"Expected canonical hash {item.action_hash[:16]}..., received {hash_to_verify[:16]}...",
                    ],
                    policy_ids=["HASH-MISMATCH-PREVENT"],
                    taint_level="UNTRUSTED_MODIFICATION",
                    params=item.params,
                    action_hash=hash_to_verify,
                )
            return False, None, f"{REASON_ACTION_HASH_MISMATCH}: Action was altered after request creation"

        # Issue signed single-use capability token bound to approved action hash
        token = self.token_service.issue_token(
            action_hash=item.action_hash,
            agent_id=item.agent_id,
            session_id=item.session_id,
            decision=Decision.ALLOW,
            constraints={"human_approved": True, "approval_id": item.id},
        )

        item.status = ApprovalStatus.APPROVED
        item.approved_action_hash = item.action_hash
        item.capability_token = token

        return True, token, None

    def reject(self, approval_id: str, notes: Optional[str] = None) -> Tuple[bool, Optional[str]]:
        item = self._approvals.get(approval_id)
        if not item:
            return False, "Approval request not found"

        if item.status != ApprovalStatus.PENDING:
            return False, f"Approval request is already in status: {item.status.value}"

        item.status = ApprovalStatus.REJECTED
        return True, None

    def get_approval(self, approval_id: str) -> Optional[ApprovalItem]:
        return self._approvals.get(approval_id)

    def list_approvals(self, status: Optional[ApprovalStatus] = None) -> List[ApprovalItem]:
        items = list(self._approvals.values())
        if status:
            items = [i for i in items if i.status == status]
        return sorted(items, key=lambda x: x.created_at, reverse=True)
