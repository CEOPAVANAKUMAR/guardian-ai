"""Tests for Guardian Sentinel AI Copilot API endpoint."""

import pytest
import sys
from pathlib import Path
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.main import app


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_copilot_incident_query(client):
    res = client.post("/api/v1/copilot/chat", json={
        "message": "What is the latest security incident?",
        "history": [],
    })
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert "Incident" in data["reply"] or "forensic" in data["reply"].lower()
    assert len(data["suggested_queries"]) > 0


def test_copilot_audit_query(client):
    res = client.post("/api/v1/copilot/chat", json={
        "message": "Verify the HMAC audit chain integrity",
        "history": [],
    })
    assert res.status_code == 200
    data = res.json()
    assert "reply" in data
    assert "HMAC" in data["reply"] or "Audit" in data["reply"]


def test_copilot_sql_query(client):
    res = client.post("/api/v1/copilot/chat", json={
        "message": "How does GuardianAI block SQL DROP TABLE?",
        "history": [],
    })
    assert res.status_code == 200
    data = res.json()
    assert "AST" in data["reply"] or "sqlglot" in data["reply"]


def test_copilot_system_status(client):
    res = client.post("/api/v1/copilot/chat", json={
        "message": "Show current system status and telemetry",
        "history": [],
    })
    assert res.status_code == 200
    data = res.json()
    assert "ONLINE" in data["reply"] or "Telemetry" in data["reply"]
