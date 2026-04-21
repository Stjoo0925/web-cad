/**
 * select-tool.ts
 * 엔티티 선택 도구 및 히트 테스트 모듈
 *
 * Canvas 2D 뷰포트에서 POINT, LINE, POLYLINE 엔티티의 클릭/더블클릭 선택을 지원합니다.
 * 단일/다중 선택, 선택 해제, 히트 테스트 기능을 제공합니다.
 */

import type { Entity, Point, Viewport } from "../canvas/cad-canvas-renderer";

/**
 * 히트 허용 오차 (픽셀)
 */
const HIT_TOLERANCE = 8;

/**
 * 포인트와 세그먼트(선분) 사이의 최소 거리를 계산합니다.
 */
function pointToSegmentDistance(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return Math.hypot(p.x - a.x, p.y - a.y);
  }

  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const projX = a.x + t * dx;
  const projY = a.y + t * dy;

  return Math.hypot(p.x - projX, p.y - projY);
}

/**
 * 포인트 엔티티에 대한 히트 테스트를 수행합니다.
 */
function hitTestPoint(
  entity: Entity,
  screenPoint: Point,
  tolerance: number,
): boolean {
  const p = entity.position;
  if (!p) return false;
  const dist = Math.hypot(screenPoint.x - p.x, screenPoint.y - p.y);
  return dist <= tolerance;
}

/**
 * 라인 엔티티에 대한 히트 테스트를 수행합니다.
 */
function hitTestLine(
  entity: Entity,
  screenPoint: Point,
  tolerance: number,
): boolean {
  if (!entity.start || !entity.end) return false;
  const dist = pointToSegmentDistance(screenPoint, entity.start, entity.end);
  return dist <= tolerance;
}

/**
 * 폴리라인 엔티티에 대한 히트 테스트를 수행합니다.
 */
function hitTestPolyline(
  entity: Entity,
  screenPoint: Point,
  tolerance: number,
): boolean {
  if (!entity.vertices || entity.vertices.length < 2) return false;

  for (let i = 0; i < entity.vertices.length - 1; i++) {
    const dist = pointToSegmentDistance(
      screenPoint,
      entity.vertices[i],
      entity.vertices[i + 1],
    );
    if (dist <= tolerance) return true;
  }

  if (entity.closed && entity.vertices.length > 2) {
    const dist = pointToSegmentDistance(
      screenPoint,
      entity.vertices[entity.vertices.length - 1],
      entity.vertices[0],
    );
    if (dist <= tolerance) return true;
  }

  return false;
}

/**
 * 원형 엔티티에 대한 히트 테스트를 수행합니다.
 */
function hitTestCircle(
  entity: Entity,
  screenPoint: Point,
  tolerance: number,
): boolean {
  if (!entity.center || entity.radius === undefined) return false;
  const dist = Math.hypot(
    screenPoint.x - entity.center.x,
    screenPoint.y - entity.center.y,
  );
  return Math.abs(dist - entity.radius) <= tolerance;
}

/**
 * 호(ARC) 엔티티에 대한 히트 테스트를 수행합니다.
 * 호의 원호 위 부분과 클릭 좌표 간 거리가 tolerance 이내인지 확인합니다.
 */
function hitTestArc(
  entity: Entity,
  screenPoint: Point,
  tolerance: number,
): boolean {
  if (!entity.center || entity.radius === undefined) return false;
  const dist = Math.hypot(
    screenPoint.x - entity.center.x,
    screenPoint.y - entity.center.y,
  );
  // 먼저 원주와의 거리가 tolerance 이내인지 확인
  if (Math.abs(dist - entity.radius) > tolerance) return false;
  // 클릭 각도가 호의 시작/끝 각도 범위 내에 있는지 확인
  const clickAngle = Math.atan2(
    screenPoint.y - entity.center.y,
    screenPoint.x - entity.center.x,
  );
  const startAngle = entity.startAngle ?? 0;
  const endAngle = entity.endAngle ?? Math.PI * 2;
  const clickAngleNorm = clickAngle < 0 ? clickAngle + Math.PI * 2 : clickAngle;
  const startNorm = startAngle < 0 ? startAngle + Math.PI * 2 : startAngle;
  const endNorm = endAngle < 0 ? endAngle + Math.PI * 2 : endAngle;
  if (startNorm <= endNorm) {
    return (
      clickAngleNorm >= startNorm - tolerance / entity.radius &&
      clickAngleNorm <= endNorm + tolerance / entity.radius
    );
  } else {
    return (
      clickAngleNorm >= startNorm - tolerance / entity.radius ||
      clickAngleNorm <= endNorm + tolerance / entity.radius
    );
  }
}

/**
 * 특정 엔티티에 대한 히트 테스트를 수행합니다.
 */
export function hitTest(
  entity: Entity,
  screenPoint: Point,
  viewport: Viewport,
  tolerance: number = HIT_TOLERANCE,
): boolean {
  switch (entity.type) {
    case "POINT":
      return hitTestPoint(entity, screenPoint, tolerance);
    case "LINE":
      return hitTestLine(entity, screenPoint, tolerance);
    case "POLYLINE":
    case "LWPOLYLINE":
      return hitTestPolyline(entity, screenPoint, tolerance);
    case "CIRCLE":
      return hitTestCircle(entity, screenPoint, tolerance);
    case "ARC":
      return hitTestArc(entity, screenPoint, tolerance);
    default:
      return false;
  }
}

/**
 * 여러 엔티티 중 주어진 화면 좌표와 히트되는 첫 번째 엔티티를 찾습니다.
 * tolerance가 주어지지 않으면 viewport.zoom에 따라 자동 조정됩니다.
 */
export function hitTestEntities(
  entities: Entity[],
  screenPoint: Point,
  viewport: Viewport,
  tolerance?: number,
): Entity | null {
  // Zoom-adjusted tolerance: higher zoom = larger world-unit tolerance to keep pixel-based selection consistent
  const zoom = viewport.zoom ?? 1;
  const adjustedTolerance = tolerance ?? HIT_TOLERANCE / zoom;
  for (const entity of entities) {
    if (hitTest(entity, screenPoint, viewport, adjustedTolerance)) {
      return entity;
    }
  }
  return null;
}

/**
 * 주어진 화면 좌표와 히트되는 모든 엔티티를 찾습니다 (선택 박스용).
 */
export function hitTestAll(
  entities: Entity[],
  screenPoint: Point,
  viewport: Viewport,
  tolerance?: number,
): Entity[] {
  const zoom = viewport.zoom ?? 1;
  const adjustedTolerance = tolerance ?? HIT_TOLERANCE / zoom;
  return entities.filter((entity) =>
    hitTest(entity, screenPoint, viewport, adjustedTolerance),
  );
}

/**
 * 사각형 영역 내 엔티티들을 찾습니다 (드래그 선택 박스).
 */
export function hitTestRect(
  entities: Entity[],
  rect: { minX: number; minY: number; maxX: number; maxY: number },
): Entity[] {
  return entities.filter((entity) => {
    switch (entity.type) {
      case "POINT":
        if (entity.position) {
          return (
            entity.position.x >= rect.minX &&
            entity.position.x <= rect.maxX &&
            entity.position.y >= rect.minY &&
            entity.position.y <= rect.maxY
          );
        }
        return false;
      case "LINE":
        if (entity.start && entity.end) {
          // Check if any point of the line is inside the rect
          return (
            (entity.start.x >= rect.minX &&
              entity.start.x <= rect.maxX &&
              entity.start.y >= rect.minY &&
              entity.start.y <= rect.maxY) ||
            (entity.end.x >= rect.minX &&
              entity.end.x <= rect.maxX &&
              entity.end.y >= rect.minY &&
              entity.end.y <= rect.maxY)
          );
        }
        return false;
      case "CIRCLE":
        if (entity.center && entity.radius !== undefined) {
          // Check if circle center is inside rect (simplified)
          return (
            entity.center.x >= rect.minX &&
            entity.center.x <= rect.maxX &&
            entity.center.y >= rect.minY &&
            entity.center.y <= rect.maxY
          );
        }
        return false;
      case "POLYLINE":
      case "LWPOLYLINE":
        if (entity.vertices && entity.vertices.length > 0) {
          // Check if any vertex is inside the rect
          return entity.vertices.some(
            (v) =>
              v.x >= rect.minX &&
              v.x <= rect.maxX &&
              v.y >= rect.minY &&
              v.y <= rect.maxY,
          );
        }
        return false;
      default:
        return false;
    }
  });
}

function isPointInsideRect(
  p: Point,
  rect: { minX: number; minY: number; maxX: number; maxY: number },
): boolean {
  return (
    p.x >= rect.minX && p.x <= rect.maxX && p.y >= rect.minY && p.y <= rect.maxY
  );
}

function getEntityAabb(entity: Entity): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} | null {
  const pts: Point[] = [];
  if (entity.position) pts.push(entity.position);
  if (entity.start) pts.push(entity.start);
  if (entity.end) pts.push(entity.end);
  if (entity.center) pts.push(entity.center);
  if (entity.vertices) pts.push(...entity.vertices);
  if (entity.blockPosition) pts.push(entity.blockPosition);

  if (pts.length === 0) return null;
  let minX = pts[0].x;
  let minY = pts[0].y;
  let maxX = pts[0].x;
  let maxY = pts[0].y;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

function rectContainsRect(
  outer: { minX: number; minY: number; maxX: number; maxY: number },
  inner: { minX: number; minY: number; maxX: number; maxY: number },
): boolean {
  return (
    inner.minX >= outer.minX &&
    inner.maxX <= outer.maxX &&
    inner.minY >= outer.minY &&
    inner.maxY <= outer.maxY
  );
}

function rectIntersectsRect(
  a: { minX: number; minY: number; maxX: number; maxY: number },
  b: { minX: number; minY: number; maxX: number; maxY: number },
): boolean {
  return !(
    a.maxX < b.minX ||
    a.minX > b.maxX ||
    a.maxY < b.minY ||
    a.minY > b.maxY
  );
}

/**
 * AutoCAD-style Window selection: entity must be fully contained in the rectangle.
 * (Implementation uses entity AABB containment for speed/stability.)
 */
export function hitTestRectWindow(
  entities: Entity[],
  rect: { minX: number; minY: number; maxX: number; maxY: number },
): Entity[] {
  return entities.filter((entity) => {
    // Exact containment for point-like entities
    if (entity.type === "POINT" && entity.position) {
      return isPointInsideRect(entity.position, rect);
    }

    const aabb = getEntityAabb(entity);
    if (!aabb) return false;
    return rectContainsRect(rect, aabb);
  });
}

/**
 * AutoCAD-style Crossing selection: entity is selected if it intersects the rectangle.
 * (Implementation uses AABB intersection + quick point checks.)
 */
export function hitTestRectCrossing(
  entities: Entity[],
  rect: { minX: number; minY: number; maxX: number; maxY: number },
): Entity[] {
  return entities.filter((entity) => {
    // Fast path: any defining point inside rect
    if (entity.position && isPointInsideRect(entity.position, rect))
      return true;
    if (entity.start && isPointInsideRect(entity.start, rect)) return true;
    if (entity.end && isPointInsideRect(entity.end, rect)) return true;
    if (entity.center && isPointInsideRect(entity.center, rect)) return true;
    if (entity.blockPosition && isPointInsideRect(entity.blockPosition, rect))
      return true;
    if (entity.vertices?.some((v) => isPointInsideRect(v, rect))) return true;

    const aabb = getEntityAabb(entity);
    if (!aabb) return false;
    return rectIntersectsRect(rect, aabb);
  });
}

/**
 * 선택 목록을 관리하는 선택기 인스턴스를 생성합니다.
 */
export function createSelectionManager(
  onSelectionChange?: (ids: string[]) => void,
) {
  let selectedIds: string[] = [];

  const notify = () => {
    onSelectionChange?.([...selectedIds]);
  };

  function select(entity: Entity) {
    selectedIds = [entity.id];
    notify();
  }

  function selectMultiple(entities: Entity[]) {
    selectedIds = entities.map((e) => e.id);
    notify();
  }

  function toggle(entity: Entity) {
    const idx = selectedIds.indexOf(entity.id);
    if (idx >= 0) {
      selectedIds.splice(idx, 1);
    } else {
      selectedIds.push(entity.id);
    }
    notify();
  }

  function clearSelection() {
    if (selectedIds.length === 0) return;
    selectedIds = [];
    notify();
  }

  function getSelection(): string[] {
    return [...selectedIds];
  }

  function isSelected(entityId: string): boolean {
    return selectedIds.includes(entityId);
  }

  return {
    select,
    selectMultiple,
    toggle,
    clearSelection,
    getSelection,
    isSelected,
  };
}
