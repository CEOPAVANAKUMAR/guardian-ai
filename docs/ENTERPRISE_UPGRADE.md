# GuardianAI Enterprise Architecture Upgrade

## Overview
GuardianAI has been upgraded from a prototype demonstration dashboard into a mission-critical **Enterprise AI-Agent Security Operations Center (SOC) and Runtime Authorization Gateway**. 

The upgrade maintains **100% backward compatibility** with all existing GuardianAI authorization pipelines, deterministic policies, AST SQL analyzers, HMAC audit chains, and human-in-the-loop approvals, while adding an enterprise authentication system, a security incident analysis center, and real-time alerting.

---

## Architecture Summary

```
                      +-----------------------------+
                      |      AI Agent Request       |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |   1. Agent Authentication   |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      | 2. Session & Taint Tracking |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      | 3. Task Manifest Boundary   |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |  4. SQL AST Safety Analyzer |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      | 5. Deterministic Evaluator  |
                      +--------------+--------------+
                                     |
             +-----------------------+-----------------------+
             |                       |                       |
             v                       v                       v
      +--------------+       +---------------+       +---------------+
      |    ALLOW     |       |   ESCALATE    |       |     DENY      |
      +------+-------+       +-------+-------+       +-------+-------+
             |                       |                       |
             v                       v                       v
     Capability Token        Human Review Ticket     Incident Created
             |                       |                       |
             +-----------------------+-----------------------+
                                     |
                                     v
                      +-----------------------------+
                      |   Tamper-Evident HMAC Log   |
                      +-----------------------------+
```

---

## Key Enterprise Upgrades

### 1. Enterprise Authentication & Split-Screen Login
- Dedicated `/login` page with a **55% / 45% split layout**.
- **Left Panel (55%)**: Enterprise cybersecurity identity showcasing the 6 pillars of GuardianAI:
  1. *Runtime Authorization*
  2. *Least Privilege*
  3. *Prompt Injection Defense*
  4. *Human-in-the-Loop*
  5. *Tamper-Evident Audit*
  6. *Deterministic Enforcement*
- **Right Panel (45%)**: Glass-dark administration login with 2-step verification (Password + 6-digit random email OTP).
- Cryptographic PBKDF2-HMAC-SHA256 password hashing and secure bearer token issuance.

### 2. Collapsible Left Sidebar & Top Header
- Replaced the legacy top navigation bar with an enterprise **Collapsible Left Sidebar** featuring:
  - OVERVIEW: Dashboard, Live Feed
  - SECURITY: Attack Playground, Approvals, Audit Chain
  - ALERTS: Security Incidents (with real-time open incident badge)
  - SYSTEM: Gateway Status & Guardian Protection Status
  - User identity panel and secure logout button.
- Compact Top Header displaying page context, Guardian ON/OFF toggle switch, unread alert bell, and gateway status.

### 3. Security Incident Center (`/incidents`)
Whenever GuardianAI blocks a threat, escalates an action, or detects tampering:
- Automatically creates a cryptographically-indexed **Security Incident** (`INC-2026-XXX`).
- **Deterministic Sector Classification**: Categorizes incidents into Credential Security, LLM/Document Security, Database Security, Human Approval Security, Audit Compliance, Network Communication, Identity & Access, or API Security.
- **Forensic Problem Analysis**:
  - *What Happened?*
  - *Why Did GuardianAI Flag It?*
  - *What Could Be Affected?* (Catalog of organizational impact points)
  - *What Should Be Done?* (One primary recommended solution)
- **Incident Report Sharing**: Allows administrators to dispatch forensic security reports via SMTP to any custom recipient email.

### 4. Incident Warning & Alert System
- Real-time notification toast triggers immediately when critical or high-risk threats are intercepted.
- Notification bell dropdown provides fast triage directly from the top navigation bar.
- Automatic email dispatching to administrator (`thatigiripavankumar@gmail.com`) upon critical violations.
