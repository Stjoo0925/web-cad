import { createContext, useContext } from "react";

export const EDITOR_TOOLS = {
  SELECT: "select",
  LINE: "line",
  POLYLINE: "polyline"
};

export const VIEW_MODES = {
  CAD_2D: "2d-cad",
  CAD_3D: "3d",
  POINT_CLOUD: "point-cloud"
};

export function createEditorStore() {
  let state = {
    tool: EDITOR_TOOLS.SELECT,
    selection: [],
    viewMode: VIEW_MODES.CAD_2D,
    zoom: 1,
    pan: { x: 0, y: 0 },
    mapActive: false
  };

  const listeners = new Set();

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const notify = () => {
    for (const listener of listeners) {
      listener(state);
    }
  };

  const setTool = (tool) => {
    state = { ...state, tool };
    notify();
  };

  const setSelection = (entityIds) => {
    state = { ...state, selection: entityIds };
    notify();
  };

  const setViewMode = (viewMode) => {
    state = { ...state, viewMode, mapActive: viewMode === VIEW_MODES.CAD_2D };
    notify();
  };

  const setZoom = (zoom) => {
    state = { ...state, zoom };
    notify();
  };

  const setPan = (pan) => {
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

export const EditorStoreContext = createContext(null);

export function useEditorStore() {
  const context = useContext(EditorStoreContext);
  if (!context) {
    throw new Error("useEditorStore must be used within EditorStoreProvider");
  }
  return context;
}