/**
 * select-tool.ts
 * 엔티티 선택 도구 및 히트 테스트 모듈
 *
 * Canvas 2D 뷰포트에서 POINT, LINE, POLYLINE 엔티티의 클릭/더블클릭 선택을 지원합니다.
 * 단일/다중 선택, 선택 해제, 히트 테스트 기능을 제공합니다.
 */

/**
 * 히트 허용 오차 (픽셀)
 */
const HIT_TOLERANCE = 8;

export interface Point {
  x: number;
  y: number;
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
  closed?: boolean;
  [key: string]: unknown;
}

export interface Viewport {
  zoom?: number;
  pan?: Point;
  [key: string]: unknown;
}

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
