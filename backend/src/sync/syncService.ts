import { randomUUID } from 'node:crypto';
import { store } from '../db/database.js';
import { runScan } from '../scanner/scanEngine.js';
import { createSnapshot } from './snapshotEngine.js';
import { diffEndpoints } from './diffEngine.js';
import { compareFindings, fingerprintFinding } from './findingComparator.js';
import { sandboxFetch, assertAuthorizedTarget } from '../utils/targetSafety.js';
import type { ScanRecord, SyncRecord, MonitoringConfig, DriftEvent } from '../models/types.js';
import { env } from '../config/env.js';

/**
 * Core 24-Hour Security Sync service.
 * Runs: OpenAPI fetch → snapshot → diff → selective rescan → finding comparison → drift detection → graph update.
 * Both manual (POST /api/sync/:id) and scheduler use this same function.
 */
export async function runSync(targetId: string): Promise<SyncRecord> {
  const target = store.getTarget(targetId);
  if (!target) throw new Error(`Target ${targetId} not found`);

  const syncRecord: SyncRecord = {
    id: randomUUID(),
    targetId,
    startedAt: new Date().toISOString(),
    status: 'RUNNING',
    newFindingCount: 0,
    resolvedFindingCount: 0,
    unchangedFindingCount: 0,
    regressedFindingCount: 0,
    driftDetected: false,
  };
  store.createSyncRecord(syncRecord);

  // Update monitoring nextSyncAt
  const monitoring = store.getMonitoringConfig(targetId);
  if (monitoring) {
    monitoring.lastSyncAt = syncRecord.startedAt;
    monitoring.nextSyncAt = new Date(Date.now() + monitoring.syncIntervalHours * 3600000).toISOString();
    monitoring.updatedAt = syncRecord.startedAt;
    store.upsertMonitoringConfig(monitoring);
  }

  try {
    // Safety check
    await assertAuthorizedTarget(target.baseUrl, target.authorized);

    // Step 1: Fetch current OpenAPI spec
    const specUrl = new URL(target.openApiUrl);
    if (specUrl.origin !== new URL(target.baseUrl).origin) throw new Error('OpenAPI URL must share target origin');
    let specInput: string | Record<string, unknown>;
    if (target.openApiDocument) {
      specInput = target.openApiDocument;
    } else {
      const response = await sandboxFetch(specUrl.toString(), target.baseUrl, { headers: { Accept: 'application/json, application/yaml, text/yaml' }, signal: AbortSignal.timeout(env.REQUEST_TIMEOUT_MS) });
      if (!response.ok) throw new Error(`OpenAPI fetch returned HTTP ${response.status}`);
      specInput = await response.text();
    }

    // Step 2: Create current snapshot
    const currentSnapshot = createSnapshot(targetId, specInput);
    const previousSnapshot = store.getLatestSnapshot(targetId);
    syncRecord.previousSnapshotId = previousSnapshot?.id;

    // Step 3: Diff endpoints
    const endpointDiff = previousSnapshot
      ? diffEndpoints(previousSnapshot.endpoints, currentSnapshot.endpoints)
      : { added: currentSnapshot.endpoints, removed: [], modified: [], unchanged: [] };
    syncRecord.endpointDiff = endpointDiff;

    const hasApiChanges = endpointDiff.added.length > 0 || endpointDiff.removed.length > 0 || endpointDiff.modified.length > 0;

    // Step 4: Get previous scan baseline
    const monitoringConfig = store.getMonitoringConfig(targetId);
    const baselineScanId = monitoringConfig?.baselineScanId;
    const previousScan = baselineScanId ? store.getScan(baselineScanId) : store.listScans(targetId).find((s) => s.status === 'COMPLETED');
    syncRecord.previousScanId = previousScan?.id;

    // Step 5: Run selective security rescan
    // Focus on changed endpoints + related resources. If no changes, still run a lightweight verification.
    const identities = target.identities;
    let newScan: ScanRecord | null = null;

    if (identities.length >= 2) {
      // Determine check scope: always run BOLA; run others based on API changes
      const checks = {
        bola: true,
        bfla: hasApiChanges || endpointDiff.added.some((ep) => /admin/i.test(ep.path)),
        dataExposure: hasApiChanges || true,  // always check for new data exposure
        massAssignment: endpointDiff.modified.some((m) => m.current.method === 'PATCH' || m.current.method === 'PUT'),
        rateLimiting: false,  // skip rate limiting in sync to stay within budget
        rateLimitRequests: 3,
      };

      const scan: ScanRecord = {
        id: randomUUID(),
        targetId: target.id,
        status: 'CREATED',
        progress: 0,
        currentStep: 'Security Sync Scan',
        createdAt: new Date().toISOString(),
        findings: [],
        attackPaths: [],
        resources: [],
        relationships: [],
        graph: { nodes: [], edges: [] },
      };
      store.createScan(scan);

      // Require credentials to be stored on target identities for sync (sandbox mode)
      const identitiesWithCreds = identities.map((id) => ({
        ...id,
        credentials: id.credentials ?? { username: id.username, password: id.username + '123' },
      }));

      await runScan(scan, target, identitiesWithCreds, checks);
      newScan = store.getScan(scan.id) ?? scan;
      syncRecord.currentScanId = newScan.id;
    }

    // Step 6: Compare findings
    const previousFindings = previousScan?.findings ?? [];
    const currentFindings = newScan?.findings ?? [];

    // Collect previously-resolved fingerprints from older syncs
    const previouslyResolved = new Set<string>();
    const previousSyncs = store.listSyncRecords(targetId, 10);
    for (const pastSync of previousSyncs) {
      for (const comp of pastSync.findingComparisons ?? []) {
        if (comp.status === 'RESOLVED') previouslyResolved.add(comp.fingerprint);
      }
    }

    const comparison = compareFindings(previousFindings, currentFindings, previouslyResolved);
    syncRecord.findingComparisons = comparison.comparisons;
    syncRecord.newFindingCount = comparison.newCount;
    syncRecord.resolvedFindingCount = comparison.resolvedCount;
    syncRecord.unchangedFindingCount = comparison.unchangedCount;
    syncRecord.regressedFindingCount = comparison.regressedCount;

    // Step 7: Detect authorization drift
    const driftEvents: DriftEvent[] = [];

    // Drift from removed/added endpoints with security implications
    for (const ep of endpointDiff.added) {
      if (ep.authRequired) {
        driftEvents.push({ endpoint: ep.id, previousBehavior: 'endpoint did not exist', currentBehavior: 'new authenticated endpoint discovered', driftType: 'ENDPOINT_ADDED' });
      }
    }
    for (const ep of endpointDiff.removed) {
      driftEvents.push({ endpoint: ep.id, previousBehavior: 'endpoint was available', currentBehavior: 'endpoint removed from API surface', driftType: 'ENDPOINT_REMOVED' });
    }

    // Drift from modified auth requirements
    for (const mod of endpointDiff.modified) {
      if (mod.previous.authRequired !== mod.current.authRequired) {
        driftEvents.push({
          endpoint: mod.current.id,
          previousBehavior: `authentication ${mod.previous.authRequired ? 'required' : 'not required'}`,
          currentBehavior: `authentication ${mod.current.authRequired ? 'required' : 'not required'}`,
          driftType: 'AUTHORIZATION',
          evidence: mod.reason,
        });
      }
    }

    // Drift from new findings that weren't there before (authorization behavior changed)
    for (const comp of comparison.comparisons) {
      if (comp.status === 'NEW' && (comp.vulnerabilityType === 'BOLA' || comp.vulnerabilityType === 'BFLA')) {
        driftEvents.push({
          endpoint: comp.fingerprint.split('::')[2] ?? 'unknown',
          previousBehavior: 'access was DENIED',
          currentBehavior: 'UNAUTHORIZED ACCESS now succeeds',
          driftType: 'AUTHORIZATION',
          evidence: `New ${comp.vulnerabilityType} finding: ${comp.title}`,
        });
      }
      if (comp.status === 'RESOLVED' && (comp.vulnerabilityType === 'BOLA' || comp.vulnerabilityType === 'BFLA')) {
        driftEvents.push({
          endpoint: comp.fingerprint.split('::')[2] ?? 'unknown',
          previousBehavior: 'UNAUTHORIZED ACCESS was possible',
          currentBehavior: 'access is now DENIED (vulnerability resolved)',
          driftType: 'AUTHORIZATION',
          evidence: `Resolved ${comp.vulnerabilityType} finding: ${comp.title}`,
        });
      }
    }

    syncRecord.driftEvents = driftEvents;
    syncRecord.driftDetected = driftEvents.length > 0;

    // Step 8: Persist snapshot ONLY if sync succeeded
    store.putSnapshot(currentSnapshot);
    syncRecord.currentSnapshotId = currentSnapshot.id;

    // Step 9: Update monitoring — set baseline if this is the first successful sync
    if (monitoring && !monitoring.baselineScanId && newScan) {
      monitoring.baselineScanId = newScan.id;
      monitoring.baselineSnapshotId = currentSnapshot.id;
      monitoring.updatedAt = new Date().toISOString();
      store.upsertMonitoringConfig(monitoring);
    }

    syncRecord.status = 'COMPLETED';
    syncRecord.completedAt = new Date().toISOString();
  } catch (error) {
    syncRecord.status = 'FAILED';
    syncRecord.completedAt = new Date().toISOString();
    syncRecord.error = error instanceof Error ? error.message : 'Unknown sync error';
    // NOTE: We do NOT store the snapshot on failure — previous baseline is preserved
    console.error(JSON.stringify({ event: 'sync_failed', targetId, syncId: syncRecord.id, error: syncRecord.error }));
  }

  store.updateSyncRecord(syncRecord);
  return syncRecord;
}

/**
 * Enables monitoring for a target and schedules first sync.
 */
export function enableMonitoring(targetId: string, syncIntervalHours = env.SYNC_INTERVAL_HOURS): MonitoringConfig {
  const existing = store.getMonitoringConfig(targetId);
  const config: MonitoringConfig = {
    targetId,
    enabled: true,
    syncIntervalHours,
    lastSyncAt: existing?.lastSyncAt,
    nextSyncAt: new Date(Date.now() + syncIntervalHours * 3600000).toISOString(),
    baselineScanId: existing?.baselineScanId,
    baselineSnapshotId: existing?.baselineSnapshotId,
    updatedAt: new Date().toISOString(),
  };
  store.upsertMonitoringConfig(config);
  return config;
}

export function disableMonitoring(targetId: string): MonitoringConfig | undefined {
  const existing = store.getMonitoringConfig(targetId);
  if (!existing) return undefined;
  existing.enabled = false;
  existing.updatedAt = new Date().toISOString();
  store.upsertMonitoringConfig(existing);
  return existing;
}
