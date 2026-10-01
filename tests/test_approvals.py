"""Tests for Phase 5: Human approval workflow, impact preview, and action hash tampering."""

import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from shared.constants import ActionType, ApprovalStatus, Decision, RiskLevel, REASON_ACTION_HASH_MISMATCH
from shared.schemas import ActionRequest
from backend.adapters.database import DatabaseAdapter
from backend.approvals.dry_run import DryRunService
from backend.approvals.service import ApprovalService
from backend.approvals.signing import CapabilityTokenService

@pytest.fixture
def approval_system():
    test_db = Path(__file__).parent / "test_approvals.db"
    if test_db.exists():
        test_db.unlink()
    db_adapter = DatabaseAdapter(db_path=str(test_db))
    token_svc = CapabilityTokenService(secret_key="test_approval_secret")
    dry_run = DryRunService(db_adapter)
    appr_svc = ApprovalService(token_service=token_svc, dry_run_service=dry_run)
    yield appr_svc, db_adapter
    if test_db.exists():
        try:
            test_db.unlink()
        except Exception:
            pass

def test_approval_lifecycle_and_impact_preview(approval_system):
    appr_svc, _ = approval_system

    req = ActionRequest(
        agent_id="agent_dba_02",
        session_id="sess_1",
        task_id="task_db_maintenance_002",
        action_type=ActionType.DB_DELETE,
        resource="customers",
        params={"query": "DELETE FROM customers WHERE inactive = 1"},
    )

    # 1. Create approval request
    item = appr_svc.create_approval_request(
        request=req,
        risk_level=RiskLevel.HIGH,
        reason="Scoped database deletion requires human authorization",
    )
    assert item.status == ApprovalStatus.PENDING
    assert item.impact_preview is not None
    assert item.impact_preview.estimated_affected_records > 0

    # 2. Approve request
    ok, token, err = appr_svc.approve(item.id)
    assert ok is True
    assert token is not None
    assert item.status == ApprovalStatus.APPROVED

def test_approval_tampered_action_hash_blocked(approval_system):
    appr_svc, _ = approval_system

    # Original legitimate request
    req = ActionRequest(
        agent_id="agent_dba_02",
        session_id="sess_1",
        task_id="task_db_maintenance_002",
        action_type=ActionType.DB_DELETE,
        resource="customers",
        params={"query": "DELETE FROM customers WHERE id < 10"},
    )
    item = appr_svc.create_approval_request(req, RiskLevel.HIGH, "Delete inactive")

    # Attacker / agent tries to approve or swap for a different destructive action hash:
    tampered_hash = "deadbeef12345678" * 4

    ok, token, err = appr_svc.approve(item.id, override_action_hash=tampered_hash)
    assert ok is False
    assert token is None
    assert REASON_ACTION_HASH_MISMATCH in err
    assert item.status == ApprovalStatus.PENDING, "Item status must not be approved on hash mismatch"

def test_approval_rejection(approval_system):
    appr_svc, _ = approval_system

    req = ActionRequest(
        agent_id="agent_dba_02",
        session_id="sess_1",
        task_id="task_db_maintenance_002",
        action_type=ActionType.DB_DELETE,
        resource="customers",
        params={"query": "DELETE FROM customers WHERE inactive = 1"},
    )
    item = appr_svc.create_approval_request(req, RiskLevel.HIGH, "Delete inactive")

    ok, err = appr_svc.reject(item.id, notes="Rejected due to maintenance window closure")
    assert ok is True
    assert item.status == ApprovalStatus.REJECTED
