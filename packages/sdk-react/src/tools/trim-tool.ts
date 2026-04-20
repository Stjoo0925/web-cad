/**
 * trim-tool.ts
 * 트림(TRIM) 도구 모듈
 *
 * 엔티티들을 cutting edge 교차점까지 자릅니다.
 * 첫 번째 클릭: cutting edge 선택
 * 두 번째 클릭: 잘라낼 엔티티 선택 (교차점에서 잘라냄)
 */

import type { Point } from "./line-tool.js";
import type { Entity } from "../canvas/cad-canvas-renderer.js";

export interface TrimToolState {
  cuttingEdge: Entity | null;
  isPending: boolean;
  targetEntity: Entity | null;
}

export interface TrimToolOptions {
  onComplete?: (trimmedEntities: Entity[]) => void;
  onPreview?: (trimmedEntities: Entity[]) => void;
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
  if (Math.abs(denom) < 1e-10) return null; // 평행

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
 * 선분과 원의 교차점을 구합니다.
 */
function lineCircleIntersection(
  lineStart: Point,
  lineEnd: Point,
  circleCenter: Point,
  circleRadius: number,
): Point[] {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const fx = lineStart.x - circleCenter.x;
  const fy = lineStart.y - circleCenter.y;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - circleRadius * circleRadius;

  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return [];

  const sqrtD = Math.sqrt(discriminant);
  const t1 = (-b - sqrtD) / (2 * a);
  const t2 = (-b + sqrtD) / (2 * a);

  const points: Point[] = [];
  if (t1 >= 0 && t1 <= 1) {
    points.push({
      x: lineStart.x + t1 * dx,
      y: lineStart.y + t1 * dy,
    });
  }
  if (t2 >= 0 && t2 <= 1 && Math.abs(t2 - t1) > 1e-10) {
    points.push({
      x: lineStart.x + t2 * dx,
      y: lineStart.y + t2 * dy,
    });
  }
  return points;
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
 * 엔티티와 점 사이의 가장 가까운 교차점을 구합니다.
 */
function findNearestIntersection(
  entity: Entity,
  point: Point,
): Point | null {
  let intersections: Point[] = [];

  if (entity.type === "LINE" && entity.start && entity.end) {
    // 선 대상의 경우, cutting edge와의 교차점을 찾습니다
    // 투영 기반으로 잘라내야 하므로 다르게 처리
  }

  return null;
}

/**
 * 엔티티를 cutting edge까지 트림합니다.
 */
function trimEntity(entity: Entity, cuttingEdge: Entity, trimPoint: Point): Entity {
  // 선의 경우, trimPoint에 가장 가까운 시작점 또는 끝점을 자름
  if (entity.type === "LINE" && entity.start && entity.end) {
    const distToStart = Math.hypot(trimPoint.x - entity.start.x, trimPoint.y - entity.start.y);
    const distToEnd = Math.hypot(trimPoint.x - entity.end.x, trimPoint.y - entity.end.y);

    if (distToStart < distToEnd) {
      return { ...entity, start: trimPoint };
    } else {
      return { ...entity, end: trimPoint };
    }
  }

  // 폴리라인의 경우, 가장 가까운 버텍스를 자름
  if (
    (entity.type === "POLYLINE" || entity.type === "LWPOLYLINE") &&
    entity.vertices
  ) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    entity.vertices.forEach((v, i) => {
      const dist = Math.hypot(trimPoint.x - v.x, trimPoint.y - v.y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    });

    const newVertices = [...entity.vertices];
    newVertices[nearestIdx] = trimPoint;
    return { ...entity, vertices: newVertices };
  }

  return entity;
}

/**
 * TRIM 도구 인스턴스를 생성합니다.
 */
export function createTrimTool(options: TrimToolOptions = {}) {
  const { onComplete, onPreview } = options;

  const state: TrimToolState = {
    cuttingEdge: null,
    isPending: false,
    targetEntity: null,
  };

  /**
   * 클릭 핸들러
   */
  function handleClick(point: Point, entities: Entity[]): Entity[] | null {
    if (!state.isPending) {
      // 첫 번째 클릭: cutting edge 선택
      // 해당 지점에서 cutting edge로 사용할 수 있는 엔티티 찾기
      const hitEntity = entities.find((e) => {
        if (e.type === "LINE" && e.start && e.end) {
          const closest = closestPointOnSegment(point, e.start, e.end);
          return Math.hypot(point.x - closest.x, point.y - closest.y) < 10;
        }
        return false;
      });

      if (hitEntity) {
        state.cuttingEdge = hitEntity;
        state.isPending = true;
      }
      return null;
    } else {
      // 두 번째 클릭: 잘라낼 대상 엔티티 선택
      if (!state.cuttingEdge) return null;

      const targetEntity = entities.find((e) => {
        if (e.id === state.cuttingEdge!.id) return false;
        if (e.type === "LINE" && e.start && e.end) {
          const closest = closestPointOnSegment(point, e.start, e.end);
          return Math.hypot(point.x - closest.x, point.y - closest.y) < 10;
        }
        return false;
      });

      if (targetEntity) {
        state.targetEntity = targetEntity;

        // 대상과 cutting edge 사이의 교차점 찾기
        let trimPoint: Point | null = null;

        if (
          state.cuttingEdge.type === "LINE" &&
          targetEntity.type === "LINE" &&
          state.cuttingEdge.start &&
          state.cuttingEdge.end &&
          targetEntity.start &&
          targetEntity.end
        ) {
          trimPoint = lineLineIntersection(
            state.cuttingEdge.start,
            state.cuttingEdge.end,
            targetEntity.start,
            targetEntity.end,
          );
        }

        if (trimPoint) {
          const trimmedEntity = trimEntity(targetEntity, state.cuttingEdge, trimPoint);
          const result = [trimmedEntity];

          if (onComplete) {
            onComplete(result);
          }

          // 초기화
          state.cuttingEdge = null;
          state.targetEntity = null;
          state.isPending = false;

          return result;
        }
      }

      // 유효한 대상이 없으면 초기화
      state.cuttingEdge = null;
      state.isPending = false;
      return null;
    }
  }

  function cancel() {
    state.cuttingEdge = null;
    state.targetEntity = null;
    state.isPending = false;
  }

  function getState(): TrimToolState {
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
