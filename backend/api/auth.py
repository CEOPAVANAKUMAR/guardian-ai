"""Authentication API endpoints for GuardianAI."""

from fastapi import APIRouter, Depends, Header, HTTPException, status
from typing import Optional

from backend.auth.models import (
    AuthTokenResponse,
    AuthUserResponse,
    LogoutResponse,
    OTPRequest,
    OTPRequestResponse,
    OTPVerifyRequest,
)
from backend.core.container import get_container, ServiceContainer

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_current_user_optional(
    authorization: Optional[str] = Header(None),
    container: ServiceContainer = Depends(get_container),
):
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "").strip()
    return container.auth_service.get_user_by_token(token)


def require_authenticated_user(
    authorization: Optional[str] = Header(None),
    container: ServiceContainer = Depends(get_container),
):
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.replace("Bearer ", "").strip()
    user = container.auth_service.get_user_by_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@router.post("/request-otp", response_model=OTPRequestResponse)
def request_otp(
    payload: OTPRequest,
    container: ServiceContainer = Depends(get_container),
):
    """Requests a 6-digit one-time password sent via secure email or dev fallback."""
    success, message, dev_otp, is_dev = container.auth_service.request_otp(payload)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    return OTPRequestResponse(
        status="OTP_SENT",
        message=message,
        email=payload.email.strip().lower(),
        dev_otp=dev_otp,
        is_dev_mode=is_dev,
    )


@router.post("/verify-otp", response_model=AuthTokenResponse)
def verify_otp(
    payload: OTPVerifyRequest,
    container: ServiceContainer = Depends(get_container),
):
    """Verifies the 6-digit OTP code and issues a secure session bearer token."""
    success, message, token, user = container.auth_service.verify_otp(payload)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user=AuthUserResponse(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role,
        ),
        message=message,
    )


@router.post("/logout", response_model=LogoutResponse)
def logout(
    authorization: Optional[str] = Header(None),
    container: ServiceContainer = Depends(get_container),
):
    """Invalidates the caller's active session token."""
    token = authorization.replace("Bearer ", "").strip() if authorization else None
    container.auth_service.logout(token)
    return LogoutResponse(status="LOGGED_OUT", message="Session terminated successfully.")


@router.get("/me", response_model=AuthUserResponse)
def get_current_user(
    user=Depends(require_authenticated_user),
):
    """Returns the authenticated administrator profile."""
    return AuthUserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
    )
