/**
 * rectangle-tool.ts
 * 사각형(RECTANGLE) 그리기 도구
 *
 * 두 번의 클릭으로 사각형을 생성합니다.
 * - 대각선 2점 방식
 * - Chamfer (모따기) 옵션
 * - Fillet (둥근모서리) 옵션
 */

export interface Point {
  x: number;
  y: number;
}

export interface RectangleEntity {
  id: string;
  type: "LWPOLYLINE"; // Rectangle is rendered as LWPOLYLINE
  vertices: Point[];
  closed: true;
  layer: string;
  color: string;
  /** Chamfer 거리 (0 = 없음) */
  chamfer?: number;
  /** Fillet 반edra (0 = 없음) */
  fillet?: number;
}

export interface CreateEntityCommand {
  type: "CREATE_ENTITY";
  entityType: "RECTANGLE";
  entityId: string;
  params: {
    vertices: Point[];
    layer: string;
    color: string;
    chamfer?: number;
    fillet?: number;
  };
}

export interface RectangleToolState {
  corner1: Point | null;
  corner2: Point | null;
  isDrawing: boolean;
  /** Chamfer 거리 */
  chamfer: number;
  /** Fillet 반edra */
  fillet: number;
  /** 연속 실행 모드 */
  continuousMode: boolean;
}

export interface RectangleToolOptions {
  onComplete?: (
    entity: RectangleEntity,
    command: CreateEntityCommand,
  ) => void;
  onPreview?: (entity: RectangleEntity) => void;
}

/**
 * RECTANGLE 도구 인스턴스를 생성합니다.
 */
export function createRectangleTool(options: RectangleToolOptions = {}) {
  const { onComplete, onPreview } = options;

  const state: RectangleToolState = {
    corner1: null,
    corner2: null,
    isDrawing: false,
    chamfer: 0,
    fillet: 0,
    continuousMode: true,
  };

  /**
   * 사각형 버텍스 계산
   */
  function calculateVertices(corner1: Point, corner2: Point): Point[] {
    const x1 = Math.min(corner1.x, corner2.x);
    const y1 = Math.min(corner1.y, corner2.y);
    const x2 = Math.max(corner1.x, corner2.x);
    const y2 = Math.max(corner1.y, corner2.y);

    let vertices: Point[] = [
      { x: x1, y: y1 },
      { x: x2, y: y1 },
      { x: x2, y: y2 },
      { x: x1, y: y2 },
    ];

    // Apply chamfer if set
    if (state.chamfer > 0) {
      vertices = applyChamfer(vertices, state.chamfer);
    }

    // Apply fillet if set
    if (state.fillet > 0) {
      // For fillet, we need arc segments which LWPOLYLINE doesn't support directly
      // So we'll create a polyline with rounded corners
      // Note: true fillet requires ARC segments, which is more complex
      // For simplicity, we'll approximate with short straight segments
      vertices = applyFilletApprox(vertices, state.fillet);
    }

    return vertices;
  }

  /**
   * Chamfer 적용 (모따기)
   */
  function applyChamfer(vertices: Point[], distance: number): Point[] {
    if (vertices.length < 4 || distance <= 0) return vertices;

    const result: Point[] = [];

    for (let i = 0; i < vertices.length; i++) {
      const curr = vertices[i];
      const next = vertices[(i + 1) % vertices.length];

      result.push(curr);

      // Calculate chamfer point along each edge
      const dx = next.x - curr.x;
      const dy = next.y - curr.y;
      const len = Math.hypot(dx, dy);

      if (len > distance * 2) {
        // Normalize direction
        const nx = dx / len;
        const ny = dy / len;

        // Add chamfered point
        result.push({
          x: curr.x + nx * distance,
          y: curr.y + ny * distance,
        });
      }
    }

    return result;
  }

  /**
   * Fillet 근사 (둥근모서리) - 짧은 선분으로 분할
   */
  function applyFilletApprox(
    vertices: Point[],
    radius: number,
  ): Point[] {
    if (vertices.length < 4 || radius <= 0) return vertices;

    const segments = 4; // segments per corner
    const result: Point[] = [];

    for (let i = 0; i < vertices.length; i++) {
      const prev = vertices[(i - 1 + vertices.length) % vertices.length];
      const curr = vertices[i];
      const next = vertices[(i + 1) % vertices.length];

      // Calculate vectors
      const v1x = prev.x - curr.x;
      const v1y = prev.y - curr.y;
      const v2x = next.x - curr.x;
      const v2y = next.y - curr.y;

      const len1 = Math.hypot(v1x, v1y);
      const len2 = Math.hypot(v2x, v2y);

      // Normalize
      const n1x = v1x / len1;
      const n1y = v1y / len1;
      const n2x = v2x / len2;
      const n2y = v2y / len2;

      // Calculate angles
      const angle1 = Math.atan2(-n1y, -n1x);
      const angle2 = Math.atan2(n2y, n2x);

      // Generate arc points
      let startAngle = angle1;
      let endAngle = angle2;

      // Ensure we go the short way around
      let diff = endAngle - startAngle;
      if (diff > Math.PI) diff -= 2 * Math.PI;
      if (diff < -Math.PI) diff += 2 * Math.PI;

      for (let j = 0; j <= segments; j++) {
        const t = j / segments;
        const angle = startAngle + diff * t;
        result.push({
          x: curr.x + radius * Math.cos(angle),
          y: curr.y + radius * Math.sin(angle),
        });
      }
    }

    return result;
  }

  function handleClick(screenPoint: Point): RectangleEntity | null {
    if (!state.isDrawing) {
      state.corner1 = { ...screenPoint };
      state.corner2 = { ...screenPoint };
      state.isDrawing = true;

      if (onPreview) {
        const vertices = calculateVertices(state.corner1, state.corner2);
        onPreview(createRectangleEntity(vertices));
      }
      return null;
    } else {
      state.corner2 = { ...screenPoint };
      state.isDrawing = false;

      if (!state.corner1 || !state.corner2) return null;

      const vertices = calculateVertices(state.corner1, state.corner2);
      const entity = createRectangleEntity(vertices);
      const command = createCreateRectangleCommand(entity);

      if (onComplete) {
        onComplete(entity, command);
      }

      const result = entity;

      // Continuous mode: start next rectangle from corner2
      state.corner1 = { ...screenPoint };
      state.corner2 = { ...screenPoint };
      state.isDrawing = true;

      if (onPreview) {
        onPreview(createRectangleEntity(vertices));
      }

      return result;
    }
  }

  function handleMove(screenPoint: Point) {
    if (!state.isDrawing || !state.corner1) return;

    state.corner2 = { ...screenPoint };

    if (onPreview && state.corner1 && state.corner2) {
      const vertices = calculateVertices(state.corner1, state.corner2);
      onPreview(createRectangleEntity(vertices));
    }
  }

  function handleDoubleClick(): RectangleEntity | null {
    // Not used for rectangle
    return null;
  }

  function cancel() {
    state.corner1 = null;
    state.corner2 = null;
    state.isDrawing = false;
    state.continuousMode = false;
  }

  function setChamfer(distance: number) {
    state.chamfer = Math.max(0, distance);
  }

  function setFillet(radius: number) {
    state.fillet = Math.max(0, radius);
  }

  function setContinuousMode(enabled: boolean) {
    state.continuousMode = enabled;
  }

  function getState(): RectangleToolState {
    return { ...state };
  }

  function getPreviewEntity(): RectangleEntity | null {
    if (!state.corner1 || !state.corner2) return null;
    const vertices = calculateVertices(state.corner1, state.corner2);
    return createRectangleEntity(vertices);
  }

  return {
    handleClick,
    handleMove,
    handleDoubleClick,
    cancel,
    setChamfer,
    setFillet,
    setContinuousMode,
    getState,
    getPreviewEntity,
  };
}

/**
 * RECTANGLE 엔티티 객체를 생성합니다.
 */
export function createRectangleEntity(vertices: Point[]): RectangleEntity {
  return {
    id: generateEntityId(),
    type: "LWPOLYLINE",
    vertices,
    closed: true,
    layer: "0",
    color: "BYLAYER",
  };
}

/**
 * RECTANGLE 생성 문서 명령을 생성합니다.
 */
export function createCreateRectangleCommand(
  entity: RectangleEntity,
): CreateEntityCommand {
  return {
    type: "CREATE_ENTITY",
    entityType: "RECTANGLE",
    entityId: entity.id,
    params: {
      vertices: entity.vertices,
      layer: entity.layer,
      color: entity.color,
      chamfer: entity.chamfer,
      fillet: entity.fillet,
    },
  };
}

/**
 * 고유 엔티티 ID 생성
 */
function generateEntityId(): string {
  return `rect-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * RECTANGLE 도구 옵션 대화상자 (UI에서 사용)
 */
export interface RectangleOptions {
  chamfer: number;
  fillet: number;
  area: number;
  dimensions: { width: number; height: number };
}

export function getDefaultRectangleOptions(): RectangleOptions {
  return {
    chamfer: 0,
    fillet: 0,
    area: 0,
    dimensions: { width: 0, height: 0 },
  };
}
