/**
 * entity-history.ts
 * 엔티티 히스토리 관리 (Undo/Redo)
 *
 * 상태 변경 사항을 히스토리에 기록하고 Undo/Redo를 지원합니다.
 */

import type { Entity } from "../canvas/cad-canvas-renderer.js";

export interface HistoryEntry {
  entities: Entity[];
}

const MAX_HISTORY = 50;

export function createEntityHistory() {
  const undoStack: HistoryEntry[] = [];
  const redoStack: HistoryEntry[] = [];

  function saveToHistory(entities: Entity[]) {
    undoStack.push({
      entities: JSON.parse(JSON.stringify(entities)),
    });
    if (undoStack.length > MAX_HISTORY) {
      undoStack.shift();
    }
    redoStack.length = 0;
  }

  function undo(currentEntities: Entity[]): Entity[] | null {
    if (undoStack.length === 0) return null;

    redoStack.push({
      entities: JSON.parse(JSON.stringify(currentEntities)),
    });

    const previous = undoStack.pop()!;
    return previous.entities;
  }

  function redo(currentEntities: Entity[]): Entity[] | null {
    if (redoStack.length === 0) return null;

    undoStack.push({
      entities: JSON.parse(JSON.stringify(currentEntities)),
    });

    const next = redoStack.pop()!;
    return next.entities;
  }

  function canUndo(): boolean {
    return undoStack.length > 0;
  }

  function canRedo(): boolean {
    return redoStack.length > 0;
  }

  function clear() {
    undoStack.length = 0;
    redoStack.length = 0;
  }

  return {
    saveToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    clear,
  };
}
