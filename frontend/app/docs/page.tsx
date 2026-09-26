'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Terminal, Shield, FileText, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import AmbientBackground from '@/components/cyber/ambient-background';
import { CodeBlock, FindingAnatomyCard } from '@/components/cyber/docs-interactive';
import { fadeUpVariant, cyberEase } from '@/lib/motion';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started');

  const navItems = [
    { id: 'getting-started', label: '1. Target Registration' },
    { id: 'verification', label: '2. Domain Verification' },
    { id: 'openapi', label: '3. OpenAPI Specifications' },
    { id: 'findings-schema', label: '4. Findings Schema' },
    { id: 'reproduction', label: '5. Running Reproduction' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (let i = navItems.length - 1; i >= 0; i--) {
        const section = document.getElementById(navItems[i].id);
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(navItems[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 100,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="relative pt-32 pb-24 max-w-6xl mx-auto px-6">
      <AmbientBackground />

      {/* Header */}
      <motion.div
        variants={fadeUpVariant}
        initial="hidden"
        animate="visible"
        className="max-w-3xl mb-14"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-acid/10 border border-acid/30 text-acid font-mono text-xs font-semibold mb-4">
          <span>DOCUMENTATION & SPECIFICATION</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-muted-heading mb-4">
          VANGUARD-API Documentation
        </h1>
        <p className="text-lg text-muted-body leading-relaxed">
          Learn how to verify your API domain, configure dual-user authentication profiles, and triage zero-trust authorization findings.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Sticky Scrollspy Sidebar */}
        <div className="hidden lg:block col-span-1">
          <div className="sticky top-28 space-y-1 font-mono text-xs p-4 rounded-xl bg-obsidian-card border border-white/10">
            <div className="text-[10px] text-muted-dim font-bold uppercase tracking-wider mb-3 px-2">
              ON THIS PAGE
            </div>
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`relative w-full text-left py-2 px-3 rounded transition-colors ${
                    isActive ? 'text-acid font-bold bg-acid/10' : 'text-muted-body hover:text-white'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="docs-active-marker"
                      className="absolute left-0 top-0 bottom-0 w-[2px] bg-acid shadow-[0_0_8px_rgba(163,230,53,0.8)]"
                      transition={{ duration: 0.2, ease: cyberEase }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Column */}
        <div className="lg:col-span-3 space-y-14">
          {/* Section 1: Quick Start */}
          <section id="getting-started" className="hud-frame glass-panel rounded-2xl p-8 border-white/10">
            <div className="flex items-center gap-2.5 text-acid font-mono text-xs font-bold uppercase mb-2">
              <Terminal className="w-4 h-4" />
              <span>Getting Started in 3 Minutes</span>
            </div>
            <h2 className="text-2xl font-bold text-muted-heading mb-4">
              1. Register and Verify Your Target
            </h2>
            <p className="text-sm text-muted-body mb-6 leading-relaxed">
              Due to our zero-trust safety constraints, you must prove control of your domain before any scan can be scheduled.
            </p>

            <div className="space-y-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-[#111114] border border-white/10">
                <span className="text-acid font-bold">Step 1:</span> Create an account or sign in to your dashboard.
              </div>
              <div className="p-4 rounded-xl bg-[#111114] border border-white/10">
                <span className="text-acid font-bold">Step 2:</span> Enter your API Base URL (e.g. <code className="text-white">https://api.yourdomain.com</code>) and OpenAPI Spec URL.
              </div>
              <div className="p-4 rounded-xl bg-[#111114] border border-white/10">
                <span className="text-acid font-bold">Step 3:</span> Add the generated verification token to your DNS records or upload a verification file to your server.
              </div>
            </div>
          </section>

          {/* Section 2: Verification Protocols */}
          <section id="verification" className="hud-frame glass-panel rounded-2xl p-8 border-white/10">
            <div className="flex items-center gap-2.5 text-warn-amber font-mono text-xs font-bold uppercase mb-2">
              <Lock className="w-4 h-4" />
              <span>Ownership Verification Protocol</span>
            </div>
            <h2 className="text-2xl font-bold text-muted-heading mb-4">
              2. Mandatory Ownership Verification
            </h2>
            <p className="text-sm text-muted-body mb-6 leading-relaxed">
              VANGUARD-API offers two non-intrusive methods to verify domain ownership. Verification takes under 60 seconds.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-[#111114] border border-white/10">
                <h3 className="text-base font-bold text-muted-heading mb-2">Option A: DNS TXT Record</h3>
                <p className="text-xs text-muted-body mb-4">
                  Add a TXT record to your target domain through your DNS provider (Cloudflare, Route53, etc.).
                </p>
                <div className="p-3 rounded-lg bg-black/40 font-mono text-xs text-muted-dim">
                  <span className="text-white">Record:</span> @ or _vanguard-api-verify<br />
                  <span className="text-white">Type:</span> TXT<br />
                  <span className="text-white">Value:</span> vanguard_verify_a8f9c0...
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#111114] border border-white/10">
                <h3 className="text-base font-bold text-muted-heading mb-2">Option B: HTTP Well-Known File</h3>
                <p className="text-xs text-muted-body mb-4">
                  Host a static text file returning your verification token at the standard well-known location.
                </p>
                <div className="p-3 rounded-lg bg-black/40 font-mono text-xs text-muted-dim">
                  <span className="text-white">Path:</span> /.well-known/vanguard-api-verify.txt<br />
                  <span className="text-white">Status:</span> HTTP 200 OK<br />
                  <span className="text-white">Body:</span> vanguard_verify_a8f9c0...
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: OpenAPI Specs */}
          <section id="openapi" className="hud-frame glass-panel rounded-2xl p-8 border-white/10">
            <div className="flex items-center gap-2.5 text-acid font-mono text-xs font-bold uppercase mb-2">
              <FileText className="w-4 h-4" />
              <span>OpenAPI 3.0 Contract Requirements</span>
            </div>
            <h2 className="text-2xl font-bold text-muted-heading mb-4">
              3. Specification Formatting
            </h2>
            <p className="text-sm text-muted-body mb-6 leading-relaxed">
              VANGUARD-API ingests valid OpenAPI 3.0.x and 3.1.x definitions in JSON or YAML. For optimal testing, ensure:
            </p>

            <ul className="space-y-3 text-sm text-muted-body mb-6">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-acid flex-shrink-0 mt-0.5" />
                <span>Parameterized paths use curly braces (e.g. <code className="bg-black/30 px-1 py-0.5 rounded text-white font-mono">/users/&#123;id&#125;</code> or <code className="bg-black/30 px-1 py-0.5 rounded text-white font-mono">/orders/&#123;orderId&#125;</code>).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-acid flex-shrink-0 mt-0.5" />
                <span>Security schemes declare Bearer authentication (<code className="bg-black/30 px-1 py-0.5 rounded text-white font-mono">type: http, scheme: bearer</code>) or API keys.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-acid flex-shrink-0 mt-0.5" />
                <span>Responses define standard HTTP 200 schemas so the engine can accurately inspect returned DTO fields.</span>
              </li>
            </ul>

            <CodeBlock
              label="EXAMPLE OPENAPI BEARER SECURITY SCHEME"
              code={`components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
security:
  - bearerAuth: []`}
            />
          </section>

          {/* Section 4: Finding Schema & Interactive Anatomy */}
          <section id="findings-schema" className="hud-frame glass-panel rounded-2xl p-8 border-white/10 space-y-6">
            <div className="flex items-center gap-2.5 text-alert-red font-mono text-xs font-bold uppercase">
              <Shield className="w-4 h-4" />
              <span>Findings Schema Structure</span>
            </div>
            <h2 className="text-2xl font-bold text-muted-heading">
              4. Understanding Findings
            </h2>
            <p className="text-sm text-muted-body leading-relaxed">
              All reports output normalized, machine-readable findings strictly mapped to the VANGUARD-API finding schema. Explore the interactive breakdown below:
            </p>

            <FindingAnatomyCard />
          </section>

          {/* Section 5: Runnable Reproduction */}
          <section id="reproduction" className="hud-frame glass-panel rounded-2xl p-8 border-white/10">
            <div className="flex items-center gap-2.5 text-acid font-mono text-xs font-bold uppercase mb-2">
              <Terminal className="w-4 h-4" />
              <span>CLI PoC Verification</span>
            </div>
            <h2 className="text-2xl font-bold text-muted-heading mb-4">
              5. Running Reproduction Commands
            </h2>
            <p className="text-sm text-muted-body mb-4 leading-relaxed">
              Each flagged authorization bypass generates a runnable reproduction cURL command so engineers can independently verify the flaw in a single terminal keystroke:
            </p>

            <CodeBlock
              label="RUNNABLE CURL REPRODUCTION POC"
              code={`curl -X GET "https://api.yourdomain.com/v1/tenants/victim_tenant_id/invoices" \\
  -H "Authorization: Bearer <USER_A_AUTHENTICATED_TOKEN>" \\
  -H "Accept: application/json"`}
            />
          </section>
        </div>
      </div>

      <div className="mt-14 pt-8 border-t border-white/10 flex justify-between items-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-acid hover:underline font-mono text-sm"
        >
          <span>Continue to Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
