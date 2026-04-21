/**
 * mirror-tool.ts
 * Mirror (대칭 복사) 도구
 *
 * 선택된 엔티티를 지정한 축에 대해 대칭으로 복사합니다.
 * - 2점으로미러 축 지정
 * - 원본 삭제 옵션
 */

export interface Point {
  x: number;
  y: number;
}

export interface MirrorEntity {
  id: string;
  type: "MIRROR";
  /** 원본 엔티티들 */
  sourceEntities: string[];
  /**미러 축 시작점 */
  axisStart: Point;
  /**미러 축 끝점 */
  axisEnd: Point;
  /** 원본 삭제 여부 */
  deleteSource: boolean;
}

export interface CreateEntityCommand {
  type: "CREATE_ENTITY";
  entityType: "MIRROR";
  entityId: string;
  params: {
    sourceEntities: string[];
    mirroredEntities: unknown[];
    axisStart: Point;
    axisEnd: Point;
    deleteSource: boolean;
  };
}

export interface MirrorToolState {
  axisStart: Point | null;
  axisEnd: Point | null;
  isDrawing: boolean;
  deleteSource: boolean;
}

export interface MirrorToolOptions {
  onComplete?: (
    result: { originalIds: string[]; mirroredIds: string[] },
    command: CreateEntityCommand,
  ) => void;
  onPreview?: (axis: { start: Point; end: Point } | null) => void;
}

/**
 * Mirror 도구 인스턴스를 생성합니다.
 */
export function createMirrorTool(options: MirrorToolOptions = {}) {
  const { onComplete, onPreview } = options;

  const state: MirrorToolState = {
    axisStart: null,
    axisEnd: null,
    isDrawing: false,
    deleteSource: false,
  };

  /**
   * 첫 번째 클릭:미러 축 시작점
   * 두 번째 클릭:미러 축 끝점 (미러 수행)
   */
  function handleClick(
    screenPoint: Point,
    modifiers?: { shift?: boolean; ctrl?: boolean },
  ): { originalIds: string[]; mirroredIds: string[] } | null {
    if (!state.isDrawing) {
      // First click: axis start point
      state.axisStart = { ...screenPoint };
      state.axisEnd = { ...screenPoint };
      state.isDrawing = true;

      if (onPreview) {
        onPreview({ start: state.axisStart, end: state.axisEnd });
      }
      return null;
    } else {
      // Second click: axis end point - perform mirror
      state.axisEnd = { ...screenPoint };
      state.isDrawing = false;

      if (!state.axisStart || !state.axisEnd) return null;

      if (onPreview) {
        onPreview({ start: state.axisStart, end: state.axisEnd });
      }

      // Note: Actual mirroring of entities is done by the caller
      // This tool just defines the mirror axis

      return null;
    }
  }

  function handleMove(screenPoint: Point) {
    if (!state.isDrawing || !state.axisStart) return;

    state.axisEnd = { ...screenPoint };

    if (onPreview) {
      onPreview({ start: state.axisStart, end: state.axisEnd });
    }
  }

  function cancel() {
    state.axisStart = null;
    state.axisEnd = null;
    state.isDrawing = false;
    if (onPreview) {
      onPreview(null);
    }
  }

  function setDeleteSource(enabled: boolean) {
    state.deleteSource = enabled;
  }

  function getState(): MirrorToolState {
    return { ...state };
  }

  /**
   * 엔티티를미러 축에 대해 대칭변환
   */
  function mirrorPoint(point: Point, axisStart: Point, axisEnd: Point): Point {
    // Calculate reflection of point across the axis line
    const dx = axisEnd.x - axisStart.x;
    const dy = axisEnd.y - axisStart.y;

    if (dx === 0 && dy === 0) {
      return { ...point };
    }

    // Normalize axis direction
    const len = Math.hypot(dx, dy);
    const nx = dx / len;
    const ny = dy / len;

    // Vector from axis start to point
    const px = point.x - axisStart.x;
    const py = point.y - axisStart.y;

    // Project point onto axis
    const proj = px * nx + py * ny;

    // Foot of perpendicular (closest point on axis)
    const footX = axisStart.x + proj * nx;
    const footY = axisStart.y + proj * ny;

    // Reflect: mirrored = foot + (foot - point)
    return {
      x: 2 * footX - point.x,
      y: 2 * footY - point.y,
    };
  }

  /**
   * MirrorEntity 생성
   */
  function createMirrorEntity(
    sourceEntityIds: string[],
    axisStart: Point,
    axisEnd: Point,
    deleteSource: boolean,
  ): CreateEntityCommand {
    return {
      type: "CREATE_ENTITY",
      entityType: "MIRROR",
      entityId: generateEntityId(),
      params: {
        sourceEntities: sourceEntityIds,
        mirroredEntities: [],
        axisStart,
        axisEnd,
        deleteSource,
      },
    };
  }

  /**
   * 라인미러
   */
  function mirrorLine(
    start: Point,
    end: Point,
    axisStart: Point,
    axisEnd: Point,
  ): { start: Point; end: Point } {
    return {
      start: mirrorPoint(start, axisStart, axisEnd),
      end: mirrorPoint(end, axisStart, axisEnd),
    };
  }

  /**
   * 원미러
   */
  function mirrorCircle(
    center: Point,
    radius: number,
    axisStart: Point,
    axisEnd: Point,
  ): { center: Point; radius: number } {
    return {
      center: mirrorPoint(center, axisStart, axisEnd),
      radius,
    };
  }

  /**
   * 폴리라인미러
   */
  function mirrorPolyline(
    vertices: Point[],
    closed: boolean,
    axisStart: Point,
    axisEnd: Point,
  ): { vertices: Point[]; closed: boolean } {
    return {
      vertices: vertices.map((v) => mirrorPoint(v, axisStart, axisEnd)),
      closed,
    };
  }

  return {
    handleClick,
    handleMove,
    cancel,
    setDeleteSource,
    getState,
    mirrorPoint,
    mirrorLine,
    mirrorCircle,
    mirrorPolyline,
    createMirrorEntity,
  };
}

/**
 * 고유 ID 생성
 */
function generateEntityId(): string {
  return `mirror-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Mirror 가이드선 렌더링
 */
export function renderMirrorGuide(
  ctx: CanvasRenderingContext2D,
  axisStart: Point,
  axisEnd: Point,
  viewport: { pan: Point; zoom: number; width: number; height: number },
): void {
  const start = worldToScreen(axisStart, viewport);
  const end = worldToScreen(axisEnd, viewport);

  // Draw axis line
  ctx.strokeStyle = "#ff00ff";
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  ctx.setLineDash([]);

  // Draw axis endpoints
  const markerSize = 6;
  ctx.fillStyle = "#ff00ff";

  ctx.beginPath();
  ctx.arc(start.x, start.y, markerSize, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(end.x, end.y, markerSize, 0, Math.PI * 2);
  ctx.fill();
}

function worldToScreen(
  p: Point,
  viewport: { pan: Point; zoom: number; width: number; height: number },
): Point {
  return {
    x: (p.x - viewport.pan.x) * viewport.zoom + viewport.width / 2,
    y: (p.y - viewport.pan.y) * viewport.zoom + viewport.height / 2,
  };
}
