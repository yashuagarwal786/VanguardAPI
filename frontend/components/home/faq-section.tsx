'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Why is domain ownership verification strictly mandatory before scanning?',
      a: 'Zero-trust security requires accountability. To prevent VanguardAPI from ever being turned into an attack tool against third-party systems, users must prove domain control via either a DNS TXT record or a /.well-known verification file. Only confirmed targets can be audited.',
    },
    {
      q: 'Why does VanguardAPI require credentials for two test accounts?',
      a: 'BOLA (Broken Object Level Authorization) cannot be accurately tested with a single user or without credentials. By logging into two isolated sandbox accounts (User A and User B), the engine determines whether User A can read User B’s private resources. This approach eliminates the high false-positive rate of generic unauthenticated vulnerability scanners.',
    },
    {
      q: 'Are my test credentials or session tokens stored on your servers?',
      a: 'Never in plain text. Session tokens are held ephemerally in memory during active scans. When test credentials are configured for automated recurring checks, they are encrypted server-side using AES-256 before persistence. Discovered tokens in reports are always masked (e.g. Bearer eyJ...[redacted]).',
    },
    {
      q: 'Can VanguardAPI run inside CI/CD pipelines to block vulnerable PRs?',
      a: 'Yes. The VanguardAPI CLI engine includes a --fail-on flag (e.g. --fail-on high), which exits with a non-zero exit code if high-severity authorization flaws or unmasked card exposures are detected, cleanly failing the build in GitHub Actions, GitLab CI, or CircleCI.',
    },
    {
      q: 'Will the scanner overwhelm or degrade my API server?',
      a: 'No. VanguardAPI enforces bounded request bursts (maximum 30-50 requests per endpoint during rate-limit evaluations) and low concurrency to ensure your sandbox or staging environments remain fully operational throughout the audit.',
    },
    {
      q: 'What versions of API specifications do you support?',
      a: 'We natively ingest OpenAPI 3.0 and 3.1 JSON or YAML definitions, whether served via public URL or uploaded directly from your local filesystem.',
    },
  ];

  return (
    <section className="py-24 border-t border-white/10 bg-transparent">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center gap-2 text-acid font-mono text-xs font-bold uppercase tracking-wider mb-3">
          <HelpCircle className="w-4 h-4" />
          <span>Frequently Asked Questions</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-muted-heading mb-4">
          Everything you need to know.
        </h2>

        <p className="text-base sm:text-lg text-muted-body mb-12">
          Clear answers regarding zero-trust authorization audits, domain ownership verification, and security guarantees.
        </p>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.q}
                className="glass-panel rounded-xl overflow-hidden border-white/10 transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-muted-heading text-base hover:text-white"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-body transition-transform duration-200 flex-shrink-0 ${
                      isOpen ? 'rotate-180 text-acid' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-muted-body leading-relaxed border-t border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
