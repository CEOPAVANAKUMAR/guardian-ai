import React from 'react';
import { Shield, AlertOctagon } from 'lucide-react';

export default function RiskGauge({ risk = 'LOW', score = null, className = '' }) {
  const r = String(risk || 'LOW').toUpperCase();

  const getDetails = () => {
    switch (r) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-950/40 text-rose-400 border-rose-500/40',
          dot: 'bg-rose-500 animate-ping',
          label: 'CRITICAL RISK',
          pct: 100,
        };
      case 'HIGH':
        return {
          bg: 'bg-amber-950/40 text-amber-400 border-amber-500/40',
          dot: 'bg-amber-500',
          label: 'HIGH RISK',
          pct: 75,
        };
      case 'MEDIUM':
        return {
          bg: 'bg-blue-950/40 text-blue-400 border-blue-500/40',
          dot: 'bg-blue-400',
          label: 'MEDIUM RISK',
          pct: 45,
        };
      default:
        return {
          bg: 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40',
          dot: 'bg-emerald-400',
          label: 'LOW RISK',
          pct: 15,
        };
    }
  };

  const details = getDetails();

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md border text-xs font-mono font-medium ${details.bg} ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${details.dot}`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${details.dot.replace(' animate-ping', '')}`} />
      </span>
      <span>{details.label}</span>
    </div>
  );
}
