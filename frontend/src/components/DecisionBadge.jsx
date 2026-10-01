import React from 'react';
import { CheckCircle2, ShieldAlert, AlertTriangle, XCircle } from 'lucide-react';

export default function DecisionBadge({ decision, className = '' }) {
  const d = String(decision || 'DENY').toUpperCase();

  if (d === 'ALLOW') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        ALLOW
      </span>
    );
  }

  if (d === 'ALLOW_WITH_CONSTRAINTS') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        ALLOW (CONSTRAINED)
      </span>
    );
  }

  if (d === 'ESCALATE') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5" />
        ESCALATE
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 ${className}`}>
      <XCircle className="w-3.5 h-3.5" />
      DENY
    </span>
  );
}
