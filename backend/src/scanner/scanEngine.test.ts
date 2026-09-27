import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmdirSync, unlinkSync } from 'node:fs';
import { createServer, type Server } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const testDatabaseDir = mkdtempSync(join(tmpdir(), 'sentinelapi-rest-test-'));
process.env.DATABASE_PATH = join(testDatabaseDir, 'sentinel.sqlite');
const [{ app }, { store }] = await Promise.all([import('../app.js'), import('../db/database.js')]);

const demoPath = fileURLToPath(new URL('../../../sentinelapi/vulnerable-api/server.js', import.meta.url));
const waitForDemo = async (baseUrl: string, child: ChildProcess) => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`Demo server exited with status ${child.exitCode}`);
    try { const response = await fetch(baseUrl); if (response.ok) return; } catch { /* server is still starting */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Demo server did not become ready');
};
const unusedPort = async () => {
  const probe = createServer(); probe.listen(0, '127.0.0.1'); await once(probe, 'listening');
  const address = probe.address(); if (!address || typeof address === 'string') throw new Error('Could not allocate demo test port');
  const port = address.port; await new Promise<void>((resolve, reject) => probe.close((error) => error ? reject(error) : resolve())); return port;
};
const jsonRequest = async <T>(url: string, init?: RequestInit) => {
  const response = await fetch(url, init); const body = await response.json() as T;
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
  return body;
};

test('REST end-to-end scan proves sandbox findings, paths, evidence, and reset', { timeout: 30000 }, async () => {
  const port = await unusedPort(); const baseUrl = `http://127.0.0.1:${port}`;
  const demo = spawn(process.execPath, [demoPath], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
  let api: Server | undefined;
  try {
    await waitForDemo(baseUrl, demo);
    api = app.listen(0, '127.0.0.1'); await once(api, 'listening');
    const address = api.address(); if (!address || typeof address === 'string') throw new Error('Backend failed to bind');
    const apiUrl = `http://127.0.0.1:${address.port}`;
    const health = await jsonRequest<{ safeSandboxMode: boolean }>(`${apiUrl}/api/health`);
    assert.equal(health.safeSandboxMode, true);

    const users = [
      { id: '1', username: 'alice', role: 'customer', credentials: { username: 'alice', password: 'alice123' }, ownedResources: { user: ['1'], order: ['1', '2'] } },
      { id: '2', username: 'bob', role: 'customer', credentials: { username: 'bob', password: 'bob123' }, ownedResources: { user: ['2'], order: ['3', '4'] } },
    ];
    const targetResult = await jsonRequest<{ target: { id: string } }>(`${apiUrl}/api/targets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Test loopback sandbox', baseUrl, openApiUrl: `${baseUrl}/openapi.json`, sandboxMode: true, demoSandbox: true, allowDestructiveTests: true, identities: users.map(({ id, username, role, ownedResources }) => ({ id, username, role, ownedResources })) }) });
    const targetId = targetResult.target.id;
    const targetView = await jsonRequest(`${apiUrl}/api/targets/${targetId}`);
    assert.ok(!JSON.stringify(targetView).includes('alice123'), 'target responses must not expose credentials');
    const specSummary = await jsonRequest<{ summary: { endpointCount: number; resourceCount: number } }>(`${apiUrl}/api/targets/${targetId}/summary`);
    assert.ok(specSummary.summary.endpointCount >= 8, 'target preview should return parsed OpenAPI endpoints');
    assert.ok(specSummary.summary.resourceCount >= 4, 'target preview should return parsed API resources');
    const scanResult = await jsonRequest<{ scanId: string }>(`${apiUrl}/api/scans`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetId, identities: users, checks: { bola: true, bfla: true, massAssignment: true, dataExposure: true, rateLimiting: true, rateLimitRequests: 3 } }) });
    let status: { status: string; progress: number; error?: string } = { status: '', progress: 0 };
    for (let attempt = 0; attempt < 100; attempt += 1) {
      status = await jsonRequest(`${apiUrl}/api/scans/${scanResult.scanId}/status`);
      if (status.status === 'COMPLETED' || status.status === 'FAILED') break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.equal(status.status, 'COMPLETED', status.error ?? 'scan did not complete');
    assert.equal(status.progress, 100);

    const scan = await jsonRequest<{ scan: { endpoints: Array<{ path: string }>; testedEndpointIds?: string[]; findings: Array<{ id: string; vulnerabilityType: string; evidence: { ownershipEvidence: string; victimBaselineResponse?: { status: number } }; poc: string }>; attackPaths: Array<{ affectedResources: string[] }>; graph: { nodes: unknown[]; edges: Array<{ type: string }> }; report: unknown } }>(`${apiUrl}/api/scans/${scanResult.scanId}`);
    assert.ok(scan.scan.endpoints.some((endpoint) => endpoint.path === '/orders/{id}'), 'the scan should persist actual parsed endpoints for the explorer');
    assert.ok(scan.scan.testedEndpointIds?.includes('GET /orders/{id}'), 'tested endpoint state should reflect executed backend probes');
    const types = new Set(scan.scan.findings.map((finding) => finding.vulnerabilityType));
    for (const expected of ['BOLA', 'BFLA', 'MASS_ASSIGNMENT', 'DATA_EXPOSURE', 'RATE_LIMITING']) assert.ok(types.has(expected), `missing ${expected}`);
    const bola = scan.scan.findings.find((finding) => finding.vulnerabilityType === 'BOLA'); assert.ok(bola);
    assert.ok(bola.evidence.ownershipEvidence.includes('user_id=2'));
    assert.equal(bola.evidence.victimBaselineResponse?.status, 200);
    assert.ok(bola.poc.includes('<USER_A_TOKEN>'));
    assert.ok(scan.scan.attackPaths.some((path) => ['payment', 'invoice', 'shipment'].every((resource) => path.affectedResources.includes(resource))));
    assert.ok(scan.scan.graph.edges.some((edge) => edge.type === 'UNAUTHORIZED_ACCESS'));
    assert.ok(scan.scan.graph.edges.some((edge) => edge.type === 'REFERENCES'));
    assert.ok(scan.scan.report);

    const findings = await jsonRequest<{ findings: Array<{ id: string }> }>(`${apiUrl}/api/scans/${scanResult.scanId}/findings`);
    assert.equal(findings.findings.length, scan.scan.findings.length);
    const finding = await jsonRequest<{ finding: { id: string } }>(`${apiUrl}/api/findings/${bola.id}`);
    assert.equal(finding.finding.id, bola.id);
    const evidence = await jsonRequest<{ evidence: { victimBaselineResponse?: { status: number } } }>(`${apiUrl}/api/findings/${bola.id}/evidence`);
    assert.equal(evidence.evidence.victimBaselineResponse?.status, 200);
    const path = await jsonRequest<{ attackPath: { depth: number; affectedResources: string[] } }>(`${apiUrl}/api/findings/${bola.id}/attack-path`);
    assert.ok(path.attackPath.depth >= 2);
    assert.ok(path.attackPath.affectedResources.includes('payment'));
    await jsonRequest(`${apiUrl}/api/scans/${scanResult.scanId}/graph`);
    await jsonRequest(`${apiUrl}/api/scans/${scanResult.scanId}/attack-paths`);
    await jsonRequest(`${apiUrl}/api/scans/${scanResult.scanId}/report`);
    await jsonRequest(`${apiUrl}/api/demo/reset`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetId }) });
    const token = await login(baseUrl);
    const state = await jsonRequest<{ role: string; is_admin: boolean }>(`${baseUrl}/users/1`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(state.role, 'customer'); assert.equal(state.is_admin, false);

    const selectiveTarget = await jsonRequest<{ target: { id: string } }>(`${apiUrl}/api/targets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Selective module sandbox', baseUrl, openApiUrl: `${baseUrl}/openapi.json`, sandboxMode: true, demoSandbox: true, allowDestructiveTests: true, identities: users.map(({ id, username, role, ownedResources }) => ({ id, username, role, ownedResources })) }) });
    const selectiveScan = await jsonRequest<{ scanId: string }>(`${apiUrl}/api/scans`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetId: selectiveTarget.target.id, identities: users, checks: { bola: false, bfla: false, dataExposure: false, massAssignment: false, rateLimiting: false } }) });
    for (let attempt = 0; attempt < 100; attempt += 1) {
      status = await jsonRequest(`${apiUrl}/api/scans/${selectiveScan.scanId}/status`);
      if (status.status === 'COMPLETED' || status.status === 'FAILED') break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.equal(status.status, 'COMPLETED', status.error ?? 'selective scan did not complete');
    const selectiveResults = await jsonRequest<{ scan: { findings: Array<{ vulnerabilityType: string }> } }>(`${apiUrl}/api/scans/${selectiveScan.scanId}`);
    assert.deepEqual(selectiveResults.scan.findings, [], 'disabled modules must not execute or report findings');
  } finally {
    if (api) await new Promise<void>((resolve) => api!.close(() => resolve()));
    demo.kill();
    store.close();
    unlinkSync(join(testDatabaseDir, 'sentinel.sqlite'));
    rmdirSync(testDatabaseDir);
  }
});

async function login(baseUrl: string) {
  const result = await jsonRequest<{ token: string }>(`${baseUrl}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'alice', password: 'alice123' }) });
  return result.token;
}
