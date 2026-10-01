import React, { useState } from 'react';
import {
  FileText,
  ShieldAlert,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  User,
  Smartphone,
  MapPin,
  Lock,
  ChevronRight,
  AlertTriangle,
  Fingerprint,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';

/**
 * Investigations - Dedicated Investigation & Intelligence Dossier View
 * Provides step-by-step intelligence case files with visual timelines.
 */
export default function Investigations({ onNavigateToIncidents }) {
  const caseFiles = [
    {
      id: 'INV-2026-9041',
      title: 'High-Velocity Authentication Failure & Geographic Travel Anomaly',
      target: 'emp_finance_04 (Jane Doe)',
      riskLevel: 'HIGH',
      riskScore: 88,
      confidence: 94.7,
      timestamp: '2026-09-30 21:14:02 UTC',
      status: 'UNDER_INVESTIGATION',
      timeline: [
        { step: 1, title: 'Initial Ingress Event', time: '21:10:14', actor: '198.51.100.42', desc: 'Valid credential supplied from corporate office IP (London, UK).' },
        { step: 2, title: 'Rapid Secondary Login', time: '21:13:01', actor: '203.0.113.88', desc: 'Login attempt from Tokyo, JP using unverified Android hardware token.' },
        { step: 3, title: 'Failed MFA Challenges', time: '21:13:45', actor: 'Unknown Client', desc: '3 consecutive biometric push failures on secondary device.' },
        { step: 4, title: 'Impossible Travel Flagged', time: '21:14:00', actor: 'GuardianAI Engine', desc: 'Calculated physical transit velocity exceeds 57,000 km/h (impossible travel).' },
        { step: 5, title: 'Automated Fail-Closed Escalation', time: '21:14:02', actor: 'SOC Gateway', desc: 'Session tokens invalidated. Capability token issuance revoked.' },
      ],
      signals: [
        'Impossible Travel Velocity (London -> Tokyo in 3m)',
        'Unrecognized Hardware Device Signature',
        'Privileged Financial Workspace Access Attempt',
        'Consecutive MFA Rejections',
      ],
      recommendedAction: 'INVALIDATE ACTIVE TOKENS & ENFORCE IN-PERSON VERIFICATION',
      evidenceItems: [
        { label: 'Ingress London IP', value: '198.51.100.42 (ASN 15169)', type: 'NETWORK' },
        { label: 'Secondary Tokyo IP', value: '203.0.113.88 (ASN 2519)', type: 'NETWORK' },
        { label: 'Client Device Fingerprint', value: 'FP-8849-B2-ANDROID14', type: 'HARDWARE' },
        { label: 'Authorization Token Nonce', value: '0x9d28a1c84f091e', type: 'CRYPTO' },
      ],
    },
    {
      id: 'INV-2026-9042',
      title: 'Vendor Invoice Indirect Prompt Injection Vector',
      target: 'autonomous_agent_v2 (Procurement Agent)',
      riskLevel: 'CRITICAL',
      riskScore: 98,
      confidence: 98.2,
      timestamp: '2026-09-30 20:55:18 UTC',
      status: 'CONTAINED',
      timeline: [
        { step: 1, title: 'Vendor Invoice Ingested', time: '20:54:10', actor: 'Vendor Upload API', desc: 'Received supplier invoice PDF "INV-9921-ACME.pdf".' },
        { step: 2, title: 'Server-Side Ingestion', time: '20:54:30', actor: 'GuardianAI Ingest', desc: 'PDF parsed into text stream. Monotonic taint set to EXTERNAL_UNTRUSTED.' },
        { step: 3, title: 'Agent Proposes Secret Read', time: '20:55:00', actor: 'autonomous_agent_v2', desc: 'Agent proposes tool call: READ_SECRET (aws_kms_prod_key).' },
        { step: 4, title: 'Deterministic Interception', time: '20:55:18', actor: 'Guardian Policy Gate', desc: 'DENIED: Policy POL-004 blocks secret reads from EXTERNAL_UNTRUSTED sessions.' },
      ],
      signals: [
        'Hidden Adversarial Instruction in PDF Metadata',
        'Autonomous Tool Call Escalation Without User Consent',
        'Attempted KMS Secret Exfiltration',
      ],
      recommendedAction: 'QUARANTINE VENDOR PDF & LOG TAINTED SESSION PROVENANCE',
      evidenceItems: [
        { label: 'SHA-256 PDF Hash', value: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', type: 'FILE' },
        { label: 'Policy Enforced', value: 'POL-004: Tainted Session Vault Isolation', type: 'RULE' },
        { label: 'Target KMS Key', value: 'arn:aws:kms:us-east-1:99120:key/prod-vault', type: 'RESOURCE' },
      ],
    },
    {
      id: 'INV-2026-9043',
      title: 'Destructive Mass Database Deletion Escalation',
      target: 'db_maintenance_worker (Batch Agent)',
      riskLevel: 'HIGH',
      riskScore: 85,
      confidence: 95.0,
      timestamp: '2026-09-30 19:40:22 UTC',
      status: 'AWAITING_APPROVAL',
      timeline: [
        { step: 1, title: 'Batch Deletion Query Proposed', time: '19:39:55', actor: 'Batch Worker', desc: 'Agent submits "DELETE FROM audit_records WHERE archived = 1".' },
        { step: 2, title: 'AST SQL Security Parse', time: '19:40:10', actor: 'sqlglot Engine', desc: 'AST verifies valid WHERE clause. Synthesizes non-destructive dry-run.' },
        { step: 3, title: 'Impact Assessment Computed', time: '19:40:15', actor: 'Guardian DB Adapter', desc: 'Dry-run COUNT(*) reveals 427 rows will be impacted.' },
        { step: 4, title: 'Human Escalation Enforced', time: '19:40:22', actor: 'Deterministic Policy', desc: 'ESCALATE: Action hash locked with HMAC capability token awaiting admin review.' },
      ],
      signals: [
        'High-Impact Scoped Database Deletion (>400 rows)',
        'Privileged Table Modification Vector',
        'Cryptographic Action Hash Locked',
      ],
      recommendedAction: 'ROUTE TO SOC APPROVAL QUEUE WITH ROW IMPACT VERIFICATION',
      evidenceItems: [
        { label: 'Target Table', value: 'audit_records', type: 'DATABASE' },
        { label: 'Affected Row Count', value: '427 rows', type: 'TELEMETRY' },
        { label: 'Action Canonical Hash', value: '8a9c2b4d1e0f9831a2b4c5d6e7f8a9b0', type: 'CRYPTO' },
      ],
    },
  ];

  const [selectedCase, setSelectedCase] = useState(caseFiles[0]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8 font-sans">
      {/* ---------------------------------------------------- */}
      {/* LEVEL 1: FORENSICS & DOSSIER CONTROL HUD             */}
      {/* ---------------------------------------------------- */}
      <div className="p-3.5 rounded-2xl glass-card border border-amber-500/20 bg-gradient-to-r from-amber-950/20 via-[#0F1420] to-[#0A0D14] flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[10px] text-[#8994A3] uppercase">INTELLIGENCE DOSSIERS</div>
              <div className="text-[#F4F6F8] font-bold">{caseFiles.length} Active Forensic Cases</div>
            </div>
          </div>

          <div className="hidden sm:block h-6 w-px bg-white/[0.08]" />

          <div className="flex flex-col">
            <span className="text-[10px] text-[#8994A3] uppercase">HIGHEST SEVERITY</span>
            <span className="text-rose-400 font-bold">CRITICAL (Risk 98/100)</span>
          </div>

          <div className="hidden sm:block h-6 w-px bg-white/[0.08]" />

          <div className="hidden md:flex flex-col">
            <span className="text-[10px] text-[#8994A3] uppercase">FORENSICS PIPELINE</span>
            <span className="text-amber-300 font-bold">Automated Chronology</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>INVESTIGATION MODE ACTIVE</span>
          </span>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MAIN GRID: CASE LIST (LEFT) & SELECTED DOSSIER (RIGHT) */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (4 cols): Case Selector */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-[11px] font-mono font-bold tracking-wider text-[#8994A3] uppercase px-1">
            OPEN INVESTIGATION DOSSIERS
          </div>

          <div className="space-y-2.5">
            {caseFiles.map((c) => {
              const isSelected = selectedCase.id === c.id;
              const isCritical = c.riskLevel === 'CRITICAL';

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 select-none ${
                    isSelected
                      ? 'border-amber-400 bg-amber-950/20 shadow-md ring-1 ring-amber-400/40'
                      : 'border-white/[0.08] bg-[#0F1420]/80 hover:border-white/[0.16] hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-amber-300">
                      {c.id}
                    </span>
                    <StatusBadge
                      variant={isCritical ? 'critical' : 'warning'}
                      label={`${c.riskLevel} (${c.riskScore})`}
                    />
                  </div>

                  <div className="text-xs font-bold text-[#F4F6F8] font-mono mt-1.5 line-clamp-2">
                    {c.title}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-[#8994A3]">
                    <span className="truncate max-w-[140px]">{c.target}</span>
                    <span>{c.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (8 cols): Comprehensive Case Dossier */}
        <div className="lg:col-span-8 space-y-5">
          <div className="p-5 rounded-2xl glass-card space-y-5">
            {/* Dossier Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-white/[0.08]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-300">
                    CASE DOSSIER: {selectedCase.id}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/[0.04] border border-white/[0.08] text-[#C8D0DC]">
                    {selectedCase.status}
                  </span>
                </div>
                <h2 className="text-base font-bold font-mono text-[#F4F6F8] mt-1">
                  {selectedCase.title}
                </h2>
                <div className="text-xs text-[#8994A3] font-mono mt-0.5">
                  Target Entity: <span className="text-white font-bold">{selectedCase.target}</span> • {selectedCase.timestamp}
                </div>
              </div>

              <div className="text-right font-mono">
                <div className="text-[10px] text-[#8994A3]">AI CONFIDENCE</div>
                <div className="text-xl font-black text-amber-300">{selectedCase.confidence}%</div>
              </div>
            </div>

            {/* Visual Step-by-Step Intelligence Timeline */}
            <div>
              <div className="text-xs font-mono font-bold tracking-wider text-[#8994A3] uppercase mb-2.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>CHRONOLOGICAL INVESTIGATION TIMELINE</span>
              </div>

              <div className="space-y-2.5 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-white/[0.08]">
                {selectedCase.timeline.map((t) => (
                  <div key={t.step} className="relative pl-7 flex flex-col space-y-1">
                    <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-amber-950 border border-amber-400 text-amber-300 flex items-center justify-center text-[9px] font-mono font-bold">
                      {t.step}
                    </div>

                    <div className="p-3 rounded-xl bg-black/30 border border-white/[0.06] text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#F4F6F8] text-xs">{t.title}</span>
                        <span className="text-[#8994A3] text-[10px]">{t.time} UTC</span>
                      </div>
                      <div className="text-[#B5BEC9] text-xs mt-1 font-sans">{t.desc}</div>
                      <div className="mt-1.5 text-[10px] text-amber-300/90 font-mono">Actor: {t.actor}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Extracted Signals & Evidence Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Threat Signals */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06]">
                <div className="text-[10px] font-mono font-bold tracking-wider text-[#8994A3] uppercase mb-2">
                  DETECTED RISK SIGNALS
                </div>
                <ul className="space-y-1">
                  {selectedCase.signals.map((sig, idx) => (
                    <li key={idx} className="text-xs font-mono text-amber-300 flex items-start gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0" />
                      <span>{sig}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Evidence Registry */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06]">
                <div className="text-[10px] font-mono font-bold tracking-wider text-[#8994A3] uppercase mb-2">
                  EVIDENCE ATTRIBUTES
                </div>
                <div className="space-y-1.5 font-mono text-xs">
                  {selectedCase.evidenceItems.map((e, idx) => (
                    <div key={idx} className="flex justify-between border-b border-white/[0.04] pb-1">
                      <span className="text-[#8994A3] text-[10px]">{e.label}:</span>
                      <span className="text-cyan-400 font-semibold truncate max-w-[180px]">{e.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommended Action Footer */}
            <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                  RECOMMENDED REMEDIATION
                </div>
                <div className="text-xs font-bold font-mono text-[#F4F6F8] mt-0.5">
                  {selectedCase.recommendedAction}
                </div>
              </div>

              {onNavigateToIncidents && (
                <button
                  onClick={() => onNavigateToIncidents()}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold flex items-center gap-1 shadow-sm"
                >
                  <span>VIEW INCIDENTS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
