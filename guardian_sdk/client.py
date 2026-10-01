"""GuardianAI Python SDK Client.

Provides a clean developer-friendly interface to GuardianAI runtime authorization gateway.
"""

from typing import Any, Dict, List, Optional
import httpx
from shared.constants import ActionType, Decision
from shared.schemas import (
    ActionRequest,
    AuthorizationDecisionResponse,
    ExecuteRequest,
    ExecuteResponse,
    IngestRequest,
    IngestResponse,
    SessionCreate,
    SessionState,
    AuditVerifyResponse,
)

class GuardianSDK:
    def __init__(
        self,
        base_url: str = "http://127.0.0.1:8000/api/v1",
        agent_id: str = "agent_analyst_01",
        api_key: Optional[str] = "secret_key_analyst_001",
        timeout: float = 10.0,
    ):
        self.base_url = base_url.rstrip("/")
        self.agent_id = agent_id
        self.api_key = api_key
        self.timeout = timeout
        self.active_session_id: Optional[str] = None
        self.active_task_id: Optional[str] = None

    def _get_headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["X-Agent-Key"] = self.api_key
        return headers

    def create_session(self, task_id: str) -> SessionState:
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.post(
                f"{self.base_url}/sessions",
                headers=self._get_headers(),
                json={"agent_id": self.agent_id, "task_id": task_id},
            )
            resp.raise_for_status()
            data = resp.json()
            session = SessionState(**data)
            self.active_session_id = session.session_id
            self.active_task_id = task_id
            return session

    def ingest_document(
        self,
        document_name: str,
        file_path: Optional[str] = None,
        content_base64: Optional[str] = None,
    ) -> IngestResponse:
        if not self.active_session_id:
            raise RuntimeError("No active session. Call create_session(task_id) first.")

        with httpx.Client(timeout=self.timeout) as client:
            resp = client.post(
                f"{self.base_url}/ingest",
                headers=self._get_headers(),
                json={
                    "session_id": self.active_session_id,
                    "agent_id": self.agent_id,
                    "document_name": document_name,
                    "file_path": file_path,
                    "content_base64": content_base64,
                },
            )
            resp.raise_for_status()
            return IngestResponse(**resp.json())

    def authorize(
        self,
        action_type: ActionType,
        resource: str,
        params: Optional[Dict[str, Any]] = None,
        reasoning: Optional[str] = None,
    ) -> AuthorizationDecisionResponse:
        if not self.active_session_id or not self.active_task_id:
            raise RuntimeError("No active session. Call create_session(task_id) first.")

        req_payload = {
            "agent_id": self.agent_id,
            "session_id": self.active_session_id,
            "task_id": self.active_task_id,
            "action_type": action_type.value if hasattr(action_type, "value") else str(action_type),
            "resource": resource,
            "params": params or {},
            "reasoning": reasoning,
        }

        with httpx.Client(timeout=self.timeout) as client:
            resp = client.post(
                f"{self.base_url}/authorize",
                headers=self._get_headers(),
                json=req_payload,
            )
            resp.raise_for_status()
            return AuthorizationDecisionResponse(**resp.json())

    def execute(
        self,
        action_type: ActionType,
        resource: str,
        params: Dict[str, Any],
        capability_token: str,
    ) -> ExecuteResponse:
        if not self.active_session_id:
            raise RuntimeError("No active session.")

        payload = {
            "agent_id": self.agent_id,
            "session_id": self.active_session_id,
            "action_type": action_type.value if hasattr(action_type, "value") else str(action_type),
            "resource": resource,
            "params": params,
            "capability_token": capability_token,
        }

        with httpx.Client(timeout=self.timeout) as client:
            resp = client.post(
                f"{self.base_url}/execute",
                headers=self._get_headers(),
                json=payload,
            )
            resp.raise_for_status()
            return ExecuteResponse(**resp.json())

    def verify_audit(self) -> AuditVerifyResponse:
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.get(
                f"{self.base_url}/audit/verify",
                headers=self._get_headers(),
            )
            resp.raise_for_status()
            return AuditVerifyResponse(**resp.json())
