import { api } from './client';
import type { SyncRecord, MonitoringConfig } from './types';

export interface SyncStatusPayload {
  targetId: string;
  monitoring: MonitoringConfig;
  latestSync: SyncRecord | null;
}

export async function getSyncStatus(targetId: string): Promise<SyncStatusPayload> {
  return api<SyncStatusPayload>(`/sync/${encodeURIComponent(targetId)}/status`);
}

export async function triggerSync(targetId: string): Promise<{ message: string; syncId: string; statusUrl: string }> {
  return api<{ message: string; syncId: string; statusUrl: string }>(`/sync/${encodeURIComponent(targetId)}`, {
    method: 'POST',
  });
}

export async function getSyncHistory(targetId: string, limit = 30): Promise<{ targetId: string; history: SyncRecord[] }> {
  return api<{ targetId: string; history: SyncRecord[] }>(`/sync/${encodeURIComponent(targetId)}/history?limit=${limit}`);
}

export async function getSyncRecord(targetId: string, syncId: string): Promise<{ sync: SyncRecord }> {
  return api<{ sync: SyncRecord }>(`/sync/${encodeURIComponent(targetId)}/${encodeURIComponent(syncId)}`);
}

export async function enableMonitoring(targetId: string, syncIntervalHours = 24): Promise<{ message: string; config: MonitoringConfig }> {
  return api<{ message: string; config: MonitoringConfig }>(`/sync/${encodeURIComponent(targetId)}/enable`, {
    method: 'POST',
    body: JSON.stringify({ syncIntervalHours }),
  });
}

export async function disableMonitoring(targetId: string): Promise<{ message: string; config?: MonitoringConfig }> {
  return api<{ message: string; config?: MonitoringConfig }>(`/sync/${encodeURIComponent(targetId)}/disable`, {
    method: 'POST',
  });
}

export async function triggerSyncNow(targetId: string): Promise<{ message: string; statusUrl: string }> {
  return api<{ message: string; statusUrl: string }>(`/sync/${encodeURIComponent(targetId)}/run-now`, {
    method: 'POST',
  });
}

export async function simulateBenchmarkSync(targetId: string): Promise<{ message: string; sync: SyncRecord }> {
  return api<{ message: string; sync: SyncRecord }>(`/sync/${encodeURIComponent(targetId)}/simulate-benchmark`, {
    method: 'POST',
  });
}

