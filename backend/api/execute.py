"""Protected tool execution endpoint."""

import time
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from shared.constants import ActionType
from shared.schemas import ExecuteRequest, ExecuteResponse, compute_action_hash
from backend.adapters.output_filter import OutputFilter
from backend.core.container import get_container, ServiceContainer

router = APIRouter(tags=["Execution"])

@router.post("/execute", response_model=ExecuteResponse)
def execute_action(
    payload: ExecuteRequest,
    container: ServiceContainer = Depends(get_container),
):
    action_hash = compute_action_hash(
        action_type=payload.action_type.value,
        resource=payload.resource,
        params=payload.params,
    )

    # 1. Verify and consume capability token (strictly single-use and bound to exact action hash)
    valid, token_data, err_msg = container.token_service.verify_and_consume_token(
        token=payload.capability_token,
        expected_action_hash=action_hash,
        expected_agent_id=payload.agent_id,
        expected_session_id=payload.session_id,
    )

    if not valid:
        raise HTTPException(
            status_code=403,
            detail=f"Execution blocked: {err_msg}",
        )

    # 2. Execute protected action
    try:
        if payload.action_type == ActionType.DB_READ:
            query = payload.params.get("query", "")
            raw_data = container.db.execute_read_query(query)
            sanitized_data = OutputFilter.sanitize(raw_data)
            return ExecuteResponse(
                success=True,
                data=sanitized_data,
                rows_affected=len(sanitized_data),
                action_hash=action_hash,
            )

        elif payload.action_type in (ActionType.DB_WRITE, ActionType.DB_DELETE):
            query = payload.params.get("query", "")
            success, affected, err = container.db.execute_write_query(query)
            if not success:
                return ExecuteResponse(
                    success=False,
                    error=err,
                    rows_affected=0,
                    action_hash=action_hash,
                )
            return ExecuteResponse(
                success=True,
                data={"message": f"Successfully executed mutation. Rows affected: {affected}"},
                rows_affected=affected,
                action_hash=action_hash,
            )

        elif payload.action_type == ActionType.READ_SECRET:
            # Under protected execution, only allowed if token was legitimately issued
            return ExecuteResponse(
                success=True,
                data={"secret": OutputFilter.sanitize("DEMO_SECRET_VAL")},
                rows_affected=1,
                action_hash=action_hash,
            )

        elif payload.action_type == ActionType.EXTERNAL_SEND:
            return ExecuteResponse(
                success=True,
                data={"sent": True, "recipient": payload.resource},
                rows_affected=1,
                action_hash=action_hash,
            )

        raise HTTPException(status_code=400, detail=f"Unsupported action type: {payload.action_type}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Protected execution fault: {str(e)}")

@router.get("/actions", response_model=List[Dict[str, Any]])
def list_evaluated_actions(
    container: ServiceContainer = Depends(get_container),
):
    return container.audit_chain.get_records(limit=100)
