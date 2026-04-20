/**
 * circle-tool.ts
 * 원(CIRCLE) 그리기 도구 모듈
 *
 * 두 번의 클릭으로 원호를 생성합니다.
 * 첫 번째 클릭: 중심점 지정
 * 두 번째 클릭: 반지름 상의 점 지정
 * 완료 시 onComplete 콜백과 CREATE_ENTITY 문서 명령을 생성합니다.
 */

import type { Point } from "./line-tool.js";

export interface CircleEntity {
  id: string;
  type: "CIRCLE";
  center: Point;
  radius: number;
  layer: string;
  color: string;
}

export interface CreateEntityCommand {
  type: "CREATE_ENTITY";
  entityType: "CIRCLE";
  entityId: string;
  params: {
    center: Point;
    radius: number;
    layer: string;
    color: string;
  };
}

export interface CircleToolState {
  centerPoint: Point | null;
  radiusPoint: Point | null;
  isDrawing: boolean;
}

export interface CircleToolOptions {
  onComplete?: (entity: CircleEntity, command: CreateEntityCommand) => void;
  onPreview?: (entity: CircleEntity) => void;
}

/**
 * CIRCLE 도구 인스턴스를 생성합니다.
 */
export function createCircleTool(options: CircleToolOptions = {}) {
  const { onComplete, onPreview } = options;

  const state: CircleToolState = {
    centerPoint: null,
    radiusPoint: null,
    isDrawing: false,
  };

  function handleClick(screenPoint: Point): CircleEntity | null {
    if (!state.isDrawing) {
      state.centerPoint = { ...screenPoint };
      state.radiusPoint = { ...screenPoint };
      state.isDrawing = true;

      if (onPreview && state.centerPoint && state.radiusPoint) {
        onPreview(createCircleEntity(state.centerPoint, calculateRadius()));
      }
      return null;
    } else {
      state.radiusPoint = { ...screenPoint };
      state.isDrawing = false;

      if (!state.centerPoint || !state.radiusPoint) return null;

      const radius = calculateRadius();
      if (radius < 1) return null;

      const entity = createCircleEntity(state.centerPoint, radius);
      const command = createCreateCircleCommand(entity);

      if (onComplete) {
        onComplete(entity, command);
      }

      const result = entity;
      state.centerPoint = null;
      state.radiusPoint = null;

      return result;
    }
  }

  function calculateRadius(): number {
    if (!state.centerPoint || !state.radiusPoint) return 0;
    return Math.hypot(
      state.radiusPoint.x - state.centerPoint.x,
      state.radiusPoint.y - state.centerPoint.y,
    );
  }

  function handleMove(screenPoint: Point) {
    if (!state.isDrawing || !state.centerPoint) return;

    state.radiusPoint = { ...screenPoint };

    if (onPreview && state.centerPoint) {
      onPreview(createCircleEntity(state.centerPoint, calculateRadius()));
    }
  }

  function cancel() {
    state.centerPoint = null;
    state.radiusPoint = null;
    state.isDrawing = false;
  }

  function getState(): CircleToolState {
    return { ...state };
  }

  function getPreviewEntity(): CircleEntity | null {
    if (!state.centerPoint) return null;
    return createCircleEntity(state.centerPoint, calculateRadius());
  }

  return {
    handleClick,
    handleMove,
    cancel,
    getState,
    getPreviewEntity,
  };
}

/**
 * CIRCLE 엔티티 객체를 생성합니다.
 */
export function createCircleEntity(
  center: Point,
  radius: number,
): CircleEntity {
  return {
    id: generateEntityId(),
    type: "CIRCLE",
    center: { x: center.x, y: center.y },
    radius,
    layer: "0",
    color: "BYLAYER",
  };
}

/**
 * CIRCLE 생성 문서 명령을 생성합니다.
 */
export function createCreateCircleCommand(
  entity: CircleEntity,
): CreateEntityCommand {
  return {
    type: "CREATE_ENTITY",
    entityType: "CIRCLE",
    entityId: entity.id,
    params: {
      center: entity.center,
      radius: entity.radius,
      layer: entity.layer,
      color: entity.color,
    },
  };
}

/**
 * 고유 엔티티 ID 생성
 */
function generateEntityId(): string {
  return `circle-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * CIRCLE 도구에서 사용할 수 있는 도구 모드를 반환합니다.
 */
export function getCircleToolModes(): string[] {
  return ["click", "center-radius"];
}
