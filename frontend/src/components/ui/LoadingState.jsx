import React from 'react';
import { Loader2, Shield } from 'lucide-react';

/**
 * LoadingState - Contextual Enterprise Loading State
 * Satisfies Requirement #22: Replaces generic spinners with informative pipeline messages.
 */
export default function LoadingState({
  title = 'Evaluating Runtime Policy',
  currentStep = 'Correlating agent activity with deterministic permissions...',
  steps = [],
  activeStepIndex = 0,
  className = '',
}) {
  return (
    <div className={`p-8 rounded-2xl glass-card flex flex-col items-center justify-center text-center max-w-md mx-auto my-6 ${className}`}>
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Shield className="w-6 h-6 animate-pulse" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#050608] border border-white/[0.1] flex items-center justify-center">
          <Loader2 className="w-3 h-3 text-emerald-400 animate-spin" />
        </div>
      </div>

      <h4 className="text-sm font-semibold text-[#F4F6F8] font-sans">
        {title}
      </h4>

      <p className="text-xs text-[#B5BEC9] font-mono mt-1">
        {currentStep}
      </p>

      {steps.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/[0.08] w-full space-y-1.5 text-left">
          {steps.map((st, idx) => {
            const isDone = idx < activeStepIndex;
            const isCurrent = idx === activeStepIndex;
            return (
              <div
                key={idx}
                className={`text-[11px] font-mono flex items-center justify-between px-2.5 py-1 rounded-lg ${
                  isCurrent
                    ? 'bg-emerald-500/10 text-emerald-300 font-bold'
                    : isDone
                    ? 'text-[#B5BEC9]'
                    : 'text-[#8994A3]'
                }`}
              >
                <span>{st}</span>
                <span>{isDone ? '✓' : isCurrent ? '...' : '○'}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
