'use client';

import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  ArrowRight,
  Boxes,
  Database,
  Eye,
  Globe,
  Layers,
  Maximize2,
  Minimize2,
  RotateCcw,
  Search,
  Shield,
  Users,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { GraphEdge, GraphNode } from '@/lib/api/types';

interface AuthorizationGraphProps {
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  targetBaseUrl?: string;
  targetName?: string;
  scanId?: string;
}

type LayerType = 'PRINCIPALS' | 'ENDPOINTS' | 'RESOURCES' | 'OBJECTS' | 'DATA';

interface CategorizedLayer {
  id: LayerType;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  types: string[];
}

const LAYERS: CategorizedLayer[] = [
  {
    id: 'PRINCIPALS',
    title: 'Identities & Roles',
    subtitle: 'Access principals, roles & tenants',
    icon: Users,
    color: 'text-sky-400',
    borderColor: 'border-sky-500/30',
    types: ['IDENTITY', 'ROLE', 'TENANT'],
  },
  {
    id: 'ENDPOINTS',
    title: 'API Endpoints',
    subtitle: 'Routes parsed from OpenAPI',
    icon: Globe,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    types: ['ENDPOINT'],
  },
  {
    id: 'RESOURCES',
    title: 'Domain Resources',
    subtitle: 'Modeled entities & schemas',
    icon: Database,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    types: ['RESOURCE'],
  },
  {
    id: 'OBJECTS',
    title: 'Probed Objects',
    subtitle: 'Live instances tested for BOLA',
    icon: Boxes,
    color: 'text-orange-400',
    borderColor: 'border-orange-500/30',
    types: ['OBJECT'],
  },
  {
    id: 'DATA',
    title: 'Sensitive Assets',
    subtitle: 'Exposed fields & leak risks',
    icon: Eye,
    color: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    types: ['SENSITIVE_DATA'],
  },
];

const nodeColorConfig: Record<string, { bg: string; border: string; text: string; glow: string; badge: string }> = {
  IDENTITY: { bg: '#0c1d2e', border: '#38bdf8', text: '#7dd3fc', glow: 'rgba(56, 189, 248, 0.25)', badge: 'Identity' },
  ROLE: { bg: '#1e1435', border: '#c084fc', text: '#e9d5ff', glow: 'rgba(192, 132, 252, 0.25)', badge: 'Role' },
  TENANT: { bg: '#291024', border: '#f472b6', text: '#fbcfe8', glow: 'rgba(244, 114, 182, 0.25)', badge: 'Tenant' },
  ENDPOINT: { bg: '#06281e', border: '#34d399', text: '#a7f3d0', glow: 'rgba(52, 211, 153, 0.25)', badge: 'Endpoint' },
  RESOURCE: { bg: '#261c06', border: '#fbbf24', text: '#fde68a', glow: 'rgba(251, 191, 36, 0.25)', badge: 'Resource' },
  OBJECT: { bg: '#2a1408', border: '#fb923c', text: '#fed7aa', glow: 'rgba(251, 146, 60, 0.25)', badge: 'Object' },
  SENSITIVE_DATA: { bg: '#2e0a12', border: '#f43f5e', text: '#fecdd3', glow: 'rgba(244, 63, 94, 0.35)', badge: 'Sensitive' },
};

function getLayerForType(type: string): LayerType {
  for (const layer of LAYERS) {
    if (layer.types.includes(type)) return layer.id;
  }
  return 'RESOURCES';
}

const LAYER_WIDTH = 230;
const LAYER_GAP = 48;
const PADDING_X = 36;
const PADDING_Y = 70;
const NODE_WIDTH = 210;
const NODE_HEIGHT = 56;
const VERTICAL_GAP = 18;

export const DEFAULT_API_GRAPH_NODES: GraphNode[] = [
  // Tier 1: Principals
  { id: 'identity:alice', type: 'IDENTITY', label: 'Alice (Attacker Context)' },
  { id: 'identity:bob', type: 'IDENTITY', label: 'Bob (Victim Context)' },
  { id: 'role:customer', type: 'ROLE', label: 'Role: Customer' },
  { id: 'role:admin', type: 'ROLE', label: 'Role: Admin' },

  // Tier 2: Endpoints (Directly generated from OpenAPI endpoints)
  { id: 'endpoint:post_login', type: 'ENDPOINT', label: 'POST /login' },
  { id: 'endpoint:get_orders', type: 'ENDPOINT', label: 'GET /orders/{id}' },
  { id: 'endpoint:get_users', type: 'ENDPOINT', label: 'GET /users/{id}' },
  { id: 'endpoint:get_payment', type: 'ENDPOINT', label: 'GET /orders/{id}/payment' },
  { id: 'endpoint:get_invoice', type: 'ENDPOINT', label: 'GET /orders/{id}/invoice' },
  { id: 'endpoint:get_shipment', type: 'ENDPOINT', label: 'GET /orders/{id}/shipment' },
  { id: 'endpoint:put_admin_role', type: 'ENDPOINT', label: 'PUT /admin/users/{id}/role' },
  { id: 'endpoint:put_users', type: 'ENDPOINT', label: 'PUT /users/{id}' },
  { id: 'endpoint:get_me_orders', type: 'ENDPOINT', label: 'GET /me/orders' },

  // Tier 3: Domain Resources
  { id: 'resource:orders', type: 'RESOURCE', label: 'Order Resource' },
  { id: 'resource:users', type: 'RESOURCE', label: 'User Profile' },
  { id: 'resource:payments', type: 'RESOURCE', label: 'Payment Gateway' },
  { id: 'resource:invoices', type: 'RESOURCE', label: 'Billing Invoices' },
  { id: 'resource:shipments', type: 'RESOURCE', label: 'Logistics & Shipment' },
  { id: 'resource:admin', type: 'RESOURCE', label: 'RBAC Governance' },

  // Tier 4: Probed Objects
  { id: 'object:order:3', type: 'OBJECT', label: 'Order #3 (Bob)' },
  { id: 'object:user:2', type: 'OBJECT', label: 'User #2 (Bob)' },
  { id: 'object:payment:3', type: 'OBJECT', label: 'Payment Record #3' },
  { id: 'object:invoice:3', type: 'OBJECT', label: 'Tax Invoice #3' },
  { id: 'object:shipment:3', type: 'OBJECT', label: 'Shipment #3' },
  { id: 'object:admin_claim', type: 'OBJECT', label: 'Role: Admin Scope' },

  // Tier 5: Sensitive Assets
  { id: 'data:pan_card', type: 'SENSITIVE_DATA', label: 'Card PAN (Luhn Verified)' },
  { id: 'data:plaintext_password', type: 'SENSITIVE_DATA', label: 'Plaintext Password' },
  { id: 'data:admin_privilege', type: 'SENSITIVE_DATA', label: 'Admin Privilege Scope' },
  { id: 'data:shipping_address', type: 'SENSITIVE_DATA', label: 'Physical Delivery Address' },
];

export const DEFAULT_API_GRAPH_EDGES: GraphEdge[] = [
  // Principals to Roles
  { source: 'identity:alice', target: 'role:customer', type: 'OWNS', label: 'assigned' },
  { source: 'identity:bob', target: 'role:customer', type: 'OWNS', label: 'assigned' },

  // Caller to Endpoints
  { source: 'identity:alice', target: 'endpoint:get_orders', type: 'CAN_ACCESS', label: 'requests' },
  { source: 'identity:alice', target: 'endpoint:get_users', type: 'CAN_ACCESS', label: 'requests' },
  { source: 'identity:alice', target: 'endpoint:get_payment', type: 'CAN_ACCESS', label: 'requests' },
  { source: 'identity:alice', target: 'endpoint:get_invoice', type: 'CAN_ACCESS', label: 'requests' },
  { source: 'identity:alice', target: 'endpoint:get_shipment', type: 'CAN_ACCESS', label: 'requests' },
  { source: 'identity:alice', target: 'endpoint:put_admin_role', type: 'CAN_ACCESS', label: 'attempts' },

  // Endpoints to Resources
  { source: 'endpoint:get_orders', target: 'resource:orders', type: 'RETURNS', label: 'queries' },
  { source: 'endpoint:get_users', target: 'resource:users', type: 'RETURNS', label: 'queries' },
  { source: 'endpoint:get_payment', target: 'resource:payments', type: 'RETURNS', label: 'queries' },
  { source: 'endpoint:get_invoice', target: 'resource:invoices', type: 'RETURNS', label: 'queries' },
  { source: 'endpoint:get_shipment', target: 'resource:shipments', type: 'RETURNS', label: 'queries' },
  { source: 'endpoint:put_admin_role', target: 'resource:admin', type: 'RETURNS', label: 'mutates' },

  // Resources to Objects
  { source: 'resource:orders', target: 'object:order:3', type: 'RETURNS', label: 'instantiates' },
  { source: 'resource:users', target: 'object:user:2', type: 'RETURNS', label: 'instantiates' },
  { source: 'resource:payments', target: 'object:payment:3', type: 'RETURNS', label: 'instantiates' },
  { source: 'resource:invoices', target: 'object:invoice:3', type: 'RETURNS', label: 'instantiates' },
  { source: 'resource:shipments', target: 'object:shipment:3', type: 'RETURNS', label: 'instantiates' },
  { source: 'resource:admin', target: 'object:admin_claim', type: 'RETURNS', label: 'assigns' },

  // Unauthorized Access (Red breach edges)
  { source: 'endpoint:get_orders', target: 'object:order:3', type: 'UNAUTHORIZED_ACCESS', label: 'BOLA Breach' },
  { source: 'endpoint:get_users', target: 'object:user:2', type: 'UNAUTHORIZED_ACCESS', label: 'BOLA Breach' },
  { source: 'endpoint:put_admin_role', target: 'object:admin_claim', type: 'UNAUTHORIZED_ACCESS', label: 'BFLA Escalation' },

  // Objects to Sensitive Data
  { source: 'object:order:3', target: 'data:pan_card', type: 'RETURNS', label: 'exposes PAN' },
  { source: 'object:payment:3', target: 'data:pan_card', type: 'RETURNS', label: 'leaks card' },
  { source: 'object:user:2', target: 'data:plaintext_password', type: 'RETURNS', label: 'leaks password' },
  { source: 'object:shipment:3', target: 'data:shipping_address', type: 'RETURNS', label: 'leaks PII' },
  { source: 'object:admin_claim', target: 'data:admin_privilege', type: 'RETURNS', label: 'grants root' },
];

export function AuthorizationGraph({ nodes = [], edges = [], targetBaseUrl, targetName, scanId }: AuthorizationGraphProps) {
  const isDefaultTopology = !nodes || nodes.length === 0;
  const activeNodes = useMemo(() => (!nodes || nodes.length === 0 ? DEFAULT_API_GRAPH_NODES : nodes), [nodes]);
  const activeEdges = useMemo(() => (!edges || edges.length === 0 ? DEFAULT_API_GRAPH_EDGES : edges), [edges]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [fitToWidth, setFitToWidth] = useState(true);

  // Group nodes by hierarchical layers & calculate coordinates
  const { layerNodes, activeLayers, nodePositionMap, svgWidth, svgHeight, violationEdgesCount } = useMemo(() => {
    const layerMap: Record<LayerType, GraphNode[]> = {
      PRINCIPALS: [],
      ENDPOINTS: [],
      RESOURCES: [],
      OBJECTS: [],
      DATA: [],
    };

    const query = searchQuery.toLowerCase().trim();

    activeNodes.forEach((node) => {
      const matchesSearch =
        !query ||
        node.label.toLowerCase().includes(query) ||
        node.id.toLowerCase().includes(query) ||
        node.type.toLowerCase().includes(query);
      if (!matchesSearch) return;

      const layer = getLayerForType(node.type);
      layerMap[layer].push(node);
    });

    const activeLayers = LAYERS.filter((l) => layerMap[l.id].length > 0);
    const numLayers = Math.max(1, activeLayers.length);
    const width = Math.max(900, PADDING_X * 2 + numLayers * LAYER_WIDTH + (numLayers - 1) * LAYER_GAP);

    let maxNodesInLayer = 1;
    activeLayers.forEach((l) => {
      maxNodesInLayer = Math.max(maxNodesInLayer, layerMap[l.id].length);
    });

    const calculatedHeight = Math.max(540, PADDING_Y * 2 + maxNodesInLayer * (NODE_HEIGHT + VERTICAL_GAP));

    const posMap = new Map<string, { x: number; y: number; width: number; height: number; layer: LayerType; colIdx: number }>();

    activeLayers.forEach((layerDef, colIdx) => {
      const columnNodes = layerMap[layerDef.id];
      const columnX = PADDING_X + colIdx * (LAYER_WIDTH + LAYER_GAP) + LAYER_WIDTH / 2;
      const startY = PADDING_Y + 12 + NODE_HEIGHT / 2;

      columnNodes.forEach((node, rowIdx) => {
        const y = startY + rowIdx * (NODE_HEIGHT + VERTICAL_GAP);
        posMap.set(node.id, {
          x: columnX,
          y,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          layer: layerDef.id,
          colIdx,
        });
      });
    });

    const violationCount = activeEdges.filter(
      (e) => e.type === 'UNAUTHORIZED_ACCESS' || e.type === 'CROSSES_TENANT'
    ).length;

    return {
      layerNodes: layerMap,
      activeLayers,
      nodePositionMap: posMap,
      svgWidth: width,
      svgHeight: calculatedHeight,
      violationEdgesCount: violationCount,
    };
  }, [activeNodes, activeEdges, searchQuery]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return activeNodes.find((n) => n.id === selectedNodeId) || null;
  }, [activeNodes, selectedNodeId]);

  const activeFocusId = selectedNodeId || hoveredNodeId;
  const connectedEdgeSet = useMemo(() => {
    if (!activeFocusId) return new Set<string>();
    const set = new Set<string>();
    activeEdges.forEach((edge, idx) => {
      if (edge.source === activeFocusId || edge.target === activeFocusId) {
        set.add(`${edge.source}:${edge.target}:${idx}`);
      }
    });
    return set;
  }, [activeEdges, activeFocusId]);

  const connectedNodeIds = useMemo(() => {
    if (!activeFocusId) return new Set<string>();
    const set = new Set<string>([activeFocusId]);
    activeEdges.forEach((edge) => {
      if (edge.source === activeFocusId) set.add(edge.target);
      if (edge.target === activeFocusId) set.add(edge.source);
    });
    return set;
  }, [activeEdges, activeFocusId]);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111113]/90 backdrop-blur-md overflow-hidden shadow-2xl flex flex-col">
      {/* Top Header & Context Bar */}
      <div className="border-b border-white/10 bg-black/40 p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-lime-400">
                Live Authorization Model
              </span>
              {targetBaseUrl && (
                <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[11px] text-zinc-300">
                  {targetBaseUrl}
                </span>
              )}
            </div>
            <h3 className="mt-1 text-lg font-bold text-white flex items-center gap-2">
              {targetName || 'API Authorization Graph & Blast Radius'}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-400">
              Deterministic graph generated from OpenAPI routes and authenticated sandbox probes.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-center">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Nodes</p>
              <p className="font-mono text-sm font-bold text-white">{activeNodes.length}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-center">
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Relationships</p>
              <p className="font-mono text-sm font-bold text-sky-300">{activeEdges.length}</p>
            </div>
            {violationEdgesCount > 0 ? (
              <div className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-3 py-1.5 text-center">
                <p className="text-[10px] uppercase tracking-wider text-rose-300">Violations</p>
                <p className="font-mono text-sm font-bold text-rose-400">{violationEdgesCount} BOLA/BFLA</p>
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3 py-1.5 text-center">
                <p className="text-[10px] uppercase tracking-wider text-emerald-300">Violations</p>
                <p className="font-mono text-sm font-bold text-emerald-400">0 Breaches</p>
              </div>
            )}
          </div>
        </div>

        {/* Search and Zoom Controls */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-3">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search endpoints, identities, or resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/50 pl-8 pr-8 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-lime-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setFitToWidth(!fitToWidth);
                setZoomLevel(1);
              }}
              className={`rounded-lg border px-2.5 py-1 text-xs font-mono flex items-center gap-1.5 transition-colors ${
                fitToWidth
                  ? 'border-lime-400/40 bg-lime-400/10 text-lime-400'
                  : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
              }`}
              title={fitToWidth ? 'Switch to Horizontal Scroll Mode' : 'Fit Entire Topology to Screen Width'}
            >
              {fitToWidth ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span>{fitToWidth ? 'Fit: Auto' : 'Fit: 100%'}</span>
            </button>
            <button
              onClick={() => {
                setFitToWidth(false);
                setZoomLevel((z) => Math.min(1.5, z + 0.1));
              }}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setFitToWidth(false);
                setZoomLevel((z) => Math.max(0.7, z - 0.1));
              }}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setZoomLevel(1);
                setFitToWidth(true);
              }}
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
              title="Reset View"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main SVG Graph Canvas */}
      <div className="relative overflow-auto bg-[#0a0a0c] p-4 min-h-[460px] max-h-[620px] scrollbar-thin scrollbar-thumb-zinc-800">
        <div style={{ 
          transform: zoomLevel !== 1 ? `scale(${zoomLevel})` : undefined, 
          transformOrigin: 'top left', 
          transition: 'transform 0.2s ease-out',
          width: fitToWidth && zoomLevel === 1 ? '100%' : undefined 
        }}>
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            width={fitToWidth && zoomLevel === 1 ? '100%' : svgWidth}
            height={fitToWidth && zoomLevel === 1 ? '100%' : svgHeight}
            className={fitToWidth && zoomLevel === 1 ? 'w-full h-auto select-none' : 'select-none'}
            role="img"
            aria-label="Layered API Authorization Topology Graph"
          >
            <defs>
              <marker id="arrow-normal" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#71717a" />
              </marker>
              <marker id="arrow-highlighted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#38bdf8" />
              </marker>
              <marker id="arrow-violation" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#ef4444" />
              </marker>

              <pattern id="graph-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="12" cy="12" r="0.8" fill="#27272a" />
              </pattern>
            </defs>

            <rect width={svgWidth} height={svgHeight} fill="url(#graph-grid)" opacity="0.7" />

            {/* Render Column Layers */}
            {activeLayers.map((layer, colIdx) => {
              const activeCount = layerNodes[layer.id].length;
              const xPos = PADDING_X + colIdx * (LAYER_WIDTH + LAYER_GAP) + LAYER_WIDTH / 2;
              return (
                <g key={layer.id}>
                  <rect
                    x={xPos - LAYER_WIDTH / 2}
                    y={15}
                    width={LAYER_WIDTH}
                    height={svgHeight - 30}
                    rx={14}
                    fill="#131317"
                    fillOpacity="0.4"
                    stroke="#27272a"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={xPos}
                    y={42}
                    fill="#a1a1aa"
                    fontSize="11"
                    fontWeight="600"
                    textAnchor="middle"
                    className="tracking-wider uppercase font-mono"
                  >
                    {layer.title} ({activeCount})
                  </text>
                </g>
              );
            })}

            {/* Render Curved Bezier Edges */}
            {edges.map((edge, index) => {
              const src = nodePositionMap.get(edge.source);
              const tgt = nodePositionMap.get(edge.target);
              if (!src || !tgt) return null;

              const isViolation = edge.type === 'UNAUTHORIZED_ACCESS' || edge.type === 'CROSSES_TENANT';
              const edgeKey = `${edge.source}:${edge.target}:${index}`;
              const isFocused = connectedEdgeSet.has(edgeKey);
              const isDimmed = activeFocusId && !isFocused;

              const x1 = src.x + src.width / 2;
              const y1 = src.y;
              const x2 = tgt.x - tgt.width / 2;
              const y2 = tgt.y;

              const colSpan = Math.abs((tgt.colIdx ?? 1) - (src.colIdx ?? 0));
              let pathD = '';
              if (colSpan > 1) {
                const curvature = Math.min(65, colSpan * 24);
                const archY = y1 < y2 ? Math.min(y1, y2) - curvature : Math.max(y1, y2) + curvature;
                pathD = `M ${x1} ${y1} C ${x1 + 60} ${archY}, ${x2 - 60} ${archY}, ${x2} ${y2}`;
              } else {
                const dx = Math.max(45, (x2 - x1) * 0.48);
                pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
              }

              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;

              return (
                <g key={edgeKey} opacity={isDimmed ? 0.15 : 1} className="transition-opacity duration-200">
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isViolation ? '#ef4444' : isFocused ? '#38bdf8' : '#52525b'}
                    strokeWidth={isViolation ? 2.5 : isFocused ? 2 : 1.2}
                    strokeDasharray={isViolation ? '5 3' : undefined}
                    markerEnd={isViolation ? 'url(#arrow-violation)' : isFocused ? 'url(#arrow-highlighted)' : 'url(#arrow-normal)'}
                  />
                  {(edge.label || isViolation) && (
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-45"
                        y="-9"
                        width="90"
                        height="18"
                        rx="4"
                        fill={isViolation ? '#450a0a' : '#18181b'}
                        stroke={isViolation ? '#ef4444' : '#3f3f46'}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="3"
                        fill={isViolation ? '#fca5a5' : '#a1a1aa'}
                        fontSize="8.5"
                        fontWeight={isViolation ? '700' : '500'}
                        textAnchor="middle"
                        className="font-mono select-none"
                      >
                        {isViolation ? 'UNAUTHORIZED' : (edge.label || edge.type).slice(0, 14)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Render Nodes */}
            {Array.from(nodePositionMap.entries()).map(([nodeId, pos]) => {
              const node = activeNodes.find((n) => n.id === nodeId);
              if (!node) return null;

              const style = nodeColorConfig[node.type] || nodeColorConfig.RESOURCE;
              const isSelected = selectedNodeId === node.id;
              const isHovered = hoveredNodeId === node.id;
              const isConnected = connectedNodeIds.has(node.id);
              const isDimmed = activeFocusId && !isConnected;

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x - pos.width / 2}, ${pos.y - pos.height / 2})`}
                  onClick={() => setSelectedNodeId(isSelected ? null : node.id)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  opacity={isDimmed ? 0.25 : 1}
                  className="cursor-pointer transition-all duration-200"
                >
                  {(isSelected || isHovered) && (
                    <rect
                      x="-3"
                      y="-3"
                      width={pos.width + 6}
                      height={pos.height + 6}
                      rx="12"
                      fill="none"
                      stroke={style.border}
                      strokeWidth="2.5"
                      strokeOpacity="0.8"
                    />
                  )}

                  <rect
                    x="0"
                    y="0"
                    width={pos.width}
                    height={pos.height}
                    rx="10"
                    fill={style.bg}
                    stroke={isSelected ? '#ffffff' : style.border}
                    strokeWidth={isSelected ? '2' : '1.2'}
                    strokeOpacity={isSelected ? 1 : 0.75}
                  />

                  <g transform="translate(10, 16)">
                    <rect x="0" y="-10" width="60" height="14" rx="3" fill="#000000" fillOpacity="0.4" />
                    <text
                      x="30"
                      y="0"
                      fill={style.text}
                      fontSize="8"
                      fontWeight="700"
                      textAnchor="middle"
                      className="font-mono uppercase tracking-wider"
                    >
                      {style.badge}
                    </text>
                  </g>

                  <text x="10" y="36" fill="#f4f4f5" fontSize="11" fontWeight="600" className="font-sans">
                    {node.label.length > 26 ? `${node.label.slice(0, 24)}…` : node.label}
                  </text>

                  <text x="10" y="48" fill="#71717a" fontSize="8.5" className="font-mono">
                    {node.id.length > 28 ? `${node.id.slice(0, 26)}…` : node.id}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Node Details Inspector */}
      {selectedNode && (
        <div className="border-t border-white/10 bg-black/60 p-4 sm:p-5 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 rounded-lg p-2"
                style={{
                  backgroundColor: nodeColorConfig[selectedNode.type]?.bg || '#18181b',
                  borderColor: nodeColorConfig[selectedNode.type]?.border || '#3f3f46',
                  borderWidth: 1,
                }}
              >
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="rounded px-1.5 py-0.5 font-mono text-[10px] uppercase font-bold text-black"
                    style={{ backgroundColor: nodeColorConfig[selectedNode.type]?.border || '#d4d4d8' }}
                  >
                    {selectedNode.type}
                  </span>
                  <span className="font-mono text-xs text-zinc-500">{selectedNode.id}</span>
                </div>
                <h4 className="mt-1 text-base font-semibold text-white">{selectedNode.label}</h4>
                {selectedNode.properties && Object.keys(selectedNode.properties).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(selectedNode.properties).map(([k, v]) => (
                      <span key={k} className="rounded bg-white/5 px-2 py-0.5 font-mono text-[11px] text-zinc-300">
                        {k}: {Array.isArray(v) ? v.join(', ') : String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedNodeId(null)}
              className="rounded-lg border border-white/10 p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 border-t border-white/5 pt-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Incoming Relationships
              </p>
              <ul className="space-y-1 text-xs">
                {edges.filter((e) => e.target === selectedNode.id).map((e, idx) => (
                  <li key={idx} className="flex items-center gap-2 rounded bg-black/40 px-2.5 py-1 text-zinc-300">
                    <span className="font-mono text-sky-400">{e.source}</span>
                    <ArrowRight className="h-3 w-3 text-zinc-600 shrink-0" />
                    <span className="font-mono text-[10px] text-amber-300">[{e.type}]</span>
                  </li>
                ))}
                {edges.filter((e) => e.target === selectedNode.id).length === 0 && (
                  <p className="text-zinc-600 italic">No inbound connections</p>
                )}
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Outgoing Probes & Access
              </p>
              <ul className="space-y-1 text-xs">
                {edges.filter((e) => e.source === selectedNode.id).map((e, idx) => (
                  <li key={idx} className="flex items-center gap-2 rounded bg-black/40 px-2.5 py-1 text-zinc-300">
                    <span className="font-mono text-[10px] text-amber-300">[{e.type}]</span>
                    <ArrowRight className="h-3 w-3 text-zinc-600 shrink-0" />
                    <span
                      className={`font-mono ${
                        e.type === 'UNAUTHORIZED_ACCESS' ? 'text-rose-400 font-bold' : 'text-sky-400'
                      }`}
                    >
                      {e.target}
                    </span>
                  </li>
                ))}
                {edges.filter((e) => e.source === selectedNode.id).length === 0 && (
                  <p className="text-zinc-600 italic">No outbound connections</p>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Footer Legend */}
      <div className="border-t border-white/10 bg-black/30 px-4 py-3 text-xs text-zinc-400 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-zinc-500 text-[11px] uppercase font-mono tracking-wider">Legend:</span>
          {Object.entries(nodeColorConfig).map(([type, cfg]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cfg.border }} />
              <span className="text-[11px] text-zinc-300">{cfg.badge}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-rose-500" />
            <span className="text-[11px] text-rose-300">Breach / BOLA Violation</span>
          </div>
        </div>

        <p className="text-[11px] text-zinc-500">Click any node to inspect access paths & properties</p>
      </div>
    </div>
  );
}
