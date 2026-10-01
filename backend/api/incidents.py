"""API endpoints for the Security Incident Center."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from backend.core.container import get_container, ServiceContainer
from backend.incidents.models import (
    Incident,
    IncidentShareRequest,
    IncidentStatsResponse,
    IncidentStatusUpdateRequest,
)

router = APIRouter(prefix="/incidents", tags=["Security Incidents"])


@router.get("", response_model=List[Incident])
def list_incidents(
    severity: Optional[str] = Query(None, description="Filter by risk severity (CRITICAL, HIGH, etc.)"),
    sector: Optional[str] = Query(None, description="Filter by security sector"),
    decision: Optional[str] = Query(None, description="Filter by Guardian decision"),
    agent: Optional[str] = Query(None, description="Filter by agent identifier"),
    status: Optional[str] = Query(None, description="Filter by status (OPEN, INVESTIGATING, RESOLVED)"),
    search: Optional[str] = Query(None, description="Search query across ID, action, target, title"),
    container: ServiceContainer = Depends(get_container),
):
    """Lists security incidents with filtering and full-text keyword search."""
    return container.incident_service.list_incidents(
        severity=severity,
        sector=sector,
        decision=decision,
        agent=agent,
        status=status,
        search=search,
    )


@router.get("/stats", response_model=IncidentStatsResponse)
def get_incident_stats(
    container: ServiceContainer = Depends(get_container),
):
    """Returns aggregated security posture, threat distribution, and sector statistics."""
    return container.incident_service.get_stats()


@router.get("/{incident_id}", response_model=Incident)
def get_incident_details(
    incident_id: str,
    container: ServiceContainer = Depends(get_container),
):
    """Retrieves full forensic details for a specific incident."""
    incident = container.incident_service.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")
    return incident


@router.post("/{incident_id}/status", response_model=Incident)
def update_incident_status(
    incident_id: str,
    payload: IncidentStatusUpdateRequest,
    container: ServiceContainer = Depends(get_container),
):
    """Updates the investigation status of an incident."""
    incident = container.incident_service.update_status(incident_id, payload.status)
    if not incident:
        raise HTTPException(status_code=404, detail=f"Incident '{incident_id}' not found.")
    return incident


@router.post("/{incident_id}/share")
def share_incident_report(
    incident_id: str,
    payload: IncidentShareRequest,
    container: ServiceContainer = Depends(get_container),
):
    """Dispatches a comprehensive security incident report to any specified recipient email address."""
    success, message = container.incident_service.share_incident_report(
        incident_id=incident_id,
        recipient_email=payload.recipient_email,
    )
    if not success:
        raise HTTPException(status_code=400, detail=message)
    return {
        "status": "SENT",
        "incident_id": incident_id,
        "recipient_email": payload.recipient_email,
        "message": message,
    }
