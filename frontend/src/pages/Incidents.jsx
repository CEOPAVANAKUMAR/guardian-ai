import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  ExternalLink,
  Mail,
  Send,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  X,
  Copy,
  Check,
  SlidersHorizontal,
  ChevronRight,
  FileText,
  Activity,
  Layers,
  Sparkles,
  Shield,
  Fingerprint,
} from 'lucide-react';
import { fetchIncidents, fetchIncidentStats, updateIncidentStatus, shareIncidentReport } from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import AttackReconstructionPlayer from '../components/AttackReconstructionPlayer';

export default function Incidents({ selectedIncidentId, onClearSelectedId }) {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Incident for Detail Modal
  const [activeIncident, setActiveIncident] = useState(null);

  // Share report state
  const [shareEmail, setShareEmail] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareStatus, setShareStatus] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Load incidents & stats
  const loadData = async () => {
    try {
      const [list, st] = await Promise.all([
        fetchIncidents({
          severity: severityFilter,
          sector: sectorFilter,
          status: statusFilter,
          search: searchQuery,
        }),
        fetchIncidentStats(),
      ]);
      setIncidents(list);
      setStats(st);

      if (selectedIncidentId) {
        const match = list.find((i) => i.id === selectedIncidentId);
        if (match) {
          setActiveIncident(match);
        }
      }
    } catch (e) {
      console.error('Failed to load incidents', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [severityFilter, sectorFilter, statusFilter, searchQuery, selectedIncidentId]);

  const handleShareReport = async (e) => {
    e?.preventDefault();
    if (!shareEmail || !shareEmail.includes('@')) {
      setShareStatus({ type: 'error', message: 'Please enter a valid recipient email address.' });
      return;
    }
    setShareLoading(true);
    setShareStatus(null);
    try {
      const res = await shareIncidentReport(activeIncident.id, shareEmail.trim());
      setShareStatus({ type: 'success', message: res.message || 'Report sent successfully!' });
      setShareEmail('');
    } catch (err) {
      setShareStatus({ type: 'error', message: err.message || 'Delivery failed.' });
    } finally {
      setShareLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!activeIncident) return;
    try {
      const updated = await updateIncidentStatus(activeIncident.id, newStatus);
      setActiveIncident(updated);
      setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    } catch (e) {
      console.error('Status update failed', e);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const getSeverityVariant = (level) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
        return 'critical';
      case 'HIGH':
        return 'critical';
      case 'MEDIUM':
        return 'warning';
      default:
        return 'cyan';
    }
  };

  const getStatusVariant = (status) => {
    switch (status?.toUpperCase()) {
      case 'OPEN':
        return 'critical';
      case 'INVESTIGATING':
        return 'warning';
      case 'RESOLVED':
        return 'safe';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8 font-sans">
      {/* ---------------------------------------------------- */}
      {/* LEVEL 1: SOC INCIDENT COMMAND & TRIAGE HUD           */}
      {/* ---------------------------------------------------- */}
      <div className="p-3.5 rounded-2xl glass-card border border-rose-500/20 bg-gradient-to-r from-rose-950/20 via-[#0F1420] to-[#0A0D14] flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[10px] text-[#8994A3] uppercase">SECURITY INCIDENTS</div>
              <div className={`font-bold ${stats?.open_incidents > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {stats?.open_incidents > 0 ? `${stats.open_incidents} Active Security Incident${stats.open_incidents > 1 ? 's' : ''}` : 'All Incidents Resolved'}
              </div>
            </div>
          </div>

          <div className="hidden sm:block h-6 w-px bg-white/[0.08]" />

          <div className="flex flex-col">
            <span className="text-[10px] text-[#8994A3] uppercase">SECURITY POSTURE</span>
            <span
              className={`font-bold ${
                stats?.security_posture === 'Critical'
                  ? 'text-rose-400'
                  : stats?.security_posture === 'Warning'
                  ? 'text-amber-300'
                  : 'text-emerald-400'
              }`}
            >
              {(stats?.security_posture || 'Elevated').toUpperCase()}
            </span>
          </div>

          <div className="hidden sm:block h-6 w-px bg-white/[0.08]" />

          <div className="hidden md:flex flex-col">
            <span className="text-[10px] text-[#8994A3] uppercase">INTERCEPT LATENCY</span>
            <span className="text-emerald-400 font-bold">1.4ms Fail-Closed SLA</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-xs font-semibold">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>SOC TRIAGE ACTIVE</span>
          </span>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* FILTER & SEARCH BAR                                  */}
      {/* ---------------------------------------------------- */}
      <div className="p-3.5 rounded-2xl glass-card space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8994A3] absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search incident ID, action, target, or problem..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-[#F4F6F8] placeholder:text-[#8994A3] focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          {/* Severity Filter Tabs */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/[0.08] overflow-x-auto">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSeverityFilter(lvl)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                  severityFilter === lvl
                    ? 'bg-cyan-500 text-black font-bold shadow-sm'
                    : 'text-[#8994A3] hover:text-[#F4F6F8]'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-black/40 border border-white/[0.08] text-xs font-mono text-[#C8D0DC] focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* INCIDENT CARDS GRID                                  */}
      {/* ---------------------------------------------------- */}
      {loading ? (
        <div className="py-20 text-center text-[#8994A3] font-mono text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Loading security incidents...</span>
        </div>
      ) : incidents.length === 0 ? (
        <EmptyState
          title="No Matching Security Incidents"
          description="GuardianAI runtime boundary is fully intact. No threat violations match the active filters."
          actionLabel="Clear Filters"
          onAction={() => {
            setSeverityFilter('ALL');
            setSectorFilter('ALL');
            setStatusFilter('ALL');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="p-4.5 rounded-2xl glass-card transition-all flex flex-col justify-between group hover:border-white/[0.18]"
            >
              <div>
                {/* Header: Severity & Incident ID */}
                <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-white/[0.06]">
                  <StatusBadge
                    variant={getSeverityVariant(inc.risk_level)}
                    label={inc.risk_level.toUpperCase()}
                  />
                  <span className="font-mono text-xs font-bold text-[#8994A3]">
                    {inc.id}
                  </span>
                </div>

                {/* Problem Title */}
                <h3 className="text-sm font-bold text-[#F4F6F8] mb-2 group-hover:text-cyan-400 transition-colors">
                  {inc.problem_title}
                </h3>

                {/* Agent & Action */}
                <div className="flex items-center gap-2 text-xs font-mono text-[#8994A3] mb-3 bg-black/30 p-2 rounded-xl border border-white/[0.06]">
                  <span className="text-[#C8D0DC] font-semibold truncate">{inc.agent}</span>
                  <span className="text-cyan-400">→</span>
                  <span className="text-amber-300 font-bold truncate">{inc.action}</span>
                </div>

                {/* Sector */}
                <div className="mb-2">
                  <div className="text-[10px] uppercase font-mono text-[#8994A3]">Sector</div>
                  <div className="text-xs font-semibold text-[#C8D0DC] font-mono">
                    {inc.sector}
                  </div>
                </div>

                {/* Decision */}
                <div className="mb-2">
                  <div className="text-[10px] uppercase font-mono text-[#8994A3]">Decision</div>
                  <div className="text-xs font-bold font-mono text-rose-400">
                    {inc.decision === 'DENY' ? 'DENIED' : inc.decision}
                  </div>
                </div>

                {/* Summary */}
                <p className="text-xs text-[#B5BEC9] line-clamp-2 leading-relaxed mb-3">
                  {inc.problem_summary}
                </p>
              </div>

              {/* View Analysis Button */}
              <div className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between">
                <StatusBadge variant={getStatusVariant(inc.status)} label={inc.status} />

                <button
                  onClick={() => {
                    setActiveIncident(inc);
                    setShareStatus(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-cyan-500 hover:text-black text-cyan-400 border border-cyan-500/30 font-mono text-xs font-bold tracking-wider transition-all flex items-center gap-1"
                >
                  <span>VIEW ANALYSIS</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* DETAILED INCIDENT ANALYSIS MODAL                     */}
      {/* ---------------------------------------------------- */}
      {activeIncident && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 lg:p-8 overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#0B0F19] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/[0.08] bg-[#0F1420] flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge
                    variant={getSeverityVariant(activeIncident.risk_level)}
                    label={`${activeIncident.risk_level} SEVERITY`}
                  />
                  <span className="font-mono text-xs text-cyan-400 font-bold">
                    {activeIncident.id}
                  </span>
                  <span className="text-[#8994A3]">•</span>
                  <span className="font-mono text-xs text-[#8994A3]">
                    {activeIncident.timestamp_iso}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-[#F4F6F8] tracking-tight">
                  {activeIncident.problem_title}
                </h2>
              </div>

              <button
                onClick={() => {
                  setActiveIncident(null);
                  if (onClearSelectedId) onClearSelectedId();
                }}
                className="p-2 rounded-xl text-[#8994A3] hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans text-[#C8D0DC]">
              {/* Forensics Banner */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 rounded-xl bg-black/40 border border-white/[0.06] font-mono">
                <div>
                  <div className="text-[10px] text-[#8994A3] uppercase">Agent</div>
                  <div className="text-[#F4F6F8] font-bold text-xs truncate">{activeIncident.agent}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#8994A3] uppercase">Action</div>
                  <div className="text-amber-300 font-bold text-xs truncate">{activeIncident.action}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#8994A3] uppercase">Target</div>
                  <div className="text-cyan-400 font-bold text-xs truncate">{activeIncident.target}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#8994A3] uppercase">Provenance</div>
                  <div className="text-violet-300 font-bold text-xs truncate">{activeIncident.provenance}</div>
                </div>
              </div>
              
              {/* Animated Attack Reconstruction Forensics Player */}
              <AttackReconstructionPlayer incident={activeIncident} />

              {/* 1. WHAT HAPPENED? */}
              <div className="p-4 rounded-xl glass-card">
                <div className="font-mono text-xs font-bold text-cyan-400 mb-1.5 flex items-center gap-1.5 uppercase">
                  <Activity className="w-4 h-4" />
                  <span>What Happened?</span>
                </div>
                <p className="text-[#B5BEC9] leading-relaxed text-xs">
                  {activeIncident.problem_summary}
                </p>
              </div>

              {/* 1b. IDENTITY ATTRIBUTION EVIDENCE (identity & insider incidents only) */}
              {activeIncident.attribution && (
                <div className="p-4 rounded-xl glass-card border border-violet-500/30 space-y-3">
                  <div className="font-mono text-xs font-bold text-violet-300 flex items-center gap-1.5 uppercase">
                    <Fingerprint className="w-4 h-4" />
                    <span>Identity Attribution Evidence</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                    {[
                      ['Claimed Account', activeIncident.attribution.claimed_account?.name],
                      ['Device Owner', activeIncident.attribution.device_owner?.name],
                      ['Verified Operator', activeIncident.attribution.verified_operator?.name],
                      ['Likely Operator', activeIncident.attribution.likely_operator?.name],
                    ].map(([k, v]) => (
                      <div key={k} className="px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/[0.06]">
                        <div className="text-[#8994A3] text-[10px] uppercase">{k}</div>
                        <div className={v === 'ACTUAL OPERATOR UNKNOWN' || v === 'NOT VERIFIED' ? 'text-amber-300' : 'text-[#F4F6F8]'}>{v || '—'}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] font-mono text-[#C8D0DC]">
                    Identity confidence: <b>{activeIncident.attribution.identity_confidence}%</b> ·
                    Risk score: <b>{activeIncident.attribution.risk_score}/100</b> ·
                    Decision: <b>{activeIncident.attribution.decision_label}</b>
                  </div>
                  {activeIncident.attribution.note && (
                    <p className="text-[11px] text-[#B5BEC9] leading-relaxed">{activeIncident.attribution.note}</p>
                  )}
                  <ul className="space-y-1">
                    {activeIncident.attribution.evidence?.map((e, i) => (
                      <li key={i} className="text-[11px] text-[#C8D0DC] flex gap-2">
                        <span className="text-violet-300 font-mono shrink-0">+{e.points}</span>
                        <span><b className="font-mono">{e.label}.</b> {e.evidence}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="text-[10px] font-mono text-[#8994A3]">
                    Evaluation {activeIncident.attribution.evaluation_id} · Session {activeIncident.attribution.session_id} (revoked)
                  </div>
                </div>
              )}

              {/* 2. WHY DID GUARDIANAI FLAG IT? */}
              <div className="p-4 rounded-xl glass-card">
                <div className="font-mono text-xs font-bold text-violet-400 mb-1.5 flex items-center gap-1.5 uppercase">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Why Did GuardianAI Flag It?</span>
                </div>
                <p className="text-[#B5BEC9] leading-relaxed text-xs mb-2.5">
                  {activeIncident.detailed_analysis}
                </p>

                {/* Reason Trace Tags */}
                {activeIncident.reason_trace?.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.06] space-y-1">
                    <div className="text-[10px] font-mono text-[#8994A3] uppercase">Reason Trace:</div>
                    <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-[#C8D0DC]">
                      {activeIncident.reason_trace.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 3. WHAT COULD BE AFFECTED? */}
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30">
                <div className="font-mono text-xs font-bold text-rose-400 mb-1.5 flex items-center gap-1.5 uppercase">
                  <AlertTriangle className="w-4 h-4" />
                  <span>What Could Be Affected? (Potential Effects)</span>
                </div>
                <ul className="space-y-1">
                  {activeIncident.potential_effects?.map((effect, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-rose-200">
                      <span className="text-rose-400 font-bold shrink-0">•</span>
                      <span>{effect}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 4. WHAT SHOULD BE DONE? */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                <div className="font-mono text-xs font-bold text-emerald-400 mb-1.5 flex items-center gap-1.5 uppercase">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>What Should Be Done? (Recommended Solution)</span>
                </div>
                <p className="text-emerald-200 font-medium leading-relaxed text-xs">
                  {activeIncident.recommended_solution}
                </p>
              </div>

              {/* 5. INCIDENT STATUS & DISPATCH */}
              <div className="p-4 rounded-xl glass-card space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase font-mono text-[#8994A3]">Incident Lifecycle Status</div>
                    <div className="flex items-center gap-2 mt-1">
                      {['OPEN', 'INVESTIGATING', 'RESOLVED'].map((st) => (
                        <button
                          key={st}
                          onClick={() => handleStatusChange(st)}
                          className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                            activeIncident.status === st
                              ? st === 'RESOLVED'
                                ? 'bg-emerald-500 text-black'
                                : st === 'INVESTIGATING'
                                ? 'bg-amber-400 text-black'
                                : 'bg-rose-500 text-black'
                              : 'bg-black/40 border border-white/[0.08] text-[#8994A3] hover:text-white'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Share Report via Email */}
                  <form onSubmit={handleShareReport} className="flex items-center gap-2">
                    <input
                      type="email"
                      value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      placeholder="security-lead@corp.com"
                      className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs font-mono text-[#F4F6F8] placeholder:text-[#8994A3] focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="submit"
                      disabled={shareLoading}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-xs font-bold flex items-center gap-1 transition-all disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{shareLoading ? 'SENDING...' : 'DISPATCH'}</span>
                    </button>
                  </form>
                </div>

                {shareStatus && (
                  <div
                    className={`p-2.5 rounded-xl border text-xs font-mono ${
                      shareStatus.type === 'success'
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {shareStatus.message}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
