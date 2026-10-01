"""Strict monotonic decision merger for GuardianAI.

Core security principle:
ALLOW < ALLOW_WITH_CONSTRAINTS < ESCALATE < DENY

The final decision merger must always return the most restrictive decision.
No security subsystem may make an existing decision less restrictive.
Default: DENY.
Empty: DENY.
Unknown: DENY.
"""

from typing import Iterable, List, Optional
from shared.constants import DECISION_RANK, Decision

class DecisionMerger:
    @staticmethod
    def merge(decisions: Iterable[Decision]) -> Decision:
        decision_list = list(decisions)
        if not decision_list:
            # Default to fail-closed DENY
            return Decision.DENY

        highest_rank = 0
        most_restrictive = Decision.DENY

        for d in decision_list:
            if not isinstance(d, Decision) or d not in DECISION_RANK:
                # Any unknown or malformed decision fails closed immediately
                return Decision.DENY

            rank = DECISION_RANK[d]
            if rank > highest_rank:
                highest_rank = rank
                most_restrictive = d

        return most_restrictive

    @staticmethod
    def is_more_or_equal_restrictive(a: Decision, b: Decision) -> bool:
        """Returns True if decision 'a' is as restrictive or more restrictive than 'b'."""
        rank_a = DECISION_RANK.get(a, 999)
        rank_b = DECISION_RANK.get(b, 999)
        return rank_a >= rank_b
