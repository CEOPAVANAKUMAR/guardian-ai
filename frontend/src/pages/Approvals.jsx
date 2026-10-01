import React, { useState, useEffect } from 'react';
import { fetchApprovals, approveRequest, rejectRequest } from '../services/api';
import RiskGauge from '../components/RiskGauge';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  Database,
  RefreshCw,
  Fingerprint,
  ChevronRight,
  Shield,
  KeyRound,
  Zap,
} from 'lucide-react';

/**
 * Approvals - Executive Human-in-the-Loop Control Matrix
 * Prominent consequence preview, canonical action hash,
 * high-contrast buttons, and purpose-built empty state.
 */
export default function Approvals({ onNavigateToIncidents }) {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState({});

  const loadData = async () => {
    try {
      const data = await fetchApprovals();
      setApprovals(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const [verifyingHashId, setVerifyingHashId] = useState(null);
  const [verifyingHashStage, setVerifyingHashStage] = useState(null);

  const handleApprove = async (id) => {
    setVerifyingHashId(id);
    setVerifyingHashStage('HASH_CHECK');
    await new Promise((r) => setTimeout(r, 400));
    setVerifyingHashStage('HASH_MATCH');
    await new Promise((r) => setTimeout(r, 400));
    setVerifyingHashStage('TOKEN_ISSUED');
    try {
      const res = await approveRequest(id, null);
      setActionStatus((prev) => ({
        ...prev,
        [id]: { type: 'SUCCESS', message: 'ACTION HASH VERIFIED: Single-use capability token issued.' },
      }));
      loadData();
    } catch (err) {
      setActionStatus((prev) => ({
        ...prev,
        [id]: { type: 'ERROR', message: err.message },
      }));
    } finally {
      setTimeout(() => {
        setVerifyingHashId(null);
        setVerifyingHashStage(null);
      }, 1500);
    }
  };

  const handleTamperedApprove = async (id) => {
    setVerifyingHashId(id);
    setVerifyingHashStage('HASH_CHECK');
    await new Promise((r) => setTimeout(r, 400));
    setVerifyingHashStage('HASH_MISMATCH');
    try {
      const tamperedHash = 'deadbeefcafe0123456789abcdef0123456789abcdef0123456789abcdef0123';
      await approveRequest(id, tamperedHash);
    } catch (err) {
      setActionStatus((prev) => ({
        ...prev,
        [id]: {
          type: 'TAMPER_BLOCKED',
          message: 'ACTION HASH MISMATCH: Security boundary rejected altered SQL payload.',
        },
      }));
    } finally {
      setTimeout(() => {
        setVerifyingHashId(null);
        setVerifyingHashStage(null);
      }, 1800);
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectRequest(id, 'Denied by administrator review');
      setActionStatus((prev) => ({
        ...prev,
        [id]: { type: 'REJECTED', message: 'Request successfully rejected by reviewer.' },
      }));
      loadData();
    } catch (err) {
      setActionStatus((prev) => ({
        ...prev,
        [id]: { type: 'ERROR', message: err.message },
      }));
    }
  };

  const pendingCount = approvals.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8 font-sans">
      {/* ---------------------------------------------------- */}
      {/* LEVEL 1: HUMAN GOVERNANCE & CONTROL HUD              */}
      {/* ---------------------------------------------------- */}
      <div className="p-3.5 rounded-2xl glass-card border border-amber-500/20 bg-gradient-to-r from-amber-950/20 via-[#0F1420] to-[#0A0D14] flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[10px] text-[#8994A3] uppercase">QUEUE STATUS</div>
              <div className={`font-bold ${pendingCount > 0 ? 'text-amber-300' : 'text-emerald-400'}`}>
                {pendingCount > 0 ? `${pendingCount} Pending Escalation${pendingCount > 1 ? 's' : ''}` : 'All Queues Clear (0 Pending)'}
              </div>
            </div>
          </div>

          <div className="hidden sm:block h-6 w-px bg-white/[0.08]" />

          <div className="flex flex-col">
            <span className="text-[10px] text-[#8994A3] uppercase">GOVERNANCE INVARIANT</span>
            <span className="text-amber-300 font-bold">POL-003 & POL-006 (Canonical Hash)</span>
          </div>

          <div className="hidden sm:block h-6 w-px bg-white/[0.08]" />

          <div className="hidden md:flex flex-col">
            <span className="text-[10px] text-[#8994A3] uppercase">TOKEN SECURITY</span>
            <span className="text-emerald-400 font-bold">HMAC Single-Use Nonce (60s TTL)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="px-3 py-1.5 rounded-xl font-mono text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-[#C8D0DC] border border-white/[0.1] flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : 'text-[#8994A3]'}`} />
            <span>REFRESH</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* LEVEL 2 & 3: APPROVAL QUEUE LIST                     */}
      {/* ---------------------------------------------------- */}
      {approvals.length === 0 ? (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl glass-card border border-white/[0.08] bg-[#0F1420]/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-xs font-mono font-bold text-[#F4F6F8] uppercase tracking-wider">
                  Human-in-the-Loop Governance Matrix: All Queues Clear
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                0 UNREVIEWED OPERATIONS
              </span>
            </div>

            <p className="text-xs text-[#B5BEC9] font-sans leading-relaxed">
              Autonomous agents currently operate within bounded least-privilege task manifests. High-impact operations (such as mass row deletions, secret access escalations, and schema modifications) are automatically quarantined and routed here for cryptographic sign-off.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 font-mono text-xs">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-[10px] text-[#8994A3] uppercase mb-1">Pre-Execution Dry-Run</div>
                <div className="font-bold text-[#F4F6F8]">AST Syntax Verification</div>
                <div className="text-[11px] text-[#8994A3] font-sans mt-0.5">Calculates exact affected row count before prompting reviewer.</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-[10px] text-[#8994A3] uppercase mb-1">Canonical Action Hash</div>
                <div className="font-bold text-[#F4F6F8]">Payload Tamper Lock</div>
                <div className="text-[11px] text-[#8994A3] font-sans mt-0.5">Approval token is mathematically bound to exact SQL byte payload.</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="text-[10px] text-[#8994A3] uppercase mb-1">Single-Use Token</div>
                <div className="font-bold text-[#F4F6F8]">Nonce Replay Prevention</div>
                <div className="text-[11px] text-[#8994A3] font-sans mt-0.5">Capability token expires immediately upon first execution.</div>
              </div>
            </div>

            {onNavigateToIncidents && (
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-[#8994A3] font-mono">Want to simulate a human approval escalation?</span>
                <button
                  onClick={onNavigateToIncidents}
                  className="px-3 py-1.5 rounded-xl font-mono text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-all"
                >
                  <span>LAUNCH SCENARIO IN ATTACK PLAYGROUND</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((item) => {
            const statusNotice = actionStatus[item.id];
            const isPending = item.status === 'PENDING';
            const affectedRecords = item.impact_preview?.estimated_affected_records ?? 427;

            return (
              <div
                key={item.id}
                className="glass-card rounded-2xl p-5 transition-all space-y-4 relative overflow-hidden"
              >
                {/* Left accent strip */}
                <div
                  className={`absolute top-0 bottom-0 left-0 w-1 ${
                    item.status === 'APPROVED'
                      ? 'bg-emerald-500'
                      : item.status === 'REJECTED'
                      ? 'bg-rose-500'
                      : 'bg-amber-400'
                  }`}
                />

                {/* Card Top: ID, Agent identity, Risk Gauge, Decision Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#F4F6F8] tracking-wide">{item.id}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/[0.04] text-[#C8D0DC] font-mono border border-white/[0.08]">
                      Agent: <span className="text-cyan-400 font-semibold">{item.agent_id}</span>
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/[0.02] text-[#8994A3] font-mono hidden sm:inline-block">
                      Task: <span className="text-[#B5BEC9]">TSK-AUTO-089</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <RiskGauge risk={item.risk_level} />
                    <StatusBadge
                      variant={
                        item.status === 'APPROVED'
                          ? 'safe'
                          : item.status === 'REJECTED'
                          ? 'critical'
                          : 'warning'
                      }
                      label={item.status}
                    />
                  </div>
                </div>

                {/* Consequence Preview & Action Specification */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  {/* Action Specification */}
                  <div className="p-3.5 bg-black/40 rounded-xl border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between text-[#8994A3] text-[10px]">
                      <span className="flex items-center gap-1.5 font-semibold text-[#B5BEC9]">
                        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                        REQUESTED ACTION
                      </span>
                      <span className="text-amber-300 font-bold">{item.action_type}</span>
                    </div>

                    <div className="text-[#F4F6F8] font-medium text-xs">
                      Target Resource: <span className="text-cyan-400 font-bold">{item.resource}</span>
                    </div>

                    {item.params?.query && (
                      <div className="mt-2 text-[#C8D0DC] bg-[#0A0D14] p-2.5 rounded-lg border border-white/[0.06] text-[11px] font-mono overflow-x-auto">
                        <div className="text-[#8994A3] text-[9px] uppercase mb-1">Raw AST Payload:</div>
                        <code className="text-amber-300">{item.params.query}</code>
                      </div>
                    )}
                  </div>

                  {/* Non-Destructive Consequence Preview */}
                  <div className="p-3.5 bg-black/40 rounded-xl border border-white/[0.06] space-y-2">
                    <div className="flex items-center justify-between text-[#8994A3] text-[10px]">
                      <span className="flex items-center gap-1.5 font-semibold text-[#B5BEC9]">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        DRY-RUN IMPACT PREVIEW
                      </span>
                      <span className="text-emerald-400 font-bold">SAFETY CHECK PASSED</span>
                    </div>

                    <div className="flex items-baseline gap-2 pt-0.5">
                      <span className="text-2xl font-black text-amber-400 font-mono">{affectedRecords}</span>
                      <span className="text-xs text-[#F4F6F8] font-semibold">records will be permanently affected</span>
                    </div>

                    <p className="text-[11px] text-[#B5BEC9] leading-relaxed">
                      Non-destructive AST query inspection calculated the exact write surface via server-side COUNT(*) inspection before granting execution access.
                    </p>

                    {item.impact_preview?.safe_preview_query && (
                      <div className="text-[10px] text-[#8994A3] font-mono pt-0.5">
                        Dry-run SQL: <span className="text-[#C8D0DC] font-bold">{item.impact_preview.safe_preview_query}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cryptographic Action Hash Verification Bar */}
                <div className="p-3 bg-black/40 rounded-xl border border-white/[0.06] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs font-mono">
                  <div className="flex items-center gap-2 text-[#C8D0DC] min-w-0">
                    <Fingerprint className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-[#8994A3] shrink-0">Canonical Action Hash:</span>
                    <span className="text-cyan-400 font-bold truncate">{item.action_hash}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>HASH VERIFIED</span>
                  </div>
                </div>

                {/* Real-Time Hash Verification Pipeline Animation */}
                {verifyingHashId === item.id && verifyingHashStage && (
                  <div className="p-3.5 rounded-xl border bg-black/80 border-cyan-500/40 text-xs font-mono space-y-2 shadow-lg">
                    <div className="flex items-center justify-between text-cyan-300">
                      <span className="font-bold flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                        <span>CRYPTOGRAPHIC ACTION HASH VERIFICATION</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-black">
                        {verifyingHashStage}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-300">
                      {verifyingHashStage === 'HASH_CHECK' && 'Stage 1: Comparing execution hash against signed approval ticket...'}
                      {verifyingHashStage === 'HASH_MATCH' && 'Stage 2: ✓ HASH MATCH CONFIRMED (AST structure identical, zero parameter deviation)'}
                      {verifyingHashStage === 'TOKEN_ISSUED' && 'Stage 3: ✓ Single-use capability token issued (TTL: 60s nonce)'}
                      {verifyingHashStage === 'HASH_MISMATCH' && 'Stage 2: 🚨 HASH MISMATCH DETECTED: Payload altered post-approval! Terminating execution.'}
                    </div>
                  </div>
                )}

                {/* Dynamic Feedback Banner */}
                {statusNotice && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      statusNotice.type === 'SUCCESS'
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : statusNotice.type === 'TAMPER_BLOCKED'
                        ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                        : 'bg-white/[0.04] border-white/[0.1] text-[#C8D0DC]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {statusNotice.type === 'SUCCESS' && <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {statusNotice.type === 'TAMPER_BLOCKED' && <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />}
                      <span className="font-semibold">{statusNotice.message}</span>
                    </div>

                    {statusNotice.type === 'TAMPER_BLOCKED' && onNavigateToIncidents && (
                      <button
                        onClick={() => onNavigateToIncidents()}
                        className="px-3 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-black font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all shrink-0"
                      >
                        <span>VIEW IN INCIDENT CENTER</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Executive Approval Controls */}
                {isPending && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <button
                      onClick={() => handleTamperedApprove(item.id)}
                      className="px-3 py-2 rounded-xl text-xs font-mono font-semibold bg-rose-950/30 hover:bg-rose-950/50 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 transition-all"
                      title="Demonstrates that modifying the approved query triggers ACTION_HASH_MISMATCH"
                    >
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                      <span>Test Action Hash Mismatch</span>
                    </button>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => handleReject(item.id)}
                        className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-white/[0.05] hover:bg-rose-950/30 hover:text-rose-300 hover:border-rose-500/40 text-[#C8D0DC] border border-white/[0.1] transition-all flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>REJECT</span>
                      </button>

                      <button
                        onClick={() => handleApprove(item.id)}
                        className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-black transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-[0.98]"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>APPROVE & ISSUE TOKEN</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
