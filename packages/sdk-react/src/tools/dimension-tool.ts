/**
 * dimension-tool.ts
 * Dimension (치수선) 그리기 도구
 *
 * 다양한 유형의 치수선을 생성합니다:
 * - Linear: 수평/수직 치수선
 * - Aligned: 실거리 치수선
 * - Angular: 각도 치수선
 * - Diameter: 지름 치수선
 * - Radius: 반지름 치수선
 */

export interface Point {
  x: number;
  y: number;
}

export type DimensionType =
  | "linear"
  | "aligned"
  | "angular"
  | "diameter"
  | "radius";

export interface DimensionEntity {
  id: string;
  type: "DIMENSION";
  dimensionType: DimensionType;
  /** 치수선 위치 */
  position: Point;
  /** 첫 번째 기준점 */
  startPoint: Point;
  /** 두 번째 기준점 */
  endPoint: Point;
  /** 대상 객체 (원/호 등) */
  entityId?: string;
  /** 반지름 값 */
  radius?: number;
  /** 지름 값 */
  diameter?: number;
  /** 각도 값 (도) */
  angle?: number;
  /** 텍스트 */
  text?: string;
  layer: string;
  color: string;
}

export interface CreateEntityCommand {
  type: "CREATE_ENTITY";
  entityType: "DIMENSION";
  entityId: string;
  params: {
    dimensionType: DimensionType;
    position: Point;
    startPoint: Point;
    endPoint: Point;
    entityId?: string;
    radius?: number;
    diameter?: number;
    angle?: number;
    text?: string;
    layer: string;
    color: string;
  };
}

export interface DimensionToolState {
  dimensionType: DimensionType;
  startPoint: Point | null;
  endPoint: Point | null;
  position: Point | null;
  isDrawing: boolean;
  /** 선택된 객체 (for Diameter/Radius) */
  targetEntity?: {
    id: string;
    type: string;
    center?: Point;
    radius?: number;
  };
}

export interface DimensionToolOptions {
  onComplete?: (entity: DimensionEntity, command: CreateEntityCommand) => void;
  onPreview?: (entity: DimensionEntity) => void;
}

/**
 * DIMENSION 도구 인스턴스를 생성합니다.
 */
export function createDimensionTool(options: DimensionToolOptions = {}) {
  const { onComplete, onPreview } = options;

  const state: DimensionToolState = {
    dimensionType: "linear",
    startPoint: null,
    endPoint: null,
    position: null,
    isDrawing: false,
  };

  /**
   * 첫 번째 클릭: 첫 번째 기준점
   * 두 번째 클릭: 두 번째 기준점
   * 세 번째 클릭: 치수선 위치
   */
  function handleClick(screenPoint: Point): DimensionEntity | null {
    if (!state.isDrawing) {
      // First click: start point
      state.startPoint = { ...screenPoint };
      state.position = { ...screenPoint };
      state.isDrawing = true;

      if (onPreview) {
        onPreview(createDimensionEntity());
      }
      return null;
    } else if (
      state.dimensionType === "diameter" ||
      state.dimensionType === "radius"
    ) {
      // For diameter/radius, we need a target circle
      return null;
    } else if (!state.endPoint) {
      // Second click: end point
      state.endPoint = { ...screenPoint };

      if (onPreview) {
        onPreview(createDimensionEntity());
      }
      return null;
    } else {
      // Third click: position
      state.position = { ...screenPoint };

      if (!state.startPoint || !state.endPoint) return null;

      const entity = createDimensionEntity();
      const command = createCreateDimensionCommand(entity);

      if (onComplete) {
        onComplete(entity, command);
      }

      const result = entity;

      // Reset
      state.startPoint = null;
      state.endPoint = null;
      state.position = null;
      state.isDrawing = false;

      return result;
    }
  }

  /**
   * 객체 선택 (for Diameter/Radius)
   */
  function selectTarget(entity: {
    id: string;
    type: string;
    center?: Point;
    radius?: number;
  }) {
    state.targetEntity = entity;

    if (entity.center && entity.radius !== undefined) {
      state.startPoint = { ...entity.center };
      state.isDrawing = true;

      if (onPreview) {
        onPreview(createDimensionEntity());
      }
    }
  }

  function handleMove(screenPoint: Point) {
    if (!state.isDrawing || !state.startPoint) return;

    if (!state.endPoint) {
      // Moving before second click - update end point
      state.endPoint = { ...screenPoint };
    } else {
      // Moving after second click - update position
      state.position = { ...screenPoint };
    }

    if (onPreview) {
      onPreview(createDimensionEntity());
    }
  }

  function cancel() {
    state.startPoint = null;
    state.endPoint = null;
    state.position = null;
    state.isDrawing = false;
    state.targetEntity = undefined;
  }

  function setDimensionType(type: DimensionType) {
    state.dimensionType = type;
    cancel();
  }

  function getState(): DimensionToolState {
    return { ...state };
  }

  function getPreviewEntity(): DimensionEntity | null {
    if (!state.startPoint) return null;
    return createDimensionEntity();
  }

  /**
   * DIMENSION 엔티티 생성
   */
  function createDimensionEntity(): DimensionEntity {
    const entity: DimensionEntity = {
      id: generateEntityId(),
      type: "DIMENSION",
      dimensionType: state.dimensionType,
      position: state.position ?? state.startPoint ?? { x: 0, y: 0 },
      startPoint: state.startPoint ?? { x: 0, y: 0 },
      endPoint: state.endPoint ?? state.startPoint ?? { x: 0, y: 0 },
      layer: "0",
      color: "BYLAYER",
    };

    // Calculate additional properties based on type
    if (
      (state.dimensionType === "diameter" ||
        state.dimensionType === "radius") &&
      state.targetEntity
    ) {
      entity.entityId = state.targetEntity.id;
      entity.radius = state.targetEntity.radius;
      if (state.dimensionType === "diameter") {
        entity.diameter = (state.targetEntity.radius ?? 0) * 2;
      }
    }

    return entity;
  }

  return {
    handleClick,
    selectTarget,
    handleMove,
    cancel,
    setDimensionType,
    getState,
    getPreviewEntity,
  };
}

/**
 * DIMENSION 엔티티 생성
 */
export function createDimensionEntityFromParams(
  dimensionType: DimensionType,
  startPoint: Point,
  endPoint: Point,
  position: Point,
  options?: {
    entityId?: string;
    radius?: number;
    diameter?: number;
    angle?: number;
    text?: string;
  },
): DimensionEntity {
  return {
    id: generateEntityId(),
    type: "DIMENSION",
    dimensionType,
    position: { ...position },
    startPoint: { ...startPoint },
    endPoint: { ...endPoint },
    entityId: options?.entityId,
    radius: options?.radius,
    diameter: options?.diameter,
    angle: options?.angle,
    text: options?.text,
    layer: "0",
    color: "BYLAYER",
  };
}

/**
 * DIMENSION 생성 문서 명령
 */
export function createCreateDimensionCommand(
  entity: DimensionEntity,
): CreateEntityCommand {
  return {
    type: "CREATE_ENTITY",
    entityType: "DIMENSION",
    entityId: entity.id,
    params: {
      dimensionType: entity.dimensionType,
      position: entity.position,
      startPoint: entity.startPoint,
      endPoint: entity.endPoint,
      entityId: entity.entityId,
      radius: entity.radius,
      diameter: entity.diameter,
      angle: entity.angle,
      text: entity.text,
      layer: entity.layer,
      color: entity.color,
    },
  };
}

/**
 * 고유 엔티티 ID 생성
 */
function generateEntityId(): string {
  return `dim-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Dimension rendering helpers
 */
export function calculateLinearDimension(
  startPoint: Point,
  endPoint: Point,
  position: Point,
): {
  distance: number;
  angle: number;
  extensionLines: { start: Point; end: Point }[];
  dimensionLine: { start: Point; end: Point };
  textPosition: Point;
} {
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const distance = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  // Extension lines perpendicular to dimension line
  const extLength = 10;
  const extOffset = position.y - (startPoint.y + endPoint.y) / 2;

  return {
    distance,
    angle,
    extensionLines: [
      {
        start: { x: startPoint.x - extLength, y: startPoint.y },
        end: { x: startPoint.x + extLength, y: startPoint.y },
      },
      {
        start: { x: endPoint.x - extLength, y: endPoint.y },
        end: { x: endPoint.x + extLength, y: endPoint.y },
      },
    ],
    dimensionLine: { start: startPoint, end: endPoint },
    textPosition: position,
  };
}

/**
 * Render a dimension entity
 */
export function renderDimension(
  ctx: CanvasRenderingContext2D,
  entity: DimensionEntity,
  viewport: { pan: Point; zoom: number; width: number; height: number },
): void {
  if (!entity.startPoint || !entity.endPoint || !entity.position) return;

  const start = worldToScreenDim(entity.startPoint, viewport);
  const end = worldToScreenDim(entity.endPoint, viewport);
  const pos = worldToScreenDim(entity.position, viewport);

  ctx.strokeStyle = entity.color ?? "#333333";
  ctx.fillStyle = entity.color ?? "#333333";
  ctx.lineWidth = 1;

  const arrowSize = 6;

  switch (entity.dimensionType) {
    case "linear":
    case "aligned":
      renderLinearDimension(ctx, start, end, pos, arrowSize);
      break;
    case "diameter":
      renderDiameterDimension(ctx, start, entity.radius ?? 0, pos, arrowSize);
      break;
    case "radius":
      renderRadiusDimension(ctx, start, entity.radius ?? 0, pos, arrowSize);
      break;
    case "angular":
      renderAngularDimension(
        ctx,
        start,
        end,
        pos,
        entity.angle ?? 0,
        arrowSize,
      );
      break;
  }
}

function worldToScreenDim(
  p: Point,
  viewport: { pan: Point; zoom: number; width: number; height: number },
): Point {
  return {
    x: (p.x - viewport.pan.x) * viewport.zoom + viewport.width / 2,
    y: (p.y - viewport.pan.y) * viewport.zoom + viewport.height / 2,
  };
}

function renderLinearDimension(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  pos: Point,
  arrowSize: number,
) {
  // Draw extension lines
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(pos.x, pos.y);
  ctx.moveTo(end.x, end.y);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();

  // Draw dimension line
  ctx.beginPath();
  ctx.moveTo(start.x, pos.y);
  ctx.lineTo(end.x, pos.y);
  ctx.stroke();

  // Draw arrows
  drawArrow(ctx, start.x, pos.y, end.x - start.x, 0, arrowSize);
  drawArrow(ctx, end.x, pos.y, start.x - end.x, 0, arrowSize);

  // Draw text
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  const text = distance.toFixed(2);
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, pos.x, pos.y - 8);
}

function renderDiameterDimension(
  ctx: CanvasRenderingContext2D,
  center: Point,
  radius: number,
  pos: Point,
  arrowSize: number,
) {
  const screenRadius = radius;

  // Draw circle
  ctx.beginPath();
  ctx.arc(center.x, center.y, screenRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Draw dimension line
  ctx.beginPath();
  ctx.moveTo(center.x - screenRadius, pos.y);
  ctx.lineTo(center.x + screenRadius, pos.y);
  ctx.stroke();

  // Draw text with diameter symbol
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Ø" + (radius * 2).toFixed(2), pos.x, pos.y - 8);
}

function renderRadiusDimension(
  ctx: CanvasRenderingContext2D,
  center: Point,
  radius: number,
  pos: Point,
  arrowSize: number,
) {
  // Draw radius line from center to pos
  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();

  // Draw arrow at end
  const angle = Math.atan2(pos.y - center.y, pos.x - center.x);
  drawArrow(ctx, pos.x, pos.y, Math.cos(angle), Math.sin(angle), arrowSize);

  // Draw text with radius symbol
  ctx.font = "12px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("R" + radius.toFixed(2), pos.x + 5, pos.y);
}

function renderAngularDimension(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  pos: Point,
  angle: number,
  arrowSize: number,
) {
  // Draw arc
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 50, 0, Math.PI / 4);
  ctx.stroke();

  // Draw lines
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  ctx.lineTo(start.x, start.y);
  ctx.moveTo(pos.x, pos.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();

  // Draw text
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(angle.toFixed(1) + "°", pos.x + 30, pos.y - 30);
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number,
  size: number,
) {
  const len = Math.hypot(dx, dy);
  if (len === 0) return;

  const nx = dx / len;
  const ny = dy / len;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - size * nx - (size / 2) * ny, y - size * ny + (size / 2) * nx);
  ctx.lineTo(x - size * nx + (size / 2) * ny, y - size * ny - (size / 2) * nx);
  ctx.closePath();
  ctx.fill();
}
