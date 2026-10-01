"""Tests for Phase 5: Capability token signing, single-use nonce, expiration, and hash binding."""

import time
import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from shared.constants import Decision, REASON_ACTION_HASH_MISMATCH, REASON_CAPABILITY_EXPIRED, REASON_CAPABILITY_REUSED
from shared.schemas import compute_action_hash
from backend.approvals.signing import CapabilityTokenService

@pytest.fixture
def token_service():
    return CapabilityTokenService(secret_key="test_capability_secret_key")

def test_capability_token_issue_and_verify(token_service):
    action_hash = compute_action_hash("DB_READ", "sales", {"query": "SELECT * FROM sales"})
    token = token_service.issue_token(
        action_hash=action_hash,
        agent_id="agent_1",
        session_id="sess_1",
        decision=Decision.ALLOW,
        ttl_seconds=10,
    )
    assert token is not None

    # First verification: must succeed
    valid, payload, err = token_service.verify_and_consume_token(
        token=token,
        expected_action_hash=action_hash,
        expected_agent_id="agent_1",
        expected_session_id="sess_1",
    )
    assert valid is True
    assert err is None
    assert payload["action_hash"] == action_hash

def test_capability_token_nonce_single_use(token_service):
    action_hash = compute_action_hash("DB_READ", "sales", {"query": "SELECT * FROM sales"})
    token = token_service.issue_token(
        action_hash=action_hash,
        agent_id="agent_1",
        session_id="sess_1",
        decision=Decision.ALLOW,
    )

    # First use: PASS
    valid1, _, _ = token_service.verify_and_consume_token(
        token, action_hash, "agent_1", "sess_1"
    )
    assert valid1 is True

    # Replay attack / reuse of same capability token: MUST FAIL
    valid2, _, err = token_service.verify_and_consume_token(
        token, action_hash, "agent_1", "sess_1"
    )
    assert valid2 is False
    assert err == REASON_CAPABILITY_REUSED

def test_capability_token_action_hash_mismatch(token_service):
    original_hash = compute_action_hash("DB_READ", "sales", {"query": "SELECT * FROM sales"})
    altered_hash = compute_action_hash("DB_DELETE", "sales", {"query": "DELETE FROM sales"})

    token = token_service.issue_token(
        action_hash=original_hash,
        agent_id="agent_1",
        session_id="sess_1",
        decision=Decision.ALLOW,
    )

    # Agent presents token for an altered action
    valid, _, err = token_service.verify_and_consume_token(
        token, altered_hash, "agent_1", "sess_1"
    )
    assert valid is False
    assert REASON_ACTION_HASH_MISMATCH in err

def test_capability_token_expiration(token_service):
    action_hash = compute_action_hash("DB_READ", "sales", {})
    # Token with 0 second TTL
    token = token_service.issue_token(
        action_hash=action_hash,
        agent_id="agent_1",
        session_id="sess_1",
        decision=Decision.ALLOW,
        ttl_seconds=-1,
    )

    valid, _, err = token_service.verify_and_consume_token(
        token, action_hash, "agent_1", "sess_1"
    )
    assert valid is False
    assert err == REASON_CAPABILITY_EXPIRED
