"""Authentication service for GuardianAI.

Implements secure password hashing, single-use random OTP generation, attempt limiting,
expiration enforcement, session token issuance, and development fallbacks.
"""

import os
import time
import uuid
from typing import Any, Dict, Optional, Tuple

from backend.config import settings
from backend.auth.models import AuthUser, OTPRequest, OTPVerifyRequest
from backend.auth.security import (
    generate_otp,
    generate_session_token,
    hash_otp,
    hash_password,
    verify_otp_hash,
    verify_password,
)
from backend.notifications.email_service import send_otp_email, validate_email_address


class OTPRecord:
    def __init__(
        self,
        email: str,
        otp_hash: str,
        salt: bytes,
        expires_at: float,
        attempts_left: int,
        pending_name: Optional[str] = None,
        pending_password_hash: Optional[str] = None,
        plain_otp_dev_only: Optional[str] = None,
    ):
        self.email = email
        self.otp_hash = otp_hash
        self.salt = salt
        self.created_at = time.time()
        self.expires_at = expires_at
        self.attempts_left = attempts_left
        self.is_used = False
        self.pending_name = pending_name
        self.pending_password_hash = pending_password_hash
        self.plain_otp_dev_only = plain_otp_dev_only


class AuthService:
    def __init__(self):
        self._users: Dict[str, Dict[str, Any]] = {}
        self._otp_records: Dict[str, OTPRecord] = {}
        self._sessions: Dict[str, Dict[str, Any]] = {}

        # Seed default administrative identity with secure password hash
        default_admin_email = settings.GUARDIAN_SMTP_EMAIL.lower()
        self._users[default_admin_email] = {
            "id": "usr_admin_001",
            "name": "Pavan Kumar Thatigiri",
            "email": default_admin_email,
            "password_hash": hash_password("GuardianAdmin@2026"),
            "role": "Chief Information Security Officer",
            "created_at": time.time(),
            "last_login": None,
        }

    def request_otp(self, req: OTPRequest) -> Tuple[bool, str, Optional[str], bool]:
        """Validates credentials or registers identity, generates OTP, and dispatches email.
        
        Returns:
            (success: bool, message: str, dev_otp: Optional[str], is_dev_mode: bool)
        """
        email = req.email.strip().lower()
        if not validate_email_address(email):
            return False, "Invalid email address format.", None, False

        now = time.time()
        # Cooldown check: prevent rapid resend abuse (minimum 10 seconds between requests)
        existing_otp = self._otp_records.get(email)
        if existing_otp and not existing_otp.is_used and (now - existing_otp.created_at) < 10.0:
            return False, "Please wait 10 seconds before requesting another code.", None, False

        # Check existing user credentials
        user = self._users.get(email)
        if user:
            if not verify_password(req.password, user["password_hash"]):
                return False, "Invalid email or password for existing account.", None, False
            pending_name = user["name"]
            pending_pw_hash = user["password_hash"]
        else:
            # Registering new user
            pending_name = req.name.strip()
            pending_pw_hash = hash_password(req.password)

        otp_code = generate_otp()
        salt = os.urandom(16)
        otp_hash = hash_otp(otp_code, salt)
        expires_at = now + (settings.OTP_EXPIRY_MINUTES * 60)

        is_dev_mode = not bool(settings.GUARDIAN_SMTP_APP_PASSWORD)
        dev_otp = otp_code if is_dev_mode else None

        # Store OTP record
        record = OTPRecord(
            email=email,
            otp_hash=otp_hash,
            salt=salt,
            expires_at=expires_at,
            attempts_left=settings.OTP_MAX_ATTEMPTS,
            pending_name=pending_name,
            pending_password_hash=pending_pw_hash,
            plain_otp_dev_only=dev_otp,
        )
        self._otp_records[email] = record

        # Dispatch email
        email_sent, email_msg = send_otp_email(email, otp_code)

        if email_sent:
            return True, f"Security verification code dispatched to {email}.", None, False
        else:
            if is_dev_mode:
                return (
                    True,
                    f"DEV MODE: Verification code generated for {email}. (SMTP app password not configured)",
                    dev_otp,
                    True,
                )
            return False, f"Failed to deliver verification code: {email_msg}", None, False

    def verify_otp(self, req: OTPVerifyRequest) -> Tuple[bool, str, Optional[str], Optional[AuthUser]]:
        """Verifies 6-digit OTP code against record, checks expiration and attempts.
        
        Returns:
            (success: bool, message: str, token: Optional[str], user: Optional[AuthUser])
        """
        email = req.email.strip().lower()
        now = time.time()

        record = self._otp_records.get(email)
        if not record:
            return False, "No pending verification code found. Please request a new code.", None, None

        if record.is_used:
            return False, "This verification code has already been used. Please request a fresh code.", None, None

        if now > record.expires_at:
            return False, "Verification code has expired. Codes are valid for 5 minutes.", None, None

        if record.attempts_left <= 0:
            return False, "Maximum verification attempts exceeded. Code invalidated for security.", None, None

        # Verify OTP
        if not verify_otp_hash(req.otp.strip(), record.salt, record.otp_hash):
            record.attempts_left -= 1
            if record.attempts_left <= 0:
                return False, "Invalid verification code. Maximum attempts reached. Please request a new code.", None, None
            return False, f"Invalid verification code. {record.attempts_left} attempts remaining.", None, None

        # Successful verification: mark used
        record.is_used = True

        # Commit user account
        user_data = self._users.get(email)
        if not user_data:
            user_id = f"usr_{uuid.uuid4().hex[:10]}"
            user_data = {
                "id": user_id,
                "name": record.pending_name or "Security Administrator",
                "email": email,
                "password_hash": record.pending_password_hash,
                "role": "Security Administrator",
                "created_at": time.time(),
                "last_login": now,
            }
            self._users[email] = user_data
        else:
            user_data["last_login"] = now

        # Create session token
        token = generate_session_token()
        session_ttl = settings.AUTH_SESSION_TTL_HOURS * 3600
        self._sessions[token] = {
            "token": token,
            "user_id": user_data["id"],
            "email": email,
            "name": user_data["name"],
            "role": user_data["role"],
            "expires_at": now + session_ttl,
        }

        auth_user = AuthUser(
            id=user_data["id"],
            name=user_data["name"],
            email=user_data["email"],
            role=user_data["role"],
            created_at=user_data["created_at"],
            last_login=user_data["last_login"],
        )
        return True, "Authentication verified successfully.", token, auth_user

    def get_user_by_token(self, token: Optional[str]) -> Optional[AuthUser]:
        """Resolves authenticated user from session bearer token."""
        if not token:
            return None
        sess = self._sessions.get(token)
        if not sess:
            return None
        if time.time() > sess["expires_at"]:
            del self._sessions[token]
            return None
        user_data = self._users.get(sess["email"])
        if not user_data:
            return None
        return AuthUser(
            id=user_data["id"],
            name=user_data["name"],
            email=user_data["email"],
            role=user_data["role"],
            created_at=user_data["created_at"],
            last_login=user_data["last_login"],
        )

    def logout(self, token: Optional[str]) -> bool:
        """Invalidates the provided session token."""
        if token and token in self._sessions:
            del self._sessions[token]
            return True
        return False
