import type { Finding } from '../models/types.js';

export interface FindingEvidenceContext {
  type: string;
  endpoint: string;
  attacker: string;
  victim?: string;
  object?: string;
  expectedStatus: number;
  actualStatus: number;
  sensitiveFields: string[];
  downstreamResources: string[];
  ownershipEvidence?: string;
  authorizationViolation?: string;
}

export interface FindingExplanation {
  vulnerabilityReason: string;
  boundaryCrossed: string;
  affectedAssets: string;
  evidenceSupport: string;
  remediationRecommendation: string;
  attackPathNarrative: string;
}

/**
 * Deterministic fallback generator when external LLM is not configured, offline, or returns error.
 * Ensures the scanner NEVER fails or stalls if LLM is unavailable.
 */
function generateDeterministicExplanation(ctx: FindingEvidenceContext): FindingExplanation {
  const victimLabel = ctx.victim ? `victim '${ctx.victim}'` : 'another user / system';
  return {
    vulnerabilityReason: `${ctx.type} allows attacker '${ctx.attacker}' to access or mutate ${ctx.object || 'resources'} belonging to ${victimLabel} on ${ctx.endpoint}.`,
    boundaryCrossed: `Authorization boundary failed: caller expected HTTP ${ctx.expectedStatus} (Access Denied), but received HTTP ${ctx.actualStatus} (Success).`,
    affectedAssets: ctx.sensitiveFields.length > 0 
      ? `Exposes sensitive properties: ${ctx.sensitiveFields.join(', ')}.`
      : (ctx.downstreamResources.length > 0 ? `Exposes downstream resources: ${ctx.downstreamResources.join(', ')}.` : 'Direct object access compromised.'),
    evidenceSupport: ctx.ownershipEvidence 
      ? `${ctx.ownershipEvidence}. Violation: ${ctx.authorizationViolation || 'Improper access validation'}.`
      : `Verified by authenticated probe returning status code ${ctx.actualStatus} instead of ${ctx.expectedStatus}.`,
    remediationRecommendation: `Enforce server-side authorization check (e.g. resource.owner_id === caller.id) on ${ctx.endpoint} before processing payload.`,
    attackPathNarrative: ctx.downstreamResources.length > 0
      ? `Attacker enters via ${ctx.endpoint} -> extracts ${ctx.object || 'parent record'} -> pivots to downstream resources (${ctx.downstreamResources.join(', ')}).`
      : `Attacker accesses ${ctx.endpoint} directly without sufficient permission checks.`,
  };
}

/**
 * Extracts structured evidence from a Finding into an LLM-friendly context.
 */
export function extractEvidenceContext(finding: Finding): FindingEvidenceContext {
  const ev = finding.evidence;
  const originalRes = ev?.originalResponse as Record<string, unknown> | undefined;
  const modifiedRes = ev?.modifiedResponse as Record<string, unknown> | undefined;

  const expectedStatus = typeof originalRes?.observedStatus === 'number' 
    ? originalRes.observedStatus 
    : (typeof originalRes?.status === 'number' ? originalRes.status : 403);

  const actualStatus = typeof modifiedRes?.observedStatus === 'number'
    ? modifiedRes.observedStatus
    : (typeof modifiedRes?.status === 'number' ? modifiedRes.status : 200);

  return {
    type: finding.vulnerabilityType,
    endpoint: `${finding.method} ${finding.endpoint}`,
    attacker: finding.attackerIdentity,
    victim: finding.victimIdentity,
    object: finding.affectedObject,
    expectedStatus,
    actualStatus,
    sensitiveFields: finding.impact?.sensitiveFields ?? [],
    downstreamResources: finding.impact?.indirectlyReachable ?? [],
    ownershipEvidence: ev?.ownershipEvidence,
    authorizationViolation: ev?.authorizationViolation,
  };
}

/**
 * Explains a finding using an optional LLM layer with deterministic fallback.
 * Strictly adheres to the requirement: the LLM never decides if a finding exists;
 * it only explains proven evidence.
 */
export async function explainFinding(finding: Finding): Promise<FindingExplanation> {
  const ctx = extractEvidenceContext(finding);

  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return generateDeterministicExplanation(ctx);
  }

  try {
    // If Gemini key is set, attempt call with short timeout
    if (process.env.GEMINI_API_KEY) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const prompt = `You are an API security expert. Given the following confirmed security finding evidence:
${JSON.stringify(ctx, null, 2)}

Provide a concise JSON response strictly with keys:
"vulnerabilityReason", "boundaryCrossed", "affectedAssets", "evidenceSupport", "remediationRecommendation", "attackPathNarrative".
Do not invent facts not present in the evidence.`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const match = rawText.match(/\{[\s\S]*\}/);
          if (match) {
            const parsed = JSON.parse(match[0]) as FindingExplanation;
            if (parsed.vulnerabilityReason && parsed.remediationRecommendation) {
              return parsed;
            }
          }
        }
      }
    }
  } catch {
    // Silent fallback to deterministic explanation
  }

  return generateDeterministicExplanation(ctx);
}
