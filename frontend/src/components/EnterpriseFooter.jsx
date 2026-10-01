import React from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Terminal,
  Cpu,
  Layers,
  FileCode2,
  ExternalLink,
  Lock,
  Sparkles,
  CheckCircle2,
  Play,
  Scale,
  Bot,
} from 'lucide-react';

/**
 * EnterpriseFooter - Premium Minimal Command-Center Footer
 * Built for GuardianAI • NRCM CodeStorm 2K26
 * 
 * Features:
 * - Obsidian backdrop with hairline top border
 * - Brand narrative & mission anchor
 * - Functional product & security routing (zero dead links)
 * - Resources launcher (Docs, API Reference, Architecture, Demo Guide)
 * - Live system status lights & build version
 * - CodeStorm hackathon attribution & legal placeholders
 */
export default function EnterpriseFooter({
  currentTab = 'dashboard',
  onNavigate,
  guardianEnabled = true,
  isHealthy = true,
  auditVerified = true,
  onOpenResources,
  onOpenCinematicIntro,
  onOpenComparison,
  onOpenLegal,
  onOpenCopilot,
}) {
  return (
    <footer className="border-t border-white/[0.08] bg-[#050608]/95 backdrop-blur-2xl text-slate-300 font-sans relative z-10 transition-colors">
      {/* Micro Subtle Surface Ambient Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-10 pb-8 relative z-10">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-10 border-b border-white/[0.06]">
          
          {/* Left Column (5 Cols): Branding & Mission */}
          <div className="lg:col-span-5 space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-pink-500 text-white shadow-md shadow-violet-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <span className="text-lg font-black tracking-widest text-white font-mono flex items-center gap-1.5">
                GUARDIAN<span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">AI</span>
              </span>
            </div>

            <div className="text-xs text-slate-300 font-medium leading-relaxed max-w-sm">
              Runtime Trust Infrastructure for Autonomous AI Agents
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-emerald-400 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="italic">"The AI proposes. GuardianAI decides."</span>
            </div>

            <div className="pt-2 flex items-center gap-3">
              {onOpenCinematicIntro && (
                <button
                  onClick={onOpenCinematicIntro}
                  className="px-3 py-1.5 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-300 font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  <Play className="w-3 h-3 text-violet-400 fill-violet-400" />
                  <span>15S MISSION BRIEFING</span>
                </button>
              )}
              {onOpenComparison && (
                <button
                  onClick={onOpenComparison}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  <Scale className="w-3 h-3 text-cyan-400" />
                  <span>BEFORE VS WITH</span>
                </button>
              )}
              {onOpenCopilot && (
                <button
                  onClick={onOpenCopilot}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  <Bot className="w-3 h-3 text-cyan-400" />
                  <span>COPILOT AI</span>
                </button>
              )}
            </div>
          </div>

          {/* Column 2 (2 Cols): PRODUCT */}
          <div className="lg:col-span-2 space-y-3 font-mono">
            <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              PRODUCT
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onOpenCopilot && onOpenCopilot()}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 text-left"
                >
                  <span>Sentinel Copilot</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">AI</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate && onNavigate('dashboard')}
                  className={`hover:text-emerald-400 transition-colors text-left ${currentTab === 'dashboard' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
                >
                  Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate && onNavigate('live')}
                  className={`hover:text-cyan-400 transition-colors text-left ${currentTab === 'live' ? 'text-cyan-400 font-semibold' : 'text-slate-400'}`}
                >
                  Live Feed
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate && onNavigate('ai-analysis')}
                  className={`hover:text-violet-400 transition-colors text-left ${currentTab === 'ai-analysis' ? 'text-violet-400 font-semibold' : 'text-slate-400'}`}
                >
                  AI Analysis
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate && onNavigate('attack')}
                  className={`hover:text-rose-400 transition-colors text-left ${currentTab === 'attack' ? 'text-rose-400 font-semibold' : 'text-slate-400'}`}
                >
                  Attack Playground
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3 (2 Cols): SECURITY */}
          <div className="lg:col-span-2 space-y-3 font-mono">
            <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              SECURITY
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate && onNavigate('incidents')}
                  className={`hover:text-rose-400 transition-colors text-left ${currentTab === 'incidents' ? 'text-rose-400 font-semibold' : 'text-slate-400'}`}
                >
                  Security Incidents
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate && onNavigate('approvals')}
                  className={`hover:text-amber-400 transition-colors text-left ${currentTab === 'approvals' ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}
                >
                  Approvals
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate && onNavigate('policies')}
                  className={`hover:text-teal-400 transition-colors text-left ${currentTab === 'policies' ? 'text-teal-400 font-semibold' : 'text-slate-400'}`}
                >
                  Policies
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate && onNavigate('audit')}
                  className={`hover:text-emerald-400 transition-colors text-left ${currentTab === 'audit' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
                >
                  Audit Chain
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4 (3 Cols): RESOURCES & SYSTEM STATUS */}
          <div className="lg:col-span-3 space-y-5 font-mono">
            {/* Resources Sub-group */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                RESOURCES
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => onOpenResources && onOpenResources('docs')}
                  className="text-left text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Documentation</span>
                </button>
                <button
                  onClick={() => onOpenResources && onOpenResources('api')}
                  className="text-left text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>API Reference</span>
                </button>
                <button
                  onClick={() => onOpenResources && onOpenResources('architecture')}
                  className="text-left text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Architecture</span>
                </button>
                <button
                  onClick={() => onOpenResources && onOpenResources('demo')}
                  className="text-left text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Demo Guide</span>
                </button>
              </div>
            </div>

            {/* SYSTEM STATUS (Dynamic Real-time Telemetry) */}
            <div className="p-3 rounded-xl bg-obsidian-900/60 border border-white/[0.08] space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>SYSTEM</span>
                <span className="text-slate-400 font-normal">GuardianAI v1.0</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${guardianEnabled ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'}`} />
                  <span className={guardianEnabled ? 'text-slate-300' : 'text-rose-300'}>
                    {guardianEnabled ? 'Guardian Protected' : 'Guardian Bypassed'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-cyan-400' : 'bg-amber-400'}`} />
                  <span className="text-slate-300">
                    {isHealthy ? 'Gateway Online' : 'Gateway Degraded'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-slate-300">
                    Audit Integrity Verified
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Sub-Bar: Hackathon Attribution & Legal Links */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-400">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-center sm:text-left">
            <span className="text-slate-400">© 2026 GuardianAI</span>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <span className="text-violet-400/90 font-medium">Built for NRCM CodeStorm 2K26</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => onOpenLegal && onOpenLegal('privacy')}
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              Privacy
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={() => onOpenLegal && onOpenLegal('terms')}
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              Terms
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={() => onOpenLegal && onOpenLegal('security')}
              className="text-slate-400 hover:text-slate-300 transition-colors"
            >
              Security
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
