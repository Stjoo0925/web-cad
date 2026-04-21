/**
 * array-tool.ts
 * Array (Copy as grid/polar pattern) tool
 *
 * Copies selected entities in an array pattern.
 * - Rectangular Array: grid pattern
 * - Polar Array: circular pattern
 */

export interface Point {
  x: number;
  y: number;
}

export type ArrayType = "rectangular" | "polar";

export interface ArrayEntity {
  id: string;
  type: "ARRAY";
  arrayType: ArrayType;
  /** Source entity IDs */
  sourceEntityIds: string[];
  /** Copied entities (actual entities created later) */
  copies: ArrayCopy[];
  /** Array center point (Polar only) */
  center?: Point;
  /** Polar array total angle */
  angle?: number;
  /** Polar array item count */
  itemCount?: number;
  /** Rectangular array rows/columns */
  rows?: number;
  columns?: number;
  /** Row spacing */
  rowSpacing?: number;
  /** Column spacing */
  columnSpacing?: number;
  /** Rotation angle (Polar) */
  rotationAngle?: number;
  layer: string;
}

export interface ArrayCopy {
  index: number;
  transform: {
    translate?: Point;
    rotate?: number;
    scale?: number;
  };
}

export interface CreateEntityCommand {
  type: "CREATE_ENTITY";
  entityType: "ARRAY";
  entityId: string;
  params: {
    arrayType: ArrayType;
    sourceEntityIds: string[];
    copies: ArrayCopy[];
    center?: Point;
    rows?: number;
    columns?: number;
    rowSpacing?: number;
    columnSpacing?: number;
    rotationAngle?: number;
    layer: string;
  };
}

export interface ArrayToolState {
  arrayType: ArrayType;
  sourceEntityIds: string[];
  isConfiguring: boolean;
  // Rectangular options
  rows: number;
  columns: number;
  rowSpacing: number;
  columnSpacing: number;
  // Polar options
  center: Point | null;
  itemCount: number;
  rotationAngle: number;
  /** Rotate items while copying (Polar) */
  rotateWhileCopying: boolean;
}

export interface ArrayToolOptions {
  onComplete?: (
    result: { originalIds: string[]; arrayEntity: ArrayEntity },
    commands: CreateEntityCommand[],
  ) => void;
  onPreview?: (entity: ArrayEntity) => void;
}

/**
 * Creates an ARRAY tool instance.
 */
export function createArrayTool(options: ArrayToolOptions = {}) {
  const { onComplete, onPreview } = options;

  const state: ArrayToolState = {
    arrayType: "rectangular",
    sourceEntityIds: [],
    isConfiguring: false,
    // Rectangular defaults
    rows: 3,
    columns: 3,
    rowSpacing: 50,
    columnSpacing: 50,
    // Polar defaults
    center: null,
    itemCount: 6,
    rotationAngle: 360,
    rotateWhileCopying: true,
  };

  /**
   * Set source entities for array operation
   */
  function setSourceEntities(entityIds: string[]) {
    state.sourceEntityIds = entityIds;
    state.isConfiguring = true;
  }

  /**
   * Set array type (rectangular or polar)
   */
  function setArrayType(type: ArrayType) {
    state.arrayType = type;
  }

  /**
   * Set rectangular array options
   */
  function setRectangularOptions(options: {
    rows?: number;
    columns?: number;
    rowSpacing?: number;
    columnSpacing?: number;
  }) {
    if (options.rows !== undefined) state.rows = Math.max(1, options.rows);
    if (options.columns !== undefined)
      state.columns = Math.max(1, options.columns);
    if (options.rowSpacing !== undefined) state.rowSpacing = options.rowSpacing;
    if (options.columnSpacing !== undefined)
      state.columnSpacing = options.columnSpacing;
  }

  /**
   * Set polar array options
   */
  function setPolarOptions(options: {
    center?: Point;
    itemCount?: number;
    rotationAngle?: number;
    rotateWhileCopying?: boolean;
  }) {
    if (options.center !== undefined) state.center = options.center;
    if (options.itemCount !== undefined)
      state.itemCount = Math.max(2, options.itemCount);
    if (options.rotationAngle !== undefined)
      state.rotationAngle = options.rotationAngle;
    if (options.rotateWhileCopying !== undefined)
      state.rotateWhileCopying = options.rotateWhileCopying;
  }

  /**
   * Create array preview
   */
  function createPreview(): ArrayEntity | null {
    if (state.sourceEntityIds.length === 0) return null;

    const copies: ArrayCopy[] = [];

    if (state.arrayType === "rectangular") {
      let index = 0;
      for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.columns; c++) {
          if (r === 0 && c === 0) continue; // Skip original
          copies.push({
            index: index++,
            transform: {
              translate: {
                x: c * state.columnSpacing,
                y: r * state.rowSpacing,
              },
            },
          });
        }
      }
    } else {
      // Polar array
      const angleStep = state.rotationAngle / state.itemCount;
      for (let i = 1; i < state.itemCount; i++) {
        copies.push({
          index: i - 1,
          transform: {
            rotate: state.rotateWhileCopying ? i * angleStep : 0,
          },
        });
      }
    }

    return createArrayEntity(copies);
  }

  /**
   * Create ArrayEntity
   */
  function createArrayEntity(copies: ArrayCopy[]): ArrayEntity {
    return {
      id: generateEntityId(),
      type: "ARRAY",
      arrayType: state.arrayType,
      sourceEntityIds: [...state.sourceEntityIds],
      copies,
      center: state.center ?? undefined,
      rows: state.arrayType === "rectangular" ? state.rows : undefined,
      columns: state.arrayType === "rectangular" ? state.columns : undefined,
      rowSpacing: state.rowSpacing,
      columnSpacing: state.columnSpacing,
      itemCount: state.arrayType === "polar" ? state.itemCount : undefined,
      rotationAngle:
        state.arrayType === "polar" ? state.rotationAngle : undefined,
      layer: "0",
    };
  }

  /**
   * Complete array operation
   */
  function complete(): {
    originalIds: string[];
    arrayEntity: ArrayEntity;
  } | null {
    if (state.sourceEntityIds.length === 0) return null;

    const preview = createPreview();
    if (!preview || !preview.copies) return null;
    const arrayEntity = createArrayEntity(preview.copies);
    const commands = createArrayCommands(arrayEntity);

    if (onComplete) {
      onComplete({ originalIds: state.sourceEntityIds, arrayEntity }, commands);
    }

    // Reset state
    state.sourceEntityIds = [];
    state.isConfiguring = false;

    return {
      originalIds: [...state.sourceEntityIds],
      arrayEntity,
    };
  }

  /**
   * Create array document commands
   */
  function createArrayCommands(entity: ArrayEntity): CreateEntityCommand[] {
    return [
      {
        type: "CREATE_ENTITY",
        entityType: "ARRAY",
        entityId: entity.id,
        params: {
          arrayType: entity.arrayType,
          sourceEntityIds: entity.sourceEntityIds,
          copies: entity.copies,
          center: entity.center,
          rows: entity.rows,
          columns: entity.columns,
          rowSpacing: entity.rowSpacing,
          columnSpacing: entity.columnSpacing,
          rotationAngle: entity.rotationAngle,
          layer: entity.layer,
        },
      },
    ];
  }

  function cancel() {
    state.sourceEntityIds = [];
    state.isConfiguring = false;
    state.center = null;
  }

  function getState(): ArrayToolState {
    return { ...state };
  }

  return {
    setSourceEntities,
    setArrayType,
    setRectangularOptions,
    setPolarOptions,
    createPreview,
    complete,
    cancel,
    getState,
  };
}

/**
 * Calculate polar array rotation transform
 */
export function calculatePolarTransform(
  index: number,
  totalCount: number,
  rotationAngle: number,
  center: Point,
  itemPoint: Point,
  rotateWhileCopying: boolean,
): Point {
  const angleStep = (rotationAngle / totalCount) * (Math.PI / 180);
  const currentAngle = index * angleStep;

  if (rotateWhileCopying) {
    // Rotate while copying: each item rotates to maintain its orientation
    const cos = Math.cos(currentAngle);
    const sin = Math.sin(currentAngle);
    return {
      x:
        center.x +
        (itemPoint.x - center.x) * cos -
        (itemPoint.y - center.y) * sin,
      y:
        center.y +
        (itemPoint.x - center.x) * sin +
        (itemPoint.y - center.y) * cos,
    };
  } else {
    // No rotation: items maintain original orientation, only position rotates
    const cos = Math.cos(currentAngle);
    const sin = Math.sin(currentAngle);
    return {
      x:
        center.x +
        (itemPoint.x - center.x) * cos -
        (itemPoint.y - center.y) * sin,
      y:
        center.y +
        (itemPoint.x - center.x) * sin +
        (itemPoint.y - center.y) * cos,
    };
  }
}

/**
 * Calculate rectangular array position
 */
export function calculateRectangularPosition(
  row: number,
  column: number,
  basePoint: Point,
  rowSpacing: number,
  columnSpacing: number,
): Point {
  return {
    x: basePoint.x + column * columnSpacing,
    y: basePoint.y + row * rowSpacing,
  };
}

/**
 * Generate unique entity ID
 */
function generateEntityId(): string {
  return `array-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Render array guide lines
 */
export function renderArrayGuide(
  ctx: CanvasRenderingContext2D,
  state: ArrayToolState,
  entityBounds: { minX: number; minY: number; maxX: number; maxY: number },
  viewport: { pan: Point; zoom: number; width: number; height: number },
): void {
  if (state.sourceEntityIds.length === 0) return;

  const { minX, minY, maxX, maxY } = entityBounds;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  ctx.save();
  ctx.strokeStyle = "#ff6600";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);

  if (state.arrayType === "rectangular") {
    // Draw rectangular array grid preview
    const totalWidth = state.columns * state.columnSpacing;
    const totalHeight = state.rows * state.rowSpacing;
    const startX = centerX - totalWidth / 2;
    const startY = centerY - totalHeight / 2;

    // Draw grid lines
    for (let c = 0; c <= state.columns; c++) {
      const x = startX + c * state.columnSpacing;
      ctx.beginPath();
      ctx.moveTo(
        (x - viewport.pan.x) * viewport.zoom + viewport.width / 2,
        (startY - viewport.pan.y) * viewport.zoom + viewport.height / 2,
      );
      ctx.lineTo(
        (x - viewport.pan.x) * viewport.zoom + viewport.width / 2,
        (startY + totalHeight - viewport.pan.y) * viewport.zoom +
        viewport.height / 2,
      );
      ctx.stroke();
    }

    for (let r = 0; r <= state.rows; r++) {
      const y = startY + r * state.rowSpacing;
      ctx.beginPath();
      ctx.moveTo(
        (startX - viewport.pan.x) * viewport.zoom + viewport.width / 2,
        (y - viewport.pan.y) * viewport.zoom + viewport.height / 2,
      );
      ctx.lineTo(
        (startX + totalWidth - viewport.pan.x) * viewport.zoom +
        viewport.width / 2,
        (y - viewport.pan.y) * viewport.zoom + viewport.height / 2,
      );
      ctx.stroke();
    }
  } else {
    // Draw polar array arc preview
    if (!state.center) {
      ctx.restore();
      return;
    }

    const screenCenter = worldToScreen(state.center, viewport);
    const radius = Math.max(state.columnSpacing, 100);
    const angleStep = (state.rotationAngle / state.itemCount) * (Math.PI / 180);

    // Draw arc
    ctx.beginPath();
    ctx.arc(
      screenCenter.x,
      screenCenter.y,
      radius,
      0,
      (state.rotationAngle * Math.PI) / 180,
    );
    ctx.stroke();

    // Draw radial lines
    for (let i = 0; i <= state.itemCount; i++) {
      const angle = i * angleStep;
      ctx.beginPath();
      ctx.moveTo(screenCenter.x, screenCenter.y);
      ctx.lineTo(
        screenCenter.x + radius * Math.cos(angle),
        screenCenter.y + radius * Math.sin(angle),
      );
      ctx.stroke();
    }
  }

  ctx.restore();
}

function worldToScreen(
  p: Point,
  viewport: { pan: Point; zoom: number; width: number; height: number },
): Point {
  return {
    x: (p.x - viewport.pan.x) * viewport.zoom + viewport.width / 2,
    y: (p.y - viewport.pan.y) * viewport.zoom + viewport.height / 2,
  };
}
