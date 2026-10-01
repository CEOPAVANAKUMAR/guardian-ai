"""Tool definitions for the demo autonomous AI agent.

Implements dual execution paths:
- GUARDIAN_ENABLED=True: Strictly mediated by GuardianAI runtime gateway.
- GUARDIAN_ENABLED=False: Local fake sandbox environment ONLY (never touches real systems).
"""

import os
from pathlib import Path
from typing import Any, Dict, Optional

from shared.constants import ActionType, Decision
from guardian_sdk.client import GuardianSDK
from demo_agent.config import agent_settings

class AgentToolbox:
    def __init__(self, sdk: Optional[GuardianSDK] = None):
        self.sdk = sdk or GuardianSDK(
            base_url=agent_settings.GUARDIAN_URL,
            agent_id=agent_settings.AGENT_ID,
            api_key=agent_settings.AGENT_API_KEY,
        )

    def read_document(self, document_name: str, file_path: Optional[str] = None) -> Dict[str, Any]:
        """Ingests and reads a document. When Guardian is ON, mediated server-side with session taint."""
        resolved_path = file_path or str(agent_settings.DATA_DIR / document_name)

        if agent_settings.GUARDIAN_ENABLED:
            try:
                ingest_res = self.sdk.ingest_document(
                    document_name=document_name,
                    file_path=resolved_path if os.path.exists(resolved_path) else None,
                )
                return {
                    "status": "SUCCESS",
                    "document_name": document_name,
                    "extracted_text": ingest_res.extracted_text,
                    "taint_level": ingest_res.taint_level.value,
                    "guardian_mediated": True,
                }
            except Exception as e:
                return {"status": "ERROR", "error": f"Guardian ingestion failed: {str(e)}"}
        else:
            # Unprotected sandbox read
            content = "[Fake sandbox document content]"
            if os.path.exists(resolved_path):
                try:
                    with open(resolved_path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                except Exception:
                    pass
            return {
                "status": "SUCCESS",
                "document_name": document_name,
                "extracted_text": content,
                "taint_level": "UNMONITORED",
                "guardian_mediated": False,
            }

    def query_database(self, query: str) -> Dict[str, Any]:
        """Queries database records. Mediated by Guardian AST analyzer and read-only connection."""
        if agent_settings.GUARDIAN_ENABLED:
            # 1. Authorize
            auth = self.sdk.authorize(
                action_type=ActionType.DB_READ,
                resource="sales",
                params={"query": query},
            )
            if auth.decision not in (Decision.ALLOW, Decision.ALLOW_WITH_CONSTRAINTS):
                return {
                    "status": "DENIED",
                    "decision": auth.decision.value,
                    "reasons": auth.reasons,
                }

            # 2. Execute via capability token
            exec_res = self.sdk.execute(
                action_type=ActionType.DB_READ,
                resource="sales",
                params={"query": query},
                capability_token=auth.capability_token,
            )
            return {
                "status": "SUCCESS",
                "rows": exec_res.data,
                "rows_affected": exec_res.rows_affected,
            }
        else:
            # Unprotected sandbox simulation
            return {
                "status": "SUCCESS",
                "rows": [{"id": 1, "product": "Sandbox Pro", "amount": 1200.0, "region": "Local"}],
                "guardian_mediated": False,
            }

    def delete_records(self, query: str) -> Dict[str, Any]:
        """Performs deletion. Mediated by Guardian escalation and human approval."""
        if agent_settings.GUARDIAN_ENABLED:
            auth = self.sdk.authorize(
                action_type=ActionType.DB_DELETE,
                resource="customers",
                params={"query": query},
            )
            if auth.decision == Decision.ESCALATE:
                return {
                    "status": "ESCALATED",
                    "approval_id": auth.approval_id,
                    "impact_preview": auth.impact_preview.dict() if auth.impact_preview else None,
                    "message": "Action requires human approval before execution can proceed.",
                }
            elif auth.decision == Decision.DENY:
                return {
                    "status": "DENIED",
                    "reasons": auth.reasons,
                }
            elif auth.capability_token:
                exec_res = self.sdk.execute(
                    action_type=ActionType.DB_DELETE,
                    resource="customers",
                    params={"query": query},
                    capability_token=auth.capability_token,
                )
                return {"status": "SUCCESS", "rows_affected": exec_res.rows_affected}
            return {"status": "BLOCKED", "decision": auth.decision.value}
        else:
            # Fake sandbox deletion
            return {
                "status": "SUCCESS",
                "message": "Fake sandbox simulated 10 rows deleted.",
                "guardian_mediated": False,
            }

    def read_secret(self, secret_name: str = "DEMO_API_KEY") -> Dict[str, Any]:
        """Attempts to access credentials or environment secrets."""
        if agent_settings.GUARDIAN_ENABLED:
            auth = self.sdk.authorize(
                action_type=ActionType.READ_SECRET,
                resource=secret_name,
                params={},
            )
            if auth.decision != Decision.ALLOW:
                return {
                    "status": "DENIED",
                    "decision": auth.decision.value,
                    "reasons": auth.reasons,
                    "risk_level": auth.risk_level.value,
                }

            exec_res = self.sdk.execute(
                action_type=ActionType.READ_SECRET,
                resource=secret_name,
                params={},
                capability_token=auth.capability_token,
            )
            return {"status": "SUCCESS", "data": exec_res.data}
        else:
            # Unprotected sandbox: Leaks simulated local fake secret
            fake_env = os.getenv("DEMO_API_KEY", "GUARDIAN_FAKE_SECRET_12345")
            return {
                "status": "EXPLOITED",
                "secret": fake_env,
                "warning": "CRITICAL: Secret accessed directly in unprotected sandbox mode!",
                "guardian_mediated": False,
            }

    def send_message(self, recipient: str, message: str) -> Dict[str, Any]:
        """Attempts external network transmission."""
        if agent_settings.GUARDIAN_ENABLED:
            auth = self.sdk.authorize(
                action_type=ActionType.EXTERNAL_SEND,
                resource=recipient,
                params={"message": message},
            )
            if auth.decision != Decision.ALLOW:
                return {
                    "status": "DENIED",
                    "decision": auth.decision.value,
                    "reasons": auth.reasons,
                }
            return {"status": "SUCCESS"}
        else:
            # Sandbox simulated send
            return {
                "status": "EXPLOITED",
                "recipient": recipient,
                "message": message,
                "guardian_mediated": False,
            }
