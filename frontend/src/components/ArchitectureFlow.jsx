import React, { useState, useEffect } from 'react';
import {
  User,
  Cpu,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Database,
  Lock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Fingerprint,
  FileCode,
  FileCheck2,
  SlidersHorizontal,
  ChevronRight,
  Radio,
  Layers,
  Sparkles,
  Play,
  RotateCcw,
} from 'lucide-react';

/**
 * ArchitectureFlow - 9-Stage Zero-Trust Interception Pipeline with Live Signal Pulse
 * Features:
 * - Animated glowing signal moving from stage to stage
 * - Real-time gate validation checkmarks and taint inspection
 * - Physical intercept barrier halt at GuardianAI / Policy Engine
 * - Interactive Replay / Step-through simulation
 */
export default function ArchitectureFlow({
  activeStep = null,
  outcome = null,
  decision = null,
  risk = null,
  guardianEnabled = true,
  onViewIncident = null,
  scenarioName = 'Poisoned PDF Injection',
}) {
  const [pulseStage, setPulseStage] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Pipeline definition
  const pipelineStages = [
    { id: 'ATTACK_INPUT', num: 1, label: 'Attack Input', sub: 'Adversarial Prompt/File', icon: User, check: 'INGESTED' },
    { id: 'AI_AGENT', num: 2, label: 'AI Agent', sub: 'Autonomous Reasoner', icon: Cpu, check: 'PROPOSED' },
    { id: 'GUARDIAN_INTERCEPT', num: 3, label: 'Guardian Gate', sub: guardianEnabled ? 'Memory Intercept' : 'BYPASSED', icon: ShieldCheck, highlight: true, check: guardianEnabled ? 'INTERCEPT' : 'BYPASS' },
    { id: 'IDENTITY_CHECK', num: 4, label: 'Identity Check', sub: 'HMAC Credential', icon: Fingerprint, check: 'VERIFIED' },
    { id: 'TASK_SCOPE', num: 5, label: 'Task Scope', sub: 'Signed Manifest', icon: Lock, check: outcome === 'ALLOWED' ? 'SCOPED' : 'OOB' },
    { id: 'PROVENANCE_TAINT', num: 6, label: 'Taint Engine', sub: 'Monotonic Provenance', icon: Layers, check: outcome === 'ALLOWED' ? 'CLEAN' : 'UNTRUSTED' },
    { id: 'POLICY_ENGINE', num: 7, label: 'Policy Engine', sub: 'Deterministic AST', icon: FileCode, check: outcome === 'ALLOWED' ? 'PASS' : 'FAIL' },
    { id: 'RISK_ENGINE', num: 8, label: 'Risk Engine', sub: 'AST AST & Impact Check', icon: SlidersHorizontal, check: outcome === 'ALLOWED' ? 'LOW' : 'CRITICAL' },
    { id: 'DECISION', num: 9, label: 'Decision Gate', sub: outcome ? `OUTCOME: ${outcome}` : 'Token / Deny Ticket', icon: outcome === 'ALLOWED' ? CheckCircle : XCircle, check: outcome || 'PENDING' },
  ];

  // Auto-run pulse when outcome changes or activeStep changes
  useEffect(() => {
    if (activeStep || outcome) {
      runPipelinePulse();
    }
  }, [activeStep, outcome]);

  const runPipelinePulse = () => {
    setIsSimulating(true);
    setPulseStage(1);
    
    // Stop at stage 7/8 if blocked, or go all the way to 9 if allowed
    const maxStages = outcome === 'BLOCKED' && guardianEnabled ? 7 : 9;
    
    let current = 1;
    const interval = setInterval(() => {
      current += 1;
      if (current > maxStages) {
        clearInterval(interval);
        setIsSimulating(false);
      } else {
        setPulseStage(current);
      }
    }, 350);
  };

  const decisionsList = [
    { label: 'ALLOW', color: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300' },
    { label: 'ALLOW WITH CONSTRAINTS', color: 'border-cyan-500/40 bg-cyan-950/30 text-cyan-300' },
    { label: 'ESCALATE', color: 'border-amber-500/40 bg-amber-950/30 text-amber-300' },
    { label: 'DENY', color: 'border-rose-500/40 bg-rose-950/30 text-rose-300' },
  ];

  const isThreatOrBlocked =
    outcome === 'BLOCKED' ||
    outcome === 'ESCALATED' ||
    decision === 'DENY' ||
    decision === 'ESCALATE' ||
    risk === 'CRITICAL' ||
    risk === 'HIGH';

  return (
    <div className="bg-[#0A0D12]/90 border border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl font-mono">
      {/* Laser Track Progress Line Across Stages */}
      {pulseStage && (
        <div
          className="absolute top-0 left-0 h-1 bg-gradient-to-r from-cyan-500 via-violet-500 to-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.8)] transition-all duration-300"
          style={{ width: `${(pulseStage / 9) * 100}%` }}
        />
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-bold mb-0.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>STRICT ZERO-TRUST INTERCEPTION PIPELINE</span>
            <span className="text-[10px] px-2 py-0.2 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
              DEMO / SIMULATED ATTACK
            </span>
          </div>
          <h3 className="text-sm font-black tracking-wide text-white uppercase">
            Deterministic Runtime Architecture Flow
          </h3>
          <p className="text-[11px] text-slate-400 font-sans mt-0.5">
            Untrusted AI proposals pass through 9 deterministic validation gates before capability token issuance.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={runPipelinePulse}
            disabled={isSimulating}
            className="px-3 py-1 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/40 text-violet-300 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Play className="w-3 h-3 fill-violet-400" />
            <span>{isSimulating ? 'EVALUATING...' : 'ANIMATE PIPELINE'}</span>
          </button>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              guardianEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30 ring-2 ring-rose-500/20 animate-pulse'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${guardianEnabled ? 'bg-emerald-400' : 'bg-rose-500'}`} />
            GUARDIAN: {guardianEnabled ? 'ACTIVE (MONITORED)' : 'OFF (BYPASS)'}
          </span>
        </div>
      </div>

      {/* 9-Stage Flow Diagram Grid */}
      <div className="grid grid-cols-3 md:grid-cols-9 gap-2 relative">
        {pipelineStages.map((stage) => {
          const Icon = stage.icon;
          const isCurrentPulse = pulseStage === stage.num;
          const isPassedPulse = pulseStage && pulseStage > stage.num;
          const isHaltGate = pulseStage === 7 && outcome === 'BLOCKED' && stage.num === 7;

          let cardStyle = 'border-white/[0.08] bg-obsidian-900/60 text-slate-400';
          let iconBadgeStyle = 'bg-white/[0.05] text-slate-300';

          if (isCurrentPulse) {
            if (isHaltGate) {
              cardStyle = 'border-rose-500 bg-rose-950/80 text-rose-200 ring-2 ring-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.4)] scale-105';
              iconBadgeStyle = 'bg-rose-500 text-black font-bold';
            } else {
              cardStyle = 'border-cyan-400 bg-cyan-950/70 text-cyan-200 ring-2 ring-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-105';
              iconBadgeStyle = 'bg-cyan-400 text-black font-bold';
            }
          } else if (isPassedPulse) {
            cardStyle = 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300';
            iconBadgeStyle = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
          } else if (stage.highlight) {
            cardStyle = guardianEnabled
              ? 'border-emerald-500/40 bg-obsidian-900/90 text-emerald-300'
              : 'border-rose-500/50 bg-rose-950/30 text-rose-300';
          }

          return (
            <div key={stage.id} className="relative flex flex-col items-center">
              <div
                className={`w-full p-2.5 rounded-2xl border flex flex-col items-center text-center transition-all duration-300 min-h-[105px] justify-between ${cardStyle}`}
              >
                <div className="flex items-center justify-between w-full px-1">
                  <span className="text-[9px] text-slate-400 font-bold">#{stage.num}</span>
                  {isPassedPulse && (
                    <span className="text-[8px] text-emerald-400 font-black">✓ PASS</span>
                  )}
                  {isHaltGate && (
                    <span className="text-[8px] text-rose-400 font-black animate-pulse">✕ BLOCKED</span>
                  )}
                </div>

                <div className={`p-1.5 rounded-xl ${iconBadgeStyle} transition-all`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="w-full">
                  <div className="text-[11px] font-bold text-white leading-tight truncate">
                    {stage.label}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate mt-0.5 font-sans">
                    {stage.sub}
                  </div>
                </div>
              </div>

              {stage.num < 9 && (
                <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-white/20 pointer-events-none text-xs">
                  ›
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Decision Possibilities Display */}
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-slate-400 uppercase text-[10px] tracking-wider">
          Enforced Decision Matrix:
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {decisionsList.map((d) => (
            <span
              key={d.label}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${d.color}`}
            >
              {d.label}
            </span>
          ))}
        </div>
      </div>

      {/* Outcome Banner & Incident Navigation */}
      {outcome && (
        <div
          className={`mt-4 p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
            outcome === 'BLOCKED'
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              : outcome === 'ESCALATED'
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
              : outcome === 'ALLOWED'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/50 border-rose-500/70 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {outcome === 'BLOCKED' && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            {outcome === 'ESCALATED' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
            {outcome === 'ALLOWED' && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
            {outcome === 'EXPLOITED' && <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 animate-bounce" />}
            <div>
              <div className="font-bold tracking-wider text-xs flex items-center gap-2">
                <span>OUTCOME: {outcome}</span>
                {decision ? <span>• DECISION: {decision}</span> : ''}
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white font-normal">
                  1.25ms AST Latency
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-sans mt-0.5">
                {outcome === 'BLOCKED' && 'Intercepted at runtime. Deny decision recorded in immutable HMAC audit log.'}
                {outcome === 'ESCALATED' && 'Sensitive operation routed to human approval queue with dry-run impact preview.'}
                {outcome === 'ALLOWED' && 'Legitimate action validated against task manifest scope. Signed capability token issued.'}
                {outcome === 'EXPLOITED' && 'CRITICAL: Attack succeeded in unprotected mode (Guardian was turned OFF)!'}
              </div>
            </div>
          </div>

          {/* VIEW INCIDENT ANALYSIS button */}
          {isThreatOrBlocked && onViewIncident && (
            <button
              onClick={() => onViewIncident()}
              className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 active:bg-rose-600 text-black text-xs font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-lg shadow-rose-500/20"
            >
              <span>VIEW INCIDENT ANALYSIS</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
