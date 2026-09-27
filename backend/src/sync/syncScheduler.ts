import { store } from '../db/database.js';
import { runSync } from './syncService.js';
import { env } from '../config/env.js';

let schedulerTimer: ReturnType<typeof setTimeout> | null = null;
let isRunning = false;

/**
 * Safe single-shot scheduler that checks for due syncs.
 * Uses nextSyncAt-based mechanism to prevent duplicate runs after server restarts.
 */
async function checkDueSyncs(): Promise<void> {
  if (isRunning) return;
  isRunning = true;
  try {
    const monitored = store.listMonitoredTargets();
    const now = Date.now();
    for (const config of monitored) {
      if (!config.nextSyncAt || new Date(config.nextSyncAt).getTime() <= now) {
        console.info(JSON.stringify({ event: 'sync_scheduled', targetId: config.targetId, reason: 'nextSyncAt reached' }));
        // Run in background — do not await all syncs sequentially
        void runSync(config.targetId).catch((error: unknown) => {
          console.error(JSON.stringify({ event: 'scheduler_sync_error', targetId: config.targetId, error: error instanceof Error ? error.message : 'unknown' }));
        });
      }
    }
  } finally {
    isRunning = false;
  }
}

/**
 * Starts the scheduler. Safe to call multiple times — won't double-schedule.
 * Check interval defaults to 1/10 of SYNC_INTERVAL_HOURS to be responsive.
 */
export function startScheduler(): void {
  if (schedulerTimer) return;  // already started
  const checkIntervalMs = Math.min(60 * 60 * 1000, Math.max(5000, env.syncIntervalMs / 10));
  console.info(JSON.stringify({ event: 'scheduler_started', checkIntervalMs, syncIntervalHours: env.SYNC_INTERVAL_HOURS }));

  const tick = () => {
    void checkDueSyncs();
    schedulerTimer = setTimeout(tick, checkIntervalMs);
  };
  schedulerTimer = setTimeout(tick, checkIntervalMs);
}

export function stopScheduler(): void {
  if (schedulerTimer) {
    clearTimeout(schedulerTimer);
    schedulerTimer = null;
  }
}
