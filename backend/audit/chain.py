"""Cryptographic tamper-evident audit log chain for GuardianAI.

Implements HMAC-SHA256 chained audit entries per agent/system.
"""

import hmac
import hashlib
import json
import time
import uuid
from typing import Any, Dict, List, Optional, Tuple

from backend.config import settings
from shared.schemas import AuditRecordSchema, AuditVerifyResponse

GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

class AuditChain:
    def __init__(self, secret_key: Optional[str] = None):
        self.secret_key = (secret_key or settings.GUARDIAN_SECRET_KEY).encode("utf-8")
        self._chain: List[Dict[str, Any]] = []

    def _compute_record_hash(self, record_data: Dict[str, Any], prev_hash: str) -> str:
        # Build canonical payload excluding current_hash and signature
        canonical_payload = {
            "id": record_data["id"],
            "timestamp": record_data["timestamp"],
            "agent_id": record_data["agent_id"],
            "task_id": record_data["task_id"],
            "action_type": record_data["action_type"],
            "resource": record_data["resource"],
            "action_hash": record_data["action_hash"],
            "taint_level": record_data["taint_level"],
            "risk_level": record_data["risk_level"],
            "decision": record_data["decision"],
            "reasons": sorted(record_data.get("reasons", [])),
            "policy_ids": sorted(record_data.get("policy_ids", [])),
            "latency_ms": round(float(record_data.get("latency_ms", 0.0)), 3),
            "prev_hash": prev_hash,
        }
        canonical_str = json.dumps(canonical_payload, sort_keys=True, separators=(",", ":"))
        return hmac.new(self.secret_key, canonical_str.encode("utf-8"), hashlib.sha256).hexdigest()

    def append_decision(
        self,
        agent_id: str,
        task_id: str,
        action_type: str,
        resource: str,
        action_hash: str,
        taint_level: str,
        risk_level: str,
        decision: str,
        reasons: List[str],
        policy_ids: List[str],
        latency_ms: float,
    ) -> Dict[str, Any]:
        prev_hash = self._chain[-1]["current_hash"] if self._chain else GENESIS_HASH
        record_id = f"aud_{uuid.uuid4().hex[:12]}"
        now = time.time()

        raw_record = {
            "id": record_id,
            "timestamp": now,
            "agent_id": agent_id,
            "task_id": task_id,
            "action_type": action_type,
            "resource": resource,
            "action_hash": action_hash,
            "taint_level": taint_level,
            "risk_level": risk_level,
            "decision": decision,
            "reasons": reasons,
            "policy_ids": policy_ids,
            "latency_ms": latency_ms,
            "prev_hash": prev_hash,
        }

        current_hash = self._compute_record_hash(raw_record, prev_hash)
        raw_record["current_hash"] = current_hash
        raw_record["signature"] = current_hash  # HMAC serves as signature

        self._chain.append(raw_record)
        return raw_record

    def verify_integrity(self) -> AuditVerifyResponse:
        if not self._chain:
            return AuditVerifyResponse(
                is_valid=True,
                total_records=0,
                invalid_index=None,
                invalid_record_id=None,
                details="Audit chain is empty. Integrity intact.",
            )

        expected_prev_hash = GENESIS_HASH

        for idx, record in enumerate(self._chain):
            # 1. Verify prev_hash link
            if record["prev_hash"] != expected_prev_hash:
                return AuditVerifyResponse(
                    is_valid=False,
                    total_records=len(self._chain),
                    invalid_index=idx,
                    invalid_record_id=record.get("id"),
                    details=(
                        f"Chain broken at record #{idx} (ID: {record.get('id')}): "
                        f"Expected prev_hash '{expected_prev_hash[:16]}...', "
                        f"got '{record.get('prev_hash', '')[:16]}...'"
                    ),
                )

            # 2. Recompute and verify current_hash
            recomputed = self._compute_record_hash(record, expected_prev_hash)
            if recomputed != record.get("current_hash"):
                return AuditVerifyResponse(
                    is_valid=False,
                    total_records=len(self._chain),
                    invalid_index=idx,
                    invalid_record_id=record.get("id"),
                    details=(
                        f"Cryptographic signature mismatch at record #{idx} (ID: {record.get('id')}): "
                        f"Data was altered without valid HMAC recalculation."
                    ),
                )

            expected_prev_hash = record["current_hash"]

        return AuditVerifyResponse(
            is_valid=True,
            total_records=len(self._chain),
            invalid_index=None,
            invalid_record_id=None,
            details=f"All {len(self._chain)} audit records cryptographically verified with HMAC-SHA256 chain.",
        )

    def simulate_tampering(self, target_index: int = 0) -> Tuple[bool, str]:
        """Modifies a record's decision in-place to demonstrate tamper detection."""
        if not self._chain:
            return False, "Chain is empty; cannot tamper"

        if target_index >= len(self._chain):
            target_index = len(self._chain) - 1

        target = self._chain[target_index]
        original_decision = target["decision"]
        # Tamper decision: if DENY make ALLOW, if ALLOW make DENY
        target["decision"] = "ALLOW" if original_decision == "DENY" else "DENY"
        target["tampered"] = True
        return True, f"Record #{target_index} (ID: {target['id']}) tampered: decision changed from {original_decision} to {target['decision']} without HMAC update"

    def get_records(self, limit: int = 100) -> List[Dict[str, Any]]:
        return list(reversed(self._chain[-limit:]))
