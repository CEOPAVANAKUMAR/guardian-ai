"""Pydantic schemas and canonical hashing models for GuardianAI."""

import hashlib
import json
import time
import uuid
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from shared.constants import (
    ActionType,
    ApprovalStatus,
    Decision,
    RiskLevel,
    TaintLevel,
)

def compute_action_hash(action_type: str, resource: str, params: Dict[str, Any]) -> str:
    """Computes a deterministic SHA256 hash of canonical action representation."""
    canonical_obj = {
        "action_type": str(action_type).strip(),
        "resource": str(resource).strip(),
        "params": params or {},
    }
    canonical_json = json.dumps(canonical_obj, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()

class ActionRequest(BaseModel):
    agent_id: str = Field(..., description="Authenticated agent ID")
    session_id: str = Field(..., description="Active session ID")
    task_id: str = Field(..., description="Associated task ID")
    action_type: ActionType = Field(..., description="Type of action requested")
    resource: str = Field(..., description="Target resource or entity")
    params: Dict[str, Any] = Field(default_factory=dict, description="Parameters e.g. SQL query, payload")
    reasoning: Optional[str] = Field(default=None, description="Agent's generated reasoning (untrusted)")

    def get_action_hash(self) -> str:
        return compute_action_hash(self.action_type.value, self.resource, self.params)

class TaskManifestCreate(BaseModel):
    task_id: str = Field(default_factory=lambda: f"task_{uuid.uuid4().hex[:8]}")
    agent_id: str
    description: str
    allowed_actions: List[ActionType] = Field(default_factory=list)
    allowed_resources: List[str] = Field(default_factory=list)
    denied_resources: List[str] = Field(default_factory=list)
    max_records_affected: int = 50
    can_read_secrets: bool = False
    can_send_external: bool = False

class TaskManifest(TaskManifestCreate):
    created_at: float = Field(default_factory=time.time)

class SessionCreate(BaseModel):
    agent_id: str
    task_id: str

class SessionState(BaseModel):
    session_id: str
    agent_id: str
    task_id: str
    taint_level: TaintLevel = TaintLevel.CLEAN
    taint_sources: List[str] = Field(default_factory=list)
    created_at: float = Field(default_factory=time.time)
    last_activity: float = Field(default_factory=time.time)

class IngestRequest(BaseModel):
    session_id: str
    agent_id: str
    document_name: str
    file_path: Optional[str] = None
    content_base64: Optional[str] = None

class IngestResponse(BaseModel):
    session_id: str
    document_name: str
    taint_level: TaintLevel
    extracted_text: str
    page_count: int
    contains_injection_indicators: bool
    message: str

class ImpactPreview(BaseModel):
    estimated_affected_records: int = 0
    impact_severity: RiskLevel = RiskLevel.LOW
    description: str = ""
    safe_preview_query: Optional[str] = None

class AuthorizationDecisionResponse(BaseModel):
    decision: Decision
    risk_level: RiskLevel
    action_hash: str
    reasons: List[str] = Field(default_factory=list)
    policy_ids: List[str] = Field(default_factory=list)
    constraints: Optional[Dict[str, Any]] = None
    capability_token: Optional[str] = None
    approval_id: Optional[str] = None
    impact_preview: Optional[ImpactPreview] = None
    latency_ms: float = 0.0
    audit_id: Optional[str] = None

class CapabilityTokenPayload(BaseModel):
    action_hash: str
    agent_id: str
    session_id: str
    decision: Decision
    constraints: Dict[str, Any] = Field(default_factory=dict)
    expiry: float
    nonce: str
    signature: str

class ExecuteRequest(BaseModel):
    agent_id: str
    session_id: str
    action_type: ActionType
    resource: str
    params: Dict[str, Any] = Field(default_factory=dict)
    capability_token: str

class ExecuteResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    rows_affected: int = 0
    executed_at: float = Field(default_factory=time.time)
    action_hash: str

class ApprovalItem(BaseModel):
    id: str
    agent_id: str
    session_id: str
    task_id: str
    action_type: ActionType
    resource: str
    params: Dict[str, Any]
    action_hash: str
    risk_level: RiskLevel
    impact_preview: Optional[ImpactPreview] = None
    reason: str
    status: ApprovalStatus = ApprovalStatus.PENDING
    created_at: float = Field(default_factory=time.time)
    expires_at: float
    approved_action_hash: Optional[str] = None
    capability_token: Optional[str] = None

class ApprovalDecisionRequest(BaseModel):
    notes: Optional[str] = None
    override_action_hash: Optional[str] = None  # To test hash mismatch verification

class AuditRecordSchema(BaseModel):
    id: str
    timestamp: float
    agent_id: str
    task_id: str
    action_type: str
    resource: str
    action_hash: str
    taint_level: str
    risk_level: str
    decision: str
    reasons: List[str]
    policy_ids: List[str]
    latency_ms: float
    prev_hash: str
    current_hash: str
    signature: str

class AuditVerifyResponse(BaseModel):
    is_valid: bool
    total_records: int
    invalid_index: Optional[int] = None
    invalid_record_id: Optional[str] = None
    details: str

class SystemStats(BaseModel):
    protected_agents_count: int
    actions_evaluated: int
    threats_blocked: int
    pending_approvals: int
    avg_authorization_latency_ms: float
    guardian_enabled: bool = True
    open_incidents: int = 0
    critical_incidents: int = 0
    security_posture: str = "Protected"
    threat_distribution: Dict[str, int] = Field(default_factory=dict)
    incidents_by_sector: Dict[str, int] = Field(default_factory=dict)
