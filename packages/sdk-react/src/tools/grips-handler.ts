/**
 * grips-handler.ts
 * Grips System - 선택된 엔티티의 제어점 관리 및 드래그 변형
 *
 * 기능:
 * - 엔티티별 Grip 포인트 추출 (Endpoint, Midpoint, Center, Quadrant)
 * - Grip 드래그를 통한 변형 작업
 * - Shift+드래그로 복사
 * - Multi-grip 선택 후 일괄 변형
 */

import type { Entity, Point } from "../canvas/cad-canvas-renderer";

export type GripType =
  | "endpoint"
  | "midpoint"
  | "center"
  | "quadrant"
  | "vertex";

export interface GripPoint {
  id: string;
  type: GripType;
  position: Point;
  /** 소속 엔티티 ID */
  entityId: string;
  /** Grip 인덱스 (polyline vertex 등) */
  index?: number;
}

export interface GripDragState {
  grip: GripPoint;
  startWorld: Point;
  currentWorld: Point;
  shiftKey: boolean;
}

export interface GripEntityState {
  entityId: string;
  grips: GripPoint[];
}

export interface EntityModifier {
  type: "move" | "stretch" | "copy";
  /** 변형 후 새 엔티티 (copy 시) */
  newEntity?: unknown;
  /** 변형량 */
  delta: Point;
  /** 기준점 */
  basePoint: Point;
}

/**
 * 엔티티에서 Grip 포인트들을 추출합니다.
 */
export function extractGripsFromEntity(entity: Entity): GripPoint[] {
  const grips: GripPoint[] = [];
  const { id } = entity;

  switch (entity.type) {
    case "LINE":
      if (entity.start && entity.end) {
        // Endpoints
        grips.push({
          id: `${id}_ep0`,
          type: "endpoint",
          position: { ...entity.start },
          entityId: id,
          index: 0,
        });
        grips.push({
          id: `${id}_ep1`,
          type: "endpoint",
          position: { ...entity.end },
          entityId: id,
          index: 1,
        });
        // Midpoint
        grips.push({
          id: `${id}_mid`,
          type: "midpoint",
          position: {
            x: (entity.start.x + entity.end.x) / 2,
            y: (entity.start.y + entity.end.y) / 2,
          },
          entityId: id,
        });
      }
      break;

    case "CIRCLE":
      if (entity.center && entity.radius !== undefined) {
        // Center
        grips.push({
          id: `${id}_center`,
          type: "center",
          position: { ...entity.center },
          entityId: id,
        });
        // Quadrant points (4 cardinal directions)
        const r = entity.radius;
        grips.push({
          id: `${id}_q0`,
          type: "quadrant",
          position: { x: entity.center.x + r, y: entity.center.y },
          entityId: id,
          index: 0,
        });
        grips.push({
          id: `${id}_q1`,
          type: "quadrant",
          position: { x: entity.center.x, y: entity.center.y + r },
          entityId: id,
          index: 1,
        });
        grips.push({
          id: `${id}_q2`,
          type: "quadrant",
          position: { x: entity.center.x - r, y: entity.center.y },
          entityId: id,
          index: 2,
        });
        grips.push({
          id: `${id}_q3`,
          type: "quadrant",
          position: { x: entity.center.x, y: entity.center.y - r },
          entityId: id,
          index: 3,
        });
      }
      break;

    case "ARC":
      if (entity.center && entity.radius !== undefined) {
        // Center
        grips.push({
          id: `${id}_center`,
          type: "center",
          position: { ...entity.center },
          entityId: id,
        });
        // Start and End points (calculated from angles)
        const startAngle = entity.startAngle ?? 0;
        const endAngle = entity.endAngle ?? Math.PI * 2;
        grips.push({
          id: `${id}_start`,
          type: "endpoint",
          position: {
            x: entity.center.x + entity.radius * Math.cos(startAngle),
            y: entity.center.y + entity.radius * Math.sin(startAngle),
          },
          entityId: id,
          index: 0,
        });
        grips.push({
          id: `${id}_end`,
          type: "endpoint",
          position: {
            x: entity.center.x + entity.radius * Math.cos(endAngle),
            y: entity.center.y + entity.radius * Math.sin(endAngle),
          },
          entityId: id,
          index: 1,
        });
      }
      break;

    case "POLYLINE":
    case "LWPOLYLINE":
      if (entity.vertices && entity.vertices.length > 0) {
        // All vertices
        entity.vertices.forEach((v, i) => {
          grips.push({
            id: `${id}_v${i}`,
            type: "vertex",
            position: { ...v },
            entityId: id,
            index: i,
          });
        });

        // Midpoints of each segment (except for closed polylines where last segment is handled separately)
        for (let i = 0; i < entity.vertices.length - 1; i++) {
          const a = entity.vertices[i];
          const b = entity.vertices[i + 1];
          grips.push({
            id: `${id}_m${i}`,
            type: "midpoint",
            position: {
              x: (a.x + b.x) / 2,
              y: (a.y + b.y) / 2,
            },
            entityId: id,
            index: i,
          });
        }

        // Closed polyline: add midpoint of closing segment and closing grip
        if (entity.closed && entity.vertices.length > 2) {
          const last = entity.vertices[entity.vertices.length - 1];
          const first = entity.vertices[0];
          grips.push({
            id: `${id}_m${entity.vertices.length - 1}`,
            type: "midpoint",
            position: {
              x: (last.x + first.x) / 2,
              y: (last.y + first.y) / 2,
            },
            entityId: id,
            index: entity.vertices.length - 1,
          });
        }
      }
      break;

    case "POINT":
      if (entity.position) {
        grips.push({
          id: `${id}_pos`,
          type: "center",
          position: { ...entity.position },
          entityId: id,
        });
      }
      break;
  }

  return grips;
}

/**
 * 여러 엔티티에서 모든 Grip 포인트를 추출합니다.
 */
export function extractGripsFromEntities(
  entities: Array<{
    id: string;
    type: string;
    start?: Point;
    end?: Point;
    position?: Point;
    center?: Point;
    radius?: number;
    vertices?: Point[];
    startAngle?: number;
    endAngle?: number;
  }>,
): GripPoint[] {
  const allGrips: GripPoint[] = [];
  for (const entity of entities) {
    allGrips.push(...extractGripsFromEntity(entity));
  }
  return allGrips;
}

/**
 * Grip 포인트 타입별 렌더링 스타일
 */
export function getGripStyle(
  type: GripType,
): { size: number; color: string; fillColor: string } {
  switch (type) {
    case "endpoint":
      return { size: 8, color: "#00ff00", fillColor: "#00ff00" }; // Green
    case "midpoint":
      return { size: 6, color: "#ffff00", fillColor: "#ffff00" }; // Yellow
    case "center":
      return { size: 8, color: "#00ffff", fillColor: "#00ffff" }; // Cyan
    case "quadrant":
      return { size: 6, color: "#ff00ff", fillColor: "#ff00ff" }; // Magenta
    case "vertex":
      return { size: 6, color: "#00ff00", fillColor: "#00ff00" }; // Green
    default:
      return { size: 6, color: "#0078d4", fillColor: "#0078d4" };
  }
}

/**
 * Grip 타입 라벨
 */
export function getGripLabel(type: GripType): string {
  switch (type) {
    case "endpoint":
      return "END";
    case "midpoint":
      return "MID";
    case "center":
      return "CEN";
    case "quadrant":
      return "QUA";
    case "vertex":
      return "VER";
    default:
      return "";
  }
}

/**
 * Grips Handler 생성
 */
export function createGripsHandler() {
  /** 선택된 엔티티들의 Grip */
  let grips: GripPoint[] = [];
  /** 현재 드래그 상태 */
  let dragState: GripDragState | null = null;
  /** Grip-hover 상태 */
  let hoveredGripId: string | null = null;
  /** 선택된 Grip들 (multi-select) */
  let selectedGripIds: Set<string> = new Set();

  /**
   * Grip 업데이트
   */
  function updateGrips(
    entities: Array<{
      id: string;
      type: string;
      start?: Point;
      end?: Point;
      position?: Point;
      center?: Point;
      radius?: number;
      vertices?: Point[];
      startAngle?: number;
      endAngle?: number;
    }>,
  ) {
    grips = extractGripsFromEntities(entities);
  }

  /**
   * 특정 Grip 찾기 (화면 좌표 기준)
   */
  function findGripAtPoint(
    worldPoint: Point,
    viewport: { zoom?: number },
    tolerance = 10,
  ): GripPoint | null {
    const zoom = viewport.zoom ?? 1;
    const worldTolerance = tolerance / zoom;

    for (const grip of grips) {
      const dist = Math.hypot(
        grip.position.x - worldPoint.x,
        grip.position.y - worldPoint.y,
      );
      if (dist <= worldTolerance) {
        return grip;
      }
    }
    return null;
  }

  /**
   * 드래그 시작
   */
  function startDrag(grip: GripPoint, worldPoint: Point, shiftKey: boolean) {
    dragState = {
      grip,
      startWorld: { ...grip.position },
      currentWorld: { ...worldPoint },
      shiftKey,
    };
  }

  /**
   * 드래그 업데이트
   */
  function updateDrag(worldPoint: Point) {
    if (!dragState) return;
    dragState.currentWorld = { ...worldPoint };
  }

  /**
   * 드래그 종료 - 변형 결과 반환
   */
  function endDrag(): EntityModifier | null {
    if (!dragState) return null;

    const { grip, startWorld, currentWorld, shiftKey } = dragState;
    const delta = {
      x: currentWorld.x - startWorld.x,
      y: currentWorld.y - startWorld.y,
    };

    const result: EntityModifier = {
      type: shiftKey ? "copy" : "move",
      delta,
      basePoint: startWorld,
    };

    dragState = null;
    return result;
  }

  /**
   * 드래그 취소
   */
  function cancelDrag() {
    dragState = null;
  }

  /**
   * Grip 토글 선택
   */
  function toggleGripSelection(gripId: string) {
    if (selectedGripIds.has(gripId)) {
      selectedGripIds.delete(gripId);
    } else {
      selectedGripIds.add(gripId);
    }
  }

  /**
   * 모든 Grip 선택 해제
   */
  function clearGripSelection() {
    selectedGripIds.clear();
  }

  /**
   * 현재 상태 조회
   */
  function getGrips(): GripPoint[] {
    return grips;
  }

  function getDragState(): GripDragState | null {
    return dragState;
  }

  function getHoveredGripId(): string | null {
    return hoveredGripId;
  }

  function setHoveredGripId(id: string | null) {
    hoveredGripId = id;
  }

  function getSelectedGripIds(): Set<string> {
    return selectedGripIds;
  }

  function isGripSelected(gripId: string): boolean {
    return selectedGripIds.has(gripId);
  }

  return {
    updateGrips,
    findGripAtPoint,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    toggleGripSelection,
    clearGripSelection,
    getGrips,
    getDragState,
    getHoveredGripId,
    setHoveredGripId,
    getSelectedGripIds,
    isGripSelected,
  };
}

export type GripsHandler = ReturnType<typeof createGripsHandler>;
