/**
 * xref-manager.ts
 * External Reference (Xref) Manager
 *
 * Manages external DXF file references that can be attached to drawings.
 * Supports binding, reload, and unload operations.
 */

export interface Point {
  x: number;
  y: number;
}

export interface XrefBinding {
  /** Path to the external file */
  path: string;
  /** Display name */
  name: string;
  /** Whether to bind on load */
  bindOnLoad: boolean;
  /** Rotation angle in degrees */
  rotation: number;
  /** Scale factors */
  scale: { x: number; y: number };
  /** Insertion point */
  insertionPoint: Point;
}

export interface XrefInstance {
  id: string;
  type: "XREF";
  name: string;
  path: string;
  status: "loaded" | "unloaded" | "error" | "not_found";
  insertionPoint: Point;
  rotation: number;
  scale: { x: number; y: number };
  entities?: unknown[];
  loadedAt?: Date;
}

export interface XrefManagerState {
  xrefs: Map<string, XrefInstance>;
  activeXrefId: string | null;
}

export interface XrefManagerOptions {
  onLoad?: (xref: XrefInstance) => void;
  onUnload?: (xref: XrefInstance) => void;
  onError?: (xref: XrefInstance, error: string) => void;
  onStatusChange?: (xref: XrefInstance) => void;
}

/**
 * Creates an XREF Manager instance.
 */
export function createXrefManager(options: XrefManagerOptions = {}) {
  const { onLoad, onUnload, onError, onStatusChange } = options;

  const state: XrefManagerState = {
    xrefs: new Map(),
    activeXrefId: null,
  };

  /**
   * Attach external reference file
   */
  function attach(
    path: string,
    name?: string,
    insertionPoint?: Point,
  ): XrefInstance {
    const displayName = name ?? extractFileName(path);
    const id = generateId();

    const xref: XrefInstance = {
      id,
      type: "XREF",
      name: displayName,
      path,
      status: "loaded",
      insertionPoint: insertionPoint ?? { x: 0, y: 0 },
      rotation: 0,
      scale: { x: 1, y: 1 },
    };

    state.xrefs.set(id, xref);

    if (onLoad) {
      onLoad(xref);
    }

    return xref;
  }

  /**
   * Detach external reference
   */
  function detach(xrefId: string): boolean {
    const xref = state.xrefs.get(xrefId);
    if (!xref) return false;

    state.xrefs.delete(xrefId);

    if (onUnload) {
      onUnload(xref);
    }

    return true;
  }

  /**
   * Reload external reference
   */
  async function reload(xrefId: string): Promise<boolean> {
    const xref = state.xrefs.get(xrefId);
    if (!xref) return false;

    xref.status = "loaded";
    xref.loadedAt = new Date();

    if (onStatusChange) {
      onStatusChange(xref);
    }

    return true;
  }

  /**
   * Unload external reference (keep reference, remove entities)
   */
  function unload(xrefId: string): boolean {
    const xref = state.xrefs.get(xrefId);
    if (!xref) return false;

    xref.status = "unloaded";
    xref.entities = undefined;

    if (onStatusChange) {
      onStatusChange(xref);
    }

    return true;
  }

  /**
   * Bind xref (convert to regular entities)
   */
  function bind(xrefId: string): unknown[] | null {
    const xref = state.xrefs.get(xrefId);
    if (!xref || !xref.entities) return null;

    // Return the entities (binding converts xref to regular entities)
    return xref.entities;
  }

  /**
   * Set xref insertion point
   */
  function setInsertionPoint(xrefId: string, point: Point) {
    const xref = state.xrefs.get(xrefId);
    if (xref) {
      xref.insertionPoint = { ...point };
    }
  }

  /**
   * Set xref rotation
   */
  function setRotation(xrefId: string, angle: number) {
    const xref = state.xrefs.get(xrefId);
    if (xref) {
      xref.rotation = angle;
    }
  }

  /**
   * Set xref scale
   */
  function setScale(xrefId: string, scale: { x: number; y: number }) {
    const xref = state.xrefs.get(xrefId);
    if (xref) {
      xref.scale = { ...scale };
    }
  }

  /**
   * Get all xrefs
   */
  function getAllXrefs(): XrefInstance[] {
    return Array.from(state.xrefs.values());
  }

  /**
   * Get xref by ID
   */
  function getXref(xrefId: string): XrefInstance | undefined {
    return state.xrefs.get(xrefId);
  }

  /**
   * Get xref by name
   */
  function getXrefByName(name: string): XrefInstance | undefined {
    for (const xref of state.xrefs.values()) {
      if (xref.name === name) return xref;
    }
    return undefined;
  }

  /**
   * Set active xref for editing
   */
  function setActiveXref(xrefId: string | null) {
    state.activeXrefId = xrefId;
  }

  /**
   * Get active xref
   */
  function getActiveXref(): XrefInstance | null {
    if (!state.activeXrefId) return null;
    return state.xrefs.get(state.activeXrefId) ?? null;
  }

  /**
   * Update xref status
   */
  function updateStatus(xrefId: string, status: XrefInstance["status"]) {
    const xref = state.xrefs.get(xrefId);
    if (xref) {
      xref.status = status;

      if (onStatusChange) {
        onStatusChange(xref);
      }
    }
  }

  /**
   * Clear all xrefs
   */
  function clear() {
    state.xrefs.clear();
    state.activeXrefId = null;
  }

  function getState(): XrefManagerState {
    return {
      xrefs: new Map(state.xrefs),
      activeXrefId: state.activeXrefId,
    };
  }

  return {
    attach,
    detach,
    reload,
    unload,
    bind,
    setInsertionPoint,
    setRotation,
    setScale,
    getAllXrefs,
    getXref,
    getXrefByName,
    setActiveXref,
    getActiveXref,
    updateStatus,
    clear,
    getState,
  };
}

/**
 * Extract filename from path
 */
function extractFileName(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/");
  const fileName = parts[parts.length - 1];
  // Remove extension
  return fileName.replace(/\.[^.]+$/, "");
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `xref-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
