/**
 * cad-canvas-renderer.js
 * Canvas 2D rendering functions for CAD entities.
 * Handles grid, POINT, LINE, POLYLINE, CIRCLE, ARC entities.
 */

export function drawGrid(ctx, { width, height, origin, zoom, gridSize = 50 }) {
  const scaledGridSize = gridSize * zoom;
  const offsetX = (origin.x * zoom) % scaledGridSize;
  const offsetY = (origin.y * zoom) % scaledGridSize;

  ctx.strokeStyle = "#e5e5e5";
  ctx.lineWidth = 0.5;

  // Vertical lines
  for (let x = offsetX; x < width; x += scaledGridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = offsetY; y < height; y += scaledGridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Origin crosshair
  const originScreenX = -origin.x * zoom + width / 2;
  const originScreenY = -origin.y * zoom + height / 2;
  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(originScreenX - 10, originScreenY);
  ctx.lineTo(originScreenX + 10, originScreenY);
  ctx.moveTo(originScreenX, originScreenY - 10);
  ctx.lineTo(originScreenX, originScreenY + 10);
  ctx.stroke();
}

export function worldToScreen(point, viewport) {
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  return {
    x: (point.x - viewport.pan.x) * viewport.zoom + cx,
    y: (point.y - viewport.pan.y) * viewport.zoom + cy
  };
}

export function renderEntity(ctx, entity, viewport) {
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

function renderPoint(ctx, entity, viewport) {
  const p = worldToScreen(entity.position ?? entity, viewport);
  ctx.fillStyle = entity.color ?? "#333333";
  ctx.beginPath();
  ctx.arc(p.x, p.y, 3 * Math.max(viewport.zoom, 0.5), 0, Math.PI * 2);
  ctx.fill();
}

function renderLine(ctx, entity, viewport) {
  const start = worldToScreen(entity.start, viewport);
  const end = worldToScreen(entity.end, viewport);
  ctx.strokeStyle = entity.color ?? "#333333";
  ctx.lineWidth = entity.lineWidth ?? 1;
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
}

function renderPolyline(ctx, entity, viewport) {
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

function renderCircle(ctx, entity, viewport) {
  const center = worldToScreen(entity.center, viewport);
  const radius = entity.radius * viewport.zoom;
  ctx.strokeStyle = entity.color ?? "#333333";
  ctx.lineWidth = entity.lineWidth ?? 1;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function renderArc(ctx, entity, viewport) {
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

export function renderEntities(ctx, entities, viewport) {
  for (const entity of entities) {
    renderEntity(ctx, entity, viewport);
  }
}

export function clearCanvas(ctx, width, height, backgroundColor = "#ffffff") {
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);
}