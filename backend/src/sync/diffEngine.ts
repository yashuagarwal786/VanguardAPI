import type { NormalizedEndpoint, EndpointDiff } from '../models/types.js';

/**
 * Computes a deterministic diff between two sets of normalized API endpoints.
 * Classification: ADDED, REMOVED, MODIFIED (auth, params, schema changed), UNCHANGED.
 */
export function diffEndpoints(previous: NormalizedEndpoint[], current: NormalizedEndpoint[]): EndpointDiff {
  const prevMap = new Map(previous.map((ep) => [ep.id, ep]));
  const currMap = new Map(current.map((ep) => [ep.id, ep]));

  const added: NormalizedEndpoint[] = [];
  const removed: NormalizedEndpoint[] = [];
  const modified: EndpointDiff['modified'] = [];
  const unchanged: NormalizedEndpoint[] = [];

  // Check current endpoints against previous
  for (const [id, curr] of currMap) {
    const prev = prevMap.get(id);
    if (!prev) {
      added.push(curr);
      continue;
    }
    const reason = detectModification(prev, curr);
    if (reason) {
      modified.push({ previous: prev, current: curr, reason });
    } else {
      unchanged.push(curr);
    }
  }

  // Check removed endpoints
  for (const [id, prev] of prevMap) {
    if (!currMap.has(id)) removed.push(prev);
  }

  return { added, removed, modified, unchanged };
}

function detectModification(prev: NormalizedEndpoint, curr: NormalizedEndpoint): string | null {
  const reasons: string[] = [];

  if (prev.authRequired !== curr.authRequired) {
    reasons.push(`auth requirement changed: ${String(prev.authRequired)} → ${String(curr.authRequired)}`);
  }

  const prevParams = prev.parameterNames.slice().sort().join(',');
  const currParams = curr.parameterNames.slice().sort().join(',');
  if (prevParams !== currParams) {
    reasons.push(`parameters changed`);
  }

  if ((prev.requestBodySchema ?? '') !== (curr.requestBodySchema ?? '')) {
    reasons.push(`request schema changed`);
  }

  if ((prev.responseSchema ?? '') !== (curr.responseSchema ?? '')) {
    reasons.push(`response schema changed`);
  }

  const prevSec = prev.securitySchemes.slice().sort().join(',');
  const currSec = curr.securitySchemes.slice().sort().join(',');
  if (prevSec !== currSec) {
    reasons.push(`security schemes changed`);
  }

  return reasons.length ? reasons.join('; ') : null;
}
