import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, ShieldCheck, Cpu } from 'lucide-react';

/**
 * StatusBadge - Accessible, Semantic Status Badge
 * Satisfies Requirement #29: Always uses color + text + icon to communicate status.
 */
export default function StatusBadge({
  status, // 'ALLOW' | 'SAFE' | 'VERIFIED' | 'ESCALATE' | 'PENDING' | 'WARNING' | 'DENY' | 'BLOCKED' | 'CRITICAL' | 'AI'
  size = 'md', // 'sm' | 'md'
  showIcon = true,
  className = '',
}) {
  const norm = String(status || '').toUpperCase();

  let config = {
    label: norm,
    icon: CheckCircle2,
    style: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };

  if (['ALLOW', 'SAFE', 'VERIFIED', 'ALLOWED', 'SUCCESS'].includes(norm)) {
    config = {
      label: norm === 'ALLOWED' ? 'ALLOW' : norm,
      icon: CheckCircle2,
      style: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    };
  } else if (['ESCALATE', 'PENDING', 'WARNING', 'ESCALATED', 'ELEVATED', 'UNDER_INVESTIGATION'].includes(norm)) {
    config = {
      label: norm === 'ESCALATED' ? 'ESCALATE' : norm,
      icon: norm === 'PENDING' ? Clock : AlertTriangle,
      style: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    };
  } else if (['DENY', 'DENIED', 'BLOCKED', 'CRITICAL', 'DANGER', 'TAMPERED'].includes(norm)) {
    config = {
      label: norm === 'DENIED' ? 'DENY' : norm,
      icon: XCircle,
      style: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    };
  } else if (['AI', 'INTELLIGENCE', 'ANALYSIS'].includes(norm)) {
    config = {
      label: norm,
      icon: Cpu,
      style: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    };
  } else {
    config = {
      label: norm || 'UNKNOWN',
      icon: ShieldCheck,
      style: 'bg-white/[0.06] text-[#C8D0DC] border-white/[0.1]',
    };
  }

  const Icon = config.icon;
  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-2 py-0.5 gap-1'
    : 'text-[11px] px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-full font-mono font-bold tracking-wider uppercase border ${sizeClasses} ${config.style} ${className}`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} />}
      <span>{config.label}</span>
    </span>
  );
}
