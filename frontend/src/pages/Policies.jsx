import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Search,
  ChevronRight,
  Fingerprint,
  Database,
  Eye,
  Sliders,
  Sparkles,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';

/**
 * Policies - Executive Deterministic Policy Governance Matrix
 * Displays deterministic fail-closed policy rules (POL-001 to POL-008).
 */
export default function Policies() {
  const [selectedPolicy, setSelectedPolicy] = useState('POL-001');

  const policies = [
    {
      id: 'POL-001',
      name: 'Catastrophic SQL Operation Prohibition',
      type: 'DATABASE_FIREWALL',
      mode: 'FAIL_CLOSED',
      status: 'ACTIVE_ENFORCED',
      target: 'Production Relational Databases',
      description: 'Blocks DROP TABLE, ALTER TABLE, TRUNCATE, and administrative PRAGMA statements unconditionally via AST analysis.',
      rule: 'IF ast.contains_any(["Drop", "Truncate", "Alter", "Pragma"]) THEN DENY(Reason: CATASTROPHIC_MUTATION)',
      latency: '0.42ms',
      blockedCount: 18,
      severity: 'CRITICAL',
    },
    {
      id: 'POL-002',
      name: 'AST SQL Multi-Statement Injection Interception',
      type: 'DATABASE_FIREWALL',
      mode: 'FAIL_CLOSED',
      status: 'ACTIVE_ENFORCED',
      target: 'SQL Query Gateway',
      description: 'Rejects multi-statement or compound semicolon-delimited queries to prevent piggybacked malicious statements.',
      rule: 'IF len(ast.parsed_statements) > 1 THEN DENY(Reason: MULTI_STATEMENT_REJECTED)',
      latency: '0.38ms',
      blockedCount: 9,
      severity: 'HIGH',
    },
    {
      id: 'POL-003',
      name: 'Scoped Database Deletion Human Escalation',
      type: 'HUMAN_GOVERNANCE',
      mode: 'ESCALATION_GATE',
      status: 'ACTIVE_ENFORCED',
      target: 'DELETE Operations with Scoped WHERE',
      description: 'Executes non-destructive dry-run COUNT(*) and generates cryptographic action-hash bound to human approval queue.',
      rule: 'IF statement.type == "DELETE" AND statement.has_where THEN ESCALATE(Preview: dry_run.affected_count)',
      latency: '1.24ms',
      blockedCount: 14,
      severity: 'AMBER',
    },
    {
      id: 'POL-004',
      name: 'Monotonic Taint Secret Vault Isolation',
      type: 'PROVENANCE_ENGINE',
      mode: 'MONOTONIC_TAINT',
      status: 'ACTIVE_ENFORCED',
      target: 'KMS, Environment Secrets, Cloud Credentials',
      description: 'Sessions tainted with EXTERNAL_UNTRUSTED provenance are strictly forbidden from reading credentials or initiating egress.',
      rule: 'IF session.taint == "EXTERNAL_UNTRUSTED" AND action.targets_secret THEN DENY(Reason: TAINT_ISOLATION_VIOLATION)',
      latency: '0.29ms',
      blockedCount: 27,
      severity: 'CRITICAL',
    },
    {
      id: 'POL-005',
      name: 'Task Scope Manifest Least-Privilege Enforcer',
      type: 'AGENT_GOVERNANCE',
      mode: 'FAIL_CLOSED',
      status: 'ACTIVE_ENFORCED',
      target: 'Agent Tool Invocations',
      description: 'Validates that requested tool calls and resource targets match the explicit signed task scope manifest for the active agent.',
      rule: 'IF action.type NOT IN manifest.allowed_tools OR target NOT IN manifest.allowed_targets THEN DENY',
      latency: '0.45ms',
      blockedCount: 12,
      severity: 'HIGH',
    },
    {
      id: 'POL-006',
      name: 'Canonical Action-Hash Cryptographic Binding',
      type: 'HUMAN_APPROVAL',
      mode: 'CRYPTOGRAPHIC_LOCK',
      status: 'ACTIVE_ENFORCED',
      target: 'Post-Approval Execution Gateway',
      description: 'Binds human approvals to SHA256(ActionType || Resource || Params). Rejects execution if parameters were altered.',
      rule: 'IF sha256(proposed_action) != capability_token.action_hash THEN DENY(Reason: ACTION_HASH_MISMATCH)',
      latency: '0.31ms',
      blockedCount: 6,
      severity: 'CRITICAL',
    },
    {
      id: 'POL-007',
      name: 'Single-Use Capability Token Nonce Verification',
      type: 'EXECUTION_GATEWAY',
      mode: 'FAIL_CLOSED',
      status: 'ACTIVE_ENFORCED',
      target: 'Capability Tokens',
      description: 'Enforces single-use consumption of capability nonces within 60-second TTL to prevent replay attacks.',
      rule: 'IF nonce.already_consumed OR token.is_expired THEN 403_FORBIDDEN(Reason: TOKEN_REPLAY_ATTEMPT)',
      latency: '0.22ms',
      blockedCount: 8,
      severity: 'HIGH',
    },
    {
      id: 'POL-008',
      name: 'HMAC-SHA256 Audit Chain Verification',
      type: 'COMPLIANCE_INTEGRITY',
      mode: 'CONTINUOUS_AUDIT',
      status: 'ACTIVE_ENFORCED',
      target: 'Authorization Ledger',
      description: 'Chains every authorization decision to previous hash pointer. Automatically flags broken ledger integrity.',
      rule: 'ASSERT hmac_sha256(prev_hash, entry_payload) == entry.current_hash',
      latency: '0.65ms',
      blockedCount: 3,
      severity: 'CRITICAL',
    },
  ];

  const current = policies.find((p) => p.id === selectedPolicy) || policies[0];

  const getSeverityVariant = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return 'critical';
      case 'HIGH':
        return 'warning';
      default:
        return 'cyan';
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8 font-sans">
      {/* ---------------------------------------------------- */}
      {/* LEVEL 1: DETERMINISTIC POLICY GOVERNANCE HUD         */}
      {/* ---------------------------------------------------- */}
      <div className="p-3.5 rounded-2xl glass-card border border-sky-500/20 bg-gradient-to-r from-sky-950/20 via-[#0F1420] to-[#0A0D14] flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400">
              <Sliders className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[10px] text-[#8994A3] uppercase">POLICY MATRIX</div>
              <div className="text-[#F4F6F8] font-bold">{policies.length} Active Deterministic Policies</div>
            </div>
          </div>

          <div className="hidden sm:block h-6 w-px bg-white/[0.08]" />

          <div className="flex flex-col">
            <span className="text-[10px] text-[#8994A3] uppercase">ENFORCEMENT MODE</span>
            <span className="text-emerald-400 font-bold">STRICT FAIL-CLOSED</span>
          </div>

          <div className="hidden sm:block h-6 w-px bg-white/[0.08]" />

          <div className="hidden md:flex flex-col">
            <span className="text-[10px] text-[#8994A3] uppercase">AST OVERHEAD</span>
            <span className="text-sky-300 font-bold">0.42ms Average Latency</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 font-mono text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>0 EXCEPTIONS PERMITTED</span>
          </span>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MAIN GRID: POLICY LIST + DETAILED POLICY INSPECTOR   */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Policy Selector */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-[11px] font-mono font-bold tracking-wider text-[#8994A3] uppercase px-1">
            ACTIVE ENFORCEMENT RULES ({policies.length})
          </div>

          <div className="space-y-2.5">
            {policies.map((pol) => {
              const isSelected = selectedPolicy === pol.id;

              return (
                <div
                  key={pol.id}
                  onClick={() => setSelectedPolicy(pol.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 select-none ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/20 shadow-md ring-1 ring-cyan-400/40'
                      : 'border-white/[0.08] bg-[#0F1420]/80 hover:border-white/[0.16] hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400">{pol.id}</span>
                      <span className="text-[10px] font-mono text-[#8994A3]">{pol.type}</span>
                    </div>
                    <StatusBadge variant={getSeverityVariant(pol.severity)} label={pol.mode} />
                  </div>

                  <div className="text-xs font-bold text-[#F4F6F8] font-mono mt-1.5 truncate">
                    {pol.name}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-[#8994A3] pt-2 border-t border-white/[0.04]">
                    <span>Latency: {pol.latency}</span>
                    <span className="text-rose-400">{pol.blockedCount} blocked</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (7 cols): Detailed Policy Inspector */}
        <div className="lg:col-span-7">
          <div className="p-5 rounded-2xl glass-card space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                  POLICY SPECIFICATION
                </span>
                <h2 className="text-base font-bold font-mono text-[#F4F6F8] mt-0.5">
                  {current.id} — {current.name}
                </h2>
              </div>
              <StatusBadge variant="safe" label={current.status} />
            </div>

            <div className="space-y-3.5 font-mono text-xs">
              <div>
                <div className="text-[10px] text-[#8994A3] uppercase mb-1">Target Boundary</div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06] text-[#F4F6F8]">
                  {current.target}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-[#8994A3] uppercase mb-1">Policy Description</div>
                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-[#B5BEC9] font-sans leading-relaxed text-xs">
                  {current.description}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-[#8994A3] uppercase mb-1 flex items-center gap-1.5 text-cyan-400">
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Deterministic Rule Logic (Fail-Closed)</span>
                </div>
                <pre className="p-3 rounded-xl bg-black/50 border border-cyan-500/30 text-cyan-300 font-mono text-xs overflow-x-auto">
                  {current.rule}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-black/30 border border-white/[0.06]">
                  <div className="text-[10px] text-[#8994A3] uppercase">Average Gate Latency</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">{current.latency}</div>
                </div>
                <div className="p-3 rounded-xl bg-black/30 border border-white/[0.06]">
                  <div className="text-[10px] text-[#8994A3] uppercase">Total Interceptions</div>
                  <div className="text-sm font-bold text-rose-400 mt-0.5">{current.blockedCount} blocked</div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-[#8994A3]">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Zero Probability Threshold Bypass
              </span>
              <span>Enforcement: Python AST Core</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
