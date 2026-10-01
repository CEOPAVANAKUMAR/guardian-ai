import React from 'react';

/**
 * PageHeader - Compact, Enterprise-Grade Header Component
 * Establishes Level 1 visual hierarchy without wasting vertical viewport space.
 */
export default function PageHeader({
  title,
  subtitle,
  badgeText,
  badgeVariant = 'default', // 'emerald' | 'amber' | 'crimson' | 'violet' | 'cyan' | 'default'
  actions,
  className = '',
}) {
  const badgeStyles = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    crimson: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    violet: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    default: 'bg-white/[0.06] text-[#C8D0DC] border-white/[0.1]',
  };

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-white/[0.08] ${className}`}>
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F4F6F8] font-sans">
            {title}
          </h1>
          {badgeText && (
            <span
              className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                badgeStyles[badgeVariant] || badgeStyles.default
              }`}
            >
              {badgeText}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-[#B5BEC9] mt-0.5 leading-relaxed font-sans max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0">
          {actions}
        </div>
      )}
    </div>
  );
}
