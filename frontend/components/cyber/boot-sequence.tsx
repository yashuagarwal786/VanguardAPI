'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

const BOOT_LINES = [
  'initializing vanguard-api core v3.2.0...',
  'mounting zero-trust authorization pipeline...',
  'ingesting openapi 3.0 contract parser...',
  'threat map active. telemetry calibrated.',
];

export default function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 1. Accessibility: check prefers-reduced-motion
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasBooted = sessionStorage.getItem('vanguard_boot_completed');

    // 2. Performance: check Save-Data or slow connection
    // @ts-expect-error navigator.connection may be undefined in standard TS
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const isSlowConnection = connection && (connection.saveData || ['slow-2g', '2g', '3g'].includes(connection.effectiveType));

    if (reducedMotion || hasBooted || isSlowConnection) {
      onComplete();
      return;
    }

    setVisible(true);

    // Strictly under 1 second: 4 lines at 190ms interval = ~760ms total
    const interval = setInterval(() => {
      setCurrentLineIndex((prev) => {
        if (prev + 1 >= BOOT_LINES.length) {
          clearInterval(interval);
          setTimeout(() => {
            sessionStorage.setItem('vanguard_boot_completed', 'true');
            setVisible(false);
            onComplete();
          }, 180);
          return prev;
        }
        return prev + 1;
      });
    }, 190);

    const handleSkip = () => {
      clearInterval(interval);
      sessionStorage.setItem('vanguard_boot_completed', 'true');
      setVisible(false);
      onComplete();
    };

    window.addEventListener('keydown', handleSkip);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleSkip);
    };
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div
      onClick={() => {
        sessionStorage.setItem('vanguard_boot_completed', 'true');
        setVisible(false);
        onComplete();
      }}
      className="fixed inset-0 z-50 bg-[#0a0a0b]/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
      aria-label="Click or press any key to skip boot sequence"
    >
      <div className="absolute inset-0 scanline-overlay pointer-events-none opacity-40" />

      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-lg w-full bg-[#111114] border border-white/15 rounded-xl p-6 shadow-2xl relative hud-frame font-mono text-xs cursor-default"
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 text-muted-dim">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-alert-red/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-warn-amber/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-terminal/80" />
            </div>
            <span className="text-[11px] text-muted-body ml-2">vanguard@soc-terminal:~</span>
          </div>
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem('vanguard_boot_completed', 'true');
              setVisible(false);
              onComplete();
            }}
            className="text-[10px] text-muted-dim hover:text-terminal transition-colors uppercase border border-white/10 px-2 py-0.5 rounded flex items-center gap-1"
          >
            <span>Skip [Esc]</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </button>
        </div>

        {/* Boot output */}
        <div className="space-y-1.5 min-h-[90px]">
          {BOOT_LINES.slice(0, currentLineIndex + 1).map((line, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-terminal select-none">&gt;</span>
              <span className={idx === currentLineIndex ? 'text-white' : 'text-muted-body'}>
                {line}
              </span>
              {idx === currentLineIndex && <span className="terminal-cursor" />}
            </div>
          ))}
        </div>

        {/* Telemetry footer */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-muted-dim">
          <span className="text-terminal font-bold">VANGUARD-API SOC V3.2</span>
          <span>BOOT SEQUENCE (&lt;1s)</span>
        </div>
      </div>
    </div>
  );
}
