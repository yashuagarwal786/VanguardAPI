import React from 'react';
import type { Metadata } from 'next';
import { AlertCircle, Shield, CheckCircle, XCircle } from 'lucide-react';
import { siteConfig } from '@/site.config';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy',
  description: 'Standards and ethical obligations for scanning APIs with VanguardAPI.',
};

export default function AcceptableUsePage() {
  return (
    <div className="pt-32 pb-24 max-w-4xl mx-auto px-6">
      {/* Mandatory Legal Review Banner */}
      <div className="mb-10 p-4 rounded-xl bg-warn-amber/15 border border-warn-amber/40 text-amber-200 text-xs sm:text-sm flex items-start gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-warn-amber mt-0.5" />
        <div>
          <strong className="text-white">Notice:</strong> Draft: review with a legal professional before launch.
        </div>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-muted-heading mb-3">
        Acceptable Use Policy (AUP)
      </h1>
      <p className="text-xs font-mono text-muted-dim uppercase mb-10">
        Last Updated: September 2026 • Strict Zero-Tolerance Ethical Guideline
      </p>

      <div className="space-y-8 text-sm sm:text-base text-muted-body leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-muted-heading">1. Purpose & Scope</h2>
          <p>
            {siteConfig.name} is built to empower software engineers and authorized security researchers to discover authorization flaws and data exposures before malicious threat actors can exploit them.
          </p>
        </section>

        {/* Permitted vs Prohibited */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-8">
          <div className="p-6 rounded-2xl bg-acid/5 border border-acid/20 space-y-4">
            <div className="flex items-center gap-2 text-acid font-bold">
              <CheckCircle className="w-5 h-5" />
              <span>Permitted Use Cases</span>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-lime-200">
              <li>• Auditing APIs deployed in internal development, staging, or production sandboxes that you own.</li>
              <li>• Scanning client systems where explicit, written authorization and rules of engagement (RoE) have been executed.</li>
              <li>• Automated CI/CD pull-request gating within authorized repositories.</li>
              <li>• Academic and security laboratory research against dedicated local loopback sandboxes.</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl bg-alert-red/5 border border-alert-red/20 space-y-4">
            <div className="flex items-center gap-2 text-alert-red font-bold">
              <XCircle className="w-5 h-5" />
              <span>Strictly Prohibited</span>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-red-200">
              <li>• Scanning any API endpoint without written permission from the system owner.</li>
              <li>• Exploiting or retaining customer data discovered during unauthorized audits.</li>
              <li>• Performing volumetric Denial-of-Service (DoS) or destructive state-mutation attacks.</li>
              <li>• Spoofing DNS TXT or well-known ownership verification tokens.</li>
            </ul>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-muted-heading">2. Bounded Burst Compliance</h2>
          <p>
            Rate-limiting evaluations must be configured using bounded bursts (default maximum 30-50 requests per endpoint). Overriding burst thresholds to cause network degradation or system disruption violates this policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-muted-heading">3. Violations & Enforcement</h2>
          <p>
            Violations of this Acceptable Use Policy will result in immediate termination of service and blacklisting of associated target domains. In cases of intentional malicious exploitation, we cooperate fully with law enforcement authorities.
          </p>
        </section>
      </div>
    </div>
  );
}
