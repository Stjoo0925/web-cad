/**
 * polyline-tool.ts
 * 폴리라인(POLYLINE) 그리기 도구 모듈
 *
 * 연속 클릭으로 버텍스를 추가하고, 완료 시 POLYLINE 엔티티를 생성합니다.
 * 더블클릭 또는 완료 버튼으로 폴리라인을 종료합니다.
 * 완료 시 onComplete 콜백과 CREATE_ENTITY 문서 명령을 생성합니다.
 */

export interface Point {
  x: number;
  y: number;
}

export interface PolylineEntity {
  id: string;
  type: "POLYLINE";
  vertices: Point[];
  closed: boolean;
  layer: string;
  color: string;
}

export interface CreateEntityCommand {
  type: "CREATE_ENTITY";
  entityType: "POLYLINE";
  entityId: string;
  params: {
    vertices: Point[];
    closed: boolean;
    layer: string;
    color: string;
  };
}

export interface PolylineToolState {
  vertices: Point[];
  isDrawing: boolean;
  closed: boolean;
}

export interface PolylineToolOptions {
  onComplete?: (entity: PolylineEntity, command: CreateEntityCommand) => void;
  onPreview?: (entity: PolylineEntity) => void;
  minVertices?: number;
}

/**
 * POLYLINE 도구 인스턴스를 생성합니다.
 */
export function createPolylineTool(options: PolylineToolOptions = {}) {
  const {
    onComplete,
    onPreview,
    minVertices = 2
  } = options;

  const state: PolylineToolState = {
    vertices: [],
    isDrawing: false,
    closed: false
  };

  function handleClick(screenPoint: Point): PolylineEntity | null {
    if (!state.isDrawing) {
      state.vertices = [{ ...screenPoint }];
      state.isDrawing = true;
      state.closed = false;

      notifyPreview();
      return null;
    }

    const lastVertex = state.vertices[state.vertices.length - 1];
    const dist = Math.hypot(screenPoint.x - lastVertex.x, screenPoint.y - lastVertex.y);

    if (dist < 2) return null;

    state.vertices.push({ ...screenPoint });
    notifyPreview();
    return null;
  }

  function handleDoubleClick(): PolylineEntity | null {
    if (!state.isDrawing || state.vertices.length < minVertices) {
      return null;
    }

    return finishPolyline(false);
  }

  function handleClose(): PolylineEntity | null {
    if (!state.isDrawing || state.vertices.length < minVertices) {
      return null;
    }

    return finishPolyline(true);
  }

  function finishPolyline(closed: boolean): PolylineEntity | null {
    const entity = createPolylineEntity(state.vertices, closed);
    const command = createCreatePolylineCommand(entity);

    if (onComplete) {
      onComplete(entity, command);
    }

    const result = entity;

    state.vertices = [];
    state.isDrawing = false;
    state.closed = false;

    return result;
  }

  function handleMove(screenPoint: Point) {
    if (!state.isDrawing || state.vertices.length === 0) return;
    notifyPreview();
  }

  function notifyPreview() {
    if (onPreview && state.vertices.length > 0) {
      onPreview(getPreviewEntity() as PolylineEntity);
    }
  }

  function cancel() {
    state.vertices = [];
    state.isDrawing = false;
    state.closed = false;
  }

  function getState(): PolylineToolState {
    return {
      vertices: [...state.vertices],
      isDrawing: state.isDrawing,
      closed: state.closed
    };
  }

  function getPreviewEntity(): PolylineEntity | null {
    if (state.vertices.length < 1) return null;
    return createPolylineEntity(state.vertices, state.closed);
  }

  function getVertexCount(): number {
    return state.vertices.length;
  }

  return {
    handleClick,
    handleDoubleClick,
    handleClose,
    handleMove,
    cancel,
    getState,
    getPreviewEntity,
    getVertexCount
  };
}

/**
 * POLYLINE 엔티티 객체를 생성합니다.
 */
export function createPolylineEntity(vertices: Point[], closed = false): PolylineEntity {
  return {
    id: generateEntityId(),
    type: "POLYLINE",
    vertices: vertices.map((v) => ({ x: v.x, y: v.y })),
    closed,
    layer: "0",
    color: "BYLAYER"
  };
}

/**
 * POLYLINE 생성 문서 명령을 생성합니다.
 */
export function createCreatePolylineCommand(entity: PolylineEntity): CreateEntityCommand {
  return {
    type: "CREATE_ENTITY",
    entityType: "POLYLINE",
    entityId: entity.id,
    params: {
      vertices: entity.vertices,
      closed: entity.closed,
      layer: entity.layer,
      color: entity.color
    }
  };
}

/**
 * 고유 엔티티 ID 생성
 */
function generateEntityId(): string {
  return `polyline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * POLYLINE 도구에서 사용할 수 있는 모드를 반환합니다.
 */
export function getPolylineToolModes(): string[] {
  return ["click", "close"];
}
