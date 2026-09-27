'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowRight, Boxes, CircleDot, Eye, Gauge, LoaderCircle, Network, Play, Plus, ShieldAlert, ShieldCheck, Server } from 'lucide-react';
import AmbientBackground from '@/components/cyber/ambient-background';
import { AuthorizationGraph } from '@/components/scans/authorization-graph';
import { SecuritySyncPanel } from '@/components/dashboard/security-sync-panel';
import { api } from '@/lib/api/client';
import { listScans, startScan } from '@/lib/api/scans';
import { DEMO_IDENTITIES, listTargets, registerDemoTarget } from '@/lib/api/targets';
import type { Scan, Target } from '@/lib/api/types';

const panel = 'rounded-2xl border border-white/10 bg-[#111113]/85';

export default function DashboardPage() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [targetList, scanList] = await Promise.all([listTargets(), listScans()]);
      setTargets(targetList); setScans(scanList); setError('');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to load live backend data.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const latest = scans.find((scan) => scan.status === 'COMPLETED');
  const metrics = useMemo(() => {
    const findings = latest?.findings ?? [];
    const critical = findings.filter((finding) => finding.severity === 'critical').length;
    return [
      { label: 'Security posture', value: !latest ? 'Not scanned' : critical ? 'Critical' : findings.length ? 'Needs review' : 'No findings', icon: Gauge, color: critical ? 'text-rose-300' : 'text-lime-300' },
      { label: 'Critical findings', value: critical, icon: ShieldAlert, color: 'text-rose-300' },
      { label: 'High findings', value: findings.filter((finding) => finding.severity === 'high').length, icon: ShieldCheck, color: 'text-orange-300' },
      { label: 'Medium findings', value: findings.filter((finding) => finding.severity === 'medium').length, icon: AlertTriangle, color: 'text-amber-300' },
      { label: 'Total findings', value: findings.length, icon: AlertTriangle, color: 'text-amber-300' },
      { label: 'Affected resources', value: new Set(findings.flatMap((finding) => finding.impact.directlyExposed)).size, icon: Server, color: 'text-lime-300' },
      { label: 'Attack paths', value: latest?.attackPaths?.length ?? 0, icon: Activity, color: 'text-orange-300' },
      { label: 'Sensitive data exposures', value: findings.filter((finding) => finding.vulnerabilityType === 'DATA_EXPOSURE').length, icon: Eye, color: 'text-rose-300' },
    ];
  }, [latest]);

  const launchDemo = async () => {
    setBusy(true); setError('');
    try {
      const demo = targets.find((target) => target.demoSandbox) ?? await registerDemoTarget();
      if (!targets.some((target) => target.id === demo.id)) setTargets((current) => [demo, ...current]);
      await api('/demo/reset', { method: 'POST', body: JSON.stringify({ targetId: demo.id }) });
      const identities = DEMO_IDENTITIES.map((identity, index) => ({ ...identity, credentials: { username: identity.username, password: `AuthSecret#${index + 1}` } }));
      const scan = await startScan(demo.id, identities, { bola: true, bfla: true, dataExposure: true, massAssignment: true, rateLimiting: true, rateLimitRequests: 5 });
      window.location.assign(`/scans/${scan.scanId}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not start the local demo.'); setBusy(false); }
  };

  return <main className="relative min-h-screen overflow-hidden px-5 pb-20 pt-28 sm:px-8"><AmbientBackground /><div className="relative z-10 mx-auto max-w-7xl">
    <div className="mb-9 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-2 font-mono text-xs uppercase tracking-[.25em] text-lime-300">Authorization intelligence</p><h1 className="text-4xl font-bold text-white">Security operations</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">Map API authorization relationships, validate broken boundaries with real evidence, and trace each confirmed path into its blast radius.</p></div><div className="flex flex-wrap gap-3"><Link href="/scans/new" className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:border-lime-300/50"><Plus size={16}/>New scan</Link><button disabled={busy} onClick={() => void launchDemo()} className="inline-flex items-center gap-2 rounded-lg bg-lime-300 px-4 py-3 text-sm font-bold text-black hover:bg-lime-200 disabled:opacity-60">{busy ? <LoaderCircle size={16} className="animate-spin"/> : <Play size={16}/>}Launch Demo</button></div></div>

    {error && <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-rose-400/30 bg-rose-950/30 p-4 text-sm text-rose-200"><CircleDot size={17} className="mt-0.5 shrink-0"/>{error}</div>}
    <div className="mb-8 rounded-xl border border-lime-300/25 bg-lime-300/5 p-4 text-sm text-lime-100"><strong>Sandbox demo:</strong> scans run against the bundled, intentionally vulnerable loopback API. Demo credentials are sent only with the scan request; the backend resets its fixture after destructive probes.</div>

    <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, icon: Icon, color }) => <div key={label} className={`${panel} p-5`}><div className="mb-5 flex items-center justify-between"><span className="text-xs uppercase tracking-wider text-zinc-500">{label}</span><Icon size={18} className={color}/></div><div className="text-2xl font-semibold text-white">{loading ? '—' : value}</div><p className="mt-1 text-xs text-zinc-500">{latest ? `From scan ${latest.id.slice(0, 8)}` : 'Based on latest completed backend scan'}</p></div>)}</section>

    {/* 24-Hour Security Sync Panel */}
    <section className="mb-8">
      <SecuritySyncPanel targets={targets} onSyncComplete={() => void refresh()} />
    </section>

    {/* Live Threat & Authorization Graph */}
    <section className="mb-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-lime-400" />
          <h2 className="font-bold text-white text-lg">Authorization & Threat Attack Graph</h2>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-lime-400/10 text-lime-300 border border-lime-400/25">
            Innovation: Graph Analysis
          </span>
        </div>
        <Link 
          href="/graph" 
          className="inline-flex items-center gap-1.5 text-xs font-mono text-lime-300 hover:text-lime-200 transition-colors"
        >
          Open Dedicated Graph Explorer <ArrowRight size={14} />
        </Link>
      </div>

      <AuthorizationGraph 
        nodes={latest?.graph?.nodes ?? []} 
        edges={latest?.graph?.edges ?? []} 
        targetName={latest ? `Scan ${latest.id.slice(0, 8)} Authorization Topology` : 'Live Authorization Graph'}
        targetBaseUrl="http://127.0.0.1:4000"
        scanId={latest?.id}
      />
    </section>

    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]"><section className={`${panel} p-5`}><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-white">Registered targets</h2><span className="text-xs text-zinc-500">{targets.length} from backend</span></div>{loading ? <p className="text-sm text-zinc-500">Loading targets…</p> : targets.length ? <ul className="space-y-3">{targets.map((target) => <li key={target.id} className="rounded-xl border border-white/10 bg-black/20 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-white">{target.name}</p><p className="mt-1 break-all font-mono text-xs text-zinc-500">{target.baseUrl}</p></div><span className={`rounded-full px-2 py-1 text-[10px] uppercase ${target.sandboxMode ? 'bg-lime-300/10 text-lime-200' : 'bg-amber-300/10 text-amber-200'}`}>{target.sandboxMode ? 'Sandbox' : 'Authorized'}</span></div></li>)}</ul> : <p className="text-sm text-zinc-500">No target registered yet. Launch the demo or create a scan target.</p>}<Link href="/scans/new" className="mt-4 inline-flex items-center gap-2 text-sm text-lime-200 hover:text-white">Configure a target <ArrowRight size={15}/></Link></section>

    <section className={`${panel} p-5`}><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-white">Recent scans</h2><span className="text-xs text-zinc-500">Persisted by backend</span></div>{loading ? <p className="text-sm text-zinc-500">Loading scans…</p> : scans.length ? <ul className="space-y-3">{scans.slice(0, 8).map((scan) => <li key={scan.id}><Link href={`/scans/${scan.id}`} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-4 hover:border-lime-300/35"><div><p className="font-mono text-xs text-zinc-300">{scan.id.slice(0, 8)} · {new Date(scan.createdAt).toLocaleString()}</p><p className="mt-1 text-xs text-zinc-500">{scan.findings?.length ?? 0} finding(s) · {scan.currentStep}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] ${scan.status === 'COMPLETED' ? 'bg-lime-300/10 text-lime-200' : scan.status === 'FAILED' ? 'bg-rose-300/10 text-rose-200' : 'bg-amber-300/10 text-amber-200'}`}>{scan.status}</span></Link></li>)}</ul> : <div className="rounded-xl border border-dashed border-white/15 p-8 text-center"><p className="text-sm text-zinc-400">No scans yet. Start the local demo to see real progress and evidence.</p></div>}
    {latest && <div className="mt-5 flex flex-wrap gap-2">{latest.findings?.slice(0, 4).map((finding) => <Link key={finding.id} href={`/findings/${finding.id}`} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:border-lime-300/40">{finding.vulnerabilityType} · {finding.severity}</Link>)}</div>}</section></div>

    {scans.some((scan) => !['COMPLETED', 'FAILED'].includes(scan.status)) && <p className="mt-5 text-xs text-zinc-500">Scan state changes are read from backend status records. <button onClick={() => void refresh()} className="underline hover:text-white">Refresh</button></p>}
    <div className="mt-10 border-t border-white/10 pt-5 text-xs text-zinc-600">Live values: target and scan records from the backend</div>
  </div></main>;
}
