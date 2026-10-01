"""Deterministic Continuous Identity & Insider Misuse Attribution engine.

PURE FUNCTIONS ONLY - no LLM, no randomness, no I/O, no wall-clock reads. The same
SessionContext always yields the same EvaluationResult. This is the final security
decision-maker for the identity feature.

Key distinctions
----------------
Claimed Identity   the account that logged in
Device Identity    the registered owner of the device
Verified Operator  a person confirmed by STRONG verification (passkey / WebAuthn)
Likely Operator    an evidence-based suspicion; never stated as fact

GuardianAI never claims 100% certainty (confidence is capped) and falls back to
"ACTUAL OPERATOR UNKNOWN" whenever evidence is insufficient. A device mismatch alone
never implicates the device owner.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from backend.identity import directory as D
from backend.identity.models import (
    Attribution,
    EvaluationResult,
    Signal,
    SessionContext,
    TimelineEvent,
)

UNKNOWN = "ACTUAL OPERATOR UNKNOWN"
MAX_IDENTITY_CONFIDENCE = 97   # never 100%
MAX_ATTRIBUTION_CONFIDENCE = 88

LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
LEVEL_FLOOR_SCORE = {"LOW": 0, "MEDIUM": 30, "HIGH": 60, "CRITICAL": 80}
DECISIONS = {
    "LOW": ("ALLOW", "ALLOW", ["ALLOW"]),
    "MEDIUM": ("STEP_UP_VERIFY", "STEP-UP VERIFY", ["STEP_UP_VERIFY"]),
    "HIGH": ("BLOCK", "BLOCK", ["BLOCK"]),
    "CRITICAL": (
        "BLOCK_REVOKE_INCIDENT",
        "BLOCK + REVOKE SESSION + CREATE INCIDENT",
        ["BLOCK", "REVOKE_SESSION", "CREATE_INCIDENT"],
    ),
}

PRIVACY_NOTE = (
    "Privacy-preserving by design: only account, device-registry, network, time and "
    "application-usage metadata are used. No webcam, microphone, keystroke or "
    "screen-recording data is collected."
)

# ---- risk weights (documented in docs/IDENTITY_ATTRIBUTION.md) --------------------
W_DEVICE_MISMATCH = 30
W_DEVICE_MISMATCH_STRONG_AUTH = 10
W_SHARED_DEVICE = 8
W_PASSKEY_FAILED = 25
W_MFA_FAILED = 20
W_NO_VERIFICATION = 12
W_SMS_ONLY = 6
W_TOTP_ONLY = 3
W_FOREIGN_CREDENTIAL = 35
W_NETWORK_MISMATCH = 10
W_UNUSUAL_TIME = 10
W_BEHAVIOUR_LOW = 20
W_BEHAVIOUR_MID = 10
W_BULK_ACCESS = 15
W_EXTERNAL_EXPORT = 20
W_PURPOSE_MISMATCH = 25
W_SENSITIVE_EXPOSURE = 5


def _level_for_score(score: int) -> str:
    if score >= 80:
        return "CRITICAL"
    if score >= 60:
        return "HIGH"
    if score >= 30:
        return "MEDIUM"
    return "LOW"


def _max_level(a: str, b: str) -> str:
    return a if LEVELS.index(a) >= LEVELS.index(b) else b


def _parse(ts: str) -> datetime:
    return datetime.fromisoformat(ts)


def _jaccard(a: List[str], b: List[str]) -> float:
    sa, sb = set(a), set(b)
    if not sa and not sb:
        return 1.0
    return len(sa & sb) / len(sa | sb)


def behaviour_similarity(observed: Dict[str, Any], baseline: Dict[str, Any]) -> float:
    """Similarity (0..1) between observed app-usage and an account's baseline."""
    datasets = _jaccard(observed.get("datasets", []), baseline.get("datasets", []))
    tools = _jaccard(observed.get("tools", []), baseline.get("tools", []))
    base_rate = max(float(baseline.get("calls_per_min", 1.0)), 1.0)
    cadence = max(0.0, 1.0 - abs(float(observed.get("calls_per_min", 0.0)) - base_rate) / base_rate)
    return round(0.5 * datasets + 0.3 * tools + 0.2 * cadence, 3)


def _verification(ctx: SessionContext) -> Dict[str, Any]:
    a = ctx.auth
    strong = a.method == "passkey" and a.result == "passed"
    owner = a.credential_owner or ctx.claimed_account
    return {
        "method": a.method,
        "result": a.result,
        "strong": strong,
        "credential_owner": owner,
        "foreign": strong and owner != ctx.claimed_account,
    }


def _person(account: Optional[str]) -> Dict[str, Any]:
    if not account:
        return {"account": None, "name": None, "label": None}
    e = D.employee(account)
    return {"account": account, "name": e.get("name", account), "label": e.get("label"), "role": e.get("role")}


def evaluate(ctx: SessionContext) -> EvaluationResult:
    claimed = D.employee(ctx.claimed_account)
    device = D.DEVICES.get(ctx.device_id, {"owner": None, "type": "Unregistered device", "shared": False})
    dataset = D.DATASETS.get(ctx.data_access.dataset)
    purpose = D.PURPOSES.get(ctx.data_access.declared_purpose or "")
    ver = _verification(ctx)
    signals: List[Signal] = []

    def add(id_, cat, label, direction, triggered, points, evidence, contradicts=False):
        signals.append(Signal(
            id=id_, category=cat, label=label, direction=direction, triggered=triggered,
            points=points if triggered else 0, evidence=evidence, contradicts_claimed=bool(contradicts and triggered),
        ))

    # ---------------- Strong / weak verification --------------------------------
    m, r = ctx.auth.method, ctx.auth.result
    if ver["strong"] and not ver["foreign"]:
        add("STRONG_VERIFICATION", "ASSURANCE", "Strong verification passed", "assurance", True, 0,
            "Phishing-resistant passkey verification succeeded for the claimed account.")
    elif ver["foreign"]:
        add("FOREIGN_CREDENTIAL", "IDENTITY", "Credential belongs to a different person", "risk", True,
            W_FOREIGN_CREDENTIAL,
            f"Passkey verification succeeded, but with {D.display_name(ver['credential_owner'])}'s credential, "
            f"not the claimed account's.", True)
    elif m == "passkey" and r == "failed":
        add("PASSKEY_FAILED", "IDENTITY", "Passkey verification failed", "risk", True, W_PASSKEY_FAILED,
            "Passkey challenge for this session failed; the session holds only weaker proof (password).", True)
    elif r == "failed":
        add("MFA_FAILED", "IDENTITY", "MFA verification failed", "risk", True, W_MFA_FAILED,
            f"{m.upper()} verification failed for this session.", True)
    elif r == "not_attempted" or m == "password_only":
        add("NO_STRONG_VERIFICATION", "IDENTITY", "No second factor completed", "risk", True, W_NO_VERIFICATION,
            "Session is backed by a password only; no MFA/passkey proof of the person.", True)
    elif m == "sms":
        add("WEAK_MFA_SMS", "IDENTITY", "SMS-only MFA", "risk", True, W_SMS_ONLY,
            "SMS codes passed, but SMS is phishable and can be relayed to another person.")
    else:
        add("WEAK_MFA_TOTP", "IDENTITY", "TOTP-only MFA", "risk", True, W_TOTP_ONLY,
            "TOTP passed, but a one-time code can be read out to, or shared with, another person.")

    # ---------------- Device identity -------------------------------------------
    own_devices = claimed.get("devices", [])
    if ctx.device_id in own_devices:
        add("DEVICE_MATCH", "ASSURANCE", "Registered device", "assurance", True, 0,
            f"Session is on {ctx.device_id}, registered to the claimed account.")
    elif device.get("shared"):
        add("SHARED_DEVICE", "IDENTITY", "Shared device", "risk", True, W_SHARED_DEVICE,
            f"{ctx.device_id} is a shared workstation; it identifies no individual.")
    else:
        owner_txt = D.display_name(device["owner"]) if device.get("owner") else "no registered owner"
        w = W_DEVICE_MISMATCH_STRONG_AUTH if ver["strong"] else W_DEVICE_MISMATCH
        add("DEVICE_MISMATCH", "IDENTITY", "Device mismatch", "risk", True, w,
            f"Device {ctx.device_id} is registered to {owner_txt}, not the claimed account."
            + (" Weight reduced because strong verification passed." if ver["strong"] else ""), True)

    # ---------------- Network ---------------------------------------------------
    net_label = D.NETWORKS.get(ctx.network_id, ctx.network_id)
    if ctx.network_id in claimed.get("networks", []):
        add("NETWORK_MATCH", "ASSURANCE", "Known network", "assurance", True, 0,
            f"Connected from {net_label}, a known network for this account.")
    else:
        add("NETWORK_MISMATCH", "IDENTITY", "Network mismatch", "risk", True, W_NETWORK_MISMATCH,
            f"Connected from {net_label}, which this account has not used before.", True)

    # ---------------- Working time ----------------------------------------------
    t = _parse(ctx.access_at)
    start, end = claimed.get("work_hours", (8, 19))
    in_hours = start <= t.hour < end and t.weekday() in claimed.get("work_days", [0, 1, 2, 3, 4])
    when = t.strftime("%a %H:%M")
    if in_hours:
        add("TIME_NORMAL", "ASSURANCE", "Normal working time", "assurance", True, 0,
            f"Activity at {when} falls within this account's usual hours ({start:02d}:00-{end:02d}:00).")
    else:
        add("UNUSUAL_TIME", "IDENTITY", "Unusual working time", "risk", True, W_UNUSUAL_TIME,
            f"Activity at {when} is outside this account's usual hours ({start:02d}:00-{end:02d}:00, Mon-Fri).", True)

    # ---------------- Behavioural pattern ---------------------------------------
    obs = ctx.observed.model_dump()
    sim_claimed = behaviour_similarity(obs, claimed.get("baseline", {}))
    if sim_claimed >= 0.7:
        add("BEHAVIOUR_MATCH", "ASSURANCE", "Behaviour matches baseline", "assurance", True, 0,
            f"Application-usage pattern matches the claimed account's baseline (similarity {sim_claimed:.2f}).")
    elif sim_claimed >= 0.45:
        add("BEHAVIOUR_DRIFT", "BEHAVIOUR", "Behaviour drift", "risk", True, W_BEHAVIOUR_MID,
            f"Usage pattern only partly matches the account's baseline (similarity {sim_claimed:.2f}).", True)
    else:
        add("BEHAVIOUR_DEVIATION", "BEHAVIOUR", "Behaviour deviates from baseline", "risk", True, W_BEHAVIOUR_LOW,
            f"Usage pattern differs strongly from the account's baseline (similarity {sim_claimed:.2f}).", True)

    # ---------------- Data: bulk / external / sensitivity -----------------------
    da = ctx.data_access
    sens = dataset["sensitivity"] if dataset else "UNKNOWN"
    threshold = dataset["bulk_threshold"] if dataset else 100
    bulk = da.records > threshold
    external = da.destination_kind == "external"
    add("BULK_ACCESS", "DATA", "Bulk data access", "risk", bulk, W_BULK_ACCESS,
        f"{da.records:,} {da.dataset} records in one session exceeds the {sens} bulk threshold ({threshold:,}).")
    add("EXTERNAL_EXPORT", "DATA", "External export", "risk", external, W_EXTERNAL_EXPORT,
        f"Data is being sent to an external destination ({da.destination_name or 'unspecified'}).")
    sensitive_exposure = sens == "RESTRICTED" and (bulk or external)
    add("SENSITIVE_EXPOSURE", "DATA", "Restricted data exposure", "risk", sensitive_exposure, W_SENSITIVE_EXPOSURE,
        f"{sens} dataset '{da.dataset}' is involved in a bulk or external action.")

    # ---------------- Business purpose ------------------------------------------
    mismatch_reasons: List[str] = []
    if da.dataset not in D.DATASETS:
        mismatch_reasons.append(f"dataset '{da.dataset}' is not in the governed data catalog")
    else:
        if claimed.get("role") not in dataset["allowed_roles"]:
            mismatch_reasons.append(f"role '{claimed.get('role')}' is not entitled to {da.dataset}")
        if not da.declared_purpose:
            if da.records > 0 and (bulk or external):
                mismatch_reasons.append("no business purpose declared for a bulk/external action")
        elif not purpose:
            mismatch_reasons.append(f"declared purpose '{da.declared_purpose}' is not an approved business purpose")
        else:
            if da.dataset not in purpose["datasets"]:
                mismatch_reasons.append(
                    f"purpose '{purpose['label']}' does not require {da.dataset}")
            if external and not purpose["external_export"]:
                mismatch_reasons.append(f"purpose '{purpose['label']}' does not permit external export")
    purpose_mismatch = bool(mismatch_reasons)
    declared_txt = purpose["label"] if purpose else (da.declared_purpose or "none declared")
    if purpose_mismatch:
        add("PURPOSE_MISMATCH", "PURPOSE", "Business-purpose mismatch", "risk", True, W_PURPOSE_MISMATCH,
            f"Declared purpose: {declared_txt}. Mismatch: " + "; ".join(mismatch_reasons) + ".")
    else:
        add("PURPOSE_OK", "ASSURANCE", "Purpose consistent", "assurance", True, 0,
            f"Declared purpose '{declared_txt}' legitimately requires {da.dataset}.")

    # ---------------- Score ------------------------------------------------------
    raw = min(100, sum(s.points for s in signals))
    level = _level_for_score(raw)

    # ---------------- Deterministic escalation rules -----------------------------
    sig = {s.id: s for s in signals if s.triggered}
    contradictions = [s for s in signals if s.contradicts_claimed]
    n_contra = len(contradictions)
    no_strong = not ver["strong"]
    rules: List[Dict[str, str]] = []

    def fire(rule_id: str, minimum: str, why: str):
        nonlocal level
        raised = LEVELS.index(minimum) > LEVELS.index(level)
        rules.append({"id": rule_id, "minimum_level": minimum, "reason": why,
                      "effect": "raised level" if raised else "confirmed score-based level"})
        level = _max_level(level, minimum)

    if no_strong and n_contra >= 4:
        fire("R-ATO-2", "CRITICAL",
             f"{n_contra} independent identity signals contradict the claimed account and no strong verification exists.")
    elif no_strong and n_contra >= 3:
        fire("R-ATO-1", "HIGH",
             f"{n_contra} independent identity signals contradict the claimed account and no strong verification exists.")
    if "FOREIGN_CREDENTIAL" in sig:
        fire("R-CRED-1", "CRITICAL", "Strong verification was completed by a person other than the claimed account holder.")
    if bulk and external and purpose_mismatch:
        fire("R-INSIDER-1", "CRITICAL",
             "Bulk access + external export + business-purpose mismatch: insider misuse pattern.")
    elif external and purpose_mismatch and sens == "RESTRICTED":
        fire("R-INSIDER-2", "HIGH", "Unauthorised external export of RESTRICTED data.")

    # step-up outcome carried in the context (set by the service on re-evaluation)
    if ctx.step_up_attempted and ctx.auth.method == "passkey" and ctx.auth.result == "failed":
        fire("R-STEPUP-FAIL", "HIGH", "Step-up verification was attempted and failed.")

    score = max(raw, LEVEL_FLOOR_SCORE[level])
    score = min(100, score)

    # ---------------- Attribution --------------------------------------------------
    sim_by_emp = {a: behaviour_similarity(obs, e["baseline"]) for a, e in D.EMPLOYEES.items()}
    base = 60
    if ver["strong"] and not ver["foreign"]:
        base += 35
    elif ver["foreign"]:
        base -= 40
    elif r == "passed":
        base += 5 if m == "totp" else 3 if m == "sms" else 5
    elif r == "failed":
        base -= 25
    else:
        base -= 10
    base += 5 if "DEVICE_MATCH" in sig else (-20 if "DEVICE_MISMATCH" in sig else -5 if "SHARED_DEVICE" in sig else 0)
    base += 5 if "NETWORK_MATCH" in sig else -8
    base += 2 if "TIME_NORMAL" in sig else -5
    base += max(-15, min(15, round((sim_claimed - 0.5) * 30)))
    identity_conf = max(3, min(MAX_IDENTITY_CONFIDENCE, base))
    conf_label = "HIGH" if identity_conf >= 80 else "MODERATE" if identity_conf >= 50 else "LOW"

    dev_owner = device.get("owner")
    device_owner_p = _person(dev_owner)
    if device.get("shared"):
        device_owner_p = {"account": None, "name": "Shared device", "label": None, "role": None}
    elif not dev_owner:
        device_owner_p = {"account": None, "name": "Unregistered device", "label": None, "role": None}

    # Verified operator: only via strong verification.
    if ver["strong"]:
        v_acc = ver["credential_owner"]
        verified = {**_person(v_acc), "method": "Passkey (WebAuthn, user-verified)", "status": "VERIFIED"}
    else:
        verified = {"account": None, "name": "NOT VERIFIED", "label": None, "status": "NONE",
                    "method": f"No strong verification ({m.replace('_', ' ')} / {r.replace('_', ' ')})"}

    # Likely operator: strict, evidence-based, multi-signal.
    likely: Dict[str, Any] = {"account": None, "name": UNKNOWN, "label": None, "status": "UNKNOWN",
                              "confidence": None, "basis": []}
    note = ""
    claimed_has_contra = n_contra > 0
    if ver["strong"] and not ver["foreign"]:
        likely = {**_person(ctx.claimed_account), "status": "VERIFIED", "confidence": identity_conf,
                  "basis": ["Confirmed by strong verification"]}
        note = "Operator confirmed by strong verification. Remaining risk, if any, relates to data use."
    elif ver["foreign"]:
        likely = {**_person(ver["credential_owner"]), "status": "VERIFIED", "confidence": identity_conf,
                  "basis": ["Strong verification was completed with this person's credential"]}
        note = "The session is operated by a different verified person than the claimed account."
    else:
        best: Optional[Tuple[str, List[str], int]] = None
        for acc, emp in D.EMPLOYEES.items():
            if acc == ctx.claimed_account:
                continue
            specific: List[str] = []
            if dev_owner == acc:
                specific.append(f"Device {ctx.device_id} is registered to {emp['name']}")
            if ctx.network_id in emp["networks"] and ctx.network_id not in claimed.get("networks", []) \
                    and ctx.network_id != "NET-HQ-WIFI":
                specific.append(f"Network {D.NETWORKS.get(ctx.network_id)} is associated with {emp['name']}")
            if sim_by_emp[acc] >= 0.7 and sim_by_emp[acc] - sim_claimed >= 0.25:
                specific.append(
                    f"Usage pattern matches {emp['name']}'s baseline ({sim_by_emp[acc]:.2f}) "
                    f"far better than the claimed account's ({sim_claimed:.2f})")
            if len(specific) >= 2 and n_contra >= 2 and no_strong:
                if best is None or len(specific) > len(best[1]):
                    best = (acc, specific, len(specific))
        if best:
            acc, specific, n_spec = best
            attr_conf = min(MAX_ATTRIBUTION_CONFIDENCE, 25 + 15 * n_spec + 4 * n_contra)
            likely = {**_person(acc), "status": "LIKELY", "confidence": attr_conf,
                      "basis": specific + [f"{n_contra} signals contradict the claimed account holder"]}
            note = (f"Evidence-based suspicion only - {D.EMPLOYEES[acc]['name']} is NOT verified. "
                    "Strong verification or human investigation is required before any accusation.")
        elif not claimed_has_contra and identity_conf >= 75:
            likely = {**_person(ctx.claimed_account), "status": "CONSISTENT", "confidence": identity_conf,
                      "basis": ["All observed signals are consistent with the claimed account holder"]}
            note = "Signals are consistent with the claimed account holder; not strongly verified."
        else:
            note = ("Evidence is insufficient to say who is operating this session. "
                    + ("A device mismatch alone does not implicate the device owner - devices are borrowed "
                       "and shared legitimately. " if "DEVICE_MISMATCH" in sig else "")
                    + "Step-up verification can resolve this.")

    device_owner_p["implicated"] = bool(likely["status"] == "LIKELY" and likely["account"] == dev_owner)

    # ---------------- Threat class & summary --------------------------------------
    identity_alarm = no_strong and n_contra >= 3 or "FOREIGN_CREDENTIAL" in sig
    misuse = purpose_mismatch and (bulk or external)
    if identity_alarm and misuse:
        threat = "COMBINED_ACCOUNT_AND_DATA_MISUSE"
    elif identity_alarm:
        threat = "ACCOUNT_SHARING_SUSPECTED"
    elif misuse:
        threat = "INSIDER_DATA_MISUSE"
    elif n_contra > 0 and no_strong:
        threat = "IDENTITY_UNCERTAIN"
    else:
        threat = "NONE"

    decision, label, actions = DECISIONS[level]
    top = [s for s in sorted(signals, key=lambda s: -s.points) if s.triggered and s.points > 0][:3]
    summary = f"{level} risk ({score}/100) -> {label}. " + (
        "Key evidence: " + "; ".join(s.label for s in top) + "." if top else "No risk signals triggered.")

    attribution = Attribution(
        claimed_account={**_person(ctx.claimed_account), "role": claimed.get("role")},
        device_owner=device_owner_p,
        verified_operator=verified,
        likely_operator=likely,
        identity_confidence=identity_conf,
        identity_confidence_label=conf_label,
        note=note,
    )
    return EvaluationResult(
        risk_score=score, raw_score=raw, risk_level=level, decision=decision, decision_label=label,
        actions=actions, threat_class=threat, attribution=attribution, signals=signals,
        rules_fired=rules, summary=summary, privacy_note=PRIVACY_NOTE,
    )


def build_timeline(ctx: SessionContext, res: EvaluationResult) -> List[TimelineEvent]:
    """Deterministic evidence timeline derived from the context + result."""
    login, access = _parse(ctx.login_at), _parse(ctx.access_at)
    fmt = lambda d: d.strftime("%H:%M:%S")
    sig = {s.id: s for s in res.signals}
    ev: List[TimelineEvent] = []
    ev.append(TimelineEvent(time=fmt(login), source="AUTH", title="Login as claimed account",
                            detail=f"{ctx.claimed_account} authenticated.", severity="info"))
    dev = next((s for s in res.signals if s.id in ("DEVICE_MATCH", "DEVICE_MISMATCH", "SHARED_DEVICE")), None)
    if dev:
        ev.append(TimelineEvent(time=fmt(login), source="DEVICE", title=dev.label, detail=dev.evidence,
                                severity="ok" if dev.direction == "assurance" else "warn"))
    ver = next((s for s in res.signals if s.category == "ASSURANCE" and s.id == "STRONG_VERIFICATION"), None) \
        or next((s for s in res.signals if s.id in (
            "PASSKEY_FAILED", "MFA_FAILED", "NO_STRONG_VERIFICATION", "WEAK_MFA_SMS", "WEAK_MFA_TOTP",
            "FOREIGN_CREDENTIAL")), None)
    if ver:
        sev = "ok" if ver.direction == "assurance" else ("crit" if ver.points >= 20 else "warn")
        ev.append(TimelineEvent(time=fmt(login), source="AUTH", title=ver.label, detail=ver.evidence, severity=sev))
    for sid in ("NETWORK_MATCH", "NETWORK_MISMATCH"):
        if sid in sig:
            s = sig[sid]
            ev.append(TimelineEvent(time=fmt(login), source="NETWORK", title=s.label, detail=s.evidence,
                                    severity="ok" if s.direction == "assurance" else "warn"))
    for sid in ("TIME_NORMAL", "UNUSUAL_TIME", "BEHAVIOUR_MATCH", "BEHAVIOUR_DRIFT", "BEHAVIOUR_DEVIATION"):
        if sid in sig:
            s = sig[sid]
            src = "BEHAVIOUR"
            ev.append(TimelineEvent(time=fmt(access), source=src, title=s.label, detail=s.evidence,
                                    severity="ok" if s.direction == "assurance" else "warn"))
    da = ctx.data_access
    ev.append(TimelineEvent(
        time=fmt(access), source="DATA", title=f"{da.action} {da.records:,} records from {da.dataset}",
        detail=f"Destination: {da.destination_name or da.destination_kind}. Declared purpose: {da.declared_purpose or 'none'}.",
        severity="info"))
    for sid in ("BULK_ACCESS", "EXTERNAL_EXPORT", "SENSITIVE_EXPOSURE", "PURPOSE_MISMATCH"):
        s = sig.get(sid)
        if s and s.triggered:
            ev.append(TimelineEvent(time=fmt(access), source="DATA", title=s.label, detail=s.evidence, severity="crit"))
    for rule in res.rules_fired:
        ev.append(TimelineEvent(time=fmt(access), source="GUARDIAN", title=f"Rule {rule['id']} fired",
                                detail=rule["reason"], severity="crit"))
    sev = {"LOW": "ok", "MEDIUM": "warn", "HIGH": "crit", "CRITICAL": "crit"}[res.risk_level]
    ev.append(TimelineEvent(time=fmt(access), source="GUARDIAN", title=f"Decision: {res.decision_label}",
                            detail=res.summary, severity=sev))
    return ev
