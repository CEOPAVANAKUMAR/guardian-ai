import React from 'react';

/**
 * MetricCard - Precision Enterprise Telemetry Card
 * Displays high-density operational metrics with clear visual hierarchy.
 */
export default function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  variant = 'default', // 'emerald' | 'amber' | 'crimson' | 'violet' | 'cyan' | 'default'
  onClick,
  className = '',
}) {
  const iconVariants = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
    crimson: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
    violet: 'bg-violet-500/10 text-violet-400 border border-violet-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30',
    default: 'bg-white/[0.05] text-[#C8D0DC] border border-white/[0.1]',
  };

  const valueVariants = {
    emerald: 'text-emerald-400',
    amber: 'text-amber-300',
    crimson: 'text-rose-400',
    violet: 'text-violet-300',
    cyan: 'text-cyan-400',
    default: 'text-[#F4F6F8]',
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl glass-card transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:border-white/[0.18]' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-mono font-medium text-[#8994A3] uppercase tracking-wider block truncate">
            {label}
          </span>
          <div className={`text-2xl font-bold font-mono tracking-tight mt-1 truncate ${valueVariants[variant]}`}>
            {value}
          </div>
          {subtext && (
            <div className="text-xs text-[#B5BEC9] mt-1 truncate font-sans">
              {subtext}
            </div>
          )}
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-xl shrink-0 ${iconVariants[variant] || iconVariants.default}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
}
