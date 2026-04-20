/**
 * move-tool.ts
 * 이동(MOVE) 도구 모듈
 *
 * 선택된 엔티티들을 지정된 방향과 거리만큼 이동합니다.
 * 첫 번째 클릭: 이동 시작점 (기준점)
 * 두 번째 클릭: 이동 종료점 (방향과 거리 결정)
 */

import type { Point } from "./line-tool.js";
import type { Entity } from "../canvas/cad-canvas-renderer.js";

export interface MoveToolState {
  basePoint: Point | null;
  targetPoint: Point | null;
  isPending: boolean;
  selectedEntities: Entity[];
}

export interface MoveToolOptions {
  onComplete?: (movedEntities: Entity[]) => void;
  onPreview?: (movedEntities: Entity[]) => void;
}

/**
 * MOVE 도구 인스턴스를 생성합니다.
 */
export function createMoveTool(options: MoveToolOptions = {}) {
  const { onComplete, onPreview } = options;

  const state: MoveToolState = {
    basePoint: null,
    targetPoint: null,
    isPending: false,
    selectedEntities: [],
  };

  /**
   * 엔티티들을 지정된 델타만큼 이동합니다.
   */
  function moveEntity(entity: Entity, delta: Point): Entity {
    const dx = delta.x;
    const dy = delta.y;

    switch (entity.type) {
      case "POINT":
        return {
          ...entity,
          position: entity.position
            ? { x: entity.position.x + dx, y: entity.position.y + dy }
            : undefined,
        };
      case "LINE":
        return {
          ...entity,
          start: entity.start
            ? { x: entity.start.x + dx, y: entity.start.y + dy }
            : undefined,
          end: entity.end
            ? { x: entity.end.x + dx, y: entity.end.y + dy }
            : undefined,
        };
      case "POLYLINE":
      case "LWPOLYLINE":
        return {
          ...entity,
          vertices: entity.vertices?.map((v) => ({
            x: v.x + dx,
            y: v.y + dy,
          })),
        };
      case "CIRCLE":
        return {
          ...entity,
          center: entity.center
            ? { x: entity.center.x + dx, y: entity.center.y + dy }
            : undefined,
        };
      case "ARC":
        return {
          ...entity,
          center: entity.center
            ? { x: entity.center.x + dx, y: entity.center.y + dy }
            : undefined,
        };
      case "TEXT":
        return {
          ...entity,
          position: entity.position
            ? { x: entity.position.x + dx, y: entity.position.y + dy }
            : undefined,
        };
      default:
        return entity;
    }
  }

  /**
   * 클릭 핸들러 - 첫 클릭은 기준점, 두 번째 클릭은 이동 완료
   */
  function handleClick(
    point: Point,
    selectedEntities: Entity[],
  ): Entity[] | null {
    if (!state.isPending) {
      // First click: set base point
      state.basePoint = { ...point };
      state.targetPoint = { ...point };
      state.isPending = true;
      state.selectedEntities = selectedEntities;
      return null;
    } else {
      // Second click: complete move
      state.targetPoint = { ...point };

      if (!state.basePoint || !state.targetPoint) return null;

      const delta = {
        x: state.targetPoint.x - state.basePoint.x,
        y: state.targetPoint.y - state.basePoint.y,
      };

      const movedEntities = state.selectedEntities.map((e) =>
        moveEntity(e, delta),
      );

      if (onComplete) {
        onComplete(movedEntities);
      }

      // Reset state
      state.basePoint = null;
      state.targetPoint = null;
      state.isPending = false;
      state.selectedEntities = [];

      return movedEntities;
    }
  }

  /**
   * 미리보기용 이동된 엔티티 반환
   */
  function getPreview(point: Point): Entity[] | null {
    if (
      !state.isPending ||
      !state.basePoint ||
      !state.selectedEntities.length
    ) {
      return null;
    }

    const delta = {
      x: point.x - state.basePoint.x,
      y: point.y - state.basePoint.y,
    };

    return state.selectedEntities.map((e) => moveEntity(e, delta));
  }

  function cancel() {
    state.basePoint = null;
    state.targetPoint = null;
    state.isPending = false;
    state.selectedEntities = [];
  }

  function getState(): MoveToolState {
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

/**
 * 두 포인트 사이의 델타를 계산합니다.
 */
export function calculateDelta(from: Point, to: Point): Point {
  return {
    x: to.x - from.x,
    y: to.y - from.y,
  };
}
