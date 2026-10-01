"""Dry-run impact preview calculator for GuardianAI."""

from typing import Dict, Any, Optional
from shared.constants import RiskLevel, ActionType
from shared.schemas import ActionRequest, ImpactPreview
from backend.adapters.database import DatabaseAdapter

class DryRunService:
    def __init__(self, db_adapter: DatabaseAdapter):
        self.db = db_adapter

    def preview_impact(self, request: ActionRequest) -> ImpactPreview:
        if request.action_type in (ActionType.DB_DELETE, ActionType.DB_WRITE):
            query = request.params.get("query", "")
            impact = self.db.calculate_impact_preview(query)
            count = impact.get("estimated_affected_records", 0)

            severity = RiskLevel.LOW
            if count > 500:
                severity = RiskLevel.CRITICAL
            elif count > 50:
                severity = RiskLevel.HIGH
            elif count > 0:
                severity = RiskLevel.MEDIUM

            desc = f"Action targets '{impact.get('target_table', 'database')}' affecting approximately {count} records."
            return ImpactPreview(
                estimated_affected_records=count,
                impact_severity=severity,
                description=desc,
                safe_preview_query=impact.get("safe_preview_query"),
            )

        return ImpactPreview(
            estimated_affected_records=0,
            impact_severity=RiskLevel.LOW,
            description="Non-destructive or read-only action.",
        )
