import React from 'react';
import { Check, Loader2, ArrowRight, ShieldAlert, Cpu, Sparkles, Database, FileSearch, ShieldCheck } from 'lucide-react';

/**
 * AnalysisPipeline - 6-Stage Illuminated AI Evaluation Sequence
 * Visually communicates intelligence progressing through:
 * RECEIVING -> SEMANTIC CONTEXT -> ENTITY EXTRACTION -> RISK EVALUATION -> EVIDENCE CHECK -> RECOMMENDATION
 */
export default function AnalysisPipeline({
  currentStage = 0, // 0 to 6 (0 = idle, 1..6 = in progress, 6 = finished)
  isAnalyzing = false,
  className = '',
}) {
  const stages = [
    {
      id: 1,
      title: 'Perimeter Ingestion',
      subtitle: 'Receiving input & establishing runtime boundary...',
      icon: Cpu,
      color: 'cyan',
    },
    {
      id: 2,
      title: 'Semantic Context',
      subtitle: 'Understanding intent & prompt structure...',
      icon: Sparkles,
      color: 'blue',
    },
    {
      id: 3,
      title: 'Entity Extraction',
      subtitle: 'Extracting accounts, devices, locations & targets...',
      icon: Database,
      color: 'violet',
    },
    {
      id: 4,
      title: 'Risk Evaluation',
      subtitle: 'Evaluating risk indicators & policy vectors...',
      icon: ShieldAlert,
      color: 'amber',
    },
    {
      id: 5,
      title: 'Evidence Verification',
      subtitle: 'Cross-checking relational provenance & logs...',
      icon: FileSearch,
      color: 'purple',
    },
    {
      id: 6,
      title: 'Decision Engine',
      subtitle: 'Synthesizing confidence & generating action...',
      icon: ShieldCheck,
      color: 'emerald',
    },
  ];

  return (
    <div className={`p-6 rounded-2xl bg-[#080e21]/80 border border-cyan-500/20 backdrop-blur-md shadow-2xl ${className}`}>
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-wider text-cyan-300 uppercase">
            GUARDIAN REASONING ENGINE PIPELINE
          </span>
        </div>
        <div className="text-xs font-mono text-slate-400">
          {isAnalyzing ? (
            <span className="text-cyan-400 flex items-center gap-1.5 font-bold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              STAGE {currentStage} OF 6 IN PROGRESS
            </span>
          ) : currentStage >= 6 ? (
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> ANALYSIS COMPLETE
            </span>
          ) : (
            <span>STANDBY READY</span>
          )}
        </div>
      </div>

      {/* Visual Horizontal/Grid Progress Stepper */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-6 gap-3">
        {stages.map((stage) => {
          const isDone = currentStage > stage.id || (!isAnalyzing && currentStage >= 6);
          const isCurrent = isAnalyzing && currentStage === stage.id;
          const isPending = currentStage < stage.id;
          const Icon = stage.icon;

          return (
            <div
              key={stage.id}
              className={`p-3.5 rounded-xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${
                isDone
                  ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                  : isCurrent
                  ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-lg shadow-cyan-500/30 ring-1 ring-cyan-400/50'
                  : 'border-slate-800/70 bg-[#060b18]/60 text-slate-400'
              }`}
            >
              {/* Scan Beam on active stage */}
              {isCurrent && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent animate-pulse pointer-events-none" />
              )}

              <div className="flex items-center justify-between">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                    isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : isCurrent
                      ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400 animate-pulse'
                      : 'bg-slate-800/60 text-slate-400'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : isCurrent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : stage.id}
                </div>

                <Icon className={`w-4 h-4 ${isDone ? 'text-emerald-400' : isCurrent ? 'text-cyan-400' : 'text-slate-400'}`} />
              </div>

              <div className="mt-3">
                <div className="text-[11px] font-mono font-bold tracking-tight text-white uppercase truncate">
                  {stage.title}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {stage.subtitle}
                </div>
              </div>

              {/* Status Indicator */}
              <div className="mt-3 pt-2 border-t border-slate-800/60 text-[9px] font-mono uppercase font-bold flex items-center justify-between">
                <span>
                  {isDone ? (
                    <span className="text-emerald-400">PASSED</span>
                  ) : isCurrent ? (
                    <span className="text-cyan-300 animate-pulse">PROCESSING</span>
                  ) : (
                    <span className="text-slate-400">QUEUED</span>
                  )}
                </span>
                <span className="text-slate-400">P-0{stage.id}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
