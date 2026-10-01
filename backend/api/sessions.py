"""Session management endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from shared.schemas import SessionCreate, SessionState
from backend.core.container import get_container, ServiceContainer

router = APIRouter(prefix="/sessions", tags=["Sessions"])

@router.post("", response_model=SessionState)
def create_session(
    payload: SessionCreate,
    container: ServiceContainer = Depends(get_container),
):
    manifest = container.manifest_service.get_manifest(payload.task_id)
    if not manifest:
        raise HTTPException(status_code=400, detail=f"Task '{payload.task_id}' does not exist")
    if manifest.agent_id != payload.agent_id:
        raise HTTPException(
            status_code=403,
            detail=f"Task '{payload.task_id}' is assigned to '{manifest.agent_id}', not '{payload.agent_id}'",
        )
    return container.taint_engine.create_session(payload.agent_id, payload.task_id)

@router.get("/{session_id}", response_model=SessionState)
def get_session(
    session_id: str,
    container: ServiceContainer = Depends(get_container),
):
    session = container.taint_engine.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session
