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
  let lastClickPoint: Point = { x: 0, y: 0 };

  function setState(newState: TrimCommandState) {
    state = newState;
  }

  function handleClick(screenPoint: Point) {
    lastClickPoint = screenPoint;
    switch (state) {
      case "selecting":
        // 잘라내기 경계선 선택 모드로 전환
        setState("cutting-edge");
        break;

      case "cutting-edge":
        // 엔티티를 잘라내기 경계선으로 추가
        // 사용자가 잘라내기 경계선 엔티티를 선택하도록 클릭
        // 그 다음 확인 클릭 후 대상 선택으로 이동
        break;

      case "trim-target":
        // 클릭한 위치에서 자르기
        break;
    }
  }

  function handleMove(screenPoint: Point) {
    // 미리보기에 자르기 포인트 표시 가능
  }

  function confirm() {
    if (trimTargets.length === 0 || cuttingEdges.length === 0) return;

    const results: TrimCommandResult[] = [];

    for (const target of trimTargets) {
      if (target.type === "LINE" && target.start && target.end) {
        // cutting edge와의 모든 교차점 찾기
        const allIntersections: { point: Point; dist: number }[] = [];

        for (const edge of cuttingEdges) {
          const intersections = getLineIntersections(
            target.start,
            target.end,
            edge,
          );
          for (const pt of intersections) {
            const dist = Math.hypot(
              pt.x - target.start.x,
              pt.y - target.start.y,
            );
            allIntersections.push({ point: pt, dist });
          }
        }

        if (allIntersections.length === 0) continue;

        // 시작점에서의 거리로 정렬
        allIntersections.sort((a, b) => a.dist - b.dist);

        // 첫 번째 세그먼트 유지 (시작점부터 첫 교차점까지)
        const firstInt = allIntersections[0].point;
        const side = getPointSide(lastClickPoint, target.start, target.end);

        if (allIntersections.length === 1) {
          // 단일 교차점 - 해당 지점까지 자름
          if (side >= 0) {
            // 시작 부분 유지
            results.push({
              type: "UPDATE_ENTITY",
              entityId: target.id || "",
              params: { start: target.start, end: firstInt },
            });
          } else {
            // 끝 부분 유지
            results.push({
              type: "UPDATE_ENTITY",
              entityId: target.id || "",
              params: { start: firstInt, end: target.end },
            });
          }
        } else if (allIntersections.length >= 2) {
          // 다중 교차점 - 이 구현은 첫 번째 세그먼트 유지
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
      } else if (target.type === "POLYLINE" || target.type === "LWPOLYLINE") {
        if (!target.vertices) continue;

        const newVertices: Point[] = [];
        const keptSegments: Point[][] = [];
        let currentSegment: Point[] = [];

        for (let i = 0; i < target.vertices.length; i++) {
          const v = target.vertices[i];
          if (currentSegment.length === 0) {
            currentSegment.push(v);
          }

          // 다음 버텍스가 있는지 확인
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

        // 간단히 첫 번째 유지 세그먼트를 업데이트로 반환
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
