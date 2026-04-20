/**
 * DemoApp.tsx
 * Web CAD demo application
 *
 * Provides standalone demo mode without actual API.
 * Displays sample drawing data with toolbar, layer panel, and properties panel.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";

// =====================================================================
// Sample data
// =====================================================================

interface SampleLayer {
  name: string;
  color: number;
  visible: boolean;
  locked: boolean;
}

interface SampleEntity {
  id: string;
  type: string;
  layer: string;
  points?: { x: number; y: number }[];
  color?: number;
  center?: { x: number; y: number };
  radius?: number;
  startAngle?: number;
  endAngle?: number;
}

/** Sample layer data */
const SAMPLE_LAYERS: SampleLayer[] = [
  { name: "0", color: 7, visible: true, locked: false },
  { name: "WALLS", color: 1, visible: true, locked: false },
  { name: "DOORS", color: 3, visible: true, locked: false },
  { name: "WINDOWS", color: 5, visible: true, locked: false },
  { name: "DIMENSIONS", color: 2, visible: true, locked: false },
  { name: "TEXT", color: 4, visible: true, locked: false }
];

/** Sample entity data */
const SAMPLE_ENTITIES: SampleEntity[] = [
  // WALLS
  { id: "e1", type: "LINE", layer: "WALLS", points: [{ x: 0, y: 0 }, { x: 100, y: 0 }], color: 1 },
  { id: "e2", type: "LINE", layer: "WALLS", points: [{ x: 100, y: 0 }, { x: 100, y: 80 }], color: 1 },
  { id: "e3", type: "LINE", layer: "WALLS", points: [{ x: 100, y: 80 }, { x: 0, y: 80 }], color: 1 },
  { id: "e4", type: "LINE", layer: "WALLS", points: [{ x: 0, y: 80 }, { x: 0, y: 0 }], color: 1 },
  // DOORS
  { id: "e5", type: "ARC", layer: "DOORS", center: { x: 50, y: 0 }, radius: 15, startAngle: 0, endAngle: 90, color: 3 },
  { id: "e6", type: "LINE", layer: "DOORS", points: [{ x: 50, y: 0 }, { x: 50, y: 15 }], color: 3 },
  // WINDOWS
  { id: "e7", type: "LINE", layer: "WINDOWS", points: [{ x: 20, y: 40 }, { x: 40, y: 40 }], color: 5 },
  { id: "e8", type: "LINE", layer: "WINDOWS", points: [{ x: 20, y: 50 }, { x: 40, y: 50 }], color: 5 },
  { id: "e9", type: "LINE", layer: "WINDOWS", points: [{ x: 20, y: 40 }, { x: 20, y: 50 }], color: 5 },
  { id: "e10", type: "LINE", layer: "WINDOWS", points: [{ x: 40, y: 40 }, { x: 40, y: 50 }], color: 5 },
  // DIMENSIONS
  { id: "e11", type: "LINE", layer: "DIMENSIONS", points: [{ x: 0, y: -10 }, { x: 100, y: -10 }], color: 2 },
  // POLYLINE (test)
  { id: "e12", type: "POLYLINE", layer: "WALLS", points: [{ x: 120, y: 0 }, { x: 180, y: 0 }, { x: 180, y: 60 }, { x: 120, y: 60 }, { x: 120, y: 0 }], color: 1 }
];

// =====================================================================
// Utilities
// =====================================================================

interface ColorMap {
  [index: number]: string;
}

/** Convert AutoCAD color index to HEX */
function getColorHex(colorIndex: number): string {
  const colors: ColorMap = {
    1: "#FF0000", 2: "#FFFF00", 3: "#00FF00", 4: "#00FFFF",
    5: "#0000FF", 6: "#FF00FF", 7: "#FFFFFF", 8: "#404040",
    9: "#808080", 10: "#FF8080", 11: "#FFFF80", 12: "#80FF80"
  };
  return colors[colorIndex] || "#FFFFFF";
}

interface Viewport {
  width: number;
  height: number;
  panX: number;
  panY: number;
  zoom: number;
}

/** Convert world coordinates to screen coordinates */
function worldToScreen(x: number, y: number, viewport: Viewport): { sx: number; sy: number } {
  return {
    sx: (x - viewport.panX) * viewport.zoom + viewport.width / 2,
    sy: (y - viewport.panY) * viewport.zoom + viewport.height / 2
  };
}

// =====================================================================
// Canvas renderer
// =====================================================================

/**
 * Draw grid on Canvas 2D.
 */
function drawGrid(ctx: CanvasRenderingContext2D, viewport: Viewport): void {
  const { width, height, panX, panY, zoom } = viewport;
  const gridSize = 10 * zoom;

  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 0.5;

  // Calculate screen range
  const startX = Math.floor((-panX - width / 2 / zoom) / gridSize) * gridSize;
  const endX = Math.ceil((-panX + width / 2 / zoom) / gridSize) * gridSize;
  const startY = Math.floor((-panY - height / 2 / zoom) / gridSize) * gridSize;
  const endY = Math.ceil((-panY + height / 2 / zoom) / gridSize) * gridSize;

  ctx.beginPath();
  for (let x = startX; x <= endX; x += gridSize) {
    const sx = (x - panX) * zoom + width / 2;
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, height);
  }
  for (let y = startY; y <= endY; y += gridSize) {
    const sy = (y - panY) * zoom + height / 2;
    ctx.moveTo(0, sy);
    ctx.lineTo(width, sy);
  }
  ctx.stroke();

  // Draw axes
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1;
  ctx.beginPath();
  const originX = (-panX) * zoom + width / 2;
  const originY = (-panY) * zoom + height / 2;
  ctx.moveTo(originX, 0);
  ctx.lineTo(originX, height);
  ctx.moveTo(0, originY);
  ctx.lineTo(width, originY);
  ctx.stroke();
}

/**
 * Draw entity on Canvas 2D.
 */
function drawEntity(ctx: CanvasRenderingContext2D, entity: SampleEntity, viewport: Viewport, selectedId: string | null): void {
  ctx.strokeStyle = getColorHex(entity.color || 7);
  ctx.lineWidth = entity.layer === "WALLS" ? 2 : 1;

  // Highlight selected entity
  if (entity.id === selectedId) {
    ctx.shadowColor = "#0d7dd4";
    ctx.shadowBlur = 8;
  } else {
    ctx.shadowBlur = 0;
  }

  const pts = entity.points || [];

  if (entity.type === "LINE" && pts.length >= 2) {
    ctx.beginPath();
    const start = worldToScreen(pts[0].x, pts[0].y, viewport);
    ctx.moveTo(start.sx, start.sy);
    for (let i = 1; i < pts.length; i++) {
      const p = worldToScreen(pts[i].x, pts[i].y, viewport);
      ctx.lineTo(p.sx, p.sy);
    }
    ctx.stroke();
  } else if (entity.type === "POLYLINE" && pts.length >= 2) {
    ctx.beginPath();
    const start = worldToScreen(pts[0].x, pts[0].y, viewport);
    ctx.moveTo(start.sx, start.sy);
    for (let i = 1; i < pts.length; i++) {
      const p = worldToScreen(pts[i].x, pts[i].y, viewport);
      ctx.lineTo(p.sx, p.sy);
    }
    ctx.stroke();
  } else if (entity.type === "ARC" && entity.center) {
    const center = worldToScreen(entity.center.x, entity.center.y, viewport);
    const radius = entity.radius! * zoom;
    ctx.beginPath();
    ctx.arc(center.sx, center.sy, radius,
      (entity.startAngle! * Math.PI) / 180,
      (entity.endAngle! * Math.PI) / 180);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
}

// =====================================================================
// Toolbar
// =====================================================================

interface ToolbarProps {
  currentTool: string;
  onToolChange: (tool: string) => void;
  viewMode: string;
  onViewModeChange: (mode: string) => void;
  onLoadSample: () => void;
}

function Toolbar({ currentTool, onToolChange, viewMode, onViewModeChange, onLoadSample }: ToolbarProps) {
  return (
    <header className="flex items-center gap-3 px-3 h-11 bg-[#1e1e1e] text-[#ccc] flex-shrink-0" style={{ fontFamily: "system-ui, sans-serif", fontSize: "13px" }}>
      <span className="font-semibold text-sm text-white mr-2">Web CAD Demo</span>
      <div className="flex gap-1">
        <button
          className={`px-3 py-1 border border-[#444] rounded text-xs transition-colors ${currentTool === "select" ? "bg-[#0d7dd4] border-[#0d7dd4] text-white" : "bg-[#2d2d2d] text-[#ccc] hover:bg-[#3d3d3d]"}`}
          onClick={() => onToolChange("select")}
          title="Select (S)"
        >
          [S] Select
        </button>
        <button
          className={`px-3 py-1 border border-[#444] rounded text-xs transition-colors ${currentTool === "line" ? "bg-[#0d7dd4] border-[#0d7dd4] text-white" : "bg-[#2d2d2d] text-[#ccc] hover:bg-[#3d3d3d]"}`}
          onClick={() => onToolChange("line")}
          title="Line (L)"
        >
          [L] Line
        </button>
        <button
          className={`px-3 py-1 border border-[#444] rounded text-xs transition-colors ${currentTool === "polyline" ? "bg-[#0d7dd4] border-[#0d7dd4] text-white" : "bg-[#2d2d2d] text-[#ccc] hover:bg-[#3d3d3d]"}`}
          onClick={() => onToolChange("polyline")}
          title="Polyline (P)"
        >
          [P] Polyline
        </button>
      </div>
      <div className="flex gap-1">
        <button
          className={`px-3 py-1 border rounded text-xs transition-colors ${viewMode === "2d-cad" ? "bg-[#0d7dd4] border-[#0d7dd4] text-white" : "bg-[#2d2d2d] border-[#444] text-[#ccc] hover:bg-[#3d3d3d]"}`}
          onClick={() => onViewModeChange("2d-cad")}
        >
          2D CAD
        </button>
        <button
          className={`px-3 py-1 border rounded text-xs transition-colors ${viewMode === "point-cloud" ? "bg-[#0d7dd4] border-[#0d7dd4] text-white" : "bg-[#2d2d2d] border-[#444] text-[#ccc] hover:bg-[#3d3d3d]"}`}
          onClick={() => onViewModeChange("point-cloud")}
        >
          Point Cloud
        </button>
      </div>
      <div className="flex gap-1">
        <button
          className="px-3 py-1 border border-[#0d6cb4] rounded text-xs bg-[#0d6cb4] text-white hover:bg-[#0a5a9e] transition-colors"
          onClick={onLoadSample}
        >
          Sample Drawing
        </button>
      </div>
    </header>
  );
}

// =====================================================================
// Layer panel
// =====================================================================

interface LayerPanelProps {
  layers: SampleLayer[];
  activeLayer: string;
  onLayerSelect: (name: string) => void;
  onToggleVisibility: (name: string, visible: boolean) => void;
  onToggleLock: (name: string, locked: boolean) => void;
}

function LayerPanel({ layers, activeLayer, onLayerSelect, onToggleVisibility, onToggleLock }: LayerPanelProps) {
  return (
    <div className="w-[180px] bg-[#1e1e1e] border-r border-[#333] flex flex-col flex-shrink-0">
      <div className="px-3 py-2 font-semibold text-xs text-white border-b border-[#333] bg-[#252526]">Layers</div>
      <div className="flex-1 overflow-y-auto py-1">
        {layers.map((layer) => (
          <div
            key={layer.name}
            className={`flex items-center gap-1 px-2 py-[5px] cursor-pointer transition-colors ${layer.name === activeLayer ? "bg-[#094771]" : "hover:bg-[#2a2a2a]"}`}
            onClick={() => onLayerSelect(layer.name)}
          >
            <button
              className="w-[22px] h-[22px] p-0 border-none rounded bg-transparent text-[#888] text-xs flex items-center justify-center flex-shrink-0 hover:bg-[#3d3d3d] transition-colors"
              onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.name, !layer.visible); }}
              title={layer.visible ? "Hide" : "Show"}
            >
              {layer.visible ? "👁" : "○"}
            </button>
            <button
              className="w-[22px] h-[22px] p-0 border-none rounded bg-transparent text-[#888] text-xs flex items-center justify-center flex-shrink-0 hover:bg-[#3d3d3d] transition-colors"
              onClick={(e) => { e.stopPropagation(); onToggleLock(layer.name, !layer.locked); }}
              title={layer.locked ? "Unlock" : "Lock"}
            >
              {layer.locked ? "🔒" : "🔓"}
            </button>
            <span
              className="w-[14px] h-[14px] rounded-sm border border-[#555] flex-shrink-0"
              style={{ backgroundColor: getColorHex(layer.color) }}
            />
            <span className="flex-1 text-xs text-[#ccc] overflow-hidden text-ellipsis whitespace-nowrap">{layer.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================================================================
// Properties panel
// =====================================================================

interface PropertiesPanelProps {
  entity: SampleEntity | null;
}

function PropertiesPanel({ entity }: PropertiesPanelProps) {
  if (!entity) {
    return (
      <div className="w-[200px] bg-[#1e1e1e] border-l border-[#333] flex flex-col flex-shrink-0">
        <div className="px-3 py-2 font-semibold text-xs text-white border-b border-[#333] bg-[#252526]">Properties</div>
        <div className="px-3 py-4 text-[#666] italic text-xs">No entity selected</div>
      </div>
    );
  }

  return (
    <div className="w-[200px] bg-[#1e1e1e] border-l border-[#333] flex flex-col flex-shrink-0">
      <div className="px-3 py-2 font-semibold text-xs text-white border-b border-[#333] bg-[#252526]">Properties</div>
      <table className="w-full text-xs border-collapse">
        <tbody>
          <tr><td className="px-2 py-1 border-b border-[#2a2a2a] text-[#888] w-[70px]">ID</td><td className="px-2 py-1 border-b border-[#2a2a2a] text-[#ccc]">{entity.id}</td></tr>
          <tr><td className="px-2 py-1 border-b border-[#2a2a2a] text-[#888]">Type</td><td className="px-2 py-1 border-b border-[#2a2a2a] text-[#ccc]">{entity.type}</td></tr>
          <tr><td className="px-2 py-1 border-b border-[#2a2a2a] text-[#888]">Layer</td><td className="px-2 py-1 border-b border-[#2a2a2a] text-[#ccc]">{entity.layer}</td></tr>
          {entity.points && entity.points.length > 0 && (
            <tr><td className="px-2 py-1 border-b border-[#2a2a2a] text-[#888]">Start</td><td className="px-2 py-1 border-b border-[#2a2a2a] text-[#ccc]">X: {entity.points[0].x}, Y: {entity.points[0].y}</td></tr>
          )}
          {entity.radius && (
            <tr><td className="px-2 py-1 border-b border-[#2a2a2a] text-[#888]">Radius</td><td className="px-2 py-1 border-b border-[#2a2a2a] text-[#ccc]">{entity.radius}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// =====================================================================
// Main DemoApp component
// =====================================================================

interface DemoAppProps {
  baseUrl?: string;
}

/**
 * DemoApp — Web CAD demo application
 */
export function DemoApp({ baseUrl }: DemoAppProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Viewport state
  const [viewport, setViewport] = useState<Viewport>({
    width: 800,
    height: 600,
    panX: 50,
    panY: 40,
    zoom: 5
  });

  // Tool/selection state
  const [currentTool, setCurrentTool] = useState("select");
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState("2d-cad");

  // Data state
  const [entities, setEntities] = useState<SampleEntity[]>(SAMPLE_ENTITIES);
  const [layers, setLayers] = useState<SampleLayer[]>(SAMPLE_LAYERS);
  const [activeLayer, setActiveLayer] = useState("0");

  // Mouse drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const selectedEntity = entities.find((e) => e.id === selectedEntityId) || null;

  // Canvas resize detection
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setViewport((v) => ({ ...v, width, height }));
      }
    });

    observer.observe(canvas.parentElement!);
    return () => observer.disconnect();
  }, []);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid
    drawGrid(ctx, viewport);

    // Layer visibility filter
    const visibleLayerNames = layers.filter((l) => l.visible).map((l) => l.name);

    // Entity rendering
    entities
      .filter((e) => visibleLayerNames.includes(e.layer))
      .forEach((entity) => {
        drawEntity(ctx, entity, viewport, selectedEntityId);
      });
  }, [viewport, entities, layers, selectedEntityId]);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool === "select") {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [currentTool]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || currentTool !== "select") return;

    const dx = (e.clientX - dragStart.x) / viewport.zoom;
    const dy = (e.clientY - dragStart.y) / viewport.zoom;

    setViewport((v) => ({
      ...v,
      panX: v.panX - dx,
      panY: v.panY - dy
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart, viewport.zoom, currentTool]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setViewport((v) => ({
        ...v,
        zoom: Math.max(0.1, Math.min(50, v.zoom * delta))
      }));
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, []);

  // Canvas click (entity selection)
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentTool !== "select") return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Simple hit test
    const worldX = (clickX - viewport.width / 2) / viewport.zoom + viewport.panX;
    const worldY = (clickY - viewport.height / 2) / viewport.zoom + viewport.panY;

    // Find entity near click position
    let closest: string | null = null;
    const closestDist = 10 / viewport.zoom;

    for (const entity of entities) {
      if (!layers.find((l) => l.name === entity.layer && l.visible)) continue;
      const pts = entity.points || [];
      for (const pt of pts) {
        const dist = Math.sqrt((pt.x - worldX) ** 2 + (pt.y - worldY) ** 2);
        if (dist < closestDist) {
          closest = entity.id;
        }
      }
    }

    setSelectedEntityId(closest);
  }, [currentTool, viewport, entities, layers]);

  // Load sample drawing
  const handleLoadSample = useCallback(() => {
    setEntities([...SAMPLE_ENTITIES]);
    setViewport((v) => ({ ...v, width: v.width, height: v.height, panX: 50, panY: 40, zoom: 5 }));
    setSelectedEntityId(null);
  }, []);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden" style={{ fontFamily: "system-ui, sans-serif", fontSize: "13px" }}>
      <Toolbar
        currentTool={currentTool}
        onToolChange={setCurrentTool}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onLoadSample={handleLoadSample}
      />
      <div className="flex flex-1 overflow-hidden">
        <LayerPanel
          layers={layers}
          activeLayer={activeLayer}
          onLayerSelect={setActiveLayer}
          onToggleVisibility={(name, visible) => {
            setLayers((prev) =>
              prev.map((l) => (l.name === name ? { ...l, visible } : l))
            );
          }}
          onToggleLock={(name, locked) => {
            setLayers((prev) =>
              prev.map((l) => (l.name === name ? { ...l, locked } : l))
            );
          }}
        />
        <div className="flex-1 overflow-hidden bg-[#333] relative">
          <canvas
            ref={canvasRef}
            className="block w-full h-full"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleCanvasClick}
            style={{ cursor: currentTool === "select" ? "default" : "crosshair" }}
          />
        </div>
        <PropertiesPanel entity={selectedEntity} />
      </div>
      <footer className="flex items-center gap-4 px-3 h-6 bg-[#007acc] text-white text-xs flex-shrink-0">
        <span>Mode: {viewMode === "2d-cad" ? "2D CAD" : "Point Cloud"}</span>
        <span>Tool: {currentTool}</span>
        <span>Zoom: {viewport.zoom.toFixed(1)}x</span>
        <span>Selected: {selectedEntityId || "None"}</span>
        <span>Entities: {entities.length}</span>
      </footer>
    </div>
  );
}

export default DemoApp;