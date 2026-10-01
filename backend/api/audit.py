"""Tamper-evident audit chain endpoints."""

from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from shared.schemas import AuditVerifyResponse
from backend.core.container import get_container, ServiceContainer

router = APIRouter(prefix="/audit", tags=["Audit"])

@router.get("", response_model=List[Dict[str, Any]])
def get_audit_trail(
    limit: int = 100,
    container: ServiceContainer = Depends(get_container),
):
    return container.audit_chain.get_records(limit=limit)

@router.get("/verify", response_model=AuditVerifyResponse)
def verify_audit_integrity(
    container: ServiceContainer = Depends(get_container),
):
    result = container.audit_chain.verify_integrity()
    if not result.is_valid and container.incident_service:
        container.incident_service.create_incident(
            agent="audit_verifier",
            task="tamper_evident_verification",
            action="AUDIT_CHAIN_FAILURE",
            target=f"record_{result.invalid_record_id or result.invalid_index}",
            risk_level="CRITICAL",
            decision="DENY",
            reasons=[
                "HMAC cryptographic signature mismatch detected during audit chain verification",
                result.details,
            ],
            policy_ids=["AUDIT-CHAIN-FAILURE"],
            taint_level="CORRUPTED",
            action_hash="0" * 64,
        )
    return result
