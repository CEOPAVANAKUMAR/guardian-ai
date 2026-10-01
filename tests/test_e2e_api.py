"""End-to-End API tests for GuardianAI FastAPI endpoints."""

import pytest
import sys
from pathlib import Path
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.main import app
from shared.constants import ActionType, Decision

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_health_endpoint(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["project"] == "GuardianAI"

def test_create_session(client):
    res = client.post("/api/v1/sessions", json={
        "agent_id": "agent_analyst_01",
        "task_id": "task_sales_report_001",
    })
    assert res.status_code == 200
    data = res.json()
    assert "session_id" in data
    assert data["taint_level"] == "CLEAN"

def test_authorize_and_execute_flow(client):
    # 1. Create session
    sess_res = client.post("/api/v1/sessions", json={
        "agent_id": "agent_analyst_01",
        "task_id": "task_sales_report_001",
    })
    session_id = sess_res.json()["session_id"]

    # 2. Authorize legitimate DB_READ
    auth_res = client.post("/api/v1/authorize", json={
        "agent_id": "agent_analyst_01",
        "session_id": session_id,
        "task_id": "task_sales_report_001",
        "action_type": ActionType.DB_READ.value,
        "resource": "sales",
        "params": {"query": "SELECT * FROM sales LIMIT 5"},
    })
    assert auth_res.status_code == 200
    auth_data = auth_res.json()
    assert auth_data["decision"] in (Decision.ALLOW.value, Decision.ALLOW_WITH_CONSTRAINTS.value)
    token = auth_data["capability_token"]
    assert token is not None

    # 3. Execute with capability token
    exec_res = client.post("/api/v1/execute", json={
        "agent_id": "agent_analyst_01",
        "session_id": session_id,
        "action_type": ActionType.DB_READ.value,
        "resource": "sales",
        "params": {"query": "SELECT * FROM sales LIMIT 5"},
        "capability_token": token,
    })
    assert exec_res.status_code == 200
    exec_data = exec_res.json()
    assert exec_data["success"] is True
    assert len(exec_data["data"]) <= 5

    # 4. Attempt to REUSE capability token -> must be rejected (403)
    reuse_res = client.post("/api/v1/execute", json={
        "agent_id": "agent_analyst_01",
        "session_id": session_id,
        "action_type": ActionType.DB_READ.value,
        "resource": "sales",
        "params": {"query": "SELECT * FROM sales LIMIT 5"},
        "capability_token": token,
    })
    assert reuse_res.status_code == 403
    assert "already consumed" in reuse_res.json()["detail"].lower()

def test_audit_verify_api(client):
    res = client.get("/api/v1/audit/verify")
    assert res.status_code == 200
    data = res.json()
    assert data["is_valid"] is True

def test_demo_reset_and_attack_api(client):
    reset_res = client.post("/api/v1/demo/reset")
    assert reset_res.status_code == 200

    attack_res = client.post("/api/v1/demo/attack", json={
        "attack_type": "poisoned_pdf",
        "guardian_enabled": True,
    })
    assert attack_res.status_code == 200
    attack_data = attack_res.json()
    assert attack_data["outcome"] == "BLOCKED"
    assert len(attack_data["steps"]) >= 4
