'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Terminal } from 'lucide-react';
import AmbientBackground from '@/components/cyber/ambient-background';

export default function NotFound() {
  const [typedTitle, setTypedTitle] = useState('');
  const fullTitle = '404: endpoint not found';

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= fullTitle.length) {
        setTypedTitle(fullTitle.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 45);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center px-6">
      <AmbientBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-lg w-full bg-[#111114] border border-white/15 rounded-2xl overflow-hidden shadow-2xl hud-frame hud-frame-danger font-mono"
      >
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#0a0a0b] border-b border-white/10 text-xs text-muted-dim">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-alert-red animate-pulse" />
              <div className="w-2.5 h-2.5 rounded-full bg-warn-amber" />
              <div className="w-2.5 h-2.5 rounded-full bg-terminal" />
            </div>
            <span className="text-[11px] text-muted-body ml-2">vanguard@router:~</span>
          </div>
          <span className="text-[10px] text-alert-red font-bold">STATUS 404</span>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-alert-red text-xs">
              <Terminal className="w-4 h-4" />
              <span>ERR_ROUTE_UNDEFINED</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-muted-heading flex items-center">
              <span>{typedTitle}</span>
              <span className="terminal-cursor bg-alert-red" />
            </h1>
            <p className="text-xs text-muted-body leading-relaxed">
              &gt; The requested URI path does not match any valid endpoint template in the VanguardAPI OpenAPI contract schema.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-black/60 border border-white/10 text-xs text-muted-dim space-y-1">
            <div><span className="text-terminal">$</span> curl -I https://vanguard-api.io/path</div>
            <div className="text-alert-red">HTTP/2 404 Not Found</div>
            <div>server: vanguard-edge-proxy</div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-acid hover:bg-acid-hover text-obsidian font-bold text-xs shadow-[0_2px_12px_rgba(163,230,53,0.3)] transition-all uppercase"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>&gt; Return to Command Console</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
