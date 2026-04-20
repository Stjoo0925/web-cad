/**
 * copy-command.ts
 * 복사(COPY) 명령 모듈
 *
 * 선택된 엔티티를 지정된 기준점으로 복사합니다.
 * 상태: 'selecting' | 'base-point' | 'target-point'
 */

import type { Point, Entity } from "../tools/snap-engine.js";

export type CopyCommandState = "selecting" | "base-point" | "target-point";

export interface CopyCommandResult {
  type: "ADD_ENTITIES";
  entities: Entity[];
}

export interface CopyCommandOptions {
  onPreview?: (entities: Entity[], offset: Point) => void;
  onComplete?: (results: CopyCommandResult[]) => void;
  onCancel?: () => void;
}

export interface CopyCommand {
  getState: () => CopyCommandState;
  getSelection: () => Entity[];
  getBasePoint: () => Point | null;
  handleClick: (screenPoint: Point) => void;
  handleMove: (screenPoint: Point) => void;
  confirm: () => void;
  cancel: () => void;
  reset: () => void;
}

/**
 * 엔티티를 offset만큼 이동한 복사본을 생성합니다.
 */
function copyEntityWithOffset(entity: Entity, offset: Point): Entity {
  const newEntity = { ...entity, id: `${entity.id}_copy_${Date.now()}` };

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

/**
 * COPY 명령 인스턴스를 생성합니다.
 */
export function createCopyCommand(
  initialSelection: Entity[] = [],
  options: CopyCommandOptions = {},
): CopyCommand {
  const { onPreview, onComplete, onCancel } = options;

  let state: CopyCommandState =
    initialSelection.length > 0 ? "base-point" : "selecting";
  let selection: Entity[] = [...initialSelection];
  let basePoint: Point | null = null;
  let currentTarget: Point | null = null;

  function setState(newState: CopyCommandState) {
    state = newState;
  }

  function handleClick(screenPoint: Point) {
    switch (state) {
      case "selecting":
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

    const copiedEntities: Entity[] = selection.map((entity) =>
      copyEntityWithOffset(entity, offset),
    );

    const results: CopyCommandResult[] = [
      {
        type: "ADD_ENTITIES",
        entities: copiedEntities,
      },
    ];

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

  function getState(): CopyCommandState {
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
 * 엔티티에 복사(offset) 변환을 적용합니다.
 */
export function applyCopyOffset(entity: Entity, offset: Point): Entity {
  return copyEntityWithOffset(entity, offset);
}