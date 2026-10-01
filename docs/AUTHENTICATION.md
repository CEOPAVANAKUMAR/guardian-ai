# GuardianAI Authentication System

## Architecture

The GuardianAI Enterprise console implements a zero-trust administration authentication layer combining strong credential validation with single-use Email One-Time Passwords (OTP).

---

## Authentication Endpoints

### 1. Request Verification Code
- **Endpoint**: `POST /api/v1/auth/request-otp`
- **Request Body**:
  ```json
  {
    "name": "Pavan Kumar Thatigiri",
    "email": "thatigiripavankumar@gmail.com",
    "password": "GuardianAdmin@2026"
  }
  ```
- **Response**:
  ```json
  {
    "status": "OTP_SENT",
    "message": "Security verification code dispatched to thatigiripavankumar@gmail.com.",
    "email": "thatigiripavankumar@gmail.com",
    "dev_otp": "XXXXXX",
    "is_dev_mode": true
  }
  ```

### 2. Verify OTP & Obtain Session Token
- **Endpoint**: `POST /api/v1/auth/verify-otp`
- **Request Body**:
  ```json
  {
    "email": "thatigiripavankumar@gmail.com",
    "otp": "123456",
    "remember_me": true
  }
  ```
- **Response**:
  ```json
  {
    "access_token": "a1b2c3d4e5f60718293a4b5c6d7e8f90...",
    "token_type": "bearer",
    "user": {
      "id": "usr_admin_001",
      "name": "Pavan Kumar Thatigiri",
      "email": "thatigiripavankumar@gmail.com",
      "role": "Chief Information Security Officer"
    },
    "message": "Authentication verified successfully."
  }
  ```

### 3. Terminate Session
- **Endpoint**: `POST /api/v1/auth/logout`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:
  ```json
  {
    "status": "LOGGED_OUT",
    "message": "Session terminated successfully."
  }
  ```

### 4. Authenticated Identity Profile
- **Endpoint**: `GET /api/v1/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: User profile JSON.

---

## Security Guarantees

1. **Password Hashing**: Passwords are never stored in plaintext. Passwords use `PBKDF2-HMAC-SHA256` with a unique 16-byte cryptographic salt and 100,000 iterations.
2. **Timing Attack Protection**: Password and OTP verification use constant-time `hmac.compare_digest` comparisons.
3. **Random 6-Digit OTP**: Generated using Python's cryptographically secure `secrets.randbelow(1_000_000)`.
4. **Time-Based Expiration**: OTPs strictly expire after 5 minutes (`OTP_EXPIRY_MINUTES=5`).
5. **Single-Use Enforcement**: Once verified, the OTP record is permanently marked as consumed (`is_used = True`). Subsequent replay attempts are rejected.
6. **Brute-Force Rate Limiting**: Each OTP is restricted to a maximum of 5 attempts (`OTP_MAX_ATTEMPTS=5`).
7. **Local DEV Fallback**: When SMTP credentials are not configured, GuardianAI operates in local DEV mode: the code is displayed cleanly in the UI and server trace to allow local evaluation without configuring Gmail SMTP. In production mode, the OTP is strictly delivered via SMTP and never exposed in responses.
