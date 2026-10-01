import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Bot,
  FileCode,
  KeyRound,
  ArrowDown,
  RotateCcw,
  X,
  AlertTriangle,
  Lock,
  CheckCircle2,
} from 'lucide-react';

/**
 * BeforeAfterComparisonModal - Side-by-Side Visual Architecture Comparison
 * Compares autonomous execution without GuardianAI vs runtime-enforced security with GuardianAI.
 */
export default function BeforeAfterComparisonModal({ isOpen, onClose }) {
  const [step, setStep] = useState(0); // 0: Idle, 1: Attack Propose, 2: Evaluated, 3: Outcome

  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      return;
    }
    setStep(1);
    const t1 = setTimeout(() => setStep(2), 1200);
    const t2 = setTimeout(() => setStep(3), 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isOpen]);

  const handleReplay = () => {
    setStep(1);
    setTimeout(() => setStep(2), 1200);
    setTimeout(() => setStep(3), 2600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 font-sans selection:bg-emerald-500 selection:text-black">
      <div className="relative w-full max-w-5xl rounded-3xl bg-[#050608] border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-white/[0.08] bg-[#0A0D12]/70 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              ARCHITECTURE COMPARISON • 10-SECOND DEMO EXPLANATION
            </div>
            <h2 className="text-xl font-extrabold text-white mt-0.5">
              Autonomous Agent Execution: Without GuardianAI vs With GuardianAI
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReplay}
              className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>REPLAY COMPARISON</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Side-by-Side Split Viewport */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.08] p-6 lg:p-8 gap-6 lg:gap-8 font-mono">
          
          {/* LEFT SIDE: WITHOUT GUARDIANAI */}
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <ShieldAlert className="w-4 h-4" />
                </span>
                <span className="font-bold text-sm text-rose-400">WITHOUT GUARDIANAI</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/30">
                UNPROTECTED RUNTIME
              </span>
            </div>

            <div className="space-y-4">
              {/* Step 1: Agent */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-white font-bold">Autonomous AI Agent</div>
                  <div className="text-[11px] text-slate-400 font-sans">
                    Ingests poisoned invoice with embedded prompt injection.
                  </div>
                </div>
              </div>

              <div className="flex justify-center text-slate-600">
                <ArrowDown className={`w-5 h-5 transition-colors ${step >= 2 ? 'text-rose-400' : 'text-slate-700'}`} />
              </div>

              {/* Step 2: Proposes Action */}
              <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-rose-300 font-bold">Tool Execution: READ_SECRET</div>
                  <div className="text-[11px] text-slate-400 font-sans">
                    Agent follows hijacked instructions directly without boundary checks.
                  </div>
                </div>
              </div>

              <div className="flex justify-center text-slate-600">
                <ArrowDown className={`w-5 h-5 transition-colors ${step >= 3 ? 'text-rose-400' : 'text-slate-700'}`} />
              </div>

              {/* Step 3: Vulnerable Outcome */}
              <div className={`p-4 rounded-2xl border transition-all duration-500 ${
                step >= 3
                  ? 'bg-rose-950/60 border-rose-500 text-rose-200 shadow-[0_0_30px_rgba(244,63,94,0.3)] animate-pulse'
                  : 'bg-white/[0.02] border-white/[0.06] text-slate-500 opacity-50'
              }`}>
                <div className="flex items-center gap-2 mb-2 font-black text-rose-400 text-sm">
                  <AlertTriangle className="w-5 h-5" />
                  <span>CRITICAL BREACH: SECRETS EXPOSED</span>
                </div>
                <div className="text-xs font-sans text-rose-200">
                  Production API credentials leaked directly into attacker context. No audit record, zero authorization intervention.
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: WITH GUARDIANAI */}
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <span className="font-bold text-sm text-emerald-400">WITH GUARDIANAI</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                DETERMINISTIC GATEWAY
              </span>
            </div>

            <div className="space-y-4">
              {/* Step 1: Agent */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-white font-bold">Autonomous AI Agent</div>
                  <div className="text-[11px] text-slate-400 font-sans">
                    Ingests poisoned invoice with embedded prompt injection.
                  </div>
                </div>
              </div>

              <div className="flex justify-center text-slate-600">
                <ArrowDown className={`w-5 h-5 transition-colors ${step >= 2 ? 'text-emerald-400' : 'text-slate-700'}`} />
              </div>

              {/* Step 2: GuardianAI Intercept */}
              <div className={`p-3.5 rounded-2xl border transition-all duration-300 ${
                step >= 2
                  ? 'bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border-emerald-500/60 shadow-[0_0_20px_rgba(24,201,133,0.15)]'
                  : 'bg-white/[0.02] border-white/[0.06] opacity-50'
              } flex items-center gap-3`}>
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-emerald-300 font-bold">
                    GuardianAI Runtime Authorization
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans">
                    Evaluates provenance (EXTERNAL_UNTRUSTED) & task manifest before tool call.
                  </div>
                </div>
              </div>

              <div className="flex justify-center text-slate-600">
                <ArrowDown className={`w-5 h-5 transition-colors ${step >= 3 ? 'text-emerald-400' : 'text-slate-700'}`} />
              </div>

              {/* Step 3: Protected Outcome */}
              <div className={`p-4 rounded-2xl border transition-all duration-500 ${
                step >= 3
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 shadow-[0_0_30px_rgba(24,201,133,0.3)]'
                  : 'bg-white/[0.02] border-white/[0.06] text-slate-500 opacity-50'
              }`}>
                <div className="flex items-center gap-2 mb-2 font-black text-emerald-400 text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>ACTION DENIED • ZERO LEAKAGE</span>
                </div>
                <div className="text-xs font-sans text-emerald-200">
                  Policy POL-004 enforced. Execution halted within 1.25ms AST. Permanently anchored into HMAC-SHA256 audit ledger.
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-white/[0.08] bg-[#0A0D12]/70 flex items-center justify-between text-xs font-mono text-slate-400">
          <div>The AI proposes. GuardianAI decides.</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold transition-all"
          >
            ENTER OPERATING SYSTEM
          </button>
        </div>

      </div>
    </div>
  );
}
