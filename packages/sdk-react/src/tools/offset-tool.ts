/**
 * offset-tool.ts
 * 오프셋(OFFSET) 도구 모듈
 *
 * 엔티티를 지정된 거리만큼 평행 이동한 복사본을 생성합니다.
 * LINE: 지정된 방향으로 평행 이동
 * POLYLINE/LWPOLYLINE: 평행한 복사 생성
 * CIRCLE: 확대/축소된 원 또는 동심원
 */

import type { Point } from "./line-tool.js";
import type { Entity } from "../canvas/cad-canvas-renderer.js";

export interface OffsetToolState {
  offsetDistance: number;
  isPending: boolean;
  selectedEntity: Entity | null;
}

export interface OffsetToolOptions {
  onComplete?: (offsetEntities: Entity[]) => void;
  onPreview?: (offsetEntities: Entity[]) => void;
}

/**
 * 새 엔티티 ID 생성
 */
function generateEntityId(): string {
  return `offset-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 두 벡터의 외적을 구합니다 (2D).
 */
function cross2D(a: Point, b: Point): number {
  return a.x * b.y - a.y * b.x;
}

/**
 * 포인트가 선분의 어느 쪽에 있는지 구합니다.
 */
function sideOfLine(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  return cross2D({ x: dx, y: dy }, { x: point.x - lineStart.x, y: point.y - lineStart.y });
}

/**
 * 라인 엔티티를 오프셋합니다.
 */
function offsetLine(entity: Entity, distance: number, side: number): Entity {
  if (!entity.start || !entity.end) return entity;

  const dx = entity.end.x - entity.start.x;
  const dy = entity.end.y - entity.start.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return entity;

  // Normal vector perpendicular to line (rotated 90 degrees)
  const nx = -dy / len;
  const ny = dx / len;

  const newId = generateEntityId();
  const delta = { x: nx * distance * side, y: ny * distance * side };

  return {
    ...entity,
    id: newId,
    start: { x: entity.start.x + delta.x, y: entity.start.y + delta.y },
    end: { x: entity.end.x + delta.x, y: entity.end.y + delta.y },
  };
}

/**
 * 폴리라인 엔티티를 오프셋합니다.
 */
function offsetPolyline(entity: Entity, distance: number): Entity[] {
  if (!entity.vertices || entity.vertices.length < 2) return [entity];

  const newId = generateEntityId();
  const newVertices = entity.vertices.map((v, i) => {
    // For each vertex, calculate offset direction based on adjacent segments
    const prev = entity.vertices![i - 1] ?? v;
    const next = entity.vertices![i + 1] ?? v;

    const dx1 = next.x - prev.x;
    const dy1 = next.y - prev.y;
    const len1 = Math.hypot(dx1, dy1);
    if (len1 === 0) return v;

    // Perpendicular direction
    const nx = -dy1 / len1;
    const ny = dx1 / len1;

    return {
      x: v.x + nx * distance,
      y: v.y + ny * distance,
    };
  });

  return [{
    ...entity,
    id: newId,
    vertices: newVertices,
    closed: entity.closed,
  }];
}

/**
 * 서클 엔티티를 오프셋합니다 (半径を+/- distanceにした同心円).
 */
function offsetCircle(entity: Entity, distance: number): Entity {
  if (!entity.center || entity.radius === undefined) return entity;

  const newId = generateEntityId();
  return {
    ...entity,
    id: newId,
    radius: entity.radius + distance,
  };
}

/**
 * 아크 엔티티를 오프셋합니다.
 */
function offsetArc(entity: Entity, distance: number): Entity {
  if (!entity.center || entity.radius === undefined) return entity;

  const newId = generateEntityId();
  return {
    ...entity,
    id: newId,
    radius: entity.radius + distance,
  };
}

/**
 * 엔티티를 오프셋합니다.
 */
function offsetEntity(entity: Entity, distance: number, side: number = 1): Entity {
  switch (entity.type) {
    case "LINE":
      return offsetLine(entity, distance, side);
    case "POLYLINE":
    case "LWPOLYLINE":
      return offsetPolyline(entity, distance)[0];
    case "CIRCLE":
      return offsetCircle(entity, distance);
    case "ARC":
      return offsetArc(entity, distance);
    default:
      return { ...entity, id: generateEntityId() };
  }
}

/**
 * OFFSET 도구 인스턴스를 생성합니다.
 */
export function createOffsetTool(options: OffsetToolOptions = {}) {
  const { onComplete, onPreview } = options;

  const state: OffsetToolState = {
    offsetDistance: 10,
    isPending: false,
    selectedEntity: null,
  };

  /**
   * 오프셋 거리 설정
   */
  function setOffsetDistance(distance: number) {
    state.offsetDistance = distance;
  }

  /**
   * 클릭 핸들러 - 클릭한 위치가 엔티티의 어느 쪽인지 판단하여 오프셋
   */
  function handleClick(point: Point, selectedEntity: Entity): Entity[] | null {
    state.selectedEntity = selectedEntity;

    if (!selectedEntity) return null;

    let side = 1;
    // For lines, determine which side the click was on
    if (selectedEntity.type === "LINE" && selectedEntity.start && selectedEntity.end) {
      side = sideOfLine(point, selectedEntity.start, selectedEntity.end) > 0 ? 1 : -1;
    }

    const offsetEntity = offsetEntity(selectedEntity, state.offsetDistance, side);
    const result = [offsetEntity];

    if (onComplete) {
      onComplete(result);
    }

    return result;
  }

  /**
   * 미리보기용 오프셋된 엔티티 반환
   */
  function getPreview(point: Point): Entity[] | null {
    if (!state.selectedEntity) return null;

    let side = 1;
    if (state.selectedEntity.type === "LINE" && state.selectedEntity.start && state.selectedEntity.end) {
      side = sideOfLine(point, state.selectedEntity.start, state.selectedEntity.end) > 0 ? 1 : -1;
    }

    return [offsetEntity(state.selectedEntity, state.offsetDistance, side)];
  }

  function cancel() {
    state.selectedEntity = null;
    state.isPending = false;
  }

  function getState(): OffsetToolState {
    return { ...state };
  }

  function getOffsetDistance(): number {
    return state.offsetDistance;
  }

  return {
    handleClick,
    getPreview,
    setOffsetDistance,
    cancel,
    getState,
    getOffsetDistance,
  };
}
