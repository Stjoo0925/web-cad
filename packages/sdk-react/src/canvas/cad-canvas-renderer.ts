export interface Point {
  x: number;
  y: number;
}

export interface Viewport {
  width: number;
  height: number;
  pan: Point;
  zoom: number;
  origin?: Point;
}

export interface Entity {
  id: string;
  type: string;
  position?: Point;
  start?: Point;
  end?: Point;
  vertices?: Point[];
  center?: Point;
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  closed?: boolean;
  color?: string;
  lineWidth?: number;
  layer?: string;
  /** 선 종류: CONTINUOUS, DASHED, DASHDOT, DOT, CENTER, BORDER */
  linetype?: Linetype;
  /** Block reference */
  blockName?: string;
  blockPosition?: Point;
  blockRotation?: number;
  blockScale?: { x: number; y: number };
  [key: string]: unknown;
}

/**
 * 지원되는 선 종류
 */
export type Linetype =
  | "CONTINUOUS"
  | "DASHED"
  | "DASHDOT"
  | "DOT"
  | "CENTER"
  | "BORDER";

/**
 * 선 종류별 대시 패턴 (선 길이, 공백 길이) - 픽셀 단위
 */
const LINETYPE_PATTERNS: Record<Linetype, number[]> = {
  CONTINUOUS: [],
  DASHED: [12, 6],
  DASHDOT: [12, 4, 2, 4],
  DOT: [2, 4],
  CENTER: [16, 4, 2, 4],
  BORDER: [12, 4, 2, 4],
};

/**
 * Canvas에 선 종류 패턴을 설정
 */
function setLinetypeRender(
  ctx: CanvasRenderingContext2D,
  linetype: Linetype | undefined,
  lineWidth: number,
): void {
  if (!linetype || linetype === "CONTINUOUS") {
    ctx.setLineDash([]);
    return;
  }

  const pattern = LINETYPE_PATTERNS[linetype];
  if (!pattern) {
    ctx.setLineDash([]);
    return;
  }

  // 선 두께에 따라 패턴 스케일 조정
  const scale = Math.max(1, lineWidth / 1);
  ctx.setLineDash(pattern.map((v) => v * scale));
}

export interface GridOptions {
  width: number;
  height: number;
  origin?: Point;
  zoom: number;
  gridSize?: number;
}

/**
 * 캔버스에 그리드 선을 그립니다.
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  { width, height, origin = { x: 0, y: 0 }, zoom, gridSize = 50 }: GridOptions,
) {
  const scaledGridSize = gridSize * zoom;
  const offsetX = (origin.x * zoom) % scaledGridSize;
  const offsetY = (origin.y * zoom) % scaledGridSize;

  ctx.strokeStyle = "#e5e5e5";
  ctx.lineWidth = 0.5;

  for (let x = offsetX; x < width; x += scaledGridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = offsetY; y < height; y += scaledGridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const originScreenX = -origin.x * zoom + width / 2;
  const originScreenY = -origin.y * zoom + height / 2;
  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(originScreenX - 10, originScreenY);
  ctx.lineTo(originScreenX + 10, originScreenY);
  ctx.moveTo(originScreenX, originScreenY - 10);
  ctx.moveTo(originScreenX, originScreenY + 10);
  ctx.stroke();
}

export function worldToScreen(point: Point, viewport: Viewport): Point {
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  return {
    x: (point.x - viewport.pan.x) * viewport.zoom + cx,
    y: (point.y - viewport.pan.y) * viewport.zoom + cy,
  };
}

export function renderEntity(
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  viewport: Viewport,
) {
  switch (entity.type) {
    case "POINT":
      return renderPoint(ctx, entity, viewport);
    case "LINE":
      return renderLine(ctx, entity, viewport);
    case "POLYLINE":
    case "LWPOLYLINE":
      return renderPolyline(ctx, entity, viewport);
    case "CIRCLE":
      return renderCircle(ctx, entity, viewport);
    case "ARC":
      return renderArc(ctx, entity, viewport);
    case "BLOCK":
      return renderBlock(ctx, entity, viewport);
    default:
      return;
  }
}

function renderPoint(
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  viewport: Viewport,
) {
  const p = worldToScreen(
    entity.position ?? (entity as unknown as Point),
    viewport,
  );
  ctx.fillStyle = entity.color ?? "#333333";
  ctx.beginPath();
  ctx.arc(p.x, p.y, 3 * Math.max(viewport.zoom, 0.5), 0, Math.PI * 2);
  ctx.fill();
}

function renderLine(
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  viewport: Viewport,
) {
  if (!entity.start || !entity.end) return;
  const start = worldToScreen(entity.start, viewport);
  const end = worldToScreen(entity.end, viewport);
  ctx.strokeStyle = entity.color ?? "#333333";
  ctx.lineWidth = (entity.lineWidth ?? 1) * viewport.zoom;
  setLinetypeRender(ctx, entity.linetype, ctx.lineWidth);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.setLineDash([]);
}

function renderPolyline(
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  viewport: Viewport,
) {
  if (!entity.vertices || entity.vertices.length === 0) return;
  ctx.strokeStyle = entity.color ?? "#333333";
  ctx.lineWidth = (entity.lineWidth ?? 1) * viewport.zoom;
  setLinetypeRender(ctx, entity.linetype, ctx.lineWidth);
  ctx.lineJoin = "round";
  ctx.beginPath();
  const first = worldToScreen(entity.vertices[0], viewport);
  ctx.moveTo(first.x, first.y);
  for (let i = 1; i < entity.vertices.length; i++) {
    const v = worldToScreen(entity.vertices[i], viewport);
    ctx.lineTo(v.x, v.y);
  }
  if (entity.closed) ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
}

function renderCircle(
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  viewport: Viewport,
) {
  if (!entity.center || entity.radius === undefined) return;
  const center = worldToScreen(entity.center, viewport);
  const radius = entity.radius * viewport.zoom;
  ctx.strokeStyle = entity.color ?? "#333333";
  ctx.lineWidth = (entity.lineWidth ?? 1) * viewport.zoom;
  setLinetypeRender(ctx, entity.linetype, ctx.lineWidth);
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function renderArc(
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  viewport: Viewport,
) {
  if (!entity.center || entity.radius === undefined) return;
  const center = worldToScreen(entity.center, viewport);
  const radius = entity.radius * viewport.zoom;
  const startAngle = ((entity.startAngle ?? 0) * Math.PI) / 180;
  const endAngle = ((entity.endAngle ?? 360) * Math.PI) / 180;
  ctx.strokeStyle = entity.color ?? "#333333";
  ctx.lineWidth = (entity.lineWidth ?? 1) * viewport.zoom;
  setLinetypeRender(ctx, entity.linetype, ctx.lineWidth);
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, startAngle, endAngle);
  ctx.stroke();
}

function renderBlock(
  ctx: CanvasRenderingContext2D,
  entity: Entity,
  viewport: Viewport,
) {
  // Block rendering - draw a placeholder rectangle with label
  if (!entity.blockPosition) return;
  const pos = worldToScreen(entity.blockPosition, viewport);
  const scale = entity.blockScale ?? { x: 1, y: 1 };
  const size = 30 * viewport.zoom;

  ctx.strokeStyle = "#888888";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(pos.x - size / 2, pos.y - size / 2, size, size);
  ctx.setLineDash([]);

  // Draw block name label
  ctx.fillStyle = "#888888";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(entity.blockName ?? "BLOCK", pos.x, pos.y + size / 2 + 12);
}

export function renderEntities(
  ctx: CanvasRenderingContext2D,
  entities: Entity[],
  viewport: Viewport,
  selectedIds: string[] = [],
  selectedColor = "#0078d4",
) {
  for (const entity of entities) {
    const isSelected = selectedIds.includes(entity.id);
    if (isSelected) {
      const originalColor = entity.color ?? "#333333";
      const originalLineWidth = entity.lineWidth ?? 1;

      // 선택 광량 효과 그리기
      ctx.strokeStyle = selectedColor + "40";
      ctx.lineWidth = originalLineWidth + 6;
      renderEntity(
        ctx,
        {
          ...entity,
          color: selectedColor + "40",
          lineWidth: originalLineWidth + 6,
        },
        viewport,
      );

      // 선택 강조 표시 그리기
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = originalLineWidth + 2;
      renderEntity(
        ctx,
        { ...entity, color: selectedColor, lineWidth: originalLineWidth + 2 },
        viewport,
      );

      // 원본 복원
      ctx.strokeStyle = originalColor;
      ctx.lineWidth = originalLineWidth;
      renderEntity(ctx, entity, viewport);
    } else {
      renderEntity(ctx, entity, viewport);
    }
  }
}

export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  backgroundColor = "#ffffff",
) {
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
}

/**
 * 스냅 타입에 따른 색상 반환
 */
export function getSnapColor(snapType: string): string {
  switch (snapType) {
    case "endpoint":
      return "#00ff00"; // 녹색
    case "midpoint":
      return "#ffff00"; // 노란색
    case "intersection":
      return "#ff00ff"; // 마젠타
    case "center":
      return "#00ffff"; // 시안
    case "perpendicular":
      return "#ff8800"; // 주황
    case "tangent":
      return "#ff00ff"; // 마젠타
    default:
      return "#00ffff"; // 시안 (nearest)
  }
}

/**
 * 스냅 포인트와 타입 라벨을 렌더링합니다.
 */
export function renderSnapPoint(
  ctx: CanvasRenderingContext2D,
  snapPoint: Point,
  snapType: string,
  viewport: Viewport,
  options?: { showCrosshair?: boolean; showLabel?: boolean },
) {
  const { showCrosshair = true, showLabel = true } = options ?? {};
  const screenPoint = worldToScreen(snapPoint, viewport);
  const color = getSnapColor(snapType);
  const SNAP_CIRCLE_RADIUS = 5;

  // 스냅 포인트 원 그리기
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(screenPoint.x, screenPoint.y, SNAP_CIRCLE_RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  // 스냅 포인트 내부를 채움
  ctx.fillStyle = color + "40"; // 반투명
  ctx.beginPath();
  ctx.arc(screenPoint.x, screenPoint.y, SNAP_CIRCLE_RADIUS, 0, Math.PI * 2);
  ctx.fill();

  // 십자선 (AutoCAD 스타일 가이드)
  if (showCrosshair) {
    ctx.strokeStyle = color + "60"; // 반투명
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // 좌우 가로선
    ctx.beginPath();
    ctx.moveTo(0, screenPoint.y);
    ctx.lineTo(screenPoint.x - SNAP_CIRCLE_RADIUS - 2, screenPoint.y);
    ctx.moveTo(screenPoint.x + SNAP_CIRCLE_RADIUS + 2, screenPoint.y);
    ctx.lineTo(ctx.canvas.width, screenPoint.y);
    ctx.stroke();

    // 상하 세로선
    ctx.beginPath();
    ctx.moveTo(screenPoint.x, 0);
    ctx.lineTo(screenPoint.x, screenPoint.y - SNAP_CIRCLE_RADIUS - 2);
    ctx.moveTo(screenPoint.x, screenPoint.y + SNAP_CIRCLE_RADIUS + 2);
    ctx.lineTo(screenPoint.x, ctx.canvas.height);
    ctx.stroke();

    ctx.setLineDash([]);
  }

  // 스냅 타입 라벨
  if (showLabel) {
    const label = snapType.toUpperCase();
    ctx.font = "bold 11px monospace";
    const textWidth = ctx.measureText(label).width;
    const padding = 3;
    const labelX = screenPoint.x + SNAP_CIRCLE_RADIUS + 4;
    const labelY = screenPoint.y - 8;

    // 라벨 배경
    ctx.fillStyle = color;
    ctx.fillRect(labelX, labelY - 10, textWidth + padding * 2, 13);

    // 라벨 텍스트
    ctx.fillStyle = "#000000";
    ctx.fillText(label, labelX + padding, labelY);
  }
}

/**
 * Ortho 모드 가이드선을 렌더링합니다.
 */
export function renderOrthoGuides(
  ctx: CanvasRenderingContext2D,
  fromPoint: Point,
  toPoint: Point,
  viewport: Viewport,
) {
  const from = worldToScreen(fromPoint, viewport);
  const to = worldToScreen(toPoint, viewport);

  ctx.strokeStyle = "#00ffff40";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);

  // 수평선
  ctx.beginPath();
  ctx.moveTo(Math.min(from.x, to.x), from.y);
  ctx.lineTo(Math.max(from.x, to.x), from.y);
  ctx.stroke();

  // 수직선
  ctx.beginPath();
  ctx.moveTo(from.x, Math.min(from.y, to.y));
  ctx.lineTo(from.x, Math.max(from.y, to.y));
  ctx.stroke();

  ctx.setLineDash([]);
}
