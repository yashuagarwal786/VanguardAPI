'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  ArrowRight, 
  FileCode2, 
  Sliders,
  History,
  Activity,
  Zap,
  Sparkles,
  Route,
  Network,
  X,
  ExternalLink
} from 'lucide-react';
import type { Target, SyncRecord, MonitoringConfig } from '@/lib/api/types';
import { 
  getSyncStatus, 
  triggerSync, 
  enableMonitoring, 
  disableMonitoring, 
  getSyncHistory,
  simulateBenchmarkSync
} from '@/lib/api/sync';

interface SecuritySyncPanelProps {
  targets: Target[];
  onSyncComplete?: () => void;
}

export function SecuritySyncPanel({ targets, onSyncComplete }: SecuritySyncPanelProps) {
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [monitoring, setMonitoring] = useState<MonitoringConfig | null>(null);
  const [latestSync, setLatestSync] = useState<SyncRecord | null>(null);
  const [history, setHistory] = useState<SyncRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'drift' | 'attack-paths' | 'history'>('overview');
  const [inspectSyncRecord, setInspectSyncRecord] = useState<SyncRecord | null>(null);

  // Select first target by default
  useEffect(() => {
    if (targets.length > 0 && !selectedTargetId) {
      const demoTarget = targets.find((t) => t.demoSandbox) || targets[0];
      setSelectedTargetId(demoTarget.id);
    }
  }, [targets, selectedTargetId]);

  const fetchSyncData = useCallback(async (targetId: string) => {
    if (!targetId) return;
    setLoading(true);
    try {
      const [statusRes, historyRes] = await Promise.all([
        getSyncStatus(targetId).catch(() => null),
        getSyncHistory(targetId, 15).catch(() => ({ targetId, history: [] })),
      ]);

      if (statusRes) {
        setMonitoring(statusRes.monitoring);
        setLatestSync(statusRes.latestSync);
      }
      if (historyRes) {
        setHistory(historyRes.history);
      }
    } catch (e) {
      console.error('Failed to load sync data', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTargetId) {
      void fetchSyncData(selectedTargetId);
    }
  }, [selectedTargetId, fetchSyncData]);

  const handleManualSync = async () => {
    if (!selectedTargetId || syncing) return;
    setSyncing(true);
    setStatusMessage('Initiating continuous authorization sync...');
    try {
      await triggerSync(selectedTargetId);
      setStatusMessage('Sync in progress: fetching OpenAPI spec & probing authorization baseline...');
      
      // Poll for completion
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const status = await getSyncStatus(selectedTargetId);
          if (status.latestSync && status.latestSync.status !== 'RUNNING') {
            clearInterval(interval);
            setLatestSync(status.latestSync);
            setMonitoring(status.monitoring);
            setSyncing(false);
            setStatusMessage(`Sync ${status.latestSync.status.toLowerCase()} at ${new Date().toLocaleTimeString()}`);
            void fetchSyncData(selectedTargetId);
            onSyncComplete?.();
          } else if (attempts > 30) {
            clearInterval(interval);
            setSyncing(false);
            setStatusMessage('Sync request dispatched to background queue.');
          }
        } catch {
          // ignore transient poll error
        }
      }, 1500);
    } catch (err) {
      setSyncing(false);
      setStatusMessage(err instanceof Error ? err.message : 'Sync trigger failed');
    }
  };

  const handleSimulateBenchmark = async () => {
    if (!selectedTargetId || simulating) return;
    setSimulating(true);
    setStatusMessage('Running controlled benchmark simulation with live pipeline...');
    try {
      const res = await simulateBenchmarkSync(selectedTargetId);
      setLatestSync(res.sync);
      setStatusMessage('CONTROLLED BENCHMARK SIMULATION completed: verified actual authorization drift.');
      void fetchSyncData(selectedTargetId);
      onSyncComplete?.();
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Benchmark simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  const handleToggleMonitoring = async () => {
    if (!selectedTargetId) return;
    try {
      if (monitoring?.enabled) {
        await disableMonitoring(selectedTargetId);
        setMonitoring((prev) => prev ? { ...prev, enabled: false } : null);
        setStatusMessage('24-Hour continuous sync paused');
      } else {
        const res = await enableMonitoring(selectedTargetId, 24);
        setMonitoring(res.config);
        setStatusMessage('24-Hour continuous sync enabled (Interval: 24h)');
      }
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Failed to update schedule');
    }
  };

  // Format countdown to next sync
  const getNextSyncCountdown = () => {
    if (!monitoring?.enabled) return 'Disabled';
    if (!monitoring?.nextSyncAt) return 'Calculating...';
    const diff = new Date(monitoring.nextSyncAt).getTime() - Date.now();
    if (diff <= 0) return 'Sync due now';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  const diff = latestSync?.endpointDiff;
  const comparisons = latestSync?.findingComparisons ?? [];
  const driftEvents = latestSync?.driftEvents ?? [];
  const attackPathDiff = latestSync?.attackPathDiff;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111113]/90 backdrop-blur-md p-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-lime-400/10 border border-lime-400/20 text-lime-400">
              <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg text-white">24-Hour Security Sync</h2>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-lime-400/10 text-lime-300 border border-lime-400/30">
                  Continuous Authorization Drift
                </span>
                {latestSync?.simulationMode && (
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                    Benchmark Simulation
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Periodic baseline synchronization, API surface diffing, and authorization regression tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Target Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {targets.length > 1 && (
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-lime-400/50"
            >
              {targets.map((t) => (
                <option key={t.id} value={t.id} className="bg-zinc-900 text-white">
                  {t.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleToggleMonitoring}
            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              monitoring?.enabled 
                ? 'bg-lime-400/10 border-lime-400/30 text-lime-300 hover:bg-lime-400/20' 
                : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {monitoring?.enabled ? 'Sync Active (24h)' : 'Enable Sync'}
          </button>

          <button
            disabled={simulating || syncing || !selectedTargetId}
            onClick={handleSimulateBenchmark}
            title="Triggers controlled benchmark simulation with the real scanning pipeline"
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/15 text-zinc-200 hover:border-lime-400/40 hover:text-white disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className={`w-3.5 h-3.5 text-lime-400 ${simulating ? 'animate-spin' : ''}`} />
            {simulating ? 'Simulating...' : 'Simulate 24h Sync'}
          </button>

          <button
            disabled={syncing || simulating || !selectedTargetId}
            onClick={handleManualSync}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-lime-300 text-black hover:bg-lime-200 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-lg shadow-lime-300/10"
          >
            <Zap className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Synchronizing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="mt-3 text-xs font-mono text-lime-400/90 flex items-center gap-2 bg-lime-950/30 border border-lime-500/20 px-3 py-1.5 rounded-lg">
          <Activity className="w-3.5 h-3.5 shrink-0 animate-pulse" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* AI Explanation Banner (if available) */}
      {latestSync?.llmExplanation && (
        <div className="mt-4 p-3.5 rounded-xl border border-indigo-500/25 bg-indigo-950/20 text-xs">
          <div className="flex items-center gap-2 text-indigo-300 font-mono font-bold mb-1">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>AI Authorization Analysis (Verified Finding Insight)</span>
          </div>
          <p className="text-zinc-300 leading-relaxed font-sans">
            {latestSync.llmExplanation}
          </p>
        </div>
      )}

      {/* Sync Status Banner */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Next Sync */}
        <div className="p-3.5 rounded-xl border border-white/5 bg-black/25">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Next Scheduled Sync</span>
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
          </div>
          <div className="text-xl font-bold text-white mt-1.5 font-mono">
            {getNextSyncCountdown()}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {monitoring?.lastSyncAt 
              ? `Last synced: ${new Date(monitoring.lastSyncAt).toLocaleTimeString()}`
              : 'No previous sync record'}
          </div>
        </div>

        {/* Drift Status */}
        <div className="p-3.5 rounded-xl border border-white/5 bg-black/25">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Authorization Drift</span>
            {latestSync?.driftDetected ? (
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-lime-400" />
            )}
          </div>
          <div className={`text-xl font-bold mt-1.5 ${latestSync?.driftDetected ? 'text-amber-300' : 'text-lime-300'}`}>
            {latestSync?.driftDetected ? 'Drift Detected' : 'No Drift (Stable)'}
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {driftEvents.length} authorization drift events detected
          </div>
        </div>

        {/* API Surface Changes */}
        <div className="p-3.5 rounded-xl border border-white/5 bg-black/25">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>API Surface Delta</span>
            <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1.5 font-mono flex items-center gap-2">
            <span className="text-emerald-400">+{diff?.added.length ?? 0}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-rose-400">-{diff?.removed.length ?? 0}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-amber-400">~{diff?.modified.length ?? 0}</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Added / Removed / Modified endpoints
          </div>
        </div>

        {/* Attack Surface & Path Regressions */}
        <div className="p-3.5 rounded-xl border border-white/5 bg-black/25">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Attack Surface Delta</span>
            <Route className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1.5 font-mono flex items-center gap-2">
            <span className={attackPathDiff && attackPathDiff.newlyReachableResources.length > 0 ? 'text-rose-400' : 'text-zinc-300'}>
              +{attackPathDiff?.newlyReachableResources.length ?? 0} res
            </span>
            <span className="text-zinc-600">/</span>
            <span className={attackPathDiff && attackPathDiff.newlyExposedSensitiveData.length > 0 ? 'text-rose-400' : 'text-zinc-300'}>
              +{attackPathDiff?.newlyExposedSensitiveData.length ?? 0} sens
            </span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            Reachable resources & sensitive assets
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex border-b border-white/10 gap-4 text-xs font-mono">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-b-2 border-lime-400 text-lime-300 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Endpoint & Finding Drift
        </button>
        <button
          onClick={() => setActiveTab('drift')}
          className={`pb-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'drift'
              ? 'border-b-2 border-lime-400 text-lime-300 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>Drift Events</span>
          {driftEvents.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 text-[10px]">
              {driftEvents.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('attack-paths')}
          className={`pb-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'attack-paths'
              ? 'border-b-2 border-lime-400 text-lime-300 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span>Attack Path Regression</span>
          {attackPathDiff && attackPathDiff.newlyReachableResources.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-400/20 text-rose-300 text-[10px]">
              +{attackPathDiff.newlyReachableResources.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2 transition-colors ${
            activeTab === 'history'
              ? 'border-b-2 border-lime-400 text-lime-300 font-bold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Sync History ({history.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="mt-4 space-y-4">
          {/* Endpoint Diff Highlights */}
          {diff && (diff.added.length > 0 || diff.removed.length > 0 || diff.modified.length > 0) ? (
            <div className="rounded-xl border border-white/5 bg-black/20 p-4">
              <h3 className="text-xs font-mono uppercase text-zinc-400 mb-3 flex items-center gap-1.5">
                <FileCode2 className="w-3.5 h-3.5 text-lime-400" />
                Detected API Surface Modifications
              </h3>
              <div className="space-y-2">
                {diff.added.map((ep) => (
                  <div key={ep.id} className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-emerald-400/10 text-emerald-300">ADDED</span>
                      <span className="font-mono text-zinc-200">{ep.id}</span>
                    </div>
                    <span className="text-[11px] text-zinc-400">{ep.authRequired ? 'Requires Auth' : 'Public'}</span>
                  </div>
                ))}
                {diff.removed.map((ep) => (
                  <div key={ep.id} className="flex items-center justify-between p-2 rounded-lg bg-rose-950/20 border border-rose-500/20 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-rose-400/10 text-rose-300">REMOVED</span>
                      <span className="font-mono text-zinc-400 line-through">{ep.id}</span>
                    </div>
                  </div>
                ))}
                {diff.modified.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-amber-950/20 border border-amber-500/20 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300">MODIFIED</span>
                      <span className="font-mono text-zinc-200">{m.current.id}</span>
                    </div>
                    <span className="text-[11px] text-amber-300 font-mono">{m.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-black/20 p-4 text-center text-xs text-zinc-500">
              API surface is identical to baseline snapshot (0 added, 0 removed, 0 modified).
            </div>
          )}

          {/* Finding Comparison Breakdown */}
          {comparisons.length > 0 && (
            <div className="rounded-xl border border-white/5 bg-black/20 p-4">
              <h3 className="text-xs font-mono uppercase text-zinc-400 mb-3 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Vulnerability Trajectory vs Baseline
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {comparisons.map((c, i) => (
                  <div key={i} className="flex items-start justify-between p-2.5 rounded-lg border border-white/5 bg-white/[0.02] text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                          c.status === 'NEW' ? 'bg-rose-400/20 text-rose-300' :
                          c.status === 'RESOLVED' ? 'bg-emerald-400/20 text-emerald-300' :
                          c.status === 'REGRESSED' ? 'bg-amber-400/20 text-amber-300' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>
                          {c.status}
                        </span>
                        <span className="font-semibold text-zinc-200">{c.vulnerabilityType}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">{c.title}</p>
                    </div>
                    <span className={`text-[10px] font-mono uppercase ${c.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'}`}>
                      {c.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Drift Events */}
      {activeTab === 'drift' && (
        <div className="mt-4">
          {driftEvents.length > 0 ? (
            <div className="space-y-2.5">
              {driftEvents.map((evt, i) => (
                <div key={i} className="p-3 rounded-xl border border-amber-500/20 bg-amber-950/10 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-300">{evt.endpoint}</span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-400/10 text-amber-300">
                      {evt.driftType}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-zinc-400 pt-1 font-mono text-[11px]">
                    <div>
                      <span className="text-zinc-500 block">Baseline behavior:</span>
                      <span className="text-zinc-300">{evt.previousBehavior}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Current behavior:</span>
                      <span className="text-amber-200 font-semibold">{evt.currentBehavior}</span>
                    </div>
                  </div>
                  {evt.evidence && (
                    <div className="text-[11px] text-zinc-500 pt-1 font-mono">
                      Evidence: {evt.evidence}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-black/20 p-8 text-center text-xs text-zinc-500">
              <CheckCircle2 className="w-8 h-8 text-lime-400/60 mx-auto mb-2" />
              No authorization drift detected. Access behaviors match the security baseline.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Attack Path Regression */}
      {activeTab === 'attack-paths' && (
        <div className="mt-4 space-y-3">
          {attackPathDiff ? (
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl border border-white/5 bg-black/25">
                <span className="text-zinc-400 font-mono uppercase text-[11px] block mb-2">
                  Newly Reachable Resources Through Exploitation
                </span>
                {attackPathDiff.newlyReachableResources.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {attackPathDiff.newlyReachableResources.map((res, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 font-mono text-xs">
                        + {res}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500">No new downstream resources reachable in current sync.</p>
                )}
              </div>

              <div className="p-3.5 rounded-xl border border-white/5 bg-black/25">
                <span className="text-zinc-400 font-mono uppercase text-[11px] block mb-2">
                  Newly Exposed Sensitive Data Tokens
                </span>
                {attackPathDiff.newlyExposedSensitiveData.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {attackPathDiff.newlyExposedSensitiveData.map((data, i) => (
                      <span key={i} className="px-2 py-1 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300 font-mono text-xs">
                        + {data}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-500">No new sensitive fields exposed along active attack paths.</p>
                )}
              </div>

              {attackPathDiff.changedAttackPaths.length > 0 && (
                <div className="p-3.5 rounded-xl border border-white/5 bg-black/25">
                  <span className="text-zinc-400 font-mono uppercase text-[11px] block mb-2">
                    Attack Path Depth Modifications
                  </span>
                  <div className="space-y-2">
                    {attackPathDiff.changedAttackPaths.map((cp, idx) => (
                      <div key={idx} className="p-2 rounded bg-white/[0.02] border border-white/5 font-mono text-[11px]">
                        <span className="text-white font-bold">{cp.entryPoint}</span>: Depth shifted from {cp.previousDepth} &rarr; <span className="text-rose-400 font-bold">{cp.currentDepth}</span>
                        {cp.newSteps.length > 0 && (
                          <div className="text-zinc-400 mt-1">
                            New steps: {cp.newSteps.join(' -> ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-black/20 p-8 text-center text-xs text-zinc-500">
              <Network className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              Attack paths remain consistent with previous baseline.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: History */}
      {activeTab === 'history' && (
        <div className="mt-4">
          {history.length > 0 ? (
            <div className="space-y-2">
              {history.map((rec) => (
                <div 
                  key={rec.id} 
                  onClick={() => setInspectSyncRecord(rec)}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-black/20 text-xs hover:border-lime-400/40 transition-colors cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-zinc-300">{rec.id.slice(0, 8)}</span>
                      <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                        rec.status === 'COMPLETED' ? 'bg-lime-400/10 text-lime-300' :
                        rec.status === 'RUNNING' ? 'bg-amber-400/10 text-amber-300' :
                        'bg-rose-400/10 text-rose-300'
                      }`}>
                        {rec.status}
                      </span>
                      {rec.driftDetected && (
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300">
                          Drift
                        </span>
                      )}
                      {rec.simulationMode && (
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-indigo-400/20 text-indigo-300">
                          Simulated
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1 font-mono">
                      {new Date(rec.startedAt).toLocaleString()} · Findings: +{rec.newFindingCount} -{rec.resolvedFindingCount} ={rec.unchangedFindingCount}
                    </div>
                  </div>
                  <div className="text-right font-mono text-[11px] text-zinc-400 flex items-center gap-2">
                    <span>{rec.completedAt ? `Duration: ${Math.round((new Date(rec.completedAt).getTime() - new Date(rec.startedAt).getTime()) / 1000)}s` : 'In progress'}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover:text-lime-300 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-black/20 p-8 text-center text-xs text-zinc-500">
              No previous sync runs found for this target.
            </div>
          )}
        </div>
      )}

      {/* Sync Record Modal Inspection */}
      {inspectSyncRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#121215] border border-white/15 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold font-mono">Sync Audit: {inspectSyncRecord.id.slice(0, 12)}</h3>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${inspectSyncRecord.driftDetected ? 'bg-amber-400/20 text-amber-300' : 'bg-lime-400/20 text-lime-300'}`}>
                    {inspectSyncRecord.driftDetected ? 'DRIFT DETECTED' : 'STABLE'}
                  </span>
                </div>
                <p className="text-zinc-500 text-xs mt-1">Started: {new Date(inspectSyncRecord.startedAt).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => setInspectSyncRecord(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                <span className="text-zinc-500 block">New Findings</span>
                <span className="text-lg font-bold text-rose-400">+{inspectSyncRecord.newFindingCount}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                <span className="text-zinc-500 block">Resolved</span>
                <span className="text-lg font-bold text-emerald-400">-{inspectSyncRecord.resolvedFindingCount}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                <span className="text-zinc-500 block">Unchanged</span>
                <span className="text-lg font-bold text-zinc-300">={inspectSyncRecord.unchangedFindingCount}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                <span className="text-zinc-500 block">Drift Events</span>
                <span className="text-lg font-bold text-amber-400">{inspectSyncRecord.driftEvents?.length ?? 0}</span>
              </div>
            </div>

            {inspectSyncRecord.driftEvents && inspectSyncRecord.driftEvents.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase text-amber-300">Authorization Drift Events</h4>
                {inspectSyncRecord.driftEvents.map((evt, i) => (
                  <div key={i} className="p-3 rounded-lg border border-amber-500/20 bg-amber-950/20 text-xs font-mono">
                    <span className="font-bold text-white">{evt.endpoint}</span> ({evt.driftType})
                    <div className="text-zinc-400 text-[11px] mt-1">{evt.previousBehavior} &rarr; <span className="text-amber-200">{evt.currentBehavior}</span></div>
                    {evt.evidence && <div className="text-zinc-500 text-[10px] mt-1">Proof: {evt.evidence}</div>}
                  </div>
                ))}
              </div>
            )}

            {inspectSyncRecord.llmExplanation && (
              <div className="p-3.5 rounded-lg border border-indigo-500/20 bg-indigo-950/30 text-xs">
                <span className="text-indigo-300 font-mono font-bold block mb-1">AI Contextual Analysis</span>
                <p className="text-zinc-300">{inspectSyncRecord.llmExplanation}</p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button 
                onClick={() => setInspectSyncRecord(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-mono"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
