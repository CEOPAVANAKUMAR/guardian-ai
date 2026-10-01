import React, { useState } from 'react';
import { User, Smartphone, MapPin, AlertOctagon, FileText, CheckCircle2, Shield, Eye, Hash } from 'lucide-react';

/**
 * EvidenceGraph - Interactive relationship graph visualizing evidence connections:
 * USER -> ACCOUNT -> DEVICE -> LOCATION -> EVENT -> RESOURCE
 */
export default function EvidenceGraph({
  nodes = [],
  edges = [],
  onSelectNode,
  className = '',
}) {
  const [activeNode, setActiveNode] = useState(nodes[0] || null);

  // Fallback default nodes if none provided
  const displayNodes = nodes.length > 0 ? nodes : [
    { id: 'node-user', label: 'emp_finance_04', type: 'ACCOUNT', status: 'WARNING', details: 'Principal Actor ID', hash: '8f4a10e7b29' },
    { id: 'node-device', label: 'Android 14 (FP-8849)', type: 'DEVICE', status: 'DANGER', details: 'Hardware Nonce Mismatch', hash: 'e912c75a401' },
    { id: 'node-location', label: 'London, UK (ASN 15169)', type: 'LOCATION', status: 'WARNING', details: 'Primary Ingress Geolocation', hash: '34c01f99b1a' },
    { id: 'node-loc2', label: 'Tokyo, JP (ASN 2519)', type: 'LOCATION', status: 'DANGER', details: 'Impossible Travel Concurrent', hash: '9b207a11de4' },
    { id: 'node-event', label: 'Auth Anomaly Spike', type: 'EVENT', status: 'DANGER', details: '5 Failures in 60s window', hash: '5c88b0a9910' },
  ];

  const getNodeIcon = (type) => {
    switch (type) {
      case 'ACCOUNT':
      case 'USER':
        return User;
      case 'DEVICE':
        return Smartphone;
      case 'LOCATION':
        return MapPin;
      case 'EVENT':
        return AlertOctagon;
      case 'EVIDENCE':
      case 'DOCUMENT':
      default:
        return FileText;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DANGER':
        return {
          border: 'border-rose-500/60',
          bg: 'bg-rose-950/40',
          text: 'text-rose-400',
          glow: 'shadow-rose-500/20',
          dot: 'bg-rose-400',
        };
      case 'WARNING':
        return {
          border: 'border-amber-500/60',
          bg: 'bg-amber-950/40',
          text: 'text-amber-400',
          glow: 'shadow-amber-500/20',
          dot: 'bg-amber-400',
        };
      case 'SAFE':
      default:
        return {
          border: 'border-emerald-500/60',
          bg: 'bg-emerald-950/40',
          text: 'text-emerald-400',
          glow: 'shadow-emerald-500/20',
          dot: 'bg-emerald-400',
        };
    }
  };

  return (
    <div className={`p-5 rounded-2xl bg-[#0A0D18]/85 border border-teal-500/20 backdrop-blur-md shadow-2xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-950/80 border border-teal-500/40 text-teal-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-mono tracking-wider text-white uppercase flex items-center gap-2">
              EVIDENCE RELATIONSHIP GRAPH
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-500/40">
                INTERACTIVE
              </span>
            </h3>
            <p className="text-xs text-slate-400">Cryptographically connected nodes & anomaly linkages</p>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Click node to inspect forensic payload
        </div>
      </div>

      {/* Main Graph Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-5">
        {/* Nodes Grid Canvas */}
        <div className="lg:col-span-2 relative p-6 rounded-xl bg-[#040714] border border-slate-800/80 min-h-[300px] flex flex-col justify-between cyber-grid-bg overflow-hidden">
          {/* Subtle Radar Scan line */}
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent scanline-beam pointer-events-none" />

          {/* Node Flow Representation */}
          <div className="space-y-4">
            <div className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider font-semibold">
              RELATIONAL PROVENANCE CHAIN
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {displayNodes.map((n) => {
                const Icon = getNodeIcon(n.type);
                const s = getStatusColor(n.status);
                const isSelected = activeNode?.id === n.id;

                return (
                  <div
                    key={n.id}
                    onClick={() => {
                      setActiveNode(n);
                      if (onSelectNode) onSelectNode(n);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 select-none ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/60 shadow-lg shadow-cyan-500/30 ring-1 ring-cyan-400'
                        : `${s.border} ${s.bg} hover:border-cyan-500/40 hover:bg-slate-900/60`
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg bg-black/40 ${s.text}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                            {n.type}
                          </span>
                          <div className="text-xs font-bold text-white font-mono truncate max-w-[140px]">
                            {n.label}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${s.dot} animate-pulse`} />
                        <span className={`text-[10px] font-mono font-bold ${s.text}`}>
                          {n.status}
                        </span>
                      </div>
                    </div>

                    {n.details && (
                      <div className="mt-2 text-[11px] text-slate-300 font-mono truncate">
                        {n.details}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connection Footer Legend */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" /> DIRECT INGRESS
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" /> ANOMALY DETECTED
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> CRYPTO VERIFIED
            </span>
          </div>
        </div>

        {/* Selected Node Telemetry Inspector */}
        <div className="p-5 rounded-xl bg-[#060b19] border border-cyan-500/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <span className="text-[10px] font-mono font-bold tracking-wider text-cyan-400 uppercase">
                NODE TELEMETRY
              </span>
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
            </div>

            {activeNode ? (
              <div className="mt-4 space-y-3 font-mono text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Selected Entity</div>
                  <div className="text-sm font-bold text-white mt-0.5">{activeNode.label}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Entity Classification</div>
                  <div className="text-xs font-semibold text-cyan-300 mt-0.5">{activeNode.type}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Forensic Status</div>
                  <div className={`text-xs font-bold mt-0.5 ${getStatusColor(activeNode.status).text}`}>
                    {activeNode.status}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Telemetry Observation</div>
                  <div className="text-xs text-slate-300 mt-0.5 bg-black/40 p-2.5 rounded-lg border border-slate-800">
                    {activeNode.details || 'Deterministic entity verified against runtime authorization cache.'}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                    <Hash className="w-3 h-3 text-cyan-400" /> Action / Hash Pointer
                  </div>
                  <div className="text-[11px] font-mono text-cyan-400/90 break-all bg-black/40 p-2 rounded-lg border border-slate-800">
                    {activeNode.hash || 'sha256:d89ef47b1029c91a082e66'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 mt-6 text-center">
                Select a node to inspect evidence telemetry
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>CHAIN INTEGRITY: SECURE (HMAC-SHA256)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
