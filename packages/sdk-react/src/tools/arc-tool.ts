/**
 * arc-tool.ts
 * 호(ARC) 그리기 도구 모듈
 *
 * 3-point 방식으로 호를 생성합니다.
 * 첫 번째 클릭: 시작점
 * 두 번째 클릭: 중간 점 (호가 통과하는 점)
 * 세 번째 클릭: 끝점
 * 완료 시 onComplete 콜백과 CREATE_ENTITY 문서 명령을 생성합니다.
 */

import type { Point } from "./line-tool.js";

export interface ArcEntity {
  id: string;
  type: "ARC";
  center: Point;
  radius: number;
  startAngle: number;
  endAngle: number;
  layer: string;
  color: string;
}

export interface CreateEntityCommand {
  type: "CREATE_ENTITY";
  entityType: "ARC";
  entityId: string;
  params: {
    center: Point;
    radius: number;
    startAngle: number;
    endAngle: number;
    layer: string;
    color: string;
  };
}

export interface ArcToolState {
  startPoint: Point | null;
  secondPoint: Point | null;
  endPoint: Point | null;
  isDrawing: boolean;
}

export interface ArcToolOptions {
  onComplete?: (entity: ArcEntity, command: CreateEntityCommand) => void;
  onPreview?: (entity: ArcEntity) => void;
}

/**
 * ARC 도구 인스턴스를 생성합니다.
 */
export function createArcTool(options: ArcToolOptions = {}) {
  const { onComplete, onPreview } = options;

  const state: ArcToolState = {
    startPoint: null,
    secondPoint: null,
    endPoint: null,
    isDrawing: false,
  };

  function handleClick(screenPoint: Point): ArcEntity | null {
    if (!state.isDrawing) {
      // 첫 번째 클릭: 시작점
      state.startPoint = { ...screenPoint };
      state.secondPoint = null;
      state.endPoint = null;
      state.isDrawing = true;
      return null;
    } else if (!state.secondPoint) {
      // 두 번째 클릭: 중간 점
      state.secondPoint = { ...screenPoint };
      return null;
    } else {
      // 세 번째 클릭: 끝점
      state.endPoint = { ...screenPoint };
      state.isDrawing = false;

      if (!state.startPoint || !state.secondPoint || !state.endPoint)
        return null;

      const arcData = calculateArcFromThreePoints(
        state.startPoint,
        state.secondPoint,
        state.endPoint,
      );
      if (!arcData) return null;

      const entity = createArcEntity(
        arcData.center,
        arcData.radius,
        arcData.startAngle,
        arcData.endAngle,
      );
      const command = createCreateArcCommand(entity);

      if (onComplete) {
        onComplete(entity, command);
      }

      const result = entity;
      state.startPoint = null;
      state.secondPoint = null;
      state.endPoint = null;

      return result;
    }
  }

  function handleMove(screenPoint: Point) {
    if (!state.isDrawing || !state.startPoint) return;

    if (!state.secondPoint) {
      state.secondPoint = { ...screenPoint };
    } else {
      state.endPoint = { ...screenPoint };
    }

    if (onPreview && state.startPoint && state.secondPoint && state.endPoint) {
      const arcData = calculateArcFromThreePoints(
        state.startPoint,
        state.secondPoint,
        screenPoint,
      );
      if (arcData) {
        onPreview(
          createArcEntity(
            arcData.center,
            arcData.radius,
            arcData.startAngle,
            arcData.endAngle,
          ),
        );
      }
    }
  }

  function cancel() {
    state.startPoint = null;
    state.secondPoint = null;
    state.endPoint = null;
    state.isDrawing = false;
  }

  function getState(): ArcToolState {
    return { ...state };
  }

  function getPreviewEntity(): ArcEntity | null {
    if (!state.startPoint || !state.secondPoint || !state.endPoint) return null;
    const arcData = calculateArcFromThreePoints(
      state.startPoint,
      state.secondPoint,
      state.endPoint,
    );
    if (!arcData) return null;
    return createArcEntity(
      arcData.center,
      arcData.radius,
      arcData.startAngle,
      arcData.endAngle,
    );
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
 * 세 점으로부터 호의 중심, 반지름, 시작/끝 각도를 계산합니다.
 */
function calculateArcFromThreePoints(
  start: Point,
  second: Point,
  end: Point,
): {
  center: Point;
  radius: number;
  startAngle: number;
  endAngle: number;
} | null {
  // 두 선분의 수직 이등분선의 교차점으로 중심 계산
  const mid1 = { x: (start.x + second.x) / 2, y: (start.y + second.y) / 2 };
  const mid2 = { x: (second.x + end.x) / 2, y: (second.y + end.y) / 2 };

  const dx1 = second.x - start.x;
  const dy1 = second.y - start.y;
  const dx2 = end.x - second.x;
  const dy2 = end.y - second.y;

  // 수직 이등분선 방향
  const perp1 = { x: -dy1, y: dx1 };
  const perp2 = { x: -dy2, y: dx2 };

  // 외적이 0이면 세 점이 직선상에 있음
  const denom = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denom) < 1e-10) return null;

  //mid1 + t1 * perp1 = mid2 + t2 * perp2 를 풀어서 중심 계산
  const t =
    ((mid2.x - mid1.x) * perp2.y - (mid2.y - mid1.y) * perp2.x) /
    (perp1.x * perp2.y - perp1.y * perp2.x);

  const center = {
    x: mid1.x + t * perp1.x,
    y: mid1.y + t * perp1.y,
  };

  const radius = Math.hypot(start.x - center.x, start.y - center.y);
  if (radius < 1e-10) return null;

  // 시작/끝 각도 계산 (라디안 → 도)
  const startAngle =
    (Math.atan2(start.y - center.y, start.x - center.x) * 180) / Math.PI;
  const endAngle =
    (Math.atan2(end.y - center.y, end.x - center.x) * 180) / Math.PI;

  return { center, radius, startAngle, endAngle };
}

/**
 * ARC 엔티티 객체를 생성합니다.
 */
export function createArcEntity(
  center: Point,
  radius: number,
  startAngle: number,
  endAngle: number,
): ArcEntity {
  return {
    id: generateEntityId(),
    type: "ARC",
    center: { x: center.x, y: center.y },
    radius,
    startAngle,
    endAngle,
    layer: "0",
    color: "BYLAYER",
  };
}

/**
 * ARC 생성 문서 명령을 생성합니다.
 */
export function createCreateArcCommand(entity: ArcEntity): CreateEntityCommand {
  return {
    type: "CREATE_ENTITY",
    entityType: "ARC",
    entityId: entity.id,
    params: {
      center: entity.center,
      radius: entity.radius,
      startAngle: entity.startAngle,
      endAngle: entity.endAngle,
      layer: entity.layer,
      color: entity.color,
    },
  };
}

/**
 * 고유 엔티티 ID 생성
 */
function generateEntityId(): string {
  return `arc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * ARC 도구에서 사용할 수 있는 도구 모드를 반환합니다.
 */
export function getArcToolModes(): string[] {
  return ["3point"];
}
