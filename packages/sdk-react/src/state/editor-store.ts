/**
 * editor-store.ts
 * Editor state store with unified contracts
 */
export {
  EDITOR_TOOLS,
  VIEW_MODES,
  EDITOR_EVENTS,
  type EditorToolType,
  type ViewModeType,
  type EditorState,
  type EditorStore,
  type EditorEventType,
  type EditorEvent,
  type Point,
  type Viewport,
  type Entity,
  type EntityType,
  type DocumentMetadata,
  type LayerColor,
  type Layer,
  type LayerStateType,
  generateEntityId,
  createEntity,
} from "./editor-contracts.js";

import {
  EDITOR_TOOLS,
  VIEW_MODES,
  type EditorToolType,
  type ViewModeType,
  type EditorState,
  type EditorStore,
} from "./editor-contracts.js";

export { createEditorStore };

function createEditorStore(): EditorStore {
  let state: EditorState = {
    tool: EDITOR_TOOLS.SELECT,
    selection: [],
    viewMode: VIEW_MODES.CAD_2D,
    zoom: 1,
    pan: { x: 0, y: 0 },
    mapActive: false,
  };

  const listeners = new Set<(state: EditorState) => void>();

  const subscribe = (listener: (state: EditorState) => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const notify = () => {
    for (const listener of listeners) {
      listener(state);
    }
  };

  const setTool = (tool: EditorToolType) => {
    state = { ...state, tool };
    notify();
  };

  const setSelection = (entityIds: string[]) => {
    state = { ...state, selection: entityIds };
    notify();
  };

  const setViewMode = (viewMode: ViewModeType) => {
    state = { ...state, viewMode, mapActive: viewMode === VIEW_MODES.CAD_2D };
    notify();
  };

  const setZoom = (zoom: number) => {
    state = { ...state, zoom };
    notify();
  };

  const setPan = (pan: { x: number; y: number }) => {
    state = { ...state, pan };
    notify();
  };

  const getState = () => state;

  return {
    subscribe,
    setTool,
    setSelection,
    setViewMode,
    setZoom,
    setPan,
    getState,
  };
}
