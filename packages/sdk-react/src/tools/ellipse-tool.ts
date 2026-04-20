/**
 * ellipse-tool.ts
 * 타원(ELLIPSE) 그리기 도구
 *
 * 두 번의 클릭으로 타원을 생성합니다.
 * - 첫 번째 클릭: 중심점
 * - 두 번째 클릭: 장반축의 끝점 (단반축은 첫 번째 클릭에서 Shift로 결정)
 * - 부분 타원(타원호) 지원
 */

export interface Point {
  x: number;
  y: number;
}

export interface EllipseEntity {
  id: string;
  type: "ELLIPSE";
  center: Point;
  /** 장반축 끝점 (중심에서) */
  majorAxisEndpoint: Point;
  /** 단반축 비율 (0 < ratio <= 1) */
  minorAxisRatio: number;
  /** 시작 각도 (부분 타원, 도 단위) */
  startAngle?: number;
  /** 종료 각도 (부분 타원, 도 단위) */
  endAngle?: number;
  /** 회전각 (장반축의 회전, 도 단위) */
  rotation: number;
  layer: string;
  color: string;
}

export interface CreateEntityCommand {
  type: "CREATE_ENTITY";
  entityType: "ELLIPSE";
  entityId: string;
  params: {
    center: Point;
    majorAxisEndpoint: Point;
    minorAxisRatio: number;
    startAngle?: number;
    endAngle?: number;
    rotation: number;
    layer: string;
    color: string;
  };
}

export interface EllipseToolState {
  center: Point | null;
  majorAxisPoint: Point | null;
  isDrawing: boolean;
  isArcMode: boolean;
  minorAxisRatio: number;
  /** 연속 실행 모드 */
  continuousMode: boolean;
}

export interface EllipseToolOptions {
  onComplete?: (
    entity: EllipseEntity,
    command: CreateEntityCommand,
  ) => void;
  onPreview?: (entity: EllipseEntity) => void;
}

/**
 * ELLIPSE 도구 인스턴스를 생성합니다.
 */
export function createEllipseTool(options: EllipseToolOptions = {}) {
  const { onComplete, onPreview } = options;

  const state: EllipseToolState = {
    center: null,
    majorAxisPoint: null,
    isDrawing: false,
    isArcMode: false,
    minorAxisRatio: 0.5,
    continuousMode: true,
  };

  /**
   * 장반축 계산
   */
  function calculateMajorRadius(): number {
    if (!state.center || !state.majorAxisPoint) return 0;
    return Math.hypot(
      state.majorAxisPoint.x - state.center.x,
      state.majorAxisPoint.y - state.center.y,
    );
  }

  /**
   * 단반축 계산
   */
  function calculateMinorRadius(): number {
    return calculateMajorRadius() * state.minorAxisRatio;
  }

  /**
   * 장반축 각도 계산 (라디안)
   */
  function calculateMajorAngle(): number {
    if (!state.center || !state.majorAxisPoint) return 0;
    return Math.atan2(
      state.majorAxisPoint.y - state.center.y,
      state.majorAxisPoint.x - state.center.x,
    );
  }

  /**
   * 첫 번째 클릭: 중심점
   * 두 번째 클릭: 장반축 끝점
   * Shift+클릭: 단반축 비율 결정 (수직 거리로)
   */
  function handleClick(
    screenPoint: Point,
    modifiers?: { shift?: boolean; ctrl?: boolean },
  ): EllipseEntity | null {
    if (!state.isDrawing) {
      // First click: set center
      state.center = { ...screenPoint };
      state.majorAxisPoint = { ...screenPoint };
      state.isDrawing = true;

      if (onPreview) {
        onPreview(createEllipseEntity());
      }
      return null;
    } else {
      // Second click: set major axis endpoint
      state.majorAxisPoint = { ...screenPoint };

      // If shift is held, calculate minor axis ratio from vertical distance
      if (modifiers?.shift && state.center) {
        const majorRadius = calculateMajorRadius();
        const minorRadius = Math.abs(screenPoint.y - state.center.y);
        state.minorAxisRatio = majorRadius > 0 ? minorRadius / majorRadius : 0.5;
        state.minorAxisRatio = Math.max(0.1, Math.min(1.0, state.minorAxisRatio));
      }

      if (!state.center || !state.majorAxisPoint) return null;

      const majorRadius = calculateMajorRadius();
      if (majorRadius < 1) return null;

      const entity = createEllipseEntity();
      const command = createCreateEllipseCommand(entity);

      if (onComplete) {
        onComplete(entity, command);
      }

      const result = entity;

      // Continuous mode
      if (state.continuousMode) {
        state.center = { ...screenPoint };
        state.majorAxisPoint = { ...screenPoint };
        // Keep the same minor axis ratio for next ellipse
      } else {
        state.isDrawing = false;
        state.center = null;
        state.majorAxisPoint = null;
      }

      if (onPreview) {
        onPreview(createEllipseEntity());
      }

      return result;
    }
  }

  function handleMove(screenPoint: Point) {
    if (!state.isDrawing || !state.center) return;

    state.majorAxisPoint = { ...screenPoint };

    if (onPreview && state.center && state.majorAxisPoint) {
      onPreview(createEllipseEntity());
    }
  }

  function handleDoubleClick(): EllipseEntity | null {
    // Could switch to arc mode
    return null;
  }

  function cancel() {
    state.center = null;
    state.majorAxisPoint = null;
    state.isDrawing = false;
    state.continuousMode = false;
  }

  function setMinorAxisRatio(ratio: number) {
    state.minorAxisRatio = Math.max(0.1, Math.min(1.0, ratio));
  }

  function setArcMode(enabled: boolean) {
    state.isArcMode = enabled;
  }

  function setContinuousMode(enabled: boolean) {
    state.continuousMode = enabled;
  }

  function getState(): EllipseToolState {
    return { ...state };
  }

  function getPreviewEntity(): EllipseEntity | null {
    if (!state.center) return null;
    return createEllipseEntity();
  }

  /**
   * ELLIPSE 엔티티 생성
   */
  function createEllipseEntity(): EllipseEntity {
    const majorAngle = calculateMajorAngle();
    const rotation = (majorAngle * 180) / Math.PI;

    return {
      id: generateEntityId(),
      type: "ELLIPSE",
      center: { ...state.center! },
      majorAxisEndpoint: { ...state.majorAxisPoint! },
      minorAxisRatio: state.minorAxisRatio,
      rotation,
      layer: "0",
      color: "BYLAYER",
    };
  }

  return {
    handleClick,
    handleMove,
    handleDoubleClick,
    cancel,
    setMinorAxisRatio,
    setArcMode,
    setContinuousMode,
    getState,
    getPreviewEntity,
  };
}

/**
 * ELLIPSE 엔티티를 생성합니다.
 */
export function createEllipseEntityFromParams(
  center: Point,
  majorAxisEndpoint: Point,
  minorAxisRatio: number,
  rotation: number,
): EllipseEntity {
  return {
    id: generateEntityId(),
    type: "ELLIPSE",
    center: { ...center },
    majorAxisEndpoint: { ...majorAxisEndpoint },
    minorAxisRatio,
    rotation,
    layer: "0",
    color: "BYLAYER",
  };
}

/**
 * ELLIPSE 생성 문서 명령을 생성합니다.
 */
export function createCreateEllipseCommand(
  entity: EllipseEntity,
): CreateEntityCommand {
  return {
    type: "CREATE_ENTITY",
    entityType: "ELLIPSE",
    entityId: entity.id,
    params: {
      center: entity.center,
      majorAxisEndpoint: entity.majorAxisEndpoint,
      minorAxisRatio: entity.minorAxisRatio,
      startAngle: entity.startAngle,
      endAngle: entity.endAngle,
      rotation: entity.rotation,
      layer: entity.layer,
      color: entity.color,
    },
  };
}

/**
 * 고유 엔티티 ID 생성
 */
function generateEntityId(): string {
  return `ellipse-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * ELLIPSE 렌더링 유틸리티
 */
export function renderEllipse(
  ctx: CanvasRenderingContext2D,
  entity: EllipseEntity,
  viewport: { pan: Point; zoom: number; width: number; height: number },
): void {
  if (!entity.center || !entity.majorAxisEndpoint) return;

  const centerScreen = {
    x: (entity.center.x - viewport.pan.x) * viewport.zoom + viewport.width / 2,
    y: (entity.center.y - viewport.pan.y) * viewport.zoom + viewport.height / 2,
  };

  // Calculate major radius in screen coordinates
  const majorDx = entity.majorAxisEndpoint.x - entity.center.x;
  const majorDy = entity.majorAxisEndpoint.y - entity.center.y;
  const majorRadiusScreen = Math.hypot(majorDx, majorDy) * viewport.zoom;
  const minorRadiusScreen = majorRadiusScreen * entity.minorAxisRatio;

  // Rotation angle
  const rotationRad = (entity.rotation * Math.PI) / 180;

  ctx.save();
  ctx.translate(centerScreen.x, centerScreen.y);
  ctx.rotate(rotationRad);

  ctx.strokeStyle = entity.color ?? "#333333";
  ctx.lineWidth = (entity.lineWidth ?? 1) * viewport.zoom;
  ctx.beginPath();
  ctx.ellipse(0, 0, majorRadiusScreen, minorRadiusScreen, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}
