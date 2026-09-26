'use client';

import React from 'react';
import { KeyRound, AlertTriangle, ArrowRight, ShieldX } from 'lucide-react';
import DecodeText from '@/components/cyber/decode-text';

export default function ProblemSection() {
  return (
    <section className="py-24 border-t border-white/10 bg-transparent relative">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Tag */}
        <div className="flex items-center gap-2 text-alert-red font-mono text-xs font-bold uppercase tracking-wider mb-3">
          <AlertTriangle className="w-4 h-4 text-alert-red" />
          <span>[ 01 / THE PROBLEM ] — BROKEN OBJECT LEVEL AUTHORIZATION</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-muted-heading mb-4">
          <DecodeText text="Like a hotel keycard that opens every room." as="span" />
        </h2>

        <p className="text-base sm:text-lg text-muted-body max-w-2xl mb-12 font-mono text-sm">
          Gateways authenticate identity at the door, but backend handlers frequently fail to check record ownership at the data layer. Any valid session token can harvest unauthorized customer records.
        </p>

        {/* Concrete Split Scenario Card with Terminal Window Header & HUD Frame */}
        <div className="glass-panel-elevated rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.7)] border-white/15 hud-frame hud-frame-danger">
          {/* Terminal Title Bar */}
          <div className="flex items-center justify-between px-6 py-3 bg-[#111114] border-b border-white/10 font-mono text-xs text-muted-dim">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-alert-red" />
                <div className="w-2.5 h-2.5 rounded-full bg-warn-amber" />
                <div className="w-2.5 h-2.5 rounded-full bg-terminal" />
              </div>
              <span className="text-muted-body text-[11px] ml-2">vanguard@identity-lane-inspection:~</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-alert-red/20 text-alert-red border border-alert-red/30">
                ACCESS CONTROL FAILED
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-white/10 text-muted-body">
                SIMULATION
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Alice Request */}
              <div className="rounded-xl bg-[#0e0e11] border border-white/10 p-5 font-mono text-xs space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span className="text-terminal font-bold uppercase">&gt; CALLER CONTEXT: TENANT A (PRIMARY)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-muted-body border border-white/10">
                    TARGET: /orders/102
                  </span>
                </div>

                <div className="text-muted-body leading-relaxed">
                  <span className="text-acid font-bold">GET</span> /orders/<span className="text-alert-red font-bold">102</span> HTTP/1.1<br />
                  <span className="text-muted-dim">Host:</span> api.production-store.com<br />
                  <span className="text-muted-dim">Authorization:</span> Bearer eyJhbGciOi...[Caller A Valid Token]<br />
                  <span className="text-muted-dim">Accept:</span> application/json
                </div>

                <div className="pt-2 text-[11px] text-muted-dim italic">
                  Notice: Caller legitimately owns Order #101, but mutates the ID parameter to #102.
                </div>
              </div>

              {/* Leaked Bob Data */}
              <div className="rounded-xl bg-[#0e0e11] border border-alert-red/40 p-5 font-mono text-xs space-y-3 shadow-[0_0_20px_rgba(255,59,71,0.15)]">
                <div className="flex justify-between items-center pb-2 border-b border-white/10">
                  <span className="text-alert-red font-bold uppercase">&gt; BREACHED ENTITY: TENANT B (VICTIM)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-acid/20 text-acid border border-acid/30">
                    HTTP 200 OK
                  </span>
                </div>

                <div className="text-muted-body leading-relaxed">
                  &#123;<br />
                  &nbsp;&nbsp;&quot;order_id&quot;: 102,<br />
                  &nbsp;&nbsp;&quot;customer_email&quot;: &quot;<span className="text-alert-red font-bold">target-victim@tenant-b.internal</span>&quot;,<br />
                  &nbsp;&nbsp;&quot;card_number&quot;: &quot;<span className="text-alert-red font-bold">4242...[redacted]...4242</span>&quot;,<br />
                  &nbsp;&nbsp;&quot;amount_usd&quot;: 649.00<br />
                  &#125;
                </div>

                <div className="pt-2 text-[11px] text-alert-red font-semibold flex items-center gap-1.5">
                  <ShieldX className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Breach: The server authenticated Caller A, but returned Tenant B&apos;s private financial data.</span>
                </div>
              </div>
            </div>

            {/* Hotel Analogy Explainer Bar */}
            <div className="flex items-start sm:items-center gap-3 p-4 rounded-xl bg-warn-amber/10 border border-warn-amber/30 text-amber-200 text-xs sm:text-sm font-mono">
              <KeyRound className="w-5 h-5 flex-shrink-0 text-warn-amber mt-0.5 sm:mt-0" />
              <div>
                <strong>The BOLA Flaw Explained:</strong> The authentication gate passed Caller A because the token was valid. However, the backend handler <code className="bg-black/40 px-1 py-0.5 rounded text-white">SELECT * FROM orders WHERE id = 102</code> failed to assert that <code className="bg-black/40 px-1 py-0.5 rounded text-white">owner_tenant_id === caller.tenant_id</code>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
