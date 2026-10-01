# GuardianAI Security Incident Center & Forensic Response

## Overview
GuardianAI treats every policy denial, human review escalation, action tampering, and audit discrepancy as an auditable **Security Incident**. The Security Incident Center (`/incidents`) replaces guesswork with deterministic forensic analysis and actionable mitigation solutions.

---

## Deterministic Sector Classification Matrix

GuardianAI categorizes security events deterministically based on action types, resources, taint states, and AST analysis:

| Trigger Action / Condition | Classified Security Sector | Example Problem Title |
| :--- | :--- | :--- |
| `READ_SECRET`, credential file access | **CREDENTIAL / SECRET SECURITY** | Unauthorized Secret Access |
| Ingested PDF, indirect injection payload, tainted session | **AI / LLM SECURITY & DOCUMENT SECURITY** | Prompt Injection via Poisoned Document |
| `DB_DELETE`, unconstrained `WHERE`, `DROP TABLE` | **DATABASE SECURITY** | Dangerous Database Mutation Intercepted |
| Action hash altered between approval and execution | **HUMAN APPROVAL SECURITY** | Human Approval Action Hash Mismatch |
| Audit chain hash or signature mismatch | **AUDIT & COMPLIANCE** | Audit Integrity Failure |
| `EXTERNAL_SEND`, untrusted recipient address | **DATA SECURITY & NETWORK COMMUNICATION** | Unauthorized Data Exfiltration Attempt |
| Invalid agent key, session-agent identity spoofing | **IDENTITY & ACCESS** | Agent Authentication Anomaly |
| Access outside declared task manifest boundary | **API SECURITY** | Task Manifest Boundary Violation |

---

## Forensic Problem Analysis Structure

Every incident reported in GuardianAI contains four standardized forensic dimensions:

### 1. What Happened?
A clear factual summary describing the exact action proposed by the agent, the target resource, and the operational session context.

### 2. Why Did GuardianAI Flag It?
Deep technical rationale explaining the triggered deterministic policy, AST syntax evaluation, provenance taint tag, or cryptographic verification failure.

### 3. What Could Be Affected? (Potential Effects)
An enumerated catalog of organizational risks if the proposed action had executed without the GuardianAI authorization boundary:
- Credential exposure and lateral movement
- Production database deletion and system downtime
- Compliance violations (SOC2, GDPR, HIPAA, PCI-DSS)
- Prompt injection propagation across multi-agent pipelines
- Concealment of breach forensics.

### 4. What Should Be Done? (One Primary Solution)
A single, prioritized, unambiguous remediation directive:
- *Credential Access*: Revoke secret access, preserve deny decision, inspect document source, and rotate credentials.
- *Prompt Injection*: Quarantine originating document, enforce monotonic session taint isolation, and restrict agent to read-only tools.
- *Database Mutation*: Require human review with dry-run impact inspection, enforce parameterized queries, and verify table snapshots.
- *Hash Mismatch*: Void capability token, block execution, alert security operations, and re-issue review with fresh canonical hashing.
- *Audit Failure*: Isolate audit store, preserve forensic evidence, and restore ledger from trusted backup.

---

## Incident Sharing & Reporting

Administrators can dispatch complete incident forensic reports directly to any auditor or incident responder via the **Share Security Report** feature. The backend validates the recipient address, prevents CRLF header injection, limits submission rates, and records the sharing event in the immutable HMAC audit chain.
