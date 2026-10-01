import React from 'react';
import { Shield, Lock, FileText, CheckCircle2, X } from 'lucide-react';

/**
 * LegalModal - Enterprise Privacy, Terms & Security Governance Modal
 * (Prevents dead links in the enterprise footer)
 */
export default function LegalModal({ isOpen, type = 'privacy', onClose }) {
  if (!isOpen) return null;

  const contentMap = {
    privacy: {
      title: 'Enterprise Privacy & Telemetry Disclosure',
      subtitle: 'Zero Personal Data Ingestion • Local Session Isolation',
      body: (
        <div className="space-y-4 text-xs font-sans text-slate-300">
          <p>
            GuardianAI operates under strict zero-knowledge principles. Agent proposals, prompt injections, and database queries are evaluated in-memory within local runtime environments.
          </p>
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1 font-mono text-[11px]">
            <div className="text-emerald-400 font-bold">● Local Memory Sanitization</div>
            <div className="text-slate-400">All task manifests and authorization tokens expire within 60 seconds (TTL).</div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1 font-mono text-[11px]">
            <div className="text-cyan-400 font-bold">● No Third-Party Model Egress</div>
            <div className="text-slate-400">Deterministic AST rules are evaluated locally without sending payloads to external cloud LLM providers.</div>
          </div>
        </div>
      ),
    },
    terms: {
      title: 'GuardianAI Terms of Service & License',
      subtitle: 'NRCM CodeStorm 2K26 Demonstration Edition',
      body: (
        <div className="space-y-4 text-xs font-sans text-slate-300">
          <p>
            This software is provided as runtime trust infrastructure for autonomous AI agents. Deterministic policies (POL-001 through POL-008) are provided for security defense and evaluation purposes.
          </p>
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1 font-mono text-[11px]">
            <div className="text-violet-400 font-bold">● Non-Statistical Guarantee</div>
            <div className="text-slate-400">GuardianAI does not rely on probabilistic confidence scores to deny catastrophic operations.</div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1 font-mono text-[11px]">
            <div className="text-amber-400 font-bold">● Simulated Attack Telemetry</div>
            <div className="text-slate-400">Attack Playground scenarios are executed against safe, isolated sandboxes for demonstration.</div>
          </div>
        </div>
      ),
    },
    security: {
      title: 'Cryptographic Security & Verification Posture',
      subtitle: 'HMAC-SHA256 Chained Ledger • Fail-Closed Enforcement',
      body: (
        <div className="space-y-4 text-xs font-sans text-slate-300">
          <p>
            Every security interception is permanently bound to a SHA-256 action hash and signed with an immutable HMAC secret.
          </p>
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1 font-mono text-[11px]">
            <div className="text-emerald-400 font-bold">● Fail-Closed Default</div>
            <div className="text-slate-400">If any evaluation gate fails or encounters an unhandled exception, execution is unconditionally denied.</div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-1 font-mono text-[11px]">
            <div className="text-rose-400 font-bold">● Action-Hash Verification</div>
            <div className="text-slate-400">Capability tokens cannot be forged or replayed due to 60-second single-use nonce expiration.</div>
          </div>
        </div>
      ),
    },
  };

  const current = contentMap[type] || contentMap.privacy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 font-sans selection:bg-emerald-500 selection:text-black">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#050608] border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-white/[0.08] bg-[#0A0D12]/70 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              LEGAL & GOVERNANCE • CODESTORM 2K26
            </div>
            <h2 className="text-base font-bold text-white mt-0.5">{current.title}</h2>
            <div className="text-xs text-slate-400 font-mono mt-0.5">{current.subtitle}</div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {current.body}
        </div>

        <div className="p-4 px-6 border-t border-white/[0.08] bg-[#0A0D12]/70 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-mono font-bold transition-all"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
}
