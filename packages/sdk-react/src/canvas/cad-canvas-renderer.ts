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
  type: string;
  id?: string;
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
  [key: string]: unknown;
}

export interface GridOptions {
  width: number;
  height: number;
  origin: Point;
  zoom: number;
  gridSize?: number;
}

/**
 * Draw grid lines on canvas
 */
export function drawGrid(ctx: CanvasRenderingContext2D, { width, height, origin = { x: 0, y: 0 }, zoom, gridSize = 50 }: GridOptions) {
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
    y: (point.y - viewport.pan.y) * viewport.zoom + cy
  };
}

export function renderEntity(ctx: CanvasRenderingContext2D, entity: Entity, viewport: Viewport) {
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
    default:
      return;
  }
}

function renderPoint(ctx: CanvasRenderingContext2D, entity: Entity, viewport: Viewport) {
  const p = worldToScreen(entity.position ?? entity as unknown as Point, viewport);
  ctx.fillStyle = entity.color ?? "#333333";
  ctx.beginPath();
  ctx.arc(p.x, p.y, 3 * Math.max(viewport.zoom, 0.5), 0, Math.PI * 2);
  ctx.fill();
}

function renderLine(ctx: CanvasRenderingContext2D, entity: Entity, viewport: Viewport) {
  if (!entity.start || !entity.end) return;
  const start = worldToScreen(entity.start, viewport);
  const end = worldToScreen(entity.end, viewport);
  ctx.strokeStyle = entity.color ?? "#333333";
  ctx.lineWidth = entity.lineWidth ?? 1;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
}

function renderPolyline(ctx: CanvasRenderingContext2D, entity: Entity, viewport: Viewport) {
  if (!entity.vertices || entity.vertices.length === 0) return;
  ctx.strokeStyle = entity.color ?? "#333333";
  ctx.lineWidth = entity.lineWidth ?? 1;
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
}

function renderCircle(ctx: CanvasRenderingContext2D, entity: Entity, viewport: Viewport) {
  if (!entity.center || entity.radius === undefined) return;
  const center = worldToScreen(entity.center, viewport);
  const radius = entity.radius * viewport.zoom;
  ctx.strokeStyle = entity.color ?? "#333333";
  ctx.lineWidth = entity.lineWidth ?? 1;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function renderArc(ctx: CanvasRenderingContext2D, entity: Entity, viewport: Viewport) {
  if (!entity.center || entity.radius === undefined) return;
  const center = worldToScreen(entity.center, viewport);
  const radius = entity.radius * viewport.zoom;
  const startAngle = ((entity.startAngle ?? 0) * Math.PI) / 180;
  const endAngle = ((entity.endAngle ?? 360) * Math.PI) / 180;
  ctx.strokeStyle = entity.color ?? "#333333";
  ctx.lineWidth = entity.lineWidth ?? 1;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, startAngle, endAngle);
  ctx.stroke();
}

export function renderEntities(ctx: CanvasRenderingContext2D, entities: Entity[], viewport: Viewport) {
  for (const entity of entities) {
    renderEntity(ctx, entity, viewport);
  }
}

export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number, backgroundColor = "#ffffff") {
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
}
