"""SMTP Email Service for GuardianAI.

Handles OTP delivery and security incident alerts with header injection protection
and a secure local development fallback mode.
"""

import logging
import re
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Any, Dict, Optional, Tuple

from backend.config import settings

logger = logging.getLogger("guardianai.notifications")

# Email regex validation
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


def validate_email_address(email: str) -> bool:
    """Validates email format and ensures no CRLF injection characters exist."""
    if not email or not isinstance(email, str):
        return False
    email = email.strip()
    # Prevent CRLF header injection
    if "\r" in email or "\n" in email or "%0a" in email.lower() or "%0d" in email.lower():
        return False
    return bool(EMAIL_REGEX.match(email))


def send_email(to_email: str, subject: str, body: str) -> Tuple[bool, str]:
    """Sends an email using configured SMTP credentials or safely falls back in dev mode.
    
    Returns:
        (success: bool, status_message: str)
    """
    to_email = to_email.strip()
    if not validate_email_address(to_email):
        return False, "Invalid recipient email address format."

    # Prevent header injection in subject
    clean_subject = subject.replace("\r", " ").replace("\n", " ").strip()

    # Check if SMTP app password is configured
    if not settings.GUARDIAN_SMTP_APP_PASSWORD:
        logger.info(
            f"[DEV FALLBACK EMAIL] Recipient: {to_email} | Subject: {clean_subject} | SMTP not configured."
        )
        return False, "SMTP credentials not configured. Operating in DEV fallback mode."

    try:
        msg = MIMEMultipart()
        msg["From"] = settings.GUARDIAN_SMTP_EMAIL
        msg["To"] = to_email
        msg["Subject"] = clean_subject
        msg.attach(MIMEText(body, "plain", "utf-8"))

        server = smtplib.SMTP(settings.GUARDIAN_SMTP_HOST, settings.GUARDIAN_SMTP_PORT, timeout=10)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(settings.GUARDIAN_SMTP_EMAIL, settings.GUARDIAN_SMTP_APP_PASSWORD)
        server.send_message(msg)
        server.quit()
        logger.info(f"Email sent successfully to {to_email}: {clean_subject}")
        return True, "Email dispatched successfully via secure SMTP."
    except Exception as exc:
        logger.error(f"Failed to send email to {to_email}: {exc}")
        return False, f"SMTP delivery failed: {str(exc)}"


def send_otp_email(to_email: str, otp: str) -> Tuple[bool, str]:
    """Sends the 6-digit OTP verification code matching the required template."""
    subject = "GuardianAI Security Verification Code"
    body = (
        "GuardianAI\n"
        "Runtime Trust Infrastructure\n\n"
        f"Your verification code is:\n\n"
        f"{otp}\n\n"
        f"This code expires in {settings.OTP_EXPIRY_MINUTES} minutes.\n\n"
        "If you did not request this authentication attempt,\n"
        "ignore this email.\n"
    )
    return send_email(to_email, subject, body)


def send_incident_alert(incident_data: Dict[str, Any], recipient_email: Optional[str] = None) -> Tuple[bool, str]:
    """Sends an incident notification email matching the required template."""
    target_email = recipient_email or settings.DEFAULT_NOTIFICATION_EMAIL
    severity = incident_data.get("risk_level", "ALERT")
    title = incident_data.get("problem_title", "Security Incident")
    subject = f"[GuardianAI {severity}] {title} Blocked"

    effects_text = "\n".join(f"- {e}" for e in incident_data.get("potential_effects", []))

    body = (
        "GuardianAI Security Alert\n\n"
        f"Incident:\n{title}\n\n"
        f"Severity:\n{severity}\n\n"
        f"Sector:\n{incident_data.get('sector', 'SECURITY')}\n\n"
        f"Agent:\n{incident_data.get('agent', 'Unknown Agent')}\n\n"
        f"Action:\n{incident_data.get('action', 'UNKNOWN')}\n\n"
        f"Decision:\n{incident_data.get('decision', 'DENY')}\n\n"
        f"What happened:\n{incident_data.get('problem_summary', '')}\n\n"
        f"Potential effects:\n{effects_text}\n\n"
        f"Recommended solution:\n{incident_data.get('recommended_solution', '')}\n\n"
        f"Timestamp:\n{incident_data.get('timestamp_iso', '')}\n\n"
        f"Incident ID:\n{incident_data.get('id', '')}\n"
    )

    return send_email(target_email, subject, body)
