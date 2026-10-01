"""Output filtering and leak-prevention adapter for GuardianAI."""

import re
from typing import Any, Dict, List, Union
from backend.config import settings

SENSITIVE_PATTERNS = [
    re.compile(r"GUARDIAN_FAKE_SECRET_[A-Za-z0-9]+"),
    re.compile(r"sk-[a-zA-Z0-9]{32,}"),
    re.compile(r"ghp_[a-zA-Z0-9]{36}"),
    re.compile(r"(?:api_key|token|secret)\s*[:=]\s*['\"]?([A-Za-z0-9_\-]{16,})['\"]?", re.IGNORECASE),
]

class OutputFilter:
    @staticmethod
    def contains_secret(text: str) -> bool:
        if not text:
            return False
        if settings.DEMO_API_KEY in text:
            return True
        for pattern in SENSITIVE_PATTERNS:
            if pattern.search(text):
                return True
        return False

    @staticmethod
    def sanitize(data: Any) -> Any:
        if isinstance(data, str):
            sanitized = data
            if settings.DEMO_API_KEY in sanitized:
                sanitized = sanitized.replace(settings.DEMO_API_KEY, "[REDACTED_BY_GUARDIAN]")
            for pattern in SENSITIVE_PATTERNS:
                sanitized = pattern.sub("[REDACTED_BY_GUARDIAN]", sanitized)
            return sanitized
        elif isinstance(data, dict):
            return {k: OutputFilter.sanitize(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [OutputFilter.sanitize(item) for item in data]
        return data
