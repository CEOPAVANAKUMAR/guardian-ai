"""Tests for Phase 2: Monotonic taint tracking, server-side document ingestion, and taint policy."""

import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from shared.constants import (
    ActionType,
    Decision,
    RiskLevel,
    TaintLevel,
    REASON_TAINTED_SESSION,
    REASON_SENSITIVE_RESOURCE,
)
from shared.schemas import ActionRequest, TaskManifest
from backend.core.taint_engine import TaintEngine
from backend.policy.evaluator import PolicyEvaluator
from backend.tasks.manifest_service import ManifestService

@pytest.fixture
def taint_setup():
    engine = TaintEngine()
    evaluator = PolicyEvaluator()
    manifest_svc = ManifestService()
    session = engine.create_session("agent_analyst_01", "task_sales_report_001")
    manifest = manifest_svc.get_manifest("task_sales_report_001")
    return engine, evaluator, session, manifest

def test_session_starts_clean(taint_setup):
    _, _, session, _ = taint_setup
    assert session.taint_level == TaintLevel.CLEAN

def test_taint_monotonicity(taint_setup):
    engine, _, session, _ = taint_setup
    # Upgrade to EXTERNAL_UNTRUSTED
    engine.taint_session(session.session_id, TaintLevel.EXTERNAL_UNTRUSTED, source="external_pdf")
    assert session.taint_level == TaintLevel.EXTERNAL_UNTRUSTED

    # Attempt to downgrade back to CLEAN: MUST NOT change
    engine.taint_session(session.session_id, TaintLevel.CLEAN, source="fake_cleanup")
    assert session.taint_level == TaintLevel.EXTERNAL_UNTRUSTED

    # Upgrade to INDIRECT_INJECTION_SUSPECT
    engine.taint_session(session.session_id, TaintLevel.INDIRECT_INJECTION_SUSPECT, source="prompt_injection")
    assert session.taint_level == TaintLevel.INDIRECT_INJECTION_SUSPECT

def test_tainted_session_blocks_secret_read(taint_setup):
    engine, evaluator, session, manifest = taint_setup
    # Mark session tainted
    engine.taint_session(session.session_id, TaintLevel.EXTERNAL_UNTRUSTED, source="untrusted_file.pdf")

    req = ActionRequest(
        agent_id=session.agent_id,
        session_id=session.session_id,
        task_id=session.task_id,
        action_type=ActionType.READ_SECRET,
        resource="fake_secrets.env",
        params={},
    )

    decision = evaluator.evaluate(req, manifest, session)
    assert decision.decision == Decision.DENY
    assert decision.risk_level == RiskLevel.CRITICAL
    assert any(REASON_TAINTED_SESSION in r for r in decision.reasons)

def test_tainted_session_blocks_external_send(taint_setup):
    engine, evaluator, session, manifest = taint_setup
    engine.taint_session(session.session_id, TaintLevel.EXTERNAL_UNTRUSTED, source="untrusted_file.pdf")

    req = ActionRequest(
        agent_id=session.agent_id,
        session_id=session.session_id,
        task_id=session.task_id,
        action_type=ActionType.EXTERNAL_SEND,
        resource="attacker@example.invalid",
        params={"body": "stolen data"},
    )

    decision = evaluator.evaluate(req, manifest, session)
    assert decision.decision == Decision.DENY
    assert any("EXTERNAL_UNTRUSTED" in r or "restricted" in r for r in decision.reasons)
