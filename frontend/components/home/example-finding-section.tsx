'use client';

import React, { useState } from 'react';
import { Terminal, Copy, Check, Shield, AlertCircle } from 'lucide-react';
import DecodeText from '@/components/cyber/decode-text';

export default function ExampleFindingSection() {
  const [copied, setCopied] = useState(false);

  const curlRepro = `curl -X GET "https://api.yourdomain.com/v1/orders/102" \\
  -H "Authorization: Bearer eyJhbGci...[redacted]" \\
  -H "Accept: application/json"`;

  const handleCopy = () => {
    navigator.clipboard.writeText(curlRepro).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section className="py-24 border-t border-white/10 bg-transparent">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-center gap-2 text-alert-red font-mono text-xs font-bold uppercase tracking-wider mb-3">
          <Terminal className="w-4 h-4 text-alert-red" />
          <span>[ 04 / FINDINGS ] — SECURITY ADVISORY SPECIFICATION</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-muted-heading mb-4">
          <DecodeText text="Real proof, ready for immediate triage." as="span" />
        </h2>

        <p className="text-base sm:text-lg text-muted-body max-w-2xl mb-12 font-mono text-sm">
          Every report generates reproducible command-line verification scripts and pinpoint remediation recommendations.
        </p>

        {/* Panel Clearly Labelled as "Example finding" with Terminal Window Bar & HUD Frame */}
        <div className="glass-panel-elevated rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.7)] border-white/15 hud-frame hud-frame-danger">
          {/* Terminal Window Header Bar */}
          <div className="flex items-center justify-between px-6 py-3 bg-[#111114] border-b border-white/10 font-mono text-xs text-muted-dim">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-alert-red" />
                <div className="w-2.5 h-2.5 rounded-full bg-warn-amber" />
                <div className="w-2.5 h-2.5 rounded-full bg-terminal" />
              </div>
              <span className="text-muted-body text-[11px] ml-2">vanguard@security-advisory:~/BOLA-2026-001</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-alert-red/20 text-red-200 border border-alert-red/40">
                CRITICAL SEVERITY
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-muted-body border border-white/10">
                EXAMPLE FINDING
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-white/10 mb-6">
              <div className="font-mono text-xs text-terminal bg-terminal/10 border border-terminal/20 px-3 py-1 rounded-md">
                GET /v1/orders/&#123;id&#125;
              </div>
              <span className="font-mono text-xs text-muted-dim">CVSS v3.1: 8.6 (HIGH)</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold font-mono text-muted-heading mb-3">
              Broken Object Level Authorization (BOLA) in Order Lookup
            </h3>

            <p className="text-sm text-muted-body leading-relaxed mb-6 font-mono text-xs">
              User A successfully retrieved User B’s private order record (ID: 102) using their own valid authentication token. In a zero-trust model, users must strictly only query resources linked directly to their authenticated session context.
            </p>

            {/* Masked Evidence Box */}
            <div className="mb-6 rounded-xl bg-[#0e0e11] border border-white/10 p-4 font-mono text-xs">
              <div className="text-muted-dim text-[11px] uppercase tracking-wider mb-2 font-bold flex justify-between">
                <span>&gt; Masked Evidence Payload (Cross-Tenant Leak)</span>
                <span className="text-[10px] text-muted-dim">SIMULATION</span>
              </div>
              <div className="text-muted-body leading-relaxed">
                &#123;<br />
                &nbsp;&nbsp;&quot;order_id&quot;: 102,<br />
                &nbsp;&nbsp;&quot;user_id&quot;: 48,<br />
                &nbsp;&nbsp;&quot;customer&quot;: &quot;target-user@internal-tenant.org&quot;,<br />
                &nbsp;&nbsp;&quot;card_number&quot;: &quot;<span className="text-alert-red font-bold">4242...[redacted]...4242</span>&quot;,<br />
                &nbsp;&nbsp;&quot;amount&quot;: 649.00<br />
                &#125;
              </div>
            </div>

            {/* Runnable cURL reproduction in Terminal Window */}
            <div className="mb-6 rounded-xl bg-[#0e0e11] border border-white/10 overflow-hidden font-mono">
              <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/10 text-xs text-muted-dim">
                <span>Proof-of-Concept cURL Command</span>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-terminal" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-4 font-mono text-xs text-muted-heading overflow-x-auto leading-relaxed">
                <code>{curlRepro}</code>
              </pre>
            </div>

            {/* Concrete Fix Box */}
            <div className="rounded-xl bg-terminal/5 border border-terminal/25 p-4 sm:p-5 flex items-start gap-3.5 text-xs sm:text-sm text-lime-200 font-mono">
              <Shield className="w-5 h-5 flex-shrink-0 text-terminal mt-0.5" />
              <div>
                <strong className="text-terminal">&gt; REMEDIATION SPECIFICATION:</strong> Enforce database ownership validation inside the controller layer. Before executing the query, ensure that <code className="bg-black/40 px-1.5 py-0.5 rounded text-white font-mono">auth_user.id === requested_order.user_id</code>. Reject mismatched lookups with HTTP 403 Forbidden.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
