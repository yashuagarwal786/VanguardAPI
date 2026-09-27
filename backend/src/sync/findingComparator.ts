import type { Finding, FindingComparison } from '../models/types.js';

/**
 * Generates a stable fingerprint for a finding based on deterministic properties.
 * Does NOT use timestamps, IDs, or scan-specific values.
 */
export function fingerprintFinding(finding: Finding): string {
  const parts = [
    finding.vulnerabilityType.toUpperCase(),
    finding.method.toUpperCase(),
    finding.endpoint.toLowerCase().replace(/\{[^}]+\}/g, '{id}'),  // normalize path params
    (finding.impact?.directlyExposed ?? []).slice().sort().join('+'),
  ];
  return parts.join('::');
}

export interface ComparisonResult {
  comparisons: FindingComparison[];
  newCount: number;
  resolvedCount: number;
  unchangedCount: number;
  regressedCount: number;
}

/**
 * Compares current scan findings against a previous baseline.
 * Handles NEW, RESOLVED, UNCHANGED, and REGRESSED states.
 * 
 * @param previousFindings Findings from the baseline scan
 * @param currentFindings Findings from the new sync scan
 * @param previouslyResolvedFingerprints Fingerprints known to have been RESOLVED in a prior sync
 */
export function compareFindings(
  previousFindings: Finding[],
  currentFindings: Finding[],
  previouslyResolvedFingerprints: Set<string> = new Set(),
): ComparisonResult {
  const prevByFingerprint = new Map<string, Finding>();
  for (const f of previousFindings) {
    prevByFingerprint.set(fingerprintFinding(f), f);
  }

  const currByFingerprint = new Map<string, Finding>();
  for (const f of currentFindings) {
    currByFingerprint.set(fingerprintFinding(f), f);
  }

  const comparisons: FindingComparison[] = [];
  let newCount = 0;
  let resolvedCount = 0;
  let unchangedCount = 0;
  let regressedCount = 0;

  // Process current findings
  for (const [fingerprint, curr] of currByFingerprint) {
    const prev = prevByFingerprint.get(fingerprint);
    if (!prev) {
      // Was this previously resolved and now reappeared?
      const status = previouslyResolvedFingerprints.has(fingerprint) ? 'REGRESSED' : 'NEW';
      if (status === 'REGRESSED') regressedCount++; else newCount++;
      comparisons.push({
        fingerprint,
        findingId: curr.id,
        status,
        title: curr.title,
        severity: curr.severity,
        vulnerabilityType: curr.vulnerabilityType,
      });
    } else {
      unchangedCount++;
      comparisons.push({
        fingerprint,
        findingId: curr.id,
        previousFindingId: prev.id,
        status: 'UNCHANGED',
        title: curr.title,
        severity: curr.severity,
        vulnerabilityType: curr.vulnerabilityType,
      });
    }
  }

  // Process resolved findings (in previous but not in current)
  for (const [fingerprint, prev] of prevByFingerprint) {
    if (!currByFingerprint.has(fingerprint)) {
      resolvedCount++;
      comparisons.push({
        fingerprint,
        findingId: prev.id,
        status: 'RESOLVED',
        title: prev.title,
        severity: prev.severity,
        vulnerabilityType: prev.vulnerabilityType,
      });
    }
  }

  return { comparisons, newCount, resolvedCount, unchangedCount, regressedCount };
}
