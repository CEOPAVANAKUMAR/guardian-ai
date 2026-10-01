import React, { useState } from 'react';
import {
  FileText,
  Code2,
  Cpu,
  Layers,
  CheckCircle2,
  Copy,
  Check,
  X,
  ExternalLink,
  Shield,
  BookOpen,
} from 'lucide-react';

/**
 * ResourcesModal - Complete Enterprise Documentation, API Reference, Architecture & Demo Guide
 * Built for NRCM CodeStorm 2K26 (Ensures 0 dead links in footer)
 */
export default function ResourcesModal({ isOpen, initialTab = 'docs', onClose }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [copiedKey, setCopiedKey] = useState(null);

  if (!isOpen) return null;

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 font-sans selection:bg-emerald-500 selection:text-black">
      <div className="relative w-full max-w-5xl h-[650px] rounded-3xl bg-[#050608] border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Modal Top Bar */}
        <div className="p-6 border-b border-white/[0.08] bg-[#0A0D12]/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-violet-400">
                GUARDIANAI TECHNICAL HUB • CODESTORM 2K26
              </div>
              <h2 className="text-lg font-bold text-white">
                Enterprise Knowledge Base & Specifications
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Tabs */}
            <div className="flex items-center bg-white/[0.04] p-1 rounded-xl border border-white/[0.08] text-xs font-mono">
              {[
                { id: 'docs', label: 'Documentation', icon: FileText },
                { id: 'api', label: 'API Reference', icon: Code2 },
                { id: 'architecture', label: 'Architecture', icon: Cpu },
                { id: 'demo', label: 'Demo Guide', icon: Layers },
              ].map((t) => {
                const Icon = t.icon;
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                      isActive
                        ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 text-sm font-sans text-slate-300">
          
          {/* TAB 1: DOCUMENTATION */}
          {activeTab === 'docs' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  GuardianAI Runtime Trust Architecture
                </h3>
                <p className="text-slate-400 leading-relaxed text-sm">
                  GuardianAI is an enterprise-grade runtime authorization gateway for autonomous AI agents. Unlike prompt filters or post-hoc monitoring, GuardianAI enforces deterministic, fail-closed boundaries before tool execution occurs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                  <div className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Deterministic Policy Engine</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Zero statistical bypass. Policies evaluate AST trees, regex constraints, and exact token bounds without trusting the AI model to self-regulate.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                  <div className="text-xs font-mono font-bold text-violet-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Monotonic Taint Tracking</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    External untrusted input (e.g. supplier invoices, web scrapes) tags the agent session as tainted. Tainted sessions cannot access credentials or execute sensitive tools.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                  <div className="text-xs font-mono font-bold text-amber-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Human-in-the-Loop Governance</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    High-impact mutations (e.g. database deletes) trigger dry-run impact calculation and require cryptographic reviewer signature with single-use nonce tokens.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                  <div className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tamper-Evident Audit Ledger</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Every proposal, evaluation, and decision is cryptographically chained via HMAC-SHA256. Any modification breaks the chain and alerts the SOC instantly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: API REFERENCE */}
          {activeTab === 'api' && (
            <div className="space-y-4 max-w-3xl font-mono text-xs">
              <div className="text-sm font-sans text-slate-300 mb-2">
                All endpoints operate under strict RESTful standards with Bearer token authentication and JSON payloads.
              </div>

              {[
                { method: 'POST', path: '/api/v1/actions/authorize', desc: 'Core gateway interception. Evaluates agent action against task manifest and policies.' },
                { method: 'GET', path: '/api/v1/stats', desc: 'Telemetry dashboard counters (threats blocked, latency, active manifests).' },
                { method: 'GET', path: '/api/v1/actions', desc: 'Real-time action stream log with taint status and cryptographic capability tokens.' },
                { method: 'GET', path: '/api/v1/incidents', desc: 'Security incident registry classified by deterministic rules.' },
                { method: 'POST', path: '/api/v1/audit/verify', desc: 'Calculates HMAC-SHA256 block-by-block hash continuity.' },
                { method: 'GET', path: '/api/v1/approvals', desc: 'Pending human-in-the-loop escalation queues with action-hash binding.' },
              ].map((ep, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ep.method === 'POST' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                        {ep.method}
                      </span>
                      <span className="text-white font-bold">{ep.path}</span>
                    </div>
                    <div className="text-slate-400 font-sans text-xs">{ep.desc}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(ep.path, idx)}
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors"
                    title="Copy endpoint path"
                  >
                    {copiedKey === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-6 max-w-3xl">
              <h3 className="text-xl font-bold text-white">
                9-Stage Zero-Trust Interception Pipeline
              </h3>
              <p className="text-slate-400 text-sm">
                Every agent proposal transitions through 9 deterministic validation gates before single-use capability token issuance:
              </p>

              <div className="space-y-2.5 font-mono text-xs">
                {[
                  { num: '01', title: 'Adversarial Prompt / Tool Proposal', desc: 'Agent generates tool call payload based on autonomous reasoning.' },
                  { num: '02', title: 'AI Agent Runtime Intercept', desc: 'Guardian SDK intercepts execution in memory before dispatch.' },
                  { num: '03', title: 'GuardianAI Runtime Gateway', desc: 'FastAPI validation gateway initializes zero-trust context.' },
                  { num: '04', title: 'Agent Identity Check', desc: 'Cryptographic validation of agent certificate and session UUID.' },
                  { num: '05', title: 'Task Scope Manifest Verification', desc: 'Strict least-privilege boundary checks against signed manifest.' },
                  { num: '06', title: 'Monotonic Taint Analysis Engine', desc: 'Tags untrusted document inputs and blocks credential access.' },
                  { num: '07', title: 'Deterministic Policy Engine', desc: 'Executes AST parser (sqlglot) to block DROP/TRUNCATE statements.' },
                  { num: '08', title: 'Impact Estimation & Risk Engine', desc: 'Synthesizes dry-run previews for mutations requiring human approval.' },
                  { num: '09', title: 'Cryptographic Capability Gate', desc: 'Issues single-use 60s nonce token or triggers fail-closed DENY.' },
                ].map((s) => (
                  <div key={s.num} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center gap-3">
                    <span className="text-violet-400 font-bold">{s.num}</span>
                    <div className="flex-1">
                      <span className="text-white font-semibold">{s.title}: </span>
                      <span className="text-slate-400 font-sans text-xs">{s.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DEMO GUIDE */}
          {activeTab === 'demo' && (
            <div className="space-y-6 max-w-3xl">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-950/40 to-fuchsia-950/40 border border-fuchsia-500/30">
                <div className="text-xs font-mono font-bold text-fuchsia-300 uppercase mb-1">
                  NRCM CODESTORM 2K26 • 2-MINUTE JUDGE PRESENTATION SCRIPT
                </div>
                <div className="text-sm font-bold text-white">
                  Follow these 4 steps to demonstrate full product capability to judges:
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                  <div className="text-xs font-mono font-bold text-cyan-400">
                    STEP 1: Show Attack Playground Simulation
                  </div>
                  <p className="text-xs text-slate-300">
                    Navigate to <strong>Attack Playground</strong>. Click <strong>Scenario 2 (Indirect Prompt Injection)</strong>. Show judges how GuardianAI identifies <span className="font-mono text-amber-300">EXTERNAL_UNTRUSTED</span> provenance from the invoice PDF and blocks <span className="font-mono text-rose-400">READ_SECRET</span> within 1.25ms AST!
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                  <div className="text-xs font-mono font-bold text-amber-400">
                    STEP 2: Human-in-the-Loop Governance
                  </div>
                  <p className="text-xs text-slate-300">
                    Run <strong>Scenario 5 (Scoped Database Delete)</strong>. Show how high-risk mutations are not blindly executed or rejected—they are escalated to the <strong>Approvals Queue</strong> with pre-execution dry-run impact (427 records affected) and canonical action-hash verification.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                  <div className="text-xs font-mono font-bold text-rose-400">
                    STEP 3: Cryptographic Audit Tampering
                  </div>
                  <p className="text-xs text-slate-300">
                    Go to <strong>Audit Chain</strong>. Click <strong>Verify Audit Chain</strong> (100% Valid). Then click <strong>Simulate Tamper</strong>. Watch the chain crack instantly and trigger a high-priority SOC alert!
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-1.5">
                  <div className="text-xs font-mono font-bold text-emerald-400">
                    STEP 4: Guardian ON vs OFF Proof
                  </div>
                  <p className="text-xs text-slate-300">
                    Toggle Guardian to <strong>BYPASSED</strong> in the top header. Re-run an attack to show the unprotected vulnerability, then re-arm Guardian to prove deterministic protection!
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Bar */}
        <div className="p-4 px-6 border-t border-white/[0.08] bg-[#0A0D12]/80 flex items-center justify-between text-xs font-mono text-slate-400">
          <div>Built with FastAPI, Python AST, and React for CodeStorm 2K26</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all"
          >
            CLOSE
          </button>
        </div>

      </div>
    </div>
  );
}
