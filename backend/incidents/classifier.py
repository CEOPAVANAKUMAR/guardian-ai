"""Deterministic classifier and problem analyzer for GuardianAI Security Incidents.

Guarantees 100% deterministic mapping from action, resource, taint, and policy failure
into security sector, problem title, technical analysis, potential effects, and one primary solution.
"""

from typing import Any, Dict, List, Tuple


def classify_incident(
    action: str,
    resource: str,
    decision: str,
    risk_level: str,
    reasons: List[str],
    policy_ids: List[str],
    taint_level: str = "CLEAN",
    params: Dict[str, Any] = None,
) -> Dict[str, Any]:
    """Deterministically classifies security incidents according to GuardianAI policy taxonomy."""
    action_upper = str(action).upper()
    resource_lower = str(resource).lower()
    reasons_str = " ".join(str(r).lower() for r in reasons)
    policy_str = " ".join(str(p).upper() for p in policy_ids)
    query_str = str((params or {}).get("query", "")).upper()

    # 0. Identity attribution & insider misuse (deterministic, from GuardianAI identity engine)
    if action_upper in ("ACCOUNT_SHARING_SUSPECTED", "INSIDER_DATA_MISUSE", "IDENTITY_SESSION_MISMATCH") or any(
        p.startswith("IDN-") for p in policy_str.split()
    ):
        ident = (params or {}).get("identity", {}) or {}
        claimed = (ident.get("claimed_account") or {}).get("name") or "the claimed account"
        likely = ident.get("likely_operator") or {}
        verified = ident.get("verified_operator") or {}
        da = ident.get("data_access") or {}
        conf = ident.get("identity_confidence")
        if action_upper == "INSIDER_DATA_MISUSE":
            return {
                "sector": "IDENTITY & INSIDER RISK",
                "problem_title": "Insider Data Misuse - Authorized Employee, Unauthorized Purpose",
                "problem_summary": (
                    f"{claimed} (identity confirmed by {verified.get('method', 'strong verification')}) attempted a "
                    f"{da.get('action', 'bulk')} of {int(da.get('records', 0)):,} {da.get('dataset', 'sensitive')} records "
                    f"to {da.get('destination_name') or 'an external destination'} that does not match the declared business purpose."
                ),
                "detailed_analysis": (
                    "Authentication succeeded and the session still matches the claimed identity "
                    f"(identity confidence {conf}%), so this is NOT an account takeover. GuardianAI's deterministic rules found "
                    "that the data use is not an authorized purpose: bulk volume, external destination and a "
                    "business-purpose mismatch occurred together on restricted data."
                ),
                "potential_effects": [
                    "Mass exposure of customer personal data to an unmanaged destination",
                    "Privacy-regulation breach (GDPR / DPDP / CCPA) and mandatory breach notification",
                    "Intellectual-property or customer-list theft ahead of resignation or competitor move",
                    "Loss of customer trust and contractual penalties",
                ],
                "recommended_solution": (
                    "Keep the export blocked, preserve the audit evidence, and refer the case to Security, HR and Legal "
                    "for a purpose review with the employee; confirm no data left the company and review recent exports by this account."
                ),
            }
        return {
            "sector": "IDENTITY & INSIDER RISK",
            "problem_title": "Suspected Account Sharing - Session No Longer Matches Claimed Identity",
            "problem_summary": (
                f"Multiple independent signals indicate that the session logged in as {claimed} is not being operated by "
                f"that person. Likely operator (evidence-based, unverified): {likely.get('name', 'ACTUAL OPERATOR UNKNOWN')}."
            ),
            "detailed_analysis": (
                f"Identity confidence for the claimed account fell to {conf}%. Device, network, working-time, behavioural and "
                "verification signals contradict the claimed identity and no strong verification exists. GuardianAI names a "
                "likely operator only as an evidence-based suspicion, never as a verified fact; the device owner is not "
                "implicated by a device mismatch alone."
            ),
            "potential_effects": [
                "Credential sharing violating acceptable-use and audit-accountability policy",
                "Actions recorded under the wrong person, breaking non-repudiation",
                "Access to data the actual operator is not entitled to",
                "Possible account takeover if the credential was stolen rather than shared",
            ],
            "recommended_solution": (
                "Keep the session revoked, require the account owner to re-authenticate with a passkey, rotate the credential, "
                "and have Security interview both employees before drawing conclusions about who operated the session."
            ),
        }

    # 1. Audit Tampering
    if (
        "AUDIT" in policy_str
        or "tamper" in reasons_str
        or "chain broken" in reasons_str
        or "signature mismatch" in reasons_str
        or action_upper in ("AUDIT_TAMPERING", "AUDIT_CHAIN_FAILURE")
    ):
        return {
            "sector": "AUDIT & COMPLIANCE",
            "problem_title": "Audit Integrity Failure",
            "problem_summary": "Cryptographic HMAC signature mismatch detected in immutable audit log chain.",
            "detailed_analysis": (
                "HMAC-SHA256 chained audit verification detected unauthorized record mutation without "
                "valid cryptographic signature re-computation. GuardianAI detected a historical entry alteration."
            ),
            "potential_effects": [
                "Loss of evidentiary audit integrity",
                "Concealment of security breach actions",
                "Regulatory non-compliance (SOC2, ISO 27001)",
                "Compromised incident forensics and root-cause trace",
            ],
            "recommended_solution": (
                "Isolate the affected audit store, preserve evidence, investigate the modified entry, "
                "and restore from a trusted verified state."
            ),
        }

    # 2. Human Approval Action Hash Mismatch
    if (
        "HASH_MISMATCH" in policy_str
        or "hash mismatch" in reasons_str
        or "altered after request" in reasons_str
        or action_upper == "ACTION_HASH_MISMATCH"
    ):
        return {
            "sector": "HUMAN APPROVAL SECURITY",
            "problem_title": "Human Approval Action Hash Mismatch",
            "problem_summary": "Action payload was altered after approval ticket generation before runtime execution.",
            "detailed_analysis": (
                "Cryptographic SHA-256 verification failed between the human-approved action hash and the submitted "
                "execution payload. This indicates runtime payload tampering, race condition, or TOCTOU exploitation."
            ),
            "potential_effects": [
                "Execution of unreviewed malicious actions under valid credentials",
                "Time-of-check to time-of-use (TOCTOU) exploitation",
                "Subversion of human-in-the-loop governance controls",
                "Compromise of the runtime authorization boundary",
            ],
            "recommended_solution": (
                "Immediately void the capability token, reject the modified action, flag the calling agent, "
                "and re-issue human review with fresh canonical hashing."
            ),
        }

    # 3. Secret Access Attempt
    if (
        action_upper == "READ_SECRET"
        or "secret" in resource_lower
        or "fake_secrets" in resource_lower
        or "secret" in policy_str.lower()
        or "credential" in reasons_str
    ):
        return {
            "sector": "CREDENTIAL / SECRET SECURITY",
            "problem_title": "Unauthorized Secret Access",
            "problem_summary": (
                "An AI agent attempted to access protected credentials while operating "
                f"in a session carrying {taint_level} provenance."
            ),
            "detailed_analysis": (
                f"The requested READ_SECRET action on resource '{resource}' violates the authorized task scope. "
                f"The session carries {taint_level} provenance, triggering the autonomous zero-trust boundary."
            ),
            "potential_effects": [
                "Credential exposure and token hijacking",
                "Unauthorized lateral movement into connected cloud APIs",
                "Data leakage and confidential infrastructure compromise",
                "Account takeover and privilege persistence",
            ],
            "recommended_solution": (
                "Revoke the attempted secret access, preserve the deny decision, review the originating document, "
                "rotate the affected credential if exposure is suspected, and inspect related agent activity."
            ),
        }

    # 4. Prompt Injection & Poisoned Document
    if (
        "poisoned" in resource_lower
        or "injection" in reasons_str
        or "pdf" in resource_lower
        or taint_level in ("TAINTED", "HIGH_RISK")
        or "taint" in reasons_str
    ):
        return {
            "sector": "AI / LLM SECURITY & DOCUMENT SECURITY",
            "problem_title": "Prompt Injection via Poisoned Document",
            "problem_summary": "Indirect prompt injection detected in ingested document payload attempting agent hijacking.",
            "detailed_analysis": (
                "An external document ingested into the agent context contained embedded adversarial instructions "
                "attempting to coerce the AI agent into executing unauthorized privileged actions. "
                "GuardianAI's monotonic taint tracking prevented privilege escalation."
            ),
            "potential_effects": [
                "Subversion of LLM system instructions and safety alignment",
                "Arbitrary agent tool execution and unintended API triggers",
                "Confidential data exfiltration via side-channels",
                "Secondary prompt injection propagation to downstream agents",
                "Loss of agent integrity and intent alignment",
            ],
            "recommended_solution": (
                "Quarantine the originating document, sanitize input vectors, maintain monotonic session taint isolation, "
                "and restrict the compromised agent to safe read-only operations."
            ),
        }

    # 5. Database Delete / Drop / Destructive Action
    if (
        action_upper == "DB_DELETE"
        or "DROP" in query_str
        or "DELETE" in query_str
        or "database" in reasons_str
        or "sql-analyzer" in policy_str.lower()
    ):
        is_drop = "DROP" in query_str or "catastrophic" in reasons_str
        return {
            "sector": "DATABASE SECURITY",
            "problem_title": (
                "Catastrophic Database Destruction Blocked" if is_drop else "Dangerous Database Mutation Intercepted"
            ),
            "problem_summary": (
                "Destructive SQL operation (DROP TABLE / unconstrained DELETE) intercepted by SQL AST firewall."
            ),
            "detailed_analysis": (
                f"SQL AST parser analyzed the proposed query '{query_str[:80]}...' and identified destructive "
                f"mutation risks exceeding safety thresholds without verified human-in-the-loop authorization."
            ),
            "potential_effects": [
                "Catastrophic data loss across production tables",
                "Enterprise service disruption and system downtime",
                "Database corruption and foreign key integrity collapse",
                "Compliance violations and massive recovery overhead",
            ],
            "recommended_solution": (
                "Enforce strict parameterized queries, mandate human-in-the-loop authorization with dry-run "
                "impact verification, and restrict database agent role to least privilege."
            ),
        }

    # 6. Data Exfiltration / External Send
    if (
        action_upper in ("EXTERNAL_SEND", "HTTP_POST", "NETWORK_EGRESS")
        or "exfiltration" in reasons_str
        or "egress" in reasons_str
        or "@" in resource_lower
    ):
        return {
            "sector": "DATA SECURITY & NETWORK COMMUNICATION",
            "problem_title": "Unauthorized Data Exfiltration Attempt",
            "problem_summary": (
                f"Agent attempted unauthorized outbound transmission to destination '{resource}'."
            ),
            "detailed_analysis": (
                f"The agent initiated an EXTERNAL_SEND action to transmit data to untrusted destination '{resource}'. "
                "Autonomous security policy prohibits external egress for agents handling sensitive organizational state."
            ),
            "potential_effects": [
                "Proprietary information disclosure and intellectual property loss",
                "Regulatory non-compliance penalties (GDPR, HIPAA, PCI-DSS)",
                "Data exfiltration to attacker-controlled command & control server",
                "Reputational damage and breach disclosure obligations",
            ],
            "recommended_solution": (
                "Block outbound network egress, enforce strict egress firewall allowlisting, "
                "and trace the compromised session data provenance."
            ),
        }

    # 7. Authentication / Spoofing Anomaly
    if (
        "AUTH-FAIL" in policy_str
        or "SPOOF" in policy_str
        or "credential mismatch" in reasons_str
        or "not found" in reasons_str
    ):
        return {
            "sector": "IDENTITY & ACCESS",
            "problem_title": "Agent Authentication Anomaly",
            "problem_summary": "Unauthorized agent identity spoofing or credential mismatch detected.",
            "detailed_analysis": (
                "The caller presented an invalid agent authentication key or attempted to execute commands bound to "
                "a different authenticated agent session, violating session-agent binding."
            ),
            "potential_effects": [
                "Agent identity impersonation and credential replay",
                "Unauthorized lateral privilege escalation",
                "Tampering with shared execution pipelines",
                "Loss of identity accountability in forensics logs",
            ],
            "recommended_solution": (
                "Reject caller execution, invalidate compromised API keys, alert security operations, "
                "and re-authenticate agent instances."
            ),
        }

    # 8. Task Manifest / Scope Violation (Default Fallback)
    return {
        "sector": "API SECURITY",
        "problem_title": "Task Manifest Boundary Violation",
        "problem_summary": (
            f"Agent attempted action '{action}' on resource '{resource}' outside authorized scope."
        ),
        "detailed_analysis": (
            f"The requested action '{action}' on resource '{resource}' is outside the authorized task scope. "
            f"Reasons flagged: {'; '.join(reasons) or 'Declared policy boundary exceeded'}."
        ),
        "potential_effects": [
            "Unauthorized resource traversal and boundary escape",
            "Violation of least-privilege security posture",
            "Cross-tenant data exposure",
            "Unexpected agent behavior deviating from assigned operational manifest",
        ],
        "recommended_solution": (
            "Restrict agent access strictly to declared manifest resources, log the boundary deviation, "
            "and review task scope specifications."
        ),
    }
