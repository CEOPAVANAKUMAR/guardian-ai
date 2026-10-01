# GuardianAI System Architecture

## Architecture Diagram

```
+-----------------------------------------------------------------------+
|                              USER PROMPT                              |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                    AUTONOMOUS AI AGENT (UNTRUSTED)                    |
|    - Prompt & Reasoning Engine                                        |
|    - Tool Proposals & Action Requests                                 |
+-----------------------------------------------------------------------+
                                   |
                                   |  POST /api/v1/authorize
                                   v
+-----------------------------------------------------------------------+
|                       GUARDIANAI GATEWAY & PIPELINE                    |
|  +-----------------------------------------------------------------+  |
|  | 1. Agent Authentication & Session Binding Verification          |  |
|  | 2. Task Manifest Scope & Permission Matrix                       |  |
|  | 3. Monotonic Server-Side Taint Verification                     |  |
|  | 4. AST SQL Security Inspector (sqlglot dialect parser)          |  |
|  | 5. Deterministic Policy Engine (base.yaml, resources.yaml)     |  |
|  | 6. Monotonic Decision Merger (ALLOW < CONSTRAINED < ESC < DENY) |  |
|  | 7. HMAC-SHA256 Cryptographic Audit Chaining                     |  |
|  +-----------------------------------------------------------------+  |
+-----------------------------------------------------------------------+
          |                                            |
   Decision: ESCALATE                           Decision: ALLOW
          |                                            |
          v                                            v
+------------------------+                    +-------------------------+
| HUMAN APPROVAL QUEUE   |                    | CAPABILITY ISSUANCE     |
| - Safe COUNT(*) dry run|                    | - Signed HMAC-SHA256    |
| - Action Hash Binding  |                    | - Single-use nonce      |
+------------------------+                    | - 60s expiration        |
          | (Approved)                         +-------------------------+
          +------------------------------------------------+
                                                           |
                                                           v  POST /api/v1/execute
+-----------------------------------------------------------------------+
|                     PROTECTED EXECUTION ENVIRONMENT                   |
|  - Validates capability token signature & single-use nonce            |
|  - Verifies exact canonical SHA256(action) hash match                 |
|  - Reads via read-only SQLite URI                                     |
|  - Writes via guarded internal transactions                           |
|  - Filters output via OutputFilter pattern matching                   |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                 ISOLATED RESOURCES (DB / FILES / NETWORK)             |
+-----------------------------------------------------------------------+
```

## Security Pipeline Stages
1. **Agent Authentication**:
   Validates agent credentials via `X-Agent-Key`. Verifies that the agent identity matches both the active session and the assigned task manifest.
2. **Provenance & Taint Engine**:
   External documents (such as supplier PDFs) are read by GuardianAI server-side. The session is tagged `EXTERNAL_UNTRUSTED` or `INDIRECT_INJECTION_SUSPECT`.
3. **AST SQL Security Analyzer**:
   Parses raw SQL queries into abstract syntax trees using `sqlglot`. Prohibits multi-statement queries, DDL modifications (DROP, ALTER, TRUNCATE), administrative commands (PRAGMA, ATTACH), and unconstrained DELETE operations. Enforces LIMIT clauses on SELECT statements.
4. **Deterministic Policy Evaluator**:
   Evaluates access against task manifests and resource sensitivity matrices. Fail-closed decorator ensures all uncaught exceptions trigger `DENY`.
5. **Human Escalation & Safe Dry-Run**:
   Destructive actions trigger `ESCALATE`. A non-destructive `SELECT COUNT(*)` query is generated and executed to present exact impact previews to human reviewers.
6. **Capability Token Issuance**:
   Generates a cryptographically signed JSON payload containing action hash, agent ID, session ID, nonce, and timestamp.
7. **Tamper-Evident Audit Chain**:
   Records every authorization decision with previous hash linkages verified with HMAC-SHA256.
