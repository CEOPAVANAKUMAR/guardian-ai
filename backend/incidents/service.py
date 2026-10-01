"""Service for managing security incidents, automated alerts, and forensic reports."""

import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from backend.config import settings
from backend.incidents.classifier import classify_incident
from backend.incidents.models import Incident, IncidentStatsResponse
from backend.notifications.email_service import send_incident_alert, validate_email_address


class IncidentService:
    def __init__(self, audit_chain=None):
        self.audit_chain = audit_chain
        self._incidents: Dict[str, Incident] = {}
        self._counter: int = 0
        self._seed_baseline_incidents()

    def _seed_baseline_incidents(self):
        """Seeds initial baseline incidents for demonstration and judge inspection."""
        self.create_incident(
            agent="agent_analyst_01",
            task="task_sales_report_001",
            action="READ_SECRET",
            target="fake_secrets.env",
            risk_level="CRITICAL",
            decision="DENY",
            reasons=[
                "Direct secret access strictly prohibited for analyst agent",
                "Session carries untrusted document context",
            ],
            policy_ids=["SECRET-001", "TAINT-DEFENSE"],
            taint_level="EXTERNAL_UNTRUSTED",
            action_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            auto_notify=False,  # don't spam on startup
        )

    def create_incident(
        self,
        agent: str,
        task: str,
        action: str,
        target: str,
        risk_level: str,
        decision: str,
        reasons: List[str],
        policy_ids: List[str],
        taint_level: str = "CLEAN",
        params: Optional[Dict[str, Any]] = None,
        action_hash: Optional[str] = None,
        auto_notify: bool = True,
        attribution: Optional[Dict[str, Any]] = None,
    ) -> Incident:
        """Deterministically classifies and logs a new security incident."""
        self._counter += 1
        incident_id = f"INC-2026-{self._counter:03d}"
        now = time.time()
        now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        classification = classify_incident(
            action=action,
            resource=target,
            decision=decision,
            risk_level=risk_level,
            reasons=reasons,
            policy_ids=policy_ids,
            taint_level=taint_level,
            params=params,
        )

        notification_status = "PENDING"
        incident = Incident(
            id=incident_id,
            timestamp=now,
            timestamp_iso=now_iso,
            agent=agent,
            task=task,
            action=action,
            target=target,
            risk_level=risk_level,
            decision=decision,
            sector=classification["sector"],
            problem_title=classification["problem_title"],
            problem_summary=classification["problem_summary"],
            detailed_analysis=classification["detailed_analysis"],
            potential_effects=classification["potential_effects"],
            recommended_solution=classification["recommended_solution"],
            reason_trace=reasons or [],
            provenance=taint_level,
            policy_triggered=policy_ids or [],
            status="OPEN",
            notification_status=notification_status,
            action_hash=action_hash,
            attribution=attribution,
        )

        # Trigger automatic notification for HIGH or CRITICAL severity
        incident_data = incident.model_dump() if hasattr(incident, "model_dump") else incident.dict()
        if auto_notify and risk_level.upper() in ("CRITICAL", "HIGH"):
            sent, msg = send_incident_alert(incident_data, settings.DEFAULT_NOTIFICATION_EMAIL)
            incident.notification_status = "SENT" if sent else ("NOT_CONFIGURED" if "DEV" in msg else "FAILED")
        else:
            incident.notification_status = "NOT_REQUIRED" if risk_level.upper() in ("LOW", "INFO") else "PENDING"

        self._incidents[incident_id] = incident
        return incident

    def list_incidents(
        self,
        severity: Optional[str] = None,
        sector: Optional[str] = None,
        decision: Optional[str] = None,
        agent: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[Incident]:
        """Lists incidents with rich filtering and keyword search."""
        items = list(self._incidents.values())

        if severity and severity.upper() != "ALL":
            items = [i for i in items if i.risk_level.upper() == severity.upper()]

        if sector and sector.upper() != "ALL":
            items = [i for i in items if sector.lower() in i.sector.lower()]

        if decision and decision.upper() != "ALL":
            items = [i for i in items if i.decision.upper() == decision.upper()]

        if agent and agent.upper() != "ALL":
            items = [i for i in items if i.agent.lower() == agent.lower()]

        if status and status.upper() != "ALL":
            items = [i for i in items if i.status.upper() == status.upper()]

        if search:
            q = search.lower().strip()
            items = [
                i
                for i in items
                if (
                    q in i.id.lower()
                    or q in i.problem_title.lower()
                    or q in i.agent.lower()
                    or q in i.action.lower()
                    or q in i.target.lower()
                    or q in i.problem_summary.lower()
                    or q in i.sector.lower()
                )
            ]

        # Sort descending by timestamp
        return sorted(items, key=lambda x: x.timestamp, reverse=True)

    def get_incident(self, incident_id: str) -> Optional[Incident]:
        """Retrieves a single incident by ID."""
        return self._incidents.get(incident_id)

    def update_status(self, incident_id: str, new_status: str) -> Optional[Incident]:
        """Updates the status of an incident (e.g. OPEN, INVESTIGATING, RESOLVED, CONTAINED)."""
        incident = self._incidents.get(incident_id)
        if not incident:
            return None
        incident.status = new_status.upper()
        return incident

    def share_incident_report(self, incident_id: str, recipient_email: str) -> Tuple[bool, str]:
        """Dispatches an incident report to any specified valid email address."""
        incident = self._incidents.get(incident_id)
        if not incident:
            return False, f"Incident '{incident_id}' not found."

        recipient_email = recipient_email.strip()
        if not validate_email_address(recipient_email):
            return False, "Invalid recipient email address format."

        # Send via email service
        incident_data = incident.model_dump() if hasattr(incident, "model_dump") else incident.dict()
        sent, msg = send_incident_alert(incident_data, recipient_email=recipient_email)

        # Log to audit chain if available
        if self.audit_chain:
            try:
                self.audit_chain.append_decision(
                    agent_id="system_console",
                    task_id="incident_reporting",
                    action_type="SHARE_SECURITY_REPORT",
                    resource=recipient_email,
                    action_hash=incident.action_hash or "0" * 64,
                    taint_level="SYSTEM",
                    risk_level="INFO",
                    decision="ALLOW",
                    reasons=[f"Shared report {incident_id} to {recipient_email}: {msg}"],
                    policy_ids=["AUDIT-REPORT-SHARE"],
                    latency_ms=0.5,
                )
            except Exception:
                pass

        if sent:
            return True, f"Security incident report successfully dispatched to {recipient_email}."
        else:
            return False, msg

    def get_stats(self) -> IncidentStatsResponse:
        """Computes security incident metrics and sector breakdown."""
        incidents = list(self._incidents.values())
        total = len(incidents)
        open_count = sum(1 for i in incidents if i.status == "OPEN")
        crit_count = sum(1 for i in incidents if i.risk_level.upper() == "CRITICAL")
        high_count = sum(1 for i in incidents if i.risk_level.upper() == "HIGH")
        med_count = sum(1 for i in incidents if i.risk_level.upper() == "MEDIUM")
        low_count = sum(1 for i in incidents if i.risk_level.upper() in ("LOW", "INFO"))

        # Posture
        if crit_count > 0:
            posture = "Critical"
        elif open_count > 0 or high_count > 0:
            posture = "Warning"
        else:
            posture = "Protected"

        # Threat distribution
        threats = {
            "Prompt Injection": 0,
            "Secret Access": 0,
            "Database": 0,
            "Exfiltration": 0,
            "Approval": 0,
            "Audit": 0,
            "Identity Misuse": 0,
        }
        for inc in incidents:
            sec = inc.sector.upper()
            act = inc.action.upper()
            title = inc.problem_title.lower()
            if "IDENTITY & INSIDER" in sec:
                threats["Identity Misuse"] += 1
            elif "LLM" in sec or "DOCUMENT" in sec or "injection" in title:
                threats["Prompt Injection"] += 1
            elif "SECRET" in sec or "CREDENTIAL" in sec or "SECRET" in act:
                threats["Secret Access"] += 1
            elif "DATABASE" in sec or "DB_" in act:
                threats["Database"] += 1
            elif "NETWORK" in sec or "EXFILTRATION" in sec or "SEND" in act:
                threats["Exfiltration"] += 1
            elif "APPROVAL" in sec or "HASH_MISMATCH" in act:
                threats["Approval"] += 1
            elif "AUDIT" in sec or "COMPLIANCE" in sec:
                threats["Audit"] += 1
            else:
                threats["Prompt Injection"] += 1

        # Incidents by sector
        by_sector: Dict[str, int] = {}
        for inc in incidents:
            by_sector[inc.sector] = by_sector.get(inc.sector, 0) + 1

        return IncidentStatsResponse(
            total_incidents=total,
            open_incidents=open_count,
            critical_incidents=crit_count,
            high_incidents=high_count,
            medium_incidents=med_count,
            low_incidents=low_count,
            security_posture=posture,
            threat_distribution=threats,
            incidents_by_sector=by_sector,
        )
