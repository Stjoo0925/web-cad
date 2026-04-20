/**
 * extend-command.ts
 * 늘리기(EXTEND) 명령 모듈
 *
 * 경계선까지 엔티티를 연장합니다.
 * 상태: 'selecting' | 'boundary' | 'extend-target'
 * 지원: LINE
 */

import type { Point, Entity } from "../tools/snap-engine.js";

export type ExtendCommandState = "selecting" | "boundary" | "extend-target";

export interface ExtendCommandResult {
  type: "UPDATE_ENTITY";
  entityId: string;
  params: {
    start?: Point;
    end?: Point;
  };
}

export interface ExtendCommandOptions {
  onPreview?: (entities: Entity[]) => void;
  onComplete?: (results: ExtendCommandResult[]) => void;
  onCancel?: () => void;
}

export interface ExtendCommand {
  getState: () => ExtendCommandState;
  getBoundaryEdges: () => Entity[];
  getExtendTargets: () => Entity[];
  handleClick: (screenPoint: Point) => void;
  handleMove: (screenPoint: Point) => void;
  confirm: () => void;
  cancel: () => void;
  reset: () => void;
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
 *点和线的交点，计算延伸线到边界
 */
function getLineExtensionPoint(
  lineStart: Point,
  lineEnd: Point,
  boundaryEdge: Entity,
): Point | null {
  if (boundaryEdge.type === "LINE" && boundaryEdge.start && boundaryEdge.end) {
    return lineLineIntersection(lineStart, lineEnd, boundaryEdge.start, boundaryEdge.end);
  } else if (
    (boundaryEdge.type === "POLYLINE" || boundaryEdge.type === "LWPOLYLINE") &&
    boundaryEdge.vertices
  ) {
    let closestPoint: Point | null = null;
    let closestDist = Infinity;

    for (let i = 0; i < boundaryEdge.vertices.length - 1; i++) {
      const pt = lineLineIntersection(
        lineStart,
        lineEnd,
        boundaryEdge.vertices[i],
        boundaryEdge.vertices[i + 1],
      );
      if (pt) {
        const dist = Math.hypot(pt.x - lineEnd.x, pt.y - lineEnd.y);
        if (dist < closestDist) {
          closestDist = dist;
          closestPoint = pt;
        }
      }
    }

    return closestPoint;
  }

  return null;
}

/**
 * EXTEND 명령 인스턴스를 생성합니다.
 */
export function createExtendCommand(
  initialSelection: Entity[] = [],
  options: ExtendCommandOptions = {},
): ExtendCommand {
  const { onPreview, onComplete, onCancel } = options;

  let state: ExtendCommandState = "selecting";
  let boundaryEdges: Entity[] = [];
  let extendTargets: Entity[] = [];

  function setState(newState: ExtendCommandState) {
    state = newState;
  }

  function handleClick(screenPoint: Point) {
    switch (state) {
      case "selecting":
        // Enter boundary selection mode
        setState("boundary");
        break;

      case "boundary":
        // Add entity as boundary edge
        break;

      case "extend-target":
        // Extend at the clicked point
        break;
    }
  }

  function handleMove(screenPoint: Point) {
    // Preview could show extend point
  }

  function confirm() {
    if (extendTargets.length === 0 || boundaryEdges.length === 0) return;

    const results: ExtendCommandResult[] = [];

    for (const target of extendTargets) {
      if (target.type === "LINE" && target.start && target.end) {
        let extendedStart = target.start;
        let extendedEnd = target.end;

        // Try to extend from start point
        for (const boundary of boundaryEdges) {
          const extPt = getLineExtensionPoint(target.start, target.end, boundary);
          if (extPt) {
            // Check which end is closer to the intersection
            const distFromStart = Math.hypot(extPt.x - target.start.x, extPt.y - target.start.y);
            const distFromEnd = Math.hypot(extPt.x - target.end.x, extPt.y - target.end.y);

            if (distFromStart < distFromEnd) {
              extendedStart = extPt;
            } else {
              extendedEnd = extPt;
            }
          }
        }

        results.push({
          type: "UPDATE_ENTITY",
          entityId: target.id || "",
          params: { start: extendedStart, end: extendedEnd },
        });
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
    boundaryEdges = [];
    extendTargets = [];
    state = "selecting";
  }

  function getState(): ExtendCommandState {
    return state;
  }

  function getBoundaryEdges(): Entity[] {
    return [...boundaryEdges];
  }

  function getExtendTargets(): Entity[] {
    return [...extendTargets];
  }

  return {
    getState,
    getBoundaryEdges,
    getExtendTargets,
    handleClick,
    handleMove,
    confirm,
    cancel,
    reset,
  };
}