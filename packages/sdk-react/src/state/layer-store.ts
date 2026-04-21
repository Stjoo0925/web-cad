/**
 * layer-store.ts
 * Layer State Management
 *
 * Manages layers with color, linetype, lineweight, visibility, and lock states.
 */

export interface Point {
  x: number;
  y: number;
}

export interface Layer {
  name: string;
  color: string;
  colorIndex: number;
  linetype: string;
  lineweight: number;
  visible: boolean;
  locked: boolean;
  frozen: boolean;
  plotStyle: string;
  description: string;
}

export interface Linetype {
  name: string;
  pattern: number[];
  description: string;
}

export interface Lineweight {
  value: number;
  displayName: string;
}

export interface LayerStoreState {
  layers: Map<string, Layer>;
  activeLayer: string;
  defaultLayer: string;
  linetypes: Map<string, Linetype>;
  lineweights: Lineweight[];
}

export interface LayerStoreOptions {
  onLayerChange?: (layerName: string) => void;
  onActiveLayerChange?: (layerName: string) => void;
}

/**
 * Predefined linetypes
 */
export const PREDEFINED_LINETYPES: Linetype[] = [
  { name: "CONTINUOUS", pattern: [], description: "Solid line" },
  { name: "DASHED", pattern: [10, 5], description: "Dashed line" },
  { name: "DASHDOT", pattern: [10, 3, 2, 3], description: "Dash dot line" },
  { name: "DOT", pattern: [2, 3], description: "Dotted line" },
  { name: "CENTER", pattern: [20, 5, 3, 5], description: "Center line" },
  { name: "BORDER", pattern: [10, 5, 5, 5], description: "Border line" },
  {
    name: "PHANTOM",
    pattern: [20, 5, 5, 5, 5, 5],
    description: "Phantom line",
  },
  { name: "DIVIDE", pattern: [10, 3, 3, 3], description: "Divide line" },
  { name: "HIDDEN", pattern: [10, 5], description: "Hidden line" },
];

/**
 * Predefined lineweights
 */
export const PREDEFINED_LINEWEIGHTS: Lineweight[] = [
  { value: 0, displayName: "0.00 mm" },
  { value: 0.13, displayName: "0.05 mm" },
  { value: 0.18, displayName: "0.07 mm" },
  { value: 0.25, displayName: "0.10 mm" },
  { value: 0.35, displayName: "0.14 mm" },
  { value: 0.5, displayName: "0.20 mm" },
  { value: 0.7, displayName: "0.28 mm" },
  { value: 1.0, displayName: "0.35 mm" },
  { value: 1.5, displayName: "0.50 mm" },
  { value: 2.0, displayName: "0.70 mm" },
];

/**
 * Default layer colors (AutoCAD index colors)
 */
export const LAYER_COLORS: { index: number; name: string; hex: string }[] = [
  { index: 1, name: "Red", hex: "#ff0000" },
  { index: 2, name: "Yellow", hex: "#ffff00" },
  { index: 3, name: "Green", hex: "#00ff00" },
  { index: 4, name: "Cyan", hex: "#00ffff" },
  { index: 5, name: "Blue", hex: "#0000ff" },
  { index: 6, name: "Magenta", hex: "#ff00ff" },
  { index: 7, name: "White/Black", hex: "#ffffff" },
  { index: 8, name: "Gray", hex: "#808080" },
  { index: 9, name: "Dark Gray", hex: "#404040" },
];

/**
 * Creates a Layer Store instance.
 */
export function createLayerStore(options: LayerStoreOptions = {}) {
  const { onLayerChange, onActiveLayerChange } = options;

  const state: LayerStoreState = {
    layers: new Map(),
    activeLayer: "0",
    defaultLayer: "0",
    linetypes: new Map(PREDEFINED_LINETYPES.map((lt) => [lt.name, lt])),
    lineweights: [...PREDEFINED_LINEWEIGHTS],
  };

  // Initialize with default layer
  state.layers.set("0", {
    name: "0",
    color: "#ffffff",
    colorIndex: 7,
    linetype: "CONTINUOUS",
    lineweight: 0.25,
    visible: true,
    locked: false,
    frozen: false,
    plotStyle: "Normal",
    description: "Default layer",
  });

  /**
   * Create a new layer
   */
  function createLayer(
    name: string,
    options?: {
      color?: string;
      linetype?: string;
      lineweight?: number;
      visible?: boolean;
      locked?: boolean;
    },
  ): Layer | null {
    if (state.layers.has(name)) {
      return null; // Layer already exists
    }

    const layer: Layer = {
      name,
      color: options?.color ?? "#ffffff",
      colorIndex: 7,
      linetype: options?.linetype ?? "CONTINUOUS",
      lineweight: options?.lineweight ?? 0.25,
      visible: options?.visible ?? true,
      locked: options?.locked ?? false,
      frozen: false,
      plotStyle: "Normal",
      description: "",
    };

    state.layers.set(name, layer);
    return layer;
  }

  /**
   * Get layer by name
   */
  function getLayer(name: string): Layer | undefined {
    return state.layers.get(name);
  }

  /**
   * Get all layers
   */
  function getAllLayers(): Layer[] {
    return Array.from(state.layers.values());
  }

  /**
   * Update layer properties
   */
  function updateLayer(
    name: string,
    updates: Partial<Omit<Layer, "name">>,
  ): boolean {
    const layer = state.layers.get(name);
    if (!layer) return false;

    Object.assign(layer, updates);

    if (onLayerChange) {
      onLayerChange(name);
    }

    return true;
  }

  /**
   * Delete layer
   */
  function deleteLayer(name: string): boolean {
    if (name === "0" || name === state.defaultLayer) {
      return false; // Cannot delete default layer
    }

    const result = state.layers.delete(name);

    // If deleted layer was active, switch to default
    if (state.activeLayer === name) {
      setActiveLayer(state.defaultLayer);
    }

    return result;
  }

  /**
   * Set active layer
   */
  function setActiveLayer(name: string): boolean {
    if (!state.layers.has(name)) {
      return false;
    }

    state.activeLayer = name;

    if (onActiveLayerChange) {
      onActiveLayerChange(name);
    }

    return true;
  }

  /**
   * Get active layer
   */
  function getActiveLayer(): Layer | undefined {
    return state.layers.get(state.activeLayer);
  }

  /**
   * Rename layer
   */
  function renameLayer(oldName: string, newName: string): boolean {
    const layer = state.layers.get(oldName);
    if (!layer || state.layers.has(newName)) {
      return false;
    }

    state.layers.delete(oldName);
    layer.name = newName;
    state.layers.set(newName, layer);

    if (state.activeLayer === oldName) {
      state.activeLayer = newName;
    }

    return true;
  }

  /**
   * Toggle layer visibility
   */
  function toggleVisibility(name: string): boolean {
    const layer = state.layers.get(name);
    if (!layer) return false;

    layer.visible = !layer.visible;

    if (onLayerChange) {
      onLayerChange(name);
    }

    return true;
  }

  /**
   * Toggle layer lock
   */
  function toggleLock(name: string): boolean {
    const layer = state.layers.get(name);
    if (!layer) return false;

    layer.locked = !layer.locked;

    if (onLayerChange) {
      onLayerChange(name);
    }

    return true;
  }

  /**
   * Toggle layer freeze
   */
  function toggleFreeze(name: string): boolean {
    const layer = state.layers.get(name);
    if (!layer) return false;

    layer.frozen = !layer.frozen;

    if (onLayerChange) {
      onLayerChange(name);
    }

    return true;
  }

  /**
   * Set layer color
   */
  function setLayerColor(
    name: string,
    color: string,
    colorIndex?: number,
  ): boolean {
    const layer = state.layers.get(name);
    if (!layer) return false;

    layer.color = color;
    if (colorIndex !== undefined) {
      layer.colorIndex = colorIndex;
    }

    if (onLayerChange) {
      onLayerChange(name);
    }

    return true;
  }

  /**
   * Set layer linetype
   */
  function setLayerLinetype(name: string, linetype: string): boolean {
    const layer = state.layers.get(name);
    if (!layer) return false;

    layer.linetype = linetype;

    if (onLayerChange) {
      onLayerChange(name);
    }

    return true;
  }

  /**
   * Set layer lineweight
   */
  function setLayerLineweight(name: string, lineweight: number): boolean {
    const layer = state.layers.get(name);
    if (!layer) return false;

    layer.lineweight = lineweight;

    if (onLayerChange) {
      onLayerChange(name);
    }

    return true;
  }

  /**
   * Add custom linetype
   */
  function addLinetype(linetype: Linetype): boolean {
    if (state.linetypes.has(linetype.name)) {
      return false;
    }

    state.linetypes.set(linetype.name, linetype);
    return true;
  }

  /**
   * Get linetype by name
   */
  function getLinetype(name: string): Linetype | undefined {
    return state.linetypes.get(name);
  }

  /**
   * Get all linetypes
   */
  function getAllLinetypes(): Linetype[] {
    return Array.from(state.linetypes.values());
  }

  /**
   * Get lineweight options
   */
  function getLineweights(): Lineweight[] {
    return [...state.lineweights];
  }

  /**
   * Clear all layers (except default)
   */
  function clear(): void {
    for (const name of state.layers.keys()) {
      if (name !== "0") {
        state.layers.delete(name);
      }
    }
    state.activeLayer = "0";
  }

  function getState(): LayerStoreState {
    return {
      layers: new Map(state.layers),
      activeLayer: state.activeLayer,
      defaultLayer: state.defaultLayer,
      linetypes: new Map(state.linetypes),
      lineweights: [...state.lineweights],
    };
  }

  return {
    createLayer,
    getLayer,
    getAllLayers,
    updateLayer,
    deleteLayer,
    setActiveLayer,
    getActiveLayer,
    renameLayer,
    toggleVisibility,
    toggleLock,
    toggleFreeze,
    setLayerColor,
    setLayerLinetype,
    setLayerLineweight,
    addLinetype,
    getLinetype,
    getAllLinetypes,
    getLineweights,
    clear,
    getState,
  };
}
