"""Identity attribution service: runs the deterministic engine and applies enforcement.

Integrations
------------
* Audit Trail      every evaluation, step-up and session revocation is appended to the
                   existing HMAC-chained AuditChain.
* Incident Center  CRITICAL decisions create a real incident through IncidentService.
* Attack Playground scenarios are runnable from backend/api/demo.py.

Everything runs locally; no network calls are made.
"""

import hashlib
import json
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from backend.identity import directory as D
from backend.identity.engine import build_timeline, evaluate
from backend.identity.models import AuthState, SessionContext
from backend.identity.scenarios import SCENARIOS, get_context

AUDIT_DECISION = {"ALLOW": "ALLOW", "STEP_UP_VERIFY": "ESCALATE", "BLOCK": "DENY", "BLOCK_REVOKE_INCIDENT": "DENY"}
SESSION_STATUS = {"LOW": "ACTIVE", "MEDIUM": "PENDING_STEP_UP", "HIGH": "BLOCKED", "CRITICAL": "REVOKED"}
INCIDENT_ACTION = {
    "ACCOUNT_SHARING_SUSPECTED": "ACCOUNT_SHARING_SUSPECTED",
    "INSIDER_DATA_MISUSE": "INSIDER_DATA_MISUSE",
    "COMBINED_ACCOUNT_AND_DATA_MISUSE": "ACCOUNT_SHARING_SUSPECTED",
}


class IdentityService:
    def __init__(self, audit_chain=None, incident_service=None):
        self.audit_chain = audit_chain
        self.incident_service = incident_service
        self._evaluations: Dict[str, Dict[str, Any]] = {}
        self._sessions: Dict[str, Dict[str, Any]] = {}
        self._counter = 0

    # ------------------------------------------------------------------ helpers
    def reset(self) -> None:
        self._evaluations.clear()
        self._sessions.clear()
        self._counter = 0

    @staticmethod
    def _hash_context(ctx: SessionContext) -> str:
        payload = json.dumps(ctx.model_dump(), sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    @staticmethod
    def _clock(ctx: SessionContext, offset_s: int) -> str:
        return (datetime.fromisoformat(ctx.access_at) + timedelta(seconds=offset_s)).strftime("%H:%M:%S")

    def _audit(self, rec: Dict[str, Any], action_type: str, decision: str, risk: str,
               reasons: List[str], policy_ids: List[str], latency_ms: float) -> Optional[str]:
        if not self.audit_chain:
            return None
        res = rec["result"]
        verified = res["attribution"]["verified_operator"]["status"] == "VERIFIED"
        taint = "IDENTITY_VERIFIED" if verified and res["threat_class"] in ("NONE", "INSIDER_DATA_MISUSE") else \
            "IDENTITY_MISMATCH" if res["threat_class"] in ("ACCOUNT_SHARING_SUSPECTED",
                                                           "COMBINED_ACCOUNT_AND_DATA_MISUSE") else \
            "IDENTITY_UNCERTAIN" if res["threat_class"] == "IDENTITY_UNCERTAIN" else "IDENTITY_VERIFIED"
        entry = self.audit_chain.append_decision(
            agent_id=rec["context"]["claimed_account"],
            task_id=f"identity_session:{rec['session_id']}",
            action_type=action_type,
            resource=rec["context"]["data_access"]["dataset"],
            action_hash=rec["context_hash"],
            taint_level=taint,
            risk_level=risk,
            decision=decision,
            reasons=reasons,
            policy_ids=policy_ids,
            latency_ms=round(latency_ms, 3),
        )
        rec["audit_ids"].append(entry["id"])
        return entry["id"]

    def _create_incident(self, rec: Dict[str, Any]) -> Optional[str]:
        if not self.incident_service or rec.get("incident_id"):
            return rec.get("incident_id")
        res, ctx = rec["result"], rec["context"]
        att = res["attribution"]
        action = INCIDENT_ACTION.get(res["threat_class"], "IDENTITY_SESSION_MISMATCH")
        triggered = [s for s in res["signals"] if s["triggered"] and s["points"] > 0]
        reasons = [res["summary"]] + [f"{s['label']}: {s['evidence']}" for s in triggered[:6]]
        reasons += [f"Rule {r['id']}: {r['reason']}" for r in res["rules_fired"]]
        policy_ids = ["IDN-CONTINUOUS-IDENTITY"] + [f"IDN-{r['id']}" for r in res["rules_fired"]]
        attribution_payload = {
            "evaluation_id": rec["id"],
            "session_id": rec["session_id"],
            "scenario_id": rec.get("scenario_id"),
            "threat_class": res["threat_class"],
            "claimed_account": att["claimed_account"],
            "device_owner": att["device_owner"],
            "verified_operator": att["verified_operator"],
            "likely_operator": att["likely_operator"],
            "identity_confidence": att["identity_confidence"],
            "identity_confidence_label": att["identity_confidence_label"],
            "risk_score": res["risk_score"],
            "decision_label": res["decision_label"],
            "note": att["note"],
            "evidence": [{"label": s["label"], "evidence": s["evidence"], "points": s["points"]} for s in triggered],
            "rules_fired": res["rules_fired"],
            "data_access": ctx["data_access"],
            "timeline": rec["timeline"],
        }
        inc = self.incident_service.create_incident(
            agent=ctx["claimed_account"],
            task=f"identity_attribution:{rec['id']}",
            action=action,
            target=f"{ctx['data_access']['dataset']} ({ctx['data_access']['records']:,} records)",
            risk_level="CRITICAL",
            decision="DENY",
            reasons=reasons,
            policy_ids=policy_ids,
            taint_level="IDENTITY_VERIFIED" if res["threat_class"] == "INSIDER_DATA_MISUSE" else "IDENTITY_MISMATCH",
            params={"identity": attribution_payload},
            action_hash=rec["context_hash"],
            auto_notify=False,  # fully local: no outbound email from this feature
            attribution=attribution_payload,
        )
        inc.notification_status = "LOCAL_ONLY"
        rec["incident_id"] = inc.id
        return inc.id

    def _enforce(self, rec: Dict[str, Any], latency_ms: float, step_up: bool = False) -> None:
        res = rec["result"]
        ctx = SessionContext(**rec["context"])
        level = res["risk_level"]
        status = SESSION_STATUS[level]
        sess = self._sessions.setdefault(rec["session_id"], {
            "session_id": rec["session_id"], "account": ctx.claimed_account, "device_id": ctx.device_id,
            "network_id": ctx.network_id, "opened_at": ctx.login_at, "evaluation_id": rec["id"],
        })
        sess["status"] = status
        sess["evaluation_id"] = rec["id"]
        offset = 2 + 3 * len(rec["timeline"])
        misuse = res["threat_class"] in ("INSIDER_DATA_MISUSE", "COMBINED_ACCOUNT_AND_DATA_MISUSE")
        reasons = [res["summary"]] + [
            f"{s['label']}: {s['evidence']}" for s in res["signals"] if s["triggered"] and s["points"] > 0][:4]
        reasons += [f"Rule {r['id']}: {r['reason']}" for r in res["rules_fired"]]
        policies = ["IDN-CONTINUOUS-IDENTITY"] + [f"IDN-{r['id']}" for r in res["rules_fired"]]
        action_type = "STEP_UP_REEVALUATION" if step_up else (
            "INSIDER_MISUSE_ATTRIBUTION" if misuse else "IDENTITY_ATTRIBUTION")
        aud = self._audit(rec, action_type, AUDIT_DECISION[res["decision"]], level, reasons, policies, latency_ms)
        if aud:
            rec["timeline"].append({"time": self._clock(ctx, offset), "source": "AUDIT",
                                    "title": "Audit record appended",
                                    "detail": f"{aud} added to the HMAC-chained audit trail.", "severity": "info"})

        if level == "MEDIUM":
            rec["timeline"].append({"time": self._clock(ctx, offset + 1), "source": "ENFORCEMENT",
                                    "title": "Session held pending step-up", "detail":
                                    "Sensitive action paused until the person completes passkey verification.",
                                    "severity": "warn"})
        elif level in ("HIGH", "CRITICAL"):
            rec["timeline"].append({"time": self._clock(ctx, offset + 1), "source": "ENFORCEMENT",
                                    "title": "Action BLOCKED", "detail":
                                    f"{ctx.data_access.action} of {ctx.data_access.records:,} records denied.",
                                    "severity": "crit"})
        if level == "CRITICAL":
            sess["revoked_at"] = self._clock(ctx, offset + 2)
            rec["timeline"].append({"time": self._clock(ctx, offset + 2), "source": "ENFORCEMENT",
                                    "title": "Session REVOKED",
                                    "detail": f"Session {rec['session_id']} terminated; tokens invalidated.",
                                    "severity": "crit"})
            self._audit(rec, "SESSION_REVOKED", "DENY", "CRITICAL",
                        [f"Session {rec['session_id']} revoked after CRITICAL identity/misuse decision"],
                        ["IDN-SESSION-REVOKE"], 0.4)
            inc_id = self._create_incident(rec)
            if inc_id:
                rec["timeline"].append({"time": self._clock(ctx, offset + 3), "source": "INCIDENT",
                                        "title": f"Incident {inc_id} created",
                                        "detail": "Visible in Security Incident Command Center with attribution evidence.",
                                        "severity": "crit"})
        rec["session"] = dict(sess)

    # ------------------------------------------------------------------ public API
    def evaluate_context(self, ctx: SessionContext, scenario_id: Optional[str] = None,
                         enforce: bool = True) -> Dict[str, Any]:
        t0 = time.perf_counter()
        self._counter += 1
        eval_id = f"IDN-{self._counter:04d}"
        if not ctx.session_id:
            ctx = ctx.model_copy(update={"session_id": f"sess_{eval_id.lower().replace('-', '_')}"})
        result = evaluate(ctx)
        timeline = [e.model_dump() for e in build_timeline(ctx, result)]
        latency = (time.perf_counter() - t0) * 1000
        rec: Dict[str, Any] = {
            "id": eval_id,
            "scenario_id": scenario_id,
            "scenario_title": SCENARIOS[scenario_id]["title"] if scenario_id in SCENARIOS else "Custom evaluation",
            "created_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
            "session_id": ctx.session_id,
            "context": ctx.model_dump(),
            "context_hash": self._hash_context(ctx),
            "result": result.model_dump(),
            "timeline": timeline,
            "audit_ids": [],
            "incident_id": None,
            "history": [{"event": "INITIAL_EVALUATION", "decision": result.decision_label, "risk_score": result.risk_score}],
            "latency_ms": round(latency, 3),
            "step_up_available": result.decision == "STEP_UP_VERIFY",
        }
        self._evaluations[eval_id] = rec
        if enforce:
            self._enforce(rec, latency)
        return rec

    def run_scenario(self, scenario_id: str, enforce: bool = True) -> Dict[str, Any]:
        if scenario_id not in SCENARIOS:
            raise KeyError(scenario_id)
        return self.evaluate_context(get_context(scenario_id), scenario_id=scenario_id, enforce=enforce)

    def step_up(self, eval_id: str, outcome: str) -> Dict[str, Any]:
        rec = self._evaluations.get(eval_id)
        if not rec:
            raise KeyError(eval_id)
        if not rec["step_up_available"]:
            raise ValueError("Step-up verification is only available while an evaluation awaits step-up.")
        if outcome not in ("passed", "failed"):
            raise ValueError("outcome must be 'passed' or 'failed'")
        t0 = time.perf_counter()
        old = SessionContext(**rec["context"])
        new = old.model_copy(update={
            "auth": AuthState(method="passkey", result=outcome, credential_owner=None),
            "step_up_attempted": True,
        })
        result = evaluate(new)
        rec["context"] = new.model_dump()
        rec["context_hash"] = self._hash_context(new)
        rec["result"] = result.model_dump()
        rec["step_up_available"] = False
        off = 2 + 3 * len(rec["timeline"])
        rec["timeline"].append({
            "time": self._clock(new, off), "source": "AUTH",
            "title": f"Step-up passkey verification {outcome.upper()}",
            "detail": ("The claimed account holder proved presence with a phishing-resistant passkey."
                       if outcome == "passed" else "Passkey verification failed during step-up."),
            "severity": "ok" if outcome == "passed" else "crit"})
        rec["timeline"].append({
            "time": self._clock(new, off + 1), "source": "GUARDIAN",
            "title": f"Re-evaluated: {result.decision_label}", "detail": result.summary,
            "severity": {"LOW": "ok", "MEDIUM": "warn"}.get(result.risk_level, "crit")})
        rec["history"].append({"event": f"STEP_UP_{outcome.upper()}", "decision": result.decision_label,
                               "risk_score": result.risk_score})
        self._enforce(rec, (time.perf_counter() - t0) * 1000, step_up=True)
        return rec

    def list_evaluations(self, limit: int = 50) -> List[Dict[str, Any]]:
        return list(reversed(list(self._evaluations.values())))[:limit]

    def get_evaluation(self, eval_id: str) -> Optional[Dict[str, Any]]:
        return self._evaluations.get(eval_id)

    def list_sessions(self) -> List[Dict[str, Any]]:
        return list(self._sessions.values())

    def directory(self) -> Dict[str, Any]:
        return D.directory_snapshot()
