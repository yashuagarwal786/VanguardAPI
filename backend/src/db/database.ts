import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { ScanRecord, Target, ApiSnapshot, SyncRecord, MonitoringConfig } from '../models/types.js';
import { env } from '../config/env.js';
const dbPath = resolve(env.DATABASE_PATH);
mkdirSync(dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec(`PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS targets (id TEXT PRIMARY KEY, data TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS scans (id TEXT PRIMARY KEY, target_id TEXT NOT NULL, status TEXT NOT NULL, progress INTEGER NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(target_id) REFERENCES targets(id));
CREATE INDEX IF NOT EXISTS scans_target_created ON scans(target_id, created_at DESC);
CREATE TABLE IF NOT EXISTS api_snapshots (id TEXT PRIMARY KEY, target_id TEXT NOT NULL, spec_hash TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS snapshots_target_created ON api_snapshots(target_id, created_at DESC);
CREATE TABLE IF NOT EXISTS sync_records (id TEXT PRIMARY KEY, target_id TEXT NOT NULL, status TEXT NOT NULL, data TEXT NOT NULL, started_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS syncs_target_started ON sync_records(target_id, started_at DESC);
CREATE TABLE IF NOT EXISTS monitoring_configs (target_id TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 0, data TEXT NOT NULL, updated_at TEXT NOT NULL);`);
export const store = {
  putTarget(target: Target) { db.prepare('INSERT INTO targets(id,data,created_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(target.id, JSON.stringify(target), target.createdAt); },
  getTarget(id: string): Target | undefined { const row = db.prepare('SELECT data FROM targets WHERE id=?').get(id) as { data: string } | undefined; return row ? JSON.parse(row.data) as Target : undefined; },
  listTargets(): Target[] { return (db.prepare('SELECT data FROM targets ORDER BY created_at DESC').all() as Array<{ data: string }>).map((r) => JSON.parse(r.data) as Target); },
  createScan(scan: ScanRecord) { db.prepare('INSERT INTO scans(id,target_id,status,progress,data,created_at) VALUES(?,?,?,?,?,?)').run(scan.id, scan.targetId, scan.status, scan.progress, JSON.stringify(scan), scan.createdAt); },
  getScan(id: string): ScanRecord | undefined { const row = db.prepare('SELECT data FROM scans WHERE id=?').get(id) as { data: string } | undefined; return row ? JSON.parse(row.data) as ScanRecord : undefined; },
  listScans(targetId?: string): ScanRecord[] { const rows = targetId ? db.prepare('SELECT data FROM scans WHERE target_id=? ORDER BY created_at DESC').all(targetId) : db.prepare('SELECT data FROM scans ORDER BY created_at DESC').all(); return (rows as Array<{ data: string }>).map((r) => JSON.parse(r.data) as ScanRecord); },
  updateScan(scan: ScanRecord) { db.prepare('UPDATE scans SET status=?, progress=?, data=? WHERE id=?').run(scan.status, scan.progress, JSON.stringify(scan), scan.id); },
  // Snapshots
  putSnapshot(snapshot: ApiSnapshot) { db.prepare('INSERT INTO api_snapshots(id,target_id,spec_hash,data,created_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data').run(snapshot.id, snapshot.targetId, snapshot.specHash, JSON.stringify(snapshot), snapshot.createdAt); },
  getSnapshot(id: string): ApiSnapshot | undefined { const row = db.prepare('SELECT data FROM api_snapshots WHERE id=?').get(id) as { data: string } | undefined; return row ? JSON.parse(row.data) as ApiSnapshot : undefined; },
  getLatestSnapshot(targetId: string): ApiSnapshot | undefined { const row = db.prepare('SELECT data FROM api_snapshots WHERE target_id=? ORDER BY created_at DESC LIMIT 1').get(targetId) as { data: string } | undefined; return row ? JSON.parse(row.data) as ApiSnapshot : undefined; },
  listSnapshots(targetId: string): ApiSnapshot[] { return (db.prepare('SELECT data FROM api_snapshots WHERE target_id=? ORDER BY created_at DESC').all(targetId) as Array<{ data: string }>).map((r) => JSON.parse(r.data) as ApiSnapshot); },
  // Sync records
  createSyncRecord(rec: SyncRecord) { db.prepare('INSERT INTO sync_records(id,target_id,status,data,started_at) VALUES(?,?,?,?,?)').run(rec.id, rec.targetId, rec.status, JSON.stringify(rec), rec.startedAt); },
  updateSyncRecord(rec: SyncRecord) { db.prepare('UPDATE sync_records SET status=?, data=? WHERE id=?').run(rec.status, JSON.stringify(rec), rec.id); },
  getSyncRecord(id: string): SyncRecord | undefined { const row = db.prepare('SELECT data FROM sync_records WHERE id=?').get(id) as { data: string } | undefined; return row ? JSON.parse(row.data) as SyncRecord : undefined; },
  listSyncRecords(targetId: string, limit = 30): SyncRecord[] { return (db.prepare('SELECT data FROM sync_records WHERE target_id=? ORDER BY started_at DESC LIMIT ?').all(targetId, limit) as Array<{ data: string }>).map((r) => JSON.parse(r.data) as SyncRecord); },
  getLatestSyncRecord(targetId: string): SyncRecord | undefined { const row = db.prepare('SELECT data FROM sync_records WHERE target_id=? ORDER BY started_at DESC LIMIT 1').get(targetId) as { data: string } | undefined; return row ? JSON.parse(row.data) as SyncRecord : undefined; },
  // Monitoring
  getMonitoringConfig(targetId: string): MonitoringConfig | undefined { const row = db.prepare('SELECT data FROM monitoring_configs WHERE target_id=?').get(targetId) as { data: string } | undefined; return row ? JSON.parse(row.data) as MonitoringConfig : undefined; },
  upsertMonitoringConfig(config: MonitoringConfig) { db.prepare('INSERT INTO monitoring_configs(target_id,enabled,data,updated_at) VALUES(?,?,?,?) ON CONFLICT(target_id) DO UPDATE SET enabled=excluded.enabled, data=excluded.data, updated_at=excluded.updated_at').run(config.targetId, config.enabled ? 1 : 0, JSON.stringify(config), config.updatedAt); },
  listMonitoredTargets(): MonitoringConfig[] { return (db.prepare('SELECT data FROM monitoring_configs WHERE enabled=1').all() as Array<{ data: string }>).map((r) => JSON.parse(r.data) as MonitoringConfig); },
  close() { db.close(); },
};

