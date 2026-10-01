"""Unit tests for Phase 1: Policy evaluator, monotonic merger, fail-closed, and manifests."""

import pytest
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from shared.constants import (
    ActionType,
    Decision,
    RiskLevel,
    TaintLevel,
    REASON_DEFAULT_DENY,
    REASON_MANIFEST_NO_ACCESS,
    REASON_TAINTED_SESSION,
)
from shared.schemas import (
    ActionRequest,
    SessionState,
    TaskManifest,
    TaskManifestCreate,
)
from backend.core.decision_merger import DecisionMerger
from backend.core.fail_closed import fail_closed_authorization
from backend.policy.evaluator import PolicyEvaluator
from backend.tasks.manifest_service import ManifestService

def test_decision_merger_monotonic_order():
    # ALLOW < ALLOW_WITH_CONSTRAINTS < ESCALATE < DENY
    assert DecisionMerger.merge([Decision.ALLOW]) == Decision.ALLOW
    assert DecisionMerger.merge([Decision.ALLOW, Decision.ALLOW_WITH_CONSTRAINTS]) == Decision.ALLOW_WITH_CONSTRAINTS
    assert DecisionMerger.merge([Decision.ALLOW, Decision.ESCALATE]) == Decision.ESCALATE
    assert DecisionMerger.merge([Decision.ALLOW_WITH_CONSTRAINTS, Decision.ESCALATE]) == Decision.ESCALATE
    assert DecisionMerger.merge([Decision.ALLOW, Decision.ALLOW_WITH_CONSTRAINTS, Decision.ESCALATE, Decision.DENY]) == Decision.DENY

def test_decision_merger_fail_closed_on_empty_and_unknown():
    assert DecisionMerger.merge([]) == Decision.DENY
    # Non-enum or invalid input
    assert DecisionMerger.merge(["INVALID_DECISION"]) == Decision.DENY

def test_fail_closed_decorator():
    @fail_closed_authorization
    def broken_func(request, manifest, session):
        raise RuntimeError("Simulated crash inside policy engine")

    req = ActionRequest(
        agent_id="agent_1",
        session_id="sess_1",
        task_id="task_1",
        action_type=ActionType.DB_READ,
        resource="sales",
        params={},
    )
    manifest = TaskManifest(
        task_id="task_1",
        agent_id="agent_1",
        description="test",
        allowed_actions=[ActionType.DB_READ],
        allowed_resources=["sales"],
    )
    session = SessionState(session_id="sess_1", agent_id="agent_1", task_id="task_1")

    res = broken_func(req, manifest, session)
    assert res.decision == Decision.DENY
    assert res.risk_level == RiskLevel.CRITICAL
    assert any("safety fault" in r for r in res.reasons)

def test_policy_evaluator_benign_db_read():
    evaluator = PolicyEvaluator()
    manifest_svc = ManifestService()
    manifest = manifest_svc.get_manifest("task_sales_report_001")
    session = SessionState(session_id="s1", agent_id="agent_analyst_01", task_id="task_sales_report_001")

    req = ActionRequest(
        agent_id="agent_analyst_01",
        session_id="s1",
        task_id="task_sales_report_001",
        action_type=ActionType.DB_READ,
        resource="sales",
        params={"query": "SELECT * FROM sales LIMIT 10"},
    )

    res = evaluator.evaluate(req, manifest, session)
    assert res.decision == Decision.ALLOW_WITH_CONSTRAINTS
    assert res.constraints is not None
    assert res.constraints.get("read_only") is True
    assert res.risk_level == RiskLevel.LOW

def test_policy_evaluator_out_of_scope_resource():
    evaluator = PolicyEvaluator()
    manifest_svc = ManifestService()
    manifest = manifest_svc.get_manifest("task_sales_report_001")
    session = SessionState(session_id="s1", agent_id="agent_analyst_01", task_id="task_sales_report_001")

    # Requesting 'payroll' which is not in allowed_resources
    req = ActionRequest(
        agent_id="agent_analyst_01",
        session_id="s1",
        task_id="task_sales_report_001",
        action_type=ActionType.DB_READ,
        resource="payroll",
        params={"query": "SELECT * FROM payroll"},
    )

    res = evaluator.evaluate(req, manifest, session)
    assert res.decision == Decision.DENY
    assert any("outside the authorized scope" in r for r in res.reasons)

def test_policy_evaluator_secret_access_denied():
    evaluator = PolicyEvaluator()
    manifest_svc = ManifestService()
    manifest = manifest_svc.get_manifest("task_sales_report_001")
    session = SessionState(session_id="s1", agent_id="agent_analyst_01", task_id="task_sales_report_001")

    req = ActionRequest(
        agent_id="agent_analyst_01",
        session_id="s1",
        task_id="task_sales_report_001",
        action_type=ActionType.READ_SECRET,
        resource="fake_secrets.env",
        params={},
    )

    res = evaluator.evaluate(req, manifest, session)
    assert res.decision == Decision.DENY
    assert any(REASON_MANIFEST_NO_ACCESS in r for r in res.reasons)

def test_policy_evaluator_unscoped_delete_denied():
    evaluator = PolicyEvaluator()
    manifest_svc = ManifestService()
    manifest = manifest_svc.get_manifest("task_db_maintenance_002")
    session = SessionState(session_id="s2", agent_id="agent_dba_02", task_id="task_db_maintenance_002")

    # DELETE without WHERE clause
    req = ActionRequest(
        agent_id="agent_dba_02",
        session_id="s2",
        task_id="task_db_maintenance_002",
        action_type=ActionType.DB_DELETE,
        resource="customers",
        params={"query": "DELETE FROM customers"},
    )

    res = evaluator.evaluate(req, manifest, session)
    assert res.decision == Decision.DENY
    assert any("without WHERE clause" in r for r in res.reasons)

def test_policy_evaluator_scoped_delete_escalates():
    evaluator = PolicyEvaluator()
    manifest_svc = ManifestService()
    manifest = manifest_svc.get_manifest("task_db_maintenance_002")
    session = SessionState(session_id="s2", agent_id="agent_dba_02", task_id="task_db_maintenance_002")

    # DELETE with WHERE clause
    req = ActionRequest(
        agent_id="agent_dba_02",
        session_id="s2",
        task_id="task_db_maintenance_002",
        action_type=ActionType.DB_DELETE,
        resource="customers",
        params={"query": "DELETE FROM customers WHERE inactive = 1"},
    )

    res = evaluator.evaluate(req, manifest, session)
    assert res.decision == Decision.ESCALATE
    assert any("requires human authorization" in r for r in res.reasons)

def test_manifest_service_creation():
    svc = ManifestService()
    created = svc.create_manifest(
        TaskManifestCreate(
            task_id="custom_task_999",
            agent_id="agent_custom",
            description="Custom testing task",
            allowed_actions=[ActionType.DB_READ],
            allowed_resources=["sales"],
        )
    )
    assert created.task_id == "custom_task_999"
    fetched = svc.get_manifest("custom_task_999")
    assert fetched is not None
    assert fetched.agent_id == "agent_custom"
