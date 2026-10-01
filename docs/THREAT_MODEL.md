# GuardianAI Threat Model

## 1. Threat Assumptions
- **The AI Agent is Untrusted**: The LLM reasoning engine may hallucinate, experience memory confusion, or be completely compromised via direct or indirect prompt injection.
- **Untrusted External Data**: Files, documents, emails, and web pages ingested by the agent are assumed to be potentially adversarial.
- **Attacker Capabilities**:
  - Embedding hidden instructions inside PDF invoices.
  - Attempting to trick the agent into requesting secret files (`fake_secrets.env`).
  - Attempting to trick the agent into exfiltrating credentials to external addresses (`attacker@example.invalid`).
  - Attempting SQL injection or catastrophic commands (`DROP TABLE`, unconstrained `DELETE`).
  - Attempting to replay, reuse, or modify capability tokens.
  - Attempting to alter approved queries or tamper with audit logs.

---

## 2. Threat Vector Mitigations

| Threat | Attack Vector | GuardianAI Mitigation |
| :--- | :--- | :--- |
| **Indirect Prompt Injection** | Malicious text in invoice PDF instructs agent to steal secrets | Server-side document ingestion marks session `EXTERNAL_UNTRUSTED`. Taint engine blocks secret reads and egress. |
| **Direct Prompt Injection / Jailbreak** | User commands agent to execute system command or drop tables | Base security policies and AST analyzer block system commands and DDL statements unconditionally. |
| **SQL Injection & Multi-Statement** | Injected `; DROP TABLE customers;` or CTE-wrapped delete | `sqlglot` AST parser rejects multiple statements and detects hidden destructive commands in CTE subtrees. |
| **Destructive Data Loss** | Agent attempts mass deletion (`DELETE FROM customers`) | Unconstrained DELETE is blocked (`DENY`). Scoped DELETE requires human escalation with safe COUNT preview. |
| **Capability Replay / Nonce Reuse** | Attacker replays valid capability token to re-execute action | Capability tokens use cryptographic nonces recorded in memory/storage. Reusing token results in `403 FORBIDDEN`. |
| **Approval Tampering (Parameter Swapping)**| Human approves `DELETE WHERE id < 10`; attacker swaps to `DELETE ALL` | Approval binds to canonical `SHA256(action)` hash. Mismatched hashes trigger `ACTION_HASH_MISMATCH` and block execution. |
| **Audit Log Tampering** | Insider modifies audit entry to cover tracks | HMAC-SHA256 hash chaining detects any altered record or broken pointer during `verify_integrity()`. |
| **Agent Identity Spoofing** | Rogue agent claims another agent's session or task | Gateway enforces credential matching and rejects requests where agent ID mismatches session or manifest owner. |

---

## 3. Residual Risks & Future Hardening
- **LLM Output Hallucination within Allowed Scope**: If an agent is allowed to read sales data, it might summarize it inaccurately. GuardianAI secures the system boundary, not the textual style of the summary.
- **Side-Channel Timing Attacks**: Sub-2ms response times minimize timing side channels; constant-time string comparisons (`hmac.compare_digest`) prevent token signature attacks.
