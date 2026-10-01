import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import AttackPlayground from './pages/AttackPlayground';
import LiveFeed from './pages/LiveFeed';
import Approvals from './pages/Approvals';
import Audit from './pages/Audit';
import Incidents from './pages/Incidents';
import Login from './pages/Login';
import AiAnalysis from './pages/AiAnalysis';
import Investigations from './pages/Investigations';
import Evidence from './pages/Evidence';
import Policies from './pages/Policies';
import Alerts from './pages/Alerts';
import IdentityAttribution from './pages/IdentityAttribution';
import CinematicBackground from './components/CinematicBackground';
import EnterpriseFooter from './components/EnterpriseFooter';
import CinematicIntroModal from './components/CinematicIntroModal';
import BeforeAfterComparisonModal from './components/BeforeAfterComparisonModal';
import ResourcesModal from './components/ResourcesModal';
import LegalModal from './components/LegalModal';
import GuardianCopilotChat from './components/GuardianCopilotChat';
import {
  checkHealth,
  fetchApprovals,
  fetchIncidentStats,
  fetchIncidents,
  getCurrentUser,
  getStoredToken,
  getStoredUser,
  logoutUser,
  toggleGuardian,
} from './services/api';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Flame,
  CheckSquare,
  Fingerprint,
  AlertTriangle,
  Radio,
  Power,
  Bell,
  LogOut,
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ExternalLink,
  ChevronDown,
  Brain,
  Sparkles,
  FileSearch,
  Network,
  Sliders,
  Lock,
  Play,
  Scale,
  UserSearch,
  Bot,
} from 'lucide-react';

export default function App() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getStoredToken()));
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [authChecking, setAuthChecking] = useState(true);

  // Layout & Navigation State (Default to Login screen on fresh session or /login URL)
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/^\//, '');
      const hash = window.location.hash.replace(/^#/, '');
      const target = path || hash;
      if (target === 'login') return 'login';
      if (['dashboard', 'live', 'attack', 'ai-analysis', 'investigations', 'evidence', 'approvals', 'policies', 'incidents', 'alerts', 'audit', 'identity'].includes(target)) {
        return target;
      }
      // If user has not yet entered in this session, show Login screen first as specified in Phase 1
      if (!sessionStorage.getItem('guardian_entered')) {
        return 'login';
      }
    }
    return 'dashboard';
  };

  const [currentTab, setCurrentTab] = useState(getInitialTab);
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // System status
  const [isHealthy, setIsHealthy] = useState(true);
  const [guardianEnabled, setGuardianEnabled] = useState(true);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [openIncidentsCount, setOpenIncidentsCount] = useState(0);

  // Notifications
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [recentIncidentsList, setRecentIncidentsList] = useState([]);
  const [activeToast, setActiveToast] = useState(null);
  const [lastKnownIncidentId, setLastKnownIncidentId] = useState(null);

  // Cinematic Briefing, Architecture Comparison & Technical Hub Modals
  const [cinematicIntroOpen, setCinematicIntroOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [resourcesModalOpen, setResourcesModalOpen] = useState(false);
  const [resourcesInitialTab, setResourcesInitialTab] = useState('docs');
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState('privacy');
  const [bgIntensity, setBgIntensity] = useState('vivid');
  const [copilotOpen, setCopilotOpen] = useState(false);

  // Check auth session on startup
  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      if (token) {
        try {
          const user = await getCurrentUser();
          setCurrentUser(user);
          setIsAuthenticated(true);
        } catch (e) {
          setIsAuthenticated(false);
          setCurrentUser(null);
        }
      } else {
        setIsAuthenticated(false);
      }
      setAuthChecking(false);
    };
    initAuth();
  }, []);

  // System health, stats & notifications polling
  useEffect(() => {
    if (!isAuthenticated) return;

    const poll = async () => {
      try {
        const health = await checkHealth();
        setIsHealthy(true);
        if (health.guardian_enabled !== undefined) {
          setGuardianEnabled(health.guardian_enabled);
        }

        const [apprs, incStats, incList] = await Promise.all([
          fetchApprovals('PENDING'),
          fetchIncidentStats(),
          fetchIncidents({ status: 'ALL' }),
        ]);

        setPendingApprovalsCount(apprs.length);
        setOpenIncidentsCount(incStats.open_incidents);
        setRecentIncidentsList(incList.slice(0, 5));

        // Detect new high or critical incident for toast
        if (incList.length > 0) {
          const newest = incList[0];
          if (
            lastKnownIncidentId &&
            newest.id !== lastKnownIncidentId &&
            ['CRITICAL', 'HIGH'].includes(newest.risk_level?.toUpperCase())
          ) {
            setActiveToast({
              id: newest.id,
              severity: newest.risk_level,
              title: newest.problem_title,
              agent: newest.agent,
              action: newest.action,
            });
          }
          setLastKnownIncidentId(newest.id);
        }
      } catch (e) {
        setIsHealthy(false);
      }
    };

    poll();
    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }, [isAuthenticated, lastKnownIncidentId]);

  // Toggle Guardian ON/OFF
  const handleToggleGuardian = async () => {
    try {
      const res = await toggleGuardian(!guardianEnabled);
      setGuardianEnabled(res.guardian_enabled);
    } catch (e) {
      alert('Failed to toggle Guardian');
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await logoutUser();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentTab('dashboard');
  };

  // Navigate to Incidents with specific incident selected
  const navigateToIncident = (incidentId = null) => {
    setSelectedIncidentId(incidentId);
    setCurrentTab('incidents');
    setNotificationsOpen(false);
    setActiveToast(null);
    setMobileDrawerOpen(false);
  };

  // If explicitly on login tab or not authenticated, render Login Page
  const showLoginScreen = currentTab === 'login' || (!isAuthenticated && !authChecking);

  if (showLoginScreen && !authChecking) {
    return (
      <Login
        isAuthenticated={isAuthenticated}
        currentUser={currentUser}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('guardian_entered', 'true');
            if (window.location.pathname === '/login') {
              window.history.pushState(null, '', '/');
            }
          }
          setCurrentTab('dashboard');
        }}
        onEnterCommandCenter={() => {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('guardian_entered', 'true');
            if (window.location.pathname === '/login') {
              window.history.pushState(null, '', '/');
            }
          }
          setCurrentTab('dashboard');
        }}
      />
    );
  }

  // Navigation Items matching Enterprise AI Security OS specifications
  const navSections = [
    {
      title: 'COMMAND CENTER',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'live', label: 'Live Feed', icon: Activity },
      ],
    },
    {
      title: 'AI INTELLIGENCE',
      items: [
        { id: 'ai-analysis', label: 'AI Analysis', icon: Brain, badge: 'CORE AI' },
        { id: 'investigations', label: 'Investigations', icon: FileSearch },
        { id: 'evidence', label: 'Evidence Graph', icon: Network },
      ],
    },
    {
      title: 'SECURITY CONTROL',
      items: [
        { id: 'attack', label: 'Attack Playground', icon: Flame, badge: 'SIMULATOR', highlight: true },
        { id: 'identity', label: 'Identity Attribution', icon: UserSearch, badge: 'NEW' },
        { id: 'approvals', label: 'Approvals', icon: CheckSquare, count: pendingApprovalsCount },
        { id: 'policies', label: 'Policies', icon: Sliders },
      ],
    },
    {
      title: 'INCIDENT RESPONSE',
      items: [
        { id: 'incidents', label: 'Security Incidents', icon: AlertTriangle, count: openIncidentsCount, alertStyle: true },
        { id: 'alerts', label: 'Alerts', icon: Bell },
      ],
    },
    {
      title: 'COMPLIANCE & ACCESS',
      items: [
        { id: 'audit', label: 'Audit Chain', icon: Fingerprint },
        { id: 'login', label: 'Auth Gateway (Sign-In)', icon: Lock, badge: 'GATEWAY' },
      ],
    },
  ];

  // Page Titles Map
  const pageTitles = {
    dashboard: { title: 'Executive Command Center', desc: 'Real-time security posture, radial threat distribution, and live agent activity' },
    live: { title: 'Agent Activity Timeline', desc: 'Chronological security event monitoring and policy evaluation stream' },
    attack: { title: 'Threat Intelligence & Attack Simulator', desc: 'Simulate prompt injections, poisoned PDF documents, and SQL attacks' },
    'ai-analysis': { title: 'AI Semantic Analysis & Intelligence Engine', desc: 'Multi-stage entity extraction, threat evaluation, and administrative decision engine' },
    investigations: { title: 'Security Investigations & Intelligence Dossiers', desc: 'Case files with chronological timelines and relational evidence' },
    evidence: { title: 'Evidence Graph & Provenance Inspector', desc: 'Interactive node relationships, document taint progression, and AST trees' },
    approvals: { title: 'Executive Approval Queue', desc: 'Human-in-the-loop review for high-risk operations with dry-run preview' },
    policies: { title: 'Deterministic Policy Governance Matrix', desc: 'Fail-closed runtime policies governing agent tool calls, database mutations, and vault credentials' },
    incidents: { title: 'Security Incident Command Center', desc: 'Deterministic classification, problem forensics, potential effects, and solutions' },
    alerts: { title: 'Real-Time Alert Command & Dispatcher', desc: 'Instant notification triage, automated SOC escalation, and direct SMTP alert dispatching' },
    identity: { title: 'Continuous Identity & Insider Misuse Attribution', desc: 'Does the current session still match the claimed identity, and is the data being used for an authorized purpose?' },
    audit: { title: 'Tamper-Evident Cryptographic Audit Chain', desc: 'Cryptographically chained HMAC-SHA256 ledger of every authorization decision' },
  };

  // Dynamic system posture based on incident status and Guardian state
  const systemStatus = !guardianEnabled ? 'CRITICAL' : openIncidentsCount > 0 ? 'WARNING' : 'NORMAL';

  // Purpose-built semantic accent styling per module for the navigation rail
  const moduleNavThemes = {
    dashboard: {
      active: 'border-l-2 border-[#18C985] text-emerald-300 bg-[#18C985]/10 font-bold shadow-[0_0_15px_rgba(24,201,133,0.12)]',
      iconActive: 'text-[#18C985]',
    },
    live: {
      active: 'border-l-2 border-[#40D9FF] text-cyan-300 bg-[#40D9FF]/10 font-bold shadow-[0_0_15px_rgba(64,217,255,0.12)]',
      iconActive: 'text-[#40D9FF]',
    },
    attack: {
      active: 'border-l-2 border-[#FF4D5F] text-rose-300 bg-[#FF4D5F]/10 font-bold shadow-[0_0_15px_rgba(255,77,95,0.12)]',
      iconActive: 'text-[#FF4D5F]',
    },
    'ai-analysis': {
      active: 'border-l-2 border-[#8B6CFF] text-violet-300 bg-[#8B6CFF]/10 font-bold shadow-[0_0_15px_rgba(139,108,255,0.12)]',
      iconActive: 'text-[#8B6CFF]',
    },
    investigations: {
      active: 'border-l-2 border-[#D97706] text-amber-300 bg-[#D97706]/10 font-bold shadow-[0_0_15px_rgba(217,119,6,0.12)]',
      iconActive: 'text-[#D97706]',
    },
    evidence: {
      active: 'border-l-2 border-[#14B8A6] text-teal-300 bg-[#14B8A6]/10 font-bold shadow-[0_0_15px_rgba(20,184,166,0.12)]',
      iconActive: 'text-[#14B8A6]',
    },
    approvals: {
      active: 'border-l-2 border-[#E6A93D] text-amber-300 bg-[#E6A93D]/10 font-bold shadow-[0_0_15px_rgba(230,169,61,0.12)]',
      iconActive: 'text-[#E6A93D]',
    },
    policies: {
      active: 'border-l-2 border-[#38BDF8] text-sky-300 bg-[#38BDF8]/10 font-bold shadow-[0_0_15px_rgba(56,189,248,0.12)]',
      iconActive: 'text-[#38BDF8]',
    },
    incidents: {
      active: 'border-l-2 border-[#FF4D5F] text-rose-300 bg-[#FF4D5F]/10 font-bold shadow-[0_0_15px_rgba(255,77,95,0.12)]',
      iconActive: 'text-[#FF4D5F]',
    },
    alerts: {
      active: 'border-l-2 border-[#F97316] text-orange-300 bg-[#F97316]/10 font-bold shadow-[0_0_15px_rgba(249,115,22,0.12)]',
      iconActive: 'text-[#F97316]',
    },
    audit: {
      active: 'border-l-2 border-[#C8D0DC] text-white bg-white/10 font-bold shadow-[0_0_15px_rgba(200,208,220,0.12)]',
      iconActive: 'text-white',
    },
    login: {
      active: 'border-l-2 border-cyan-400 text-cyan-300 bg-cyan-400/10 font-bold shadow-[0_0_15px_rgba(6,182,212,0.12)]',
      iconActive: 'text-cyan-400',
    },
  };

  const moduleAccentBadges = {
    dashboard: 'text-[#18C985] bg-[#18C985]/10 border-[#18C985]/30',
    live: 'text-[#40D9FF] bg-[#40D9FF]/10 border-[#40D9FF]/30',
    attack: 'text-[#FF4D5F] bg-[#FF4D5F]/10 border-[#FF4D5F]/30',
    'ai-analysis': 'text-[#8B6CFF] bg-[#8B6CFF]/10 border-[#8B6CFF]/30',
    investigations: 'text-[#D97706] bg-[#D97706]/10 border-[#D97706]/30',
    evidence: 'text-[#14B8A6] bg-[#14B8A6]/10 border-[#14B8A6]/30',
    approvals: 'text-[#E6A93D] bg-[#E6A93D]/10 border-[#E6A93D]/30',
    policies: 'text-[#38BDF8] bg-[#38BDF8]/10 border-[#38BDF8]/30',
    incidents: 'text-[#FF4D5F] bg-[#FF4D5F]/10 border-[#FF4D5F]/30',
    alerts: 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/30',
    audit: 'text-[#C8D0DC] bg-white/10 border-white/20',
    login: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  };

  return (
    <div className="min-h-screen flex bg-transparent text-slate-100 font-sans selection:bg-[#18C985] selection:text-black relative">
      {/* Dynamic 5-Layer Cinematic Visual Environment with High-Tech SOC AI Background */}
      <CinematicBackground variant={currentTab} systemStatus={systemStatus} bgIntensity={bgIntensity} />

      {/* ---------------------------------------------------- */}
      {/* LEFT SIDEBAR                                         */}
      {/* ---------------------------------------------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-[#0A0D12]/90 backdrop-blur-2xl border-r border-white/[0.08] flex flex-col justify-between transition-all duration-300 ease-in-out shadow-2xl ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Brand Logo */}
        <div>
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer overflow-hidden"
              onClick={() => {
                setCurrentTab('dashboard');
                setMobileDrawerOpen(false);
              }}
            >
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-500 to-pink-500 text-white shrink-0 shadow-lg shadow-violet-500/30">
                <Shield className="w-5 h-5" />
              </div>
              {!sidebarCollapsed && (
                <div className="truncate">
                  <div className="text-base font-black tracking-wider text-white font-mono flex items-center gap-1.5">
                    GUARDIAN<span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">AI</span>
                  </div>
                  <div className="text-[10px] text-fuchsia-400/90 font-mono tracking-tight truncate uppercase font-semibold">
                    Runtime Trust Infra
                  </div>
                </div>
              )}
            </div>

            {/* Collapse Sidebar Button (Desktop only) */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Close Drawer Button (Mobile only) */}
            <button
              onClick={() => setMobileDrawerOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Sections */}
          <nav className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-210px)]">
            {navSections.map((sec) => {
              const secColors = {
                'COMMAND CENTER': 'text-emerald-400',
                'AI SECURITY': 'text-fuchsia-400',
                'CONTROL': 'text-amber-400',
                'INCIDENT RESPONSE': 'text-rose-400',
                'COMPLIANCE': 'text-indigo-400',
              };
              const titleColor = secColors[sec.title] || 'text-slate-400';

              return (
                <div key={sec.title}>
                  {!sidebarCollapsed && (
                    <div className={`px-3 mb-2 text-[10px] font-mono font-bold tracking-wider ${titleColor} uppercase`}>
                      {sec.title}
                    </div>
                  )}
                  <div className="space-y-1">
                    {sec.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentTab === item.id;
                      const navTheme = moduleNavThemes[item.id] || {
                        active: 'border-l-2 border-emerald-400 text-emerald-300 bg-emerald-500/10 font-bold shadow-[0_0_15px_rgba(24,201,133,0.12)]',
                        iconActive: 'text-emerald-400',
                      };
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setCurrentTab(item.id);
                            setMobileDrawerOpen(false);
                          }}
                          title={sidebarCollapsed ? item.label : undefined}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-mono font-medium transition-all select-none ${
                            isActive
                              ? navTheme.active
                              : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="flex items-center gap-3 truncate">
                            <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? navTheme.iconActive : 'text-slate-400'}`} />
                            {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                          </div>

                          {!sidebarCollapsed && (
                            <div className="flex items-center gap-1.5">
                              {item.badge && (
                                <span className={`text-[9px] px-1.5 py-0.2 rounded border font-bold ${
                                  item.id === 'ai-analysis'
                                    ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                }`}>
                                  {item.badge}
                                </span>
                              )}
                              {item.count > 0 && (
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    item.alertStyle
                                      ? 'bg-rose-500 text-black font-black animate-pulse'
                                      : 'bg-amber-400 text-black font-black'
                                  }`}
                                >
                                  {item.count}
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* SYSTEM STATUS in Sidebar */}
            <div>
              {!sidebarCollapsed && (
                <div className="px-3 mb-2 text-[10px] font-mono font-bold tracking-wider text-teal-400 uppercase">
                  SYSTEM
                </div>
              )}
              <div className="p-2.5 rounded-xl bg-obsidian-card/80 border border-white/[0.06] font-mono text-[11px] space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        isHealthy ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'
                      }`}
                    />
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        isHealthy ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                  </span>
                  {!sidebarCollapsed && (
                    <span className="text-slate-300 truncate">
                      {isHealthy ? 'Gateway Connected' : 'Offline'}
                    </span>
                  )}
                </div>

                {!sidebarCollapsed && (
                  <div className="text-[10px] text-slate-400 truncate flex items-center justify-between">
                    <span>Guardian:</span>
                    <span className={guardianEnabled ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {guardianEnabled ? 'Protected' : 'Bypassed'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </nav>
        </div>

        {/* Sidebar Bottom: User Identity & Logout */}
        <div className="p-3 border-t border-white/[0.06] bg-obsidian-deep/80">
          {!sidebarCollapsed ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 px-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 text-white flex items-center justify-center font-bold text-xs shadow-md">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="truncate flex-1">
                  <div className="text-xs font-bold text-slate-200 truncate">
                    {currentUser?.name || 'Administrator'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">
                    {currentUser?.email || 'thatigiripavankumar@gmail.com'}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-rose-950/40 hover:text-rose-300 text-slate-400 border border-white/[0.08] font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-500 text-white flex items-center justify-center font-bold text-xs shadow-md"
                title={currentUser?.name}
              >
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-white/[0.08] transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Backdrop for Mobile Drawer */}
      {mobileDrawerOpen && (
        <div
          onClick={() => setMobileDrawerOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* MAIN CONTENT AREA WITH COMPACT TOP HEADER            */}
      {/* ---------------------------------------------------- */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 relative z-10 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Minimal Floating Enterprise TOP HEADER */}
        <header className="sticky top-0 z-20 backdrop-blur-2xl bg-[#0A0D12]/80 border-b border-white/[0.08] px-4 lg:px-8 py-3 shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Mobile hamburger & Page Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileDrawerOpen(true)}
                className="lg:hidden p-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-slate-300 hover:text-white"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider font-bold ${moduleAccentBadges[currentTab] || 'text-slate-300'}`}>
                    MODULE
                  </span>
                  <span className="text-slate-600 font-mono text-xs">•</span>
                  <h1 className="text-sm font-bold text-white tracking-tight font-mono">
                    {pageTitles[currentTab]?.title || 'GuardianAI'}
                  </h1>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block font-sans mt-0.5">
                  {pageTitles[currentTab]?.desc}
                </p>
              </div>
            </div>

            {/* Right: Controls & Enterprise Telemetry (Requirement #7 & #8) */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Secondary System Telemetry (Subtle) */}
              <div className="hidden xl:flex items-center gap-2 text-[11px] font-mono text-[#8994A3] bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 rounded-lg">
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  <span className="text-[#B5BEC9]">1.4ms</span>
                </span>
                <span className="text-white/20">•</span>
                <span className="text-[#B5BEC9]">{isHealthy ? 'ONLINE' : 'OFFLINE'}</span>
              </div>

              {/* Primary Security Status: Threat Level */}
              <div className="hidden sm:flex items-center">
                <span className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                  openIncidentsCount > 0
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}>
                  <span className="text-[#8994A3]">THREAT:</span>
                  <span className="font-bold">{openIncidentsCount > 0 ? 'ELEVATED' : 'LOW'}</span>
                </span>
              </div>

              {/* Guardian Sentinel AI Copilot Launcher */}
              <button
                onClick={() => setCopilotOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-fuchsia-500/20 hover:from-cyan-500/30 hover:to-fuchsia-500/30 text-cyan-300 hover:text-white border border-cyan-500/40 font-mono text-xs font-bold transition-all shadow-sm active:scale-95"
                title="Launch Guardian Sentinel AI Security Copilot"
              >
                <Bot className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>SENTINEL AI</span>
              </button>

              {/* 15s Cinematic Mission Briefing Trigger */}
              <button
                onClick={() => setCinematicIntroOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 hover:from-violet-600/40 hover:to-fuchsia-600/40 text-violet-300 hover:text-white border border-violet-500/40 font-mono text-xs font-bold transition-all shadow-sm active:scale-95"
                title="Launch 15-Second Cinematic Mission Briefing"
              >
                <Play className="w-3 h-3 text-violet-400 fill-violet-400" />
                <span>15S BRIEFING</span>
              </button>

              {/* Before vs With Comparison Trigger */}
              <button
                onClick={() => setComparisonOpen(true)}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-white border border-cyan-500/30 font-mono text-xs font-bold transition-all shadow-sm active:scale-95"
                title="View Side-by-Side Execution: Without vs With GuardianAI"
              >
                <Scale className="w-3 h-3 text-cyan-400" />
                <span>BEFORE VS WITH</span>
              </button>

              {/* Ambient SOC AI Background Intensity Control */}
              <button
                onClick={() => setBgIntensity((prev) => (prev === 'vivid' ? 'subtle' : 'vivid'))}
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.1] font-mono text-[11px] transition-all shadow-sm active:scale-95"
                title="Toggle Ambient SOC AI Background Intensity (Vivid / Subtle)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[#8994A3]">BG:</span>
                <span className="font-bold text-cyan-300">{bgIntensity.toUpperCase()}</span>
              </button>

              {/* Primary Security Status: Guardian ON/OFF Toggle */}
              <button
                onClick={handleToggleGuardian}
                className={`px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 ${
                  guardianEnabled
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 ring-2 ring-rose-500/40 animate-pulse'
                }`}
                title="Toggle runtime authorization gateway enforcement"
              >
                <Power className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">GUARDIAN:</span>
                <span>{guardianEnabled ? 'PROTECTED' : 'BYPASSED'}</span>
              </button>

              {/* Notifications Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#B5BEC9] hover:text-white relative transition-colors"
                  title="Security Incident Alerts"
                >
                  <Bell className="w-4 h-4" />
                  {openIncidentsCount > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono text-[9px] font-black animate-pulse shadow-md shadow-rose-500/50">
                      {openIncidentsCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Drawer */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0D111A] border border-white/[0.12] shadow-2xl p-4 z-50 space-y-3 font-mono">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        Security Incidents ({openIncidentsCount} open)
                      </div>
                      <button
                        onClick={() => navigateToIncident()}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300"
                      >
                        View all
                      </button>
                    </div>

                    {recentIncidentsList.length === 0 ? (
                      <div className="py-6 text-center text-xs text-[#8994A3]">
                        No security incidents recorded.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {recentIncidentsList.map((inc) => (
                          <div
                            key={inc.id}
                            onClick={() => navigateToIncident(inc.id)}
                            className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.15] cursor-pointer transition-colors text-xs"
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  inc.risk_level === 'CRITICAL'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                {inc.risk_level}
                              </span>
                              <span className="text-[10px] text-[#8994A3]">{inc.id}</span>
                            </div>
                            <div className="font-bold text-[#F4F6F8] truncate">{inc.problem_title}</div>
                            <div className="text-[11px] text-[#B5BEC9] truncate mt-0.5">
                              {inc.agent} → {inc.action}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Auth Gateway Button */}
              <button
                onClick={() => setCurrentTab('login')}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all shadow-sm active:scale-95"
                title="Open Zero-Trust Hardware Enclave & Sign-In Screen"
              >
                <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                <span>Auth Gateway</span>
              </button>

              {/* User Avatar Chip */}
              <div className="hidden sm:flex items-center gap-2 pl-1 border-l border-white/[0.08]">
                <div
                  className="w-7 h-7 rounded-lg bg-white/[0.08] border border-white/[0.1] text-white flex items-center justify-center font-bold text-xs"
                  title={currentUser?.name || 'Administrator'}
                >
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ---------------------------------------------------- */}
        {/* TOAST WARNING NOTIFICATION (Phase 9)                 */}
        {/* ---------------------------------------------------- */}
        {activeToast && (
          <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-950 border border-rose-500/60 rounded-2xl shadow-2xl p-4.5 glow-rose animate-bounce duration-500 font-mono">
            <div className="flex items-start justify-between gap-3">
              <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-black text-rose-400 tracking-wider uppercase mb-1">
                  CRITICAL SECURITY INCIDENT
                </div>
                <div className="text-sm font-bold text-white mb-1">{activeToast.title}</div>
                <div className="text-xs text-slate-300 font-sans mb-3">
                  <span className="font-mono text-cyan-300 font-semibold">{activeToast.agent}</span> attempted{' '}
                  <span className="font-mono text-amber-300 font-semibold">{activeToast.action}</span>. GuardianAI
                  blocked execution.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateToIncident(activeToast.id)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-black text-xs font-bold tracking-wider uppercase flex items-center gap-1 shadow-md shadow-rose-500/20 transition-all"
                  >
                    <span>VIEW INCIDENT</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setActiveToast(null)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <button
                onClick={() => setActiveToast(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* MAIN BODY VIEWPORT                                   */}
        {/* ---------------------------------------------------- */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-3.5 relative z-10">
          {currentTab === 'ai-analysis' && (
            <AiAnalysis
              onNavigateToIncidents={(id) => navigateToIncident(id)}
              onNavigateToInvestigation={() => setCurrentTab('investigations')}
            />
          )}
          {currentTab === 'investigations' && (
            <Investigations
              onNavigateToIncidents={(id) => navigateToIncident(id)}
            />
          )}
          {currentTab === 'evidence' && (
            <Evidence />
          )}
          {currentTab === 'dashboard' && (
            <Dashboard
              onNavigateToIncidents={(id) => navigateToIncident(id)}
              onToggleGuardian={handleToggleGuardian}
              guardianEnabled={guardianEnabled}
              onNavigateToLogin={() => setCurrentTab('login')}
            />
          )}
          {currentTab === 'identity' && (
            <IdentityAttribution
              onNavigateToIncident={(id) => navigateToIncident(id)}
              onNavigateToAudit={() => setCurrentTab('audit')}
            />
          )}
          {currentTab === 'attack' && (
            <AttackPlayground
              onNavigateToIdentity={() => setCurrentTab('identity')}
              onNavigateToIncidents={(id) => navigateToIncident(id)}
              guardianEnabled={guardianEnabled}
              onToggleGuardian={handleToggleGuardian}
            />
          )}
          {currentTab === 'live' && (
            <LiveFeed onNavigateToIncidents={(id) => navigateToIncident(id)} />
          )}
          {currentTab === 'approvals' && (
            <Approvals onNavigateToIncidents={(id) => navigateToIncident(id)} />
          )}
          {currentTab === 'audit' && (
            <Audit onNavigateToIncidents={(id) => navigateToIncident(id)} />
          )}
          {currentTab === 'policies' && (
            <Policies />
          )}
          {currentTab === 'alerts' && (
            <Alerts onNavigateToIncident={(id) => navigateToIncident(id)} />
          )}
          {currentTab === 'incidents' && (
            <Incidents
              selectedIncidentId={selectedIncidentId}
              onClearSelectedId={() => setSelectedIncidentId(null)}
            />
          )}
        </main>

        {/* Premium Minimal Enterprise Footer */}
        <EnterpriseFooter
          currentTab={currentTab}
          onNavigate={(tab) => setCurrentTab(tab)}
          guardianEnabled={guardianEnabled}
          isHealthy={isHealthy}
          auditVerified={true}
          onOpenResources={(tab) => {
            setResourcesInitialTab(tab);
            setResourcesModalOpen(true);
          }}
          onOpenCinematicIntro={() => setCinematicIntroOpen(true)}
          onOpenComparison={() => setComparisonOpen(true)}
          onOpenLegal={(type) => {
            setLegalModalType(type);
            setLegalModalOpen(true);
          }}
          onOpenCopilot={() => setCopilotOpen(true)}
        />
      </div>

      {/* Floating Sentinel AI Copilot Trigger */}
      {!copilotOpen && (
        <button
          onClick={() => setCopilotOpen(true)}
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#0D121F]/90 hover:bg-[#131A2B] border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95"
          title="Open Guardian Sentinel AI Copilot"
        >
          <div className="relative">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center text-white shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div className="text-left font-mono">
            <div className="text-[11px] font-bold text-white flex items-center gap-1.5 leading-none">
              <span>COPILOT AI</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-semibold uppercase">ONLINE</span>
            </div>
            <div className="text-[9px] text-slate-400 mt-0.5 leading-none">AST Security Analyst</div>
          </div>
        </button>
      )}

      {/* Sentinel AI Copilot Chat Modal / Drawer */}
      <GuardianCopilotChat
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        currentTab={currentTab}
        onNavigate={(tab) => setCurrentTab(tab)}
        onOpenIntro={() => setCinematicIntroOpen(true)}
        onOpenComparison={() => setComparisonOpen(true)}
      />

      {/* 15-Second Cinematic Mission Briefing Modal */}
      <CinematicIntroModal
        isOpen={cinematicIntroOpen}
        onClose={() => setCinematicIntroOpen(false)}
        onComplete={() => {
          setCinematicIntroOpen(false);
          setCurrentTab('dashboard');
        }}
      />

      {/* Before vs With GuardianAI Split-Screen Comparison Modal */}
      <BeforeAfterComparisonModal
        isOpen={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
      />

      {/* Resources & Documentation Modal (Ensures 0 Dead Links) */}
      <ResourcesModal
        isOpen={resourcesModalOpen}
        initialTab={resourcesInitialTab}
        onClose={() => setResourcesModalOpen(false)}
      />

      {/* Legal & Governance Policy Modal */}
      <LegalModal
        isOpen={legalModalOpen}
        type={legalModalType}
        onClose={() => setLegalModalOpen(false)}
      />
    </div>
  );
}
