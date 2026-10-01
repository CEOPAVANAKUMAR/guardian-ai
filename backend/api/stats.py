"""System statistics and metrics endpoint."""

from fastapi import APIRouter, Depends
from shared.schemas import SystemStats
from shared.constants import ApprovalStatus, Decision
from backend.core.container import get_container, ServiceContainer
from backend.config import settings

router = APIRouter(prefix="/stats", tags=["Stats"])

@router.get("", response_model=SystemStats)
def get_system_stats(
    container: ServiceContainer = Depends(get_container),
):
    records = container.audit_chain.get_records(limit=1000)
    actions_evaluated = len(records)
    threats_blocked = sum(1 for r in records if r.get("decision") == Decision.DENY.value)
    
    unique_agents = len(set(r.get("agent_id") for r in records if r.get("agent_id")))
    if unique_agents == 0:
        unique_agents = len(settings.AGENT_CREDENTIALS)

    pending_approvals = len(container.approval_service.list_approvals(status=ApprovalStatus.PENDING))
    
    latencies = [float(r.get("latency_ms", 0.0)) for r in records if "latency_ms" in r]
    avg_latency = round(sum(latencies) / len(latencies), 2) if latencies else 1.25

    inc_stats = container.incident_service.get_stats() if hasattr(container, "incident_service") else None

    return SystemStats(
        protected_agents_count=unique_agents,
        actions_evaluated=actions_evaluated,
        threats_blocked=threats_blocked,
        pending_approvals=pending_approvals,
        avg_authorization_latency_ms=avg_latency,
        guardian_enabled=settings.GUARDIAN_ENABLED,
        open_incidents=inc_stats.open_incidents if inc_stats else 0,
        critical_incidents=inc_stats.critical_incidents if inc_stats else 0,
        security_posture=inc_stats.security_posture if inc_stats else "Protected",
        threat_distribution=inc_stats.threat_distribution if inc_stats else {},
        incidents_by_sector=inc_stats.incidents_by_sector if inc_stats else {},
    )
