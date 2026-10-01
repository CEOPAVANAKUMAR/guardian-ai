import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Send,
  CheckCircle2,
  RefreshCw,
  Mail,
  Clock,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { fetchIncidents, shareIncidentReport } from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';

/**
 * Alerts - Real-Time Alert Command & Incident Dispatcher
 * Instant notification triage, automated SOC escalation, and direct SMTP alert dispatching.
 */
export default function Alerts({ onNavigateToIncident }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [dispatchEmail, setDispatchEmail] = useState('');
  const [dispatchingId, setDispatchingId] = useState(null);
  const [dispatchSuccess, setDispatchSuccess] = useState(null);

  const loadAlerts = async () => {
    try {
      const data = await fetchIncidents({ status: 'ALL' });
      setAlerts(data);
    } catch (e) {
      console.error('Failed to load alerts', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickDispatch = async (incidentId) => {
    if (!dispatchEmail || !dispatchEmail.includes('@')) {
      alert('Please enter a valid recipient email address.');
      return;
    }
    setDispatchingId(incidentId);
    try {
      await shareIncidentReport(incidentId, dispatchEmail);
      setDispatchSuccess(`Alert for ${incidentId} dispatched to ${dispatchEmail}`);
      setTimeout(() => setDispatchSuccess(null), 4000);
    } catch (e) {
      alert(e.message || 'Dispatch failed');
    } finally {
      setDispatchingId(null);
    }
  };

  const filtered = alerts.filter((a) => {
    if (filterSeverity === 'ALL') return true;
    return a.risk_level?.toUpperCase() === filterSeverity;
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8 font-sans">
      {/* ---------------------------------------------------- */}
      {/* LEVEL 1: REAL-TIME SOC DISPATCHER & ALERT HUB HUD    */}
      {/* ---------------------------------------------------- */}
      <div className="p-3.5 rounded-2xl glass-card border border-orange-500/20 bg-gradient-to-r from-orange-950/20 via-[#0F1420] to-[#0A0D14] flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400">
              <Bell className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[10px] text-[#8994A3] uppercase">ACTIVE ALERTS</div>
              <div className="text-[#F4F6F8] font-bold">{alerts.length} Incident Alerts Active</div>
            </div>
          </div>

          <div className="hidden sm:block h-6 w-px bg-white/[0.08]" />

          <div className="flex flex-col">
            <span className="text-[10px] text-[#8994A3] uppercase">CRITICAL ALERTS</span>
            <span className="text-rose-400 font-bold">
              {alerts.filter((a) => a.risk_level?.toUpperCase() === 'CRITICAL').length} Escalated
            </span>
          </div>

          <div className="hidden sm:block h-6 w-px bg-white/[0.08]" />

          <div className="hidden md:flex flex-col">
            <span className="text-[10px] text-[#8994A3] uppercase">DISPATCH MECHANISM</span>
            <span className="text-amber-300 font-bold">Direct SMTP &amp; Webhook Armed</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Severity filter buttons */}
          <div className="flex items-center gap-1 bg-[#0F1420] p-1 rounded-xl border border-white/[0.08] text-xs font-mono">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1 rounded-lg transition-all text-[11px] font-bold ${
                  filterSeverity === sev
                    ? 'bg-cyan-500 text-black shadow-sm'
                    : 'text-[#8994A3] hover:text-[#F4F6F8]'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {dispatchSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{dispatchSuccess}</span>
        </div>
      )}

      {/* Global Dispatch Broadcast Bar */}
      <div className="p-4 rounded-2xl glass-card flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Mail className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono text-[#C8D0DC]">
            Broadcast Incident Dispatch Recipient:
          </span>
        </div>
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <input
            type="email"
            value={dispatchEmail}
            onChange={(e) => setDispatchEmail(e.target.value)}
            placeholder="admin@enterprise.corp or oncall@soc.corp"
            className="w-full px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.1] text-xs font-mono text-[#F4F6F8] placeholder:text-[#8994A3] focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Alerts Stream */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-[#8994A3] font-mono text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Loading live alert stream...</span>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No Alerts Found"
            description="No alerts matching the selected severity filter. System boundaries are operating within normal parameters."
            actionLabel="Reset Filter"
            onAction={() => setFilterSeverity('ALL')}
          />
        ) : (
          filtered.map((item) => {
            const isCritical = item.risk_level?.toUpperCase() === 'CRITICAL';
            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isCritical
                    ? 'border-rose-500/40 bg-rose-950/20 hover:border-rose-500/60'
                    : 'glass-card hover:border-white/[0.18]'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                      isCritical
                        ? 'border-rose-500/40 bg-rose-950/60 text-rose-400'
                        : 'border-amber-500/40 bg-amber-950/60 text-amber-300'
                    }`}
                  >
                    {isCritical ? <Flame className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge
                        variant={isCritical ? 'critical' : 'warning'}
                        label={item.risk_level}
                      />
                      <span className="text-xs font-mono font-bold text-cyan-400">{item.id}</span>
                      <span className="text-[10px] font-mono text-[#8994A3]">{item.timestamp}</span>
                    </div>

                    <h3 className="text-sm font-bold text-[#F4F6F8] font-mono">{item.problem_title}</h3>

                    <div className="text-xs font-mono text-[#B5BEC9] mt-1">
                      Agent: <span className="text-cyan-300">{item.agent}</span> • Target: <span className="text-amber-300">{item.target}</span> • Sector: <span className="text-[#8994A3]">{item.sector}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleQuickDispatch(item.id)}
                    disabled={dispatchingId === item.id}
                    className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#C8D0DC] border border-white/[0.1] text-xs font-mono font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Send className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{dispatchingId === item.id ? 'Dispatching...' : 'Email Report'}</span>
                  </button>

                  {onNavigateToIncident && (
                    <button
                      onClick={() => onNavigateToIncident(item.id)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold flex items-center gap-1 transition-all"
                    >
                      <span>Investigate</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
