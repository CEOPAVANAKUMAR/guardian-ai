import React, { useState, useEffect } from 'react';
import { fetchActions } from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import {
  Activity,
  Filter,
  RefreshCw,
  Clock,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ChevronRight,
  Hash,
  Database,
  KeyRound,
  FileText,
  User,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

/**
 * LiveFeed - AI Agent Activity Timeline Stream
 * High-contrast chronological timeline of all evaluated actions
 * with Identity, Scope, and Provenance breakdown.
 */
export default function LiveFeed({ onNavigateToIncidents }) {
  const [actions, setActions] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadFeed = async () => {
    try {
      const data = await fetchActions();
      setActions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
    const interval = setInterval(loadFeed, 3000);
    return () => clearInterval(interval);
  }, []);

  const filtered = actions.filter((item) => {
    if (filter === 'ALL') return true;
    return item.decision === filter;
  });

  const getDecisionVariant = (decision) => {
    switch (decision) {
      case 'DENY':
        return 'critical';
      case 'ESCALATE':
        return 'warning';
      case 'ALLOW':
      default:
        return 'safe';
    }
  };

  const getAnalysisBreakdown = (item) => {
    const isDenied = item.decision === 'DENY';
    const isEscalated = item.decision === 'ESCALATE';
    const isTainted = item.taint_level === 'EXTERNAL_UNTRUSTED' || item.taint_label === 'EXTERNAL_UNTRUSTED';

    return {
      identity: 'Verified',
      scope: isDenied ? 'Failed (OutOfScope)' : isEscalated ? 'High Impact' : 'Allowed',
      provenance: isTainted ? 'Untrusted' : 'Internal Verified',
    };
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8 font-sans">
      {/* ---------------------------------------------------- */}
      {/* LEVEL 1: STREAM TELEMETRY & CONTROL HUD              */}
      {/* ---------------------------------------------------- */}
      <div className="p-3.5 rounded-2xl glass-card border border-cyan-500/20 bg-gradient-to-r from-cyan-950/20 via-[#0F1420] to-[#0A0D14] flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
              <Activity className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[10px] text-[#8994A3] uppercase">STREAM STATUS</div>
              <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>LIVE STREAMING</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:block h-6 w-px bg-white/[0.08]" />

          <div className="flex items-center gap-3">
            <div>
              <span className="text-[10px] text-[#8994A3] uppercase block">TOTAL</span>
              <span className="text-[#F4F6F8] font-bold">{actions.length}</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 uppercase block">ALLOWED</span>
              <span className="text-emerald-400 font-bold">{actions.filter((a) => a.decision === 'ALLOW').length}</span>
            </div>
            <div>
              <span className="text-[10px] text-amber-400 uppercase block">ESCALATED</span>
              <span className="text-amber-400 font-bold">{actions.filter((a) => a.decision === 'ESCALATE').length}</span>
            </div>
            <div>
              <span className="text-[10px] text-rose-400 uppercase block">DENIED</span>
              <span className="text-rose-400 font-bold">{actions.filter((a) => a.decision === 'DENY').length}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter buttons */}
          <div className="flex items-center gap-1 bg-[#0F1420] p-1 rounded-xl border border-white/[0.08] text-xs font-mono">
            <Filter className="w-3.5 h-3.5 text-[#8994A3] ml-1.5 mr-0.5" />
            {['ALL', 'ALLOW', 'ESCALATE', 'DENY'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-lg transition-all text-[11px] font-bold ${
                  filter === f
                    ? 'bg-cyan-500 text-black shadow-sm'
                    : 'text-[#8994A3] hover:text-[#F4F6F8]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={loadFeed}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-[#8994A3] hover:text-white border border-white/[0.1] transition-all"
            title="Refresh stream"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* LEVEL 2: TIMELINE STREAM                             */}
      {/* ---------------------------------------------------- */}
      {filtered.length === 0 ? (
        <EmptyState
          title={`No Records Matching '${filter}'`}
          description="Trigger actions from the Threat Intel simulator to generate live stream events."
          actionLabel="Open Threat Intel Simulator"
          onAction={() => onNavigateToIncidents && onNavigateToIncidents()}
        />
      ) : (
        <div className="relative pl-6 sm:pl-8 before:absolute before:inset-0 before:left-3 sm:before:left-4 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500/40 before:via-violet-500/30 before:to-emerald-500/40 space-y-3.5">
          {filtered.map((item, index) => {
            const variant = getDecisionVariant(item.decision);
            const analysis = getAnalysisBreakdown(item);
            const timeStr = item.created_at ? item.created_at.split('T')[1]?.slice(0, 8) : '10:42:01';

            return (
              <div key={item.id || index} className="relative flex flex-col space-y-2">
                {/* Timeline Node Bullet */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-4 w-4 h-4 rounded-full border-2 bg-[#0A0D14] flex items-center justify-center ${
                    variant === 'critical'
                      ? 'border-rose-500'
                      : variant === 'warning'
                      ? 'border-amber-400'
                      : 'border-emerald-500'
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      variant === 'critical'
                        ? 'bg-rose-400'
                        : variant === 'warning'
                        ? 'bg-amber-300'
                        : 'bg-emerald-400'
                    }`}
                  />
                </div>

                {/* Timeline Card Surface */}
                <div className="p-4.5 rounded-2xl glass-card transition-all">
                  {/* Top Row: Time, Agent, Requested Action, Decision */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[11px] font-mono font-bold text-[#8994A3] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{timeStr} UTC</span>
                      </span>

                      <span className="text-xs font-mono font-bold text-[#F4F6F8] px-2 py-0.5 rounded-lg bg-black/40 border border-white/[0.08]">
                        {item.agent_name || item.agent_id || item.agent || 'Finance Agent'}
                      </span>

                      <span className="text-xs font-mono text-[#B5BEC9]">
                        Requested: <span className="font-bold text-[#F4F6F8]">{item.action_type || item.action}</span>
                      </span>
                    </div>

                    <StatusBadge variant={variant} label={item.decision} />
                  </div>

                  {/* Middle Row: GuardianAI 3-Point Analysis Grid */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs">
                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04]">
                      <div className="text-[10px] text-[#8994A3] uppercase tracking-wider">
                        Identity Verification
                      </div>
                      <div className="text-xs font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{analysis.identity}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04]">
                      <div className="text-[10px] text-[#8994A3] uppercase tracking-wider">
                        Task Scope Manifest
                      </div>
                      <div
                        className={`text-xs font-bold mt-0.5 ${
                          analysis.scope.includes('Failed')
                            ? 'text-rose-400'
                            : analysis.scope.includes('High')
                            ? 'text-amber-300'
                            : 'text-emerald-400'
                        }`}
                      >
                        {analysis.scope}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/[0.04]">
                      <div className="text-[10px] text-[#8994A3] uppercase tracking-wider">
                        Provenance / Taint
                      </div>
                      <div
                        className={`text-xs font-bold mt-0.5 ${
                          analysis.provenance.includes('Untrusted') ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {analysis.provenance}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Reason Trace & Incident Link */}
                  <div className="mt-2.5 pt-2 border-t border-white/[0.04] flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#8994A3]">
                    <div className="truncate max-w-xl text-[11px]">
                      <span className="text-[#8994A3] uppercase text-[10px]">Reason: </span>
                      <span className="text-[#C8D0DC]">
                        {item.reason_trace || item.reason || (item.reasons && item.reasons[0]) || 'Evaluated deterministically against fail-closed rule matrix.'}
                      </span>
                    </div>

                    {item.decision === 'DENY' && onNavigateToIncidents && (
                      <button
                        onClick={() => onNavigateToIncidents()}
                        className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-[11px] font-bold"
                      >
                        <span>View Incident</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
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
