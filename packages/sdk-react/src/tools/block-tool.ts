/**
 * block-tool.ts
 * 블록(BLOCK) 삽입 도구 모듈
 *
 * 정의된 블록을 지정된 위치에 인스턴스로 삽입합니다.
 */

import type { Point } from "./line-tool.js";
import type { Entity } from "../canvas/cad-canvas-renderer.js";

export interface BlockDefinition {
  name: string;
  entities: Entity[];
}

export interface BlockInstance {
  id: string;
  type: "BLOCK";
  name: string;
  position: Point;
  rotation: number;
  scale: { x: number; y: number };
  layer: string;
  entities: Entity[];
}

export interface BlockToolState {
  selectedBlock: BlockDefinition | null;
  isPending: boolean;
  insertionPoint: Point | null;
}

export interface BlockToolOptions {
  onComplete?: (instance: BlockInstance) => void;
  onPreview?: (instance: BlockInstance) => void;
}

/**
 * 새 엔티티 ID 생성
 */
function generateEntityId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 포인트 회전
 */
function rotatePoint(point: Point, center: Point, angleRad: number): Point {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

/**
 * 포인트 스케일
 */
function scalePoint(point: Point, scale: { x: number; y: number }): Point {
  return {
    x: point.x * scale.x,
    y: point.y * scale.y,
  };
}

/**
 * 블록 정의 목록 (실제로는 외부에서 주입될 수 있음)
 */
const blockDefinitions: BlockDefinition[] = [
  {
    name: "Door",
    entities: [
      { id: "door-1", type: "LINE", start: { x: 0, y: 0 }, end: { x: 90, y: 0 }, layer: "0" },
      { id: "door-2", type: "LINE", start: { x: 0, y: 0 }, end: { x: 0, y: 10 }, layer: "0" },
      { id: "door-3", type: "ARC", center: { x: 0, y: 0 }, radius: 90, startAngle: 0, endAngle: 90, layer: "0" },
    ],
  },
  {
    name: "Window",
    entities: [
      { id: "win-1", type: "LINE", start: { x: 0, y: 0 }, end: { x: 100, y: 0 }, layer: "0" },
      { id: "win-2", type: "LINE", start: { x: 0, y: 10 }, end: { x: 100, y: 10 }, layer: "0" },
      { id: "win-3", type: "LINE", start: { x: 0, y: 0 }, end: { x: 0, y: 10 }, layer: "0" },
      { id: "win-4", type: "LINE", start: { x: 100, y: 0 }, end: { x: 100, y: 10 }, layer: "0" },
    ],
  },
  {
    name: "Table",
    entities: [
      { id: "tbl-1", type: "RECTANGLE", start: { x: 0, y: 0 }, end: { x: 150, y: 80 }, layer: "0" },
    ],
  },
];

/**
 * BLOCK 도구 인스턴스를 생성합니다.
 */
export function createBlockTool(options: BlockToolOptions = {}) {
  const { onComplete, onPreview } = options;

  const state: BlockToolState = {
    selectedBlock: null,
    isPending: false,
    insertionPoint: null,
  };

  /**
   * 블록 정의 목록을 반환합니다.
   */
  function getBlockDefinitions(): BlockDefinition[] {
    return blockDefinitions;
  }

  /**
   * 블록을 선택합니다.
   */
  function selectBlock(block: BlockDefinition) {
    state.selectedBlock = block;
  }

  /**
   * 블록 인스턴스를 생성합니다.
   */
  function createBlockInstance(position: Point): BlockInstance {
    const newId = generateEntityId();
    return {
      id: newId,
      type: "BLOCK",
      name: state.selectedBlock?.name ?? "Unknown",
      position,
      rotation: 0,
      scale: { x: 1, y: 1 },
      layer: "0",
      entities: state.selectedBlock?.entities ?? [],
    };
  }

  /**
   * 클릭 핸들러
   */
  function handleClick(point: Point): BlockInstance | null {
    if (!state.selectedBlock) return null;

    if (!state.isPending) {
      // First click: set insertion point
      state.insertionPoint = { ...point };
      state.isPending = true;
      const instance = createBlockInstance(state.insertionPoint);
      if (onPreview) onPreview(instance);
      return null;
    } else {
      // Second click: confirm insertion
      const instance = createBlockInstance(point);

      if (onComplete) {
        onComplete(instance);
      }

      // Reset
      state.insertionPoint = null;
      state.isPending = false;

      return instance;
    }
  }

  /**
   * 미리보기용 블록 인스턴스 반환
   */
  function getPreview(): BlockInstance | null {
    if (!state.selectedBlock || !state.insertionPoint) return null;
    return createBlockInstance(state.insertionPoint);
  }

  function cancel() {
    state.selectedBlock = null;
    state.insertionPoint = null;
    state.isPending = false;
  }

  function getState(): BlockToolState {
    return { ...state };
  }

  function isActive(): boolean {
    return state.isPending;
  }

  return {
    handleClick,
    getPreview,
    getBlockDefinitions,
    selectBlock,
    cancel,
    getState,
    isActive,
  };
}

/**
 * 블록 인스턴스의 실제 엔티티들을 변환된 위치로 반환합니다.
 */
export function getBlockEntities(instance: BlockInstance): Entity[] {
  const { position, rotation, scale, entities } = instance;
  const angleRad = (rotation * Math.PI) / 180;

  return entities.map((entity) => {
    const newId = `${instance.id}-${entity.id}`;

    switch (entity.type) {
      case "LINE": {
        if (!entity.start || !entity.end) return entity;
        let start = scalePoint(entity.start, scale);
        let end = scalePoint(entity.end, scale);
        if (rotation !== 0) {
          start = rotatePoint(start, { x: 0, y: 0 }, angleRad);
          end = rotatePoint(end, { x: 0, y: 0 }, angleRad);
        }
        return {
          ...entity,
          id: newId,
          layer: instance.layer,
          start: { x: start.x + position.x, y: start.y + position.y },
          end: { x: end.x + position.x, y: end.y + position.y },
        };
      }
      case "ARC": {
        if (!entity.center) return entity;
        let center = scalePoint(entity.center, scale);
        if (rotation !== 0) {
          center = rotatePoint(center, { x: 0, y: 0 }, angleRad);
        }
        return {
          ...entity,
          id: newId,
          layer: instance.layer,
          center: { x: center.x + position.x, y: center.y + position.y },
          radius:
            entity.radius !== undefined
              ? entity.radius * Math.max(scale.x, scale.y)
              : undefined,
        };
      }
      case "CIRCLE": {
        if (!entity.center) return entity;
        let center = scalePoint(entity.center, scale);
        if (rotation !== 0) {
          center = rotatePoint(center, { x: 0, y: 0 }, angleRad);
        }
        return {
          ...entity,
          id: newId,
          layer: instance.layer,
          center: { x: center.x + position.x, y: center.y + position.y },
          radius:
            entity.radius !== undefined
              ? entity.radius * Math.max(scale.x, scale.y)
              : undefined,
        };
      }
      default:
        return { ...entity, id: newId, layer: instance.layer };
    }
  });
}
