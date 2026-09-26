import React from 'react';
import type { Metadata } from 'next';
import { AlertCircle } from 'lucide-react';
import { siteConfig } from '@/site.config';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'VanguardAPI privacy policy detailing zero-tracking data handling and target security.',
};

export default function PrivacyPage() {
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
        Privacy Policy
      </h1>
      <p className="text-xs font-mono text-muted-dim uppercase mb-10">
        Last Updated: September 2026 • Effective Date: Public Beta Launch
      </p>

      <div className="space-y-8 text-sm sm:text-base text-muted-body leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-muted-heading">1. Introduction & Zero-Tracking Commitment</h2>
          <p>
            {siteConfig.legalName} (&quot;{siteConfig.name}&quot;, &quot;we&quot;, &quot;our&quot;) is committed to strict data minimization. We do not use third-party tracking pixels, behavioral advertisement trackers, or cross-site profiling cookies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-muted-heading">2. Data We Collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Account Information:</strong> When you sign up, we store your email address and authentication identifiers provided via Supabase Authentication.
            </li>
            <li>
              <strong>API Targets:</strong> Base URLs, OpenAPI schema URLs, and domain ownership tokens needed to verify control over your APIs.
            </li>
            <li>
              <strong>Vulnerability Audit Logs:</strong> Normalized findings and masked response bodies generated during authorized scans. Discovered credentials and credit cards are strictly masked before storage.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-muted-heading">3. Credential Handling</h2>
          <p>
            Test user credentials provided for cross-tenant BOLA testing are held in memory during scan execution or encrypted at rest using AES-256. We never display or log raw customer tokens or plaintext passwords.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-muted-heading">4. Data Retention & Deletion Rights</h2>
          <p>
            You retain ownership of all target and audit data. You may request immediate, permanent deletion of your account and all associated scan records at any time by contacting our security team at{' '}
            <a href={`mailto:${siteConfig.contact.securityEmail}`} className="text-acid underline">
              {siteConfig.contact.securityEmail}
            </a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-muted-heading">5. Security Infrastructure</h2>
          <p>
            All network communication is enforced over TLS 1.3 with Strict-Transport-Security (HSTS). Target databases are protected via Row Level Security (RLS) ensuring that users cannot access any data outside their authenticated identity.
          </p>
        </section>
      </div>
    </div>
  );
}
