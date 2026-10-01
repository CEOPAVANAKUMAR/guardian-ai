"""Capability token issuing, signing, and verification service for GuardianAI.

Implements cryptographically signed, short-lived, single-use capability tokens.
"""

import base64
import hashlib
import hmac
import json
import time
import uuid
from typing import Any, Dict, Optional, Set, Tuple

from backend.config import settings
from shared.constants import (
    Decision,
    REASON_ACTION_HASH_MISMATCH,
    REASON_CAPABILITY_EXPIRED,
    REASON_CAPABILITY_REUSED,
)
from shared.schemas import CapabilityTokenPayload

class CapabilityTokenService:
    def __init__(self, secret_key: Optional[str] = None):
        self.secret_key = (secret_key or settings.CAPABILITY_TOKEN_SECRET).encode("utf-8")
        self._used_nonces: Set[str] = set()

    def _sign_payload(self, payload_dict: Dict[str, Any]) -> str:
        # Canonical representation excluding signature
        canonical = {k: v for k, v in payload_dict.items() if k != "signature"}
        raw = json.dumps(canonical, sort_keys=True, separators=(",", ":")).encode("utf-8")
        return hmac.new(self.secret_key, raw, hashlib.sha256).hexdigest()

    def issue_token(
        self,
        action_hash: str,
        agent_id: str,
        session_id: str,
        decision: Decision,
        constraints: Optional[Dict[str, Any]] = None,
        ttl_seconds: Optional[int] = None,
    ) -> str:
        ttl = ttl_seconds or settings.CAPABILITY_TTL_SECONDS
        now = time.time()
        nonce = f"nonce_{uuid.uuid4().hex}"

        payload = {
            "action_hash": action_hash,
            "agent_id": agent_id,
            "session_id": session_id,
            "decision": decision.value,
            "constraints": constraints or {},
            "expiry": now + ttl,
            "nonce": nonce,
        }

        signature = self._sign_payload(payload)
        payload["signature"] = signature

        token_json = json.dumps(payload, separators=(",", ":"))
        return base64.urlsafe_b64encode(token_json.encode("utf-8")).decode("utf-8")

    def verify_and_consume_token(
        self,
        token: str,
        expected_action_hash: str,
        expected_agent_id: str,
        expected_session_id: str,
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        try:
            token_json = base64.urlsafe_b64decode(token.encode("utf-8")).decode("utf-8")
            payload = json.loads(token_json)
        except Exception:
            return False, None, "Malformed or invalid capability token encoding"

        # 1. Verify cryptographic signature
        expected_sig = self._sign_payload(payload)
        if not hmac.compare_digest(expected_sig, payload.get("signature", "")):
            return False, None, "Invalid capability token signature"

        # 2. Verify expiry
        now = time.time()
        if now > payload.get("expiry", 0):
            return False, None, REASON_CAPABILITY_EXPIRED

        # 3. Verify single-use nonce
        nonce = payload.get("nonce")
        if not nonce or nonce in self._used_nonces:
            return False, None, REASON_CAPABILITY_REUSED

        # 4. Verify action hash binding
        if payload.get("action_hash") != expected_action_hash:
            return False, None, f"{REASON_ACTION_HASH_MISMATCH}: Token was not issued for this exact action"

        # 5. Verify agent binding
        if payload.get("agent_id") != expected_agent_id:
            return False, None, "Capability token agent binding mismatch"

        # 6. Verify session binding
        if payload.get("session_id") != expected_session_id:
            return False, None, "Capability token session binding mismatch"

        # Mark nonce consumed
        self._used_nonces.add(nonce)

        return True, payload, None
