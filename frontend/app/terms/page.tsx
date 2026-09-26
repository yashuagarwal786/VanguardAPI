import React from 'react';
import type { Metadata } from 'next';
import { AlertCircle } from 'lucide-react';
import { siteConfig } from '@/site.config';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions governing the use of VanguardAPI zero-trust vulnerability scanner.',
};

export default function TermsPage() {
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
        Terms of Service
      </h1>
      <p className="text-xs font-mono text-muted-dim uppercase mb-10">
        Last Updated: September 2026 • Effective Date: Public Beta Launch
      </p>

      <div className="space-y-8 text-sm sm:text-base text-muted-body leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-muted-heading">1. Acceptance of Terms</h2>
          <p>
            By accessing or using {siteConfig.name}, you agree to be legally bound by these Terms of Service. If you do not agree, you must immediately discontinue use of the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-muted-heading">2. Absolute Prohibition on Unauthorized Scanning</h2>
          <p className="p-4 rounded-xl bg-alert-red/10 border border-alert-red/30 text-red-200 text-xs sm:text-sm font-semibold">
            CRITICAL REQUIREMENT: You represent and warrant that you own or have explicit, documented authorization from the system owner to scan every API endpoint registered on this platform.
          </p>
          <p>
            You agree never to use {siteConfig.name} to conduct denial-of-service attacks, exfiltrate third-party proprietary data, or scan systems without prior written consent.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-muted-heading">3. Mandatory Ownership Verification</h2>
          <p>
            To prevent misuse, {siteConfig.name} enforces cryptographic domain ownership verification (DNS TXT or well-known HTTP file) before any scan is permitted. Attempting to bypass or spoof domain ownership verification is a material violation of these terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-muted-heading">4. Right to Suspend or Terminate Accounts</h2>
          <p>
            We reserve the right to immediately suspend or terminate any account without notice if we detect abusive behavior, suspicious scanning activity against unauthorized endpoints, or attempts to circumvent safety controls.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-muted-heading">5. Disclaimer of Warranty & Limitation of Liability</h2>
          <p>
            The software is provided &quot;as is&quot; without warranty of any kind. In no event shall {siteConfig.legalName} be liable for any indirect, incidental, or consequential damages resulting from security testing performed by users.
          </p>
        </section>
      </div>
    </div>
  );
}
