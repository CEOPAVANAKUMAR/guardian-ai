"""Configuration for the demo autonomous AI agent."""

import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent

class AgentSettings(BaseModel):
    AGENT_ID: str = os.getenv("DEMO_AGENT_ID", "agent_analyst_01")
    AGENT_API_KEY: str = os.getenv("DEMO_AGENT_KEY", "secret_key_analyst_001")
    TASK_ID: str = os.getenv("DEMO_TASK_ID", "task_sales_report_001")

    GUARDIAN_URL: str = os.getenv("GUARDIAN_URL", "http://127.0.0.1:8000/api/v1")
    GUARDIAN_ENABLED: bool = os.getenv("GUARDIAN_ENABLED", "true").lower() in ("true", "1", "yes")

    # LLM Settings
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "mock")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
    LLM_API_KEY: str = os.getenv("LLM_API_KEY", "")

    # Susceptible mode flag for reliable evaluation of safety boundaries
    SUSCEPTIBLE_MODE: bool = os.getenv("SUSCEPTIBLE_MODE", "false").lower() in ("true", "1", "yes")

    DATA_DIR: Path = BASE_DIR / "demo_data"

agent_settings = AgentSettings()
