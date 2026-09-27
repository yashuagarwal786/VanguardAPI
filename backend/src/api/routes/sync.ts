import { Router } from 'express';
import { store } from '../../db/database.js';
import { runSync, enableMonitoring, disableMonitoring } from '../../sync/syncService.js';
import { env } from '../../config/env.js';

export const syncRouter = Router();

// POST /api/sync/:targetId — Trigger manual sync
syncRouter.post('/:targetId', async (req, res) => {
  const target = store.getTarget(req.params.targetId);
  if (!target) return res.status(404).json({ error: 'Target not found' });

  // Check if sync is already running
  const latest = store.getLatestSyncRecord(req.params.targetId);
  if (latest?.status === 'RUNNING') {
    return res.status(409).json({ error: 'Sync already in progress', syncId: latest.id });
  }

  // Kick off async
  void runSync(req.params.targetId).catch((e: unknown) => {
    console.error(JSON.stringify({ event: 'manual_sync_error', targetId: req.params.targetId, error: e instanceof Error ? e.message : 'unknown' }));
  });

  const syncId = store.getLatestSyncRecord(req.params.targetId)?.id ?? 'pending';
  return res.status(202).json({ message: 'Sync started', syncId, statusUrl: `/api/sync/${req.params.targetId}/status` });
});

// GET /api/sync/:targetId/status — Latest sync status + monitoring config
syncRouter.get('/:targetId/status', (req, res) => {
  const target = store.getTarget(req.params.targetId);
  if (!target) return res.status(404).json({ error: 'Target not found' });
  const latest = store.getLatestSyncRecord(req.params.targetId);
  const monitoring = store.getMonitoringConfig(req.params.targetId);
  return res.json({
    targetId: req.params.targetId,
    monitoring: monitoring ?? { targetId: req.params.targetId, enabled: false, syncIntervalHours: env.SYNC_INTERVAL_HOURS, updatedAt: new Date().toISOString() },
    latestSync: latest ?? null,
  });
});

// GET /api/sync/:targetId/history — Sync history
syncRouter.get('/:targetId/history', (req, res) => {
  const target = store.getTarget(req.params.targetId);
  if (!target) return res.status(404).json({ error: 'Target not found' });
  const limit = typeof req.query.limit === 'string' ? Math.min(50, parseInt(req.query.limit, 10) || 30) : 30;
  const history = store.listSyncRecords(req.params.targetId, limit);
  return res.json({ targetId: req.params.targetId, history });
});

// GET /api/sync/:targetId/:syncId — Single sync record
syncRouter.get('/:targetId/:syncId', (req, res) => {
  const rec = store.getSyncRecord(req.params.syncId);
  if (!rec || rec.targetId !== req.params.targetId) return res.status(404).json({ error: 'Sync record not found' });
  return res.json({ sync: rec });
});

// POST /api/sync/:targetId/enable — Enable monitoring
syncRouter.post('/:targetId/enable', (req, res) => {
  const target = store.getTarget(req.params.targetId);
  if (!target) return res.status(404).json({ error: 'Target not found' });
  const hours = typeof req.body?.syncIntervalHours === 'number' ? req.body.syncIntervalHours : env.SYNC_INTERVAL_HOURS;
  const config = enableMonitoring(req.params.targetId, hours);
  return res.json({ message: 'Monitoring enabled', config });
});

// POST /api/sync/:targetId/disable — Disable monitoring
syncRouter.post('/:targetId/disable', (req, res) => {
  const target = store.getTarget(req.params.targetId);
  if (!target) return res.status(404).json({ error: 'Target not found' });
  const config = disableMonitoring(req.params.targetId);
  return res.json({ message: 'Monitoring disabled', config });
});
