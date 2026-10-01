"""Data models and schemas for GuardianAI authentication."""

import time
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class OTPRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Full name of administrator")
    email: str = Field(..., description="Administrator email address")
    password: str = Field(..., min_length=6, description="Account password")


class OTPVerifyRequest(BaseModel):
    email: str = Field(..., description="Administrator email address")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")
    remember_me: Optional[bool] = Field(default=False, description="Persist session flag")


class AuthUser(BaseModel):
    id: str
    name: str
    email: str
    role: str = "Security Administrator"
    created_at: float = Field(default_factory=time.time)
    last_login: Optional[float] = None


class AuthUserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserResponse
    message: str = "Authentication successful"


class OTPRequestResponse(BaseModel):
    status: str
    message: str
    email: str
    dev_otp: Optional[str] = None
    is_dev_mode: bool = False


class LogoutResponse(BaseModel):
    status: str
    message: str
