"""Cryptographic security utilities for authentication in GuardianAI."""

import hashlib
import hmac
import os
import secrets
from typing import Tuple


def hash_password(password: str) -> str:
    """Hashes a password using PBKDF2-HMAC-SHA256 with a unique cryptographic salt."""
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations=100_000,
    )
    return f"{salt.hex()}:{key.hex()}"


def verify_password(plain_password: str, stored_hash: str) -> bool:
    """Verifies a plain password against the stored salt:hash string using constant-time comparison."""
    try:
        salt_hex, key_hex = stored_hash.split(":")
        salt = bytes.fromhex(salt_hex)
        expected_key = bytes.fromhex(key_hex)
        recomputed_key = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt,
            iterations=100_000,
        )
        return hmac.compare_digest(expected_key, recomputed_key)
    except Exception:
        return False


def hash_otp(otp: str, salt: bytes) -> str:
    """Hashes an OTP to prevent in-memory plaintext OTP exposure."""
    return hashlib.sha256(salt + otp.encode("utf-8")).hexdigest()


def verify_otp_hash(plain_otp: str, salt: bytes, expected_hash: str) -> bool:
    """Verifies an OTP against its hashed counterpart using constant-time comparison."""
    recomputed = hashlib.sha256(salt + plain_otp.encode("utf-8")).hexdigest()
    return hmac.compare_digest(expected_hash, recomputed)


def generate_otp() -> str:
    """Generates a random 6-digit one-time password."""
    return f"{secrets.randbelow(1_000_000):06d}"


def generate_session_token() -> str:
    """Generates a secure random session bearer token."""
    return secrets.token_hex(32)
