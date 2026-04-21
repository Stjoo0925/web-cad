/**
 * ucs-manager.ts
 * User Coordinate System (UCS) Manager
 *
 * Manages user coordinate systems for 2D/3D drawing:
 * - Origin translation
 * - Axis rotation
 * - Named UCS storage
 */

export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface UCS {
  name: string;
  origin: Point;
  xAxis: Point;
  yAxis: Point;
  zAxis: Point;
  isPersistant: boolean;
}

export interface UCSManagerState {
  currentUCS: UCS;
  savedUCSs: Map<string, UCS>;
  isEditing: boolean;
}

export interface UCSManagerOptions {
  onUCSChange?: (ucs: UCS) => void;
}

/**
 * Creates a UCS Manager instance.
 */
export function createUCSManager(options: UCSManagerOptions = {}) {
  const { onUCSChange } = options;

  // Default World Coordinate System
  const worldUCS: UCS = {
    name: "World",
    origin: { x: 0, y: 0, z: 0 },
    xAxis: { x: 1, y: 0, z: 0 },
    yAxis: { x: 0, y: 1, z: 0 },
    zAxis: { x: 0, y: 0, z: 1 },
    isPersistant: true,
  };

  const state: UCSManagerState = {
    currentUCS: { ...worldUCS },
    savedUCSs: new Map(),
    isEditing: false,
  };

  /**
   * Get current UCS
   */
  function getCurrentUCS(): UCS {
    return { ...state.currentUCS };
  }

  /**
   * Set UCS origin
   */
  function setOrigin(origin: Point) {
    state.currentUCS.origin = { ...origin };

    if (onUCSChange) {
      onUCSChange(state.currentUCS);
    }
  }

  /**
   * Set UCS by origin and rotation angle
   */
  function setByAngle(origin: Point, angleDeg: number) {
    const angleRad = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    state.currentUCS = {
      name: "Unnamed",
      origin: { ...origin },
      xAxis: { x: cos, y: sin, z: 0 },
      yAxis: { x: -sin, y: cos, z: 0 },
      zAxis: { x: 0, y: 0, z: 1 },
      isPersistant: false,
    };

    if (onUCSChange) {
      onUCSChange(state.currentUCS);
    }
  }

  /**
   * Set UCS by 3 points (origin, x-axis point, y-axis point)
   */
  function setBy3Points(origin: Point, xPoint: Point, yPoint: Point) {
    const xAxis = normalize(subtract(xPoint, origin));
    const zAxis = crossProduct(xAxis, subtract(yPoint, origin));
    const yAxis = crossProduct(zAxis, xAxis);

    state.currentUCS = {
      name: "Unnamed",
      origin: { ...origin },
      xAxis,
      yAxis,
      zAxis,
      isPersistant: false,
    };

    if (onUCSChange) {
      onUCSChange(state.currentUCS);
    }
  }

  /**
   * Reset to World Coordinate System
   */
  function resetToWorld() {
    state.currentUCS = { ...worldUCS, name: "World" };

    if (onUCSChange) {
      onUCSChange(state.currentUCS);
    }
  }

  /**
   * Save current UCS with a name
   */
  function saveUCS(name: string): boolean {
    if (state.savedUCSs.has(name)) {
      return false; // Name already exists
    }

    state.savedUCSs.set(name, {
      ...state.currentUCS,
      name,
      isPersistant: true,
    });

    return true;
  }

  /**
   * Restore a saved UCS
   */
  function restoreUCS(name: string): boolean {
    const ucs = state.savedUCSs.get(name);
    if (!ucs) return false;

    state.currentUCS = { ...ucs };

    if (onUCSChange) {
      onUCSChange(state.currentUCS);
    }

    return true;
  }

  /**
   * Delete a saved UCS
   */
  function deleteUCS(name: string): boolean {
    // Cannot delete World UCS
    if (name === "World") return false;

    return state.savedUCSs.delete(name);
  }

  /**
   * Get all saved UCSs
   */
  function getSavedUCSs(): UCS[] {
    return Array.from(state.savedUCSs.values());
  }

  /**
   * Rename saved UCS
   */
  function renameUCS(oldName: string, newName: string): boolean {
    const ucs = state.savedUCSs.get(oldName);
    if (!ucs || state.savedUCSs.has(newName)) return false;

    state.savedUCSs.delete(oldName);
    ucs.name = newName;
    state.savedUCSs.set(newName, ucs);

    return true;
  }

  /**
   * Transform point from world to current UCS
   */
  function worldToUCS(point: Point): Point {
    const { origin, xAxis, yAxis, zAxis } = state.currentUCS;

    const dx = point.x - origin.x;
    const dy = point.y - origin.y;
    const dz = (point.z ?? 0) - (origin.z ?? 0);

    return {
      x: dx * xAxis.x + dy * yAxis.x + dz * (zAxis.x ?? 0),
      y: dx * xAxis.y + dy * yAxis.y + dz * (zAxis.y ?? 0),
      z: dx * (xAxis.z ?? 0) + dy * (yAxis.z ?? 0) + dz * (zAxis.z ?? 0),
    };
  }

  /**
   * Transform point from current UCS to world
   */
  function ucsToWorld(point: Point): Point {
    const { origin, xAxis, yAxis, zAxis } = state.currentUCS;

    return {
      x:
        origin.x +
        point.x * xAxis.x +
        point.y * yAxis.x +
        (point.z ?? 0) * zAxis.x,
      y:
        origin.y +
        point.x * xAxis.y +
        point.y * yAxis.y +
        (point.z ?? 0) * zAxis.y,
      z:
        (origin.z ?? 0) +
        point.x * (xAxis.z ?? 0) +
        point.y * (yAxis.z ?? 0) +
        (point.z ?? 0) * (zAxis.z ?? 0),
    };
  }

  /**
   * Get X axis direction in world coordinates
   */
  function getXAxisWorld(): Point {
    return {
      ...state.currentUCS.origin,
      x: state.currentUCS.origin.x + state.currentUCS.xAxis.x,
      y: state.currentUCS.origin.y + state.currentUCS.xAxis.y,
    };
  }

  /**
   * Get Y axis direction in world coordinates
   */
  function getYAxisWorld(): Point {
    return {
      ...state.currentUCS.origin,
      x: state.currentUCS.origin.x + state.currentUCS.yAxis.x,
      y: state.currentUCS.origin.y + state.currentUCS.yAxis.y,
    };
  }

  function getState(): UCSManagerState {
    return {
      currentUCS: { ...state.currentUCS },
      savedUCSs: new Map(state.savedUCSs),
      isEditing: state.isEditing,
    };
  }

  // Helper functions
  function subtract(a: Point, b: Point): Point {
    return { x: a.x - b.x, y: a.y - b.y, z: (a.z ?? 0) - (b.z ?? 0) };
  }

  function normalize(p: Point): Point {
    const len = Math.hypot(p.x, p.y, p.z ?? 0);
    if (len < 0.0001) return { x: 1, y: 0, z: 0 };
    return { x: p.x / len, y: p.y / len, z: (p.z ?? 0) / len };
  }

  function crossProduct(a: Point, b: Point): Point {
    return {
      x: a.y * (b.z ?? 0) - (a.z ?? 0) * b.y,
      y: (a.z ?? 0) * b.x - a.x * (b.z ?? 0),
      z: a.x * b.y - a.y * b.x,
    };
  }

  return {
    getCurrentUCS,
    setOrigin,
    setByAngle,
    setBy3Points,
    resetToWorld,
    saveUCS,
    restoreUCS,
    deleteUCS,
    getSavedUCSs,
    renameUCS,
    worldToUCS,
    ucsToWorld,
    getXAxisWorld,
    getYAxisWorld,
    getState,
  };
}
