export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
export type ScanStatus = 'CREATED' | 'PARSING' | 'DISCOVERING' | 'MODELING' | 'GENERATING_TESTS' | 'EXECUTING' | 'VALIDATING' | 'BUILDING_GRAPH' | 'ANALYZING_IMPACT' | 'COMPLETED' | 'FAILED';
export interface Identity { id: string; username: string; role: string; token?: string; credentials?: Record<string, unknown>; ownedResources?: Record<string, string[]> }
export interface Endpoint { id: string; path: string; method: HttpMethod; operationId?: string; parameters: Array<{ name: string; in: string; required: boolean; schema?: unknown }>; requestSchema?: unknown; responseSchema?: unknown; authenticationRequired: boolean; roles: string[] }
export interface Resource { id: string; name: string; endpointIds: string[]; identifierFields: string[]; ownerFields: string[]; sensitiveFields: string[] }
export interface Relationship { sourceResource: string; targetResource: string; relationshipType: string; identifierMapping: string; confidence: number }
export interface GraphNode { id: string; type: 'IDENTITY' | 'ROLE' | 'ENDPOINT' | 'RESOURCE' | 'OBJECT' | 'SENSITIVE_DATA'; label: string; properties?: Record<string, unknown> }
export interface GraphEdge { source: string; target: string; type: 'OWNS' | 'CAN_ACCESS' | 'CALLS' | 'RETURNS' | 'REFERENCES' | 'REQUIRES_ROLE' | 'UNAUTHORIZED_ACCESS' | 'LEADS_TO'; label?: string }
export interface Evidence { id: string; attacker: string; victim: string; originalRequest: Record<string, unknown>; modifiedRequest: Record<string, unknown>; originalResponse: Record<string, unknown>; modifiedResponse: Record<string, unknown>; victimBaselineRequest?: Record<string, unknown>; victimBaselineResponse?: Record<string, unknown>; ownershipEvidence: string; authorizationViolation: string; confirmationChecks: string[]; confidence: number }
export interface AttackPath { id: string; entryPoint: string; attacker: string; steps: Array<{ nodeId: string; label: string; relationship: string }>; branches?: Array<{ resourceId: string; objectId: string; steps: Array<{ nodeId: string; label: string; relationship: string }>; depth: number }>; affectedResources: string[]; sensitiveData: string[]; depth: number; evidenceIds: string[] }
export interface ImpactAnalysis { directlyExposed: string[]; indirectlyReachable: string[]; sensitiveFields: string[]; affectedIdentities: string[]; attackPathDepth: number; privilegeDifference: string }
export interface Finding { id: string; scanId: string; vulnerabilityType: string; title: string; severity: 'critical' | 'high' | 'medium' | 'low' | 'info'; confidence: number; endpoint: string; method: string; attackerIdentity: string; victimIdentity?: string; affectedObject?: string; evidenceIds: string[]; attackPathId?: string; impact: ImpactAnalysis; remediation: string; poc: string; createdAt: string; evidence: Evidence }
export interface ScanRecord { id: string; targetId: string; status: ScanStatus; progress: number; currentStep: string; error?: string; warnings?: string[]; createdAt: string; completedAt?: string; findings?: Finding[]; attackPaths?: AttackPath[]; graph?: { nodes: GraphNode[]; edges: GraphEdge[] }; resources?: Resource[]; relationships?: Relationship[]; endpoints?: Endpoint[]; testedEndpointIds?: string[]; report?: Record<string, unknown> }
export interface Target { id: string; name: string; baseUrl: string; openApiUrl: string; sandboxMode: boolean; demoSandbox: boolean; authorized: boolean; allowDestructiveTests: boolean; loginPath: string; tokenJsonPath: string; tokenPrefix: string; identities: Identity[]; openApiDocument?: Record<string, unknown>; createdAt: string }

// === 24-HOUR SECURITY SYNC TYPES ===
export type SyncStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'BLOCKED';
export type FindingStatus = 'NEW' | 'RESOLVED' | 'UNCHANGED' | 'REGRESSED';

export interface NormalizedEndpoint {
  id: string;  // e.g. 'GET /orders/{id}'
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

export interface AttackPathDiff {
  newlyReachableResources: string[];
  disappearedAttackPaths: string[];
  changedAttackPaths: Array<{
    id: string;
    entryPoint: string;
    previousDepth: number;
    currentDepth: number;
    newSteps: string[];
  }>;
  newlyExposedSensitiveData: string[];
}

export interface ImpactDiff {
  newlyDirectlyExposed: string[];
  newlyIndirectlyReachable: string[];
  newlyExposedSensitiveFields: string[];
  newlyAffectedIdentities: string[];
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
  attackPathDiff?: AttackPathDiff;
  impactDiff?: ImpactDiff;
  newFindingCount: number;
  resolvedFindingCount: number;
  unchangedFindingCount: number;
  regressedFindingCount: number;
  driftDetected: boolean;
  simulationMode?: boolean;
  llmExplanation?: string;
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
