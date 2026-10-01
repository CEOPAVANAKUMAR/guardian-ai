"""Shared constants for GuardianAI runtime authorization infrastructure."""

from enum import Enum
from typing import Dict

class Decision(str, Enum):
    ALLOW = "ALLOW"
    ALLOW_WITH_CONSTRAINTS = "ALLOW_WITH_CONSTRAINTS"
    ESCALATE = "ESCALATE"
    DENY = "DENY"

# Strict monotonicity ranking: larger value means more restrictive
DECISION_RANK: Dict[Decision, int] = {
    Decision.ALLOW: 1,
    Decision.ALLOW_WITH_CONSTRAINTS: 2,
    Decision.ESCALATE: 3,
    Decision.DENY: 4,
}

class TaintLevel(str, Enum):
    CLEAN = "CLEAN"
    INTERNAL_VERIFIED = "INTERNAL_VERIFIED"
    EXTERNAL_UNTRUSTED = "EXTERNAL_UNTRUSTED"
    INDIRECT_INJECTION_SUSPECT = "INDIRECT_INJECTION_SUSPECT"

# Taint severity ranking: larger value means more tainted
TAINT_RANK: Dict[TaintLevel, int] = {
    TaintLevel.CLEAN: 0,
    TaintLevel.INTERNAL_VERIFIED: 1,
    TaintLevel.EXTERNAL_UNTRUSTED: 2,
    TaintLevel.INDIRECT_INJECTION_SUSPECT: 3,
}

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ActionType(str, Enum):
    DB_READ = "DB_READ"
    DB_WRITE = "DB_WRITE"
    DB_DELETE = "DB_DELETE"
    READ_DOCUMENT = "READ_DOCUMENT"
    READ_SECRET = "READ_SECRET"
    EXTERNAL_SEND = "EXTERNAL_SEND"
    FILE_WRITE = "FILE_WRITE"
    SYSTEM_COMMAND = "SYSTEM_COMMAND"

class ApprovalStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    EXECUTED = "EXECUTED"

# Standard Reason Codes
REASON_SENSITIVE_RESOURCE = "Sensitive resource requested"
REASON_MANIFEST_NO_ACCESS = "Task manifest has no secret access"
REASON_TAINTED_SESSION = "Session contains EXTERNAL_UNTRUSTED context"
REASON_UNSAFE_SQL_CONSTRUCT = "Destructive or unsafe SQL statement detected"
REASON_SQL_PARSE_FAILURE = "SQL statement could not be safely parsed"
REASON_MULTI_STATEMENT_REJECTED = "Multiple SQL statements rejected"
REASON_ACTION_HASH_MISMATCH = "Action hash mismatch detected"
REASON_CAPABILITY_EXPIRED = "Capability token expired"
REASON_CAPABILITY_REUSED = "Capability nonce already consumed"
REASON_ESCALATION_REQUIRED = "Action impact requires human approval"
REASON_DEFAULT_DENY = "Default deny policy triggered"
REASON_INSPECTION_CLEAN = "Action verified against task scope and security policies"
REASON_POLICY_ERROR = "Policy evaluation error occurred (fail closed)"
REASON_AUTHENTICATION_FAILURE = "Agent authentication failed or agent identity invalid"
