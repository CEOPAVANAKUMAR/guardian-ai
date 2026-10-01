# GuardianAI
## Runtime Trust Infrastructure for Autonomous AI Agents

[![Tests](https://img.shields.io/badge/Tests-51%20Passed-emerald.svg)](#testing)
[![Benchmark](https://img.shields.io/badge/Benchmark-100%25%20Accuracy-cyan.svg)](#benchmark)
[![Latency](https://img.shields.io/badge/Avg%20Latency-1.27ms-blue.svg)](#benchmark)
[![License](https://img.shields.io/badge/License-MIT-slate.svg)](#license)

---

### Core Security Axiom
> **"Untrusted information can influence what the AI thinks, but it cannot automatically increase what the AI is allowed to do."**

GuardianAI is an independent, deterministic runtime authorization firewall and Enterprise Security Operations Center (SOC) positioned between autonomous AI agents and sensitive enterprise systems (databases, file systems, internal APIs, and network egress).

---

## 1. The Problem: AI Can Be Tricked
Autonomous agents increasingly have tool access to execute database operations, read files, and call external APIs. When an agent processes untrusted inputs—such as a PDF invoice containing an indirect prompt injection—the model can be manipulated into proposing dangerous actions:
- Exfiltrating credentials to external servers.
- Dropping or wiping database tables.
- Accessing out-of-scope human resources or payroll records.

**GuardianAI assumes the AI will be fooled.**
Instead of relying on prompt defenses or probabilistic guardrails, GuardianAI completely separates **AI Reasoning** from **System Authority**. The AI proposes an action; GuardianAI independently and deterministically decides whether the system permits it.

---

## 2. Enterprise Console Architecture & Navigation

GuardianAI features a modern **Collapsible Left Sidebar** and unified Enterprise SOC console:
- **Overview**:
  - `Dashboard`: Global security posture, open/critical incident metrics, threat distribution, and sector breakdown.
  - `Live Feed`: Real-time streaming audit of agent authorization requests.
- **Security**:
  - `Attack Playground`: Interactive judge walkthrough with 9-stage evaluation flow and Guardian ON/OFF comparison.
  - `Approvals`: Human-in-the-loop escalation queue with cryptographic action-hash validation.
  - `Audit Chain`: HMAC-SHA256 tamper-evident cryptographic ledger with integrity verification and breach simulation.
- **Alerts**:
  - `Security Incident Center (/incidents)`: Deterministic sector classification, 4-part forensic problem analysis, status triage, and report dispatch via SMTP.
- **System**:
  - Runtime gateway status, Guardian ON/OFF toggle, and authenticated user session management.

```
USER / UNTRUSTED ATTACHMENT
            |
            v
+------------------------------------+
|   AUTONOMOUS AI AGENT (UNTRUSTED)  |
|   - Reasoning & Tool Proposal      |
+------------------------------------+
            |
            v  POST /api/v1/authorize
+------------------------------------+
|        GUARDIANAI GATEWAY          |
|  1. Identity & Session Binding     |
|  2. Task Scope Manifest Check      |
|  3. Monotonic Taint Progression    |
|  4. AST SQL Security (sqlglot)     |
|  5. Deterministic Policy Engine    |
|  6. Monotonic Decision Merger      |
|  7. HMAC-SHA256 Audit Chaining     |
|  8. Auto Incident Classification   |
+------------------------------------+
     |                          |
Decision: ESCALATE/DENY    Decision: ALLOW
     |                          |
     v                          v
+------------------+    +----------------------+
| HUMAN APPROVAL   |    | CAPABILITY TOKEN     |
| & INCIDENT CENTER|    | - Single-use nonce   |
| - Safe COUNT(*)  |    | - Signed HMAC-SHA256 |
| - Hash binding   |    +----------------------+
| - SMTP Alerting  |
+------------------+
     | (Approved)               |
     +------------+-------------+
                  |
                  v  POST /api/v1/execute
+------------------------------------+
|    PROTECTED EXECUTION ENGINE      |
|  - Verifies token & single-use     |
|  - Verifies canonical action hash  |
|  - Output sanitization / filtering |
+------------------------------------+
                  |
                  v
+------------------------------------+
|    ISOLATED DATABASE & SYSTEMS     |
+------------------------------------+
```

---

## 3. Core Security Subsystems

### 1. Enterprise Authentication & Email OTP
- Split-screen enterprise login (`/login`) with 55% cybersecurity presentation panel and 45% dark glass authentication card.
- PBKDF2-HMAC-SHA256 password hashing.
- Cryptographically secure 6-digit random OTP with 5-minute expiration and 5 max attempts.
- Automated email delivery via SMTP or labeled local DEV fallback.

### 2. Security Incident Center & Deterministic Sector Classification
Every blocked action, human escalation, action-hash mismatch, or audit tampering automatically registers a structured incident (`INC-2026-XXX`).
- **Deterministic Sector Classification**: Categorizes incidents into 8 sectors without probabilistic guessing:
  - `CREDENTIAL / SECRET SECURITY`
  - `DATABASE SECURITY`
  - `AI / LLM SECURITY` & `DOCUMENT SECURITY`
  - `DATA SECURITY / EXFILTRATION`
  - `HUMAN APPROVAL SECURITY`
  - `AUDIT & COMPLIANCE`
  - `IDENTITY & ACCESS`
- **4-Part Forensic Problem Analysis**:
  1. *What Happened?* (Action, agent, target, timestamp)
  2. *Why Did GuardianAI Flag It?* (Policy, rule violation, taint tag)
  3. *Potential Effects* (Impact on integrity, data, operations)
  4. *One Primary Recommended Solution* (Concrete remediation)
- **Incident Dispatch via SMTP**: Export and email forensic incident reports directly to any custom recipient email.

### 3. Real-Time Warning & Alert System
- Active bell notification counter with unread alert badges.
- Animated toast alerts for `CRITICAL` and `HIGH` security incidents.
- Quick navigation directly into forensic incident analysis modals.

### 4. Deterministic Fail-Closed Policy Engine
System authority is **never** determined by an LLM prompt. Policy evaluation produces one of four ranked decisions:
$$\text{ALLOW} < \text{ALLOW\_WITH\_CONSTRAINTS} < \text{ESCALATE} < \text{DENY}$$
The monotonic merger always selects the most restrictive result. Any policy exception or unexpected state immediately triggers fail-closed `DENY`.

### 5. Server-Side Provenance & Monotonic Taint
When an agent reads external documents (e.g. supplier invoices), GuardianAI ingests and inspects the file server-side. The session is tagged `EXTERNAL_UNTRUSTED`. Taint is strictly monotonic:
- The agent cannot clear, downgrade, or bypass its taint label.
- Tainted sessions are forbidden from accessing secrets or executing outbound egress.

### 6. AST SQL Security Firewall (Powered by `sqlglot`)
Inspects the complete abstract syntax tree:
- Multi-statement queries rejected.
- Catastrophic operations (`DROP TABLE`, `ALTER`, `TRUNCATE`) blocked unconditionally.
- Administrative commands (`PRAGMA`, `ATTACH`) blocked.
- CTE-wrapped destructive operations detected and rejected.
- `DELETE` without `WHERE` clause blocked; scoped `DELETE` escalated to human approval with automatic impact calculation.
- `SELECT` queries automatically rewritten to enforce strict row limits.

### 7. Canonical Action Hash Binding
Actions are canonicalized: $\text{Hash} = \text{SHA256}(\text{ActionType} \mathbin{\Vert} \text{Resource} \mathbin{\Vert} \text{Params})$. Human approvals and capability tokens are cryptographically locked to this exact hash. If a prompt-injected agent modifies query parameters after human approval, GuardianAI detects `ACTION_HASH_MISMATCH` and terminates execution.

### 8. Short-Lived Single-Use Capability Tokens
When an action is approved, GuardianAI generates a signed capability token containing a single-use cryptographic nonce and a 60-second expiration. Replay attacks are rejected with `403 FORBIDDEN`.

### 9. Cryptographic Tamper-Evident Audit Chain
Every authorization decision is recorded in an HMAC-SHA256 linked ledger:
$$\text{CurrentHash} = \text{HMAC}(\text{PrevHash} \mathbin{\Vert} \text{Action} \mathbin{\Vert} \text{Decision} \mathbin{\Vert} \dots)$$
Any unauthorized modification of historical records breaks the cryptographic hash pointer, which is immediately flagged during `verify_integrity()`.

---

## 4. Benchmark Results

Measured empirically across 50 fixed security and authorization test cases:

| Metric | Result | Description |
| :--- | :---: | :--- |
| **Total Test Cases** | **50** | Fixed test cases across 8 distinct categories |
| **Accuracy** | **100.0%** | Zero policy errors or misclassifications |
| **Blocked Malicious** | **39 / 39** | 100% of malicious attempts intercepted |
| **Unsafe Allowed** | **0** | Zero unsafe or unauthorized actions permitted |
| **False Positives** | **0** | Zero benign operations falsely blocked |
| **Escalated Operations** | **5** | All destructive operations routed to human review |
| **Median Latency (p50)** | **0.52 ms** | Sub-millisecond deterministic authorization |
| **95th Percentile (p95)** | **5.98 ms** | Fast response under full AST parse and dry-run |
| **99th Percentile (p99)** | **15.78 ms** | Worst-case gate latency |
| **Average Latency** | **1.27 ms** | Extremely lightweight runtime overhead |

*Raw results saved to `bench/results.json`.*

---

## 5. Quick Start Guide (Windows / Linux / macOS)

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### Environment & Email Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
To enable live Gmail OTP and Incident Alert delivery:
1. Visit [Google App Passwords](https://myaccount.google.com/apppasswords).
2. Generate an App Password for "Mail".
3. Set your 16-character password in `.env`:
```env
GUARDIAN_SMTP_EMAIL=thatigiripavankumar@gmail.com
GUARDIAN_SMTP_APP_PASSWORD=your_16_char_app_password
GUARDIAN_SMTP_HOST=smtp.gmail.com
GUARDIAN_SMTP_PORT=587
DEFAULT_NOTIFICATION_EMAIL=thatigiripavankumar@gmail.com
```
*Note: If no App Password is provided, GuardianAI runs in DEV fallback mode, securely logging OTPs in the console and displaying an on-screen preview.*

### One-Click Startup

#### On Windows:
Double-click `run_demo.bat` or run:
```cmd
run_demo.bat
```

#### On Linux / macOS:
```bash
chmod +x run_demo.sh
./run_demo.sh
```

### Accessing the Applications
- **Cybersecurity Frontend Dashboard**: `http://localhost:5173` (opens `/login`)
- **GuardianAI Backend API**: `http://127.0.0.1:8000`
- **Interactive Swagger Documentation**: `http://127.0.0.1:8000/docs`

---

## 6. Manual Setup & Running Tests

### 1. Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### 2. Install Frontend Dependencies & Build
```bash
cd frontend
npm install
npm run build
cd ..
```

### 3. Run Pytest Test Suite
```bash
pytest -q
```
*Expected: 51 passed in ~5 seconds.*

### 4. Run Benchmark Suite
```bash
python scripts/benchmark.py
```

### 5. Start Backend Manually
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 6. Start Frontend Manually
```bash
cd frontend
npm run dev
```

---

## 7. Interactive Walkthrough & Testing

1. Open **`http://localhost:5173`**:
   - Enter your name, email, and password.
   - Click **"SEND OTP"**. Check your Gmail inbox (or DEV banner) and verify the 6-digit code.
2. Navigate via the **Left Sidebar**:
   - Check **Overview -> Dashboard**: review Security Posture, Threat Distribution, and Incidents by Sector.
   - Click **Security -> Attack Playground**:
     - Ensure **`GUARDIAN: ON (ACTIVE)`** is enabled.
     - Test **"3. Poisoned PDF Attack"** -> Denied and logged to **Security Incidents**.
     - Test **"5. Scoped Database Delete"** -> Escalated to human review.
   - Check **Security -> Approvals**:
     - Click **"APPROVE"** or test **Action Hash Mismatch**.
   - Check **Alerts -> Security Incident Center**:
     - Filter incidents by severity and sector.
     - Click any incident card to view the 4-part forensic problem analysis.
     - Click **"SHARE SECURITY REPORT"** to dispatch the report via SMTP to any custom recipient.
   - Check **Security -> Audit Chain**:
     - Click **"VERIFY AUDIT CHAIN"** -> Valid HMAC ledger.
     - Click **"SIMULATE TAMPERING"** -> Flags broken integrity and creates a CRITICAL security incident.

---

## 8. Enterprise Documentation
- [ENTERPRISE_UPGRADE.md](docs/ENTERPRISE_UPGRADE.md) - Architecture and implementation log.
- [AUTHENTICATION.md](docs/AUTHENTICATION.md) - Authentication & OTP specifications.
- [INCIDENT_RESPONSE.md](docs/INCIDENT_RESPONSE.md) - Problem analysis and deterministic sector classifications.
- [EMAIL_SETUP.md](docs/EMAIL_SETUP.md) - SMTP configuration and Gmail App Passwords.
- [FINAL_VERIFICATION_REPORT.md](docs/FINAL_VERIFICATION_REPORT.md) - Comprehensive verification matrix and test log.
- [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) - Production cloud and Docker deployment guide.

---

## 9. Technology Stack
- **Backend**: Python 3.11+, FastAPI, Pydantic v2, SQLAlchemy, SQLite, sqlglot, PyMuPDF, pytest
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React
- **Security & Crypto**: PBKDF2-HMAC-SHA256, HMAC-SHA256 Audit Chaining, SHA-256 Action Hashing, Single-Use Nonces

## Continuous Identity & Insider Misuse Attribution (new)

> *Authentication tells us which account logged in. GuardianAI determines whether the current session still matches
> that identity and whether the data is being used for an authorized purpose.*

A new **Identity Attribution** page separates the *claimed account*, *device owner*, *verified operator* and
*likely operator*, shows identity confidence (never 100%), risk score, evidence and a timeline, and applies
deterministic decisions (LOW -> ALLOW, MEDIUM -> STEP-UP VERIFY, HIGH -> BLOCK, CRITICAL -> BLOCK + REVOKE SESSION +
CREATE INCIDENT). When evidence is thin it says **ACTUAL OPERATOR UNKNOWN**. Four demo scenarios are available on the
page and in the Attack Playground, and results flow into the Incident Center and Audit Chain. No LLM, webcam,
microphone, keylogging or screen recording is involved. See [docs/IDENTITY_ATTRIBUTION.md](docs/IDENTITY_ATTRIBUTION.md).
