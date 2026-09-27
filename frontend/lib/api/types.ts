export type ScanStatus = 'CREATED' | 'PARSING' | 'DISCOVERING' | 'MODELING' | 'GENERATING_TESTS' | 'EXECUTING' | 'VALIDATING' | 'BUILDING_GRAPH' | 'ANALYZING_IMPACT' | 'COMPLETED' | 'FAILED';
export interface Target { id: string; name: string; baseUrl: string; openApiUrl: string; sandboxMode: boolean; demoSandbox: boolean; authorized: boolean; allowDestructiveTests: boolean; createdAt: string }
export interface OpenApiSummary { title: string; version: string; endpointCount: number; resourceCount: number; relationshipCount: number; endpoints: Array<{ id: string; path: string; method: string; authenticationRequired: boolean; roles: string[] }> }
export interface IdentityInput { id: string; username: string; role: string; credentials: { username: string; password: string }; ownedResources: Record<string, string[]> }
export interface GraphNode { id: string; type: string; label: string; properties?: Record<string, unknown> }
export interface GraphEdge { source: string; target: string; type: string; label?: string }
export interface Endpoint { id: string; path: string; method: string; operationId?: string; parameters: Array<{ name: string; in: string; required: boolean }>; authenticationRequired: boolean; roles: string[] }
export interface AttackPath { id: string; entryPoint: string; attacker: string; steps: Array<{ nodeId: string; label: string; relationship: string }>; branches?: Array<{ resourceId: string; objectId: string; steps: Array<{ nodeId: string; label: string; relationship: string }>; depth: number }>; affectedResources: string[]; sensitiveData: string[]; depth: number; evidenceIds: string[] }
export interface Impact { directlyExposed: string[]; indirectlyReachable: string[]; sensitiveFields: string[]; affectedIdentities: string[]; attackPathDepth: number; privilegeDifference: string }
export interface Evidence { id: string; attacker: string; victim: string; originalRequest: Record<string, unknown>; modifiedRequest: Record<string, unknown>; originalResponse: Record<string, unknown>; modifiedResponse: Record<string, unknown>; victimBaselineRequest?: Record<string, unknown>; victimBaselineResponse?: Record<string, unknown>; ownershipEvidence: string; authorizationViolation: string; confirmationChecks: string[]; confidence: number }
export interface Finding { id: string; scanId: string; vulnerabilityType: string; title: string; severity: 'critical' | 'high' | 'medium' | 'low' | 'info'; confidence: number; endpoint: string; method: string; attackerIdentity: string; victimIdentity?: string; affectedObject?: string; evidenceIds: string[]; attackPathId?: string; impact: Impact; remediation: string; poc: string; createdAt: string; evidence?: Evidence }
export interface ScanStatusResponse { id: string; status: ScanStatus; progress: number; currentStep: string; error?: string }
export interface Scan { id: string; targetId: string; status: ScanStatus; progress: number; currentStep: string; error?: string; warnings?: string[]; createdAt: string; completedAt?: string; findings?: Finding[]; attackPaths?: AttackPath[]; graph?: { nodes: GraphNode[]; edges: GraphEdge[] }; resources?: Array<{ id: string; name: string; endpointIds: string[]; identifierFields: string[]; ownerFields: string[]; sensitiveFields: string[] }>; relationships?: Array<{ sourceResource: string; targetResource: string; relationshipType: string; identifierMapping: string; confidence: number }>; endpoints?: Endpoint[]; testedEndpointIds?: string[]; report?: Record<string, unknown> }
export interface ScanChecks { bola: boolean; bfla: boolean; dataExposure: boolean; massAssignment: boolean; rateLimiting: boolean; rateLimitRequests: number }

// === 24-HOUR SECURITY SYNC TYPES ===
export type SyncStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BLOCKED';
export type FindingStatus = 'NEW' | 'RESOLVED' | 'UNCHANGED' | 'REGRESSED';

export interface NormalizedEndpoint {
  id: string;
  method: string;
  path: string;
  authRequired: boolean;
  parameterNames: string[];
  requestBodySchema?: string;
  responseSchema?: string;
  securitySchemes: string[];
}

export interface ApiSnapshot {
  id: string;
  targetId: string;
  createdAt: string;
  specHash: string;
  endpoints: NormalizedEndpoint[];
}

export interface EndpointDiff {
  added: NormalizedEndpoint[];
  removed: NormalizedEndpoint[];
  modified: Array<{ previous: NormalizedEndpoint; current: NormalizedEndpoint; reason: string }>;
  unchanged: NormalizedEndpoint[];
}

export interface FindingComparison {
  fingerprint: string;
  findingId: string;
  status: FindingStatus;
  previousFindingId?: string;
  title: string;
  severity: string;
  vulnerabilityType: string;
}

export interface DriftEvent {
  endpoint: string;
  previousBehavior: string;
  currentBehavior: string;
  driftType: 'AUTHORIZATION' | 'DATA_EXPOSURE' | 'ENDPOINT_REMOVED' | 'ENDPOINT_ADDED';
  evidence?: string;
}

export interface SyncRecord {
  id: string;
  targetId: string;
  startedAt: string;
  completedAt?: string;
  status: SyncStatus;
  previousSnapshotId?: string;
  currentSnapshotId?: string;
  previousScanId?: string;
  currentScanId?: string;
  endpointDiff?: EndpointDiff;
  findingComparisons?: FindingComparison[];
  driftEvents?: DriftEvent[];
  newFindingCount: number;
  resolvedFindingCount: number;
  unchangedFindingCount: number;
  regressedFindingCount: number;
  driftDetected: boolean;
  error?: string;
}

export interface MonitoringConfig {
  targetId: string;
  enabled: boolean;
  syncIntervalHours: number;
  lastSyncAt?: string;
  nextSyncAt?: string;
  baselineScanId?: string;
  baselineSnapshotId?: string;
  updatedAt: string;
}
