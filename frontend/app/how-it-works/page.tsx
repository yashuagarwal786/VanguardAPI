'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileCode,
  Users,
  ShieldCheck,
  FileSpreadsheet,
  Lock,
  ArrowRight,
  Terminal as TerminalIcon,
} from 'lucide-react';
import AmbientBackground from '@/components/cyber/ambient-background';
import { fadeUpVariant, staggerContainer, cyberEase } from '@/lib/motion';

export default function HowItWorksPage() {
  const steps = [
    {
      num: 'Phase 01',
      title: 'OpenAPI Specification Ingestion',
      icon: FileCode,
      summary:
        'The scanner loads your API schema from a public HTTPS URL or a local file. It identifies parameterized routes (e.g. /tenants/{tenantId}/invoices/{invoiceId}) and determines which authentication security scheme is declared (Bearer JWT, OAuth2, or ApiKey).',
      terminalSnippet: `[INGEST] Loading OpenAPI 3.1.0 specification...
[PARSER] 42 paths identified, 18 parameterized resources.
[AUTH] Detected SecurityScheme: HTTP Bearer (JWT)`,
      details: [
        'Supports OpenAPI 3.0.x and 3.1.x definitions',
        'Maps route parameters and filters documentation endpoints',
        'Validates endpoint accessibility and security scheme headers',
      ],
    },
    {
      num: 'Phase 02',
      title: 'Dual-Context Authentication',
      icon: Users,
      summary:
        'To accurately test authorization, VanguardAPI provisions sessions for two separate test entities: User A (the requester/attacker context) and User B (the victim/resource owner context).',
      terminalSnippet: `[AUTH_SESSION_A] Authenticated User A -> uuid: 09af-4421
[AUTH_SESSION_B] Authenticated User B -> uuid: 88ba-1109
[ISOLATION] Context tokens securely buffered in memory`,
      details: [
        'Automated login against your authentication route',
        'Cryptographically isolated session tokens kept in ephemeral memory',
        'Seeds known entity IDs for both accounts or discovers them via list routes',
      ],
    },
    {
      num: 'Phase 03',
      title: 'Cross-Tenant Access Verification',
      icon: ShieldCheck,
      summary:
        'The scanner sends two requests per resource: First, User B requests their own entity to capture the legitimate baseline. Next, User A requests User B’s identifier using User A’s token.',
      terminalSnippet: `[PROBE] GET /api/v1/users/88ba-1109/billing with User A Token
[RESPONSE] HTTP 200 OK (Content-Length: 1420 bytes)
[ALERT] Payload identity matches victim record -> BOLA CONFIRMED`,
      details: [
        'Precision matching: Flags ONLY if User A receives HTTP 200 AND the payload matches User B’s private data',
        'Eliminates false positives on public endpoints or uniform error responses',
        'Recursively scans returned payloads for plaintext passwords and Luhn credit cards',
      ],
    },
    {
      num: 'Phase 04',
      title: 'Report Generation & Engineering Proof',
      icon: FileSpreadsheet,
      summary:
        'Emits an actionable report with normalized findings. Each finding includes non-technical risk summaries, sanitized evidence, runnable reproduction commands, and concrete data-layer fixes.',
      terminalSnippet: `[REPORT] 1 High Severity BOLA, 1 Medium Rate-Limit Leak
[POC] Generated copy-pasteable curl reproduction commands
[SARIF] Export completed: reports/vanguard-api-audit.json`,
      details: [
        'One finding per endpoint template, eliminating duplicate clutter',
        'Sanitized tokens and masked PAN data (e.g. 4532...[redacted]...1235)',
        'Exportable to JSON or directly consumable in CI/CD quality gates',
      ],
    },
  ];

  return (
    <div className="relative pt-32 pb-24 max-w-5xl mx-auto px-6">
      <AmbientBackground />

      {/* Header */}
      <motion.div
        variants={fadeUpVariant}
        initial="hidden"
        animate="visible"
        className="max-w-3xl mb-16"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-acid/10 border border-acid/30 text-acid font-mono text-xs font-semibold mb-4">
          <span>TECHNICAL WORKFLOW</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-muted-heading mb-4">
          How VanguardAPI verifies authorization boundaries.
        </h1>
        <p className="text-lg text-muted-body leading-relaxed">
          Authorization flaws cannot be deduced from static syntax alone. They require active, multi-session cross-checks to prove that one authenticated user can access another user’s records.
        </p>
      </motion.div>

      {/* Mandatory Verification Note */}
      <motion.div
        variants={fadeUpVariant}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.1 }}
        className="mb-14 p-5 rounded-xl bg-warn-amber/10 border border-warn-amber/30 text-amber-200 text-sm flex items-start gap-3.5"
      >
        <Lock className="w-5 h-5 flex-shrink-0 text-warn-amber mt-0.5" />
        <div>
          <strong className="text-white">Mandatory Pre-Flight Guardrail:</strong> Before any scan is dispatched, our platform requires domain ownership verification via DNS TXT or <code className="bg-black/40 px-1 py-0.5 rounded text-white font-mono">/.well-known/vanguard-api-verify.txt</code>. VanguardAPI cannot be pointed at arbitrary third-party targets.
        </div>
      </motion.div>

      {/* Steps List with Pipeline Line & Station Dots */}
      <div className="relative mb-16">
        {/* Animated Connecting Vertical Pipeline Line */}
        <div className="hidden md:block absolute left-8 top-10 bottom-10 w-[2px] bg-gradient-to-b from-acid via-white/20 to-acid pointer-events-none opacity-40" />

        <div className="space-y-12">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.num}
                variants={fadeUpVariant}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.35, delay: idx * 0.08, ease: cyberEase }}
                className="relative md:pl-20"
              >
                {/* Station Node Badge on the pipeline */}
                <div className="hidden md:flex absolute left-5 top-7 -translate-x-1/2 w-6 h-6 rounded-full bg-obsidian-card border-2 border-acid items-center justify-center shadow-[0_0_12px_rgba(163,230,53,0.5)] z-10">
                  <div className="w-2 h-2 rounded-full bg-acid animate-pulse" />
                </div>

                <div className="hud-frame glass-panel rounded-2xl p-7 sm:p-9 border-white/10 hover:border-acid/30 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <span className="font-mono text-xs font-bold text-acid uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-acid inline-block md:hidden" />
                      {s.num}
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-acid">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-muted-heading mb-3">{s.title}</h3>
                  <p className="text-base text-muted-body leading-relaxed mb-6">{s.summary}</p>

                  {/* Terminal Simulation Snippet */}
                  <div className="mb-6 rounded-lg bg-black/60 border border-white/10 p-3.5 font-mono text-xs text-muted-body">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[10px] text-muted-dim">
                      <span className="flex items-center gap-1.5">
                        <TerminalIcon className="w-3 h-3 text-acid" />
                        AUDIT TELEMETRY LOG
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-acid/10 text-acid font-bold">
                        SIMULATION
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap text-muted-body leading-relaxed font-mono">
                      {s.terminalSnippet}
                    </pre>
                  </div>

                  <div className="pt-4 border-t border-white/10">
                    <h4 className="text-xs font-mono uppercase text-muted-dim font-bold mb-2">
                      Key Verification Checkpoints:
                    </h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-body">
                      {s.details.map((d) => (
                        <li key={d} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-acid" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* CTA Box */}
      <motion.div
        variants={fadeUpVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="hud-frame glass-panel-elevated rounded-2xl p-8 sm:p-12 text-center border-white/15"
      >
        <h3 className="text-2xl sm:text-3xl font-bold text-muted-heading mb-3">
          Ready to scan your staging or production APIs?
        </h3>
        <p className="text-muted-body max-w-xl mx-auto mb-8 text-sm sm:text-base">
          Sign up to register your first target, verify domain ownership, and launch your automated audit.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-acid hover:bg-acid-hover text-obsidian font-bold text-sm shadow-[0_4px_20px_rgba(163,230,53,0.3)] transition-all transform hover:-translate-y-0.5"
        >
          <span>Get Started Free</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  );
}
