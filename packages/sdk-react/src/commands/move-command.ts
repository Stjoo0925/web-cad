/**
 * move-command.ts
 * 이동(MOVE) 명령 모듈
 *
 * 선택된 엔티티를 지정된 벡터만큼 이동합니다.
 * 상태: 'selecting' | 'base-point' | 'target-point'
 */

import type { Point, Entity } from "../tools/snap-engine.js";

export type MoveCommandState = "selecting" | "base-point" | "target-point";

export interface MoveCommandResult {
  type: "UPDATE_ENTITY";
  entityId: string;
  params: {
    start?: Point;
    end?: Point;
    position?: Point;
    vertices?: Point[];
    center?: Point;
  };
}

export interface MoveCommandOptions {
  onPreview?: (entities: Entity[], offset: Point) => void;
  onComplete?: (results: MoveCommandResult[]) => void;
  onCancel?: () => void;
}

export interface MoveCommand {
  getState: () => MoveCommandState;
  getSelection: () => Entity[];
  getBasePoint: () => Point | null;
  handleClick: (screenPoint: Point) => void;
  handleMove: (screenPoint: Point) => void;
  confirm: () => void;
  cancel: () => void;
  reset: () => void;
}

/**
 * MOVE 명령 인스턴스를 생성합니다.
 */
export function createMoveCommand(
  initialSelection: Entity[] = [],
  options: MoveCommandOptions = {},
): MoveCommand {
  const { onPreview, onComplete, onCancel } = options;

  let state: MoveCommandState =
    initialSelection.length > 0 ? "base-point" : "selecting";
  let selection: Entity[] = [...initialSelection];
  let basePoint: Point | null = null;
  let currentTarget: Point | null = null;

  function setState(newState: MoveCommandState) {
    state = newState;
  }

  function handleClick(screenPoint: Point) {
    switch (state) {
      case "selecting":
        // Entity selection is handled externally via initialSelection
        // When user clicks in this state, it means they're done selecting
        if (selection.length > 0) {
          basePoint = { ...screenPoint };
          setState("base-point");
        }
        break;

      case "base-point":
        basePoint = { ...screenPoint };
        setState("target-point");
        break;

      case "target-point":
        if (basePoint && currentTarget) {
          confirm();
        }
        break;
    }
  }

  function handleMove(screenPoint: Point) {
    switch (state) {
      case "base-point":
        currentTarget = { ...screenPoint };
        if (basePoint && onPreview && selection.length > 0) {
          const offset = {
            x: screenPoint.x - basePoint.x,
            y: screenPoint.y - basePoint.y,
          };
          onPreview(selection, offset);
        }
        break;

      case "target-point":
        currentTarget = { ...screenPoint };
        if (basePoint && onPreview && selection.length > 0) {
          const offset = {
            x: screenPoint.x - basePoint.x,
            y: screenPoint.y - basePoint.y,
          };
          onPreview(selection, offset);
        }
        break;
    }
  }

  function confirm() {
    if (!basePoint || !currentTarget || selection.length === 0) return;

    const offset = {
      x: currentTarget.x - basePoint.x,
      y: currentTarget.y - basePoint.y,
    };

    const results: MoveCommandResult[] = selection.map((entity) => {
      const params: MoveCommandResult["params"] = {};

      if (entity.start && entity.end) {
        params.start = {
          x: entity.start.x + offset.x,
          y: entity.start.y + offset.y,
        };
        params.end = { x: entity.end.x + offset.x, y: entity.end.y + offset.y };
      }
      if (entity.position) {
        params.position = {
          x: entity.position.x + offset.x,
          y: entity.position.y + offset.y,
        };
      }
      if (entity.center) {
        params.center = {
          x: entity.center.x + offset.x,
          y: entity.center.y + offset.y,
        };
      }
      if (entity.vertices) {
        params.vertices = entity.vertices.map((v) => ({
          x: v.x + offset.x,
          y: v.y + offset.y,
        }));
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
    basePoint = null;
    currentTarget = null;
    state = "selecting";
  }

  function getState(): MoveCommandState {
    return state;
  }

  function getSelection(): Entity[] {
    return [...selection];
  }

  function getBasePoint(): Point | null {
    return basePoint ? { ...basePoint } : null;
  }

  return {
    getState,
    getSelection,
    getBasePoint,
    handleClick,
    handleMove,
    confirm,
    cancel,
    reset,
  };
}

/**
 * 엔티티에 이동 변환을 적용합니다.
 */
export function applyMoveOffset(entity: Entity, offset: Point): Entity {
  const newEntity = { ...entity };

  if (newEntity.start && newEntity.end) {
    newEntity.start = {
      x: newEntity.start.x + offset.x,
      y: newEntity.start.y + offset.y,
    };
    newEntity.end = {
      x: newEntity.end.x + offset.x,
      y: newEntity.end.y + offset.y,
    };
  }
  if (newEntity.position) {
    newEntity.position = {
      x: newEntity.position.x + offset.x,
      y: newEntity.position.y + offset.y,
    };
  }
  if (newEntity.center) {
    newEntity.center = {
      x: newEntity.center.x + offset.x,
      y: newEntity.center.y + offset.y,
    };
  }
  if (newEntity.vertices) {
    newEntity.vertices = newEntity.vertices.map((v) => ({
      x: v.x + offset.x,
      y: v.y + offset.y,
    }));
  }

  return newEntity;
}
