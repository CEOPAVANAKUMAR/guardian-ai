"""Application configuration settings for GuardianAI."""

import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseModel):
    PROJECT_NAME: str = "GuardianAI"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    GUARDIAN_HOST: str = os.getenv("GUARDIAN_HOST", "0.0.0.0")
    GUARDIAN_PORT: int = int(os.getenv("PORT", os.getenv("GUARDIAN_PORT", "8000")))
    GUARDIAN_ENABLED: bool = os.getenv("GUARDIAN_ENABLED", "true").lower() in ("true", "1", "yes")

    # Security Signing Keys
    GUARDIAN_SECRET_KEY: str = os.getenv(
        "GUARDIAN_SECRET_KEY", "GUARDIAN_DEV_HMAC_SECRET_KEY_DO_NOT_USE_IN_PROD"
    )
    CAPABILITY_TOKEN_SECRET: str = os.getenv(
        "CAPABILITY_TOKEN_SECRET", "GUARDIAN_DEV_CAPABILITY_SIGNING_SECRET_KEY"
    )

    # Capability Token TTL (seconds)
    CAPABILITY_TTL_SECONDS: int = int(os.getenv("CAPABILITY_TTL_SECONDS", "60"))
    APPROVAL_TTL_SECONDS: int = int(os.getenv("APPROVAL_TTL_SECONDS", "300"))

    # Demo fake secrets (purely simulated - never production)
    DEMO_API_KEY: str = os.getenv("DEMO_API_KEY", "GUARDIAN_FAKE_SECRET_12345")

    # Database
    DATABASE_PATH: Path = BASE_DIR / "guardianai.db"
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'guardianai.db'}")

    # Registered agent API keys for identity authentication
    AGENT_CREDENTIALS: dict = {
        "agent_analyst_01": "secret_key_analyst_001",
        "agent_dba_02": "secret_key_dba_002",
        "agent_demo_attacker": "secret_key_demo_attacker_003",
    }

    # Authentication & OTP Settings
    AUTH_SECRET_KEY: str = os.getenv(
        "AUTH_SECRET_KEY", "GUARDIAN_DEV_AUTH_SECRET_KEY_CHANGE_IN_PROD"
    )
    OTP_EXPIRY_MINUTES: int = int(os.getenv("OTP_EXPIRY_MINUTES", "5"))
    OTP_MAX_ATTEMPTS: int = int(os.getenv("OTP_MAX_ATTEMPTS", "5"))
    AUTH_SESSION_TTL_HOURS: int = int(os.getenv("AUTH_SESSION_TTL_HOURS", "24"))

    # SMTP Email Notification Settings
    GUARDIAN_SMTP_EMAIL: str = os.getenv("GUARDIAN_SMTP_EMAIL", "thatigiripavankumar@gmail.com")
    GUARDIAN_SMTP_APP_PASSWORD: str = os.getenv("GUARDIAN_SMTP_APP_PASSWORD", "")
    GUARDIAN_SMTP_HOST: str = os.getenv("GUARDIAN_SMTP_HOST", "smtp.gmail.com")
    GUARDIAN_SMTP_PORT: int = int(os.getenv("GUARDIAN_SMTP_PORT", "587"))
    DEFAULT_NOTIFICATION_EMAIL: str = os.getenv("DEFAULT_NOTIFICATION_EMAIL", "thatigiripavankumar@gmail.com")

settings = Settings()
