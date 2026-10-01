"""Audit chain verification helper module."""

from typing import Dict, Any
from backend.audit.chain import AuditChain
from shared.schemas import AuditVerifyResponse

def verify_agent_audit_chain(audit_chain: AuditChain) -> AuditVerifyResponse:
    """Verifies complete cryptographic integrity of the given audit chain."""
    return audit_chain.verify_integrity()
