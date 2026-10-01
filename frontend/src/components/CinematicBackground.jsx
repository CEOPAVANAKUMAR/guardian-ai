import React, { useMemo } from 'react';
import guardianSocBg from '../assets/guardian_soc_bg.jpg';

/**
 * CinematicBackground - 5-Layer Enterprise Visual Environment System
 * 
 * Embeds high-tech SOC AI Command Center background artwork across all GuardianAI pages
 * with module-specific ambient gradients and technical vector overlays.
 */
export default function CinematicBackground({
  variant = 'dashboard',
  systemStatus = 'NORMAL', // NORMAL, WARNING, CRITICAL
  activeStage = 0,
  bgIntensity = 'vivid', // vivid (0.42), subtle (0.22)
}) {
  // Normalize variant aliases
  const activeVariant = useMemo(() => {
    if (variant === 'ai-analysis') return 'analysis';
    if (variant === 'investigations') return 'investigation';
    if (variant === 'approvals') return 'approval';
    return variant;
  }, [variant]);

  // Render technical SVG pattern according to the module variant
  const renderPattern = useMemo(() => {
    switch (activeVariant) {
      case 'login':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.14]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="login-core" cx="35%" cy="40%" r="50%">
                <stop offset="0%" stopColor="#8B6CFF" stopOpacity="0.4" />
                <stop offset="40%" stopColor="#18C985" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#050608" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="35%" cy="40%" r="180" fill="url(#login-core)" />
            {/* Concentric Security Rings */}
            <circle cx="35%" cy="40%" r="120" stroke="#C8D0DC" strokeWidth="1" strokeDasharray="3 6" fill="none" />
            <circle cx="35%" cy="40%" r="220" stroke="#8B6CFF" strokeWidth="1" strokeOpacity="0.3" fill="none" />
            <circle cx="35%" cy="40%" r="320" stroke="#C8D0DC" strokeWidth="0.8" strokeDasharray="8 8" fill="none" />
            <circle cx="35%" cy="40%" r="440" stroke="#18C985" strokeWidth="0.6" strokeOpacity="0.2" fill="none" />
            {/* Architectural Flow Vector Guides */}
            <path d="M 100,480 Q 300,420 500,430 T 900,460" stroke="#8B6CFF" strokeWidth="1.2" strokeOpacity="0.35" fill="none" />
            <path d="M 120,490 Q 320,440 520,445 T 920,475" stroke="#18C985" strokeWidth="0.8" strokeOpacity="0.25" fill="none" />
          </svg>
        );

      case 'dashboard':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.16]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="orbit-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#18C985" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#8B6CFF" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#C8D0DC" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            {/* Subtle Central Orbital Rings */}
            <ellipse cx="50%" cy="32%" rx="380" ry="160" stroke="url(#orbit-grad)" strokeWidth="1" fill="none" />
            <ellipse cx="50%" cy="32%" rx="520" ry="220" stroke="#C8D0DC" strokeWidth="0.8" strokeDasharray="4 8" fill="none" />
            <ellipse cx="50%" cy="32%" rx="680" ry="290" stroke="#18C985" strokeWidth="0.6" strokeOpacity="0.25" fill="none" />
            {/* Orbiting Telemetry Coordinate Markers */}
            <circle cx="28%" cy="26%" r="3" fill="#18C985" opacity="0.6" />
            <circle cx="72%" cy="38%" r="2.5" fill="#E6A93D" opacity="0.5" />
            <circle cx="58%" cy="18%" r="2" fill="#8B6CFF" opacity="0.6" />
          </svg>
        );

      case 'live':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.14]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="telemetry-grid" width="80" height="80" patternUnits="userSpaceOnUse">
                <line x1="0" y1="40" x2="80" y2="40" stroke="#C8D0DC" strokeWidth="0.5" strokeOpacity="0.12" />
                <line x1="40" y1="0" x2="40" y2="80" stroke="#C8D0DC" strokeWidth="0.5" strokeOpacity="0.12" />
                <circle cx="40" cy="40" r="1" fill="#40D9FF" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#telemetry-grid)" />
            {/* Moving Telemetry Ray Guides */}
            <line x1="10%" y1="0" x2="10%" y2="100%" stroke="#18C985" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="12 24" />
            <line x1="90%" y1="0" x2="90%" y2="100%" stroke="#8B6CFF" strokeWidth="1" strokeOpacity="0.18" strokeDasharray="16 32" />
          </svg>
        );

      case 'analysis':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.18]" xmlns="http://www.w3.org/2000/svg">
            {/* Neural Constellation Lattice */}
            <g stroke="#8B6CFF" strokeWidth="0.8" strokeOpacity="0.25">
              <line x1="22%" y1="18%" x2="38%" y2="28%" />
              <line x1="38%" y1="28%" x2="52%" y2="22%" />
              <line x1="52%" y1="22%" x2="68%" y2="34%" />
              <line x1="68%" y1="34%" x2="82%" y2="24%" />
              <line x1="38%" y1="28%" x2="44%" y2="52%" />
              <line x1="52%" y1="22%" x2="58%" y2="48%" />
              <line x1="68%" y1="34%" x2="64%" y2="56%" />
            </g>
            {/* Synaptic Nodes */}
            <circle cx="22%" cy="18%" r="3.5" fill="#8B6CFF" opacity="0.6" />
            <circle cx="38%" cy="28%" r="4" fill="#D946EF" opacity="0.7" />
            <circle cx="52%" cy="22%" r="4.5" fill="#8B6CFF" opacity="0.8" />
            <circle cx="68%" cy="34%" r="4" fill="#18C985" opacity="0.7" />
            <circle cx="82%" cy="24%" r="3.5" fill="#40D9FF" opacity="0.6" />
            <circle cx="44%" cy="52%" r="3" fill="#8B6CFF" opacity="0.5" />
            <circle cx="58%" cy="48%" r="3.5" fill="#E6A93D" opacity="0.6" />
            <circle cx="64%" cy="56%" r="3" fill="#FF4D5F" opacity="0.5" />
          </svg>
        );

      case 'investigation':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.14]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="forensic-grid" width="120" height="120" patternUnits="userSpaceOnUse">
                <rect width="120" height="120" fill="none" stroke="#D97706" strokeWidth="0.5" strokeOpacity="0.12" />
                <path d="M 0,0 L 10,0 M 0,0 L 0,10" stroke="#F5A623" strokeWidth="1" strokeOpacity="0.3" />
                <text x="8" y="18" fill="#D97706" fontSize="8" fontFamily="monospace" opacity="0.4">LOC-SEC</text>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#forensic-grid)" />
            {/* Timeline Coordinate Axis */}
            <line x1="8%" y1="12%" x2="8%" y2="88%" stroke="#D97706" strokeWidth="1.2" strokeOpacity="0.25" />
            <line x1="6%" y1="30%" x2="10%" y2="30%" stroke="#E6A93D" strokeWidth="1" opacity="0.4" />
            <line x1="6%" y1="50%" x2="10%" y2="50%" stroke="#E6A93D" strokeWidth="1" opacity="0.4" />
            <line x1="6%" y1="70%" x2="10%" y2="70%" stroke="#E6A93D" strokeWidth="1" opacity="0.4" />
          </svg>
        );

      case 'evidence':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
            {/* Relational Web Radii */}
            <circle cx="50%" cy="45%" r="160" stroke="#8B6CFF" strokeWidth="0.8" strokeOpacity="0.25" fill="none" />
            <circle cx="50%" cy="45%" r="280" stroke="#C8D0DC" strokeWidth="0.6" strokeDasharray="6 6" fill="none" opacity="0.2" />
            <circle cx="50%" cy="45%" r="420" stroke="#18C985" strokeWidth="0.5" strokeOpacity="0.15" fill="none" />
            {/* Cross Hairs */}
            <line x1="50%" y1="10%" x2="50%" y2="80%" stroke="#C8D0DC" strokeWidth="0.5" strokeOpacity="0.15" strokeDasharray="4 6" />
            <line x1="15%" y1="45%" x2="85%" y2="45%" stroke="#C8D0DC" strokeWidth="0.5" strokeOpacity="0.15" strokeDasharray="4 6" />
          </svg>
        );

      case 'attack':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.16]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="attack-lattice" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 30,0 L 60,30 L 30,60 L 0,30 Z" fill="none" stroke="#FF4D5F" strokeWidth="0.5" strokeOpacity="0.12" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#attack-lattice)" />
            {/* Interception Barrier Vector */}
            <line x1="42%" y1="0" x2="42%" y2="100%" stroke="#FF4D5F" strokeWidth="1.2" strokeOpacity="0.25" strokeDasharray="8 4" />
          </svg>
        );

      case 'approval':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.16]" xmlns="http://www.w3.org/2000/svg">
            {/* Authorization Concentric Radii */}
            <circle cx="50%" cy="38%" r="140" stroke="#E6A93D" strokeWidth="1.2" strokeOpacity="0.3" fill="none" />
            <circle cx="50%" cy="38%" r="240" stroke="#E6A93D" strokeWidth="0.8" strokeDasharray="4 8" fill="none" opacity="0.25" />
            <circle cx="50%" cy="38%" r="360" stroke="#C8D0DC" strokeWidth="0.6" strokeDasharray="6 12" fill="none" opacity="0.18" />
            {/* High-Risk Decision Meridian */}
            <line x1="50%" y1="12%" x2="50%" y2="64%" stroke="#E6A93D" strokeWidth="1" strokeOpacity="0.25" strokeDasharray="4 4" />
          </svg>
        );

      case 'policies':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.13]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="policy-lattice" width="70" height="70" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="70" y2="70" stroke="#14B8A6" strokeWidth="0.4" strokeOpacity="0.15" />
                <line x1="70" y1="0" x2="0" y2="70" stroke="#14B8A6" strokeWidth="0.4" strokeOpacity="0.15" />
                <rect x="0" y="0" width="70" height="70" fill="none" stroke="#C8D0DC" strokeWidth="0.4" strokeOpacity="0.1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#policy-lattice)" />
          </svg>
        );

      case 'incidents':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
            {/* Topographic Threat Elevation Contours */}
            <path d="M 50,150 Q 300,80 600,160 T 1150,140" stroke="#991B1B" strokeWidth="1.2" strokeOpacity="0.3" fill="none" />
            <path d="M 80,240 Q 350,180 700,260 T 1200,220" stroke="#FF4D5F" strokeWidth="1" strokeOpacity="0.25" fill="none" />
            <path d="M 40,340 Q 320,290 680,360 T 1180,310" stroke="#E6A93D" strokeWidth="0.8" strokeOpacity="0.2" fill="none" />
            <circle cx="75%" cy="30%" r="90" stroke="#FF4D5F" strokeWidth="0.8" strokeOpacity="0.25" fill="none" strokeDasharray="3 5" />
          </svg>
        );

      case 'alerts':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
            {/* Early Warning Signal Ripples */}
            <circle cx="85%" cy="20%" r="50" stroke="#FF4D5F" strokeWidth="1" strokeOpacity="0.3" fill="none" />
            <circle cx="85%" cy="20%" r="100" stroke="#E6A93D" strokeWidth="0.8" strokeOpacity="0.25" fill="none" />
            <circle cx="85%" cy="20%" r="160" stroke="#C8D0DC" strokeWidth="0.6" strokeDasharray="4 6" fill="none" opacity="0.2" />
            <circle cx="85%" cy="20%" r="240" stroke="#40D9FF" strokeWidth="0.5" strokeOpacity="0.15" fill="none" />
          </svg>
        );

      case 'audit':
        return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="ledger-blocks" width="100" height="90" patternUnits="userSpaceOnUse">
                <rect x="15" y="15" width="70" height="40" rx="4" fill="none" stroke="#18C985" strokeWidth="0.7" strokeOpacity="0.25" />
                <line x1="50" y1="55" x2="50" y2="90" stroke="#C8D0DC" strokeWidth="0.6" strokeOpacity="0.2" strokeDasharray="2 3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ledger-blocks)" />
          </svg>
        );

      default:
        return null;
    }
  }, [activeVariant]);

  // Page-specific Layer 2 Ambient Lighting / Gradient Source
  const ambientGradients = useMemo(() => {
    switch (activeVariant) {
      case 'login':
        return (
          <>
            <div className="absolute top-[20%] left-[25%] w-[550px] h-[550px] bg-gradient-to-br from-[#8B6CFF]/15 via-[#18C985]/8 to-transparent rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[10%] right-[15%] w-[450px] h-[450px] bg-gradient-to-tl from-[#18C985]/10 via-[#40D9FF]/5 to-transparent rounded-full blur-[100px] pointer-events-none" />
          </>
        );

      case 'dashboard':
        return (
          <>
            {/* Main Center Posture Aura */}
            <div className={`absolute top-[10%] left-[50%] -translate-x-1/2 w-[700px] h-[450px] rounded-full blur-[130px] pointer-events-none transition-colors duration-700 ${
              systemStatus === 'CRITICAL'
                ? 'bg-gradient-to-b from-[#FF4D5F]/20 via-[#991B1B]/10 to-transparent'
                : systemStatus === 'WARNING'
                ? 'bg-gradient-to-b from-[#E6A93D]/18 via-[#D97706]/10 to-transparent'
                : 'bg-gradient-to-b from-[#18C985]/16 via-[#14B8A6]/8 to-transparent'
            }`} />
            {/* Top-Right Secondary Telemetry Glow */}
            <div className="absolute top-0 right-0 w-[420px] h-[420px] bg-gradient-to-bl from-[#8B6CFF]/10 to-transparent rounded-full blur-[110px] pointer-events-none" />
          </>
        );

      case 'live':
        return (
          <>
            <div className="absolute top-[15%] left-[10%] w-[500px] h-[500px] bg-gradient-to-br from-[#40D9FF]/12 via-[#18C985]/8 to-transparent rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[20%] right-[10%] w-[450px] h-[450px] bg-gradient-to-tl from-[#8B6CFF]/10 via-[#40D9FF]/6 to-transparent rounded-full blur-[110px] pointer-events-none" />
          </>
        );

      case 'analysis':
        return (
          <>
            <div className="absolute top-[12%] left-[30%] w-[600px] h-[600px] bg-gradient-to-br from-[#8B6CFF]/20 via-[#D946EF]/10 to-transparent rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[10%] right-[20%] w-[450px] h-[450px] bg-gradient-to-tl from-[#6366F1]/12 via-[#8B6CFF]/8 to-transparent rounded-full blur-[110px] pointer-events-none" />
          </>
        );

      case 'investigation':
        return (
          <>
            <div className="absolute top-[18%] left-[20%] w-[550px] h-[550px] bg-gradient-to-br from-[#D97706]/15 via-[#92400E]/10 to-transparent rounded-full blur-[130px] pointer-events-none" />
            <div className="absolute bottom-[15%] right-[25%] w-[450px] h-[450px] bg-gradient-to-tl from-[#78350F]/15 via-[#F5A623]/8 to-transparent rounded-full blur-[110px] pointer-events-none" />
          </>
        );

      case 'evidence':
        return (
          <>
            <div className="absolute top-[25%] left-[50%] -translate-x-1/2 w-[650px] h-[650px] bg-gradient-to-br from-[#8B6CFF]/14 via-[#18C985]/8 to-transparent rounded-full blur-[140px] pointer-events-none" />
          </>
        );

      case 'attack':
        return (
          <>
            <div className="absolute top-[15%] left-[15%] w-[550px] h-[550px] bg-gradient-to-br from-[#FF4D5F]/18 via-[#991B1B]/12 to-transparent rounded-full blur-[130px] pointer-events-none" />
            <div className="absolute bottom-[15%] right-[10%] w-[500px] h-[500px] bg-gradient-to-tl from-[#8B6CFF]/12 via-[#E6A93D]/8 to-transparent rounded-full blur-[120px] pointer-events-none" />
          </>
        );

      case 'approval':
        return (
          <>
            <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[620px] h-[500px] bg-gradient-to-b from-[#E6A93D]/18 via-[#D97706]/10 to-transparent rounded-full blur-[130px] pointer-events-none" />
            <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-gradient-to-tl from-[#C8D0DC]/8 to-transparent rounded-full blur-[100px] pointer-events-none" />
          </>
        );

      case 'policies':
        return (
          <>
            <div className="absolute top-[15%] left-[20%] w-[520px] h-[520px] bg-gradient-to-br from-[#14B8A6]/14 via-[#8B6CFF]/8 to-transparent rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[20%] right-[20%] w-[480px] h-[480px] bg-gradient-to-tl from-[#0D9488]/12 via-[#C8D0DC]/5 to-transparent rounded-full blur-[110px] pointer-events-none" />
          </>
        );

      case 'incidents':
        return (
          <>
            <div className="absolute top-[10%] right-[20%] w-[550px] h-[550px] bg-gradient-to-br from-[#991B1B]/18 via-[#FF4D5F]/10 to-transparent rounded-full blur-[130px] pointer-events-none" />
            <div className="absolute bottom-[15%] left-[15%] w-[480px] h-[480px] bg-gradient-to-tl from-[#78350F]/12 via-[#E6A93D]/8 to-transparent rounded-full blur-[110px] pointer-events-none" />
          </>
        );

      case 'alerts':
        return (
          <>
            <div className="absolute top-[8%] right-[10%] w-[500px] h-[500px] bg-gradient-to-bl from-[#FF4D5F]/16 via-[#E6A93D]/10 to-transparent rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[20%] left-[20%] w-[420px] h-[420px] bg-gradient-to-tr from-[#40D9FF]/8 to-transparent rounded-full blur-[100px] pointer-events-none" />
          </>
        );

      case 'audit':
        return (
          <>
            <div className="absolute top-[15%] left-[30%] w-[600px] h-[600px] bg-gradient-to-br from-[#18C985]/14 via-[#14B8A6]/8 to-transparent rounded-full blur-[130px] pointer-events-none" />
            <div className="absolute bottom-[15%] right-[15%] w-[450px] h-[450px] bg-gradient-to-tl from-[#C8D0DC]/10 via-[#18C985]/5 to-transparent rounded-full blur-[110px] pointer-events-none" />
          </>
        );

      default:
        return null;
    }
  }, [activeVariant, systemStatus]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-700 ease-in-out select-none"
    >
      {/* Layer 0: Base Obsidian Foundation */}
      <div className="absolute inset-0 bg-[#050608]" />

      {/* Layer 1: High-Tech Enterprise AI SOC Command Center Background Image */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-all duration-700 pointer-events-none"
        style={{
          backgroundImage: `url(${guardianSocBg})`,
          backgroundAttachment: 'fixed',
          opacity: bgIntensity === 'subtle' ? 0.35 : 0.65,
          filter: 'contrast(1.18) saturate(1.15) brightness(0.95)',
        }}
      />

      {/* Layer 1b: Balanced Enterprise Scrim (Vivid SOC background with high-contrast text safety) */}
      <div className="absolute inset-0 bg-[#050608]/40 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_75%_at_50%_35%,transparent_25%,rgba(5,6,8,0.75)_100%)] pointer-events-none" />

      {/* Layer 2: Module-Specific Semantic Gradient Lighting */}
      {ambientGradients}

      {/* Layer 3: Technical / Conceptual Vector Pattern */}
      {renderPattern}

      {/* Layer 4: Micro-Subtle Surface Texture Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#C8D0DC05_1px,transparent_1px),linear-gradient(to_bottom,#C8D0DC05_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_35%,#000_60%,transparent_100%)] opacity-60 pointer-events-none" />
    </div>
  );
}
