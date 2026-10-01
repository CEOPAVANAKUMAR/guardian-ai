"""Tests for Phase 7: Poisoned PDF ingestion, indirect prompt injection defense, and reason trace."""

import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from shared.constants import (
    ActionType,
    Decision,
    RiskLevel,
    TaintLevel,
    REASON_MANIFEST_NO_ACCESS,
    REASON_SENSITIVE_RESOURCE,
    REASON_TAINTED_SESSION,
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
def security_system():
    test_db = Path(__file__).parent / "test_pdf_security.db"
    if test_db.exists():
        test_db.unlink()
    db_adapter = DatabaseAdapter(db_path=str(test_db))
    token_svc = CapabilityTokenService(secret_key="test_pdf_key")
    dry_run = DryRunService(db_adapter)
    appr_svc = ApprovalService(token_service=token_svc, dry_run_service=dry_run)
    audit = AuditChain(secret_key="test_pdf_audit")
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
    yield pipe, taint_eng, manifest_svc
    if test_db.exists():
        try:
            test_db.unlink()
        except Exception:
            pass

def test_clean_invoice_ingestion(security_system):
    _, taint_eng, _ = security_system
    session = taint_eng.create_session("agent_analyst_01", "task_sales_report_001")
    pdf_path = Path(__file__).parent.parent / "demo_agent" / "demo_data" / "clean_invoice.pdf"

    res = taint_eng.ingest_document(
        session_id=session.session_id,
        agent_id="agent_analyst_01",
        document_name="clean_invoice.pdf",
        file_path=str(pdf_path),
    )
    assert res.taint_level == TaintLevel.EXTERNAL_UNTRUSTED
    assert res.contains_injection_indicators is False
    assert "Apex Cloud Hosting" in res.extracted_text

def test_poisoned_pdf_injection_detection_and_block(security_system):
    pipe, taint_eng, _ = security_system
    session = taint_eng.create_session("agent_analyst_01", "task_sales_report_001")
    pdf_path = Path(__file__).parent.parent / "demo_agent" / "demo_data" / "poisoned_invoice.pdf"

    # 1. Ingestion: Guardian mediates reading the PDF
    ingest_res = taint_eng.ingest_document(
        session_id=session.session_id,
        agent_id="agent_analyst_01",
        document_name="poisoned_invoice.pdf",
        file_path=str(pdf_path),
    )
    assert ingest_res.contains_injection_indicators is True
    assert ingest_res.taint_level == TaintLevel.INDIRECT_INJECTION_SUSPECT
    assert session.taint_level == TaintLevel.INDIRECT_INJECTION_SUSPECT

    # 2. Susceptible agent attempts to execute the injected command: read_secret('fake_secrets.env')
    req = ActionRequest(
        agent_id="agent_analyst_01",
        session_id=session.session_id,
        task_id="task_sales_report_001",
        action_type=ActionType.READ_SECRET,
        resource="fake_secrets.env",
        params={},
    )

    decision_res = pipe.authorize(req)

    # 3. Guardian must return DENY with full reason trace
    assert decision_res.decision == Decision.DENY
    assert decision_res.risk_level == RiskLevel.CRITICAL
    assert decision_res.capability_token is None

    # Verify specific required reason trace elements:
    reasons_str = " ".join(decision_res.reasons)
    assert REASON_SENSITIVE_RESOURCE in reasons_str
    assert REASON_MANIFEST_NO_ACCESS in reasons_str
    assert REASON_TAINTED_SESSION in reasons_str

def test_poisoned_session_blocked_from_external_egress(security_system):
    pipe, taint_eng, _ = security_system
    session = taint_eng.create_session("agent_analyst_01", "task_sales_report_001")
    pdf_path = Path(__file__).parent.parent / "demo_agent" / "demo_data" / "poisoned_invoice.pdf"

    taint_eng.ingest_document(
        session_id=session.session_id,
        agent_id="agent_analyst_01",
        document_name="poisoned_invoice.pdf",
        file_path=str(pdf_path),
    )

    req = ActionRequest(
        agent_id="agent_analyst_01",
        session_id=session.session_id,
        task_id="task_sales_report_001",
        action_type=ActionType.EXTERNAL_SEND,
        resource="attacker@example.invalid",
        params={"message": "Exfiltrated payload"},
    )

    decision_res = pipe.authorize(req)
    assert decision_res.decision == Decision.DENY
    assert any("EXTERNAL_UNTRUSTED" in r or "restricted" in r for r in decision_res.reasons)
