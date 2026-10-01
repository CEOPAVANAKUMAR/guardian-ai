"""Tests for Phase 2: Agent identity authentication, session binding, and manifest protection."""

import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from shared.constants import (
    ActionType,
    Decision,
    RiskLevel,
    REASON_AUTHENTICATION_FAILURE,
)
from shared.schemas import ActionRequest
from backend.adapters.database import DatabaseAdapter
from backend.adapters.sql_analyzer import SQLAnalyzer
from backend.approvals.dry_run import DryRunService
from backend.approvals.service import ApprovalService
from backend.approvals.signing import CapabilityTokenService
from backend.audit.chain import AuditChain
from backend.core.pipeline import AuthorizationPipeline
from backend.core.taint_engine import TaintEngine
from backend.policy.evaluator import PolicyEvaluator
from backend.tasks.manifest_service import ManifestService

@pytest.fixture
def pipeline():
    test_db = Path(__file__).parent / "test_auth_pipeline.db"
    if test_db.exists():
        test_db.unlink()
    db_adapter = DatabaseAdapter(db_path=str(test_db))
    token_svc = CapabilityTokenService(secret_key="test_auth_secret")
    dry_run = DryRunService(db_adapter)
    appr_svc = ApprovalService(token_service=token_svc, dry_run_service=dry_run)
    audit = AuditChain(secret_key="test_audit_key")
    evaluator = PolicyEvaluator()
    manifest_svc = ManifestService()
    taint_eng = TaintEngine()
    sql_ana = SQLAnalyzer()

    pipe = AuthorizationPipeline(
        policy_evaluator=evaluator,
        manifest_service=manifest_svc,
        taint_engine=taint_eng,
        sql_analyzer=sql_ana,
        db_adapter=db_adapter,
        token_service=token_svc,
        approval_service=appr_svc,
        audit_chain=audit,
    )
    yield pipe, taint_eng
    if test_db.exists():
        try:
            test_db.unlink()
        except Exception:
            pass

def test_spoofed_session_agent_rejected(pipeline):
    pipe, taint_eng = pipeline
    # Create legitimate session for agent_analyst_01
    session = taint_eng.create_session("agent_analyst_01", "task_sales_report_001")

    # Attacker tries to hijack the session with a different agent_id
    req = ActionRequest(
        agent_id="agent_malicious_hacker",
        session_id=session.session_id,
        task_id="task_sales_report_001",
        action_type=ActionType.DB_READ,
        resource="sales",
        params={"query": "SELECT * FROM sales"},
    )

    res = pipe.authorize(req)
    assert res.decision == Decision.DENY
    assert res.risk_level == RiskLevel.CRITICAL
    assert any(REASON_AUTHENTICATION_FAILURE in r for r in res.reasons)

def test_wrong_agent_task_rejected(pipeline):
    pipe, taint_eng = pipeline
    # task_sales_report_001 is assigned to agent_analyst_01
    # agent_dba_02 tries to run task_sales_report_001
    session = taint_eng.create_session("agent_dba_02", "task_sales_report_001")

    req = ActionRequest(
        agent_id="agent_dba_02",
        session_id=session.session_id,
        task_id="task_sales_report_001",
        action_type=ActionType.DB_READ,
        resource="sales",
        params={"query": "SELECT * FROM sales"},
    )

    res = pipe.authorize(req)
    assert res.decision == Decision.DENY
    assert res.risk_level == RiskLevel.CRITICAL
    assert any("assigned to" in r for r in res.reasons)

def test_nonexistent_session_rejected(pipeline):
    pipe, _ = pipeline
    req = ActionRequest(
        agent_id="agent_analyst_01",
        session_id="non_existent_session_id",
        task_id="task_sales_report_001",
        action_type=ActionType.DB_READ,
        resource="sales",
        params={"query": "SELECT * FROM sales"},
    )

    res = pipe.authorize(req)
    assert res.decision == Decision.DENY
    assert any("not found" in r for r in res.reasons)
