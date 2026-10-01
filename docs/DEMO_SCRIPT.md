# GuardianAI Live Demo Script for Judges

This walkthrough demonstrates the complete GuardianAI runtime trust infrastructure in 5 sequential steps.

---

## Step 1: Benign Workflow (Sales Reporting)
1. Navigate to the **Attack Playground** tab.
2. Ensure **GUARDIAN: ON (ACTIVE)** is toggled.
3. Click **"1. Normal Business Task"**.
4. Observe the animated pipeline trace:
   - User Input -> AI Agent reasoning -> Proposed `DB_READ` on `sales`.
   - GuardianAI inspects task manifest and verifies `sales` is authorized.
   - Enforces max row limit constraint.
   - Issues signed single-use capability token.
   - Tool executes safely via read-only connection and returns sales records.

---

## Step 2: Poisoned PDF & Indirect Prompt Injection Attack
1. In **Attack Playground**, click **"3. Poisoned PDF Attack"**.
2. Observe what happens:
   - Server-side ingestion of `poisoned_invoice.pdf` occurs.
   - Taint Engine tags session provenance: **`EXTERNAL_UNTRUSTED` / `INDIRECT_INJECTION_SUSPECT`**.
   - Susceptible AI agent is fooled by the injected prompt instructions inside the invoice to call `read_secret('fake_secrets.env')`.
   - **GuardianAI Intercepts & DENIES** immediately:
     - `Sensitive resource requested`
     - `Task manifest has no secret access`
     - `Session contains EXTERNAL_UNTRUSTED context`
   - **Result**: Execution refused. Zero credentials exposed!

*(Optional Judge Demo)*: Toggle **GUARDIAN: OFF (BYPASS)** and re-run the scenario to demonstrate how an unmediated agent immediately leaks credentials in raw sandbox mode.

---

## Step 3: Destructive Operation & Safe Dry-Run Impact Preview
1. Click **"5. Scoped Database Delete"** (`DELETE FROM customers WHERE inactive = 1`).
2. GuardianAI recognizes this is a scoped legitimate maintenance task that requires human approval.
3. Decision: **`ESCALATE`**.
4. A safe, non-destructive `SELECT COUNT(*)` query runs server-side:
   - Impact preview reveals: **~427 records will be affected**.
5. Navigate to the **Approvals** tab:
   - View the pending approval ticket with impact preview and canonical action hash.
   - Click **"APPROVE & ISSUE TOKEN"**.
   - The approval binds to the action hash, issues a single-use token, and displays: **`ACTION HASH VERIFIED`**.

---

## Step 4: Action Hash Tampering Protection
1. In **Approvals**, locate any pending or re-generated deletion request.
2. Click **"Test Action Hash Mismatch"** (simulates an attacker modifying the query after approval).
3. GuardianAI compares the approval hash to the altered action hash.
4. **Result**: Immediate block!
   - Displays: **`ACTION HASH MISMATCH: EXECUTION BLOCKED`**.

---

## Step 5: Tamper-Evident Audit Chain & Verification
1. Navigate to the **Audit Chain** tab.
2. Click **"VERIFY AUDIT CHAIN"**:
   - Status displays: **`CHAIN STATUS: VERIFIED (INTEGRITY INTACT)`**.
   - All HMAC-SHA256 hash pointers verified.
3. Click **"SIMULATE TAMPERING"**:
   - Modifies an audit entry's decision in-place without recalculating HMAC.
4. Click **"VERIFY AUDIT CHAIN"** again:
   - Status immediately shifts to: **`AUDIT INTEGRITY FAILED`**.
   - Identifies the exact corrupted block index and highlights it in red.
