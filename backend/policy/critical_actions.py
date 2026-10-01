"""Critical action and scope verification utilities for GuardianAI."""

from typing import List, Tuple
from shared.constants import (
    ActionType,
    Decision,
    RiskLevel,
    REASON_MANIFEST_NO_ACCESS,
    REASON_SENSITIVE_RESOURCE,
    REASON_TAINTED_SESSION,
)
from shared.schemas import ActionRequest, TaskManifest, SessionState

class CriticalActionInspector:
    @staticmethod
    def inspect_scope(request: ActionRequest, manifest: TaskManifest) -> Tuple[Decision, List[str], RiskLevel]:
        """Validates if action and resource are explicitly allowed by the task manifest."""
        reasons = []
        
        # 1. Check if action type is in manifest.allowed_actions
        if request.action_type not in manifest.allowed_actions:
            reasons.append(
                f"Action '{request.action_type.value}' is not permitted by manifest for task '{manifest.task_id}'"
            )
            return Decision.DENY, reasons, RiskLevel.HIGH

        # 2. Check explicitly denied resources
        if any(denied in request.resource.lower() for denied in manifest.denied_resources):
            reasons.append(f"Resource '{request.resource}' is explicitly prohibited by task manifest")
            return Decision.DENY, reasons, RiskLevel.CRITICAL

        # 3. Check allowed resources if specified
        if manifest.allowed_resources:
            resource_matched = any(
                allowed.lower() in request.resource.lower() or request.resource.lower() in allowed.lower()
                for allowed in manifest.allowed_resources
            )
            if not resource_matched:
                reasons.append(
                    f"Resource '{request.resource}' is outside the authorized scope for task '{manifest.task_id}'"
                )
                return Decision.DENY, reasons, RiskLevel.HIGH

        # 4. Check secret access manifest restrictions
        if request.action_type == ActionType.READ_SECRET and not manifest.can_read_secrets:
            reasons.append(REASON_MANIFEST_NO_ACCESS)
            return Decision.DENY, reasons, RiskLevel.CRITICAL

        # 5. Check external communication restrictions
        if request.action_type == ActionType.EXTERNAL_SEND and not manifest.can_send_external:
            reasons.append(f"Task manifest '{manifest.task_id}' forbids external egress")
            return Decision.DENY, reasons, RiskLevel.CRITICAL

        return Decision.ALLOW, [], RiskLevel.LOW

    @staticmethod
    def inspect_taint(request: ActionRequest, session: SessionState) -> Tuple[Decision, List[str], RiskLevel]:
        """Enforces taint restrictions: tainted sessions cannot perform sensitive actions."""
        from shared.constants import TaintLevel
        
        reasons = []
        if session.taint_level in (TaintLevel.EXTERNAL_UNTRUSTED, TaintLevel.INDIRECT_INJECTION_SUSPECT):
            # Tainted context cannot access secrets
            if request.action_type == ActionType.READ_SECRET or "secret" in request.resource.lower() or ".env" in request.resource.lower():
                reasons.append(REASON_TAINTED_SESSION)
                reasons.append(REASON_SENSITIVE_RESOURCE)
                return Decision.DENY, reasons, RiskLevel.CRITICAL

            # Tainted context cannot send data externally
            if request.action_type == ActionType.EXTERNAL_SEND:
                reasons.append(REASON_TAINTED_SESSION)
                reasons.append("Tainted session cannot initiate external egress (potential exfiltration)")
                return Decision.DENY, reasons, RiskLevel.CRITICAL

            # Tainted context cannot execute destructive operations
            if request.action_type in (ActionType.DB_DELETE, ActionType.SYSTEM_COMMAND):
                reasons.append(REASON_TAINTED_SESSION)
                reasons.append("Tainted session cannot execute destructive operations")
                return Decision.DENY, reasons, RiskLevel.CRITICAL

        return Decision.ALLOW, [], RiskLevel.LOW
