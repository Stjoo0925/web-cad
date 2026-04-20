/**
 * selection-cycling.ts
 * Selection Cycling - Tab키로 겹친 엔티티 순서대로 선택
 *
 * 기능:
 * - Tab키로 겹친 엔티티 순서대로 선택
 * - Shift+Tab: 역방향 순회
 * - 선택 범위 내 동일한 위치의 엔티티만 순회
 */

import type { Point, Entity, Viewport } from "../canvas/cad-canvas-renderer.js";
import { hitTestEntities, hitTest } from "./select-tool.js";

export interface SelectionCyclingState {
  /** 순회 중인 스택 */
  entityStack: Entity[];
  /** 현재 선택 인덱스 */
  currentIndex: number;
  /** 순회 시작 지점 */
  startPoint: Point | null;
}

export interface SelectionCyclingOptions {
  /** 선택 콜백 */
  onSelectionChange?: (entityId: string | null) => void;
}

/**
 * Selection Cycling Handler 생성
 */
export function createSelectionCyclingHandler(
  options: SelectionCyclingOptions = {},
) {
  const { onSelectionChange } = options;

  let state: SelectionCyclingState = {
    entityStack: [],
    currentIndex: -1,
    startPoint: null,
  };

  /**
   * 화면 좌표에서 겹친 엔티티들을 찾아 스택을 구성합니다.
   * 스택은 z-order(추가된 순서)대로 정렬됩니다.
   */
  function findOverlappingEntities(
    screenPoint: Point,
    entities: Entity[],
    viewport: Viewport,
    tolerance = 10,
  ): Entity[] {
    const zoom = viewport.zoom ?? 1;
    const worldTolerance = tolerance / zoom;

    // Find all entities that hit-test at this point
    const overlapping: Entity[] = [];

    for (const entity of entities) {
      if (hitTest(entity, screenPoint, viewport, worldTolerance)) {
        overlapping.push(entity);
      }
    }

    // Sort by z-order (entities added earlier are "under" newer ones)
    // In our model, we use array index as z-order
    return overlapping;
  }

  /**
   * 순회 시작 - 현재 위치의 겹친 엔티티 스택 구성
   */
  function startCycling(
    screenPoint: Point,
    entities: Entity[],
    viewport: Viewport,
  ) {
    const stack = findOverlappingEntities(screenPoint, entities, viewport);

    if (stack.length <= 1) {
      // No cycling needed - only one or no entity
      state = {
        entityStack: [],
        currentIndex: -1,
        startPoint: screenPoint,
      };
      onSelectionChange?.(null);
      return null;
    }

    // Find the topmost entity (last in array) to start cycling from it
    state = {
      entityStack: stack,
      currentIndex: stack.length - 1,
      startPoint: screenPoint,
    };

    const selectedEntity = stack[state.currentIndex];
    onSelectionChange?.(selectedEntity.id);
    return selectedEntity;
  }

  /**
   * 다음 엔티티로 순회 (Tab)
   */
  function cycleNext(): Entity | null {
    if (state.entityStack.length <= 1) {
      return state.entityStack[0] ?? null;
    }

    state.currentIndex = (state.currentIndex + 1) % state.entityStack.length;
    const entity = state.entityStack[state.currentIndex];
    onSelectionChange?.(entity.id);
    return entity;
  }

  /**
   * 이전 엔티티로 순회 (Shift+Tab)
   */
  function cyclePrevious(): Entity | null {
    if (state.entityStack.length <= 1) {
      return state.entityStack[0] ?? null;
    }

    state.currentIndex =
      (state.currentIndex - 1 + state.entityStack.length) %
      state.entityStack.length;
    const entity = state.entityStack[state.currentIndex];
    onSelectionChange?.(entity.id);
    return entity;
  }

  /**
   * 순회 종료
   */
  function endCycling(): Entity | null {
    if (state.currentIndex >= 0 && state.entityStack.length > 0) {
      const entity = state.entityStack[state.currentIndex];
      state = {
        entityStack: [],
        currentIndex: -1,
        startPoint: null,
      };
      return entity;
    }

    state = {
      entityStack: [],
      currentIndex: -1,
      startPoint: null,
    };
    return null;
  }

  /**
   * 현재 상태 확인
   */
  function isCycling(): boolean {
    return state.entityStack.length > 1;
  }

  function getCurrentEntity(): Entity | null {
    if (state.currentIndex >= 0 && state.currentIndex < state.entityStack.length) {
      return state.entityStack[state.currentIndex];
    }
    return null;
  }

  function getStackSize(): number {
    return state.entityStack.length;
  }

  function getCurrentIndex(): number {
    return state.currentIndex;
  }

  return {
    startCycling,
    cycleNext,
    cyclePrevious,
    endCycling,
    isCycling,
    getCurrentEntity,
    getStackSize,
    getCurrentIndex,
  };
}

export type SelectionCyclingHandler = ReturnType<typeof createSelectionCyclingHandler>;
