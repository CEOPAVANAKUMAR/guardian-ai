# GuardianAI Email & SMTP Notification Setup

## Configuration

GuardianAI dispatches two types of automated security emails:
1. **Authentication OTP Codes**: 6-digit login verification codes.
2. **Security Incident Alerts & Reports**: Automated alerts for HIGH/CRITICAL incidents and on-demand forensic reports shared to custom recipients.

The default administrative and sender email address is:
```
thatigiripavankumar@gmail.com
```

---

## Environment Variables

Configure the following settings in your local `.env` file:

```ini
# Administrator & Sender Email
GUARDIAN_SMTP_EMAIL=thatigiripavankumar@gmail.com

# Gmail 16-character App Password (Leave blank for DEV fallback mode)
GUARDIAN_SMTP_APP_PASSWORD=

# SMTP Server & Port
GUARDIAN_SMTP_HOST=smtp.gmail.com
GUARDIAN_SMTP_PORT=587

# Default Notification Recipient
DEFAULT_NOTIFICATION_EMAIL=thatigiripavankumar@gmail.com
```

---

## Gmail App Password Setup Instructions

To send real emails using a Gmail account:

1. **Enable 2-Step Verification**:
   - Go to your Google Account: [https://myaccount.google.com/security](https://myaccount.google.com/security)
   - Ensure **2-Step Verification** is turned ON.

2. **Generate an App Password**:
   - In Google Account Security, search for **App passwords** (or go to [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
   - Under "App name", enter `GuardianAI`.
   - Click **Create**.
   - Google will display a 16-character password (e.g. `abcd efgh ijkl mnop`).

3. **Configure GuardianAI**:
   - Copy the 16-character password into your `.env` file:
     ```ini
     GUARDIAN_SMTP_APP_PASSWORD=abcd efgh ijkl mnop
     ```

> **SECURITY NOTE**: Never commit your `.env` file or paste your Gmail App Password into Git repositories. GuardianAI excludes `.env` in `.gitignore`.

---

## Local Development Fallback Mode

If `GUARDIAN_SMTP_APP_PASSWORD` is left empty or if SMTP connectivity is unavailable:
- GuardianAI seamlessly switches to **DEV Fallback Mode**.
- For login OTP requests: The 6-digit verification code is displayed directly on the screen and logged to the server console for immediate testing without external dependencies.
- For incident alert emails: The alert content is logged to the server telemetry trace and incident status is marked accordingly.
- No production behavior is weakened, and local judges or evaluators can test the complete system instantly without setting up SMTP.
