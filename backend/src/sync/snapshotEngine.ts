import { createHash, randomUUID } from 'node:crypto';
import type { ApiSnapshot, NormalizedEndpoint } from '../models/types.js';
import { parseOpenApi } from '../scanner/parser/openapiParser.js';
import { discoverEndpoints } from '../scanner/discovery/endpointDiscovery.js';

/**
 * Recursively sorts object keys for deterministic JSON serialization.
 * Prevents false positives from JSON key-order changes.
 */
function sortedJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(sortedJson).join(',') + ']';
  const sorted = Object.keys(value as Record<string, unknown>).sort().map((k) => `${JSON.stringify(k)}:${sortedJson((value as Record<string, unknown>)[k])}`);
  return '{' + sorted.join(',') + '}';
}

/**
 * Normalizes an OpenAPI-parsed endpoint into a deterministic, comparable structure.
 */
function normalizeEndpoint(ep: { id: string; path: string; method: string; parameters: Array<{ name: string; in: string; required: boolean; schema?: unknown }>; authenticationRequired: boolean; roles: string[]; requestSchema?: unknown; responseSchema?: unknown }): NormalizedEndpoint {
  return {
    id: ep.id,
    method: ep.method.toUpperCase(),
    path: ep.path,
    authRequired: ep.authenticationRequired,
    parameterNames: ep.parameters.map((p) => `${p.in}:${p.name}`).sort(),
    requestBodySchema: ep.requestSchema ? sortedJson(ep.requestSchema) : undefined,
    responseSchema: ep.responseSchema ? sortedJson(ep.responseSchema) : undefined,
    securitySchemes: (ep.roles ?? []).slice().sort(),
  };
}

/**
 * Creates an ApiSnapshot from a raw OpenAPI spec string or object.
 */
export function createSnapshot(targetId: string, specInput: string | Record<string, unknown>): ApiSnapshot {
  const parsed = parseOpenApi(specInput);
  const endpoints = discoverEndpoints(parsed.endpoints);
  const normalized = endpoints.map(normalizeEndpoint);

  // Sort endpoints deterministically for stable hash
  normalized.sort((a, b) => a.id.localeCompare(b.id));

  const specHash = createHash('sha256').update(sortedJson(normalized)).digest('hex');

  return {
    id: randomUUID(),
    targetId,
    createdAt: new Date().toISOString(),
    specHash,
    endpoints: normalized,
  };
}
