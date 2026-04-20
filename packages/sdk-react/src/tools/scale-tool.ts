/**
 * scale-tool.ts
 * 스케일(SCALE) 도구 모듈
 *
 * 선택된 엔티티들을 지정된 기준점을 중심으로 확대/축소합니다.
 * 첫 번째 클릭: 기준점 (스케일 중심)
 * 두 번째 클릭: 스케일 비율 결정 (기준점에서의 거리 비율)
 */

import type { Point } from "./line-tool.js";
import type { Entity } from "../canvas/cad-canvas-renderer.js";

export interface ScaleToolState {
  basePoint: Point | null;
  referencePoint: Point | null;
  isPending: boolean;
  selectedEntities: Entity[];
}

export interface ScaleToolOptions {
  onComplete?: (scaledEntities: Entity[]) => void;
  onPreview?: (scaledEntities: Entity[]) => void;
}

/**
 * 포인트와 기준점 사이의 거리를 구합니다.
 */
function getDistance(point: Point, base: Point): number {
  return Math.hypot(point.x - base.x, point.y - base.y);
}

/**
 * 포인트를 기준점 기준으로 스케일합니다.
 */
function scalePoint(point: Point, base: Point, factor: number): Point {
  return {
    x: base.x + (point.x - base.x) * factor,
    y: base.y + (point.y - base.y) * factor,
  };
}

/**
 * 엔티티를 스케일합니다.
 */
function scaleEntity(entity: Entity, base: Point, factor: number): Entity {
  switch (entity.type) {
    case "POINT":
      return {
        ...entity,
        position: entity.position
          ? scalePoint(entity.position, base, factor)
          : undefined,
      };
    case "LINE":
      return {
        ...entity,
        start: entity.start
          ? scalePoint(entity.start, base, factor)
          : undefined,
        end: entity.end ? scalePoint(entity.end, base, factor) : undefined,
      };
    case "POLYLINE":
    case "LWPOLYLINE":
      return {
        ...entity,
        vertices: entity.vertices?.map((v) => scalePoint(v, base, factor)),
      };
    case "CIRCLE":
      return {
        ...entity,
        center: entity.center
          ? scalePoint(entity.center, base, factor)
          : undefined,
        radius:
          entity.radius !== undefined
            ? entity.radius * Math.abs(factor)
            : undefined,
      };
    case "ARC":
      return {
        ...entity,
        center: entity.center
          ? scalePoint(entity.center, base, factor)
          : undefined,
        radius:
          entity.radius !== undefined
            ? entity.radius * Math.abs(factor)
            : undefined,
      };
    case "TEXT":
      return {
        ...entity,
        position: entity.position
          ? scalePoint(entity.position, base, factor)
          : undefined,
      };
    default:
      return entity;
  }
}

/**
 * SCALE 도구 인스턴스를 생성합니다.
 */
export function createScaleTool(options: ScaleToolOptions = {}) {
  const { onComplete, onPreview } = options;

  const state: ScaleToolState = {
    basePoint: null,
    referencePoint: null,
    isPending: false,
    selectedEntities: [],
  };

  /**
   * 클릭 핸들러
   */
  function handleClick(
    point: Point,
    selectedEntities: Entity[],
    scaleFactor?: number,
  ): Entity[] | null {
    if (!state.isPending) {
      // 첫 번째 클릭: 기준점 설정
      state.basePoint = { ...point };
      state.referencePoint = { ...point };
      state.isPending = true;
      state.selectedEntities = selectedEntities;
      return null;
    } else {
      // 두 번째 클릭: 스케일 비율 계산
      state.referencePoint = { ...point };

      if (!state.basePoint || !state.referencePoint) return null;

      // 거리 비율로 스케일 비율 계산
      const factor =
        scaleFactor ?? getDistance(state.referencePoint, state.basePoint) / 10;

      if (factor <= 0) return null;

      const scaledEntities = state.selectedEntities.map((e) =>
        scaleEntity(e, state.basePoint!, factor),
      );

      if (onComplete) {
        onComplete(scaledEntities);
      }

      // 초기화
      state.basePoint = null;
      state.referencePoint = null;
      state.isPending = false;
      state.selectedEntities = [];

      return scaledEntities;
    }
  }

  /**
   * 미리보기용 스케일된 엔티티 반환
   */
  function getPreview(point: Point, scaleFactor?: number): Entity[] | null {
    if (
      !state.isPending ||
      !state.basePoint ||
      !state.referencePoint ||
      !state.selectedEntities.length
    ) {
      return null;
    }

    const factor = scaleFactor ?? getDistance(point, state.basePoint) / 10;
    if (factor <= 0) return null;

    return state.selectedEntities.map((e) =>
      scaleEntity(e, state.basePoint!, factor),
    );
  }

  function cancel() {
    state.basePoint = null;
    state.referencePoint = null;
    state.isPending = false;
    state.selectedEntities = [];
  }

  function getState(): ScaleToolState {
    return { ...state };
  }

  function isActive(): boolean {
    return state.isPending;
  }

  return {
    handleClick,
    getPreview,
    cancel,
    getState,
    isActive,
  };
}
