/**
 * copy-tool.ts
 * 복사(COPY) 도구 모듈
 *
 * 선택된 엔티티들을 복사하여 지정된 위치에 새 엔티티로 생성합니다.
 * 첫 번째 클릭: 복사본 기준점
 * 두 번째 클릭: 복사본 위치 결정
 */

import type { Point } from "./line-tool.js";
import type { Entity } from "../canvas/cad-canvas-renderer.js";

export interface CopyToolState {
  basePoint: Point | null;
  targetPoint: Point | null;
  isPending: boolean;
  selectedEntities: Entity[];
}

export interface CopyToolOptions {
  onComplete?: (copiedEntities: Entity[]) => void;
  onPreview?: (copiedEntities: Entity[]) => void;
}

/**
 * 새 엔티티 ID 생성
 */
function generateEntityId(): string {
  return `copy-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 엔티티를 복사하고 지정된 델타만큼 이동합니다.
 */
function copyEntity(entity: Entity, delta: Point): Entity {
  const newId = generateEntityId();

  switch (entity.type) {
    case "POINT":
      return {
        ...entity,
        id: newId,
        position: entity.position
          ? { x: entity.position.x + delta.x, y: entity.position.y + delta.y }
          : undefined,
      };
    case "LINE":
      return {
        ...entity,
        id: newId,
        start: entity.start
          ? { x: entity.start.x + delta.x, y: entity.start.y + delta.y }
          : undefined,
        end: entity.end
          ? { x: entity.end.x + delta.x, y: entity.end.y + delta.y }
          : undefined,
      };
    case "POLYLINE":
    case "LWPOLYLINE":
      return {
        ...entity,
        id: newId,
        vertices: entity.vertices?.map((v) => ({
          x: v.x + delta.x,
          y: v.y + delta.y,
        })),
      };
    case "CIRCLE":
      return {
        ...entity,
        id: newId,
        center: entity.center
          ? { x: entity.center.x + delta.x, y: entity.center.y + delta.y }
          : undefined,
      };
    case "ARC":
      return {
        ...entity,
        id: newId,
        center: entity.center
          ? { x: entity.center.x + delta.x, y: entity.center.y + delta.y }
          : undefined,
      };
    case "TEXT":
      return {
        ...entity,
        id: newId,
        position: entity.position
          ? { x: entity.position.x + delta.x, y: entity.position.y + delta.y }
          : undefined,
      };
    default:
      return { ...entity, id: newId };
  }
}

/**
 * COPY 도구 인스턴스를 생성합니다.
 */
export function createCopyTool(options: CopyToolOptions = {}) {
  const { onComplete, onPreview } = options;

  const state: CopyToolState = {
    basePoint: null,
    targetPoint: null,
    isPending: false,
    selectedEntities: [],
  };

  /**
   * 클릭 핸들러
   */
  function handleClick(point: Point, selectedEntities: Entity[]): Entity[] | null {
    if (!state.isPending) {
      // 첫 번째 클릭: 기준점 설정
      state.basePoint = { ...point };
      state.targetPoint = { ...point };
      state.isPending = true;
      state.selectedEntities = selectedEntities;
      return null;
    } else {
      // 두 번째 클릭: 복사 완료
      state.targetPoint = { ...point };

      if (!state.basePoint || !state.targetPoint) return null;

      const delta = {
        x: state.targetPoint.x - state.basePoint.x,
        y: state.targetPoint.y - state.basePoint.y,
      };

      const copiedEntities = state.selectedEntities.map((e) =>
        copyEntity(e, delta),
      );

      if (onComplete) {
        onComplete(copiedEntities);
      }

      // 상태 초기화
      state.basePoint = null;
      state.targetPoint = null;
      state.isPending = false;
      state.selectedEntities = [];

      return copiedEntities;
    }
  }

  /**
   * 미리보기용 복사된 엔티티 반환
   */
  function getPreview(point: Point): Entity[] | null {
    if (!state.isPending || !state.basePoint || !state.selectedEntities.length) {
      return null;
    }

    const delta = {
      x: point.x - state.basePoint.x,
      y: point.y - state.basePoint.y,
    };

    return state.selectedEntities.map((e) => copyEntity(e, delta));
  }

  function cancel() {
    state.basePoint = null;
    state.targetPoint = null;
    state.isPending = false;
    state.selectedEntities = [];
  }

  function getState(): CopyToolState {
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
