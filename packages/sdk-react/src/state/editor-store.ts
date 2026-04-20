export const EDITOR_TOOLS = {
  SELECT: "select",
  LINE: "line",
  POLYLINE: "polyline"
} as const;

export type EditorToolType = (typeof EDITOR_TOOLS)[keyof typeof EDITOR_TOOLS];

export const VIEW_MODES = {
  CAD_2D: "2d-cad",
  CAD_3D: "3d",
  POINT_CLOUD: "point-cloud"
} as const;

export type ViewModeType = (typeof VIEW_MODES)[keyof typeof VIEW_MODES];

export interface EditorState {
  tool: EditorToolType;
  selection: string[];
  viewMode: ViewModeType;
  zoom: number;
  pan: { x: number; y: number };
  mapActive: boolean;
}

export interface EditorStore {
  subscribe: (listener: (state: EditorState) => void) => () => void;
  setTool: (tool: EditorToolType) => void;
  setSelection: (entityIds: string[]) => void;
  setViewMode: (viewMode: ViewModeType) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  getState: () => EditorState;
}

export function createEditorStore(): EditorStore {
  let state: EditorState = {
    tool: EDITOR_TOOLS.SELECT,
    selection: [],
    viewMode: VIEW_MODES.CAD_2D,
    zoom: 1,
    pan: { x: 0, y: 0 },
    mapActive: false
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
    getState
  };
}
