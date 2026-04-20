/**
 * mtext-tool.ts
 * Multiline Text (MTEXT) 그리기 도구
 *
 * 박스 지정 방식으로 다중 행 텍스트를 생성합니다.
 * 지원:
 * - 여러 행 텍스트
 * - 정렬 옵션 (Left, Center, Right, Fit)
 * - 높이, 폭, 회전각 설정
 * - 폰트 스타일
 */

export interface Point {
  x: number;
  y: number;
}

export type TextAlignment =
  | "left"
  | "center"
  | "right"
  | "fit";

export interface MTextEntity {
  id: string;
  type: "MTEXT";
  /** 텍스트 내용 */
  text: string;
  /** 기준점 위치 */
  position: Point;
  /** 텍스트 높이 */
  height: number;
  /** 박스 폭 (폭 지정 모드) */
  width: number;
  /** 회전각 (도) */
  rotation: number;
  /** 텍스트 정렬 */
  alignment: TextAlignment;
  /** 줄 간격 배율 */
  lineSpacing: number;
  layer: string;
  color: string;
}

export interface CreateEntityCommand {
  type: "CREATE_ENTITY";
  entityType: "MTEXT";
  entityId: string;
  params: {
    text: string;
    position: Point;
    height: number;
    width: number;
    rotation: number;
    alignment: TextAlignment;
    lineSpacing: number;
    layer: string;
    color: string;
  };
}

export interface MTextToolState {
  /** 첫 번째 클릭 위치 */
  corner1: Point | null;
  /** 두 번째 클릭 위치 (박스 크기 결정) */
  corner2: Point | null;
  isDrawing: boolean;
  isTextInputMode: boolean;
  /** 입력 중인 텍스트 */
  text: string;
  /** 텍스트 높이 */
  height: number;
  /** 회전각 */
  rotation: number;
  /** 정렬 */
  alignment: TextAlignment;
  /** 줄 간격 */
  lineSpacing: number;
  /** 폭 */
  width: number;
}

export interface MTextToolOptions {
  onComplete?: (entity: MTextEntity, command: CreateEntityCommand) => void;
  onPreview?: (entity: MTextEntity) => void;
  defaultHeight?: number;
  defaultAlignment?: TextAlignment;
}

/**
 * MTEXT 도구 인스턴스를 생성합니다.
 */
export function createMTextTool(options: MTextToolOptions = {}) {
  const {
    onComplete,
    onPreview,
    defaultHeight = 1,
    defaultAlignment = "left",
  } = options;

  const state: MTextToolState = {
    corner1: null,
    corner2: null,
    isDrawing: false,
    isTextInputMode: false,
    text: "",
    height: defaultHeight,
    rotation: 0,
    alignment: defaultAlignment,
    lineSpacing: 1.0,
    width: 0,
  };

  /**
   * 박스 너비를 계산
   */
  function calculateWidth(): number {
    if (!state.corner1 || !state.corner2) return 0;
    return Math.abs(state.corner2.x - state.corner1.x);
  }

  /**
   * 박스 높이 계산
   */
  function calculateBoxHeight(): number {
    if (!state.corner1 || !state.corner2) return 0;
    return Math.abs(state.corner2.y - state.corner1.y);
  }

  /**
   * 첫 번째 클릭: 박스 첫 번째 모서리
   */
  function handleClick(screenPoint: Point): MTextEntity | null {
    if (!state.isDrawing) {
      // Start drawing box
      state.corner1 = { ...screenPoint };
      state.corner2 = { ...screenPoint };
      state.isDrawing = true;
      state.text = "";

      if (onPreview) {
        onPreview(createMTextEntity());
      }
      return null;
    } else if (state.isTextInputMode) {
      // 텍스트 입력 모드에서 클릭 - 입력 완료 처리
      return null;
    } else {
      // Complete box and enter text input mode
      state.corner2 = { ...screenPoint };
      state.isTextInputMode = true;
      state.width = calculateWidth();

      if (onPreview) {
        onPreview(createMTextEntity());
      }
      return null;
    }
  }

  /**
   * 마우스 이동: 박스 미리보기
   */
  function handleMove(screenPoint: Point) {
    if (!state.isDrawing || !state.corner1) return;

    state.corner2 = { ...screenPoint };

    if (onPreview && !state.isTextInputMode) {
      onPreview(createMTextEntity());
    }
  }

  /**
   * 텍스트 설정 (외부 입력창에서 호출)
   */
  function setText(text: string): MTextEntity | null {
    if (!state.isTextInputMode || !state.corner1 || !text.trim()) {
      return null;
    }

    state.text = text;
    state.isTextInputMode = false;
    state.isDrawing = false;

    const entity = createMTextEntity();
    const command = createCreateMTextCommand(entity);

    if (onComplete) {
      onComplete(entity, command);
    }

    const result = entity;

    // Reset for next use
    reset();

    return result;
  }

  /**
   * 텍스트 입력 완료 (Enter로 직접 호출)
   */
  function completeTextInput(): MTextEntity | null {
    if (!state.isTextInputMode || !state.corner1) {
      return null;
    }

    state.isTextInputMode = false;
    state.isDrawing = false;

    if (!state.text.trim()) {
      reset();
      return null;
    }

    const entity = createMTextEntity();
    const command = createCreateMTextCommand(entity);

    if (onComplete) {
      onComplete(entity, command);
    }

    const result = entity;

    // Reset for next use
    reset();

    return result;
  }

  /**
   * 텍스트에 줄바꿈 추가
   */
  function appendText(newText: string) {
    if (state.text.length > 0 && !state.text.endsWith("\n")) {
      state.text += "\n";
    }
    state.text += newText;
  }

  /**
   * 취소
   */
  function cancel() {
    reset();
  }

  /**
   * 상태 초기화
   */
  function reset() {
    state.corner1 = null;
    state.corner2 = null;
    state.isDrawing = false;
    state.isTextInputMode = false;
    state.text = "";
  }

  /**
   * 설정
   */
  function setHeight(height: number) {
    state.height = Math.max(0.1, height);
  }

  function setRotation(rotation: number) {
    state.rotation = rotation % 360;
  }

  function setAlignment(alignment: TextAlignment) {
    state.alignment = alignment;
  }

  function setLineSpacing(spacing: number) {
    state.lineSpacing = Math.max(0.5, Math.min(3.0, spacing));
  }

  /**
   * 현재 상태 조회
   */
  function getState(): MTextToolState {
    return { ...state };
  }

  function isAwaitingTextInput(): boolean {
    return state.isTextInputMode;
  }

  function getCorner1(): Point | null {
    return state.corner1 ? { ...state.corner1 } : null;
  }

  function getCorner2(): Point | null {
    return state.corner2 ? { ...state.corner2 } : null;
  }

  function getText(): string {
    return state.text;
  }

  function getPreviewEntity(): MTextEntity | null {
    if (!state.corner1) return null;
    return createMTextEntity();
  }

  /**
   * MTEXT 엔티티 생성
   */
  function createMTextEntity(): MTextEntity {
    return {
      id: generateEntityId(),
      type: "MTEXT",
      text: state.text || " ",
      position: { ...state.corner1! },
      height: state.height,
      width: state.width,
      rotation: state.rotation,
      alignment: state.alignment,
      lineSpacing: state.lineSpacing,
      layer: "0",
      color: "BYLAYER",
    };
  }

  return {
    handleClick,
    handleMove,
    setText,
    completeTextInput,
    appendText,
    cancel,
    reset,
    setHeight,
    setRotation,
    setAlignment,
    setLineSpacing,
    getState,
    isAwaitingTextInput,
    getCorner1,
    getCorner2,
    getText,
    getPreviewEntity,
  };
}

/**
 * MTEXT 엔티티를 생성합니다.
 */
export function createMTextEntityFromParams(
  text: string,
  position: Point,
  height: number,
  width: number,
  rotation: number,
  alignment: TextAlignment,
  lineSpacing: number,
): MTextEntity {
  return {
    id: generateEntityId(),
    type: "MTEXT",
    text,
    position: { ...position },
    height,
    width,
    rotation,
    alignment,
    lineSpacing,
    layer: "0",
    color: "BYLAYER",
  };
}

/**
 * MTEXT 생성 문서 명령을 생성합니다.
 */
export function createCreateMTextCommand(
  entity: MTextEntity,
): CreateEntityCommand {
  return {
    type: "CREATE_ENTITY",
    entityType: "MTEXT",
    entityId: entity.id,
    params: {
      text: entity.text,
      position: entity.position,
      height: entity.height,
      width: entity.width,
      rotation: entity.rotation,
      alignment: entity.alignment,
      lineSpacing: entity.lineSpacing,
      layer: entity.layer,
      color: entity.color,
    },
  };
}

/**
 * 고유 엔티티 ID 생성
 */
function generateEntityId(): string {
  return `mtext-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * MTEXT 렌더링 유틸리티
 */
export function renderMText(
  ctx: CanvasRenderingContext2D,
  entity: MTextEntity,
  viewport: { pan: Point; zoom: number },
): void {
  if (!entity.text) return;

  const screenX = (entity.position.x - viewport.pan.x) * viewport.zoom;
  const screenY = (entity.position.y - viewport.pan.y) * viewport.zoom;
  const fontSize = entity.height * viewport.zoom;

  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = entity.color ?? "#333333";
  ctx.textBaseline = "top";

  const lines = entity.text.split("\n");
  const lineHeight = fontSize * entity.lineSpacing;

  // Calculate box dimensions for alignment
  let maxLineWidth = 0;
  for (const line of lines) {
    const metrics = ctx.measureText(line);
    maxLineWidth = Math.max(maxLineWidth, metrics.width);
  }

  // Calculate starting X based on alignment
  let startX = screenX;
  const boxWidth = entity.width * viewport.zoom;

  switch (entity.alignment) {
    case "center":
      startX = screenX - maxLineWidth / 2;
      break;
    case "right":
      startX = screenX - maxLineWidth;
      break;
    case "fit":
      // Fit uses the box width to determine character spacing
      if (lines.length === 1 && maxLineWidth > 0) {
        const scale = boxWidth / maxLineWidth;
        ctx.scale(scale, 1);
        startX = screenX;
      }
      break;
    case "left":
    default:
      startX = screenX;
      break;
  }

  // Render each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const y = screenY + i * lineHeight;

    ctx.save();
    if (entity.rotation !== 0) {
      ctx.translate(screenX, y);
      ctx.rotate((entity.rotation * Math.PI) / 180);
      ctx.translate(-screenX, -y);
    }
    ctx.fillText(line, startX, y);
    ctx.restore();
  }
}
