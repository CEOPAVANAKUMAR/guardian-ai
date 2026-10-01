# Continuous Identity & Insider Misuse Attribution

> **Authentication tells us which account logged in. GuardianAI determines whether the current session still
> matches that identity and whether the data is being used for an authorized purpose.**

This feature extends GuardianAI from "is this agent action allowed?" to "is this *person* who they claim to be, and is
this *data use* legitimate?". It is additive: no existing GuardianAI feature was removed or rebuilt.

## The four identities (never conflated)

| Term | Meaning | Source |
|------|---------|--------|
| **Claimed Identity** | The account used to log in | Session |
| **Device Identity** | Registered owner of the device | Device registry |
| **Verified Operator** | A person confirmed by *strong* verification (passkey / WebAuthn, user-verified) | Verification result |
| **Likely Operator** | Evidence-based suspicion. Never fact. | Multi-signal rules |

GuardianAI **never claims 100% certainty** (identity confidence is capped at 97%, attribution confidence at 88%).
If evidence is insufficient it shows **`ACTUAL OPERATOR UNKNOWN`**. A device mismatch alone never implicates the
device owner - laptops are borrowed and shared legitimately.

## Decisions (deterministic - no LLM)

| Risk | Score | Decision |
|------|-------|----------|
| LOW | 0-29 | ALLOW |
| MEDIUM | 30-59 | STEP-UP VERIFY |
| HIGH | 60-79 | BLOCK |
| CRITICAL | 80-100 | BLOCK + REVOKE SESSION + CREATE INCIDENT |

`backend/identity/engine.py` is a pure function: same input, same output. It imports no model, network or random
library, and a unit test enforces this.

## Signals and weights

| Signal | Points | Notes |
|--------|-------:|-------|
| Device mismatch | 30 | 10 if strong verification passed; shared device = 8 |
| Passkey failed | 25 | MFA failed 20, no second factor 12, SMS-only 6, TOTP-only 3 |
| Credential belongs to someone else | 35 | Strong verification done by a different person |
| Network mismatch | 10 | Network never used by the account |
| Unusual working time | 10 | Outside the account's usual hours / days |
| Behaviour deviation | 20 | Usage similarity < 0.45 (10 when < 0.70) |
| Bulk data access | 15 | Over a per-sensitivity record threshold |
| External export | 20 | Destination outside the company |
| Business-purpose mismatch | 25 | Purpose catalog + role entitlement + export policy |
| Restricted-data exposure | 5 | RESTRICTED dataset with bulk/external action |

**Behaviour similarity** is `0.5*dataset overlap + 0.3*tool overlap + 0.2*request-cadence similarity` against the
account's baseline (Jaccard overlap). It uses *application-level* usage only.

## Escalation rules

| Rule | Condition | Minimum level |
|------|-----------|---------------|
| R-ATO-1 | >= 3 independent identity signals contradict the claimed account, no strong verification | HIGH |
| R-ATO-2 | >= 4 such signals, no strong verification | CRITICAL |
| R-CRED-1 | Strong verification completed with a different person's credential | CRITICAL |
| R-INSIDER-1 | Bulk access + external export + purpose mismatch | CRITICAL |
| R-INSIDER-2 | External export + purpose mismatch on RESTRICTED data | HIGH |
| R-STEPUP-FAIL | Step-up passkey verification attempted and failed | HIGH |

A *Likely Operator* is named only when at least two person-specific signals (device owner, network association,
behaviour match to that person) **and** at least two contradictions of the claimed account exist **and** no strong
verification was completed.

## Demo scenarios

| # | Scenario | Expected result |
|---|----------|-----------------|
| 1 | Normal employee (Alice, passkey, own laptop) | ALLOW |
| 2 | Alice's account on Ben's laptop | STEP-UP VERIFY. Operator unknown; Ben is **not** accused |
| 3 | Signals indicate Ben using Alice's account | BLOCK + REVOKE + attribution incident. Ben = *Likely*, not verified |
| 4 | Priya (verified) bulk-exports customer PII to a personal cloud | BLOCK + REVOKE + insider-misuse incident. Identity is fine; the *purpose* is not |

Scenario 2 is interactive: on the **Identity Attribution** page choose *Passkey passed* (re-evaluates to ALLOW and the
verified operator becomes Alice) or *Passkey failed* (R-STEPUP-FAIL, BLOCK).

## Integrations

* **Incident Center** - CRITICAL decisions create real incidents (sector `IDENTITY & INSIDER RISK`) with an
  *Identity Attribution Evidence* panel. The Dashboard threat distribution gains an "Identity / Insider Misuse" row.
* **Audit Trail** - every evaluation, step-up and session revocation is appended to the HMAC-chained audit log
  (`IDENTITY_ATTRIBUTION`, `INSIDER_MISUSE_ATTRIBUTION`, `STEP_UP_REEVALUATION`, `SESSION_REVOKED`).
* **Attack Playground** - scenarios 8-11 run the same engine; with Guardian disabled the action simply executes.
* **Demo reset** clears identity evaluations and sessions.

## API (`/api/v1/identity`)

`GET /scenarios` · `GET /directory` · `POST /scenarios/{id}/run` · `POST /evaluate` (custom context) ·
`GET /evaluations` · `GET /evaluations/{id}` · `POST /evaluations/{id}/step-up` · `GET /sessions`

`POST /evaluate` accepts any session context, which is the easiest way to exercise the HIGH tier.

## Privacy

Only account, device-registry, network, time and application-usage metadata are used. **No webcam, microphone,
keylogging, keystroke dynamics or screen recording.** Everything runs locally; incidents from this feature never send
email (`notification_status = LOCAL_ONLY`).

## Limits

* The employee/device directory is synthetic demo data; production would read an IdP/MDM/HR source.
* Behavioural baselines are static demo values, not learned.
* State is in-memory, like the rest of the demo incident/audit services.
* Attribution is evidence, not proof. Human investigation is required before any accusation.
