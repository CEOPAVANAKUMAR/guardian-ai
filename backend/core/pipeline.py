"""Central Authorization Pipeline for GuardianAI.

Orchestrates:
1. Agent Identity Authentication
2. Session & Taint Verification
3. Task Scope & Manifest Checks
4. AST SQL Security Inspection
5. Deterministic Policy Evaluation
6. Safe Dry-Run & Escalation Routing
7. Cryptographic Capability Token Issuance
8. Tamper-Evident Audit Logging
"""

import time
from typing import Any, Optional, Tuple

from backend.adapters.database import DatabaseAdapter
from backend.adapters.sql_analyzer import SQLAnalyzer
from backend.approvals.dry_run import DryRunService
from backend.approvals.service import ApprovalService
from backend.approvals.signing import CapabilityTokenService
from backend.audit.chain import AuditChain
from backend.config import settings
from backend.core.decision_merger import DecisionMerger
from backend.core.taint_engine import TaintEngine
from backend.policy.evaluator import PolicyEvaluator
from backend.tasks.manifest_service import ManifestService
from shared.constants import (
    ActionType,
    Decision,
    RiskLevel,
    REASON_AUTHENTICATION_FAILURE,
    REASON_DEFAULT_DENY,
    REASON_MANIFEST_NO_ACCESS,
)
from shared.schemas import (
    ActionRequest,
    AuthorizationDecisionResponse,
)

class AuthorizationPipeline:
    def __init__(
        self,
        policy_evaluator: PolicyEvaluator,
        manifest_service: ManifestService,
        taint_engine: TaintEngine,
        sql_analyzer: SQLAnalyzer,
        db_adapter: DatabaseAdapter,
        token_service: CapabilityTokenService,
        approval_service: ApprovalService,
        audit_chain: AuditChain,
        incident_service=None,
    ):
        self.evaluator = policy_evaluator
        self.manifest_service = manifest_service
        self.taint_engine = taint_engine
        self.sql_analyzer = sql_analyzer
        self.db_adapter = db_adapter
        self.token_service = token_service
        self.approval_service = approval_service
        self.audit_chain = audit_chain
        self.incident_service = incident_service

    def _log_incident_if_needed(
        self,
        request: ActionRequest,
        decision: Any,
        risk_level: Any,
        reasons: list,
        policy_ids: list,
        taint_level: Any = "CLEAN",
        action_hash: Optional[str] = None,
    ):
        if not self.incident_service:
            return
        dec_val = decision.value if hasattr(decision, "value") else str(decision)
        risk_val = risk_level.value if hasattr(risk_level, "value") else str(risk_level)
        taint_val = taint_level.value if hasattr(taint_level, "value") else str(taint_level)

        if dec_val in ("DENY", "ESCALATE") or risk_val in ("HIGH", "CRITICAL"):
            try:
                self.incident_service.create_incident(
                    agent=request.agent_id,
                    task=request.task_id,
                    action=request.action_type.value if hasattr(request.action_type, "value") else str(request.action_type),
                    target=request.resource,
                    risk_level=risk_val,
                    decision=dec_val,
                    reasons=reasons,
                    policy_ids=policy_ids,
                    taint_level=taint_val,
                    params=request.params,
                    action_hash=action_hash or request.get_action_hash(),
                )
            except Exception:
                pass

    def authorize(
        self,
        request: ActionRequest,
        auth_token: Optional[str] = None,
    ) -> AuthorizationDecisionResponse:
        start_time = time.perf_counter()
        action_hash = request.get_action_hash()

        # 0. Agent Authentication Verification
        # Check if caller matches expected credentials
        expected_secret = settings.AGENT_CREDENTIALS.get(request.agent_id)
        if expected_secret and auth_token and auth_token != expected_secret:
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            reasons = [REASON_AUTHENTICATION_FAILURE, f"Agent '{request.agent_id}' credential mismatch"]
            self._log_incident_if_needed(request, Decision.DENY, RiskLevel.CRITICAL, reasons, ["AUTH-FAIL"], "UNKNOWN", action_hash)
            self.audit_chain.append_decision(
                agent_id=request.agent_id,
                task_id=request.task_id,
                action_type=request.action_type.value,
                resource=request.resource,
                action_hash=action_hash,
                taint_level="UNKNOWN",
                risk_level=RiskLevel.CRITICAL.value,
                decision=Decision.DENY.value,
                reasons=reasons,
                policy_ids=["AUTH-FAIL"],
                latency_ms=latency_ms,
            )
            return AuthorizationDecisionResponse(
                decision=Decision.DENY,
                risk_level=RiskLevel.CRITICAL,
                action_hash=action_hash,
                reasons=reasons,
                policy_ids=["AUTH-FAIL"],
                latency_ms=latency_ms,
            )

        # 1. Session lookup & agent binding check
        session = self.taint_engine.get_session(request.session_id)
        if not session:
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            reasons = [f"Session '{request.session_id}' not found or expired"]
            self._log_incident_if_needed(request, Decision.DENY, RiskLevel.HIGH, reasons, ["SESSION-FAIL"], "UNKNOWN", action_hash)
            self.audit_chain.append_decision(
                agent_id=request.agent_id,
                task_id=request.task_id,
                action_type=request.action_type.value,
                resource=request.resource,
                action_hash=action_hash,
                taint_level="UNKNOWN",
                risk_level=RiskLevel.HIGH.value,
                decision=Decision.DENY.value,
                reasons=reasons,
                policy_ids=["SESSION-FAIL"],
                latency_ms=latency_ms,
            )
            return AuthorizationDecisionResponse(
                decision=Decision.DENY,
                risk_level=RiskLevel.HIGH,
                action_hash=action_hash,
                reasons=reasons,
                policy_ids=["SESSION-FAIL"],
                latency_ms=latency_ms,
            )

        if session.agent_id != request.agent_id:
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            reasons = [
                REASON_AUTHENTICATION_FAILURE,
                f"Session '{request.session_id}' belongs to agent '{session.agent_id}', not '{request.agent_id}'",
            ]
            self._log_incident_if_needed(request, Decision.DENY, RiskLevel.CRITICAL, reasons, ["SPOOF-PREVENT"], session.taint_level, action_hash)
            self.audit_chain.append_decision(
                agent_id=request.agent_id,
                task_id=request.task_id,
                action_type=request.action_type.value,
                resource=request.resource,
                action_hash=action_hash,
                taint_level=session.taint_level.value,
                risk_level=RiskLevel.CRITICAL.value,
                decision=Decision.DENY.value,
                reasons=reasons,
                policy_ids=["SPOOF-PREVENT"],
                latency_ms=latency_ms,
            )
            return AuthorizationDecisionResponse(
                decision=Decision.DENY,
                risk_level=RiskLevel.CRITICAL,
                action_hash=action_hash,
                reasons=reasons,
                policy_ids=["SPOOF-PREVENT"],
                latency_ms=latency_ms,
            )

        # 2. Task manifest lookup & agent binding check
        manifest = self.manifest_service.get_manifest(request.task_id)
        if not manifest:
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            reasons = [f"Task manifest '{request.task_id}' does not exist"]
            self._log_incident_if_needed(request, Decision.DENY, RiskLevel.HIGH, reasons, ["MANIFEST-FAIL"], session.taint_level, action_hash)
            self.audit_chain.append_decision(
                agent_id=request.agent_id,
                task_id=request.task_id,
                action_type=request.action_type.value,
                resource=request.resource,
                action_hash=action_hash,
                taint_level=session.taint_level.value,
                risk_level=RiskLevel.HIGH.value,
                decision=Decision.DENY.value,
                reasons=reasons,
                policy_ids=["MANIFEST-FAIL"],
                latency_ms=latency_ms,
            )
            return AuthorizationDecisionResponse(
                decision=Decision.DENY,
                risk_level=RiskLevel.HIGH,
                action_hash=action_hash,
                reasons=reasons,
                policy_ids=["MANIFEST-FAIL"],
                latency_ms=latency_ms,
            )

        if manifest.agent_id != request.agent_id:
            latency_ms = (time.perf_counter() - start_time) * 1000.0
            reasons = [
                REASON_AUTHENTICATION_FAILURE,
                f"Task manifest '{manifest.task_id}' is assigned to '{manifest.agent_id}', not '{request.agent_id}'",
            ]
            self._log_incident_if_needed(request, Decision.DENY, RiskLevel.CRITICAL, reasons, ["TASK-SPOOF-PREVENT"], session.taint_level, action_hash)
            self.audit_chain.append_decision(
                agent_id=request.agent_id,
                task_id=request.task_id,
                action_type=request.action_type.value,
                resource=request.resource,
                action_hash=action_hash,
                taint_level=session.taint_level.value,
                risk_level=RiskLevel.CRITICAL.value,
                decision=Decision.DENY.value,
                reasons=reasons,
                policy_ids=["TASK-SPOOF-PREVENT"],
                latency_ms=latency_ms,
            )
            return AuthorizationDecisionResponse(
                decision=Decision.DENY,
                risk_level=RiskLevel.CRITICAL,
                action_hash=action_hash,
                reasons=reasons,
                policy_ids=["TASK-SPOOF-PREVENT"],
                latency_ms=latency_ms,
            )

        # 3. SQL AST analysis if action involves SQL
        sql_decision = Decision.ALLOW
        sql_reasons = []
        sql_risk = RiskLevel.LOW
        rewritten_params = dict(request.params)

        if request.action_type in (ActionType.DB_READ, ActionType.DB_WRITE, ActionType.DB_DELETE):
            raw_query = request.params.get("query", "")
            sql_report = self.sql_analyzer.analyze(raw_query, max_limit=manifest.max_records_affected)
            sql_decision = sql_report.decision
            sql_risk = sql_report.risk_level
            sql_reasons.extend(sql_report.reasons)
            if sql_report.rewritten_query:
                rewritten_params["query"] = sql_report.rewritten_query

        # 4. Policy evaluation
        policy_resp = self.evaluator.evaluate(request, manifest, session)

        # 5. Merge SQL analysis decision with policy evaluation decision
        merged_decision = DecisionMerger.merge([sql_decision, policy_resp.decision])
        all_reasons = list(dict.fromkeys(sql_reasons + policy_resp.reasons))
        all_policy_ids = list(dict.fromkeys(policy_resp.policy_ids + (["SQL-ANALYZER"] if sql_reasons else [])))
        final_risk = RiskLevel.CRITICAL if RiskLevel.CRITICAL in (sql_risk, policy_resp.risk_level) else (
            RiskLevel.HIGH if RiskLevel.HIGH in (sql_risk, policy_resp.risk_level) else policy_resp.risk_level
        )

        capability_token = None
        approval_id = None
        impact_preview = None

        # 6. Action Routing based on merged decision
        if merged_decision in (Decision.ALLOW, Decision.ALLOW_WITH_CONSTRAINTS):
            # Issue capability token
            capability_token = self.token_service.issue_token(
                action_hash=action_hash,
                agent_id=request.agent_id,
                session_id=request.session_id,
                decision=merged_decision,
                constraints=policy_resp.constraints,
            )

        elif merged_decision == Decision.ESCALATE:
            # Create human approval item with safe dry-run impact preview
            approval_item = self.approval_service.create_approval_request(
                request=request,
                risk_level=final_risk,
                reason="; ".join(all_reasons),
            )
            approval_id = approval_item.id
            impact_preview = approval_item.impact_preview

        latency_ms = (time.perf_counter() - start_time) * 1000.0

        # 7. Tamper-evident Audit Logging
        audit_record = self.audit_chain.append_decision(
            agent_id=request.agent_id,
            task_id=request.task_id,
            action_type=request.action_type.value,
            resource=request.resource,
            action_hash=action_hash,
            taint_level=session.taint_level.value,
            risk_level=final_risk.value,
            decision=merged_decision.value,
            reasons=all_reasons,
            policy_ids=all_policy_ids,
            latency_ms=latency_ms,
        )

        self._log_incident_if_needed(
            request=request,
            decision=merged_decision,
            risk_level=final_risk,
            reasons=all_reasons,
            policy_ids=all_policy_ids,
            taint_level=session.taint_level,
            action_hash=action_hash,
        )

        return AuthorizationDecisionResponse(
            decision=merged_decision,
            risk_level=final_risk,
            action_hash=action_hash,
            reasons=all_reasons,
            policy_ids=all_policy_ids,
            constraints=policy_resp.constraints,
            capability_token=capability_token,
            approval_id=approval_id,
            impact_preview=impact_preview,
            latency_ms=round(latency_ms, 2),
            audit_id=audit_record["id"],
        )
