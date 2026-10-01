import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  X,
  Maximize2,
  Minimize2,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Terminal,
  Activity,
  ArrowRight,
  ExternalLink,
  Trash2,
  Cpu,
  Layers,
  Lock,
  Radio,
} from 'lucide-react';
import { sendCopilotMessage } from '../services/api';

/**
 * GuardianCopilotChat - Enterprise AI Security Copilot
 * 
 * Provides real-time incident forensics, AST policy explanations,
 * cryptographic audit verification, and threat analysis.
 */
export default function GuardianCopilotChat({
  isOpen,
  onClose,
  currentTab,
  onNavigate,
  onOpenIntro,
  onOpenComparison,
}) {
  const [messages, setMessages] = useState([
    {
      id: 'msg-init',
      role: 'assistant',
      content:
        "### 🛡️ Guardian Sentinel AI Online\n\nI am your **Enterprise AI Security Copilot**, connected directly to the GuardianAI runtime authorization engine and deterministic AST pipeline.\n\nAsk me anything about **active security incidents**, **SQL AST invariants**, **poisoned document taint tracking**, or **HMAC-SHA256 audit logs**.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action_type: 'SECURITY_ADVICE',
      suggested_queries: [
        'Summarize active threats',
        'Explain why agent_analyst_01 was denied',
        'How does GuardianAI block SQL injection?',
        'Verify HMAC audit chain',
      ],
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSend = async (textToSend = null) => {
    const text = (textToSend || input).trim();
    if (!text || isTyping) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await sendCopilotMessage(text, history, { currentTab });

      const assistantMsg = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        action_type: res.action_type,
        action_payload: res.action_payload,
        suggested_queries: res.suggested_queries || [],
        telemetry: res.telemetry,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ Failed to connect to Guardian Sentinel backend. Operating in local fallback mode.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAction = (msg) => {
    if (!msg.action_type) return;

    if (msg.action_type === 'NAVIGATE' && msg.action_payload?.tab) {
      onNavigate(msg.action_payload.tab);
    } else if (msg.action_type === 'OPEN_BRIEFING' && onOpenIntro) {
      onOpenIntro();
    } else if (msg.action_type === 'OPEN_COMPARISON' && onOpenComparison) {
      onOpenComparison();
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'msg-init-cleared',
        role: 'assistant',
        content: "### 🛡️ Sentinel Session Cleared\n\nSecurity session memory refreshed. How can I assist you with autonomous agent governance or threat diagnostics?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggested_queries: [
          'Summarize active threats',
          'How does GuardianAI block SQL injection?',
          'Verify HMAC audit chain',
        ],
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end p-0 sm:p-6 pointer-events-none">
      {/* Semi-transparent backdrop on mobile */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm sm:hidden pointer-events-auto"
        onClick={onClose}
      />

      {/* Floating Copilot Window */}
      <div
        className={`pointer-events-auto w-full sm:w-[540px] ${
          isExpanded ? 'sm:w-[760px] h-[85vh]' : 'h-[620px]'
        } max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#090C12]/95 border border-cyan-500/30 shadow-[0_20px_70px_rgba(0,0,0,0.8)] backdrop-blur-2xl overflow-hidden transition-all duration-300 font-sans`}
      >
        {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-white/[0.08] bg-[#0E131C]/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-violet-600 to-fuchsia-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0E131C] animate-ping" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0E131C]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white font-mono tracking-wide">
                  GUARDIAN SENTINEL
                </span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold">
                  COPILOT AI
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Deterministic AST Engine • Zero-Trust Boundary</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClear}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="hidden sm:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title={isExpanded ? 'Compact View' : 'Expand View'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/[0.08] transition-colors"
              title="Close [ESC]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 space-y-2 leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-medium rounded-tr-none shadow-lg'
                      : 'bg-[#111622]/90 border border-white/[0.08] text-slate-200 rounded-tl-none shadow-md backdrop-blur-md'
                  }`}
                >
                  {/* Message Content */}
                  <div className="whitespace-pre-line prose-invert text-xs space-y-2">
                    {m.content}
                  </div>

                  {/* Contextual Action Button */}
                  {!isUser && m.action_type && (
                    <div className="pt-2">
                      <button
                        onClick={() => handleAction(m)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-mono text-[11px] font-bold transition-all shadow-sm active:scale-95"
                      >
                        <span>
                          {m.action_type === 'NAVIGATE' && m.action_payload?.tab
                            ? `JUMP TO ${m.action_payload.tab.toUpperCase()}`
                            : m.action_type === 'OPEN_BRIEFING'
                            ? 'PLAY 15S BRIEFING'
                            : m.action_type === 'OPEN_COMPARISON'
                            ? 'VIEW COMPARISON'
                            : 'INSPECT VECTOR'}
                        </span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div
                    className={`text-[9px] font-mono mt-1 ${
                      isUser ? 'text-violet-200' : 'text-slate-400'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-violet-600/30 border border-violet-500/40 text-violet-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Terminal className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing Animation */}
          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              </div>
              <div className="p-3.5 rounded-2xl rounded-tl-none bg-[#111622]/90 border border-white/[0.08] text-slate-400 font-mono text-[11px] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Guardian Sentinel evaluating deterministic policy...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Suggested Query Chips */}
        {messages.length > 0 && messages[messages.length - 1].suggested_queries?.length > 0 && (
          <div className="px-4 py-2 border-t border-white/[0.06] bg-[#0A0D14]/80 overflow-x-auto flex items-center gap-2 scrollbar-none shrink-0">
            <span className="text-[10px] font-mono text-[#8994A3] shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              SUGGESTED:
            </span>
            {messages[messages.length - 1].suggested_queries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="shrink-0 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-cyan-500/15 hover:text-cyan-300 hover:border-cyan-500/30 border border-white/[0.08] text-[11px] text-slate-300 font-mono transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Message Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3.5 border-t border-white/[0.08] bg-[#0C1018] flex items-center gap-2 shrink-0"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Sentinel AI about incidents, AST rules, or agent security..."
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] focus:border-cyan-400/60 focus:bg-white/[0.06] focus:outline-none text-xs text-white placeholder-slate-400 font-mono transition-all"
            />
            {input && (
              <button
                type="button"
                onClick={() => setInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className={`p-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 ${
              input.trim() && !isTyping
                ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-cyan-500/20'
                : 'bg-white/[0.05] text-slate-400 cursor-not-allowed border border-white/[0.06]'
            }`}
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
