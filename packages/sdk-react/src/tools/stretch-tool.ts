/**
 * stretch-tool.ts
 * Stretch (displacement after area selection) tool
 *
 * Moves entities within a selection area by a specified vector.
 * - C (Crossing) or W (Window) selection
 * - Specified displacement vector
 */

export interface Point {
  x: number;
  y: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface StretchToolState {
  isSelecting: boolean;
  selectionType: "window" | "crossing";
  selectionBox: { start: Point; end: Point } | null;
  stretchVector: Point | null;
  selectedEntityIds: string[];
}

export interface StretchToolOptions {
  onComplete?: (result: {
    stretchedEntityIds: string[];
    vector: Point;
  }) => void;
  onPreview?: (entityIds: string[]) => void;
}

/**
 * Creates a STRETCH tool instance.
 */
export function createStretchTool(options: StretchToolOptions = {}) {
  const { onComplete, onPreview } = options;

  const state: StretchToolState = {
    isSelecting: false,
    selectionType: "window",
    selectionBox: null,
    stretchVector: null,
    selectedEntityIds: [],
  };

  /**
   * Start area selection
   */
  function startSelection(
    point: Point,
    type: "window" | "crossing" = "window",
  ) {
    state.isSelecting = true;
    state.selectionType = type;
    state.selectionBox = { start: { ...point }, end: { ...point } };
    state.selectedEntityIds = [];
  }

  /**
   * Update area selection
   */
  function updateSelection(point: Point) {
    if (!state.selectionBox) return;

    state.selectionBox.end = { ...point };

    if (onPreview) {
      onPreview(state.selectedEntityIds);
    }
  }

  /**
   * Complete area selection - select entities
   */
  function finishSelection(
    entities: Array<{ id: string; bounds?: BoundingBox }>,
  ): string[] {
    if (!state.selectionBox) return [];

    const box = state.selectionBox;
    state.isSelecting = false;

    // Calculate selection bounds
    const minX = Math.min(box.start.x, box.end.x);
    const minY = Math.min(box.start.y, box.end.y);
    const maxX = Math.max(box.start.x, box.end.x);
    const maxY = Math.max(box.start.y, box.end.y);

    // Filter entities based on selection type
    const selected: string[] = [];

    for (const entity of entities) {
      if (!entity.bounds) continue;

      const {
        minX: eMinX,
        minY: eMinY,
        maxX: eMaxX,
        maxY: eMaxY,
      } = entity.bounds;

      if (state.selectionType === "window") {
        // Window: select only entities completely inside the area
        if (eMinX >= minX && eMaxX <= maxX && eMinY >= minY && eMaxY <= maxY) {
          selected.push(entity.id);
        }
      } else {
        // Crossing: select all entities intersecting the area
        if (eMaxX >= minX && eMinX <= maxX && eMaxY >= minY && eMinY <= maxY) {
          selected.push(entity.id);
        }
      }
    }

    state.selectedEntityIds = selected;
    return selected;
  }

  /**
   * Set stretch vector
   */
  function setStretchVector(vector: Point) {
    state.stretchVector = { ...vector };
  }

  /**
   * Complete stretch operation
   */
  function complete(): { stretchedEntityIds: string[]; vector: Point } | null {
    if (state.selectedEntityIds.length === 0 || !state.stretchVector) {
      return null;
    }

    const result = {
      stretchedEntityIds: [...state.selectedEntityIds],
      vector: { ...state.stretchVector },
    };

    if (onComplete) {
      onComplete(result);
    }

    // Reset
    cancel();

    return result;
  }

  /**
   * Cancel operation
   */
  function cancel() {
    state.isSelecting = false;
    state.selectionBox = null;
    state.stretchVector = null;
    state.selectedEntityIds = [];
  }

  function getState(): StretchToolState {
    return { ...state };
  }

  /**
   * Translate point by vector
   */
  function translatePoint(point: Point, vector: Point): Point {
    return {
      x: point.x + vector.x,
      y: point.y + vector.y,
    };
  }

  return {
    startSelection,
    updateSelection,
    finishSelection,
    setStretchVector,
    complete,
    cancel,
    getState,
    translatePoint,
  };
}

/**
 * Calculate entity bounding box
 */
export function calculateEntityBounds(entity: {
  start?: Point;
  end?: Point;
  vertices?: Point[];
  center?: Point;
  radius?: number;
}): BoundingBox | null {
  if (entity.vertices && entity.vertices.length > 0) {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const v of entity.vertices) {
      minX = Math.min(minX, v.x);
      minY = Math.min(minY, v.y);
      maxX = Math.max(maxX, v.x);
      maxY = Math.max(maxY, v.y);
    }

    return { minX, minY, maxX, maxY };
  }

  if (entity.start && entity.end) {
    return {
      minX: Math.min(entity.start.x, entity.end.x),
      minY: Math.min(entity.start.y, entity.end.y),
      maxX: Math.max(entity.start.x, entity.end.x),
      maxY: Math.max(entity.start.y, entity.end.y),
    };
  }

  if (entity.center && entity.radius !== undefined) {
    return {
      minX: entity.center.x - entity.radius,
      minY: entity.center.y - entity.radius,
      maxX: entity.center.x + entity.radius,
      maxY: entity.center.y + entity.radius,
    };
  }

  return null;
}

/**
 * Render stretch guide
 */
export function renderStretchGuide(
  ctx: CanvasRenderingContext2D,
  selectionBox: { start: Point; end: Point },
  stretchVector: Point | null,
  viewport: { pan: Point; zoom: number; width: number; height: number },
): void {
  if (!selectionBox) return;

  const start = worldToScreen(selectionBox.start, viewport);
  const end = worldToScreen(selectionBox.end, viewport);

  ctx.save();

  // Draw selection box
  ctx.strokeStyle = "#00ff00";
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 3]);

  ctx.strokeRect(
    Math.min(start.x, end.x),
    Math.min(start.y, end.y),
    Math.abs(end.x - start.x),
    Math.abs(end.y - start.y),
  );

  // Fill with semi-transparent
  ctx.fillStyle = "rgba(0, 255, 0, 0.1)";
  ctx.fillRect(
    Math.min(start.x, end.x),
    Math.min(start.y, end.y),
    Math.abs(end.x - start.x),
    Math.abs(end.y - start.y),
  );

  ctx.restore();

  // Draw stretch vector if available
  if (stretchVector) {
    ctx.save();
    ctx.strokeStyle = "#ffff00";
    ctx.lineWidth = 2;

    const baseX = (start.x + end.x) / 2;
    const baseY = (start.y + end.y) / 2;
    const endX = baseX + stretchVector.x * viewport.zoom;
    const endY = baseY + stretchVector.y * viewport.zoom;

    ctx.beginPath();
    ctx.moveTo(baseX, baseY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Arrow head
    const angle = Math.atan2(endY - baseY, endX - baseX);
    const arrowSize = 10;

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - arrowSize * Math.cos(angle - Math.PI / 6),
      endY - arrowSize * Math.sin(angle - Math.PI / 6),
    );
    ctx.lineTo(
      endX - arrowSize * Math.cos(angle + Math.PI / 6),
      endY - arrowSize * Math.sin(angle + Math.PI / 6),
    );
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
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
