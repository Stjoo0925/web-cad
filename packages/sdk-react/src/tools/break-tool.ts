/**
 * break-tool.ts
 * Break (split) tool
 *
 * Splits an entity between two points, or at a single point.
 * - First point then second point
 * - Split at one point (same point click)
 */

export interface Point {
  x: number;
  y: number;
}

export interface BreakToolState {
  isSelectingFirst: boolean;
  isSelectingSecond: boolean;
  firstPoint: Point | null;
  targetEntity: { id: string; type: string; vertices?: Point[] } | null;
}

export interface BreakToolOptions {
  onComplete?: (result: { entityId: string; breakPoints: Point[] }) => void;
  onPreview?: (preview: { entityId: string; breakPoint: Point | null }) => void;
}

/**
 * Creates a BREAK tool instance.
 */
export function createBreakTool(options: BreakToolOptions = {}) {
  const { onComplete, onPreview } = options;

  const state: BreakToolState = {
    isSelectingFirst: false,
    isSelectingSecond: false,
    firstPoint: null,
    targetEntity: null,
  };

  /**
   * Select entity to break
   */
  function selectEntity(entity: {
    id: string;
    type: string;
    vertices?: Point[];
  }) {
    state.targetEntity = entity;
    state.isSelectingFirst = true;
    state.firstPoint = null;
  }

  /**
   * Select first break point
   */
  function selectFirstPoint(point: Point): boolean {
    state.firstPoint = { ...point };
    return true;
  }

  /**
   * Select second break point
   */
  function selectSecondPoint(
    point: Point,
  ): { entityId: string; breakPoints: Point[] } | null {
    if (!state.targetEntity || !state.firstPoint) {
      return null;
    }

    const breakPoints = [state.firstPoint, { ...point }];

    // Check if points are the same (single point break)
    const isSingleBreak =
      Math.abs(state.firstPoint.x - point.x) < 0.001 &&
      Math.abs(state.firstPoint.y - point.y) < 0.001;

    const result = {
      entityId: state.targetEntity.id,
      breakPoints: isSingleBreak
        ? [state.firstPoint]
        : [state.firstPoint, { ...point }],
    };

    if (onComplete) {
      onComplete(result);
    }

    // Reset
    cancel();

    return result;
  }

  /**
   * Perform break operation at specified points
   */
  function performBreak(
    entity: { id: string; type: string; vertices?: Point[] },
    breakPoints: Point[],
  ): { originalId: string; newEntityIds: string[] }[] {
    const results: { originalId: string; newEntityIds: string[] }[] = [];

    if (!entity.vertices || entity.vertices.length < 2) {
      return results;
    }

    // Sort break points along entity path
    const sortedPoints = [...breakPoints].sort((a, b) => {
      if (!entity.vertices || entity.vertices.length === 0) return 0;
      const distA = Math.hypot(
        a.x - entity.vertices[0].x,
        a.y - entity.vertices[0].y,
      );
      const distB = Math.hypot(
        b.x - entity.vertices[0].x,
        b.y - entity.vertices[0].y,
      );
      return distA - distB;
    });

    // Create segments between break points
    let segmentStart = 0;
    const newSegments: Point[][] = [];

    for (const bp of sortedPoints) {
      let segmentEnd = segmentStart + 1;

      while (segmentEnd < entity.vertices.length) {
        const v1 = entity.vertices[segmentEnd - 1];
        const v2 = entity.vertices[segmentEnd];

        if (isPointOnSegment(bp, v1, v2)) {
          const newVertices = entity.vertices.slice(segmentStart, segmentEnd);
          newVertices.push({ ...bp });
          newSegments.push(newVertices);

          segmentStart = segmentEnd;
          break;
        }
        segmentEnd++;
      }
    }

    // Add final segment
    if (segmentStart < entity.vertices.length - 1) {
      newSegments.push(entity.vertices.slice(segmentStart));
    }

    if (newSegments.length > 0) {
      results.push({
        originalId: entity.id,
        newEntityIds: newSegments.map((_, i) => `${entity.id}-seg-${i}`),
      });
    }

    return results;
  }

  /**
   * Check if point is on segment
   */
  function isPointOnSegment(
    point: Point,
    segStart: Point,
    segEnd: Point,
  ): boolean {
    const dist = pointToSegmentDistance(point, segStart, segEnd);
    return dist < 0.001;
  }

  /**
   * Calculate distance from point to segment
   */
  function pointToSegmentDistance(
    point: Point,
    segStart: Point,
    segEnd: Point,
  ): number {
    const dx = segEnd.x - segStart.x;
    const dy = segEnd.y - segStart.y;
    const len = Math.hypot(dx, dy);

    if (len < 0.001) {
      return Math.hypot(point.x - segStart.x, point.y - segStart.y);
    }

    const t = Math.max(
      0,
      Math.min(
        1,
        ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) /
        (len * len),
      ),
    );

    const projX = segStart.x + t * dx;
    const projY = segStart.y + t * dy;

    return Math.hypot(point.x - projX, point.y - projY);
  }

  /**
   * Cancel operation
   */
  function cancel() {
    state.isSelectingFirst = false;
    state.isSelectingSecond = false;
    state.firstPoint = null;
    state.targetEntity = null;
  }

  function getState(): BreakToolState {
    return { ...state };
  }

  return {
    selectEntity,
    selectFirstPoint,
    selectSecondPoint,
    performBreak,
    cancel,
    getState,
  };
}
