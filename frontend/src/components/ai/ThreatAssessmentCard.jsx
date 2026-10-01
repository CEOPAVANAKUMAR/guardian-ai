import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Cpu,
  ArrowRight,
  Send,
  Zap,
  Clock,
  Sparkles,
  FileText,
} from 'lucide-react';
import ConfidenceGauge from '../visualization/ConfidenceGauge';

/**
 * ThreatAssessmentCard - Premium AI Evaluation Panel
 * Shows Risk Level, Confidence, Signals, Timeline, Reasoning, and Admin Decision Actions.
 */
export default function ThreatAssessmentCard({
  assessment,
  onEnforceAction,
  onViewInvestigation,
  onNavigateToIncidents,
  className = '',
}) {
  const [reasoningExpanded, setReasoningExpanded] = useState(true);
  const [actionEnforced, setActionEnforced] = useState(false);

  if (!assessment) return null;

  const {
    analysis_id,
    timestamp,
    input_text,
    risk_level = 'HIGH',
    risk_score = 88,
    confidence = { overall: 94.7, identity: 96.0, risk: 92.5, evidence: 95.2 },
    detected_signals = [],
    entities = {},
    timeline = [],
    reasoning = '',
    recommended_action = 'TEMPORARILY RESTRICT ACCESS',
    incident_id,
  } = assessment;

  const getRiskBadge = (lvl) => {
    switch (lvl?.toUpperCase()) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-950/80',
          border: 'border-rose-500/80',
          text: 'text-rose-400',
          glow: 'glow-rose',
          label: 'CRITICAL THREAT',
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-950/80',
          border: 'border-amber-500/80',
          text: 'text-amber-400',
          glow: 'glow-amber',
          label: 'HIGH RISK',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-blue-950/80',
          border: 'border-blue-500/80',
          text: 'text-blue-400',
          glow: 'glow-cyan',
          label: 'ELEVATED RISK',
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-emerald-950/80',
          border: 'border-emerald-500/80',
          text: 'text-emerald-400',
          glow: 'glow-emerald',
          label: 'LOW RISK',
        };
    }
  };

  const riskStyle = getRiskBadge(risk_level);

  const handleEnforce = () => {
    setActionEnforced(true);
    if (onEnforceAction) onEnforceAction(recommended_action);
  };

  return (
    <div className={`p-6 rounded-2xl glass-card space-y-6 ${className}`}>
      {/* Top Banner / Analysis Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${riskStyle.border} ${riskStyle.bg} ${riskStyle.text} ${riskStyle.glow}`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-[#F4F6F8] uppercase">
                AI THREAT ASSESSMENT & VERIFICATION
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/[0.06] text-violet-300 border border-violet-500/30">
                {analysis_id}
              </span>
            </div>
            <div className="text-xs text-[#B5BEC9] flex items-center gap-2 mt-0.5 font-mono">
              <Clock className="w-3.5 h-3.5 text-[#8994A3]" />
              <span>EVALUATED AT: {timestamp}</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">DETERMINISTIC FAIL-CLOSED ENGINE</span>
            </div>
          </div>
        </div>

        {/* Risk Level Badge */}
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-xl border text-sm font-mono font-black tracking-wider ${riskStyle.bg} ${riskStyle.border} ${riskStyle.text} ${riskStyle.glow}`}>
            {riskStyle.label} ({risk_score}/100)
          </div>
        </div>
      </div>

      {/* Main Grid: Confidence Gauge + Signals + Recommended Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Animated Confidence Gauge */}
        <div className="flex flex-col justify-between">
          <ConfidenceGauge
            score={confidence.overall}
            identityScore={confidence.identity}
            riskScore={confidence.risk}
            evidenceScore={confidence.evidence}
            size={190}
          />
        </div>

        {/* Center & Right Column: Signals & Recommended Action */}
        <div className="lg:col-span-2 flex flex-col justify-between space-y-4">
          {/* Detected Signals */}
          <div className="p-4 rounded-xl bg-[#060810] border border-white/[0.08]">
            <div className="text-[11px] font-mono font-bold tracking-wider text-[#8994A3] uppercase mb-2 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              DETECTED THREAT SIGNALS & ANOMALIES
            </div>
            <div className="flex flex-wrap gap-2">
              {detected_signals.map((sig, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>{sig}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Administrative Action Box */}
          <div className="p-4 rounded-xl bg-violet-950/20 border border-violet-500/40">
            <div className="text-[10px] font-mono font-bold tracking-wider text-violet-300 uppercase mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              RECOMMENDED ADMINISTRATIVE ACTION
            </div>
            <div className="text-base font-bold font-mono text-[#F4F6F8] tracking-wide">
              {recommended_action}
            </div>

            {/* Admin Decision CTA buttons */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={handleEnforce}
                disabled={actionEnforced}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
                  actionEnforced
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20 font-bold active:scale-95'
                }`}
              >
                {actionEnforced ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> ENFORCED (SESSION ISOLATED)
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" /> ENFORCE DECISION
                  </>
                )}
              </button>

              {onViewInvestigation && (
                <button
                  onClick={onViewInvestigation}
                  className="px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-[#C8D0DC] hover:text-white border border-white/[0.08] flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-violet-400" />
                  INVESTIGATION FILE
                </button>
              )}

              {incident_id && onNavigateToIncidents && (
                <button
                  onClick={() => onNavigateToIncidents(incident_id)}
                  className="px-3.5 py-2 rounded-xl text-xs font-mono font-semibold bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  INCIDENT #{incident_id}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Investigation Timeline */}
      {timeline.length > 0 && (
        <div className="p-4 rounded-xl bg-[#060810] border border-white/[0.08]">
          <div className="text-[11px] font-mono font-bold tracking-wider text-[#8994A3] uppercase mb-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-violet-400" />
            INVESTIGATION TIMELINE & SEQUENCE OF EVENTS
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
            {timeline.map((item) => (
              <div
                key={item.step}
                className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs font-mono flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-[10px] text-violet-400 font-bold">
                  <span>STEP 0{item.step}</span>
                  <span className="text-[#8994A3]">{item.timestamp}</span>
                </div>
                <div className="font-bold text-[#F4F6F8] text-[11px] mt-1.5 leading-snug">
                  {item.title}
                </div>
                <div className="text-[10px] text-[#B5BEC9] mt-1 line-clamp-2">
                  {item.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expandable Explainable AI Reasoning */}
      <div className="rounded-xl border border-white/[0.08] bg-[#060810] overflow-hidden">
        <button
          onClick={() => setReasoningExpanded(!reasoningExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-mono font-bold text-[#C8D0DC] hover:text-white hover:bg-white/[0.04] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span>EXPLAINABLE REASONING & DETERMINISTIC POLICY TRACE</span>
          </div>
          {reasoningExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {reasoningExpanded && (
          <div className="p-4 border-t border-white/[0.08] text-xs font-mono text-[#B5BEC9] leading-relaxed space-y-3">
            <p className="bg-black/40 p-3 rounded-lg border border-white/[0.06] text-[#F4F6F8]">
              "{reasoning}"
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div className="text-[#8994A3] uppercase text-[9px]">Target Principal</div>
                <div className="text-[#F4F6F8] font-bold truncate">
                  {entities.accounts?.[0] || 'admin_root'}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div className="text-[#8994A3] uppercase text-[9px]">Hardware Device</div>
                <div className="text-[#F4F6F8] font-bold truncate">
                  {entities.devices?.[0] || 'Unknown Android Device'}
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <div className="text-[#8994A3] uppercase text-[9px]">Ingress Geolocation</div>
                <div className="text-[#F4F6F8] font-bold truncate">
                  {entities.locations?.[0] || 'San Francisco, US'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
