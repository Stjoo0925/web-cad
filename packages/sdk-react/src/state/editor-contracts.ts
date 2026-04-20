/**
 * editor-contracts.ts
 * Phase 0용 통합 계약 타입: 에디터/문서 상태 계약 통합
 *
 * 이 모듈은 다음에서 사용되는 공유 인터페이스를 정의합니다:
 * - EditorState, Viewport, Selection, Tool 상태
 * - EditorShell, CadPointCloudEditor, SDK 클라이언트, 서버 문서 응답
 * - Entity, Layer, Document 메타데이터
 *
 * 모든 계약은 일관된 필드 이름과 이벤트 타입을 사용합니다.
 */

/**
 * 2D 월드 좌표의 점
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * 캔버스 렌더링용 뷰포트 상태
 */
export interface Viewport {
  width: number;
  height: number;
  pan: Point;
  zoom: number;
  origin?: Point;
}

/**
 * 에디터에서 지원하는 엔티티 타입
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
 * 통합 엔티티 인터페이스
 * id는 필수 - 문서에서 엔티티를 고유하게 식별합니다
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
 * 모든 에디터 도구 타입 - EditorShell, CadPointCloudEditor, editor-store 간 통합
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
 * 에디터의 뷰 모드
 */
export const VIEW_MODES = {
  CAD_2D: "2d-cad",
  CAD_3D: "3d",
  POINT_CLOUD: "point-cloud",
} as const;

export type ViewModeType = (typeof VIEW_MODES)[keyof typeof VIEW_MODES];

/**
 * 에디터 상태 - 도구, 선택, 뷰포트, 뷰 모드를 관리합니다
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
 * 통합 에디터 이벤트 시스템
 * SdkEventType과 CollabEventType을 단일 계약으로 결합합니다
 */
export const EDITOR_EVENTS = {
  // 문서 이벤트
  DOCUMENT_STATUS: "document.status",
  DOCUMENT_ERROR: "document.error",
  DOCUMENT_OPENED: "document.opened",
  DOCUMENT_CLOSED: "document.closed",

  // 업로드 이벤트
  UPLOAD_PROGRESS: "upload.progress",
  UPLOAD_ERROR: "upload.error",
  UPLOAD_COMPLETED: "upload.completed",

  // 선택 및 도구 이벤트
  SELECTION_CHANGED: "selection.changed",
  TOOL_CHANGED: "tool.changed",

  // 뷰포트 이벤트
  VIEWPORT_ZOOM_TO_FIT: "viewport.zoomToFit",

  // 저장 이벤트
  SAVE_STATUS: "save.status",

  // 협업 이벤트 (SSE)
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
 * 통합 에디터 이벤트 페이로드
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
 * 문서 메타데이터 - 서버 API와 사이드카 저장소 간 통합
 * 서버는 JSON 문자열로 저장, 사이드카는 객체로 저장 - 둘 다 이제 Record 사용
 */
export interface DocumentMetadata {
  createdAt?: string;
  updatedAt?: string;
  author?: string;
  [key: string]: unknown;
}

/**
 * 레이어 색상 표현
 * AutoCAD 색상 인덱스(1-255)를 표준으로 사용하며, 표시용 문자열 색상 포함
 */
export interface LayerColor {
  index: number;
  rgb?: string;
}

/**
 * 레이어 상태
 */
export const LAYER_STATES = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export type LayerStateType = (typeof LAYER_STATES)[keyof typeof LAYER_STATES];

/**
 * 통합 레이어 인터페이스
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
 * 고유 엔티티 ID를 생성합니다
 */
export function generateEntityId(): string {
  return `entity_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 필수 필드가 포함된 최소 엔티티를 생성합니다
 */
export function createEntity(type: EntityType, id?: string): Entity {
  return {
    id: id ?? generateEntityId(),
    type,
    layer: "0",
  };
}
