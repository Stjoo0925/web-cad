/**
 * line-tool.ts
 * 선(LINE) 그리기 도구 모듈
 *
 * 클릭 두 번으로 시작점/끝점을 지정하여 LINE 엔티티를 생성합니다.
 * 완료 시 onComplete 콜백과 CREATE_ENTITY 문서 명령을 생성합니다.
 */

export interface Point {
  x: number;
  y: number;
}

export interface LineEntity {
  id: string;
  type: "LINE";
  start: Point;
  end: Point;
  layer: string;
  color: string;
}

export interface CreateEntityCommand {
  type: "CREATE_ENTITY";
  entityType: "LINE";
  entityId: string;
  params: {
    start: Point;
    end: Point;
    layer: string;
    color: string;
  };
}

export interface LineToolState {
  startPoint: Point | null;
  endPoint: Point | null;
  isDrawing: boolean;
}

export interface LineToolOptions {
  onComplete?: (entity: LineEntity, command: CreateEntityCommand) => void;
  onPreview?: (entity: LineEntity) => void;
}

/**
 * LINE 도구 인스턴스를 생성합니다.
 */
export function createLineTool(options: LineToolOptions = {}) {
  const { onComplete, onPreview } = options;

  const state: LineToolState = {
    startPoint: null,
    endPoint: null,
    isDrawing: false
  };

  function handleClick(screenPoint: Point): LineEntity | null {
    if (!state.isDrawing) {
      state.startPoint = { ...screenPoint };
      state.endPoint = { ...screenPoint };
      state.isDrawing = true;

      if (onPreview && state.startPoint && state.endPoint) {
        onPreview(createLineEntity(state.startPoint, state.endPoint));
      }
      return null;
    } else {
      state.endPoint = { ...screenPoint };
      state.isDrawing = false;

      if (!state.startPoint || !state.endPoint) return null;

      const entity = createLineEntity(state.startPoint, state.endPoint);
      const command = createCreateLineCommand(entity);

      if (onComplete) {
        onComplete(entity, command);
      }

      const result = entity;
      state.startPoint = null;
      state.endPoint = null;

      return result;
    }
  }

  function handleMove(screenPoint: Point) {
    if (!state.isDrawing || !state.startPoint) return;

    state.endPoint = { ...screenPoint };

    if (onPreview && state.startPoint && state.endPoint) {
      onPreview(createLineEntity(state.startPoint, state.endPoint));
    }
  }

  function cancel() {
    state.startPoint = null;
    state.endPoint = null;
    state.isDrawing = false;
  }

  function getState(): LineToolState {
    return { ...state };
  }

  function getPreviewEntity(): LineEntity | null {
    if (!state.startPoint || !state.endPoint) return null;
    return createLineEntity(state.startPoint, state.endPoint);
  }

  return {
    handleClick,
    handleMove,
    cancel,
    getState,
    getPreviewEntity
  };
}

/**
 * LINE 엔티티 객체를 생성합니다.
 */
export function createLineEntity(start: Point, end: Point): LineEntity {
  return {
    id: generateEntityId(),
    type: "LINE",
    start: { x: start.x, y: start.y },
    end: { x: end.x, y: end.y },
    layer: "0",
    color: "BYLAYER"
  };
}

/**
 * LINE 생성 문서 명령을 생성합니다.
 */
export function createCreateLineCommand(entity: LineEntity): CreateEntityCommand {
  return {
    type: "CREATE_ENTITY",
    entityType: "LINE",
    entityId: entity.id,
    params: {
      start: entity.start,
      end: entity.end,
      layer: entity.layer,
      color: entity.color
    }
  };
}

/**
 * 고유 엔티티 ID 생성
 */
function generateEntityId(): string {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * LINE 도구에서 사용할 수 있는 도구 모드를 반환합니다.
 */
export function getLineToolModes(): string[] {
  return ["click", "direct"];
}
