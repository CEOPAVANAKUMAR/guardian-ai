import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Database,
  FileCode,
  KeyRound,
  Radio,
  Play,
  Pause,
  RotateCcw,
  X,
  ChevronRight,
  Terminal,
  Lock,
} from 'lucide-react';

/**
 * CinematicIntroModal - 15-Second Executive Briefing Video / Animation
 * 
 * 0–2 sec:  AUTONOMOUS AI IS CHANGING HOW COMPANIES OPERATE
 * 2–5 sec:  AI AGENTS CAN NOW ACCESS: DATABASES • FILES • APIs • CREDENTIALS
 * 5–8 sec:  BUT WHAT HAPPENS WHEN THE AI IS FOOLED?
 * 8–11 sec: AI Agent → Dangerous Action (Prompt Injection / Exfiltration)
 * 11–13 sec: 🛡 GUARDIANAI → DENIED (Deterministic AST & Taint Intercept)
 * 13–15 sec: "THE AI PROPOSES. GUARDIANAI DECIDES."
 */
export default function CinematicIntroModal({ isOpen, onClose, onComplete }) {
  const [seconds, setSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setSeconds(0);
      setIsPlaying(true);
      return;
    }

    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= 15) {
            clearInterval(timerRef.current);
            return 15;
          }
          return parseFloat((prev + 0.1).toFixed(1));
        });
      }, 100);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isOpen, isPlaying]);

  // Handle completion at 15s
  useEffect(() => {
    if (seconds >= 15) {
      const timeout = setTimeout(() => {
        if (onComplete) onComplete();
        else onClose();
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [seconds, onComplete, onClose]);

  if (!isOpen) return null;

  const currentStage =
    seconds < 2.5
      ? 1
      : seconds < 5.5
      ? 2
      : seconds < 8.5
      ? 3
      : seconds < 11.5
      ? 4
      : seconds < 13.5
      ? 5
      : 6;

  const progressPercent = Math.min(100, (seconds / 15) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 selection:bg-emerald-500 selection:text-black">
      {/* Container Frame */}
      <div className="relative w-full max-w-4xl h-[560px] rounded-3xl bg-[#050608] border border-white/[0.12] shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col justify-between">
        
        {/* Subtle Background Radial Aura */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[140px] transition-all duration-1000 ${
              currentStage === 4
                ? 'bg-rose-600/25'
                : currentStage === 5
                ? 'bg-emerald-500/25'
                : currentStage === 6
                ? 'bg-violet-600/30'
                : 'bg-cyan-500/15'
            }`}
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
        </div>

        {/* Top Header Controls */}
        <div className="relative z-10 px-6 pt-5 pb-3 flex items-center justify-between border-b border-white/[0.08] bg-[#0A0D12]/70 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-violet-500/20 border border-violet-500/40 text-violet-300">
              <Shield className="w-4 h-4" />
            </span>
            <div>
              <div className="text-xs font-mono font-bold tracking-widest text-white flex items-center gap-2">
                GUARDIANAI • CINEMATIC MISSION BRIEFING
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  4K SIMULATION
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                NRCM CodeStorm 2K26 Executive Preview
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setSeconds(0)}
              className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white transition-colors"
              title="Replay from start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                if (onComplete) onComplete();
                else onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-slate-200 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
            >
              <span>SKIP TO CONSOLE</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center Dynamic Stage Viewport */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-8 text-center">
          
          {/* Stage 1: 0–2.5s */}
          {currentStage === 1 && (
            <div className="space-y-4 animate-fade-in max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
                <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>PARADIGM SHIFT</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                AUTONOMOUS AI IS CHANGING HOW ENTERPRISES OPERATE
              </h2>
              <p className="text-slate-400 text-sm font-sans max-w-md mx-auto">
                AI agents are no longer just chatbots. They are autonomous actors with execution privileges.
              </p>
            </div>
          )}

          {/* Stage 2: 2.5–5.5s */}
          {currentStage === 2 && (
            <div className="space-y-6 animate-fade-in max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-mono">
                <Terminal className="w-3.5 h-3.5 text-violet-400" />
                <span>EXPANDED ATTACK SURFACE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                AI AGENTS CAN NOW ACCESS CRITICAL INFRASTRUCTURE:
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-cyan-500/30 text-cyan-300 flex flex-col items-center gap-2 shadow-lg">
                  <Database className="w-6 h-6 text-cyan-400" />
                  <span className="font-mono text-xs font-bold">DATABASES</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-emerald-500/30 text-emerald-300 flex flex-col items-center gap-2 shadow-lg">
                  <FileCode className="w-6 h-6 text-emerald-400" />
                  <span className="font-mono text-xs font-bold">FILES & DOCS</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-violet-500/30 text-violet-300 flex flex-col items-center gap-2 shadow-lg">
                  <Radio className="w-6 h-6 text-violet-400" />
                  <span className="font-mono text-xs font-bold">INTERNAL APIs</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-amber-500/30 text-amber-300 flex flex-col items-center gap-2 shadow-lg">
                  <KeyRound className="w-6 h-6 text-amber-400" />
                  <span className="font-mono text-xs font-bold">CREDENTIALS</span>
                </div>
              </div>
            </div>
          )}

          {/* Stage 3: 5.5–8.5s */}
          {currentStage === 3 && (
            <div className="space-y-4 animate-fade-in max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span>THE ZERO-TRUST DILEMMA</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-amber-300 tracking-tight leading-tight">
                BUT WHAT HAPPENS WHEN THE AI IS FOOLED?
              </h2>
              <p className="text-slate-300 text-sm font-sans max-w-md mx-auto">
                Indirect prompt injections inside invoices, tainted web downloads, and hijacked model context bypass traditional perimeter firewalls.
              </p>
            </div>
          )}

          {/* Stage 4: 8.5–11.5s */}
          {currentStage === 4 && (
            <div className="space-y-5 animate-fade-in max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>EXPLOITATION ATTEMPT IN PROGRESS</span>
              </div>
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-left font-mono space-y-2">
                <div className="text-xs text-rose-400 font-bold flex items-center justify-between">
                  <span>MALICIOUS INSTRUCTION TRIGGERED</span>
                  <span>SEVERITY: CRITICAL</span>
                </div>
                <div className="text-sm text-white font-mono bg-black/60 p-2.5 rounded-xl border border-rose-500/30">
                  Agent: <span className="text-cyan-300">ProcurementBot</span> → Action:{' '}
                  <span className="text-rose-400 font-bold">READ_SECRET (fake_secrets.env)</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Tainted provenance detected: <span className="text-amber-300">EXTERNAL_UNTRUSTED</span>
                </div>
              </div>
            </div>
          )}

          {/* Stage 5: 11.5–13.5s */}
          {currentStage === 5 && (
            <div className="space-y-5 animate-fade-in max-w-xl">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-black flex items-center justify-center shadow-[0_0_50px_rgba(24,201,133,0.5)]">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-wider font-mono">
                GUARDIANAI: DENIED
              </h2>
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs font-mono text-emerald-300">
                Deterministic AST Policy POL-004 Enforced • Zero Secret Leakage • Logged to Immutable HMAC Chain
              </div>
            </div>
          )}

          {/* Stage 6: 13.5–15.0s */}
          {currentStage === 6 && (
            <div className="space-y-4 animate-fade-in max-w-xl">
              <div className="text-xs font-mono text-violet-400 tracking-widest uppercase font-bold">
                ENTERPRISE RUNTIME TRUST INFRASTRUCTURE
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none font-mono">
                THE AI PROPOSES.
                <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent mt-2">
                  GUARDIANAI DECIDES.
                </span>
              </h1>
              <div className="pt-2 text-xs font-mono text-slate-400">
                Opening Executive Command Center...
              </div>
            </div>
          )}

        </div>

        {/* Bottom Playback Bar */}
        <div className="relative z-10 px-6 py-4 bg-[#0A0D12]/80 border-t border-white/[0.08] backdrop-blur-md flex flex-col gap-2 font-mono">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
              <span>STAGE {currentStage} OF 6</span>
            </span>
            <span className="text-white font-bold">{seconds.toFixed(1)}s / 15.0s</span>
          </div>

          {/* Progress Track */}
          <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-emerald-400 transition-all duration-100 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
