'use client';

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { pageTransitionVariants, MOTION_CONFIG } from '@/lib/motion';

export default function Template({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !MOTION_CONFIG.enabled || shouldReduceMotion) {
    return <div className="flex-1 flex flex-col w-full min-h-[calc(100vh-4.5rem)]">{children}</div>;
  }

  return (
    <motion.div
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex-1 flex flex-col w-full min-h-[calc(100vh-4.5rem)]"
    >
      {children}
    </motion.div>
  );
}
