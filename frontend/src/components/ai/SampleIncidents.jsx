import React from 'react';
import { Flame, ShieldAlert, Sparkles, UserX, Globe2, FileWarning, ArrowRight } from 'lucide-react';

/**
 * SampleIncidents - Demonstration Scenarios
 * Enables judges and administrators to load realistic security scenarios with 1 click.
 */
export default function SampleIncidents({
  samples = [],
  onSelectSample,
  selectedSampleId,
  className = '',
}) {
  const getIcon = (category = '') => {
    const cat = category.toUpperCase();
    if (cat.includes('AI') || cat.includes('LLM')) return Flame;
    if (cat.includes('NETWORK') || cat.includes('TRAVEL')) return Globe2;
    if (cat.includes('DOCUMENT')) return FileWarning;
    if (cat.includes('SYSTEM')) return ShieldAlert;
    return UserX;
  };

  const getRiskBadge = (lvl = '') => {
    switch (lvl.toUpperCase()) {
      case 'CRITICAL':
        return 'text-rose-400 border-rose-500/40 bg-rose-950/60';
      case 'HIGH':
        return 'text-amber-300 border-amber-500/40 bg-amber-950/60';
      default:
        return 'text-emerald-400 border-emerald-500/40 bg-emerald-950/60';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-[11px] font-mono font-bold tracking-wider text-[#B5BEC9] uppercase">
            DEMONSTRATION SCENARIOS
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#8994A3]">
          Click to load & evaluate
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {samples.map((item) => {
          const Icon = getIcon(item.category);
          const isSelected = selectedSampleId === item.id;
          const badgeStyle = getRiskBadge(item.risk_level);

          return (
            <div
              key={item.id}
              onClick={() => onSelectSample(item)}
              className={`p-3 rounded-xl border cursor-pointer transition-all duration-150 select-none flex flex-col justify-between ${
                isSelected
                  ? 'border-violet-500/80 bg-violet-950/40 shadow-md shadow-violet-500/20 ring-1 ring-violet-500/40'
                  : 'border-white/[0.08] bg-[#0A0D15]/80 hover:border-white/[0.18] hover:bg-white/[0.04]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="p-1 rounded-md bg-white/[0.05] text-violet-400 border border-white/[0.08]">
                      <Icon className="w-3 h-3" />
                    </div>
                    <span className="text-[10px] font-mono font-semibold tracking-wider text-[#8994A3] uppercase">
                      {item.category}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border ${badgeStyle}`}>
                    {item.risk_level}
                  </span>
                </div>

                <div className="text-xs font-semibold font-mono text-[#F4F6F8] mt-1.5 leading-snug line-clamp-1">
                  {item.title}
                </div>

                <div className="text-[11px] text-[#B5BEC9] mt-0.5 line-clamp-2 font-sans">
                  "{item.text}"
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono">
                <span className="text-[#8994A3] truncate max-w-[170px]">Action: {item.recommended_action}</span>
                <span className="text-violet-300 flex items-center gap-1 font-bold shrink-0">
                  LOAD <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
