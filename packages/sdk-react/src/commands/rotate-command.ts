/**
 * rotate-command.ts
 * 회전(ROTATE) 명령 모듈
 *
 * 선택된 엔티티를 지정된 중심점을 중심으로 회전합니다.
 * 상태: 'selecting' | 'base-point' | 'angle'
 */

import type { Point, Entity } from "../tools/snap-engine.js";

export type RotateCommandState = "selecting" | "base-point" | "angle";

export interface RotateCommandResult {
  type: "UPDATE_ENTITY";
  entityId: string;
  params: {
    start?: Point;
    end?: Point;
    position?: Point;
    vertices?: Point[];
    center?: Point;
    startAngle?: number;
    endAngle?: number;
  };
}

export interface RotateCommandOptions {
  onPreview?: (entities: Entity[], angle: number, center: Point) => void;
  onComplete?: (results: RotateCommandResult[]) => void;
  onCancel?: () => void;
}

export interface RotateCommand {
  getState: () => RotateCommandState;
  getSelection: () => Entity[];
  getCenter: () => Point | null;
  getAngle: () => number;
  handleClick: (screenPoint: Point) => void;
  handleMove: (screenPoint: Point) => void;
  confirm: () => void;
  cancel: () => void;
  reset: () => void;
}

/**
 * 2D 회전 변환 함수를 계산합니다.
 */
function rotatePoint(point: Point, center: Point, angle: number): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/**
 * 두 벡터 사이의 각도를 계산합니다.
 */
function calculateAngle(from: Point, to: Point): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/**
 * ROTATE 명령 인스턴스를 생성합니다.
 */
export function createRotateCommand(
  initialSelection: Entity[] = [],
  options: RotateCommandOptions = {},
): RotateCommand {
  const { onPreview, onComplete, onCancel } = options;

  let state: RotateCommandState =
    initialSelection.length > 0 ? "base-point" : "selecting";
  let selection: Entity[] = [...initialSelection];
  let center: Point | null = null;
  let referenceAngle = 0;
  let currentAngle = 0;

  function setState(newState: RotateCommandState) {
    state = newState;
  }

  function handleClick(screenPoint: Point) {
    switch (state) {
      case "selecting":
        if (selection.length > 0) {
          center = { ...screenPoint };
          setState("base-point");
        }
        break;

      case "base-point":
        center = { ...screenPoint };
        referenceAngle = 0;
        currentAngle = 0;
        setState("angle");
        break;

      case "angle":
        if (center) {
          confirm();
        }
        break;
    }
  }

  function handleMove(screenPoint: Point) {
    if (!center) return;

    switch (state) {
      case "base-point":
        if (onPreview && selection.length > 0) {
          const angle = calculateAngle(center, screenPoint) - referenceAngle;
          onPreview(selection, currentAngle, center);
        }
        break;

      case "angle":
        currentAngle = calculateAngle(center, screenPoint) - referenceAngle;
        if (onPreview && selection.length > 0) {
          onPreview(selection, currentAngle, center);
        }
        break;
    }
  }

  function confirm() {
    if (!center || selection.length === 0) return;

    const centerPoint = center; // 타입 좁히기: null 체크 후 Point 타입 보장
    const results: RotateCommandResult[] = selection.map((entity) => {
      const params: RotateCommandResult["params"] = {};

      if (entity.start && entity.end) {
        const rotatedStart = rotatePoint(entity.start, centerPoint, currentAngle);
        const rotatedEnd = rotatePoint(entity.end, centerPoint, currentAngle);
        params.start = rotatedStart;
        params.end = rotatedEnd;
      }
      if (entity.position) {
        const rotated = rotatePoint(entity.position, centerPoint, currentAngle);
        params.position = rotated;
      }
      if (entity.center) {
        const rotated = rotatePoint(entity.center, centerPoint, currentAngle);
        params.center = rotated;
      }
      if (entity.vertices) {
        params.vertices = entity.vertices.map((v) =>
          rotatePoint(v, centerPoint, currentAngle),
        );
      }
      if (entity.startAngle !== undefined && entity.endAngle !== undefined) {
        params.startAngle = entity.startAngle + currentAngle;
        params.endAngle = entity.endAngle + currentAngle;
      }

      return {
        type: "UPDATE_ENTITY",
        entityId: entity.id || "",
        params,
      };
    });

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
    center = null;
    referenceAngle = 0;
    currentAngle = 0;
    state = "selecting";
  }

  function getState(): RotateCommandState {
    return state;
  }

  function getSelection(): Entity[] {
    return [...selection];
  }

  function getCenter(): Point | null {
    return center ? { ...center } : null;
  }

  function getAngle(): number {
    return currentAngle;
  }

  return {
    getState,
    getSelection,
    getCenter,
    getAngle,
    handleClick,
    handleMove,
    confirm,
    cancel,
    reset,
  };
}

/**
 * 엔티티에 회전 변환을 적용합니다.
 */
export function applyRotateTransform(
  entity: Entity,
  angle: number,
  center: Point,
): Entity {
  const newEntity: Entity = { ...entity };

  function rotatePoint(point: Point): Point {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos,
    };
  }

  if (newEntity.start && newEntity.end) {
    newEntity.start = rotatePoint(newEntity.start);
    newEntity.end = rotatePoint(newEntity.end);
  }
  if (newEntity.position) {
    newEntity.position = rotatePoint(newEntity.position);
  }
  if (newEntity.center) {
    newEntity.center = rotatePoint(newEntity.center);
  }
  if (newEntity.vertices) {
    newEntity.vertices = newEntity.vertices.map(rotatePoint);
  }

  return newEntity;
}
