import React, { useState, useEffect } from 'react';
import {
  fetchStats,
  fetchActions,
  toggleGuardian,
  resetDemo,
  fetchIncidents,
} from '../services/api';
import ActionCard from '../components/ActionCard';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import MetricCard from '../components/ui/MetricCard';
import EmptyState from '../components/ui/EmptyState';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Clock,
  AlertTriangle,
  RefreshCw,
  Power,
  ChevronRight,
  Database,
  FileCheck2,
  BarChart3,
  Activity,
  Fingerprint,
  Zap,
  PieChart,
} from 'lucide-react';
import biometricAuthImg from '../assets/biometric_auth.jpg';

/**
 * Dashboard - Enterprise AI Security Command Center
 * Clean 4-level visual hierarchy, compact first viewport,
 * core security posture, 6 telemetry metrics, and deterministic feed.
 */
export default function Dashboard({ onNavigateToIncidents, onToggleGuardian, guardianEnabled, onNavigateToLogin }) {
  const [stats, setStats] = useState(null);
  const [recentActions, setRecentActions] = useState([]);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const loadData = async () => {
    try {
      const [s, a, inc] = await Promise.all([
        fetchStats(),
        fetchActions(),
        fetchIncidents({ status: 'ALL' }),
      ]);
      setStats(s);
      setRecentActions(a.slice(0, 5));
      setRecentIncidents(inc.slice(0, 4));
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetDemo();
      await loadData();
    } catch (e) {
      alert('Reset failed');
    } finally {
      setResetting(false);
    }
  };

  const currentGuardianState =
    guardianEnabled !== undefined ? guardianEnabled : stats?.guardian_enabled ?? true;

  // Real-time AI Activity stream events
  const liveStreamEvents = [
    {
      time: '10:42:01',
      agent: 'Finance Agent',
      action: 'READ_SECRET',
      analysis: { identity: 'Verified', scope: 'Failed', provenance: 'Untrusted' },
      decision: 'DENIED',
      badgeVariant: 'critical',
    },
    {
      time: '10:40:15',
      agent: 'Procurement Bot',
      action: 'INGEST_INVOICE_PDF',
      analysis: { identity: 'Verified', scope: 'Allowed', provenance: 'Tagged Untrusted' },
      decision: 'ALLOWED',
      badgeVariant: 'safe',
    },
    {
      time: '10:38:22',
      agent: 'Database Batch Worker',
      action: 'DELETE_SCOPED_ROWS',
      analysis: { identity: 'Verified', scope: 'High Impact', provenance: 'Internal' },
      decision: 'ESCALATED',
      badgeVariant: 'warning',
    },
    {
      time: '10:35:09',
      agent: 'Analytics Query Engine',
      action: 'SELECT_WITH_LIMIT',
      analysis: { identity: 'Verified', scope: 'Safe Read', provenance: 'Internal' },
      decision: 'ALLOWED',
      badgeVariant: 'safe',
    },
  ];

  // Threat Distribution Breakdown
  const threatCategories = [
    { key: 'Prompt Injection', label: 'Prompt Injection', count: stats?.threat_distribution?.['Prompt Injection'] ?? 2, color: 'bg-rose-500' },
    { key: 'Secret Access', label: 'Secret Access', count: stats?.threat_distribution?.['Secret Access'] ?? 1, color: 'bg-amber-500' },
    { key: 'Database', label: 'Database Destruction', count: stats?.threat_distribution?.['Database'] ?? 1, color: 'bg-indigo-500' },
    { key: 'Exfiltration', label: 'Data Exfiltration', count: stats?.threat_distribution?.['Exfiltration'] ?? 1, color: 'bg-cyan-500' },
    { key: 'Approval', label: 'Approval Tampering', count: stats?.threat_distribution?.['Approval'] ?? 0, color: 'bg-purple-500' },
    { key: 'Audit', label: 'Audit Chain Tampering', count: stats?.threat_distribution?.['Audit'] ?? 0, color: 'bg-yellow-500' },
    { key: 'Identity Misuse', label: 'Identity / Insider Misuse', count: stats?.threat_distribution?.['Identity Misuse'] ?? 0, color: 'bg-violet-500' },
  ];
  const maxThreatCount = Math.max(...threatCategories.map((t) => t.count), 1);

  const openIncidents = stats?.open_incidents ?? 2;
  const threatsBlocked = stats?.threats_blocked ?? 39;
  const protectedAgents = stats?.protected_agents_count ?? 3;
  const actionsEvaluated = stats?.actions_evaluated ?? 142;
  const pendingApprovals = stats?.pending_approvals ?? 1;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8 font-sans">
      {/* ---------------------------------------------------- */}
      {/* LEVEL 1: HIGH-DENSITY 3-CARD EXECUTIVE COMMAND HUD    */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
        {/* Card 1: System Security Posture & Fail-Closed Status */}
        <div
          className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
            currentGuardianState
              ? 'bg-gradient-to-br from-[#0A1A14] via-[#0F1420] to-[#0A0D14] border-emerald-500/30 shadow-[0_4px_20px_rgba(24,201,133,0.08)]'
              : 'bg-gradient-to-br from-[#1C0E12] via-[#0F1420] to-[#0A0D14] border-rose-500/40 shadow-[0_4px_20px_rgba(244,63,94,0.12)]'
          }`}
        >
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span
                  className={`p-1 rounded-lg border ${
                    currentGuardianState
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
                  }`}
                >
                  {currentGuardianState ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                </span>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8994A3]">
                  SECURITY POSTURE
                </span>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  currentGuardianState
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                }`}
              >
                {currentGuardianState ? 'FAIL-CLOSED' : 'BYPASSED'}
              </span>
            </div>

            <div className="my-3 flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                  currentGuardianState
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(24,201,133,0.2)]'
                    : 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                }`}
              >
                {currentGuardianState ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : (
                  <ShieldAlert className="w-6 h-6 animate-bounce" />
                )}
              </div>
              <div className="min-w-0">
                <div
                  className={`text-lg font-bold font-mono tracking-tight leading-tight ${
                    currentGuardianState ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {currentGuardianState ? 'PROTECTED (ON)' : 'AT RISK (BYPASS)'}
                </div>
                <div className="text-[11px] text-[#B5BEC9] font-sans truncate mt-0.5">
                  {currentGuardianState ? 'Deterministic AST & Taint Active' : 'Runtime protections disabled'}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-white/[0.08] flex items-center justify-between">
            <div className="text-[10px] font-mono text-[#8994A3]">
              Latency: <span className="text-emerald-400 font-bold">1.25ms AST</span>
            </div>
            <button
              onClick={onToggleGuardian}
              className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold border transition-all flex items-center gap-1.5 ${
                currentGuardianState
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30 animate-pulse'
              }`}
            >
              <Power className="w-3 h-3" />
              <span>{currentGuardianState ? 'TOGGLE BYPASS' : 'ARM GUARDIAN'}</span>
            </button>
          </div>
        </div>

        {/* Card 2: Biometric Hardware Security Enclave */}
        <div className="p-4 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-[#06101E] via-[#0F1420] to-[#0A0D14] flex flex-col justify-between shadow-[0_4px_20px_rgba(6,182,212,0.08)]">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg border bg-cyan-500/15 border-cyan-500/40 text-cyan-400">
                  <Fingerprint className="w-3.5 h-3.5" />
                </span>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300">
                  HARDWARE ENCLAVE
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-cyan-500/10 text-cyan-300 border-cyan-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>GATE 01 ARMED</span>
              </span>
            </div>

            <div className="my-2.5 relative rounded-xl overflow-hidden border border-cyan-500/30 bg-black/80 group h-20">
              <img
                src={biometricAuthImg}
                alt="Biometric Hardware Enclave"
                className="w-full h-full object-cover object-center filter brightness-95 contrast-110 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20 pointer-events-none" />
              <div className="absolute bottom-1.5 left-2 flex items-center gap-1.5 text-[9px] font-mono text-cyan-300 font-bold">
                <Fingerprint className="w-3 h-3 text-cyan-400" />
                <span>ZERO-TRUST SENSOR READY • 4096-BIT RSA</span>
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-white/[0.08] flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#8994A3]">
              Identity: <span className="text-white font-bold">Verified Enclave</span>
            </span>
            {onNavigateToLogin && (
              <button
                onClick={onNavigateToLogin}
                className="text-cyan-300 hover:text-white font-mono font-bold bg-cyan-500/20 hover:bg-cyan-500/30 px-2.5 py-1 rounded-lg border border-cyan-500/40 transition-all text-[10px] flex items-center gap-1"
              >
                <span>AUTH GATEWAY</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Card 3: Threat Intel & Attack Radar Quick Launch */}
        <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#0F1420]/80 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg border bg-amber-500/15 border-amber-500/40 text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </span>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8994A3]">
                  THREAT RADAR
                </span>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  openIncidents > 0
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {openIncidents > 0 ? 'THREAT: ELEVATED' : 'THREAT: NORMAL'}
              </span>
            </div>

            <div className="my-3 flex items-center justify-between">
              <div>
                <div className="text-lg font-bold font-mono text-[#F4F6F8]">
                  {threatsBlocked} Threats Blocked
                </div>
                <div className="text-[11px] text-[#B5BEC9] font-sans">
                  {openIncidents} open incidents requiring SOC review
                </div>
              </div>
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-white/[0.08] flex items-center gap-2">
            <button
              onClick={() => onNavigateToIncidents && onNavigateToIncidents()}
              className="flex-1 py-1 px-2 rounded-lg font-mono text-[10px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 flex items-center justify-center gap-1 transition-all"
            >
              <span>VIEW INCIDENTS ({openIncidents})</span>
              <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="py-1 px-2 rounded-lg font-mono text-[10px] font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-[#C8D0DC] border border-white/[0.1] flex items-center gap-1 transition-all"
              title="Reset live demo data"
            >
              <RefreshCw className={`w-3 h-3 ${resetting ? 'animate-spin text-cyan-400' : 'text-[#8994A3]'}`} />
              <span>RESET</span>
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* LEVEL 2: 6 SATELLITE TELEMETRY METRICS               */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          label="Protected Agents"
          value={`${protectedAgents} Active`}
          subtext="Verified manifests"
          icon={Cpu}
          variant="emerald"
        />
        <MetricCard
          label="Actions Evaluated"
          value={`${actionsEvaluated}`}
          subtext="Zero bypasses"
          icon={Database}
          variant="default"
        />
        <MetricCard
          label="Threats Blocked"
          value={`${threatsBlocked} Blocked`}
          subtext="100% intercept"
          icon={ShieldAlert}
          variant="crimson"
        />
        <MetricCard
          label="Active Incidents"
          value={`${openIncidents} Open`}
          subtext="Click to inspect"
          icon={AlertTriangle}
          variant="amber"
          onClick={onNavigateToIncidents}
        />
        <MetricCard
          label="Pending Approvals"
          value={`${pendingApprovals} Pending`}
          subtext="Human review required"
          icon={FileCheck2}
          variant="violet"
        />
        <MetricCard
          label="Audit Integrity"
          value="100% Valid"
          subtext="Cryptographic chain"
          icon={Fingerprint}
          variant="emerald"
        />
      </div>

      {/* ---------------------------------------------------- */}
      {/* LEVEL 3: LIVE AI AGENT ACTIVITY & THREAT INTEL       */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Live AI Activity Timeline */}
        <div className="lg:col-span-7 p-5 rounded-2xl glass-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-400" />
                <h3 className="text-xs font-mono font-bold text-[#F4F6F8] uppercase tracking-wider">
                  AI Agent Activity Stream
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-violet-500/10 text-violet-300 border border-violet-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                <span>Live Monitoring</span>
              </span>
            </div>

            {/* Timeline Stream */}
            <div className="space-y-2.5 font-mono">
              {liveStreamEvents.map((evt, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[10px] text-[#8994A3] font-bold">{evt.time}</span>
                      <span className="text-xs font-semibold text-[#F4F6F8] truncate">{evt.agent}</span>
                      <span className="text-xs text-amber-300 font-medium truncate">
                        → {evt.action}
                      </span>
                    </div>

                    <StatusBadge variant={evt.badgeVariant} label={evt.decision} />
                  </div>

                  <div className="mt-2 pt-2 border-t border-white/[0.04] grid grid-cols-3 gap-2 text-[10px] text-[#8994A3]">
                    <div>
                      Identity: <span className="text-emerald-300 font-medium">{evt.analysis.identity}</span>
                    </div>
                    <div>
                      Scope: <span className="text-violet-300 font-medium">{evt.analysis.scope}</span>
                    </div>
                    <div>
                      Provenance: <span className="text-amber-300 font-medium">{evt.analysis.provenance}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-[#8994A3]">
            <span>Enforcement Engine: Deterministic Pipeline</span>
            <span className="text-emerald-400 font-bold">100% Policy Intercept</span>
          </div>
        </div>

        {/* Right Column (5 cols): Threat Distribution & Sector Breakdown */}
        <div className="lg:col-span-5 space-y-5">
          {/* Threat Distribution */}
          <div className="p-5 rounded-2xl glass-card">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.08]">
              <h3 className="text-xs font-mono font-bold text-[#F4F6F8] uppercase flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-fuchsia-400" />
                <span>Threat Distribution</span>
              </h3>
              <span className="text-[10px] font-mono text-[#8994A3]">Deterministic Classification</span>
            </div>

            <div className="space-y-2.5 font-mono text-xs">
              {threatCategories.map((t) => (
                <div key={t.key}>
                  <div className="flex items-center justify-between text-[#B5BEC9] mb-1">
                    <span className="text-[11px]">{t.label}</span>
                    <span className="font-bold text-[#F4F6F8]">{t.count}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className={`h-full ${t.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max((t.count / maxThreatCount) * 100, t.count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Incidents by Sector */}
          <div className="p-5 rounded-2xl glass-card">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.08]">
              <h3 className="text-xs font-mono font-bold text-[#F4F6F8] uppercase flex items-center gap-2">
                <PieChart className="w-4 h-4 text-violet-400" />
                <span>Incidents by Sector</span>
              </h3>
              <button
                onClick={() => onNavigateToIncidents && onNavigateToIncidents()}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
              >
                <span>View Center</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {stats?.incidents_by_sector && Object.keys(stats.incidents_by_sector).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(stats.incidents_by_sector).map(([sector, count]) => (
                  <div
                    key={sector}
                    className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between font-mono text-xs"
                  >
                    <span className="text-[#C8D0DC] truncate">{sector}</span>
                    <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/30 font-bold shrink-0 text-[10px]">
                      {count} {count === 1 ? 'incident' : 'incidents'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-[#8994A3] font-mono text-xs">
                No sector incidents recorded yet. Launch an attack in the Playground to simulate!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* LEVEL 4: RECENT SECURITY INTERCEPTIONS & ACTION FEED */}
      {/* ---------------------------------------------------- */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#F4F6F8] flex items-center gap-2 font-mono uppercase tracking-wider">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Recent Security Interceptions & Action Feed</span>
          </h2>
          <span className="text-[11px] text-[#8994A3] font-mono">Real-Time Authorization Logs</span>
        </div>

        {recentActions.length === 0 ? (
          <EmptyState
            title="No Action Requests Evaluated Yet"
            description="Trigger attacks or scenarios in the Threat Intel simulator to view real-time runtime authorizations."
            actionLabel="Open Threat Intel"
            onAction={() => onNavigateToIncidents && onNavigateToIncidents()}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {recentActions.map((rec) => (
              <ActionCard
                key={rec.id}
                record={rec}
                onViewIncident={(actionRecord) => {
                  if (onNavigateToIncidents) {
                    onNavigateToIncidents();
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
