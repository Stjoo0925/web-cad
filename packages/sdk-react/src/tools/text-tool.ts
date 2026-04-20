/**
 * text-tool.ts
 * 텍스트(TEXT) 그리기 도구 모듈
 *
 * 클릭으로 위치를 지정하고, 입력창으로 텍스트 내용을 입력하여 TEXT 엔티티를 생성합니다.
 * 완료 시 onComplete 콜백과 CREATE_ENTITY 문서 명령을 생성합니다.
 */

import type { Point } from "./line-tool.js";

export interface TextEntity {
  id: string;
  type: "TEXT";
  position: Point;
  text: string;
  height: number;
  layer: string;
  color: string;
}

export interface CreateEntityCommand {
  type: "CREATE_ENTITY";
  entityType: "TEXT";
  entityId: string;
  params: {
    position: Point;
    text: string;
    height: number;
    layer: string;
    color: string;
  };
}

export interface TextToolState {
  position: Point | null;
  isDrawing: boolean;
  text: string;
}

export interface TextToolOptions {
  onComplete?: (entity: TextEntity, command: CreateEntityCommand) => void;
  onPreview?: (entity: TextEntity) => void;
}

/**
 * TEXT 도구 인스턴스를 생성합니다.
 */
export function createTextTool(options: TextToolOptions = {}) {
  const { onComplete, onPreview } = options;

  const state: TextToolState = {
    position: null,
    isDrawing: false,
    text: "",
  };

  function handleClick(screenPoint: Point): TextEntity | null {
    if (!state.isDrawing) {
      state.position = { ...screenPoint };
      state.isDrawing = true;
      state.text = "";
      return null;
    } else {
      // 이미 위치를 선택한 상태에서는 텍스트 입력을 기다림
      return null;
    }
  }

  function setText(text: string): TextEntity | null {
    if (!state.isDrawing || !state.position || !text.trim()) return null;

    state.text = text;
    state.isDrawing = false;

    const entity = createTextEntity(state.position, text.trim());
    const command = createCreateTextCommand(entity);

    if (onComplete) {
      onComplete(entity, command);
    }

    const result = entity;
    state.position = null;
    state.text = "";

    return result;
  }

  function handleMove(screenPoint: Point) {
    // 텍스트는 preview를 지원하지 않음
  }

  function cancel() {
    state.position = null;
    state.isDrawing = false;
    state.text = "";
  }

  function getState(): TextToolState {
    return { ...state };
  }

  function getPreviewEntity(): TextEntity | null {
    if (!state.position) return null;
    return createTextEntity(state.position, state.text || " ");
  }

  function isAwaitingTextInput(): boolean {
    return state.isDrawing && state.position !== null;
  }

  function getPosition(): Point | null {
    return state.position ? { ...state.position } : null;
  }

  return {
    handleClick,
    handleMove,
    setText,
    cancel,
    getState,
    getPreviewEntity,
    isAwaitingTextInput,
    getPosition,
  };
}

/**
 * TEXT 엔티티 객체를 생성합니다.
 */
export function createTextEntity(
  position: Point,
  text: string,
  height = 1,
): TextEntity {
  return {
    id: generateEntityId(),
    type: "TEXT",
    position: { x: position.x, y: position.y },
    text,
    height,
    layer: "0",
    color: "BYLAYER",
  };
}

/**
 * TEXT 생성 문서 명령을 생성합니다.
 */
export function createCreateTextCommand(
  entity: TextEntity,
): CreateEntityCommand {
  return {
    type: "CREATE_ENTITY",
    entityType: "TEXT",
    entityId: entity.id,
    params: {
      position: entity.position,
      text: entity.text,
      height: entity.height,
      layer: entity.layer,
      color: entity.color,
    },
  };
}

/**
 * 고유 엔티티 ID 생성
 */
function generateEntityId(): string {
  return `text-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * TEXT 도구에서 사용할 수 있는 도구 모드를 반환합니다.
 */
export function getTextToolModes(): string[] {
  return ["click-input"];
}
