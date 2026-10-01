# GuardianAI Functional Specification

## 1. Executive Summary
GuardianAI is an independent, deterministic runtime authorization and security firewall for autonomous AI agents. It operates on the core axiom:
> **"Untrusted information can influence what the AI thinks, but it cannot automatically increase what the AI is allowed to do."**

By completely separating **AI Reasoning** from **System Authority**, GuardianAI guarantees that even if an autonomous LLM is tricked by prompt injection, jailbroken, or confused, all downstream system interactions (databases, file systems, APIs, network egress) remain governed by mathematically deterministic security policies.

---

## 2. System Objectives
1. **Zero-Trust AI Execution**: Treat the LLM as an unprivileged, untrusted agent.
2. **Deterministic Fail-Closed Policy Enforcement**: System authority is NEVER decided by an LLM prompt or probabilistic scoring.
3. **Monotonic Taint Tracking**: Server-side document ingestion taints sessions upon encountering untrusted external content. Taint is monotonic and cannot be cleared by the agent.
4. **AST-Level SQL Security**: Full AST parsing via `sqlglot` prevents SQL injection, multi-statement attacks, and unauthorized deletions/drops.
5. **Cryptographic Action Hash Binding**: Actions are canonicalized to SHA-256 hashes. Human approvals and capability tokens are cryptographically bound to this exact hash.
6. **Single-Use Capability Tokens**: Authorization decisions issue short-lived, signed, nonce-protected tokens required for tool execution.
7. **Tamper-Evident Audit Logging**: Decisions are recorded in an HMAC-SHA256 hash-chained ledger verifying complete integrity.

---

## 3. Decision Matrix & Monotonic Merger
Decisions adhere to a strict total order:
$$\text{ALLOW} < \text{ALLOW\_WITH\_CONSTRAINTS} < \text{ESCALATE} < \text{DENY}$$

| Decision | Meaning | Action Taken |
| :--- | :--- | :--- |
| **ALLOW** | Fully authorized under task scope | Issues single-use capability token |
| **ALLOW_WITH_CONSTRAINTS** | Authorized with mandatory guardrails (e.g., row limits) | Issues constrained capability token |
| **ESCALATE** | High-impact legitimate operation requiring human review | Generates approval ticket with dry-run impact preview |
| **DENY** | Prohibited by policy, scope, taint, or AST check | Blocks execution immediately; logs audit record |

**Merger Rule**: When multiple policies or inspectors evaluate an action request, the merger selects $\max(\text{rank})$. Any policy yielding `DENY` produces a final `DENY`. Any unexpected error or unhandled exception triggers fail-closed `DENY`.

---

## 4. Ingest and Taint Progression
- `CLEAN` (Rank 0): Session initialized; internal task context.
- `INTERNAL_VERIFIED` (Rank 1): Authenticated internal data.
- `EXTERNAL_UNTRUSTED` (Rank 2): External documents (PDFs, text) ingested.
- `INDIRECT_INJECTION_SUSPECT` (Rank 3): Injection indicators discovered in ingested text.

Taint updates are strictly monotonic:
$$\text{NewTaint} = \max(\text{CurrentTaint}, \text{IncomingTaint})$$
No agent command or prompt can reduce or clear session taint.
