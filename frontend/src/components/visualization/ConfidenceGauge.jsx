import React from 'react';

/**
 * ConfidenceGauge - Circular animated SVG Gauge with multi-layer telemetry
 */
export default function ConfidenceGauge({
  score = 94.7,
  identityScore = 96.0,
  riskScore = 92.5,
  evidenceScore = 95.2,
  size = 180,
  label = 'AI CONFIDENCE',
}) {
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (val) => {
    if (val >= 90) return { stroke: '#00f0ff', glow: 'rgba(0, 240, 255, 0.4)', text: 'text-cyan-400' };
    if (val >= 75) return { stroke: '#38bdf8', glow: 'rgba(56, 189, 248, 0.4)', text: 'text-sky-400' };
    if (val >= 50) return { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)', text: 'text-amber-400' };
    return { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)', text: 'text-rose-400' };
  };

  const style = getScoreColor(score);

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#080e21]/70 border border-cyan-500/20 shadow-xl backdrop-blur-md">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Ambient Glow */}
        <div
          className="absolute inset-4 rounded-full blur-xl pointer-events-none opacity-20"
          style={{ background: style.stroke }}
        />

        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          {/* Track Circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="rgba(255, 255, 255, 0.07)"
            strokeWidth="10"
            fill="transparent"
          />

          {/* Value Progress Circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={style.stroke}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: 'stroke-dashoffset 1s ease-in-out',
              filter: `drop-shadow(0 0 6px ${style.glow})`,
            }}
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-bold">
            {label}
          </span>
          <span className={`text-3xl font-black font-mono tracking-tight ${style.text}`}>
            {score.toFixed(1)}%
          </span>
          <span className="text-[9px] font-mono text-emerald-400 tracking-wider uppercase font-semibold">
            BAYESIAN SYNTHESIS
          </span>
        </div>
      </div>

      {/* Sub-breakdown Bars */}
      <div className="w-full mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center font-mono">
        <div>
          <div className="text-[9px] text-slate-400 uppercase">Identity</div>
          <div className="text-xs font-bold text-slate-200">{identityScore.toFixed(0)}%</div>
          <div className="w-full bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
            <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${identityScore}%` }} />
          </div>
        </div>
        <div>
          <div className="text-[9px] text-slate-400 uppercase">Risk</div>
          <div className="text-xs font-bold text-slate-200">{riskScore.toFixed(0)}%</div>
          <div className="w-full bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
            <div className="bg-violet-400 h-full rounded-full" style={{ width: `${riskScore}%` }} />
          </div>
        </div>
        <div>
          <div className="text-[9px] text-slate-400 uppercase">Evidence</div>
          <div className="text-xs font-bold text-slate-200">{evidenceScore.toFixed(0)}%</div>
          <div className="w-full bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
            <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${evidenceScore}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
