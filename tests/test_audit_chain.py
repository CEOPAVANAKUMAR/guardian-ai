"""Tests for Phase 4: Tamper-evident HMAC-SHA256 audit chain and tampering simulation."""

import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from shared.constants import Decision, RiskLevel
from backend.audit.chain import AuditChain, GENESIS_HASH

def test_audit_chain_genesis_and_append():
    chain = AuditChain(secret_key="test_audit_secret")
    rec1 = chain.append_decision(
        agent_id="agent_1",
        task_id="task_1",
        action_type="DB_READ",
        resource="sales",
        action_hash="hash1",
        taint_level="CLEAN",
        risk_level=RiskLevel.LOW.value,
        decision=Decision.ALLOW.value,
        reasons=["In-scope"],
        policy_ids=["POL-007"],
        latency_ms=1.5,
    )
    assert rec1["prev_hash"] == GENESIS_HASH
    assert rec1["current_hash"] is not None

    rec2 = chain.append_decision(
        agent_id="agent_1",
        task_id="task_1",
        action_type="DB_READ",
        resource="sales",
        action_hash="hash2",
        taint_level="CLEAN",
        risk_level=RiskLevel.LOW.value,
        decision=Decision.ALLOW.value,
        reasons=["In-scope"],
        policy_ids=["POL-007"],
        latency_ms=1.2,
    )
    assert rec2["prev_hash"] == rec1["current_hash"]

def test_audit_chain_verify_valid():
    chain = AuditChain(secret_key="test_audit_secret")
    for i in range(5):
        chain.append_decision(
            agent_id="agent_1",
            task_id="task_1",
            action_type="DB_READ",
            resource=f"resource_{i}",
            action_hash=f"hash_{i}",
            taint_level="CLEAN",
            risk_level=RiskLevel.LOW.value,
            decision=Decision.ALLOW.value,
            reasons=[f"reason {i}"],
            policy_ids=[f"POL-00{i}"],
            latency_ms=2.0,
        )

    verify_res = chain.verify_integrity()
    assert verify_res.is_valid is True
    assert verify_res.total_records == 5
    assert verify_res.invalid_index is None

def test_audit_chain_tamper_detection():
    chain = AuditChain(secret_key="test_audit_secret")
    for i in range(5):
        chain.append_decision(
            agent_id="agent_1",
            task_id="task_1",
            action_type="DB_READ",
            resource=f"resource_{i}",
            action_hash=f"hash_{i}",
            taint_level="CLEAN",
            risk_level=RiskLevel.LOW.value,
            decision="DENY",
            reasons=[f"denied {i}"],
            policy_ids=["POL-001"],
            latency_ms=2.0,
        )

    # Initially valid
    assert chain.verify_integrity().is_valid is True

    # Simulate tampering at index 2
    success, msg = chain.simulate_tampering(target_index=2)
    assert success is True

    # Verification must now fail!
    tampered_res = chain.verify_integrity()
    assert tampered_res.is_valid is False
    assert tampered_res.invalid_index == 2
    assert "signature mismatch" in tampered_res.details.lower() or "broken" in tampered_res.details.lower()
