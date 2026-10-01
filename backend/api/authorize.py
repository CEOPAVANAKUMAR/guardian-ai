"""Runtime authorization endpoint."""

from fastapi import APIRouter, Header, Depends
from typing import Optional
from shared.schemas import ActionRequest, AuthorizationDecisionResponse
from backend.core.container import get_container, ServiceContainer

router = APIRouter(prefix="/authorize", tags=["Authorization"])

@router.post("", response_model=AuthorizationDecisionResponse)
def authorize_action(
    request: ActionRequest,
    x_agent_key: Optional[str] = Header(None, alias="X-Agent-Key"),
    container: ServiceContainer = Depends(get_container),
):
    return container.pipeline.authorize(request, auth_token=x_agent_key)
