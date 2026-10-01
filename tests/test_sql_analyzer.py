"""Tests for Phase 3: SQL security AST analyzer, multi-statement rejection, and protected DB."""

import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from shared.constants import Decision, RiskLevel
from backend.adapters.sql_analyzer import SQLAnalyzer
from backend.adapters.database import DatabaseAdapter

@pytest.fixture
def analyzer():
    return SQLAnalyzer(dialect="sqlite")

@pytest.fixture
def db():
    # Use in-memory or dedicated test db
    test_db_path = Path(__file__).parent / "test_scratch.db"
    if test_db_path.exists():
        test_db_path.unlink()
    adapter = DatabaseAdapter(db_path=str(test_db_path))
    yield adapter
    if test_db_path.exists():
        try:
            test_db_path.unlink()
        except Exception:
            pass

def test_sql_analyzer_benign_select(analyzer):
    report = analyzer.analyze("SELECT * FROM customers WHERE id = 1", max_limit=50)
    assert report.is_valid is True
    assert report.decision == Decision.ALLOW_WITH_CONSTRAINTS
    assert report.statement_type == "SELECT"
    assert "limit 50" in report.rewritten_query.lower()

def test_sql_analyzer_parse_failure(analyzer):
    report = analyzer.analyze("SELECT FROM WHERE INVALID SYNTAX !@@#$")
    assert report.is_valid is False
    assert report.decision == Decision.DENY
    assert report.risk_level == RiskLevel.HIGH

def test_sql_analyzer_multi_statement(analyzer):
    query = "SELECT * FROM sales; DROP TABLE customers;"
    report = analyzer.analyze(query)
    assert report.is_valid is False
    assert report.decision == Decision.DENY
    assert any("statements rejected" in r.lower() or "prohibited" in r.lower() for r in report.reasons)

def test_sql_analyzer_drop_table(analyzer):
    report = analyzer.analyze("DROP TABLE customers")
    assert report.is_valid is False
    assert report.decision == Decision.DENY
    assert report.risk_level == RiskLevel.CRITICAL
    assert any("DROP" in r for r in report.reasons)

def test_sql_analyzer_alter_table(analyzer):
    report = analyzer.analyze("ALTER TABLE customers ADD COLUMN malicious TEXT")
    assert report.is_valid is False
    assert report.decision == Decision.DENY
    assert report.risk_level == RiskLevel.CRITICAL

def test_sql_analyzer_unscoped_delete(analyzer):
    report = analyzer.analyze("DELETE FROM customers")
    assert report.is_valid is False
    assert report.decision == Decision.DENY
    assert report.risk_level == RiskLevel.CRITICAL
    assert any("WHERE clause is mandatory" in r for r in report.reasons)

def test_sql_analyzer_scoped_delete(analyzer):
    report = analyzer.analyze("DELETE FROM customers WHERE inactive = 1")
    assert report.is_valid is True
    assert report.decision == Decision.ESCALATE
    assert report.risk_level == RiskLevel.HIGH
    assert report.has_where is True

def test_sql_analyzer_pragma_attach(analyzer):
    report1 = analyzer.analyze("PRAGMA table_info(customers)")
    assert report1.decision == Decision.DENY

    report2 = analyzer.analyze("ATTACH DATABASE ':memory:' AS shadow")
    assert report2.decision == Decision.DENY

def test_sql_analyzer_cte_wrapped_delete(analyzer):
    query = "WITH inactive_users AS (SELECT id FROM customers WHERE inactive = 1) DELETE FROM customers WHERE id IN (SELECT id FROM inactive_users)"
    report = analyzer.analyze(query)
    # Must detect DELETE and require escalation
    assert report.statement_type == "DELETE"
    assert report.decision == Decision.ESCALATE
    assert report.has_where is True

def test_sql_analyzer_cte_wrapped_unscoped_delete(analyzer):
    query = "WITH dummy AS (SELECT 1) DELETE FROM customers"
    report = analyzer.analyze(query)
    assert report.is_valid is False
    assert report.decision == Decision.DENY

def test_database_seeding_and_impact_preview(db):
    # Verify seeded rows
    conn = db.get_read_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM customers")
    count = c.fetchone()[0]
    conn.close()
    assert count >= 1000

    # Test dry-run impact preview on DELETE
    preview = db.calculate_impact_preview("DELETE FROM customers WHERE inactive = 1")
    assert "estimated_affected_records" in preview
    assert preview["estimated_affected_records"] > 0
    # Check that records were NOT deleted by the preview!
    conn2 = db.get_read_connection()
    c2 = conn2.cursor()
    c2.execute("SELECT COUNT(*) FROM customers")
    count_after = c2.fetchone()[0]
    conn2.close()
    assert count_after == count, "Impact preview must NOT mutate the database"
