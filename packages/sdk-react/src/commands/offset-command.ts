/**
 * offset-command.ts
 * 평행 이동(OFFSET) 명령 모듈
 *
 * 선택한 엔티티의 평행선을 생성합니다.
 * 상태: 'selecting' | 'distance' | 'specifying'
 * 지원: LINE, CIRCLE
 */

import type { Point, Entity } from "../tools/snap-engine.js";

export type OffsetCommandState = "selecting" | "distance" | "specifying";

export interface OffsetCommandResult {
  type: "ADD_ENTITIES";
  entities: Entity[];
}

export interface OffsetCommandOptions {
  onPreview?: (entities: Entity[], distance: number) => void;
  onComplete?: (results: OffsetCommandResult[]) => void;
  onCancel?: () => void;
}

export interface OffsetCommand {
  getState: () => OffsetCommandState;
  getSelection: () => Entity[];
  getDistance: () => number;
  handleClick: (screenPoint: Point) => void;
  handleMove: (screenPoint: Point) => void;
  confirm: () => void;
  cancel: () => void;
  reset: () => void;
}

/**
 * 점에서 직선까지의 거리를 계산합니다.
 */
function pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-10) return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
  return Math.abs((dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / len);
}

/**
 * 평행선을 생성합니다.
 */
function offsetLine(entity: Entity, distance: number, side: number): Entity | null {
  if (entity.type !== "LINE" || !entity.start || !entity.end) return null;

  const dx = entity.end.x - entity.start.x;
  const dy = entity.end.y - entity.start.y;
  const len = Math.hypot(dx, dy);

  if (len < 1e-10) return null;

  // 법선 벡터 계산 (수직 방향)
  const nx = (-dy / len) * distance * side;
  const ny = (dx / len) * distance * side;

  const newEntity: Entity = {
    ...entity,
    id: `${entity.id}_offset_${Date.now()}`,
    start: {
      x: entity.start.x + nx,
      y: entity.start.y + ny,
    },
    end: {
      x: entity.end.x + nx,
      y: entity.end.y + ny,
    },
  };

  return newEntity;
}

/**
 * 원의 평행선 생성 (현재는 동일 중심의 반지름 변경된 원 반환)
 */
function offsetCircle(entity: Entity, distance: number): Entity | null {
  if (entity.type !== "CIRCLE" || !entity.center || entity.radius === undefined) return null;

  const newEntity: Entity = {
    ...entity,
    id: `${entity.id}_offset_${Date.now()}`,
    radius: entity.radius + distance,
  };

  return newEntity;
}

/**
 * OFFSET 명령 인스턴스를 생성합니다.
 */
export function createOffsetCommand(
  initialSelection: Entity[] = [],
  options: OffsetCommandOptions = {},
): OffsetCommand {
  const { onPreview, onComplete, onCancel } = options;

  let state: OffsetCommandState =
    initialSelection.length > 0 ? "distance" : "selecting";
  let selection: Entity[] = [...initialSelection];
  let distance = 0;
  let referencePoint: Point | null = null;
  let currentPoint: Point | null = null;

  function setState(newState: OffsetCommandState) {
    state = newState;
  }

  function handleClick(screenPoint: Point) {
    switch (state) {
      case "selecting":
        if (selection.length > 0) {
          setState("distance");
        }
        break;

      case "distance":
        distance = Math.hypot(
          screenPoint.x - (referencePoint?.x || 0),
          screenPoint.y - (referencePoint?.y || 0),
        );
        if (distance > 0) {
          setState("specifying");
          confirm();
        }
        break;

      case "specifying":
        if (distance > 0) {
          confirm();
        }
        break;
    }
  }

  function handleMove(screenPoint: Point) {
    switch (state) {
      case "distance":
        referencePoint = { ...screenPoint };
        if (selection.length > 0) {
          distance = Math.abs(currentPoint
            ? pointToLineDistance(currentPoint, selection[0].start || { x: 0, y: 0 }, selection[0].end || { x: 0, y: 0 })
            : 0);
          if (onPreview && selection.length > 0) {
            onPreview(selection, distance);
          }
        }
        currentPoint = { ...screenPoint };
        break;

      case "specifying":
        currentPoint = { ...screenPoint };
        if (onPreview && selection.length > 0) {
          onPreview(selection, distance);
        }
        break;
    }
  }

  function confirm() {
    if (selection.length === 0 || distance <= 0) return;

    // 현재 마우스 위치가 엔티티 기준 어느 쪽에 있는지 판단
    let side = 1;
    if (currentPoint && selection[0].start && selection[0].end) {
      const dist = pointToLineDistance(
        currentPoint,
        selection[0].start,
        selection[0].end,
      );
      // 기준점이 어느 쪽에 있는지에 따른 방향 결정
      const midX = (selection[0].start.x + selection[0].end.x) / 2;
      const midY = (selection[0].start.y + selection[0].end.y) / 2;
      const toRefX = (referencePoint?.x || 0) - midX;
      const toRefY = (referencePoint?.y || 0) - midY;
      const toCurX = currentPoint.x - midX;
      const toCurY = currentPoint.y - midY;
      const cross = toRefX * toCurY - toRefY * toCurX;
      side = cross >= 0 ? 1 : -1;
    }

    const results: OffsetCommandResult[] = [];
    const offsetEntities: Entity[] = [];

    for (const entity of selection) {
      if (entity.type === "LINE") {
        const offsetEntity = offsetLine(entity, distance, side);
        if (offsetEntity) {
          offsetEntities.push(offsetEntity);
        }
      } else if (entity.type === "CIRCLE") {
        const offsetEntity = offsetCircle(entity, distance);
        if (offsetEntity) {
          offsetEntities.push(offsetEntity);
        }
      }
    }

    if (offsetEntities.length > 0) {
      results.push({
        type: "ADD_ENTITIES",
        entities: offsetEntities,
      });
    }

    if (onComplete) {
      onComplete(results);
    }

    reset();
  }

  function cancel() {
    if (onCancel) {
      onCancel();
    }
    reset();
  }

  function reset() {
    selection = [];
    distance = 0;
    referencePoint = null;
    currentPoint = null;
    state = "selecting";
  }

  function getState(): OffsetCommandState {
    return state;
  }

  function getSelection(): Entity[] {
    return [...selection];
  }

  function getDistance(): number {
    return distance;
  }

  return {
    getState,
    getSelection,
    getDistance,
    handleClick,
    handleMove,
    confirm,
    cancel,
    reset,
  };
}

/**
 * 엔티티에 offset 변환을 적용합니다.
 */
export function applyOffsetTransform(
  entity: Entity,
  distance: number,
  side: number,
): Entity | null {
  if (entity.type === "LINE") {
    return offsetLine(entity, distance, side);
  } else if (entity.type === "CIRCLE") {
    return offsetCircle(entity, distance);
  }
  return null;
}