# GuardianAI Known Limitations & Scope Boundaries

## 1. Scope of Protection
GuardianAI is designed as a **runtime authorization and security gateway** positioned between autonomous AI agents and sensitive system capabilities (databases, file systems, internal APIs, and network egress).

### What GuardianAI Protects:
- Enforces strict boundaries on what actions and tools an AI agent can execute.
- Prevents prompt-injected or compromised agents from stealing secrets or mutating systems without authorization.
- Enforces SQL AST safety, row count limits, and human-in-the-loop approvals with safe dry runs.
- Detects audit trail tampering and prevents token reuse.

### What GuardianAI Does Not Do:
1. **Natural Language Politeness or Tone Filtering**: GuardianAI does not judge whether the agent's conversational prose is grammatically pleasant or polite; it restricts the agent's underlying system permissions.
2. **In-Scope Semantic Misinterpretation**: If an agent is authorized to read sales data and generates an incorrect mathematical sum in its response to the user, GuardianAI permitted the database read because it was authorized, but does not verify the agent's arithmetic.
3. **Hardware-Level Compromise**: Assumes the host environment running GuardianAI is not root-compromised.

---

## 2. Technical Considerations
- **SQLite Concurrency**: The demo implementation uses SQLite with WAL mode. For enterprise production scale with millions of concurrent transactions, PostgreSQL or CockroachDB is recommended.
- **In-Memory Nonce Cache**: In high-availability multi-instance setups, nonce tracking should be backed by a distributed Redis cluster with automatic TTL eviction.

## Identity attribution
- Employee, device and network directory and behavioural baselines are synthetic demo data.
- Likely-operator attribution is evidence-based and never verified; it must be followed by human investigation.
