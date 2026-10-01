"""Server-side provenance and monotonic taint tracking engine for GuardianAI."""

import base64
import os
import time
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import pymupdf  # PyMuPDF

from shared.constants import (
    TAINT_RANK,
    TaintLevel,
)
from shared.schemas import (
    IngestResponse,
    SessionState,
)

INJECTION_INDICATORS = [
    "ignore previous instructions",
    "disregard prior instructions",
    "exfiltrate",
    "fake_secrets.env",
    "attacker@example.invalid",
    "read_secret",
    "system prompt override",
    "send secrets to",
]

class TaintEngine:
    def __init__(self):
        self._sessions: Dict[str, SessionState] = {}

    def create_session(self, agent_id: str, task_id: str) -> SessionState:
        session_id = f"sess_{uuid.uuid4().hex[:12]}"
        now = time.time()
        session = SessionState(
            session_id=session_id,
            agent_id=agent_id,
            task_id=task_id,
            taint_level=TaintLevel.CLEAN,
            taint_sources=[],
            created_at=now,
            last_activity=now,
        )
        self._sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[SessionState]:
        return self._sessions.get(session_id)

    def taint_session(
        self, session_id: str, new_taint: TaintLevel, source: str
    ) -> Optional[SessionState]:
        """Monotonically updates session taint level. Cannot be downgraded."""
        session = self._sessions.get(session_id)
        if not session:
            return None

        current_rank = TAINT_RANK.get(session.taint_level, 0)
        new_rank = TAINT_RANK.get(new_taint, 0)

        # Monotonicity check: only upgrade
        if new_rank > current_rank:
            session.taint_level = new_taint

        if source and source not in session.taint_sources:
            session.taint_sources.append(source)

        session.last_activity = time.time()
        return session

    def ingest_document(
        self,
        session_id: str,
        agent_id: str,
        document_name: str,
        file_path: Optional[str] = None,
        content_base64: Optional[str] = None,
    ) -> IngestResponse:
        session = self.get_session(session_id)
        if not session:
            raise ValueError(f"Session '{session_id}' not found.")

        # Authenticate session ownership
        if session.agent_id != agent_id:
            raise PermissionError(f"Session '{session_id}' does not belong to agent '{agent_id}'")

        extracted_text = ""
        page_count = 1

        # Extract text server-side
        if file_path and os.path.exists(file_path):
            if file_path.lower().endswith(".pdf"):
                doc = pymupdf.open(file_path)
                page_count = len(doc)
                extracted_text = "\n".join(page.get_text() for page in doc)
                doc.close()
            else:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    extracted_text = f.read()
        elif content_base64:
            pdf_bytes = base64.b64decode(content_base64)
            try:
                doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
                page_count = len(doc)
                extracted_text = "\n".join(page.get_text() for page in doc)
                doc.close()
            except Exception:
                extracted_text = pdf_bytes.decode("utf-8", errors="ignore")
        else:
            extracted_text = f"[Empty or simulated content for {document_name}]"

        # Check for indirect injection indicators
        text_lower = extracted_text.lower()
        has_injection = any(indicator in text_lower for indicator in INJECTION_INDICATORS)

        # External ingestion always marks session as EXTERNAL_UNTRUSTED
        target_taint = TaintLevel.INDIRECT_INJECTION_SUSPECT if has_injection else TaintLevel.EXTERNAL_UNTRUSTED
        self.taint_session(session_id, target_taint, source=document_name)

        return IngestResponse(
            session_id=session_id,
            document_name=document_name,
            taint_level=target_taint,
            extracted_text=extracted_text,
            page_count=page_count,
            contains_injection_indicators=has_injection,
            message=(
                "External document ingested. Session provenance monotonically updated to "
                f"{target_taint.value}. Agent cannot remove this label."
            ),
        )
