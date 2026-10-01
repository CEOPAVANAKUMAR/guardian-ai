import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  Cpu,
  Fingerprint,
  Radio,
  FileCheck2,
  Terminal,
  Zap,
  Server,
  Users,
  Bot,
  Database,
} from 'lucide-react';
import HeroSphere from '../components/visualization/HeroSphere';
import CinematicBackground from '../components/CinematicBackground';
import { requestOtp, verifyOtp } from '../services/api';
import biometricAuthImg from '../assets/biometric_auth.jpg';

export default function Login({ onLoginSuccess, onEnterCommandCenter, isAuthenticated, currentUser }) {
  // Form state
  const [step, setStep] = useState(1); // 1 = Credential entry, 2 = OTP verification
  const [name, setName] = useState('Pavan Kumar Thatigiri');
  const [email, setEmail] = useState('thatigiripavankumar@gmail.com');
  const [password, setPassword] = useState('GuardianAdmin@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // OTP state
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const [isDevMode, setIsDevMode] = useState(false);

  // UI feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [sessionStage, setSessionStage] = useState('IDLE'); // IDLE, ESTABLISHING, VERIFIED
  const [isScanning, setIsScanning] = useState(false);

  const handleBiometricScan = () => {
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 1600);
  };

  // Handle Send OTP
  const handleRequestOtp = async (e) => {
    e?.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid administrator email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await requestOtp(name, email, password);
      setSuccessMsg(res.message || `Verification code sent to ${email}`);
      if (res.dev_otp) {
        setDevOtp(res.dev_otp);
        setOtp(res.dev_otp); // Pre-fill for instant dev testing convenience
        setIsDevMode(true);
      } else {
        setDevOtp(null);
        setIsDevMode(false);
      }
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setSessionStage('ESTABLISHING');
    try {
      const res = await verifyOtp(email, otp.trim(), rememberMe);
      setSessionStage('VERIFIED');
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
      }, 700);
    } catch (err) {
      setSessionStage('IDLE');
      setError(err.message || 'Verification failed. Please recheck your code.');
    } finally {
      setLoading(false);
    }
  };

  const featureCards = [
    {
      num: '01',
      title: 'Runtime Authorization',
      desc: 'Every sensitive AI-agent action is evaluated against deterministic policies before execution.',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      badgeClass: 'bg-emerald-500/15 border-emerald-500/30',
    },
    {
      num: '02',
      title: 'AI Agent Governance',
      desc: 'Strict least privilege enforcement via cryptographically signed task manifests and capability scopes.',
      icon: Cpu,
      color: 'text-violet-400',
      badgeClass: 'bg-violet-500/15 border-violet-500/30',
    },
    {
      num: '03',
      title: 'Prompt Injection Defense',
      desc: 'Untrusted input cannot escalate permissions or bypass strict AST structural invariants.',
      icon: ShieldAlert,
      color: 'text-rose-400',
      badgeClass: 'bg-rose-500/15 border-rose-500/30',
    },
    {
      num: '04',
      title: 'Human-in-the-Loop',
      desc: 'High-risk operations escalate to human review with dry-run safe impact estimation.',
      icon: CheckCircle2,
      color: 'text-amber-400',
      badgeClass: 'bg-amber-500/15 border-amber-500/30',
    },
    {
      num: '05',
      title: 'Tamper-Evident Audit',
      desc: 'Every decision is permanently chained via HMAC-SHA256 immutable ledgers for compliance.',
      icon: Fingerprint,
      color: 'text-fuchsia-400',
      badgeClass: 'bg-fuchsia-500/15 border-fuchsia-500/30',
    },
  ];

  const flowSteps = [
    { label: 'Employee', icon: Users, desc: 'Natural Request', style: 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300' },
    { label: 'AI Agent', icon: Bot, desc: 'Proposes Action', style: 'bg-purple-950/40 border-purple-500/40 text-purple-300' },
    { label: 'GuardianAI', icon: Shield, desc: 'Deterministic Eval', highlight: true, style: 'bg-gradient-to-r from-violet-600/40 via-purple-600/40 to-fuchsia-600/40 border-fuchsia-400 text-white font-bold ring-2 ring-fuchsia-400/40 shadow-lg shadow-fuchsia-500/30' },
    { label: 'Decision', icon: CheckCircle2, desc: 'Allow / Escalate', style: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' },
    { label: 'Systems', icon: Database, desc: 'Protected Resources', style: 'bg-amber-950/40 border-amber-500/40 text-amber-300' },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-transparent text-slate-100 font-sans selection:bg-[#18C985] selection:text-black relative">
      <CinematicBackground variant="login" bgIntensity="vivid" />

      {/* ---------------------------------------------------- */}
      {/* LEFT SIDE: 55% Enterprise Security Narrative         */}
      {/* ---------------------------------------------------- */}
      <div className="lg:w-[55%] w-full p-8 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-[#0A0D12]/40 backdrop-blur-md relative overflow-hidden z-10">

        {/* Header Block */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-pink-500 text-white shadow-lg shadow-violet-500/30">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <div className="text-2xl font-black tracking-widest text-white font-mono flex items-center gap-2">
                GUARDIAN<span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">AI</span>
              </div>
              <div className="text-xs text-fuchsia-400 font-mono tracking-wider uppercase font-semibold">
                Enterprise AI Security Operating System
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight mb-2">
                Runtime Trust Infrastructure
                <span className="block text-slate-300 text-xl lg:text-2xl font-normal mt-1">
                  for Autonomous AI Agents
                </span>
              </h1>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-violet-500/15 via-fuchsia-500/15 to-pink-500/15 border border-fuchsia-500/30 text-fuchsia-300 font-mono text-xs my-3 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-ping" />
                <span className="font-semibold italic">"The AI proposes. GuardianAI decides."</span>
              </div>
            </div>

            <div className="hidden sm:block shrink-0">
              <HeroSphere size={160} interactive={true} />
            </div>
          </div>
        </div>

        {/* Animated Runtime Architecture Flow */}
        <div className="relative z-10 my-6 p-4 rounded-2xl bg-[#0F121C]/90 border border-white/[0.08] shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06] font-mono text-[11px] text-slate-400">
            <span className="flex items-center gap-2 text-fuchsia-400 font-semibold">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              RUNTIME ARCHITECTURE FLOW
            </span>
            <span className="text-emerald-400 font-bold">FAIL-CLOSED PROXY BOUNDARY</span>
          </div>

          <div className="grid grid-cols-5 gap-2 text-center">
            {flowSteps.map((step) => {
              const StepIcon = step.icon;
              return (
                <div
                  key={step.label}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${step.style}`}
                >
                  <StepIcon className="w-4 h-4 mb-1" />
                  <div className="text-[11px] font-bold font-mono tracking-tight">{step.label}</div>
                  <div className="text-[9px] opacity-80 font-mono hidden sm:block">{step.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5 Enterprise Feature Cards */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {featureCards.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.num}
                className={`p-3.5 rounded-xl border backdrop-blur-md transition-all hover:scale-[1.02] shadow-sm ${item.badgeClass}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`font-mono text-xs font-bold ${item.color}`}>{item.num}</span>
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="text-xs font-bold text-white mb-1">{item.title}</div>
                <p className="text-[11px] text-slate-300 leading-snug">{item.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Bottom Engine Status */}
        <div className="relative z-10 pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-emerald-400 font-bold tracking-wider">
              GUARDIAN SECURITY ENGINE ● ONLINE
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-300">
            <span className="text-emerald-300">Protected Runtime</span>
            <span>•</span>
            <span className="text-violet-300">Deterministic Policy</span>
            <span>•</span>
            <span className="text-fuchsia-300">Cryptographic Trust</span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* RIGHT SIDE: 45% Luxury Authentication Card          */}
      {/* ---------------------------------------------------- */}
      <div className="lg:w-[45%] w-full p-8 lg:p-14 flex items-center justify-center bg-[#050608]/20 backdrop-blur-sm relative z-10">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="p-8 rounded-3xl bg-[#0F121C]/90 border border-white/[0.1] shadow-2xl backdrop-blur-2xl relative overflow-hidden">
            {/* Top Accent Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-violet-500" />

            {/* Session Establishing / Verified Animation Overlay */}
            {sessionStage !== 'IDLE' && (
              <div className="absolute inset-0 z-30 bg-[#08090E]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                {sessionStage === 'ESTABLISHING' ? (
                  <>
                    <div className="relative mb-5">
                      <div className="w-16 h-16 rounded-full border-2 border-violet-500/20 border-t-violet-400 animate-spin" />
                      <Lock className="w-6 h-6 text-violet-400 absolute inset-0 m-auto animate-pulse" />
                    </div>
                    <div className="text-sm font-bold font-mono text-violet-300 tracking-wider uppercase animate-pulse">
                      Establishing secure session...
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-2">
                      Generating cryptographic session token & binding capability nonces
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center mb-5 text-emerald-400 glow-emerald animate-bounce">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div className="text-base font-bold font-mono text-emerald-400 tracking-wider uppercase">
                      Identity verified
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-2">
                      Redirecting to GuardianAI Command Center...
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Active Session Notification with Fast Enter Button */}
            {isAuthenticated && onEnterCommandCenter && (
              <div className="mb-5 p-3.5 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-xs font-mono flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <span className="text-cyan-200 font-bold block">ACTIVE SESSION DETECTED</span>
                    <span className="text-[11px] text-[#8994A3]">Signed in as {currentUser?.name || 'Administrator'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onEnterCommandCenter}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center gap-1.5 shadow-md shadow-cyan-500/30 transition-all text-xs active:scale-95"
                >
                  <span>RETURN TO CONSOLE</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-300 font-mono text-[11px] mb-3">
                <Lock className="w-3 h-3" />
                ENTERPRISE OPERATING SYSTEM
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                AUTHENTICATION
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Zero-Trust Administrator Gateway
              </p>
            </div>

            {/* Biometric Hardware Enclave Terminal Screen */}
            <div
              onClick={handleBiometricScan}
              title="Click to authenticate via Biometric Scanner"
              className="relative mb-5 rounded-2xl overflow-hidden border border-cyan-500/40 bg-black/90 shadow-[0_0_30px_rgba(0,242,254,0.18)] cursor-pointer group transition-all"
            >
              <img
                src={biometricAuthImg}
                alt="Biometric Touchscreen Terminal"
                className={`w-full h-44 object-cover object-center filter brightness-95 contrast-110 transition-all duration-700 ${
                  isScanning ? 'scale-105 brightness-110' : 'group-hover:scale-102'
                }`}
              />

              {/* Ambient Cyber Vignette & Depth Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F121C] via-transparent to-black/50 pointer-events-none" />

              {/* Active Laser Scanline Animation */}
              {isScanning && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#00F2FE] animate-pulse top-1/2 -translate-y-1/2 pointer-events-none" />
              )}

              {/* Top HUD Badges */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/80 border border-cyan-500/50 backdrop-blur-md shadow-md">
                <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider">
                  {isScanning ? 'SCANNING BIOMETRIC IMPRINT...' : 'BIOMETRIC HARDWARE ENCLAVE'}
                </span>
              </div>

              <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-lg bg-amber-950/80 border border-amber-500/50 text-[10px] font-mono font-bold text-amber-300 backdrop-blur-md shadow-md">
                GATE 01 • ARMED
              </div>

              {/* Bottom HUD Telemetry Ribbon */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono text-slate-300 bg-black/75 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/[0.1]">
                <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                  <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{step === 2 ? 'DUAL-FACTOR OTP ARMED' : 'TOUCH ID READY'}</span>
                </span>
                <span className="text-slate-400 text-[10px] flex items-center gap-1">
                  <span>TAP TO SCAN</span>
                  <span className="text-cyan-400 font-bold">›</span>
                </span>
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-crimson-950/50 border border-crimson-500/40 text-crimson-200 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-crimson-400 shrink-0 mt-0.5" />
                <div className="leading-snug">{error}</div>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-200 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <div className="leading-snug">{successMsg}</div>
              </div>
            )}

            {/* DEV Fallback Notice */}
            {isDevMode && devOtp && step === 2 && (
              <div className="mb-5 p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs">
                <div className="flex items-center gap-1.5 font-bold font-mono text-amber-400 mb-1">
                  <Terminal className="w-3.5 h-3.5" />
                  [DEV ENVIRONMENT FALLBACK]
                </div>
                <p className="text-[11px] text-slate-300 mb-1.5">
                  SMTP app password not configured in .env. Test verification code generated:
                </p>
                <div className="inline-block px-3 py-1 rounded bg-black/60 border border-amber-500/60 font-mono text-sm tracking-widest text-amber-300 font-black">
                  {devOtp}
                </div>
              </div>
            )}

            {/* Step 1: Credential Form */}
            {step === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Administrator Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Administrator Name"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-obsidian-900/90 border border-white/[0.08] text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Corporate Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@enterprise.corp"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-obsidian-900/90 border border-white/[0.08] text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Security Token / Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-obsidian-900/90 border border-white/[0.08] text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded bg-obsidian-900 border-white/[0.1] text-violet-500 focus:ring-violet-500/20"
                    />
                    <span>Remember credentials</span>
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    256-Bit TLS Protected
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 active:scale-[0.98] text-white font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-violet-500/30 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>REQUEST VERIFICATION OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: OTP Verification Form */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 rounded-xl bg-obsidian-900/60 border border-white/[0.08] text-xs">
                  <div className="text-slate-400">Target Email:</div>
                  <div className="font-mono text-violet-300 font-semibold truncate">{email}</div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    Enter 6-Digit One-Time Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-obsidian-900/90 border border-white/[0.08] text-white text-base tracking-widest text-center font-mono placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 active:scale-[0.98] text-black font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>VERIFY & ENTER SYSTEM</span>
                    </>
                  )}
                </button>

                <div className="pt-2 flex items-center justify-between text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    ← Back to credentials
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    className="text-fuchsia-400 hover:underline"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            )}

            {/* 1-Click Demo Access Button */}
            <div className="mt-5 pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  const demoUser = {
                    name: name || 'Pavan Kumar Thatigiri',
                    email: email || 'thatigiripavankumar@gmail.com',
                    role: 'ADMINISTRATOR',
                    access_level: 'ENTERPRISE_ROOT',
                  };
                  localStorage.setItem('guardian_access_token', 'demo-root-session-2026');
                  localStorage.setItem('guardian_user_info', JSON.stringify(demoUser));
                  localStorage.setItem('guardian_token', 'demo-root-session-2026');
                  localStorage.setItem('guardian_user', JSON.stringify(demoUser));
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('guardian_entered', 'true');
                    sessionStorage.setItem('guardian_access_token', 'demo-root-session-2026');
                  }
                  if (onLoginSuccess) {
                    onLoginSuccess(demoUser);
                  } else if (onEnterCommandCenter) {
                    onEnterCommandCenter();
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-300 hover:text-cyan-200 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>1-CLICK DEMO ACCESS • ENTER CONSOLE AS ADMIN</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
