"""Pydantic models for identity attribution requests and results."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AuthState(BaseModel):
    method: str = Field("password_only", description="passkey | totp | sms | password_only")
    result: str = Field("not_attempted", description="passed | failed | not_attempted")
    credential_owner: Optional[str] = Field(
        None, description="Account that owns the credential that passed (defaults to claimed account)"
    )


class Observed(BaseModel):
    datasets: List[str] = []
    tools: List[str] = []
    calls_per_min: float = 0.0


class DataAccess(BaseModel):
    dataset: str
    action: str = "READ"  # READ | EXPORT | DOWNLOAD
    records: int = 0
    destination_kind: str = "none"  # none | internal | external
    destination_name: Optional[str] = None
    declared_purpose: Optional[str] = None


class SessionContext(BaseModel):
    session_id: Optional[str] = None
    claimed_account: str
    device_id: str
    network_id: str
    login_at: str = Field(..., description="Local ISO timestamp, e.g. 2026-10-01T09:02:11")
    access_at: str = Field(..., description="Local ISO timestamp of the evaluated data action")
    auth: AuthState = AuthState()
    step_up_attempted: bool = False
    observed: Observed = Observed()
    data_access: DataAccess


class EvaluateRequest(BaseModel):
    context: SessionContext
    scenario_id: Optional[str] = None
    enforce: bool = True


class StepUpRequest(BaseModel):
    result: str = Field(..., description="passed | failed")


class Signal(BaseModel):
    id: str
    category: str  # IDENTITY | BEHAVIOUR | DATA | PURPOSE | ASSURANCE
    label: str
    direction: str  # risk | assurance
    triggered: bool
    points: int = 0
    evidence: str
    contradicts_claimed: bool = False


class TimelineEvent(BaseModel):
    time: str
    source: str  # AUTH | DEVICE | NETWORK | BEHAVIOUR | DATA | GUARDIAN | ENFORCEMENT | AUDIT | INCIDENT
    title: str
    detail: str
    severity: str = "info"  # ok | info | warn | crit


class Attribution(BaseModel):
    claimed_account: Dict[str, Any]
    device_owner: Dict[str, Any]
    verified_operator: Dict[str, Any]
    likely_operator: Dict[str, Any]
    identity_confidence: int
    identity_confidence_label: str
    note: str


class EvaluationResult(BaseModel):
    risk_score: int
    raw_score: int
    risk_level: str
    decision: str  # ALLOW | STEP_UP_VERIFY | BLOCK | BLOCK_REVOKE_INCIDENT
    decision_label: str
    actions: List[str]
    threat_class: str
    attribution: Attribution
    signals: List[Signal]
    rules_fired: List[Dict[str, str]]
    summary: str
    privacy_note: str
