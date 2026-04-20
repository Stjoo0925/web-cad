/**
 * trim-command.ts
 * 잘내기(TRIM) 명령 모듈
 *
 * 경계선과 교차하는점에서 엔티티를 자릅니다.
 * 상태: 'selecting' | 'cutting-edge' | 'trim-target'
 * 지원: LINE, POLYLINE
 */

import type { Point, Entity } from "../tools/snap-engine.js";

export type TrimCommandState = "selecting" | "cutting-edge" | "trim-target";

export interface TrimCommandResult {
  type: "UPDATE_ENTITY" | "DELETE_ENTITY";
  entityId: string;
  params?: {
    start?: Point;
    end?: Point;
    vertices?: Point[];
  };
}

export interface TrimCommandOptions {
  onPreview?: (entities: Entity[]) => void;
  onComplete?: (results: TrimCommandResult[]) => void;
  onCancel?: () => void;
}

export interface TrimCommand {
  getState: () => TrimCommandState;
  getCuttingEdges: () => Entity[];
  getTrimTargets: () => Entity[];
  handleClick: (screenPoint: Point) => void;
  handleMove: (screenPoint: Point) => void;
  confirm: () => void;
  cancel: () => void;
  reset: () => void;
}

/**
 * 선분과 경계선의 교차점을 계산합니다.
 */
function getLineIntersections(
  lineStart: Point,
  lineEnd: Point,
  edge: Entity,
): Point[] {
  const intersections: Point[] = [];

  if (edge.type === "LINE" && edge.start && edge.end) {
    const pt = lineLineIntersection(lineStart, lineEnd, edge.start, edge.end);
    if (pt) intersections.push(pt);
  } else if (
    (edge.type === "POLYLINE" || edge.type === "LWPOLYLINE") &&
    edge.vertices
  ) {
    for (let i = 0; i < edge.vertices.length - 1; i++) {
      const pt = lineLineIntersection(
        lineStart,
        lineEnd,
        edge.vertices[i],
        edge.vertices[i + 1],
      );
      if (pt) intersections.push(pt);
    }
  }

  return intersections;
}

/**
 * 두 선분의 교차점을 계산합니다.
 */
function lineLineIntersection(
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point,
): Point | null {
  const dx1 = a2.x - a1.x;
  const dy1 = a2.y - a1.y;
  const dx2 = b2.x - b1.x;
  const dy2 = b2.y - b1.y;

  const denom = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denom) < 1e-10) return null;

  const t = ((b1.x - a1.x) * dy2 - (b1.y - a1.y) * dx2) / denom;
  const u = ((b1.x - a1.x) * dy1 - (b1.y - a1.y) * dx1) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: a1.x + t * dx1,
      y: a1.y + t * dy1,
    };
  }

  return null;
}

/**
 * 점이 선분 위에서 어떤 위치에 있는지 반환합니다.
 */
function getPointSide(point: Point, lineStart: Point, lineEnd: Point): number {
  return (
    (lineEnd.x - lineStart.x) * (point.y - lineStart.y) -
    (lineEnd.y - lineStart.y) * (point.x - lineStart.x)
  );
}

/**
 * TRIM 명령 인스턴스를 생성합니다.
 */
export function createTrimCommand(
  initialSelection: Entity[] = [],
  options: TrimCommandOptions = {},
): TrimCommand {
  const { onPreview, onComplete, onCancel } = options;

  let state: TrimCommandState = "selecting";
  let cuttingEdges: Entity[] = [];
  let trimTargets: Entity[] = [];

  function setState(newState: TrimCommandState) {
    state = newState;
  }

  function handleClick(screenPoint: Point) {
    switch (state) {
      case "selecting":
        // Enter cutting edge selection mode
        setState("cutting-edge");
        break;

      case "cutting-edge":
        // Add entity as cutting edge
        // User clicks to select cutting edge entities
        // Then clicks to confirm and move to trim target selection
        break;

      case "trim-target":
        // Trim at the clicked point
        break;
    }
  }

  function handleMove(screenPoint: Point) {
    // Preview could show trim point
  }

  function confirm() {
    if (trimTargets.length === 0 || cuttingEdges.length === 0) return;

    const results: TrimCommandResult[] = [];

    for (const target of trimTargets) {
      if (target.type === "LINE" && target.start && target.end) {
        // Find all intersection points with cutting edges
        const allIntersections: { point: Point; dist: number }[] = [];

        for (const edge of cuttingEdges) {
          const intersections = getLineIntersections(
            target.start,
            target.end,
            edge,
          );
          for (const pt of intersections) {
            const dist = Math.hypot(pt.x - target.start.x, pt.y - target.start.y);
            allIntersections.push({ point: pt, dist });
          }
        }

        if (allIntersections.length === 0) continue;

        // Sort by distance from start point
        allIntersections.sort((a, b) => a.dist - b.dist);

        // Keep first segment (from start to first intersection)
        const firstInt = allIntersections[0].point;
        const side = getPointSide(screenPoint, target.start, target.end);

        if (allIntersections.length === 1) {
          // Single intersection - trim to that point
          if (side >= 0) {
            // Keep start portion
            results.push({
              type: "UPDATE_ENTITY",
              entityId: target.id || "",
              params: { start: target.start, end: firstInt },
            });
          } else {
            // Keep end portion
            results.push({
              type: "UPDATE_ENTITY",
              entityId: target.id || "",
              params: { start: firstInt, end: target.end },
            });
          }
        } else if (allIntersections.length >= 2) {
          // Multiple intersections - this implementation keeps the first segment
          const secondInt = allIntersections[1].point;
          if (side >= 0) {
            results.push({
              type: "UPDATE_ENTITY",
              entityId: target.id || "",
              params: { start: target.start, end: firstInt },
            });
            results.push({
              type: "UPDATE_ENTITY",
              entityId: `${target.id}_trim2`,
              params: { start: secondInt, end: target.end },
            });
          } else {
            results.push({
              type: "UPDATE_ENTITY",
              entityId: target.id || "",
              params: { start: firstInt, end: secondInt },
            });
          }
        }
      } else if (
        target.type === "POLYLINE" ||
        target.type === "LWPOLYLINE"
      ) {
        if (!target.vertices) continue;

        const newVertices: Point[] = [];
        const keptSegments: Point[][] = [];
        let currentSegment: Point[] = [];

        for (let i = 0; i < target.vertices.length; i++) {
          const v = target.vertices[i];
          if (currentSegment.length === 0) {
            currentSegment.push(v);
          }

          // Check if next vertex exists
          if (i < target.vertices.length - 1) {
            const nextV = target.vertices[i + 1];
            let hasIntersection = false;
            let intersectionPoint: Point | null = null;

            for (const edge of cuttingEdges) {
              const intersections = getLineIntersections(v, nextV, edge);
              if (intersections.length > 0) {
                hasIntersection = true;
                intersectionPoint = intersections[0];
              }
            }

            if (hasIntersection && intersectionPoint) {
              currentSegment.push(intersectionPoint);
              keptSegments.push([...currentSegment]);
              currentSegment = [intersectionPoint];
            } else {
              currentSegment.push(nextV);
            }
          }
        }

        if (currentSegment.length > 1) {
          keptSegments.push(currentSegment);
        }

        // For simplicity, return first kept segment as update
        if (keptSegments.length > 0 && keptSegments[0].length >= 2) {
          results.push({
            type: "UPDATE_ENTITY",
            entityId: target.id || "",
            params: { vertices: keptSegments[0] },
          });
        }
      }
    }

    if (onComplete) {
      onComplete(results);
    }

    reset();
  }

  function cancel() {
    if (onCancel) {
      onCancel();
    }
    reset();
  }

  function reset() {
    cuttingEdges = [];
    trimTargets = [];
    state = "selecting";
  }

  function getState(): TrimCommandState {
    return state;
  }

  function getCuttingEdges(): Entity[] {
    return [...cuttingEdges];
  }

  function getTrimTargets(): Entity[] {
    return [...trimTargets];
  }

  return {
    getState,
    getCuttingEdges,
    getTrimTargets,
    handleClick,
    handleMove,
    confirm,
    cancel,
    reset,
  };
}