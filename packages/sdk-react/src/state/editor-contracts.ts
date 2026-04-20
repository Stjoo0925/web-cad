/**
 * editor-contracts.ts
 * Unified contract types for Phase 0: Editor/Document state contract unification
 *
 * This module defines shared interfaces used across:
 * - EditorState, Viewport, Selection, Tool state
 * - EditorShell, CadPointCloudEditor, SDK client, server document responses
 * - Entity, Layer, Document metadata
 *
 * All contracts use consistent field names and event types.
 */

/**
 * Point in 2D world coordinates
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Viewport state for canvas rendering
 */
export interface Viewport {
  width: number;
  height: number;
  pan: Point;
  zoom: number;
  origin?: Point;
}

/**
 * Entity types supported by the editor
 */
export type EntityType =
  | "POINT"
  | "LINE"
  | "CIRCLE"
  | "ARC"
  | "TEXT"
  | "LWPOLYLINE"
  | "POLYLINE";

/**
 * Unified Entity interface
 * id is REQUIRED - uniquely identifies an entity in the document
 */
export interface Entity {
  id: string;
  type: EntityType;
  layer?: string;
  position?: Point;
  start?: Point;
  end?: Point;
  center?: Point;
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  value?: string;
  height?: number;
  vertices?: Point[];
  closed?: boolean;
  color?: string;
  lineWidth?: number;
  [key: string]: unknown;
}

/**
 * All editor tool types - unified across EditorShell, CadPointCloudEditor, editor-store
 */
export const EDITOR_TOOLS = {
  SELECT: "select",
  LINE: "line",
  POLYLINE: "polyline",
  CIRCLE: "circle",
  ARC: "arc",
  TEXT: "text",
  POINT: "point",
  MOVE: "move",
  ROTATE: "rotate",
  SCALE: "scale",
} as const;

export type EditorToolType = (typeof EDITOR_TOOLS)[keyof typeof EDITOR_TOOLS];

/**
 * View modes for the editor
 */
export const VIEW_MODES = {
  CAD_2D: "2d-cad",
  CAD_3D: "3d",
  POINT_CLOUD: "point-cloud",
} as const;

export type ViewModeType = (typeof VIEW_MODES)[keyof typeof VIEW_MODES];

/**
 * Editor state - manages tool, selection, viewport, and view mode
 */
export interface EditorState {
  tool: EditorToolType;
  selection: string[];
  viewMode: ViewModeType;
  zoom: number;
  pan: Point;
  mapActive: boolean;
}

export interface EditorStore {
  subscribe: (listener: (state: EditorState) => void) => () => void;
  setTool: (tool: EditorToolType) => void;
  setSelection: (entityIds: string[]) => void;
  setViewMode: (viewMode: ViewModeType) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: Point) => void;
  getState: () => EditorState;
}

/**
 * Unified editor event system
 * Combines SdkEventType and CollabEventType into single contract
 */
export const EDITOR_EVENTS = {
  // Document events
  DOCUMENT_STATUS: "document.status",
  DOCUMENT_ERROR: "document.error",
  DOCUMENT_OPENED: "document.opened",
  DOCUMENT_CLOSED: "document.closed",

  // Upload events
  UPLOAD_PROGRESS: "upload.progress",
  UPLOAD_ERROR: "upload.error",
  UPLOAD_COMPLETED: "upload.completed",

  // Selection & tool events
  SELECTION_CHANGED: "selection.changed",
  TOOL_CHANGED: "tool.changed",

  // Viewport events
  VIEWPORT_ZOOM_TO_FIT: "viewport.zoomToFit",

  // Save events
  SAVE_STATUS: "save.status",

  // Collaboration events (SSE)
  CHECKOUT: "checkout",
  DRAFT: "draft",
  COMMIT: "commit",
  CANCEL: "cancel",
  ENTITY_LOCKED: "entity.locked",
  ENTITY_UNLOCKED: "entity.unlocked",
  PRESENCE_UPDATE: "presence.update",
  ERROR: "error",
} as const;

export type EditorEventType =
  (typeof EDITOR_EVENTS)[keyof typeof EDITOR_EVENTS];

/**
 * Unified editor event payload
 */
export interface EditorEvent {
  type: EditorEventType;
  documentId?: string;
  status?: string;
  message?: string;
  document?: unknown;
  assetType?: string;
  fileName?: string;
  loadedBytes?: number;
  receivedBytes?: number;
  assetId?: string;
  entityIds?: string[];
  tool?: EditorToolType;
  payload?: unknown;
  raw?: Record<string, unknown>;
  reason?: string;
  error?: unknown;
}

/**
 * Document metadata - unified across server API and sidecar storage
 * Server stores as JSON string, Sidecar stores as object - both now use Record
 */
export interface DocumentMetadata {
  createdAt?: string;
  updatedAt?: string;
  author?: string;
  [key: string]: unknown;
}

/**
 * Layer color representation
 * Uses AutoCAD color index (1-255) as standard, with string color for display
 */
export interface LayerColor {
  index: number;
  rgb?: string;
}

/**
 * Layer state
 */
export const LAYER_STATES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export type LayerStateType = (typeof LAYER_STATES)[keyof typeof LAYER_STATES];

/**
 * Unified Layer interface
 */
export interface Layer {
  id: string;
  name: string;
  color: number;
  lineWeight: number;
  visible: boolean;
  locked: boolean;
  state: LayerStateType;
  metadata: Record<string, unknown>;
}

/**
 * Generate a unique entity ID
 */
export function generateEntityId(): string {
  return `entity_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Create a minimal Entity with required fields
 */
export function createEntity(type: EntityType, id?: string): Entity {
  return {
    id: id ?? generateEntityId(),
    type,
    layer: "0",
  };
}
