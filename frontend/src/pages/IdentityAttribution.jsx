import React, { useEffect, useState } from 'react';
import {
  fetchIdentityScenarios,
  runIdentityScenario,
  fetchIdentityEvaluations,
  stepUpIdentityEvaluation,
} from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import {
  UserCheck,
  Laptop,
  ShieldCheck,
  UserSearch,
  Gauge,
  AlertTriangle,
  ShieldAlert,
  Fingerprint,
  Play,
  Loader2,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  ScrollText,
  Lock,
  KeyRound,
  Eye,
} from 'lucide-react';

/**
 * IdentityAttribution - Continuous Identity & Insider Misuse Attribution
 * Authentication tells us which account logged in. GuardianAI determines whether
 * the current session still matches that identity and whether the data is being
 * used for an authorized purpose. Decisions come from a deterministic rule engine.
 */

const LEVEL_STYLE = {
  LOW: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', bar: 'bg-emerald-500' },
  MEDIUM: { text: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30', bar: 'bg-amber-400' },
  HIGH: { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', bar: 'bg-orange-500' },
  CRITICAL: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/40', bar: 'bg-rose-500' },
};

const SEV_STYLE = {
  ok: { dot: 'bg-emerald-400', text: 'text-emerald-300' },
  info: { dot: 'bg-cyan-400', text: 'text-cyan-300' },
  warn: { dot: 'bg-amber-400', text: 'text-amber-300' },
  crit: { dot: 'bg-rose-500', text: 'text-rose-300' },
};

const SESSION_STYLE = {
  ACTIVE: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  PENDING_STEP_UP: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
  BLOCKED: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
  REVOKED: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
};

function IdentityCard({ icon: Icon, title, accent, children, footer }) {
  return (
    <div className="p-4 rounded-2xl glass-card flex flex-col gap-2 min-h-[148px]">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[#8994A3]">
        <span className={`p-1.5 rounded-lg bg-white/[0.04] ${accent}`}>
          <Icon className="w-3.5 h-3.5" />
        </span>
        {title}
      </div>
      <div className="flex-1">{children}</div>
      {footer && <div className="text-[11px] leading-relaxed text-[#8994A3] border-t border-white/[0.06] pt-2">{footer}</div>}
    </div>
  );
}

function PersonLine({ p, empty }) {
  if (!p || !p.name) return <div className="text-sm font-mono text-[#8994A3]">{empty || '—'}</div>;
  return (
    <div>
      <div className="text-sm font-bold text-[#F4F6F8] font-sans">
        {p.name}
        {p.label && <span className="ml-1.5 text-[10px] font-mono text-[#8994A3]">({p.label})</span>}
      </div>
      {p.role && <div className="text-[11px] text-[#8994A3] font-mono">{p.role}</div>}
      {p.account && <div className="text-[10px] text-[#8994A3] font-mono truncate">{p.account}</div>}
    </div>
  );
}

export default function IdentityAttribution({ onNavigateToIncident, onNavigateToAudit, initialEvaluationId }) {
  const [scenarios, setScenarios] = useState([]);
  const [result, setResult] = useState(null);
  const [recent, setRecent] = useState([]);
  const [running, setRunning] = useState(null);
  const [stepping, setStepping] = useState(false);
  const [error, setError] = useState(null);

  const loadRecent = async () => {
    try {
      const list = await fetchIdentityEvaluations(8);
      setRecent(list);
      return list;
    } catch (e) {
      return [];
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setScenarios(await fetchIdentityScenarios());
      } catch (e) {
        setError('Could not reach the GuardianAI backend. Start it with run_demo.sh / run_demo.bat.');
      }
      const list = await loadRecent();
      if (initialEvaluationId) {
        const found = list.find((r) => r.id === initialEvaluationId);
        if (found) setResult(found);
      } else if (list.length) {
        setResult(list[0]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = async (id) => {
    setRunning(id);
    setError(null);
    try {
      const rec = await runIdentityScenario(id);
      setResult(rec);
      loadRecent();
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(null);
    }
  };

  const stepUp = async (outcome) => {
    if (!result) return;
    setStepping(true);
    setError(null);
    try {
      const rec = await stepUpIdentityEvaluation(result.id, outcome);
      setResult(rec);
      loadRecent();
    } catch (e) {
      setError(e.message);
    } finally {
      setStepping(false);
    }
  };

  const res = result?.result;
  const att = res?.attribution;
  const lvl = LEVEL_STYLE[res?.risk_level] || LEVEL_STYLE.LOW;
  const likely = att?.likely_operator;
  const likelyUnknown = likely && likely.status === 'UNKNOWN';
  const riskSignals = res?.signals?.filter((s) => s.direction === 'risk' && s.triggered) || [];
  const assurance = res?.signals?.filter((s) => s.direction === 'assurance') || [];

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8 font-sans">
      <PageHeader
        title="Identity Attribution"
        subtitle="Continuous identity verification and insider-misuse attribution with deterministic, explainable decisions."
        badgeText="Continuous Identity"
        badgeVariant="violet"
      />

      {/* Main message */}
      <div className="p-4 rounded-2xl glass-card border border-violet-500/20 bg-gradient-to-r from-violet-950/20 via-[#0F1420] to-[#0A0D14]">
        <div className="flex items-start gap-3">
          <span className="p-2 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 shrink-0">
            <Fingerprint className="w-5 h-5" />
          </span>
          <p className="text-sm text-[#C8D0DC] leading-relaxed">
            <span className="font-semibold text-[#F4F6F8]">Authentication tells us which account logged in.</span>{' '}
            GuardianAI determines whether the current session still matches that identity and whether the data is being
            used for an authorized purpose.
          </p>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] font-mono text-[#8994A3]">
          <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"><b className="text-cyan-300">Claimed Identity</b> = account used to log in</div>
          <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"><b className="text-cyan-300">Device Identity</b> = owner of the device</div>
          <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"><b className="text-emerald-300">Verified Operator</b> = confirmed by strong verification</div>
          <div className="px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"><b className="text-amber-300">Likely Operator</b> = evidence-based suspicion, never certainty</div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs font-mono">{error}</div>
      )}

      {/* Scenario launcher */}
      <div className="space-y-2">
        <div className="text-xs font-mono font-bold text-[#8994A3] uppercase tracking-wider">Demo scenarios</div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {scenarios.map((s) => {
            const active = result?.scenario_id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => run(s.id)}
                disabled={running !== null}
                className={`text-left p-4 rounded-2xl glass-card flex flex-col gap-2 transition-all disabled:opacity-60 hover:border-white/[0.18] ${
                  active ? 'border-violet-400/60 ring-2 ring-violet-500/20' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border font-bold text-violet-300 bg-violet-950/40 border-violet-500/30">
                    SCENARIO {s.number}
                  </span>
                  {running === s.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-violet-300" />
                  ) : (
                    <Play className="w-4 h-4 text-[#8994A3]" />
                  )}
                </div>
                <div className="text-sm font-bold text-[#F4F6F8] font-mono leading-snug">{s.title}</div>
                <div className="text-xs text-[#B5BEC9] leading-relaxed flex-1">{s.tagline}</div>
                <div className="text-[11px] font-mono text-[#8994A3] pt-2 border-t border-white/[0.06]">
                  Expected: <span className="text-cyan-300 font-semibold">{s.expected}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {!result && !error && (
        <EmptyState
          icon={UserSearch}
          title="No identity evaluation yet"
          description="Launch one of the scenarios above to see how GuardianAI separates the claimed account, the device owner, the verified operator and the likely operator."
        />
      )}

      {result && res && (
        <div className="space-y-4">
          {/* Decision banner */}
          <div className={`p-4 rounded-2xl border ${lvl.border} ${lvl.bg} flex flex-col lg:flex-row lg:items-center gap-4`}>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono uppercase text-[#8994A3]">
                {result.id} · {result.scenario_title}
              </div>
              <div className={`text-xl sm:text-2xl font-bold font-mono ${lvl.text} mt-0.5`}>
                DECISION: {res.decision_label}
              </div>
              <p className="text-xs text-[#C8D0DC] mt-1 leading-relaxed">{res.summary}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[11px] font-mono">
                <span className={`px-2 py-0.5 rounded-md border ${lvl.border} ${lvl.text}`}>{res.risk_level} RISK</span>
                <span className="px-2 py-0.5 rounded-md border border-white/[0.1] text-[#C8D0DC]">
                  CLASS: {res.threat_class.replace(/_/g, ' ')}
                </span>
                {result.session && (
                  <span className={`px-2 py-0.5 rounded-md border ${SESSION_STYLE[result.session.status] || ''}`}>
                    SESSION {result.session.status.replace(/_/g, ' ')}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-md border border-white/[0.1] text-[#8994A3]">
                  {result.latency_ms} ms · rule-based
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              {result.incident_id && onNavigateToIncident && (
                <button
                  onClick={() => onNavigateToIncident(result.incident_id)}
                  className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-black font-mono text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <span>OPEN {result.incident_id}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
              {onNavigateToAudit && (
                <button
                  onClick={() => onNavigateToAudit()}
                  className="px-3.5 py-2 rounded-xl border border-white/[0.14] hover:bg-white/[0.06] text-[#C8D0DC] font-mono text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <ScrollText className="w-3.5 h-3.5" />
                  <span>AUDIT TRAIL ({result.audit_ids?.length || 0})</span>
                </button>
              )}
            </div>
          </div>

          {/* Step-up verification */}
          {res.decision === 'STEP_UP_VERIFY' && result.step_up_available && (
            <div className="p-4 rounded-2xl glass-card border border-amber-500/30 flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex items-start gap-3 flex-1">
                <KeyRound className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <div className="text-xs text-[#C8D0DC] leading-relaxed">
                  <b className="text-amber-300">Step-up verification required.</b> The session is paused. Ask the person to
                  prove they are the account holder with a passkey. Pick an outcome to see GuardianAI re-evaluate the session.
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => stepUp('passed')}
                  disabled={stepping}
                  className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Passkey passed
                </button>
                <button
                  onClick={() => stepUp('failed')}
                  disabled={stepping}
                  className="px-3 py-2 rounded-xl border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 font-mono text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" /> Passkey failed
                </button>
              </div>
            </div>
          )}

          {/* Identity cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <IdentityCard icon={UserCheck} title="Claimed Account" accent="text-cyan-300" footer="The account used to log in. Proves a credential was presented, not who typed it.">
              <PersonLine p={att.claimed_account} />
            </IdentityCard>

            <IdentityCard
              icon={Laptop}
              title="Device Owner"
              accent="text-cyan-300"
              footer={
                att.device_owner.implicated
                  ? 'Named only as a suspect because several independent signals point here. Not verified.'
                  : 'Using someone’s device does not implicate its owner. Devices are borrowed and shared legitimately.'
              }
            >
              <PersonLine p={att.device_owner} empty="Unknown device" />
              {att.device_owner.account && (
                <div className={`mt-1.5 inline-block text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  att.device_owner.implicated ? 'text-amber-300 border-amber-500/30' : 'text-emerald-300 border-emerald-500/30'
                }`}>
                  {att.device_owner.implicated ? 'SUSPECTED — NOT VERIFIED' : 'NOT IMPLICATED'}
                </div>
              )}
            </IdentityCard>

            <IdentityCard
              icon={ShieldCheck}
              title="Verified Operator"
              accent="text-emerald-300"
              footer={att.verified_operator.method}
            >
              {att.verified_operator.status === 'VERIFIED' ? (
                <>
                  <PersonLine p={att.verified_operator} />
                  <div className="mt-1.5 inline-block text-[10px] font-mono px-1.5 py-0.5 rounded border text-emerald-300 border-emerald-500/30">
                    STRONGLY VERIFIED
                  </div>
                </>
              ) : (
                <div className="text-sm font-bold font-mono text-[#8994A3]">NOT VERIFIED</div>
              )}
            </IdentityCard>

            <IdentityCard
              icon={UserSearch}
              title="Likely Operator"
              accent="text-amber-300"
              footer={
                likely.status === 'LIKELY'
                  ? 'Evidence-based suspicion, not a finding of fact. Human investigation required.'
                  : likely.status === 'UNKNOWN'
                  ? 'Evidence is insufficient. GuardianAI will not guess.'
                  : 'Derived from the evidence below.'
              }
            >
              {likelyUnknown ? (
                <div className="text-sm font-bold font-mono text-amber-300 leading-snug">ACTUAL OPERATOR UNKNOWN</div>
              ) : (
                <>
                  <PersonLine p={likely} />
                  <div className="mt-1.5 inline-block text-[10px] font-mono px-1.5 py-0.5 rounded border text-amber-300 border-amber-500/30">
                    {likely.status}
                    {likely.status === 'LIKELY' && likely.confidence != null ? ` · ${likely.confidence}% attribution confidence` : ''}
                  </div>
                </>
              )}
            </IdentityCard>
          </div>

          {/* Confidence + risk */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl glass-card">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#8994A3]">
                <span className="flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-cyan-300" /> Identity Confidence</span>
                <span>session matches claimed account</span>
              </div>
              <div className="flex items-end gap-2 mt-2">
                <span className="text-3xl font-bold font-mono text-[#F4F6F8]">{att.identity_confidence}%</span>
                <span className="text-xs font-mono text-[#8994A3] pb-1">{att.identity_confidence_label}</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    att.identity_confidence >= 80 ? 'bg-emerald-500' : att.identity_confidence >= 50 ? 'bg-amber-400' : 'bg-rose-500'
                  }`}
                  style={{ width: `${att.identity_confidence}%` }}
                />
              </div>
              <div className="text-[11px] text-[#8994A3] mt-2 leading-relaxed">
                Never 100%. Capped below certainty because behaviour and context are evidence, not proof.
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-card">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase text-[#8994A3]">
                <span className="flex items-center gap-1.5"><AlertTriangle className={`w-3.5 h-3.5 ${lvl.text}`} /> Risk Score</span>
                <span>deterministic rules</span>
              </div>
              <div className="flex items-end gap-2 mt-2">
                <span className={`text-3xl font-bold font-mono ${lvl.text}`}>{res.risk_score}</span>
                <span className="text-xs font-mono text-[#8994A3] pb-1">/ 100 · {res.risk_level}</span>
              </div>
              <div className="relative h-2 rounded-full bg-white/[0.06] mt-2 overflow-hidden">
                <div className={`h-full rounded-full ${lvl.bar}`} style={{ width: `${res.risk_score}%` }} />
                {[30, 60, 80].map((t) => (
                  <span key={t} className="absolute top-0 h-full w-px bg-white/30" style={{ left: `${t}%` }} />
                ))}
              </div>
              <div className="flex justify-between text-[10px] font-mono text-[#8994A3] mt-1">
                <span>LOW → ALLOW</span><span>MED → STEP-UP</span><span>HIGH → BLOCK</span><span>CRIT → REVOKE</span>
              </div>
              {res.raw_score !== res.risk_score && (
                <div className="text-[11px] text-amber-300 font-mono mt-1.5">
                  Raw signal score {res.raw_score} raised to {res.risk_score} by escalation rule.
                </div>
              )}
            </div>
          </div>

          {att.note && (
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-[#C8D0DC] leading-relaxed flex gap-2.5">
              <Eye className="w-4 h-4 text-violet-300 shrink-0 mt-0.5" />
              <span>{att.note}</span>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Evidence */}
            <div className="p-4 rounded-2xl glass-card space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase">
                <ShieldAlert className="w-4 h-4" /> Evidence
              </div>

              {riskSignals.length === 0 && (
                <div className="text-xs text-emerald-300 font-mono">No risk signals triggered.</div>
              )}
              <div className="space-y-2">
                {riskSignals.map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-rose-300 font-mono">{s.label}</span>
                      <span className="text-[10px] font-mono text-rose-300 border border-rose-500/30 rounded px-1.5 py-0.5 shrink-0">
                        +{s.points} · {s.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#C8D0DC] mt-1 leading-relaxed">{s.evidence}</div>
                  </div>
                ))}
              </div>

              {assurance.length > 0 && (
                <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                  <div className="text-[10px] font-mono uppercase text-[#8994A3]">Assurance signals</div>
                  {assurance.map((s) => (
                    <div key={s.id} className="flex items-start gap-2 text-[11px] text-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><b className="font-mono">{s.label}.</b> {s.evidence}</span>
                    </div>
                  ))}
                </div>
              )}

              {res.rules_fired.length > 0 && (
                <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
                  <div className="text-[10px] font-mono uppercase text-[#8994A3]">Escalation rules fired</div>
                  {res.rules_fired.map((r) => (
                    <div key={r.id} className="text-[11px] font-mono text-amber-200 bg-amber-950/20 border border-amber-900/40 rounded-lg px-2.5 py-1.5">
                      <b>{r.id}</b> → min {r.minimum_level}: {r.reason}
                    </div>
                  ))}
                </div>
              )}

              {att.likely_operator.status === 'LIKELY' && att.likely_operator.basis?.length > 0 && (
                <div className="pt-2 border-t border-white/[0.06] space-y-1">
                  <div className="text-[10px] font-mono uppercase text-[#8994A3]">Why a likely operator is named</div>
                  <ul className="list-disc list-inside text-[11px] text-[#C8D0DC] space-y-0.5">
                    {att.likely_operator.basis.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="p-4 rounded-2xl glass-card">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase mb-3">
                <Clock className="w-4 h-4" /> Timeline
              </div>
              <ol className="relative border-l border-white/[0.1] ml-1.5 space-y-3">
                {result.timeline.map((ev, i) => {
                  const st = SEV_STYLE[ev.severity] || SEV_STYLE.info;
                  return (
                    <li key={i} className="ml-4">
                      <span className={`absolute -left-[5px] mt-1.5 w-2.5 h-2.5 rounded-full ${st.dot}`} />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono text-[#8994A3]">{ev.time}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-[#8994A3]">
                          {ev.source}
                        </span>
                        <span className={`text-xs font-bold font-mono ${st.text}`}>{ev.title}</span>
                      </div>
                      <div className="text-[11px] text-[#B5BEC9] leading-relaxed mt-0.5">{ev.detail}</div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          <div className="flex items-start gap-2 text-[11px] text-[#8994A3] font-mono px-1">
            <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{res.privacy_note}</span>
          </div>
        </div>
      )}

      {/* Recent evaluations */}
      {recent.length > 1 && (
        <div className="space-y-2">
          <div className="text-xs font-mono font-bold text-[#8994A3] uppercase tracking-wider">Recent evaluations</div>
          <div className="flex flex-wrap gap-2">
            {recent.map((r) => (
              <button
                key={r.id}
                onClick={() => setResult(r)}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-mono transition-all hover:bg-white/[0.05] ${
                  result?.id === r.id ? 'border-violet-400/60 text-violet-200' : 'border-white/[0.1] text-[#B5BEC9]'
                }`}
              >
                {r.id} · {r.result.decision_label.split(' + ')[0]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
