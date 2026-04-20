/**
 * point-tool.ts
 * 점(POINT) 그리기 도구 모듈
 *
 * 단일 클릭으로 점 엔티티를 생성합니다.
 * 완료 시 onComplete 콜백과 CREATE_ENTITY 문서 명령을 생성합니다.
 */

import type { Point } from "./line-tool.js";

export interface PointEntity {
  id: string;
  type: "POINT";
  position: Point;
  layer: string;
  color: string;
}

export interface CreateEntityCommand {
  type: "CREATE_ENTITY";
  entityType: "POINT";
  entityId: string;
  params: {
    position: Point;
    layer: string;
    color: string;
  };
}

export interface PointToolOptions {
  onComplete?: (entity: PointEntity, command: CreateEntityCommand) => void;
}

/**
 * POINT 도구 인스턴스를 생성합니다.
 */
export function createPointTool(options: PointToolOptions = {}) {
  const { onComplete } = options;

  function handleClick(screenPoint: Point): PointEntity | null {
    const entity = createPointEntity(screenPoint);
    const command = createCreatePointCommand(entity);

    if (onComplete) {
      onComplete(entity, command);
    }

    return entity;
  }

  function handleMove(_screenPoint: Point) {
    // POINT는 preview가 필요 없음
  }

  function cancel() {
    // POINT는 상태가 없으므로 cancel이 필요 없음
  }

  function getState() {
    return {};
  }

  return {
    handleClick,
    handleMove,
    cancel,
    getState,
  };
}

/**
 * POINT 엔티티 객체를 생성합니다.
 */
export function createPointEntity(position: Point): PointEntity {
  return {
    id: generateEntityId(),
    type: "POINT",
    position: { x: position.x, y: position.y },
    layer: "0",
    color: "BYLAYER",
  };
}

/**
 * POINT 생성 문서 명령을 생성합니다.
 */
export function createCreatePointCommand(
  entity: PointEntity,
): CreateEntityCommand {
  return {
    type: "CREATE_ENTITY",
    entityType: "POINT",
    entityId: entity.id,
    params: {
      position: entity.position,
      layer: entity.layer,
      color: entity.color,
    },
  };
}

/**
 * 고유 엔티티 ID 생성
 */
function generateEntityId(): string {
  return `point-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * POINT 도구에서 사용할 수 있는 도구 모드를 반환합니다.
 */
export function getPointToolModes(): string[] {
  return ["click"];
}
