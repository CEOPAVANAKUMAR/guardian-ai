"""Tests for Continuous Identity & Insider Misuse Attribution."""

import pytest
from fastapi.testclient import TestClient

from backend.identity import engine
from backend.identity.models import SessionContext
from backend.identity.scenarios import SCENARIOS, get_context
from backend.main import app

API = "/api/v1"


@pytest.fixture()
def client():
    with TestClient(app) as c:
        c.post(f"{API}/demo/reset")
        yield c


def run(sid):
    return engine.evaluate(get_context(sid))


def test_engine_is_deterministic_and_has_no_llm_dependency():
    a, b = run("identity_account_sharing"), run("identity_account_sharing")
    assert a.model_dump() == b.model_dump()
    src = open(engine.__file__).read().lower()
    for banned in ("import anthropic", "import openai", "import httpx", "import requests", "import random",
                   "time.time(", "datetime.now("):
        assert banned not in src


def test_scenario_1_normal_allows():
    r = run("identity_normal")
    assert (r.risk_level, r.decision) == ("LOW", "ALLOW")
    assert r.attribution.verified_operator["status"] == "VERIFIED"


def test_scenario_2_device_mismatch_steps_up_and_does_not_accuse_b():
    r = run("identity_device_mismatch")
    assert (r.risk_level, r.decision) == ("MEDIUM", "STEP_UP_VERIFY")
    assert r.attribution.likely_operator["name"] == engine.UNKNOWN
    assert r.attribution.device_owner["implicated"] is False
    assert r.attribution.verified_operator["status"] == "NONE"


def test_scenario_3_account_sharing_blocks_and_attributes_with_hedging():
    r = run("identity_account_sharing")
    assert r.risk_level == "CRITICAL" and r.actions == ["BLOCK", "REVOKE_SESSION", "CREATE_INCIDENT"]
    lo = r.attribution.likely_operator
    assert lo["status"] == "LIKELY" and lo["name"] == "Ben Okafor"
    assert lo["confidence"] <= engine.MAX_ATTRIBUTION_CONFIDENCE < 100
    assert r.attribution.verified_operator["status"] == "NONE"
    assert "NOT verified" in r.attribution.note


def test_scenario_4_insider_misuse_is_not_account_takeover():
    r = run("insider_bulk_export")
    assert r.risk_level == "CRITICAL" and r.threat_class == "INSIDER_DATA_MISUSE"
    assert r.attribution.verified_operator["status"] == "VERIFIED"
    assert r.attribution.identity_confidence >= 90
    assert any(x["id"] == "R-INSIDER-1" for x in r.rules_fired)


def test_never_100_percent_certainty():
    for sid in SCENARIOS:
        assert run(sid).attribution.identity_confidence <= engine.MAX_IDENTITY_CONFIDENCE < 100


def test_device_mismatch_alone_never_names_device_owner():
    ctx = get_context("identity_device_mismatch")
    r = engine.evaluate(ctx)
    assert r.attribution.likely_operator["status"] == "UNKNOWN"


def test_decision_levels_map_to_actions():
    assert engine.DECISIONS["LOW"][2] == ["ALLOW"]
    assert engine.DECISIONS["MEDIUM"][2] == ["STEP_UP_VERIFY"]
    assert engine.DECISIONS["HIGH"][2] == ["BLOCK"]
    assert engine.DECISIONS["CRITICAL"][2] == ["BLOCK", "REVOKE_SESSION", "CREATE_INCIDENT"]


def test_high_level_blocks_without_incident(client):
    ctx = get_context("identity_normal").model_dump()
    ctx["data_access"].update(destination_kind="external", destination_name="partner-sftp.example",
                              declared_purpose="sales_reporting", records=10)
    rec = client.post(f"{API}/identity/evaluate", json={"context": ctx}).json()
    assert rec["result"]["risk_level"] in ("MEDIUM", "HIGH")
    if rec["result"]["risk_level"] == "HIGH":
        assert rec["incident_id"] is None and rec["session"]["status"] == "BLOCKED"


def test_critical_revokes_session_creates_incident_and_audits(client):
    rec = client.post(f"{API}/identity/scenarios/identity_account_sharing/run").json()
    assert rec["session"]["status"] == "REVOKED"
    inc = client.get(f"{API}/incidents/{rec['incident_id']}").json()
    assert inc["sector"] == "IDENTITY & INSIDER RISK" and inc["attribution"]["likely_operator"]["name"] == "Ben Okafor"
    types = [a["action_type"] for a in client.get(f"{API}/audit").json()]
    assert "IDENTITY_ATTRIBUTION" in types and "SESSION_REVOKED" in types
    assert client.get(f"{API}/audit/verify").json()["is_valid"] is True


def test_insider_incident_class(client):
    rec = client.post(f"{API}/identity/scenarios/insider_bulk_export/run").json()
    inc = client.get(f"{API}/incidents/{rec['incident_id']}").json()
    assert inc["action"] == "INSIDER_DATA_MISUSE" and "NOT an account takeover" in inc["detailed_analysis"]


def test_step_up_pass_allows_and_fail_blocks(client):
    ok = client.post(f"{API}/identity/scenarios/identity_device_mismatch/run").json()
    r = client.post(f"{API}/identity/evaluations/{ok['id']}/step-up", json={"result": "passed"}).json()
    assert r["result"]["decision"] == "ALLOW" and r["session"]["status"] == "ACTIVE"
    assert r["result"]["attribution"]["verified_operator"]["status"] == "VERIFIED"
    assert client.post(f"{API}/identity/evaluations/{ok['id']}/step-up", json={"result": "passed"}).status_code == 409

    bad = client.post(f"{API}/identity/scenarios/identity_device_mismatch/run").json()
    r = client.post(f"{API}/identity/evaluations/{bad['id']}/step-up", json={"result": "failed"}).json()
    assert r["result"]["decision"] == "BLOCK" and r["session"]["status"] == "BLOCKED"


def test_attack_playground_integration(client):
    for attack, outcome in [("identity_normal", "ALLOWED"), ("identity_device_mismatch", "ESCALATED"),
                            ("identity_account_sharing", "BLOCKED"), ("insider_bulk_export", "BLOCKED")]:
        j = client.post(f"{API}/demo/attack", json={"attack_type": attack, "guardian_enabled": True}).json()
        assert j["outcome"] == outcome and j["identity_evaluation_id"]
    off = client.post(f"{API}/demo/attack", json={"attack_type": "insider_bulk_export", "guardian_enabled": False}).json()
    assert off["outcome"] == "EXPLOITED"


def test_reset_clears_identity_state(client):
    client.post(f"{API}/identity/scenarios/identity_normal/run")
    client.post(f"{API}/demo/reset")
    assert client.get(f"{API}/identity/evaluations").json() == []
