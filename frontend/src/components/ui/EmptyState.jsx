import React from 'react';
import { ShieldCheck } from 'lucide-react';

/**
 * EmptyState - Designed Enterprise Empty State
 * Satisfies Requirement #21: Meaningful copy, minimal icon, optional recovery action.
 */
export default function EmptyState({
  icon: Icon = ShieldCheck,
  title = 'No active records',
  description = 'GuardianAI has not detected any items requiring attention in this scope.',
  action,
  className = '',
}) {
  return (
    <div className={`p-8 sm:p-12 rounded-2xl glass-card text-center flex flex-col items-center justify-center max-w-xl mx-auto my-6 ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#B5BEC9] mb-3.5 shadow-inner">
        <Icon className="w-6 h-6 text-emerald-400/80" />
      </div>

      <h3 className="text-base font-semibold text-[#F4F6F8] font-sans">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-[#B5BEC9] mt-1.5 max-w-md leading-relaxed font-sans">
        {description}
      </p>

      {action && (
        <div className="mt-5">
          {action}
        </div>
      )}
    </div>
  );
}
