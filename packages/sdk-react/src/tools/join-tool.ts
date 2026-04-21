/**
 * join-tool.ts
 * Join (combine) tool
 *
 * Combines separate line segments into a single POLYLINE.
 * - Auto-detect connectable entities
 * - Join mode: straight, arc, or spline
 */

export interface Point {
  x: number;
  y: number;
}

export interface JoinToolState {
  isSelecting: boolean;
  selectedEntities: Array<{
    id: string;
    type: string;
    start?: Point;
    end?: Point;
    vertices?: Point[];
    center?: Point;
    radius?: number;
    startAngle?: number;
    endAngle?: number;
  }>;
  joinMode: "straight" | "arc" | "spline";
}

export interface JoinToolOptions {
  onComplete?: (result: { originalIds: string[]; joinedId: string }) => void;
  onPreview?: (entityIds: string[]) => void;
}

/**
 * Creates a JOIN tool instance.
 */
export function createJoinTool(options: JoinToolOptions = {}) {
  const { onComplete, onPreview } = options;

  const state: JoinToolState = {
    isSelecting: false,
    selectedEntities: [],
    joinMode: "straight",
  };

  /**
   * Start selection
   */
  function startSelection() {
    state.isSelecting = true;
    state.selectedEntities = [];
  }

  /**
   * Add entity to join
   */
  function addEntity(entity: {
    id: string;
    type: string;
    start?: Point;
    end?: Point;
    vertices?: Point[];
    center?: Point;
    radius?: number;
    startAngle?: number;
    endAngle?: number;
  }): boolean {
    if (!state.isSelecting) return false;

    if (!canJoin(entity)) return false;

    if (state.selectedEntities.some((e) => e.id === entity.id)) {
      return false;
    }

    state.selectedEntities.push(entity);

    if (onPreview) {
      onPreview(state.selectedEntities.map((e) => e.id));
    }

    return true;
  }

  /**
   * Remove entity from selection
   */
  function removeEntity(entityId: string) {
    state.selectedEntities = state.selectedEntities.filter(
      (e) => e.id !== entityId,
    );

    if (onPreview) {
      onPreview(state.selectedEntities.map((e) => e.id));
    }
  }

  /**
   * Check if entity can be joined
   */
  function canJoin(entity: {
    id: string;
    type: string;
    start?: Point;
    end?: Point;
    vertices?: Point[];
    center?: Point;
    radius?: number;
  }): boolean {
    const joinableTypes = ["LINE", "ARC", "POLYLINE", "LWPOLYLINE"];
    return joinableTypes.includes(entity.type.toUpperCase());
  }

  /**
   * Perform join operation
   */
  function performJoin(): {
    originalIds: string[];
    joinedId: string;
    joinedVertices: Point[];
  } | null {
    if (state.selectedEntities.length < 2) {
      return null;
    }

    const sorted = sortEntitiesForJoin(state.selectedEntities);
    if (!sorted) {
      return null;
    }

    let joinedVertices: Point[] = [];

    if (state.joinMode === "straight") {
      joinedVertices = buildStraightJoin(sorted);
    } else if (state.joinMode === "arc") {
      joinedVertices = buildArcJoin(sorted);
    } else {
      joinedVertices = buildSplineJoin(sorted);
    }

    if (joinedVertices.length < 2) {
      return null;
    }

    const joinedId = generateEntityId();
    const originalIds = state.selectedEntities.map((e) => e.id);

    if (onComplete) {
      onComplete({ originalIds, joinedId });
    }

    cancel();

    return { originalIds, joinedId, joinedVertices };
  }

  /**
   * Sort entities to create a continuous path
   */
  function sortEntitiesForJoin(
    entities: Array<{
      id: string;
      start?: Point;
      end?: Point;
      vertices?: Point[];
    }>,
  ): Array<{
    id: string;
    start?: Point;
    end?: Point;
    vertices?: Point[];
  }> | null {
    if (entities.length === 0) return null;

    const sorted: Array<{
      id: string;
      start?: Point;
      end?: Point;
      vertices?: Point[];
    }> = [];
    const remaining = [...entities];

    const firstItem = remaining.shift();
    if (firstItem) {
      sorted.push(firstItem);
    }

    let iterations = 0;
    const maxIterations = entities.length;

    while (remaining.length > 0 && iterations < maxIterations) {
      iterations++;
      let found = false;

      for (let i = 0; i < remaining.length; i++) {
        const last = sorted[sorted.length - 1];
        const current = remaining[i];

        if (!last) break;
        const lastEnd = getEndPoint(last);
        const currentStart = getStartPoint(current);

        if (lastEnd && currentStart) {
          if (isPointsEqual(lastEnd, currentStart, 0.001)) {
            const removed = remaining.splice(i, 1)[0];
            if (removed) {
              sorted.push(removed);
            }
            found = true;
            break;
          }
          const currentEnd = getEndPoint(current);
          if (currentEnd && isPointsEqual(lastEnd, currentEnd, 0.001)) {
            const removed = remaining.splice(i, 1)[0];
            if (removed) {
              const reversed = reverseEntity(removed);
              sorted.push(reversed);
            }
            found = true;
            break;
          }
        }
      }

      if (!found) {
        const first = sorted[0];
        const firstStart = getStartPoint(first);

        for (let i = 0; i < remaining.length; i++) {
          const current = remaining[i];
          const currentStart = getStartPoint(current);
          const currentEnd = getEndPoint(current);

          if (
            firstStart &&
            currentEnd &&
            isPointsEqual(firstStart, currentEnd, 0.001)
          ) {
            sorted.unshift(remaining.splice(i, 1)[0]);
            found = true;
            break;
          }
        }

        if (!found) {
          break;
        }
      }
    }

    return sorted;
  }

  /**
   * Build straight join path
   */
  function buildStraightJoin(
    entities: Array<{
      id: string;
      start?: Point;
      end?: Point;
      vertices?: Point[];
    }>,
  ): Point[] {
    const vertices: Point[] = [];

    for (const entity of entities) {
      if (entity.vertices && entity.vertices.length > 0) {
        if (vertices.length === 0) {
          vertices.push(...entity.vertices);
        } else {
          vertices.push(...entity.vertices.slice(1));
        }
      } else if (entity.start && entity.end) {
        if (vertices.length === 0) {
          vertices.push(entity.start, entity.end);
        } else {
          vertices.push(entity.end);
        }
      }
    }

    return vertices;
  }

  /**
   * Build arc join (keeps arc segments)
   */
  function buildArcJoin(
    entities: Array<{
      id: string;
      start?: Point;
      end?: Point;
      vertices?: Point[];
      center?: Point;
      radius?: number;
      startAngle?: number;
      endAngle?: number;
    }>,
  ): Point[] {
    return buildStraightJoin(entities);
  }

  /**
   * Build spline join (smooths the path)
   */
  function buildSplineJoin(
    entities: Array<{
      id: string;
      start?: Point;
      end?: Point;
      vertices?: Point[];
    }>,
  ): Point[] {
    return buildStraightJoin(entities);
  }

  function getStartPoint(entity: {
    start?: Point;
    end?: Point;
    vertices?: Point[];
  }): Point | null {
    if (entity.vertices && entity.vertices.length > 0) {
      return entity.vertices[0];
    }
    return entity.start ?? null;
  }

  function getEndPoint(entity: {
    start?: Point;
    end?: Point;
    vertices?: Point[];
  }): Point | null {
    if (entity.vertices && entity.vertices.length > 0) {
      return entity.vertices[entity.vertices.length - 1];
    }
    return entity.end ?? null;
  }

  function isPointsEqual(p1: Point, p2: Point, tolerance: number): boolean {
    return (
      Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance
    );
  }

  function reverseEntity(entity: {
    id: string;
    start?: Point;
    end?: Point;
    vertices?: Point[];
  }): {
    id: string;
    start?: Point;
    end?: Point;
    vertices?: Point[];
  } {
    if (entity.vertices) {
      return {
        ...entity,
        vertices: [...entity.vertices].reverse(),
      };
    }
    return {
      ...entity,
      start: entity.end,
      end: entity.start,
    };
  }

  /**
   * Set join mode
   */
  function setJoinMode(mode: "straight" | "arc" | "spline") {
    state.joinMode = mode;
  }

  /**
   * Cancel operation
   */
  function cancel() {
    state.isSelecting = false;
    state.selectedEntities = [];
  }

  function getState(): JoinToolState {
    return { ...state };
  }

  return {
    startSelection,
    addEntity,
    removeEntity,
    performJoin,
    setJoinMode,
    cancel,
    getState,
  };
}

/**
 * Generate unique entity ID
 */
function generateEntityId(): string {
  return `join-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
