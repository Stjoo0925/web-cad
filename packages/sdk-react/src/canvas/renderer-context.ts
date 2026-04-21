/**
 * renderer-context.ts
 * Renderer Interface - Abstraction layer for Canvas 2D and WebGL2 renderers
 *
 * Provides IRenderer interface for GPU-accelerated rendering.
 * Canvas 2D is used as fallback when WebGL2 is not available.
 */

import { createWebGL2Renderer } from "./webgl2-renderer.js";

export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Viewport {
  width: number;
  height: number;
  pan: Point;
  zoom: number;
}

export type Linetype =
  | "CONTINUOUS"
  | "DASHED"
  | "DASHDOT"
  | "DOT"
  | "CENTER"
  | "BORDER";

export interface LineStyle {
  color: string;
  width: number;
  linetype?: Linetype;
  opacity?: number;
}

export interface TextStyle {
  color: string;
  fontFamily: string;
  fontSize: number;
  bold?: boolean;
  italic?: boolean;
  rotation?: number;
  alignment?: "left" | "center" | "right";
  opacity?: number;
}

export interface FillStyle {
  fillColor: string;
  pattern?: string;
  scale?: number;
  rotation?: number;
  opacity?: number;
}

export interface MeshStyle {
  color: string;
  wireframe?: boolean;
  flatShading?: boolean;
}

/**
 * Renderer interface - abstraction for 2D/3D rendering backends
 */
export interface IRenderer {
  /**
   * Initialize renderer with canvas element
   */
  initialize(canvas: HTMLCanvasElement): void;

  /**
   * Resize viewport
   */
  resize(width: number, height: number): void;

  /**
   * Get rendering context info
   */
  getInfo(): RendererInfo;

  /**
   * Check if WebGL2 is available
   */
  isWebGL(): boolean;

  // ========== Frame Management ==========

  /**
   * Begin new frame
   */
  beginFrame(): void;

  /**
   * End frame and swap buffers
   */
  endFrame(): void;

  // ========== 2D Drawing Primitives ==========

  /**
   * Draw a line segment
   */
  drawLine(start: Point, end: Point, style: LineStyle): void;

  /**
   * Draw a circle (outline only)
   */
  drawCircle(center: Point, radius: number, style: LineStyle): void;

  /**
   * Draw a circular arc
   */
  drawArc(
    center: Point,
    radius: number,
    startAngle: number,
    endAngle: number,
    style: LineStyle,
  ): void;

  /**
   * Draw a polyline/polygon
   */
  drawPolyline(vertices: Point[], closed: boolean, style: LineStyle): void;

  /**
   * Draw ellipse
   */
  drawEllipse(
    center: Point,
    majorRadius: number,
    minorRadius: number,
    rotation: number,
    style: LineStyle,
  ): void;

  /**
   * Draw spline curve (control points)
   */
  drawSpline(controlPoints: Point[], closed: boolean, style: LineStyle): void;

  /**
   * Draw text string
   */
  drawText(text: string, position: Point, style: TextStyle): void;

  /**
   * Draw rectangle
   */
  drawRect(
    topLeft: Point,
    width: number,
    height: number,
    style: LineStyle,
  ): void;

  /**
   * Fill polygon
   */
  fillPolygon(vertices: Point[], style: FillStyle): void;

  // ========== Selection & Highlighting ==========

  /**
   * Set highlight for entity
   */
  setHighlight(entityId: string, enabled: boolean, color?: string): void;

  /**
   * Clear all highlights
   */
  clearHighlights(): void;

  /**
   * Get highlighted entity IDs
   */
  getHighlightedIds(): string[];

  // ========== Viewport & Transform ==========

  /**
   * Set viewport transform
   */
  setViewport(viewport: Viewport): void;

  /**
   * Get current viewport
   */
  getViewport(): Viewport;

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(point: Point): Point;

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(point: Point): Point;

  // ========== Culling & Optimization ==========

  /**
   * Set dirty rect for incremental rendering
   */
  setDirtyRect(rect: BoundingBox | null): void;

  /**
   * Set LOD configuration
   */
  setLOD(config: LODConfig): void;

  /**
   * Get entities within viewport (culled)
   */
  getVisibleBounds(): BoundingBox;

  // ========== Grid & Guides ==========

  /**
   * Draw grid
   */
  drawGrid(gridConfig: GridConfig): void;

  /**
   * Draw crosshair at origin
   */
  drawOrigin(): void;

  // ========== Cleanup ==========

  /**
   * Dispose renderer and cleanup resources
   */
  dispose(): void;
}

export interface RendererInfo {
  type: "canvas2d" | "webgl2";
  version: string;
  maxTextureSize?: number;
  instancingSupported?: boolean;
}

export interface LODConfig {
  enabled: boolean;
  minZoom: number;
  maxDetailZoom: number;
  simplifyTolerance: number;
}

export interface GridConfig {
  spacing: number;
  subdivisions: number;
  color: string;
  subdivisionColor: string;
  majorEvery: number;
}

/**
 * Create default renderer based on capabilities
 */
export function createRenderer(canvas: HTMLCanvasElement): IRenderer {
  // Try WebGL2 first
  const gl = canvas.getContext("webgl2");
  if (gl) {
    // Use WebGL2 renderer
    try {
      return createWebGL2Renderer(canvas);
    } catch {
      // Fallback to Canvas 2D on error
      return createCanvas2DRenderer(canvas);
    }
  }
  // Fallback to Canvas 2D
  return createCanvas2DRenderer(canvas);
}

/**
 * Create Canvas 2D renderer
 */
export function createCanvas2DRenderer(canvas: HTMLCanvasElement): IRenderer {
  return new Canvas2DRenderer(canvas);
}

/**
 * Canvas 2D Renderer implementation
 */
class Canvas2DRenderer implements IRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private viewport: Viewport;
  private highlights = new Map<string, { enabled: boolean; color?: string }>();
  private dirtyRect: BoundingBox | null = null;
  private lodConfig: LODConfig = {
    enabled: false,
    minZoom: 0.1,
    maxDetailZoom: 1,
    simplifyTolerance: 1,
  };
  private gridConfig: GridConfig = {
    spacing: 1,
    subdivisions: 10,
    color: "#e0e0e0",
    subdivisionColor: "#d0d0d0",
    majorEvery: 10,
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context");
    this.ctx = ctx;
    this.viewport = {
      width: canvas.width,
      height: canvas.height,
      pan: { x: 0, y: 0 },
      zoom: 1,
    };
  }

  initialize(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2D context");
    this.ctx = ctx;
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.viewport.width = width;
    this.viewport.height = height;
  }

  getInfo(): RendererInfo {
    return {
      type: "canvas2d",
      version: "1.0",
    };
  }

  isWebGL(): boolean {
    return false;
  }

  beginFrame(): void {
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  endFrame(): void {
    this.ctx.restore();
  }

  drawLine(start: Point, end: Point, style: LineStyle): void {
    const s = this.worldToScreen(start);
    const e = this.worldToScreen(end);

    this.ctx.strokeStyle = style.color;
    this.ctx.lineWidth = style.width;
    this.ctx.globalAlpha = style.opacity ?? 1;

    if (style.linetype && style.linetype !== "CONTINUOUS") {
      this.ctx.setLineDash(getLinetypeDash(style.linetype));
    } else {
      this.ctx.setLineDash([]);
    }

    this.ctx.beginPath();
    this.ctx.moveTo(s.x, s.y);
    this.ctx.lineTo(e.x, e.y);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  drawCircle(center: Point, radius: number, style: LineStyle): void {
    const c = this.worldToScreen(center);
    const r = radius * this.viewport.zoom;

    this.ctx.strokeStyle = style.color;
    this.ctx.lineWidth = style.width;
    this.ctx.globalAlpha = style.opacity ?? 1;

    if (style.linetype && style.linetype !== "CONTINUOUS") {
      this.ctx.setLineDash(getLinetypeDash(style.linetype));
    } else {
      this.ctx.setLineDash([]);
    }

    this.ctx.beginPath();
    this.ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  drawArc(
    center: Point,
    radius: number,
    startAngle: number,
    endAngle: number,
    style: LineStyle,
  ): void {
    const c = this.worldToScreen(center);
    const r = radius * this.viewport.zoom;
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    this.ctx.strokeStyle = style.color;
    this.ctx.lineWidth = style.width;
    this.ctx.globalAlpha = style.opacity ?? 1;

    this.ctx.beginPath();
    this.ctx.arc(c.x, c.y, r, startRad, endRad);
    this.ctx.stroke();
  }

  drawPolyline(vertices: Point[], closed: boolean, style: LineStyle): void {
    if (vertices.length < 2) return;

    this.ctx.strokeStyle = style.color;
    this.ctx.lineWidth = style.width;
    this.ctx.globalAlpha = style.opacity ?? 1;

    if (style.linetype && style.linetype !== "CONTINUOUS") {
      this.ctx.setLineDash(getLinetypeDash(style.linetype));
    } else {
      this.ctx.setLineDash([]);
    }

    this.ctx.beginPath();
    const first = this.worldToScreen(vertices[0]);
    this.ctx.moveTo(first.x, first.y);

    for (let i = 1; i < vertices.length; i++) {
      const v = this.worldToScreen(vertices[i]);
      this.ctx.lineTo(v.x, v.y);
    }

    if (closed && vertices.length > 2) {
      this.ctx.closePath();
    }
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  drawEllipse(
    center: Point,
    majorRadius: number,
    minorRadius: number,
    rotation: number,
    style: LineStyle,
  ): void {
    const c = this.worldToScreen(center);
    const major = majorRadius * this.viewport.zoom;
    const minor = minorRadius * this.viewport.zoom;
    const rotRad = (rotation * Math.PI) / 180;

    this.ctx.save();
    this.ctx.translate(c.x, c.y);
    this.ctx.rotate(rotRad);
    this.ctx.strokeStyle = style.color;
    this.ctx.lineWidth = style.width;
    this.ctx.globalAlpha = style.opacity ?? 1;

    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, major, minor, 0, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.restore();
  }

  drawSpline(controlPoints: Point[], closed: boolean, style: LineStyle): void {
    if (controlPoints.length < 2) return;

    this.ctx.strokeStyle = style.color;
    this.ctx.lineWidth = style.width;
    this.ctx.globalAlpha = style.opacity ?? 1;

    if (style.linetype && style.linetype !== "CONTINUOUS") {
      this.ctx.setLineDash(getLinetypeDash(style.linetype));
    } else {
      this.ctx.setLineDash([]);
    }

    this.ctx.beginPath();
    const first = this.worldToScreen(controlPoints[0]);
    this.ctx.moveTo(first.x, first.y);

    // Simple polyline for now (bezier would require more complex implementation)
    for (let i = 1; i < controlPoints.length; i++) {
      const v = this.worldToScreen(controlPoints[i]);
      this.ctx.lineTo(v.x, v.y);
    }

    if (closed && controlPoints.length > 2) {
      this.ctx.closePath();
    }
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  drawText(text: string, position: Point, style: TextStyle): void {
    const p = this.worldToScreen(position);

    this.ctx.fillStyle = style.color;
    this.ctx.font = `${style.italic ? "italic " : ""}${style.bold ? "bold " : ""}${style.fontSize}px ${style.fontFamily}`;
    this.ctx.textAlign = style.alignment ?? "left";
    this.ctx.textBaseline = "top";
    this.ctx.globalAlpha = style.opacity ?? 1;

    if (style.rotation) {
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((style.rotation * Math.PI) / 180);
      this.ctx.fillText(text, 0, 0);
      this.ctx.restore();
    } else {
      this.ctx.fillText(text, p.x, p.y);
    }
  }

  drawRect(
    topLeft: Point,
    width: number,
    height: number,
    style: LineStyle,
  ): void {
    const tl = this.worldToScreen(topLeft);
    const w = width * this.viewport.zoom;
    const h = height * this.viewport.zoom;

    this.ctx.strokeStyle = style.color;
    this.ctx.lineWidth = style.width;
    this.ctx.globalAlpha = style.opacity ?? 1;

    this.ctx.strokeRect(tl.x, tl.y, w, h);
  }

  fillPolygon(vertices: Point[], style: FillStyle): void {
    if (vertices.length < 3) return;

    this.ctx.fillStyle = style.fillColor;
    this.ctx.globalAlpha = style.opacity ?? 1;

    this.ctx.beginPath();
    const first = this.worldToScreen(vertices[0]);
    this.ctx.moveTo(first.x, first.y);

    for (let i = 1; i < vertices.length; i++) {
      const v = this.worldToScreen(vertices[i]);
      this.ctx.lineTo(v.x, v.y);
    }
    this.ctx.closePath();
    this.ctx.fill();
  }

  setHighlight(entityId: string, enabled: boolean, color?: string): void {
    this.highlights.set(entityId, { enabled, color });
  }

  clearHighlights(): void {
    this.highlights.clear();
  }

  getHighlightedIds(): string[] {
    return Array.from(this.highlights.keys()).filter(
      (id) => this.highlights.get(id)?.enabled,
    );
  }

  setViewport(viewport: Viewport): void {
    this.viewport = viewport;
  }

  getViewport(): Viewport {
    return { ...this.viewport };
  }

  worldToScreen(point: Point): Point {
    const cx = this.viewport.width / 2;
    const cy = this.viewport.height / 2;
    return {
      x: (point.x - this.viewport.pan.x) * this.viewport.zoom + cx,
      y: (point.y - this.viewport.pan.y) * this.viewport.zoom + cy,
    };
  }

  screenToWorld(point: Point): Point {
    const cx = this.viewport.width / 2;
    const cy = this.viewport.height / 2;
    return {
      x: (point.x - cx) / this.viewport.zoom + this.viewport.pan.x,
      y: (point.y - cy) / this.viewport.zoom + this.viewport.pan.y,
    };
  }

  setDirtyRect(rect: BoundingBox | null): void {
    this.dirtyRect = rect;
  }

  setLOD(config: LODConfig): void {
    this.lodConfig = config;
  }

  getVisibleBounds(): BoundingBox {
    const halfWidth = this.viewport.width / 2 / this.viewport.zoom;
    const halfHeight = this.viewport.height / 2 / this.viewport.zoom;
    return {
      minX: this.viewport.pan.x - halfWidth,
      minY: this.viewport.pan.y - halfHeight,
      maxX: this.viewport.pan.x + halfWidth,
      maxY: this.viewport.pan.y + halfHeight,
    };
  }

  drawGrid(gridConfig: GridConfig): void {
    const bounds = this.getVisibleBounds();
    const spacing = gridConfig.spacing;
    const subSpacing = spacing / gridConfig.subdivisions;

    // Calculate visible range
    const startX = Math.floor(bounds.minX / spacing) * spacing;
    const endX = Math.ceil(bounds.maxX / spacing) * spacing;
    const startY = Math.floor(bounds.minY / spacing) * spacing;
    const endY = Math.ceil(bounds.maxY / spacing) * spacing;

    this.ctx.strokeStyle = gridConfig.subdivisionColor;
    this.ctx.lineWidth = 0.5;
    this.ctx.globalAlpha = 0.5;

    // Draw subdivisions
    for (let x = startX; x <= endX; x += subSpacing) {
      if ((x / spacing) % 1 === 0) continue; // Skip major lines
      const p1 = this.worldToScreen({ x, y: bounds.minY });
      const p2 = this.worldToScreen({ x, y: bounds.maxY });
      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.stroke();
    }

    for (let y = startY; y <= endY; y += subSpacing) {
      if ((y / spacing) % 1 === 0) continue;
      const p1 = this.worldToScreen({ x: bounds.minX, y });
      const p2 = this.worldToScreen({ x: bounds.maxX, y });
      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.stroke();
    }

    // Draw major grid
    this.ctx.strokeStyle = gridConfig.color;
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = 0.7;

    for (let x = startX; x <= endX; x += spacing) {
      const p1 = this.worldToScreen({ x, y: bounds.minY });
      const p2 = this.worldToScreen({ x, y: bounds.maxY });
      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.stroke();
    }

    for (let y = startY; y <= endY; y += spacing) {
      const p1 = this.worldToScreen({ x: bounds.minX, y });
      const p2 = this.worldToScreen({ x: bounds.maxX, y });
      this.ctx.beginPath();
      this.ctx.moveTo(p1.x, p1.y);
      this.ctx.lineTo(p2.x, p2.y);
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1;
  }

  drawOrigin(): void {
    const origin = this.worldToScreen({ x: 0, y: 0 });
    const size = 20;

    this.ctx.strokeStyle = "#ff0000";
    this.ctx.lineWidth = 1;

    // X axis (red)
    this.ctx.beginPath();
    this.ctx.moveTo(origin.x - size, origin.y);
    this.ctx.lineTo(origin.x + size, origin.y);
    this.ctx.stroke();

    // Y axis (green)
    this.ctx.strokeStyle = "#00ff00";
    this.ctx.beginPath();
    this.ctx.moveTo(origin.x, origin.y - size);
    this.ctx.lineTo(origin.x, origin.y + size);
    this.ctx.stroke();

    // Origin circle
    this.ctx.strokeStyle = "#0000ff";
    this.ctx.beginPath();
    this.ctx.arc(origin.x, origin.y, 3, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  dispose(): void {
    this.highlights.clear();
    this.dirtyRect = null;
  }
}

/**
 * Get dash pattern for linetype
 */
function getLinetypeDash(linetype: Linetype): number[] {
  switch (linetype) {
    case "DASHED":
      return [10, 5];
    case "DASHDOT":
      return [10, 5, 2, 5];
    case "DOT":
      return [2, 5];
    case "CENTER":
      return [20, 5, 5, 5];
    case "BORDER":
      return [15, 5, 5, 5];
    default:
      return [];
  }
}
