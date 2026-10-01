import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Send,
  Loader2,
  Sparkles,
  RefreshCw,
  Cpu,
  Zap,
  CheckCircle2,
  AlertTriangle,
  History,
  Terminal,
  ArrowRight,
  FileSearch,
  Lock,
  Database,
  Activity,
  FileCode,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { PrimaryButton, SecondaryButton } from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import AnalysisPipeline from '../components/ai/AnalysisPipeline';
import ThreatAssessmentCard from '../components/ai/ThreatAssessmentCard';
import SampleIncidents from '../components/ai/SampleIncidents';
import { analyzeWithAi, fetchSampleIncidents } from '../services/api';

/**
 * AiAnalysis - High-Efficiency Enterprise AI Security Analysis
 * 
 * Satisfies Requirements:
 * - Requirement #1 & #16: Primary action and input visible immediately above the fold on 1366x768 and 1440x900.
 * - Requirement #2: Visual hierarchy (Page Purpose -> Input -> CTA -> Pipeline -> Deep Assessment).
 * - Requirement #4 & #5: WCAG AA contrast, clear typography scale, no giant decorative empty space.
 */
export default function AiAnalysis({
  onNavigateToIncidents,
  onNavigateToInvestigation,
}) {
  const [inputText, setInputText] = useState(
    'Multiple unauthorized login attempts were detected from an unknown device.'
  );
  const [samples, setSamples] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState('preset-1');

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [assessment, setAssessment] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);

  // Load sample scenarios on mount
  useEffect(() => {
    fetchSampleIncidents().then((data) => {
      setSamples(data);
    });
  }, []);

  // Handle Sample Selection
  const handleSelectSample = (sample) => {
    setSelectedSampleId(sample.id);
    setInputText(sample.text);
  };

  // Run the multi-stage AI analysis
  const handleAnalyze = async () => {
    if (!inputText.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setCurrentStage(1);
    setAssessment(null);

    // Progressive stage animation delays (total ~2.4s)
    const timers = [];
    timers.push(setTimeout(() => setCurrentStage(2), 350));
    timers.push(setTimeout(() => setCurrentStage(3), 750));
    timers.push(setTimeout(() => setCurrentStage(4), 1150));
    timers.push(setTimeout(() => setCurrentStage(5), 1600));
    timers.push(setTimeout(() => setCurrentStage(6), 2050));

    try {
      const result = await analyzeWithAi(inputText);

      // Finish at 2350ms
      setTimeout(() => {
        setAssessment(result);
        setIsAnalyzing(false);
        setCurrentStage(6);
        setAnalysisHistory((prev) => [result, ...prev.slice(0, 4)]);
      }, 2350);
    } catch (e) {
      setTimeout(() => {
        setIsAnalyzing(false);
      }, 2350);
    }
  };

  // Admin decision enforcement callback
  const handleEnforceAction = (action) => {
    if (onNavigateToIncidents) {
      onNavigateToIncidents();
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8 font-sans animate-fadeIn">
      {/* ---------------------------------------------------- */}
      {/* LEVEL 1: COGNITIVE REASONING TELEMETRY STRIP          */}
      {/* ---------------------------------------------------- */}
      <div className="p-3.5 rounded-2xl glass-card border border-violet-500/20 bg-gradient-to-r from-violet-950/20 via-[#0F1420] to-[#0A0D14] flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[10px] text-[#8994A3] uppercase">COGNITIVE ENGINE</div>
              <div className="text-[#F4F6F8] font-bold">GuardianAI Cognitive Core v2.4</div>
            </div>
          </div>

          <div className="hidden sm:block h-6 w-px bg-white/[0.08]" />

          <div className="hidden md:flex flex-col">
            <span className="text-[10px] text-[#8994A3] uppercase">INVARIANT ENGINE</span>
            <span className="text-emerald-400 font-bold">Deterministic AST & Taint Guard</span>
          </div>

          <div className="hidden sm:block h-6 w-px bg-white/[0.08]" />

          <div className="flex flex-col">
            <span className="text-[10px] text-[#8994A3] uppercase">EVALUATION LATENCY</span>
            <span className="text-cyan-400 font-bold">&lt; 2.4s Multi-Stage Inference</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>GATEWAY ENFORCED</span>
          </span>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* LEVEL 2: PRIMARY ACTION & INPUT ABOVE THE FOLD       */}
      {/* ---------------------------------------------------- */}
      <div className="p-4 sm:p-5 rounded-2xl glass-card space-y-3.5">
        <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#F4F6F8]">
            <Terminal className="w-4 h-4 text-violet-400" />
            <span>INCIDENT TELEMETRY & BEHAVIORAL INPUT</span>
          </div>

          <span className="text-[11px] font-mono text-[#8994A3]">
            {inputText.length} characters • UTF-8 Sanitized
          </span>
        </div>

        {/* Input Area */}
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isAnalyzing}
            rows={3}
            placeholder="Describe an agent event or paste telemetry (e.g. Agent proposes tool call READ_SECRET from external untrusted invoice context)..."
            className="w-full p-3.5 rounded-xl bg-[#060810] border border-white/[0.1] text-[#F4F6F8] font-mono text-xs sm:text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none placeholder:text-[#8994A3] transition-all"
          />

          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 text-xs text-[#B5BEC9]">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Select preset scenario below or type custom agent behavior</span>
            </div>

            <PrimaryButton
              onClick={handleAnalyze}
              disabled={isAnalyzing || !inputText.trim()}
              loading={isAnalyzing}
              icon={Sparkles}
              variant="violet"
              size="md"
            >
              {isAnalyzing ? 'ANALYZING EVENT...' : 'ANALYZE EVENT'}
            </PrimaryButton>
          </div>
        </div>

        {/* Presets (Horizontal Grid) */}
        {samples.length > 0 && (
          <div className="pt-1">
            <SampleIncidents
              samples={samples}
              onSelectSample={handleSelectSample}
              selectedSampleId={selectedSampleId}
            />
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* LEVEL 3: 6-STAGE REASONING PIPELINE                  */}
      {/* ---------------------------------------------------- */}
      {(isAnalyzing || currentStage > 0) && (
        <AnalysisPipeline
          currentStage={currentStage}
          isAnalyzing={isAnalyzing}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* LEVEL 4: ASSESSMENT RESULT OR BEHAVIORAL SAFETY MATRIX */}
      {/* ---------------------------------------------------- */}
      {assessment ? (
        <ThreatAssessmentCard
          assessment={assessment}
          onEnforceAction={handleEnforceAction}
          onViewIncidents={onNavigateToIncidents}
          onViewInvestigation={onNavigateToInvestigation}
        />
      ) : !isAnalyzing && (
        <div className="space-y-4">
          {/* Active Behavioral Safety Invariant Matrix */}
          <div className="p-4 sm:p-5 rounded-2xl glass-card space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-mono font-bold text-[#F4F6F8] uppercase tracking-wider">
                  Active Behavioral Safety Invariant Matrix (4 Enforced)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                100% INVARIANT COVERAGE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/30 transition-all font-mono">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-emerald-400 font-bold">POL-004</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div className="text-xs font-bold text-[#F4F6F8]">Prompt Injection Guard</div>
                <div className="text-[11px] text-[#8994A3] font-sans mt-1">
                  Isolates external untrusted context from privileged tools and tokens.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/30 transition-all font-mono">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-emerald-400 font-bold">POL-001</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div className="text-xs font-bold text-[#F4F6F8]">SQL Mutation Shield</div>
                <div className="text-[11px] text-[#8994A3] font-sans mt-1">
                  Blocks DROP, ALTER, and compound multi-queries via AST security parser.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/30 transition-all font-mono">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-emerald-400 font-bold">POL-005</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div className="text-xs font-bold text-[#F4F6F8]">Manifest Scope Lock</div>
                <div className="text-[11px] text-[#8994A3] font-sans mt-1">
                  Restricts tool execution strictly to signed agent capability tasks.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/30 transition-all font-mono">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-amber-400 font-bold">POL-003</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                </div>
                <div className="text-xs font-bold text-[#F4F6F8]">Human Escalation Gate</div>
                <div className="text-[11px] text-[#8994A3] font-sans mt-1">
                  Synthesizes dry-run previews for high-impact mutations before approval.
                </div>
              </div>
            </div>
          </div>

          {/* Recent Cognitive Evaluations Feed */}
          <div className="p-4 sm:p-5 rounded-2xl glass-card space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-400" />
                <h3 className="text-xs font-mono font-bold text-[#F4F6F8] uppercase tracking-wider">
                  Recent Cognitive Behavioral Evaluations
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#8994A3]">Continuous Stream</span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3">
                <div className="truncate">
                  <span className="text-violet-300 font-bold">Procurement Bot</span>
                  <span className="text-[#8994A3] mx-1.5">•</span>
                  <span className="text-[#F4F6F8]">Supplier invoice contains hidden credential instruction</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold shrink-0">
                  BLOCKED (Risk 98)
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3">
                <div className="truncate">
                  <span className="text-violet-300 font-bold">Batch Maintenance Worker</span>
                  <span className="text-[#8994A3] mx-1.5">•</span>
                  <span className="text-[#F4F6F8]">Mass row deletion on archived database records (427 rows)</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold shrink-0">
                  ESCALATED (Risk 85)
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3">
                <div className="truncate">
                  <span className="text-violet-300 font-bold">Financial Reporting Agent</span>
                  <span className="text-[#8994A3] mx-1.5">•</span>
                  <span className="text-[#F4F6F8]">Safe read aggregated metrics for quarterly sales reconciliation</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold shrink-0">
                  ALLOWED (Risk 12)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
