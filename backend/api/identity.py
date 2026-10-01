"""Continuous Identity & Insider Misuse Attribution endpoints."""

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException

from backend.core.container import ServiceContainer, get_container
from backend.identity.models import EvaluateRequest, StepUpRequest
from backend.identity.scenarios import list_scenarios

router = APIRouter(prefix="/identity", tags=["Identity Attribution"])


@router.get("/scenarios")
def get_scenarios() -> List[Dict[str, Any]]:
    """The four built-in demo scenarios."""
    return list_scenarios()


@router.get("/directory")
def get_directory(container: ServiceContainer = Depends(get_container)):
    return container.identity_service.directory()


@router.post("/scenarios/{scenario_id}/run")
def run_scenario(scenario_id: str, container: ServiceContainer = Depends(get_container)):
    try:
        return container.identity_service.run_scenario(scenario_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Unknown identity scenario '{scenario_id}'")


@router.post("/evaluate")
def evaluate_custom(payload: EvaluateRequest, container: ServiceContainer = Depends(get_container)):
    """Evaluate an arbitrary session context with the deterministic rule engine."""
    return container.identity_service.evaluate_context(
        payload.context, scenario_id=payload.scenario_id, enforce=payload.enforce
    )


@router.get("/evaluations")
def list_evaluations(limit: int = 50, container: ServiceContainer = Depends(get_container)):
    return container.identity_service.list_evaluations(limit=limit)


@router.get("/evaluations/{evaluation_id}")
def get_evaluation(evaluation_id: str, container: ServiceContainer = Depends(get_container)):
    rec = container.identity_service.get_evaluation(evaluation_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return rec


@router.post("/evaluations/{evaluation_id}/step-up")
def step_up(evaluation_id: str, payload: StepUpRequest, container: ServiceContainer = Depends(get_container)):
    try:
        return container.identity_service.step_up(evaluation_id, payload.result)
    except KeyError:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.get("/sessions")
def list_sessions(container: ServiceContainer = Depends(get_container)):
    return container.identity_service.list_sessions()
