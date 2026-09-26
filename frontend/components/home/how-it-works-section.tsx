'use client';

import React from 'react';
import { FileCode, UserCheck, ShieldCheck, TerminalSquare } from 'lucide-react';
import DecodeText from '@/components/cyber/decode-text';

export default function HowItWorksSection() {
  const steps = [
    {
      num: '01',
      icon: FileCode,
      codeName: '01 INGEST SPEC',
      progress: '100%',
      description:
        'VanguardAPI parses your OpenAPI 3.0 contract, automatically mapping route templates, parameterized path identifiers, and security requirements.',
    },
    {
      num: '02',
      icon: UserCheck,
      codeName: '02 AUTHENTICATE x2',
      progress: '100%',
      description:
        'The scanner connects to your auth endpoint and provisions isolated session tokens for two separate test accounts (User A and User B).',
    },
    {
      num: '03',
      icon: ShieldCheck,
      codeName: '03 CROSS-CHECK',
      progress: '100%',
      description:
        'User A requests User B’s private identifiers. The engine compares responses, flagging a flaw only when User A receives User B’s genuine record.',
    },
    {
      num: '04',
      icon: TerminalSquare,
      codeName: '04 REPORT',
      progress: '100%',
      description:
        'Emits clean, severity-ranked findings with masked proof-of-concept cURL commands and concrete data-layer ownership remediation code.',
    },
  ];

  return (
    <section className="py-24 border-t border-white/10 bg-transparent">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-2 text-terminal font-mono text-xs font-bold uppercase tracking-wider mb-3">
          <TerminalSquare className="w-4 h-4 text-terminal" />
          <span>[ 03 / HOW IT WORKS ] — ZERO-TRUST PIPELINE STATIONS</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-muted-heading mb-4">
          <DecodeText text="Four steps. Absolute precision." as="span" />
        </h2>

        <p className="text-base sm:text-lg text-muted-body max-w-2xl mb-14 font-mono text-sm">
          No manual test scripts or complex proxy setup. Provide your OpenAPI spec and two test accounts to run a comprehensive zero-trust audit.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="glass-panel rounded-xl p-6 relative overflow-hidden flex flex-col justify-between hud-frame"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-3xl font-extrabold text-terminal/30">
                      {step.num}
                    </span>
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-terminal">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="text-xs font-mono font-bold text-terminal uppercase tracking-wider mb-1">
                    {step.codeName}
                  </div>

                  <p className="text-sm text-muted-body leading-relaxed mb-6 font-mono text-xs">
                    {step.description}
                  </p>
                </div>

                {/* Simulated Progress Bar */}
                <div className="pt-3 border-t border-white/10">
                  <div className="flex justify-between items-center text-[10px] font-mono text-muted-dim mb-1">
                    <span>STATION CALIBRATION</span>
                    <span className="text-terminal">READY</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-terminal w-full" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
