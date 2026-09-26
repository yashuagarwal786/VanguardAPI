'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  CreditCard,
  KeyRound,
  Gauge,
  FileJson,
  Terminal,
  Cpu,
  GitBranch,
  ArrowRight,
} from 'lucide-react';
import AmbientBackground from '@/components/cyber/ambient-background';
import {
  BolaLaneSimulation,
  DataExposureSimulation,
  RateLimitSimulation,
} from '@/components/cyber/feature-threat-simulations';
import { fadeUpVariant, staggerContainer, cyberEase } from '@/lib/motion';

export default function FeaturesPage() {
  const featureList = [
    {
      icon: ShieldCheck,
      title: 'Dual-User BOLA / IDOR Verification',
      tag: 'OWASP API1:2023',
      description:
        'Eliminates the false-positive epidemic of single-tenant scanners. VanguardAPI logs into two distinct accounts (User A and User B) simultaneously and tests whether User A can read or mutate User B’s private records.',
    },
    {
      icon: CreditCard,
      title: 'ISO/IEC 7812 Luhn Card Detection',
      tag: 'PCI-DSS Compliance',
      description:
        'Recursively scans API JSON payloads for candidate digit sequences and executes the Luhn checksum algorithm to flag raw, unmasked credit cards before financial auditors do.',
    },
    {
      icon: KeyRound,
      title: 'Plaintext Credential Hunter',
      tag: 'OWASP API3:2023',
      description:
        'Detects sensitive attributes returned in API DTOs, including plaintext passwords, hash digests, private tokens, SSNs, and API secrets accidentally serialized to clients.',
    },
    {
      icon: Gauge,
      title: 'Bounded Rate-Limiting Bursts',
      tag: 'OWASP API4:2023',
      description:
        'Issues safe, non-destructive request bursts (maximum 30-50 calls) targeting authentication and sensitive routes to verify that HTTP 429 status and Retry-After headers are returned.',
    },
    {
      icon: FileJson,
      title: 'OpenAPI 3.0 & 3.1 Ingestion',
      tag: 'Contract-Driven',
      description:
        'Directly ingests OpenAPI specifications via URL or file upload. Automatically extracts parameterized route templates, query schemas, and bearer authentication definitions.',
    },
    {
      icon: Terminal,
      title: 'Runnable cURL Reproduction PoCs',
      tag: 'Developer Velocity',
      description:
        'Every finding includes an instant, copy-pasteable terminal command with sanitized tokens so your engineering team can reproduce the vulnerability within 30 seconds.',
    },
    {
      icon: Cpu,
      title: 'Zero-Dependency CLI Engine',
      tag: 'Python 3 Stdlib',
      description:
        'The core CLI scanner runs purely on Python standard library modules. No third-party pip dependencies, no container bloat, and no supply chain vulnerability footprint.',
    },
    {
      icon: GitBranch,
      title: 'CI/CD Automated Deployment Gating',
      tag: 'DevSecOps',
      description:
        'Integrate into GitHub Actions, GitLab CI, or CircleCI using the --fail-on high flag. Automatically block pull requests that introduce new authorization vulnerabilities.',
    },
  ];

  return (
    <div className="relative pt-32 pb-24 max-w-6xl mx-auto px-6">
      <AmbientBackground />

      {/* Header */}
      <motion.div
        variants={fadeUpVariant}
        initial="hidden"
        animate="visible"
        className="max-w-3xl mb-16"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-acid/10 border border-acid/30 text-acid font-mono text-xs font-semibold mb-4">
          <span>CAPABILITY MATRIX</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-muted-heading mb-4">
          Engineered for zero-trust authorization audits.
        </h1>
        <p className="text-lg text-muted-body leading-relaxed">
          Traditional scanners look for SQL injection and XSS on static HTML forms. VanguardAPI specializes exclusively in the modern API attack surface: broken ownership checks and data exfiltration.
        </p>
      </motion.div>

      {/* Live Threat Vector Simulations */}
      <div className="mb-20">
        <div className="flex items-center gap-2 font-mono text-xs text-acid font-semibold uppercase tracking-wider mb-6">
          <span className="w-2 h-2 rounded-full bg-acid" />
          <span>Interactive Attack Vector Simulations</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <BolaLaneSimulation />
          <DataExposureSimulation />
          <RateLimitSimulation />
        </div>
      </div>

      {/* Grid of Capability Cards with Staggered Motion */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
      >
        {featureList.map((f) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.title}
              variants={fadeUpVariant}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2, ease: cyberEase }}
              className="hud-frame glass-panel rounded-2xl p-7 flex flex-col justify-between border-white/10 hover:border-acid/30 hover:shadow-[0_0_20px_rgba(163,230,53,0.1)] transition-colors group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-acid group-hover:border-acid/40 transition-colors">
                    <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-muted-dim uppercase px-2.5 py-0.5 rounded bg-white/5 border border-white/10 group-hover:text-acid group-hover:border-acid/30 transition-colors">
                    {f.tag}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-muted-heading mb-3 group-hover:text-white transition-colors">
                  {f.title}
                </h3>
                <p className="text-sm text-muted-body leading-relaxed mb-6">{f.description}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* CTA Box */}
      <motion.div
        variants={fadeUpVariant}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="hud-frame glass-panel-elevated rounded-2xl p-8 sm:p-12 text-center border-white/15"
      >
        <h3 className="text-2xl sm:text-3xl font-bold text-muted-heading mb-3">
          Experience zero-trust API scanning today.
        </h3>
        <p className="text-muted-body max-w-xl mx-auto mb-8 text-sm sm:text-base">
          VanguardAPI requires domain verification before scanning, ensuring all audits remain ethical and controlled.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-acid hover:bg-acid-hover text-obsidian font-bold text-sm shadow-[0_4px_20px_rgba(163,230,53,0.3)] transition-all transform hover:-translate-y-0.5"
        >
          <span>Verify Your Domain</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </div>
  );
}
