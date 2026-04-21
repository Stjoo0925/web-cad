/**
 * keyboard-shortcuts.ts
 * Keyboard Shortcuts Handler
 *
 * Handles all keyboard shortcuts for CAD operations:
 * - Ctrl+C/V/Z/Y/A for copy/paste/undo/redo/select all
 * - F1-F11 function keys for OSNAP/GRID/ORTHO/SNAP/Polar toggles
 * - Delete for entity deletion
 */

import { getCommandRegistry } from "../commands/command-registry.js";

export interface KeyboardShortcutOptions {
  onCopy?: () => void;
  onPaste?: () => void;
  onCut?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSelectAll?: () => void;
  onDelete?: () => void;
  onHelp?: () => void;
  onCommandHistory?: () => void;
  onOSNAPToggle?: () => void;
  onGridToggle?: () => void;
  onOrthoToggle?: () => void;
  onSnapToggle?: () => void;
  onPolarToggle?: () => void;
  onOTrackToggle?: () => void;
  onQuickZoom?: () => void;
  onZoomExtent?: () => void;
  onZoomWindow?: () => void;
  onPan?: () => void;
  onEscape?: () => void;
}

export interface ShortcutHandler {
  register(container: HTMLElement | Window): () => void;
  unregister(): void;
}

/**
 * Command aliases (AutoCAD-style) - legacy compatibility
 * CommandRegistry handles alias resolution internally
 */
export const COMMAND_ALIASES: Record<string, string> = {
  L: "LINE",
  C: "CIRCLE",
  A: "ARC",
  PL: "POLYLINE",
  EL: "ELLIPSE",
  H: "HATCH",
  B: "BLOCK",
  I: "INSERT",
  M: "MOVE",
  CO: "COPY",
  MI: "MIRROR",
  RO: "ROTATE",
  SC: "SCALE",
  TR: "TRIM",
  EX: "EXTEND",
  F: "FILLET",
  CHA: "CHAMFER",
  O: "OFFSET",
  ST: "STRETCH",
  BR: "BREAK",
  J: "JOIN",
  LI: "LIST",
  LS: "LIST",
  DI: "DIST",
  AREA: "AREA",
  ID: "ID",
  UNITS: "UNITS",
  OSNAP: "OSNAP",
  SNAP: "SNAP",
  GRID: "GRID",
  ORTHO: "ORTHO",
  POLAR: "POLAR",
  LAYER: "LAYER",
  LA: "LAYER",
  STYLE: "STYLE",
  DIM: "DIMENSION",
  DXF: "DXF",
  SAVE: "SAVE",
  QSAVE: "SAVE",
  OPEN: "OPEN",
  NEW: "NEW",
  UNDO: "UNDO",
  U: "UNDO",
  REDO: "REDO",
  REGEN: "REGEN",
};

/**
 * Function key mappings
 */
export const FUNCTION_KEYS: Record<
  string,
  { key: string; description: string }
> = {
  F1: { key: "Help", description: "Display help" },
  F2: { key: "Command History", description: "Toggle command history" },
  F3: { key: "OSNAP", description: "Toggle object snap" },
  F4: { key: "Tablet", description: "Tablet mode (not implemented)" },
  F5: { key: "Isoplane", description: "Toggle isoplane" },
  F6: { key: "UCSICON", description: "Toggle UCS icon" },
  F7: { key: "GRID", description: "Toggle grid display" },
  F8: { key: "ORTHO", description: "Toggle ortho mode" },
  F9: { key: "SNAP", description: "Toggle snap mode" },
  F10: { key: "Polar", description: "Toggle polar tracking" },
  F11: { key: "OTrack", description: "Toggle object snap tracking" },
  F12: { key: "DYN", description: "Toggle dynamic input" },
};

/**
 * Creates a keyboard shortcuts handler.
 */
export function createKeyboardShortcuts(
  options: KeyboardShortcutOptions = {},
): ShortcutHandler {
  const {
    onCopy,
    onPaste,
    onCut,
    onUndo,
    onRedo,
    onSelectAll,
    onDelete,
    onHelp,
    onCommandHistory,
    onOSNAPToggle,
    onGridToggle,
    onOrthoToggle,
    onSnapToggle,
    onPolarToggle,
    onOTrackToggle,
    onQuickZoom,
    onZoomExtent,
    onZoomWindow,
    onPan,
    onEscape,
  } = options;

  let registered = false;
  let container: HTMLElement | Window | null = null;

  /**
   * Handle key down event
   */
  function handleKeyDown(e: KeyboardEvent) {
    // Ignore if typing in input fields
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable
    ) {
      // Allow Escape in input fields
      if (e.key === "Escape") {
        onEscape?.();
        return;
      }
      return;
    }

    const key = e.key.toUpperCase();
    const ctrl = e.ctrlKey || e.metaKey;
    const shift = e.shiftKey;
    const alt = e.altKey;

    // Ctrl shortcuts
    if (ctrl) {
      switch (key) {
        case "C":
          e.preventDefault();
          onCopy?.();
          return;
        case "V":
          e.preventDefault();
          onPaste?.();
          return;
        case "X":
          e.preventDefault();
          onCut?.();
          return;
        case "Z":
          e.preventDefault();
          if (shift) {
            onRedo?.();
          } else {
            onUndo?.();
          }
          return;
        case "Y":
          e.preventDefault();
          onRedo?.();
          return;
        case "A":
          e.preventDefault();
          onSelectAll?.();
          return;
      }
      return;
    }

    // Delete key
    if (key === "DELETE" || key === "DEL") {
      e.preventDefault();
      onDelete?.();
      return;
    }

    // Escape
    if (key === "ESCAPE" || e.key === "Escape") {
      onEscape?.();
      return;
    }

    // Function keys
    if (!alt && !ctrl && !shift) {
      switch (key) {
        case "F1":
          e.preventDefault();
          onHelp?.();
          return;
        case "F2":
          e.preventDefault();
          onCommandHistory?.();
          return;
        case "F3":
          e.preventDefault();
          onOSNAPToggle?.();
          return;
        case "F4":
          // Tablet mode - not implemented
          return;
        case "F5":
          // Isoplane - not implemented
          return;
        case "F6":
          // UCSICON - not implemented
          return;
        case "F7":
          e.preventDefault();
          onGridToggle?.();
          return;
        case "F8":
          e.preventDefault();
          onOrthoToggle?.();
          return;
        case "F9":
          e.preventDefault();
          onSnapToggle?.();
          return;
        case "F10":
          e.preventDefault();
          onPolarToggle?.();
          return;
        case "F11":
          e.preventDefault();
          onOTrackToggle?.();
          return;
        case "F12":
          // DYN toggle - not implemented
          return;
      }
    }

    // Arrow keys for value increment/decrement
    if (target.tagName !== "INPUT") {
      const arrowHandled = handleArrowKeys(e);
      if (arrowHandled) return;
    }
  }

  /**
   * Handle arrow keys for value adjustment
   */
  function handleArrowKeys(e: KeyboardEvent): boolean {
    if (e.ctrlKey || e.altKey || e.metaKey) return false;

    switch (e.key) {
      case "ArrowUp":
      case "ArrowDown":
      case "ArrowLeft":
      case "ArrowRight":
        e.preventDefault();
        // These would be handled by dynamic input or numeric input
        return true;
      default:
        return false;
    }
  }

  /**
   * Register keyboard event listeners
   */
  function register(container: HTMLElement | Window): () => void {
    if (registered) {
      unregister();
    }

    container.addEventListener("keydown", handleKeyDown as EventListener);
    registered = true;
    container = container;

    return unregister;
  }

  /**
   * Unregister keyboard event listeners
   */
  function unregister() {
    if (container && registered) {
      container.removeEventListener("keydown", handleKeyDown as EventListener);
      registered = false;
      container = null;
    }
  }

  return {
    register,
    unregister,
  };
}

/**
 * Get command from alias or direct input using CommandRegistry
 */
export function resolveCommand(input: string): string {
  const registry = getCommandRegistry();
  const resolved = registry.resolve(input);
  return resolved?.name ?? input.toUpperCase().trim();
}
