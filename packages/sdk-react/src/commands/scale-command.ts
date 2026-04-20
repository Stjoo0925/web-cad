/**
 * scale-command.ts
 * 스케일(SCALE) 명령 모듈
 *
 * 선택된 엔티티를 지정된 중심점에서 스케일링합니다.
 * 상태: 'selecting' | 'base-point' | 'factor'
 */

import type { Point, Entity } from "../tools/snap-engine.js";

export type ScaleCommandState = "selecting" | "base-point" | "factor";

export interface ScaleCommandResult {
  type: "UPDATE_ENTITY";
  entityId: string;
  params: {
    start?: Point;
    end?: Point;
    position?: Point;
    vertices?: Point[];
    center?: Point;
    radius?: number;
  };
}

export interface ScaleCommandOptions {
  onPreview?: (entities: Entity[], factor: number, center: Point) => void;
  onComplete?: (results: ScaleCommandResult[]) => void;
  onCancel?: () => void;
}

export interface ScaleCommand {
  getState: () => ScaleCommandState;
  getSelection: () => Entity[];
  getCenter: () => Point | null;
  getFactor: () => number;
  handleClick: (screenPoint: Point) => void;
  handleMove: (screenPoint: Point) => void;
  confirm: () => void;
  cancel: () => void;
  reset: () => void;
}

/**
 * 스케일 factor를 계산합니다 (현재 포인트와 기준점 사이의 거리 비율).
 */
function calculateScaleFactor(
  referencePoint: Point,
  currentPoint: Point,
  basePoint: Point,
): number {
  const referenceDist = Math.hypot(
    referencePoint.x - basePoint.x,
    referencePoint.y - basePoint.y,
  );
  const currentDist = Math.hypot(
    currentPoint.x - basePoint.x,
    currentPoint.y - basePoint.y,
  );

  if (referenceDist < 1e-10) return 1;
  return currentDist / referenceDist;
}

/**
 * SCALE 명령 인스턴스를 생성합니다.
 */
export function createScaleCommand(
  initialSelection: Entity[] = [],
  options: ScaleCommandOptions = {},
): ScaleCommand {
  const { onPreview, onComplete, onCancel } = options;

  let state: ScaleCommandState =
    initialSelection.length > 0 ? "base-point" : "selecting";
  let selection: Entity[] = [...initialSelection];
  let center: Point | null = null;
  let referencePoint: Point | null = null;
  let currentFactor = 1;

  function setState(newState: ScaleCommandState) {
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
        referencePoint = { ...screenPoint };
        currentFactor = 1;
        setState("factor");
        break;

      case "factor":
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
          onPreview(selection, 1, center);
        }
        break;

      case "factor":
        if (referencePoint) {
          currentFactor = calculateScaleFactor(
            referencePoint,
            screenPoint,
            center,
          );
          if (onPreview && selection.length > 0) {
            onPreview(selection, currentFactor, center);
          }
        }
        break;
    }
  }

  function confirm() {
    if (!center || selection.length === 0) return;

    const centerPoint = center; // 타입 좁히기: null 체크 후 Point 타입 보장
    const results: ScaleCommandResult[] = selection.map((entity) => {
      const params: ScaleCommandResult["params"] = {};

      if (entity.start && entity.end) {
        params.start = {
          x: centerPoint.x + (entity.start.x - centerPoint.x) * currentFactor,
          y: centerPoint.y + (entity.start.y - centerPoint.y) * currentFactor,
        };
        params.end = {
          x: centerPoint.x + (entity.end.x - centerPoint.x) * currentFactor,
          y: centerPoint.y + (entity.end.y - centerPoint.y) * currentFactor,
        };
      }
      if (entity.position) {
        params.position = {
          x: centerPoint.x + (entity.position.x - centerPoint.x) * currentFactor,
          y: centerPoint.y + (entity.position.y - centerPoint.y) * currentFactor,
        };
      }
      if (entity.center) {
        params.center = {
          x: centerPoint.x + (entity.center.x - centerPoint.x) * currentFactor,
          y: centerPoint.y + (entity.center.y - centerPoint.y) * currentFactor,
        };
      }
      if (entity.vertices) {
        params.vertices = entity.vertices.map((v) => ({
          x: centerPoint.x + (v.x - centerPoint.x) * currentFactor,
          y: centerPoint.y + (v.y - centerPoint.y) * currentFactor,
        }));
      }
      if (entity.radius !== undefined) {
        params.radius = entity.radius * currentFactor;
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
    referencePoint = null;
    currentFactor = 1;
    state = "selecting";
  }

  function getState(): ScaleCommandState {
    return state;
  }

  function getSelection(): Entity[] {
    return [...selection];
  }

  function getCenter(): Point | null {
    return center ? { ...center } : null;
  }

  function getFactor(): number {
    return currentFactor;
  }

  return {
    getState,
    getSelection,
    getCenter,
    getFactor,
    handleClick,
    handleMove,
    confirm,
    cancel,
    reset,
  };
}

/**
 * 엔티티에 스케일 변환을 적용합니다.
 */
export function applyScaleTransform(
  entity: Entity,
  factor: number,
  center: Point,
): Entity {
  const newEntity = { ...entity };

  function scalePoint(point: Point): Point {
    return {
      x: center.x + (point.x - center.x) * factor,
      y: center.y + (point.y - center.y) * factor,
    };
  }

  if (newEntity.start && newEntity.end) {
    newEntity.start = scalePoint(newEntity.start);
    newEntity.end = scalePoint(newEntity.end);
  }
  if (newEntity.position) {
    newEntity.position = scalePoint(newEntity.position);
  }
  if (newEntity.center) {
    newEntity.center = scalePoint(newEntity.center);
  }
  if (newEntity.vertices) {
    newEntity.vertices = newEntity.vertices.map(scalePoint);
  }
  if (newEntity.radius !== undefined) {
    newEntity.radius = newEntity.radius * factor;
  }

  return newEntity;
}
