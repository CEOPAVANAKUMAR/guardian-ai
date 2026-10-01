"""Human approval workflow endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from shared.schemas import ApprovalItem, ApprovalDecisionRequest
from shared.constants import ApprovalStatus
from backend.core.container import get_container, ServiceContainer

router = APIRouter(prefix="/approvals", tags=["Approvals"])

@router.get("", response_model=List[ApprovalItem])
def list_approvals(
    status: Optional[ApprovalStatus] = None,
    container: ServiceContainer = Depends(get_container),
):
    return container.approval_service.list_approvals(status=status)

@router.get("/{approval_id}", response_model=ApprovalItem)
def get_approval(
    approval_id: str,
    container: ServiceContainer = Depends(get_container),
):
    item = container.approval_service.get_approval(approval_id)
    if not item:
        raise HTTPException(status_code=404, detail="Approval request not found")
    return item

@router.post("/{approval_id}/approve")
def approve_request(
    approval_id: str,
    body: Optional[ApprovalDecisionRequest] = None,
    container: ServiceContainer = Depends(get_container),
):
    override_hash = body.override_action_hash if body else None
    notes = body.notes if body else None

    success, token, err = container.approval_service.approve(
        approval_id=approval_id,
        override_action_hash=override_hash,
        notes=notes,
    )
    if not success:
        raise HTTPException(status_code=400, detail=err)

    return {
        "status": "APPROVED",
        "approval_id": approval_id,
        "capability_token": token,
        "message": "Action hash verified. Signed single-use capability token issued.",
    }

@router.post("/{approval_id}/reject")
def reject_request(
    approval_id: str,
    body: Optional[ApprovalDecisionRequest] = None,
    container: ServiceContainer = Depends(get_container),
):
    notes = body.notes if body else None
    success, err = container.approval_service.reject(approval_id=approval_id, notes=notes)
    if not success:
        raise HTTPException(status_code=400, detail=err)

    return {
        "status": "REJECTED",
        "approval_id": approval_id,
        "message": "Action authorization rejected by human reviewer.",
    }
