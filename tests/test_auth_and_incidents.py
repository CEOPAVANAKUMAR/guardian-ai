"""Tests for GuardianAI Authentication, OTP, and Security Incident Center."""

import pytest
import sys
from pathlib import Path
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.main import app
from shared.constants import ActionType, Decision, RiskLevel


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_auth_request_and_verify_otp_flow(client):
    # 1. Request OTP for default admin
    req_res = client.post("/api/v1/auth/request-otp", json={
        "name": "Pavan Kumar Thatigiri",
        "email": "thatigiripavankumar@gmail.com",
        "password": "GuardianAdmin@2026",
    })
    assert req_res.status_code == 200
    data = req_res.json()
    assert data["status"] == "OTP_SENT"
    assert data["is_dev_mode"] is True
    otp = data["dev_otp"]
    assert otp is not None
    assert len(otp) == 6

    # 2. Verify with wrong OTP
    wrong_res = client.post("/api/v1/auth/verify-otp", json={
        "email": "thatigiripavankumar@gmail.com",
        "otp": "000000",
    })
    assert wrong_res.status_code == 400
    assert "Invalid verification code" in wrong_res.json()["detail"]

    # 3. Verify with correct OTP
    verify_res = client.post("/api/v1/auth/verify-otp", json={
        "email": "thatigiripavankumar@gmail.com",
        "otp": otp,
    })
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    token = verify_data["access_token"]
    assert token is not None
    assert verify_data["user"]["email"] == "thatigiripavankumar@gmail.com"

    # 4. Access /me endpoint with token
    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["name"] == "Pavan Kumar Thatigiri"

    # 5. Access /me without token -> 401
    unauth_res = client.get("/api/v1/auth/me")
    assert unauth_res.status_code == 401

    # 6. Logout
    logout_res = client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_res.status_code == 200

    # 7. Post-logout /me should now fail
    after_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert after_res.status_code == 401


def test_auth_invalid_password(client):
    res = client.post("/api/v1/auth/request-otp", json={
        "name": "Pavan Kumar Thatigiri",
        "email": "thatigiripavankumar@gmail.com",
        "password": "WrongPassword123!",
    })
    assert res.status_code == 400
    assert "Invalid email or password" in res.json()["detail"]


def test_incidents_listing_and_stats(client):
    # Fetch incidents list
    list_res = client.get("/api/v1/incidents")
    assert list_res.status_code == 200
    incidents = list_res.json()
    assert len(incidents) >= 1
    first = incidents[0]
    assert "id" in first
    assert "sector" in first
    assert "problem_title" in first
    assert "potential_effects" in first
    assert "recommended_solution" in first

    # Fetch stats
    stats_res = client.get("/api/v1/incidents/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_incidents"] >= 1
    assert "security_posture" in stats
    assert "threat_distribution" in stats
    assert "incidents_by_sector" in stats


def test_incident_detail_and_status_update(client):
    list_res = client.get("/api/v1/incidents")
    incident_id = list_res.json()[0]["id"]

    # Get single detail
    detail_res = client.get(f"/api/v1/incidents/{incident_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["id"] == incident_id

    # Update status
    update_res = client.post(f"/api/v1/incidents/{incident_id}/status", json={"status": "INVESTIGATING"})
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "INVESTIGATING"


def test_incident_share_report(client):
    list_res = client.get("/api/v1/incidents")
    incident_id = list_res.json()[0]["id"]

    # Valid recipient email
    share_res = client.post(f"/api/v1/incidents/{incident_id}/share", json={
        "recipient_email": "security-officer@enterprise.corp",
    })
    # In dev mode, returns 400 with dev fallback message or 200
    # Our implementation safely returns 400 if SMTP not configured:
    # "SMTP credentials not configured. Operating in DEV fallback mode."
    assert share_res.status_code in (200, 400)
    if share_res.status_code == 400:
        assert "DEV" in share_res.json()["detail"] or "SMTP" in share_res.json()["detail"]


def test_incident_creation_on_tamper_and_attack(client):
    # Simulate audit tampering -> must generate incident
    tamper_res = client.post("/api/v1/demo/tamper-audit?target_index=0")
    # Even if chain is empty, reset first and then tamper
    client.post("/api/v1/demo/reset")
    # Create an audit entry via attack
    client.post("/api/v1/demo/attack", json={"attack_type": "database_drop", "guardian_enabled": True})

    tamper_res2 = client.post("/api/v1/demo/tamper-audit?target_index=0")
    assert tamper_res2.status_code == 200

    # Verify incident was created
    incidents_res = client.get("/api/v1/incidents")
    titles = [i["problem_title"] for i in incidents_res.json()]
    assert any("Audit" in t or "Database" in t for t in titles)

    # Clean up test side-effects
    client.post("/api/v1/demo/reset")
