"""Policy evaluator for GuardianAI runtime authorization."""

import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import yaml

from shared.constants import (
    ActionType,
    Decision,
    RiskLevel,
    TaintLevel,
    REASON_DEFAULT_DENY,
    REASON_INSPECTION_CLEAN,
    REASON_SENSITIVE_RESOURCE,
    REASON_MANIFEST_NO_ACCESS,
    REASON_TAINTED_SESSION,
)
from shared.schemas import (
    ActionRequest,
    AuthorizationDecisionResponse,
    ImpactPreview,
    SessionState,
    TaskManifest,
)
from backend.core.decision_merger import DecisionMerger
from backend.core.fail_closed import fail_closed_authorization
from backend.policy.critical_actions import CriticalActionInspector

POLICY_DIR = Path(__file__).parent

class PolicyEvaluator:
    def __init__(self, base_policy_path: Optional[Path] = None, resources_path: Optional[Path] = None):
        self.base_policy_path = base_policy_path or (POLICY_DIR / "base.yaml")
        self.resources_path = resources_path or (POLICY_DIR / "resources.yaml")
        self._load_policies()

    def _load_policies(self):
        try:
            with open(self.base_policy_path, "r", encoding="utf-8") as f:
                self.base_policy = yaml.safe_load(f)
        except Exception:
            self.base_policy = {"rules": [], "default_decision": "DENY"}

        try:
            with open(self.resources_path, "r", encoding="utf-8") as f:
                self.resource_matrix = yaml.safe_load(f).get("classifications", {})
        except Exception:
            self.resource_matrix = {}

    def get_resource_risk(self, resource_name: str) -> Tuple[str, RiskLevel]:
        res_lower = resource_name.lower()
        for cat_name, details in self.resource_matrix.items():
            for target in details.get("resources", []):
                if target.lower() in res_lower or res_lower in target.lower():
                    risk_str = details.get("risk", "MEDIUM")
                    return cat_name, RiskLevel(risk_str)
        return "UNKNOWN_RESOURCE", RiskLevel.MEDIUM

    @fail_closed_authorization
    def evaluate(
        self,
        request: ActionRequest,
        manifest: TaskManifest,
        session: SessionState,
    ) -> AuthorizationDecisionResponse:
        decisions: List[Decision] = []
        reasons: List[str] = []
        policy_ids: List[str] = []
        constraints: Dict[str, Any] = {}
        highest_risk = RiskLevel.LOW

        # 0. Global hard-block on SYSTEM_COMMAND
        if request.action_type == ActionType.SYSTEM_COMMAND:
            return AuthorizationDecisionResponse(
                decision=Decision.DENY,
                risk_level=RiskLevel.CRITICAL,
                action_hash=request.get_action_hash(),
                reasons=["Arbitrary system command execution is unconditionally prohibited"],
                policy_ids=["POL-001"],
            )

        # 1. Resource sensitivity check
        res_category, res_risk = self.get_resource_risk(request.resource)
        if res_risk in (RiskLevel.HIGH, RiskLevel.CRITICAL):
            highest_risk = res_risk

        if res_category == "CONFIDENTIAL_SECRET":
            reasons.append(REASON_SENSITIVE_RESOURCE)
            if not manifest.can_read_secrets:
                decisions.append(Decision.DENY)
                reasons.append(REASON_MANIFEST_NO_ACCESS)
                policy_ids.append("POL-002")

        # 2. Scope verification against task manifest
        scope_dec, scope_reasons, scope_risk = CriticalActionInspector.inspect_scope(request, manifest)
        decisions.append(scope_dec)
        reasons.extend(scope_reasons)
        if scope_dec == Decision.DENY:
            policy_ids.append("SCOPE-ENFORCE")
            if scope_risk == RiskLevel.CRITICAL:
                highest_risk = RiskLevel.CRITICAL

        # 3. Taint verification
        taint_dec, taint_reasons, taint_risk = CriticalActionInspector.inspect_taint(request, session)
        decisions.append(taint_dec)
        reasons.extend(taint_reasons)
        if taint_dec == Decision.DENY:
            policy_ids.append("POL-003")
            highest_risk = RiskLevel.CRITICAL

        # 4. Action-specific rules
        if request.action_type == ActionType.EXTERNAL_SEND:
            decisions.append(Decision.DENY)
            reasons.append("External data egress is restricted under autonomous policy")
            policy_ids.append("POL-004")
            highest_risk = RiskLevel.HIGH

        elif request.action_type == ActionType.DB_DELETE:
            query = request.params.get("query", "")
            has_where = "where" in query.lower()
            if not has_where:
                decisions.append(Decision.DENY)
                reasons.append("Destructive SQL rejected: DELETE statement without WHERE clause")
                policy_ids.append("POL-006")
                highest_risk = RiskLevel.CRITICAL
            else:
                decisions.append(Decision.ESCALATE)
                reasons.append("Destructive database modification requires human authorization")
                policy_ids.append("POL-005")
                highest_risk = RiskLevel.HIGH

        elif request.action_type == ActionType.DB_READ:
            decisions.append(Decision.ALLOW_WITH_CONSTRAINTS)
            constraints = {
                "max_rows": min(manifest.max_records_affected, 100),
                "read_only": True,
            }
            policy_ids.append("POL-007")

        elif request.action_type == ActionType.READ_DOCUMENT:
            decisions.append(Decision.ALLOW_WITH_CONSTRAINTS)
            constraints = {
                "max_bytes": 10485760,
                "mark_session_tainted": True,
            }
            policy_ids.append("POL-008")

        elif request.action_type == ActionType.READ_SECRET:
            # If not already denied by manifest or taint:
            if not manifest.can_read_secrets:
                decisions.append(Decision.DENY)
                reasons.append(REASON_MANIFEST_NO_ACCESS)
                policy_ids.append("POL-002")
                highest_risk = RiskLevel.CRITICAL

        # If no explicit decisions were recorded, fallback to default DENY
        if not decisions:
            decisions.append(Decision.DENY)
            reasons.append(REASON_DEFAULT_DENY)
            policy_ids.append("DEFAULT-DENY")
            highest_risk = RiskLevel.HIGH

        # 5. Merge all decisions monotonically
        final_decision = DecisionMerger.merge(decisions)

        if final_decision in (Decision.ALLOW, Decision.ALLOW_WITH_CONSTRAINTS) and not reasons:
            reasons.append(REASON_INSPECTION_CLEAN)

        return AuthorizationDecisionResponse(
            decision=final_decision,
            risk_level=highest_risk,
            action_hash=request.get_action_hash(),
            reasons=list(dict.fromkeys(reasons)),  # remove duplicates while preserving order
            policy_ids=list(dict.fromkeys(policy_ids)),
            constraints=constraints or None,
            latency_ms=0.0,
        )
