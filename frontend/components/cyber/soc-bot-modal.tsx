'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  X,
  Sparkles,
  Shield,
  Copy,
  Check,
  Terminal,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FindingSummary {
  findingCode?: string;
  title?: string;
  severity?: string;
  endpoint?: string;
  explanation?: string;
  recommendation?: string;
  reproduction?: string;
}

interface SocBotModalProps {
  target?: {
    id: string;
    name: string;
    baseUrl: string;
    specUrl?: string;
  } | null;
  findings: FindingSummary[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function SocBotModal({ target, findings }: SocBotModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or update welcome greeting when target or findings change
  useEffect(() => {
    if (!isOpen) return;

    if (messages.length === 0) {
      const targetName = target?.name || 'Local API';
      const findingsCount = findings.length;

      setMessages([
        {
          id: 'welcome-1',
          role: 'assistant',
          content: `### 🛡️ [VANGUARD-SOC] AI Security Copilot Initialized

**Target Linked:** \`${targetName}\` (${target?.baseUrl || 'No base URL'})
**Telemetry Status:** **${findingsCount} vulnerability finding(s)** synchronized in context.

I can explain any flagged flaw, write code patches (FastAPI, Express, Nginx), or output curl PoC tests.

*Select a quick prompt below or type your question.*`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [isOpen, target, findings]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/bot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          target: target
            ? {
                name: target.name,
                baseUrl: target.baseUrl,
                specUrl: target.specUrl,
              }
            : undefined,
          findings: findings.map((f) => ({
            findingCode: f.findingCode,
            title: f.title,
            severity: f.severity,
            endpoint: f.endpoint,
            explanation: f.explanation,
            recommendation: f.recommendation,
            reproduction: f.reproduction,
          })),
        }),
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: data.reply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: 'assistant',
            content: `[!] Error: ${data.error || 'Failed to generate security response.'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: '[!] Network communication failure with SOC Copilot service.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const quickPrompts = [
    { label: '⚡ Explain BOLA Vulnerability', query: 'Explain BOLA/IDOR vulnerability on this target and how an attacker exploits it.' },
    { label: '🛡️ FastAPI / Express Fix', query: 'Generate code patches in FastAPI and Express.js to fix the vulnerabilities on this target.' },
    { label: '🔒 Fix Missing HSTS & nosniff', query: 'How do I add Strict-Transport-Security and X-Content-Type-Options headers?' },
    { label: '🧪 Show PoC Curl Tests', query: 'Give me the curl proof-of-concept commands to test this target right now.' },
    { label: '📋 Executive Risk Summary', query: 'Summarize the risk posture of this target for an executive security report.' },
  ];

  return (
    <>
      {/* Floating HUD Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group relative flex items-center gap-3 px-4 py-3 rounded-full bg-obsidian border border-acid/50 text-white font-mono text-xs font-bold shadow-[0_0_25px_rgba(163,230,53,0.3)] hover:shadow-[0_0_35px_rgba(163,230,53,0.5)] hover:border-acid transition-all"
        >
          {/* Pulsing radar dot */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-acid opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-acid"></span>
          </span>

          <span className="text-acid group-hover:text-white transition-colors">
            VANGUARD-API SOC BOT
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-acid/20 text-acid border border-acid/30">
            AI COPILOT
          </span>
        </button>
      </div>

      {/* Slide-in Cyber SOC Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className={`fixed bottom-20 right-6 z-50 rounded-2xl bg-[#0a0a0b]/95 backdrop-blur-xl border border-acid/40 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(163,230,53,0.2)] flex flex-col overflow-hidden transition-all ${
              isExpanded
                ? 'w-[95vw] md:w-[750px] h-[85vh]'
                : 'w-[95vw] md:w-[500px] h-[600px] max-h-[80vh]'
            }`}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-black/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-acid/15 border border-acid/30 flex items-center justify-center text-acid">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                      VANGUARD-API SOC COPILOT
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-acid/20 text-acid font-bold">
                      ACTIVE
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-dim block truncate max-w-[280px]">
                    TARGET: {target?.name || 'Local API'} // {findings.length} findings
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 rounded-lg text-muted-dim hover:text-white hover:bg-white/10 transition-colors"
                  title={isExpanded ? 'Minimize' : 'Maximize'}
                >
                  {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-muted-dim hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Prompt Chips */}
            <div className="p-2 border-b border-white/5 bg-black/30 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
              {quickPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p.query)}
                  disabled={loading}
                  className="whitespace-nowrap px-2.5 py-1 rounded-md bg-white/5 hover:bg-acid/15 hover:border-acid/40 border border-white/10 text-[11px] font-mono text-muted-dim hover:text-acid transition-all disabled:opacity-50"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[10px] text-muted-dim uppercase font-bold">
                      {m.role === 'user' ? 'OPERATOR' : 'SOC_AI'}
                    </span>
                    <span className="text-[9px] text-muted-dim">{m.timestamp}</span>
                  </div>

                  <div
                    className={`relative p-3.5 rounded-xl max-w-[92%] leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-acid/15 border border-acid/30 text-white shadow-[0_2px_12px_rgba(163,230,53,0.15)]'
                        : 'bg-black/60 border border-white/10 text-muted-body shadow-[0_2px_12px_rgba(0,0,0,0.4)]'
                    }`}
                  >
                    {m.role === 'assistant' && (
                      <button
                        onClick={() => handleCopy(m.content, m.id)}
                        className="absolute top-2 right-2 p-1 rounded bg-white/5 hover:bg-white/15 text-muted-dim hover:text-white transition-colors"
                        title="Copy Response"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3 h-3 text-acid" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}

                    <div className="whitespace-pre-wrap select-text space-y-2">
                      {m.content}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-black/40 border border-white/10 text-acid font-mono text-xs animate-pulse">
                  <Terminal className="w-3.5 h-3.5 animate-spin" />
                  <span>ANALYZING TELEMETRY & RUNNING REASONING ENGINE...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-white/10 bg-black/60">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask SOC Bot: 'How to fix BOLA?', 'Generate curl test'..."
                  disabled={loading}
                  className="flex-1 bg-black/50 border border-white/15 focus:border-acid rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-muted-dim font-mono outline-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="px-3.5 py-2.5 rounded-lg bg-acid hover:bg-acid-hover text-obsidian font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">SEND</span>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
