/**
 * extend-tool.ts
 * 확장(EXTEND) 도구 모듈
 *
 * 엔티티들을 boundary edge까지 연장합니다.
 * 첫 번째 클릭: boundary edge 선택
 * 두 번째 클릭: 확장할 엔티티 선택 (boundary까지 연장)
 */

import type { Point } from "./line-tool.js";
import type { Entity } from "../canvas/cad-canvas-renderer.js";

export interface ExtendToolState {
  boundaryEdge: Entity | null;
  isPending: boolean;
  targetEntity: Entity | null;
}

export interface ExtendToolOptions {
  onComplete?: (extendedEntities: Entity[]) => void;
  onPreview?: (extendedEntities: Entity[]) => void;
}

/**
 * 두 선분의 교차점을 구합니다.
 */
function lineLineIntersection(
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point,
): Point | null {
  const dx1 = a2.x - a1.x;
  const dy1 = a2.y - a1.y;
  const dx2 = b2.x - b1.x;
  const dy2 = b2.y - b1.y;

  const denom = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denom) < 1e-10) return null;

  const t = ((b1.x - a1.x) * dy2 - (b1.y - a1.y) * dx2) / denom;
  const u = ((b1.x - a1.x) * dy1 - (b1.y - a1.y) * dx1) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: a1.x + t * dx1,
      y: a1.y + t * dy1,
    };
  }
  return null;
}

/**
 * 선분의 가장 가까운 포인트를 구합니다.
 */
function closestPointOnSegment(point: Point, segStart: Point, segEnd: Point): Point {
  const dx = segEnd.x - segStart.x;
  const dy = segEnd.y - segStart.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) return segStart;

  let t = ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  return {
    x: segStart.x + t * dx,
    y: segStart.y + t * dy,
  };
}

/**
 * 직선의 연장선과 다른 직선의 교차점을 구합니다 (무한 직선).
 */
function extendLineToIntersection(
  lineStart: Point,
  lineEnd: Point,
  targetStart: Point,
  targetEnd: Point,
): Point | null {
  const dx1 = lineEnd.x - lineStart.x;
  const dy1 = lineEnd.y - lineStart.y;
  const dx2 = targetEnd.x - targetStart.x;
  const dy2 = targetEnd.y - targetStart.y;

  const denom = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denom) < 1e-10) return null;

  const t = ((targetStart.x - lineStart.x) * dy2 - (targetStart.y - lineStart.y) * dx2) / denom;

  return {
    x: lineStart.x + t * dx1,
    y: lineStart.y + t * dy1,
  };
}

/**
 * 엔티티를 boundary까지 확장합니다.
 */
function extendEntity(entity: Entity, boundary: Entity, extendPoint: Point): Entity {
  if (entity.type === "LINE" && entity.start && entity.end) {
    // Check which end is closer to boundary, extend that end
    const distToStart = Math.hypot(extendPoint.x - entity.start.x, extendPoint.y - entity.start.y);
    const distToEnd = Math.hypot(extendPoint.x - entity.end.x, extendPoint.y - entity.end.y);

    if (distToStart < distToEnd) {
      return { ...entity, start: extendPoint };
    } else {
      return { ...entity, end: extendPoint };
    }
  }

  if (
    (entity.type === "POLYLINE" || entity.type === "LWPOLYLINE") &&
    entity.vertices &&
    entity.vertices.length > 0
  ) {
    // Extend first or last vertex
    const firstDist = Math.hypot(
      extendPoint.x - entity.vertices[0].x,
      extendPoint.y - entity.vertices[0].y,
    );
    const lastDist = Math.hypot(
      extendPoint.x - entity.vertices[entity.vertices.length - 1].x,
      extendPoint.y - entity.vertices[entity.vertices.length - 1].y,
    );

    const newVertices = [...entity.vertices];
    if (firstDist < lastDist) {
      newVertices[0] = extendPoint;
    } else {
      newVertices[newVertices.length - 1] = extendPoint;
    }
    return { ...entity, vertices: newVertices };
  }

  return entity;
}

/**
 * EXTEND 도구 인스턴스를 생성합니다.
 */
export function createExtendTool(options: ExtendToolOptions = {}) {
  const { onComplete, onPreview } = options;

  const state: ExtendToolState = {
    boundaryEdge: null,
    isPending: false,
    targetEntity: null,
  };

  /**
   * 클릭 핸들러
   */
  function handleClick(point: Point, entities: Entity[]): Entity[] | null {
    if (!state.isPending) {
      // First click: select boundary edge
      const hitEntity = entities.find((e) => {
        if (e.type === "LINE" && e.start && e.end) {
          const closest = closestPointOnSegment(point, e.start, e.end);
          return Math.hypot(point.x - closest.x, point.y - closest.y) < 10;
        }
        return false;
      });

      if (hitEntity) {
        state.boundaryEdge = hitEntity;
        state.isPending = true;
      }
      return null;
    } else {
      // Second click: select target entity to extend
      if (!state.boundaryEdge) return null;

      const targetEntity = entities.find((e) => {
        if (e.id === state.boundaryEdge!.id) return false;
        if (e.type === "LINE" && e.start && e.end) {
          const closest = closestPointOnSegment(point, e.start, e.end);
          return Math.hypot(point.x - closest.x, point.y - closest.y) < 10;
        }
        return false;
      });

      if (targetEntity) {
        state.targetEntity = targetEntity;

        // Find intersection - extend target line to meet boundary line
        let extendPoint: Point | null = null;

        if (
          state.boundaryEdge.type === "LINE" &&
          targetEntity.type === "LINE" &&
          state.boundaryEdge.start &&
          state.boundaryEdge.end &&
          targetEntity.start &&
          targetEntity.end
        ) {
          extendPoint = extendLineToIntersection(
            targetEntity.start,
            targetEntity.end,
            state.boundaryEdge.start,
            state.boundaryEdge.end,
          );
        }

        if (extendPoint) {
          const extendedEntity = extendEntity(targetEntity, state.boundaryEdge, extendPoint);
          const result = [extendedEntity];

          if (onComplete) {
            onComplete(result);
          }

          // Reset
          state.boundaryEdge = null;
          state.targetEntity = null;
          state.isPending = false;

          return result;
        }
      }

      state.boundaryEdge = null;
      state.isPending = false;
      return null;
    }
  }

  function cancel() {
    state.boundaryEdge = null;
    state.targetEntity = null;
    state.isPending = false;
  }

  function getState(): ExtendToolState {
    return { ...state };
  }

  function isActive(): boolean {
    return state.isPending;
  }

  return {
    handleClick,
    cancel,
    getState,
    isActive,
  };
}
