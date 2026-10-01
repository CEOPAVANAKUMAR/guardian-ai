"""Fail-closed utility wrapper for GuardianAI authorization pipeline."""

import functools
import logging
from typing import Callable, Any, Dict, List
from shared.constants import Decision, RiskLevel, REASON_DEFAULT_DENY, REASON_POLICY_ERROR
from shared.schemas import AuthorizationDecisionResponse, compute_action_hash

logger = logging.getLogger("guardianai.fail_closed")

def fail_closed_authorization(func: Callable) -> Callable:
    """Decorator ensuring that any unhandled exception results in a fail-closed DENY decision."""
    @functools.wraps(func)
    def wrapper(*args, **kwargs) -> AuthorizationDecisionResponse:
        try:
            return func(*args, **kwargs)
        except Exception as e:
            logger.error(f"FAIL CLOSED TRIGGERED: Exception in authorization evaluation: {e}", exc_info=True)
            # Find action request if available
            action_hash = "unknown_action_hash"
            if args and hasattr(args[0], "get_action_hash"):
                action_hash = args[0].get_action_hash()
            elif "request" in kwargs and hasattr(kwargs["request"], "get_action_hash"):
                action_hash = kwargs["request"].get_action_hash()

            return AuthorizationDecisionResponse(
                decision=Decision.DENY,
                risk_level=RiskLevel.CRITICAL,
                action_hash=action_hash,
                reasons=[
                    REASON_POLICY_ERROR,
                    f"Internal authorization safety fault: {str(e)}"
                ],
                policy_ids=["FAIL_CLOSED_EMERGENCY"],
                latency_ms=0.0
            )
    return wrapper
