import React from 'react';
import { ShieldAlert, Database, Flame, Check } from 'lucide-react';
import DecodeText from '@/components/cyber/decode-text';

export default function ThreatCardsSection() {
  const threats = [
    {
      owasp: 'OWASP API1:2023',
      title: 'Broken Object Level Authorization',
      severity: 'High',
      badgeColor: 'text-alert-red bg-alert-red/15 border-alert-red/35',
      accentColor: 'before:bg-alert-red',
      description:
        'When User A changes a path parameter (like /orders/101 to /orders/102) and receives User B’s private record without permission.',
      detectionProof: 'Dual-tenant authorization proof (User A token requests User B object).',
      visual: (
        <svg width="220" height="90" viewBox="0 0 220 90" fill="none" className="mx-auto">
          <circle cx="40" cy="45" r="18" fill="rgba(163, 230, 53, 0.12)" stroke="#a3e635" strokeWidth="2" />
          <text x="40" y="49" fill="#a3e635" fontSize="10" fontFamily="monospace" textAnchor="middle">User A</text>
          
          <circle cx="180" cy="45" r="18" fill="rgba(255, 59, 71, 0.15)" stroke="#ff3b47" strokeWidth="2" />
          <text x="180" y="49" fill="#ff3b47" fontSize="10" fontFamily="monospace" textAnchor="middle">User B</text>

          <path d="M 60 45 L 160 45" stroke="#ff3b47" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="110" cy="45" r="5" fill="#ff3b47" />
        </svg>
      ),
    },
    {
      owasp: 'OWASP API3:2023',
      title: 'Excessive Data Exposure',
      severity: 'High',
      badgeColor: 'text-alert-red bg-alert-red/15 border-alert-red/35',
      accentColor: 'before:bg-warn-amber',
      description:
        'Endpoints returning sensitive fields (plaintext passwords, raw tokens, SSNs) or unmasked primary account numbers (PAN) that validate against the Luhn algorithm.',
      detectionProof: 'Recursive JSON key inspection + ISO/IEC 7812 Luhn checksum validator.',
      visual: (
        <svg width="220" height="90" viewBox="0 0 220 90" fill="none" className="mx-auto">
          <rect x="35" y="20" width="150" height="50" rx="6" fill="rgba(255, 176, 32, 0.1)" stroke="#ffb020" strokeWidth="1.5" />
          <line x1="35" y1="36" x2="185" y2="36" stroke="#ffb020" strokeWidth="2.5" />
          <text x="50" y="56" fill="#fde68a" fontSize="10" fontFamily="monospace">4532 •••• •••• 1235</text>
          <circle cx="160" cy="56" r="4" fill="#ff3b47" />
        </svg>
      ),
    },
    {
      owasp: 'OWASP API4:2023',
      title: 'Missing Rate Limiting',
      severity: 'Medium',
      badgeColor: 'text-warn-amber bg-warn-amber/15 border-warn-amber/35',
      accentColor: 'before:bg-acid',
      description:
        'Authentication and sensitive endpoints accepting rapid, unbounded bursts without HTTP 429 throttling or standard rate-limit signaling headers.',
      detectionProof: 'Bounded bursts (30 reqs) checking Retry-After and X-RateLimit-* headers.',
      visual: (
        <svg width="220" height="90" viewBox="0 0 220 90" fill="none" className="mx-auto">
          <line x1="160" y1="18" x2="160" y2="72" stroke="#a3e635" strokeWidth="3" strokeDasharray="5 3" />
          <circle cx="30" cy="32" r="4" fill="#a3e635" />
          <circle cx="65" cy="45" r="4" fill="#a3e635" />
          <circle cx="100" cy="36" r="4" fill="#a3e635" />
          <circle cx="130" cy="58" r="4" fill="#a3e635" />
          <circle cx="80" cy="62" r="4" fill="#a3e635" />
          <text x="175" y="49" fill="#ffb020" fontSize="12" fontFamily="monospace">429?</text>
        </svg>
      ),
    },
  ];

  return (
    <section className="py-24 border-t border-white/10 bg-transparent">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-2 text-terminal font-mono text-xs font-bold uppercase tracking-wider mb-3">
          <ShieldAlert className="w-4 h-4 text-terminal" />
          <span>[ 02 / THREATS ] — AUTOMATED ATTACK VECTOR MATRIX</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-muted-heading mb-4">
          <DecodeText text="Precision audits for critical OWASP API flaws." as="span" />
        </h2>

        <p className="text-base sm:text-lg text-muted-body max-w-2xl mb-12 font-mono text-sm">
          Generic DAST tools report hundreds of false positives on public pages. VanguardAPI audits authorization context directly using dual authenticated sessions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {threats.map((threat) => (
            <div
              key={threat.title}
              className={`glass-panel relative rounded-2xl p-7 flex flex-col justify-between overflow-hidden before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] ${threat.accentColor} transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_16px_40px_rgba(0,0,0,0.6)] hud-frame`}
            >
              <div>
                {/* Visual Preview Box */}
                <div className="w-full py-4 mb-6 rounded-xl bg-[#111114] border border-white/10 flex flex-col items-center justify-center relative">
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-white/5 border border-white/10 text-muted-dim">
                    SIMULATION
                  </div>
                  {threat.visual}
                </div>

                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-mono text-muted-dim font-bold uppercase">
                    {threat.owasp}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${threat.badgeColor}`}
                  >
                    {threat.severity}
                  </span>
                </div>

                <h3 className="text-xl font-bold font-mono text-muted-heading mb-3">
                  {threat.title}
                </h3>

                <p className="text-sm text-muted-body leading-relaxed mb-6 font-mono text-xs">
                  {threat.description}
                </p>
              </div>

              <div className="pt-4 border-t border-white/10 text-xs font-mono text-muted-dim">
                <span className="text-terminal font-semibold">&gt; VERIFICATION:</span> {threat.detectionProof}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
