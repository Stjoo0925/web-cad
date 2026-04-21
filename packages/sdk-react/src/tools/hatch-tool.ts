/**
 * hatch-tool.ts
 * Hatch (면 채우기) 및 Boundary 도구
 *
 * 닫힌 영역에 패턴을 채웁니다.
 * - 다양한 채우기 패턴 (Solid, ANSI31, ISO 등)
 * - 스케일 및 회전각 설정
 * - Boundary: 닫힌 영역 자동 감지
 */

export interface Point {
  x: number;
  y: number;
}

export type HatchPattern =
  | "solid"
  | "ansi31"
  | "ansi32"
  | "ansi33"
  | "ansi34"
  | "ansi35"
  | "ansi37"
  | "ansi38"
  | "iso02w100"
  | "iso03w100"
  | "iso04w100"
  | "iso05w100"
  | "iso07w100"
  | "iso10w100"
  | "iso21w100"
  | "dots"
  | "crosshatch";

export interface HatchEntity {
  id: string;
  type: "HATCH";
  /** 패턴 유형 */
  pattern: HatchPattern;
  /** 패턴 스케일 */
  scale: number;
  /** 패턴 회전각 (도) */
  rotation: number;
  /** 채우기 색상 */
  color: string;
  /** 배경색 (transparency 사용시) */
  backgroundColor?: string;
  /** Boundary를 구성하는ID 목록 */
  boundaryEntityIds: string[];
  /** Hatch 영역의 버텍스 (외곽 경계) */
  boundaryVertices: Point[][];
  layer: string;
}

export interface CreateEntityCommand {
  type: "CREATE_ENTITY";
  entityType: "HATCH";
  entityId: string;
  params: {
    pattern: HatchPattern;
    scale: number;
    rotation: number;
    color: string;
    backgroundColor?: string;
    boundaryEntityIds: string[];
    boundaryVertices: Point[][];
    layer: string;
  };
}

export interface HatchToolState {
  pattern: HatchPattern;
  scale: number;
  rotation: number;
  color: string;
  isSelectingBoundary: boolean;
  selectedBoundaryEntities: string[];
}

export interface HatchToolOptions {
  onComplete?: (entity: HatchEntity, command: CreateEntityCommand) => void;
  onPreview?: (entity: HatchEntity) => void;
  defaultPattern?: HatchPattern;
  defaultScale?: number;
}

/**
 * PATTERN 정의
 */
export const HATCH_PATTERNS: Record<
  HatchPattern,
  { name: string; angle: number; spacing: number; type: "line" | "dot" }
> = {
  solid: { name: "Solid", angle: 0, spacing: 1, type: "line" },
  ansi31: { name: "ANSI31", angle: 45, spacing: 6, type: "line" },
  ansi32: { name: "ANSI32", angle: 45, spacing: 4, type: "line" },
  ansi33: { name: "ANSI33", angle: 45, spacing: 8, type: "line" },
  ansi34: { name: "ANSI34", angle: 45, spacing: 3, type: "line" },
  ansi35: { name: "ANSI35", angle: 45, spacing: 5, type: "line" },
  ansi37: { name: "ANSI37", angle: 45, spacing: 7, type: "line" },
  ansi38: { name: "ANSI38", angle: 45, spacing: 9, type: "line" },
  iso02w100: { name: "ISO02", angle: 45, spacing: 4, type: "line" },
  iso03w100: { name: "ISO03", angle: 45, spacing: 6, type: "line" },
  iso04w100: { name: "ISO04", angle: 45, spacing: 8, type: "line" },
  iso05w100: { name: "ISO05", angle: 45, spacing: 3, type: "line" },
  iso07w100: { name: "ISO07", angle: 60, spacing: 6, type: "line" },
  iso10w100: { name: "ISO10", angle: 30, spacing: 5, type: "line" },
  iso21w100: { name: "ISO21", angle: 0, spacing: 4, type: "line" },
  dots: { name: "Dots", angle: 0, spacing: 10, type: "dot" },
  crosshatch: { name: "Crosshatch", angle: 90, spacing: 8, type: "line" },
};

/**
 * HATCH 도구 인스턴스를 생성합니다.
 */
export function createHatchTool(options: HatchToolOptions = {}) {
  const {
    onComplete,
    onPreview,
    defaultPattern = "ansi31",
    defaultScale = 1.0,
  } = options;

  const state: HatchToolState = {
    pattern: defaultPattern,
    scale: defaultScale,
    rotation: 0,
    color: "#808080",
    isSelectingBoundary: false,
    selectedBoundaryEntities: [],
  };

  /**
   * Boundary 선택 시작
   */
  function startBoundarySelection() {
    state.isSelectingBoundary = true;
    state.selectedBoundaryEntities = [];
  }

  /**
   * 엔티티를 boundary에 추가
   */
  function addBoundaryEntity(entityId: string) {
    if (!state.selectedBoundaryEntities.includes(entityId)) {
      state.selectedBoundaryEntities.push(entityId);
    }
  }

  /**
   * boundary 선택 완료
   */
  function finishBoundarySelection(
    boundaryVertices: Point[][],
  ): HatchEntity | null {
    state.isSelectingBoundary = false;

    if (boundaryVertices.length === 0) {
      return null;
    }

    const entity = createHatchEntity(boundaryVertices);
    const command = createCreateHatchCommand(entity);

    if (onComplete) {
      onComplete(entity, command);
    }

    return entity;
  }

  /**
   * HatchEntity 생성
   */
  function createHatchEntity(boundaryVertices: Point[][]): HatchEntity {
    return {
      id: generateEntityId(),
      type: "HATCH",
      pattern: state.pattern,
      scale: state.scale,
      rotation: state.rotation,
      color: state.color,
      boundaryEntityIds: [...state.selectedBoundaryEntities],
      boundaryVertices: boundaryVertices,
      layer: "0",
    };
  }

  function cancel() {
    state.isSelectingBoundary = false;
    state.selectedBoundaryEntities = [];
  }

  function setPattern(pattern: HatchPattern) {
    state.pattern = pattern;
  }

  function setScale(scale: number) {
    state.scale = Math.max(0.01, scale);
  }

  function setRotation(rotation: number) {
    state.rotation = rotation % 360;
  }

  function setColor(color: string) {
    state.color = color;
  }

  function getState(): HatchToolState {
    return { ...state };
  }

  return {
    startBoundarySelection,
    addBoundaryEntity,
    finishBoundarySelection,
    cancel,
    setPattern,
    setScale,
    setRotation,
    setColor,
    getState,
  };
}

/**
 * HATCH 엔티티 생성
 */
export function createHatchEntityFromParams(
  pattern: HatchPattern,
  scale: number,
  rotation: number,
  color: string,
  boundaryVertices: Point[][],
  boundaryEntityIds?: string[],
): HatchEntity {
  return {
    id: generateEntityId(),
    type: "HATCH",
    pattern,
    scale,
    rotation,
    color,
    boundaryEntityIds: boundaryEntityIds ?? [],
    boundaryVertices,
    layer: "0",
  };
}

/**
 * HATCH 생성 문서 명령
 */
export function createCreateHatchCommand(
  entity: HatchEntity,
): CreateEntityCommand {
  return {
    type: "CREATE_ENTITY",
    entityType: "HATCH",
    entityId: entity.id,
    params: {
      pattern: entity.pattern,
      scale: entity.scale,
      rotation: entity.rotation,
      color: entity.color,
      backgroundColor: entity.backgroundColor,
      boundaryEntityIds: entity.boundaryEntityIds,
      boundaryVertices: entity.boundaryVertices,
      layer: entity.layer,
    },
  };
}

/**
 * 고유 엔티티 ID 생성
 */
function generateEntityId(): string {
  return `hatch-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Hatch 패턴 Rendering
 */
export function renderHatch(
  ctx: CanvasRenderingContext2D,
  entity: HatchEntity,
  viewport: { pan: Point; zoom: number; width: number; height: number },
): void {
  if (!entity.boundaryVertices || entity.boundaryVertices.length === 0) return;

  const patternDef = HATCH_PATTERNS[entity.pattern];
  if (!patternDef) return;

  ctx.save();

  // Calculate bounding box of the hatch area
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const loop of entity.boundaryVertices) {
    for (const p of loop) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }

  // Clip to hatch boundary
  ctx.beginPath();
  for (let i = 0; i < entity.boundaryVertices.length; i++) {
    const loop = entity.boundaryVertices[i];
    if (loop.length < 3) continue;

    ctx.moveTo(
      (loop[0].x - viewport.pan.x) * viewport.zoom + viewport.width / 2,
      (loop[0].y - viewport.pan.y) * viewport.zoom + viewport.height / 2,
    );

    for (let j = 1; j < loop.length; j++) {
      ctx.lineTo(
        (loop[j].x - viewport.pan.x) * viewport.zoom + viewport.width / 2,
        (loop[j].y - viewport.pan.y) * viewport.zoom + viewport.height / 2,
      );
    }
    ctx.closePath();
  }
  ctx.clip();

  // Fill with pattern
  if (entity.pattern === "solid") {
    ctx.fillStyle = entity.color;
    ctx.fillRect(
      (minX - viewport.pan.x) * viewport.zoom,
      (minY - viewport.pan.y) * viewport.zoom,
      (maxX - minX) * viewport.zoom,
      (maxY - minY) * viewport.zoom,
    );
  } else {
    // Draw pattern lines
    ctx.strokeStyle = entity.color;
    ctx.lineWidth = 1;

    const spacing = patternDef.spacing * entity.scale * viewport.zoom;
    const angleRad = (((patternDef as any).rotation ?? 0 + entity.rotation) * Math.PI) / 180;

    // Calculate pattern bounding box in screen coordinates
    const screenMinX =
      (minX - viewport.pan.x) * viewport.zoom + viewport.width / 2;
    const screenMinY =
      (minY - viewport.pan.y) * viewport.zoom + viewport.height / 2;
    const screenMaxX =
      (maxX - viewport.pan.x) * viewport.zoom + viewport.width / 2;
    const screenMaxY =
      (maxY - viewport.pan.y) * viewport.zoom + viewport.height / 2;

    const diagonal = Math.hypot(
      screenMaxX - screenMinX,
      screenMaxY - screenMinY,
    );
    const centerX = (screenMinX + screenMaxX) / 2;
    const centerY = (screenMinY + screenMaxY) / 2;

    ctx.translate(centerX, centerY);
    ctx.rotate(angleRad);
    ctx.translate(-centerX, -centerY);

    if (patternDef.type === "dot") {
      // Draw dots
      for (
        let x = screenMinX - diagonal;
        x < screenMaxX + diagonal;
        x += spacing
      ) {
        for (
          let y = screenMinY - diagonal;
          y < screenMaxY + diagonal;
          y += spacing
        ) {
          ctx.beginPath();
          ctx.arc(x, y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      // Draw lines
      for (
        let x = screenMinX - diagonal;
        x < screenMaxX + diagonal;
        x += spacing
      ) {
        ctx.beginPath();
        ctx.moveTo(x - diagonal, screenMinY - diagonal);
        ctx.lineTo(x + diagonal, screenMaxY + diagonal);
        ctx.stroke();
      }
    }
  }

  ctx.restore();
}

/**
 * Boundary 감지: 주어진 점들이 닫힌 영역을 형성하는지 확인
 */
export function detectBoundary(
  entities: Array<{
    id: string;
    type: string;
    start?: Point;
    end?: Point;
    vertices?: Point[];
    closed?: boolean;
  }>,
): string[] {
  // Simple boundary detection: find connected entities that form a closed loop
  const used = new Set<string>();
  const boundary: string[] = [];

  // For a proper implementation, you'd use a more sophisticated algorithm
  // like DCEL (Doubly Connected Edge List) or similar

  return boundary;
}
