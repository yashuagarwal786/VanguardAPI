'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Network, 
  ArrowLeft, 
  Plus, 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  Activity, 
  ExternalLink,
  Info,
  Globe,
  Database,
  Users,
  Eye,
  ArrowRight,
  AlertTriangle,
  Radio
} from 'lucide-react';
import AmbientBackground from '@/components/cyber/ambient-background';
import { AuthorizationGraph } from '@/components/scans/authorization-graph';
import { listScans } from '@/lib/api/scans';
import { listTargets } from '@/lib/api/targets';
import type { Scan, Target, AttackPath } from '@/lib/api/types';

export default function ThreatGraphPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([listScans(), listTargets()])
      .then(([scanItems, targetItems]) => {
        if (!active) return;
        setScans(scanItems);
        setTargets(targetItems);

        const completed = scanItems.find((s) => s.status === 'COMPLETED');
        if (completed) {
          setSelectedScanId(completed.id);
        } else if (scanItems.length > 0) {
          setSelectedScanId(scanItems[0].id);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load topology graph data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const activeScan = useMemo(() => {
    return scans.find((s) => s.id === selectedScanId) || null;
  }, [scans, selectedScanId]);

  const activeTarget = useMemo(() => {
    if (!activeScan) return null;
    return targets.find((t) => t.id === activeScan.targetId) || null;
  }, [activeScan, targets]);

  // Dynamically calculate graph metrics without any hardcoded values
  const metrics = useMemo(() => {
    if (!activeScan) {
      return {
        bolaPathsCount: 0,
        maxBlastDepth: 0,
        nodeCount: 0,
        edgeCount: 0,
        violationCount: 0,
      };
    }

    const attackPaths = activeScan.attackPaths ?? [];
    const bolaPathsCount = attackPaths.length > 0
      ? attackPaths.length
      : (activeScan.findings?.filter((f) => f.vulnerabilityType === 'BOLA').length ?? 0);

    let maxBlastDepth = 0;
    if (attackPaths.length > 0) {
      maxBlastDepth = Math.max(...attackPaths.map((p) => p.depth || p.steps?.length || 1));
    } else if (activeScan.findings && activeScan.findings.length > 0) {
      maxBlastDepth = Math.max(...activeScan.findings.map((f) => f.impact?.attackPathDepth || 1));
    }

    const nodeCount = activeScan.graph?.nodes?.length ?? 0;
    const edgeCount = activeScan.graph?.edges?.length ?? 0;
    const violationCount = activeScan.graph?.edges?.filter(
      (e) => e.type === 'UNAUTHORIZED_ACCESS' || e.type === 'CROSSES_TENANT'
    ).length ?? 0;

    return {
      bolaPathsCount,
      maxBlastDepth,
      nodeCount,
      edgeCount,
      violationCount,
    };
  }, [activeScan]);

  return (
    <main className="relative min-h-screen overflow-hidden px-5 pb-24 pt-28 sm:px-8">
      <AmbientBackground />
      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Top Breadcrumb & Actions */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            {scans.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-500">Scan:</span>
                <select
                  value={selectedScanId}
                  onChange={(e) => setSelectedScanId(e.target.value)}
                  className="rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-xs text-zinc-200 focus:border-lime-400 focus:outline-none"
                >
                  {scans.map((s) => {
                    const target = targets.find((t) => t.id === s.targetId);
                    const targetLabel = target?.name ? `${target.name} · ` : '';
                    return (
                      <option key={s.id} value={s.id}>
                        {targetLabel}Scan {s.id.slice(0, 8)} ({s.status}) · {s.findings?.length ?? 0} findings
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <Link
              href="/scans/new"
              className="inline-flex items-center gap-2 rounded-lg bg-lime-400 px-4 py-2 text-xs font-bold text-black hover:bg-lime-300 transition-all shadow-[0_0_12px_rgba(163,230,53,0.25)]"
            >
              <Plus size={14} /> Configure New Scan
            </Link>
          </div>
        </div>

        {/* Hero Title Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-400/10 border border-lime-400/25 text-lime-300 font-mono text-xs font-semibold mb-3">
            <Network className="w-3.5 h-3.5" />
            TOPOLOGICAL AUTHORIZATION MODEL & BLAST RADIUS
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Threat & Authorization Graph Explorer
          </h1>
          <p className="mt-2 text-sm text-zinc-400 max-w-3xl leading-relaxed">
            Constructs a deterministic 5-tier directed graph from OpenAPI contracts and authenticated security probes. Traces Broken Object Level Authorization (BOLA), privilege escalation paths, and downstream multi-hop blast radius.
          </p>
        </div>

        {error && (
          <div role="alert" className="mb-6 rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        {/* Dynamic Metric Cards (Zero Hardcoded Values) */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-[#111114]/90 p-4">
            <div className="flex items-center gap-2 text-xs uppercase font-mono text-zinc-400 mb-1">
              <ShieldAlert className="w-4 h-4 text-rose-400" /> Confirmed BOLA Paths
            </div>
            <p className="text-2xl font-bold text-white font-mono">
              {loading ? '—' : `${metrics.bolaPathsCount} Active`}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Identifies unauthorized data access across authenticated session boundaries.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111114]/90 p-4">
            <div className="flex items-center gap-2 text-xs uppercase font-mono text-zinc-400 mb-1">
              <Layers className="w-4 h-4 text-amber-400" /> Max Blast Radius Depth
            </div>
            <p className="text-2xl font-bold text-white font-mono">
              {loading ? '—' : `${metrics.maxBlastDepth} Hops (BFS)`}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Traverses downstream relationships to quantify indirect exposure.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111114]/90 p-4">
            <div className="flex items-center gap-2 text-xs uppercase font-mono text-zinc-400 mb-1">
              <Activity className="w-4 h-4 text-lime-400" /> Graph Schema Nodes
            </div>
            <p className="text-2xl font-bold text-white font-mono">
              {loading ? '—' : `${metrics.nodeCount} Nodes · ${metrics.edgeCount} Edges`}
            </p>
            <p className="text-[11px] text-zinc-500 mt-1">
              Parsed from OpenAPI spec & authenticated runtime observation.
            </p>
          </div>
        </div>

        {/* Main Interactive Graph Component */}
        <div className="mb-10">
          <AuthorizationGraph
            nodes={activeScan?.graph?.nodes ?? []}
            edges={activeScan?.graph?.edges ?? []}
            targetName={
              activeTarget?.name ||
              (activeScan ? `Scan ${activeScan.id.slice(0, 8)} Authorization Topology` : 'API Authorization Graph')
            }
            targetBaseUrl={activeTarget?.baseUrl || activeScan?.targetId}
            scanId={activeScan?.id}
          />
        </div>

        {/* Dynamic Section: Active Attack Paths & Blast Radius Trajectories */}
        {activeScan?.attackPaths && activeScan.attackPaths.length > 0 && (
          <div className="mb-10 rounded-2xl border border-white/10 bg-[#111114]/85 p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h3 className="font-bold text-white text-base">
                  Confirmed Attack Trajectories ({activeScan.attackPaths.length})
                </h3>
              </div>
              <Link
                href={`/scans/${activeScan.id}/attack-paths`}
                className="inline-flex items-center gap-1 font-mono text-xs text-lime-300 hover:underline"
              >
                Inspect Full Trajectory Explorer <ExternalLink size={12} />
              </Link>
            </div>

            <div className="space-y-4">
              {activeScan.attackPaths.map((path: AttackPath) => (
                <div
                  key={path.id}
                  className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-4 font-mono text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="text-rose-300 font-bold uppercase tracking-wider">
                      Entry Point: {path.entryPoint}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-200">
                      Depth: {path.depth} Hops
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-zinc-200 font-sans leading-relaxed">
                    {path.steps.map((step) => step.label).join(' ⟶ ')}
                  </p>

                  {path.branches && path.branches.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <p className="text-[11px] text-zinc-400 uppercase tracking-wider mb-1.5">
                        Downstream Blast Radius (Reachable Sibling Entities):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {path.branches.map((b) => (
                          <span
                            key={`${b.resourceId}-${b.objectId}`}
                            className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-[11px] text-amber-200"
                          >
                            {b.resourceId} #{b.objectId} (Depth: {b.depth})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5-Tier Hierarchical Graph Architecture Guide */}
        <div className="rounded-2xl border border-white/10 bg-[#111114]/80 p-6">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-lime-400" /> 5-Tier Hierarchical Topology Architecture
          </h3>
          <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
            VanguardAPI structures authorization boundaries into five deterministic topological tiers. Probes systematically traverse these tiers to detect broken boundaries and identify cross-tenant data leaks.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 text-xs">
            <div className="rounded-xl border border-sky-500/20 bg-sky-950/15 p-3.5">
              <span className="font-mono text-[10px] uppercase font-bold text-sky-400 block mb-1">Tier 1 · Principals</span>
              <p className="font-semibold text-white mb-1">Identities & Roles</p>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Represents authenticated actors, assigned role boundaries, and tenant session tokens.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/15 p-3.5">
              <span className="font-mono text-[10px] uppercase font-bold text-emerald-400 block mb-1">Tier 2 · Endpoints</span>
              <p className="font-semibold text-white mb-1">API Routes</p>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                OpenAPI paths extracted from documentation, tagged by HTTP verb and parameter scheme.
              </p>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-950/15 p-3.5">
              <span className="font-mono text-[10px] uppercase font-bold text-amber-400 block mb-1">Tier 3 · Resources</span>
              <p className="font-semibold text-white mb-1">Domain Entities</p>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Logical business data entities (e.g. Accounts, Orders, Invoices) mapped from schemas.
              </p>
            </div>

            <div className="rounded-xl border border-orange-500/20 bg-orange-950/15 p-3.5">
              <span className="font-mono text-[10px] uppercase font-bold text-orange-400 block mb-1">Tier 4 · Objects</span>
              <p className="font-semibold text-white mb-1">Probed Instances</p>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Concrete entity instances tested during scan to confirm cross-tenant access controls.
              </p>
            </div>

            <div className="rounded-xl border border-rose-500/20 bg-rose-950/15 p-3.5">
              <span className="font-mono text-[10px] uppercase font-bold text-rose-400 block mb-1">Tier 5 · Assets</span>
              <p className="font-semibold text-white mb-1">Sensitive Fields</p>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Exposed high-risk attributes like payment card numbers (PAN), PII, or secret tokens.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
