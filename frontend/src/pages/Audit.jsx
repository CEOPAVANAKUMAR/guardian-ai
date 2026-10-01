import React, { useState, useEffect } from 'react';
import { fetchAuditTrail, verifyAuditChain, simulateTampering } from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import RiskGauge from '../components/RiskGauge';
import DecisionBadge from '../components/DecisionBadge';
import {
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Flame,
  ChevronRight,
  ArrowDown,
  Layers,
  Database,
  Key,
  Copy,
  Check,
} from 'lucide-react';

/**
 * Audit - Tamper-Evident Cryptographic Audit Ledger
 * Visually linked blocks, HMAC-SHA256 signatures, verification banner,
 * and interactive tamper detection simulation.
 */
export default function Audit({ onNavigateToIncidents }) {
  const [trail, setTrail] = useState([]);
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tampering, setTampering] = useState(false);
  const [copiedHash, setCopiedHash] = useState(null);

  const loadData = async () => {
    try {
      const [t, v] = await Promise.all([fetchAuditTrail(), verifyAuditChain()]);
      setTrail(t);
      setVerification(v);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [verifyingStep, setVerifyingStep] = useState(null);

  const handleVerify = async () => {
    setLoading(true);
    setVerifyingStep(0);
    try {
      // Animate step by step
      for (let i = 0; i < Math.min(trail.length, 5); i++) {
        setVerifyingStep(i + 1);
        await new Promise((r) => setTimeout(r, 250));
      }
      const v = await verifyAuditChain();
      setVerification(v);
    } catch (e) {
      alert('Verification failed');
    } finally {
      setLoading(false);
      setTimeout(() => setVerifyingStep(null), 1500);
    }
  };

  const handleSimulateTamper = async () => {
    setTampering(true);
    setVerifyingStep(1);
    try {
      await simulateTampering(0);
      await new Promise((r) => setTimeout(r, 300));
      setVerifyingStep(2);
      await new Promise((r) => setTimeout(r, 300));
      await loadData();
    } catch (e) {
      alert(e.message || 'Tamper simulation failed');
    } finally {
      setTampering(false);
      setTimeout(() => setVerifyingStep(null), 1500);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopiedHash(key);
    setTimeout(() => setCopiedHash(null), 1800);
  };

  const isVerified = verification?.is_valid;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8 font-sans">
      {/* ---------------------------------------------------- */}
      {/* LEVEL 1: CRYPTOGRAPHIC LEDGER CONTROL HUD            */}
      {/* ---------------------------------------------------- */}
      <div className="p-3.5 rounded-2xl glass-card border border-white/[0.12] bg-gradient-to-r from-slate-900/40 via-[#0F1420] to-[#0A0D14] flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-white/[0.08] border border-white/[0.15] text-white">
              <Fingerprint className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[10px] text-[#8994A3] uppercase">LEDGER INTEGRITY</div>
              <div className={`font-bold flex items-center gap-1.5 ${isVerified ? 'text-emerald-400' : 'text-rose-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isVerified ? 'bg-emerald-400' : 'bg-rose-400 animate-pulse'}`} />
                <span>{isVerified ? 'CHAIN INTEGRITY: VERIFIED' : 'TAMPER DETECTED'}</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:block h-6 w-px bg-white/[0.08]" />

          <div className="flex flex-col">
            <span className="text-[10px] text-[#8994A3] uppercase">BLOCK HEIGHT</span>
            <span className="text-[#F4F6F8] font-bold">{trail.length} HMAC Blocks Chained</span>
          </div>

          <div className="hidden sm:block h-6 w-px bg-white/[0.08]" />

          <div className="hidden md:flex flex-col">
            <span className="text-[10px] text-[#8994A3] uppercase">PROVENANCE CIPHER</span>
            <span className="text-cyan-400 font-bold">HMAC-SHA256 (Immutable)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateTamper}
            disabled={tampering}
            className="px-3 py-1.5 rounded-xl font-mono text-xs font-semibold bg-rose-950/30 hover:bg-rose-950/50 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Alters an audit record without a valid signature to test HMAC tamper detection"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>SIMULATE TAMPER</span>
          </button>

          <button
            onClick={handleVerify}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black flex items-center gap-1.5 transition-all shadow-md active:scale-[0.98]"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>VERIFY AUDIT CHAIN</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* LEVEL 2: VERIFICATION STATUS BANNER                  */}
      {/* ---------------------------------------------------- */}
      {verification && (
        <div
          className={`p-5 rounded-2xl border backdrop-blur-xl transition-all shadow-xl ${
            isVerified
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/30 border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              {isVerified ? (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <div className="text-base font-bold font-mono tracking-wide text-[#F4F6F8]">
                    {isVerified ? 'CHAIN INTEGRITY: VERIFIED & INTACT' : 'CRITICAL INCIDENT: AUDIT INTEGRITY FAILURE'}
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-black ${
                      isVerified
                        ? 'bg-emerald-500 text-black'
                        : 'bg-rose-500 text-black'
                    }`}
                  >
                    {isVerified ? 'CHAIN VALID' : 'CHAIN INVALID'}
                  </span>
                </div>
                <div className="text-xs text-[#B5BEC9] mt-1 font-mono">{verification.details}</div>

                {!isVerified && (
                  <div className="mt-3 p-3 rounded-xl bg-black/50 border border-rose-500/40 font-mono text-xs space-y-1">
                    <div className="text-rose-400 font-bold uppercase tracking-wider text-[11px]">
                      SECTOR: AUDIT & COMPLIANCE BREACH DETECTED
                    </div>
                    <div className="text-[#C8D0DC] text-[11px] leading-relaxed">
                      <span className="font-semibold text-white">Recommended Solution: </span>
                      Isolate affected ledger partitions, freeze credential scopes, cross-reference external immutable logs, and restore from trusted state.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-end gap-3 shrink-0">
              <div className="text-xs font-mono text-[#8994A3] px-3 py-1.5 rounded-lg bg-black/40 border border-white/[0.08]">
                Verified Blocks: <span className="text-[#F4F6F8] font-bold text-sm ml-1">{verification.total_records}</span>
              </div>

              {!isVerified && onNavigateToIncidents && (
                <button
                  onClick={() => onNavigateToIncidents()}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-black font-mono text-xs font-bold flex items-center gap-1.5 shadow-md transition-all shrink-0"
                >
                  <span>VIEW INCIDENT FORENSICS</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* LEVEL 3: LINKED BLOCKCHAIN-STYLE LEDGER TIMELINE     */}
      {/* ---------------------------------------------------- */}
      {trail.length === 0 ? (
        <EmptyState
          title="Audit Ledger Empty"
          description="Trigger authorizations from the Threat Intel simulator to generate cryptographically chained blocks!"
          actionLabel="Open Threat Intel Simulator"
          onAction={() => onNavigateToIncidents && onNavigateToIncidents()}
        />
      ) : (
        <div className="relative space-y-3.5">
          {/* Subtle vertical connector guide line */}
          <div className="absolute top-8 bottom-8 left-8 w-[2px] bg-gradient-to-b from-cyan-500/40 via-white/[0.08] to-cyan-500/20 hidden md:block" />

          {trail.map((entry, idx) => {
            const isTargetInvalid =
              verification &&
              !verification.is_valid &&
              (verification.invalid_record_id === entry.id || verification.invalid_index === idx);

            const blockNumber = String(idx + 1).padStart(3, '0');

            return (
              <div key={entry.id} className="relative md:pl-16">
                {/* Block Number node on the timeline */}
                <div
                  className={`hidden md:flex absolute top-5 left-4 -translate-x-1/2 w-8 h-8 rounded-full border items-center justify-center font-mono text-[10px] font-bold z-10 transition-all duration-300 ${
                    isTargetInvalid
                      ? 'bg-rose-950 border-rose-500 text-rose-300 ring-4 ring-rose-500/30 animate-pulse'
                      : verifyingStep && verifyingStep >= idx + 1
                      ? 'bg-emerald-950 border-emerald-400 text-emerald-300 ring-4 ring-emerald-500/30'
                      : 'bg-[#0F1420] border-cyan-500/50 text-cyan-400'
                  }`}
                >
                  {isTargetInvalid ? '✕' : verifyingStep && verifyingStep >= idx + 1 ? '✓' : blockNumber}
                </div>

                <div
                  className={`p-4.5 rounded-2xl glass-card transition-all duration-300 ${
                    isTargetInvalid
                      ? 'border-rose-500/90 bg-rose-950/30 shadow-[0_0_25px_rgba(244,63,94,0.3)] ring-2 ring-rose-500/50'
                      : verifyingStep && verifyingStep >= idx + 1
                      ? 'border-emerald-500/60 bg-emerald-950/20 shadow-[0_0_20px_rgba(24,201,133,0.2)]'
                      : ''
                  }`}
                >
                  {/* Broken Connection Notice */}
                  {isTargetInvalid && (
                    <div className="mb-3 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-mono font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                        <span>🚨 CHAIN BROKEN AT BLOCK #{blockNumber}: HMAC HASH MISMATCH</span>
                      </span>
                      <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-rose-500 text-black">
                        INTEGRITY FAILURE
                      </span>
                    </div>
                  )}

                  {/* Top Bar: Block ID, Agent, Taint, Decision */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400">BLOCK #{blockNumber}</span>
                      <span className="font-mono text-xs text-[#8994A3]">({entry.id})</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/[0.04] text-[#C8D0DC] font-mono border border-white/[0.08]">
                        Agent: <span className="text-white font-semibold">{entry.agent_id}</span>
                      </span>
                      {entry.tampered && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 font-mono animate-bounce">
                          TAMPERED ENTRY
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <RiskGauge risk={entry.risk_level} />
                      <DecisionBadge decision={entry.decision} />
                    </div>
                  </div>

                  {/* Block Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-2.5 text-xs font-mono bg-black/30 p-3 rounded-xl border border-white/[0.06]">
                    <div>
                      <span className="text-[#8994A3]">Action: </span>
                      <span className="text-white font-semibold">{entry.action_type}</span>
                    </div>
                    <div>
                      <span className="text-[#8994A3]">Resource: </span>
                      <span className="text-amber-300 font-semibold">{entry.resource}</span>
                    </div>
                    <div>
                      <span className="text-[#8994A3]">Taint State: </span>
                      <span
                        className={`font-bold ${
                          ['CLEAN', 'IDENTITY_VERIFIED'].includes(entry.taint_level)
                            ? 'text-emerald-400'
                            : entry.taint_level === 'IDENTITY_UNCERTAIN'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {entry.taint_level}
                      </span>
                    </div>
                  </div>

                  {/* Cryptographic Linkage Hashes */}
                  <div className="space-y-1.5 text-[11px] font-mono bg-black/20 p-2.5 rounded-xl border border-white/[0.04]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[#8994A3]">
                      <span className="flex items-center gap-1.5 text-[#8994A3] shrink-0">
                        <Key className="w-3 h-3 text-[#8994A3]" />
                        Previous Block Hash:
                      </span>
                      <span className="text-[#8994A3] truncate max-w-full sm:max-w-md">{entry.prev_hash}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[#C8D0DC]">
                      <span className="flex items-center gap-1.5 text-cyan-400 shrink-0 font-semibold">
                        <Fingerprint className="w-3 h-3 text-cyan-400" />
                        HMAC-SHA256 Signature:
                      </span>
                      <div className="flex items-center gap-2 truncate max-w-full sm:max-w-md">
                        <span className="text-cyan-400 font-bold truncate">{entry.current_hash}</span>
                        <button
                          onClick={() => copyToClipboard(entry.current_hash, `curr_${entry.id}`)}
                          className="p-1 rounded hover:bg-white/[0.1] text-[#8994A3] hover:text-white transition-colors shrink-0"
                          title="Copy hash"
                        >
                          {copiedHash === `curr_${entry.id}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
