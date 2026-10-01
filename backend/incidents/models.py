"""Data models and schemas for the Security Incident Center."""

import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class Incident(BaseModel):
    id: str = Field(..., description="Unique incident ID (e.g. INC-2026-001)")
    timestamp: float = Field(default_factory=time.time)
    timestamp_iso: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    )
    agent: str = Field(..., description="Agent identifier")
    task: str = Field(..., description="Task identifier")
    action: str = Field(..., description="Action name or type")
    target: str = Field(..., description="Target resource or entity")
    risk_level: str = Field(..., description="Risk level (CRITICAL, HIGH, MEDIUM, LOW, INFO)")
    decision: str = Field(..., description="GuardianAI decision (DENY, ESCALATE, etc.)")
    sector: str = Field(..., description="Deterministically classified security sector")
    problem_title: str = Field(..., description="Concise problem headline")
    problem_summary: str = Field(..., description="Summary of the incident")
    detailed_analysis: str = Field(..., description="Detailed technical analysis and reason")
    potential_effects: List[str] = Field(default_factory=list, description="All potential organizational impacts")
    recommended_solution: str = Field(..., description="One primary recommended solution")
    reason_trace: List[str] = Field(default_factory=list, description="Reason strings from evaluator")
    provenance: str = Field(default="UNKNOWN", description="Provenance / taint tag")
    policy_triggered: List[str] = Field(default_factory=list, description="Policy IDs triggered")
    status: str = Field(default="OPEN", description="Incident status: OPEN, INVESTIGATING, RESOLVED, CONTAINED")
    notification_status: str = Field(default="PENDING", description="SENT, PENDING, FAILED, NOT_CONFIGURED")
    action_hash: Optional[str] = Field(default=None, description="Cryptographic action hash")
    attribution: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Identity attribution evidence (claimed/device/verified/likely operator) for identity & insider incidents",
    )


class IncidentShareRequest(BaseModel):
    recipient_email: str = Field(..., description="Recipient email address to receive report")


class IncidentStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="New status: OPEN, INVESTIGATING, RESOLVED, CONTAINED")


class IncidentStatsResponse(BaseModel):
    total_incidents: int
    open_incidents: int
    critical_incidents: int
    high_incidents: int
    medium_incidents: int
    low_incidents: int
    security_posture: str  # Protected, Warning, Critical
    threat_distribution: Dict[str, int]
    incidents_by_sector: Dict[str, int]
