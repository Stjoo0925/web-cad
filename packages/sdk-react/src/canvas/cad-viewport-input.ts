/**
 * Pure math functions for viewport coordinate transformation.
 * These can be tested without DOM infrastructure.
 */

import type { Point, Viewport } from "./cad-canvas-renderer.js";

/**
 * Transform a screen-space point to world-space coordinates.
 *
 * @param screenPoint - Point in screen (pixel) coordinates
 * @param viewport    - Current viewport state (width, height, pan, zoom)
 * @returns Point in world-space coordinates
 */
export function screenToWorld(screenPoint: Point, viewport: Viewport): Point {
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  return {
    x: (screenPoint.x - cx) / viewport.zoom + viewport.pan.x,
    y: (screenPoint.y - cy) / viewport.zoom + viewport.pan.y,
  };
}

/**
 * Read the current bounding rect of an HTML element.
 * Must be called inside an event handler — never cached —
 * because layout shifts (e.g. fullscreen toggle) invalidate cached values.
 *
 * @param element - The element whose bounds to read
 * @returns Viewport-like object with x, y, width, height
 */
export function getViewportFromElement(element: HTMLElement): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  };
}
