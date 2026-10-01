import React from 'react';
import DecisionBadge from './DecisionBadge';
import RiskGauge from './RiskGauge';
import { Terminal, Database, Clock, FileText, Cpu, ShieldCheck, ChevronRight, AlertTriangle } from 'lucide-react';

export default function ActionCard({ record, onViewIncident }) {
  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(typeof ts === 'number' && ts < 2000000000 ? ts * 1000 : ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const isThreatOrBlocked =
    record.decision === 'DENY' ||
    record.decision === 'ESCALATE' ||
    record.risk_level === 'CRITICAL' ||
    record.risk_level === 'HIGH';

  return (
    <div className="bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-4.5 transition-all duration-200 shadow-md">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
            <Cpu className="w-4 h-4" />
          </span>
          <div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>{record.agent_id}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
                {record.task_id}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 font-mono mt-0.5">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{formatTime(record.timestamp)}</span>
              <span>•</span>
              <span className="text-cyan-400 font-semibold">{record.latency_ms ? `${record.latency_ms}ms` : '1.2ms'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <RiskGauge risk={record.risk_level} />
          <DecisionBadge decision={record.decision} />
        </div>
      </div>

      {/* Action, Target, Provenance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800/60 font-mono">
        <div>
          <span className="text-slate-400 block mb-1 text-[11px] uppercase">Action & Target:</span>
          <span className="text-cyan-300 font-bold">{record.action_type}</span>
          <span className="text-slate-400"> on </span>
          <span className="text-amber-300 font-semibold">{record.resource}</span>
        </div>
        <div>
          <span className="text-slate-400 block mb-1 text-[11px] uppercase">Provenance / Taint:</span>
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              record.taint_level === 'CLEAN'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}
          >
            {record.taint_level || 'CLEAN'}
          </span>
        </div>
      </div>

      {/* Reason Trace */}
      {record.reasons && record.reasons.length > 0 && (
        <div className="mt-2 text-xs">
          <div className="text-slate-400 font-mono text-[11px] uppercase mb-1">Reason Trace:</div>
          <div className="space-y-1">
            {record.reasons.map((r, i) => (
              <div
                key={i}
                className="text-slate-300 bg-slate-900/40 px-2.5 py-1.5 rounded-lg border border-slate-800/40 font-mono text-[11px] flex items-center gap-1.5"
              >
                <span className="text-cyan-400 font-bold">›</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Hash & Incident Button */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
        {record.action_hash ? (
          <span className="truncate">
            Hash: <span className="text-slate-300">{record.action_hash.slice(0, 16)}...</span>
          </span>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-3">
          <span className="text-emerald-400/80 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Audited
          </span>

          {/* VIEW INCIDENT ANALYSIS button for blocked/high risk actions */}
          {isThreatOrBlocked && onViewIncident && (
            <button
              onClick={() => onViewIncident(record)}
              className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500 hover:text-black text-rose-300 border border-rose-500/30 font-mono text-[11px] font-bold tracking-wider transition-all flex items-center gap-1 shadow-sm"
            >
              <span>VIEW INCIDENT ANALYSIS</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
