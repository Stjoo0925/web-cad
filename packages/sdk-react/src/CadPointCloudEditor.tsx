import React, { useState, useCallback, useRef } from "react";
import { CadCanvasLayer } from "./canvas/CadCanvasLayer.js";
import { ExportDialog } from "./components/ExportDialog.js";
import type { Viewport, Point } from "./canvas/cad-canvas-renderer.js";
import type { Entity } from "./canvas/cad-canvas-renderer.js";
import { createSnapEngine } from "./tools/snap-engine.js";
import { createCircleTool } from "./tools/circle-tool.js";
import { createArcTool } from "./tools/arc-tool.js";
import { createTextTool } from "./tools/text-tool.js";
import { createPointTool } from "./tools/point-tool.js";
import { createLineTool } from "./tools/line-tool.js";
import { createPolylineTool } from "./tools/polyline-tool.js";
import { hitTestEntities } from "./tools/select-tool.js";
import { LayersPanel } from "./panels/LayersPanel.js";
import { PropertiesPanel } from "./panels/PropertiesPanel.js";

export interface CadPointCloudEditorProps {
  baseUrl?: string;
  token?: string;
  documentId?: string;
  viewMode?: "2d-cad" | "point-cloud";
  mapProvider?: string | null;
  naverMapClientId?: string | null;
  mapCenter?: { lat: number; lng: number };
  mapZoom?: number;
  onDocumentOpened?: (doc: unknown) => void;
  onSaveStatus?: (e: { status: string }) => void;
  onSelectionChange?: (ids: string[]) => void;
  onUploadCompleted?: (e: { assetId?: string }) => void;
  onError?: (e: { message?: string; type?: string }) => void;
}

type ToolType =
  | "select"
  | "line"
  | "polyline"
  | "circle"
  | "arc"
  | "text"
  | "point"
  | "move"
  | "rotate"
  | "scale";

interface SnapIndicator {
  point: Point;
  type: string;
}

// AutoCAD-style colors
const COLORS = {
  background: "#2d2d2d",
  panel: "#3d3d3d",
  border: "#4d4d4d",
  text: "#ffffff",
  textDim: "#888888",
  accent: "#0078d4",
  buttonBg: "#4d4d4d",
  buttonHover: "#5d5d5d",
  snapEndpoint: "#00ff00",
  snapMidpoint: "#00ffff",
  snapIntersection: "#ffff00",
  snapPerpendicular: "#ff00ff",
  snapTangent: "#ff8800",
  snapCenter: "#00ff88",
};

// SVG Icons for AutoCAD-style toolbar
const Icons = {
  Select: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path d="M4 2L4 16L8 12L12 18L14 17L10 11L16 11L4 2Z" />
    </svg>
  ),
  Line: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="3" y1="17" x2="17" y2="3" />
    </svg>
  ),
  Polyline: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="3,17 8,8 12,12 17,3" />
    </svg>
  ),
  Circle: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="10" cy="10" r="7" />
    </svg>
  ),
  Arc: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 15 Q10 3 17 15" />
    </svg>
  ),
  Text: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <text x="3" y="15" fontSize="14" fontWeight="bold">
        A
      </text>
    </svg>
  ),
  Point: () => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <circle cx="10" cy="10" r="2" />
    </svg>
  ),
  Move: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M10 3V17M3 10H17M10 3L7 6M10 3L13 6M10 17L7 14M10 17L13 14M3 10L6 7M3 10L6 13M17 10L14 7M17 10L14 13" />
    </svg>
  ),
  Rotate: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M15 5A6 6 0 1 1 5 10" />
      <path d="M5 7L5 10L8 10" />
    </svg>
  ),
  Scale: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="5" y="5" width="4" height="4" />
      <rect x="11" y="11" width="4" height="4" />
      <line x1="9" y1="7" x2="11" y2="7" />
      <line x1="13" y1="9" x2="13" y2="11" />
    </svg>
  ),
  Grid: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3" y="3" width="14" height="14" />
      <line x1="10" y1="3" x2="10" y2="17" />
      <line x1="3" y1="10" x2="17" y2="10" />
    </svg>
  ),
  Snap: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="10" cy="10" r="3" />
      <line x1="10" y1="2" x2="10" y2="6" />
      <line x1="10" y1="14" x2="10" y2="18" />
      <line x1="2" y1="10" x2="6" y2="10" />
      <line x1="14" y1="10" x2="18" y2="10" />
    </svg>
  ),
  Layers: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M2 4L8 8L14 4" />
      <path d="M2 8L8 12L14 8" />
      <path d="M2 12L8 4L14 12" />
    </svg>
  ),
};

// Tool button component
function ToolButton({
  icon,
  label,
  active,
  shortcut,
  onClick,
  disabled,
  title,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title || `${label}${shortcut ? ` (${shortcut})` : ""}`}
      disabled={disabled}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "4px 8px",
        border: "none",
        borderRadius: "4px",
        background: disabled ? "#333" : active ? COLORS.accent : COLORS.buttonBg,
        color: disabled ? "#666" : COLORS.text,
        cursor: disabled ? "not-allowed" : "pointer",
        minWidth: "50px",
        fontSize: "10px",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon}
      <span
        style={{ marginTop: "2px", fontSize: "9px", color: disabled ? "#666" : COLORS.textDim }}
      >
        {label}
      </span>
    </button>
  );
}

// Snap indicator overlay component
function SnapOverlay({
  snap,
  viewport,
}: {
  snap: SnapIndicator | null;
  viewport: Viewport;
}) {
  if (!snap) return null;

  const getColor = () => {
    switch (snap.type) {
      case "endpoint":
        return COLORS.snapEndpoint;
      case "midpoint":
        return COLORS.snapMidpoint;
      case "intersection":
        return COLORS.snapIntersection;
      case "perpendicular":
        return COLORS.snapPerpendicular;
      case "tangent":
        return COLORS.snapTangent;
      case "center":
        return COLORS.snapCenter;
      default:
        return "#ffffff";
    }
  };

  const color = getColor();
  const screenX =
    (snap.point.x - viewport.pan.x) * viewport.zoom + viewport.width / 2;
  const screenY =
    (snap.point.y - viewport.pan.y) * viewport.zoom + viewport.height / 2;

  return (
    <div
      style={{
        position: "absolute",
        left: screenX,
        top: screenY,
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      {/* Snap point marker */}
      <div
        style={{
          position: "absolute",
          width: "10px",
          height: "10px",
          border: `2px solid ${color}`,
          borderRadius: "50%",
          transform: "translate(-50%, -50%)",
          background: "#2d2d2d",
        }}
      />
      {/* Crosshair lines */}
      <div
        style={{
          position: "absolute",
          width: "20px",
          height: "1px",
          background: color,
          transform: "translate(-50%, -50%) rotate(0deg)",
          opacity: 0.7,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "1px",
          height: "20px",
          background: color,
          transform: "translate(-50%, -50%) rotate(0deg)",
          opacity: 0.7,
        }}
      />
      {/* Snap type label */}
      <div
        style={{
          position: "absolute",
          left: "12px",
          top: "-8px",
          fontSize: "9px",
          color: color,
          fontWeight: "bold",
          whiteSpace: "nowrap",
          textShadow: "0 0 2px #000",
        }}
      >
        {snap.type.toUpperCase()}
      </div>
    </div>
  );
}

// Command line component
function CommandLine({ onCommand }: { onCommand: (cmd: string) => void }) {
  const [value, setValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && value.trim()) {
      onCommand(value.trim());
      setValue("");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "#1e1e1e",
        borderTop: `1px solid ${COLORS.border}`,
        padding: "2px 8px",
        height: "24px",
      }}
    >
      <span
        style={{
          color: COLORS.accent,
          marginRight: "4px",
          fontFamily: "monospace",
        }}
      >
        &gt;
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter command..."
        style={{
          flex: 1,
          background: "transparent",
          border: "none",
          color: COLORS.text,
          fontSize: "12px",
          fontFamily: "Consolas, monospace",
          outline: "none",
        }}
      />
    </div>
  );
}

// Status bar component
function StatusBar({
  cursor,
  zoom,
  snapMode,
  tool,
}: {
  cursor: { x: number; y: number };
  zoom: number;
  snapMode: string;
  tool: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#1e1e1e",
        borderTop: `1px solid ${COLORS.border}`,
        padding: "2px 12px",
        height: "24px",
        fontSize: "11px",
        color: COLORS.textDim,
      }}
    >
      <div style={{ display: "flex", gap: "16px" }}>
        <span>X: {cursor.x.toFixed(2)}</span>
        <span>Y: {cursor.y.toFixed(2)}</span>
      </div>
      <div style={{ display: "flex", gap: "16px" }}>
        <span style={{ color: COLORS.accent }}>OSNAP: {snapMode}</span>
        <span>ZOOM: {zoom.toFixed(1)}</span>
        <span>Tool: {tool}</span>
      </div>
    </div>
  );
}

export function CadPointCloudEditor({
  viewMode = "2d-cad",
  mapProvider,
  naverMapClientId,
  mapCenter,
  mapZoom,
}: CadPointCloudEditorProps) {
  const [viewport, setViewport] = useState<Viewport>({
    width: 800,
    height: 600,
    pan: { x: 0, y: 0 },
    zoom: 1,
  });

  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentTool, setCurrentTool] = useState<ToolType>("select");
  const [snapIndicator, setSnapIndicator] = useState<SnapIndicator | null>(
    null,
  );
  const [showGrid, setShowGrid] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState("Home");
  const [showLayers, setShowLayers] = useState(true);
  const [cursorWorld, setCursorWorld] = useState({ x: 0, y: 0 });
  const [showExport, setShowExport] = useState(false);
  const [layers, setLayers] = useState<Array<{ name: string; visible?: boolean; locked?: boolean }>>([
    { name: "0", visible: true, locked: false },
    { name: "Layer1", visible: true, locked: false },
  ]);
  const [activeLayer, setActiveLayer] = useState<string | null>("0");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Tool instances
  const circleToolRef = useRef(createCircleTool({}));
  const arcToolRef = useRef(createArcTool({}));
  const textToolRef = useRef(createTextTool({}));
  const pointToolRef = useRef(createPointTool({}));
  const lineToolRef = useRef(createLineTool({}));
  const polylineToolRef = useRef(createPolylineTool({}));

  // Snap engine
  const snapEngineRef = useRef(createSnapEngine({ tolerance: 12 }));

  const handleViewportChange = useCallback((newViewport: Viewport) => {
    setViewport(newViewport);
  }, []);

  const addEntity = useCallback((entity: Entity) => {
    setEntities((prev) => [...prev, entity]);
  }, []);

  const handleToolClick = useCallback((tool: ToolType) => {
    setCurrentTool(tool);
    setSelectedIds([]);
  }, []);

  const handleEntityCreate = useCallback((type: string, entity: Entity) => {
    setEntities((prev) => [...prev, entity]);
  }, []);

  const clearEntities = useCallback(() => {
    setEntities([]);
    setSelectedIds([]);
  }, []);

  const handleAddLayer = useCallback(() => {
    const newName = `Layer_${layers.length + 1}`;
    setLayers((prev) => [...prev, { name: newName, visible: true, locked: false }]);
    setActiveLayer(newName);
  }, [layers.length]);

  const handleDeleteLayer = useCallback((name: string) => {
    if (name === "0") return;
    setLayers((prev) => prev.filter((l) => l.name !== name));
    setEntities((prev) => prev.map((e) => e.layer === name ? { ...e, layer: "0" } : e));
    if (activeLayer === name) setActiveLayer("0");
  }, [activeLayer]);

  const handleToggleLayerVisibility = useCallback((name: string, visible: boolean) => {
    setLayers((prev) => prev.map((l) => l.name === name ? { ...l, visible } : l));
  }, []);

  const handleToggleLayerLock = useCallback((name: string, locked: boolean) => {
    setLayers((prev) => prev.map((l) => l.name === name ? { ...l, locked } : l));
  }, []);

  const handleLayerSelect = useCallback((name: string) => {
    setActiveLayer(name);
  }, []);

  const resetView = useCallback(() => {
    setViewport({ width: 800, height: 600, pan: { x: 0, y: 0 }, zoom: 1 });
  }, []);

  const handleCommand = useCallback(
    (cmd: string) => {
      const lower = cmd.toLowerCase();
      if (lower === "line") setCurrentTool("line");
      else if (lower === "circle") setCurrentTool("circle");
      else if (lower === "arc") setCurrentTool("arc");
      else if (lower === "pline" || lower === "polyline")
        setCurrentTool("polyline");
      else if (lower === "text") setCurrentTool("text");
      else if (lower === "point") setCurrentTool("point");
      else if (lower === "move") setCurrentTool("move");
      else if (lower === "rotate") setCurrentTool("rotate");
      else if (lower === "scale") setCurrentTool("scale");
      else if (lower === "clear") clearEntities();
      else if (lower === "reset") resetView();
    },
    [clearEntities, resetView],
  );

  // Handle canvas mouse move for snap visualization
  const handleCanvasMouseMove = useCallback(
    (worldPos: Point) => {
      setCursorWorld(worldPos);

      if (snapEnabled && currentTool !== "select") {
        const snapEngine = snapEngineRef.current;
        const result = snapEngine.findSnapPoint(worldPos, entities);
        if (result) {
          setSnapIndicator({ point: result.point, type: result.type });
        } else {
          setSnapIndicator(null);
        }
      } else {
        setSnapIndicator(null);
      }
    },
    [entities, currentTool, snapEnabled],
  );

  // Handle canvas click based on current tool
  const handleCanvasClick = useCallback(
    (worldPos: Point) => {
      // Only apply snap if snap is enabled
      let point = worldPos;
      if (snapEnabled) {
        const snapEngine = snapEngineRef.current;
        const snapResult = snapEngine.findSnapPoint(worldPos, entities);
        point = snapResult ? snapResult.point : worldPos;
      }

      switch (currentTool) {
        case "line": {
          const result = lineToolRef.current.handleClick(point);
          if (result) handleEntityCreate("LINE", result as unknown as Entity);
          break;
        }
        case "polyline": {
          const result = polylineToolRef.current.handleClick(point);
          if (result)
            handleEntityCreate("POLYLINE", result as unknown as Entity);
          break;
        }
        case "circle": {
          const result = circleToolRef.current.handleClick(point);
          if (result) handleEntityCreate("CIRCLE", result as unknown as Entity);
          break;
        }
        case "arc": {
          const result = arcToolRef.current.handleClick(point);
          if (result) handleEntityCreate("ARC", result as unknown as Entity);
          break;
        }
        case "text": {
          const result = textToolRef.current.handleClick(point);
          if (result) handleEntityCreate("TEXT", result as unknown as Entity);
          break;
        }
        case "point": {
          const result = pointToolRef.current.handleClick(point);
          if (result) handleEntityCreate("POINT", result as unknown as Entity);
          break;
        }
        case "select": {
          // Select tool always uses raw worldPos directly (never snap for selection)
          const hitEntity = hitTestEntities(entities, worldPos, viewport);
          setSelectedIds(hitEntity ? [hitEntity.id] : []);
          break;
        }
      }
    },
    [currentTool, entities, handleEntityCreate, snapEnabled, viewport],
  );

  // Handle canvas double-click for polyline close
  const handleCanvasDoubleClick = useCallback(
    (worldPos: Point) => {
      if (currentTool === "polyline") {
        const result = polylineToolRef.current.handleDoubleClick();
        if (result) handleEntityCreate("POLYLINE", result as unknown as Entity);
      }
    },
    [currentTool, handleEntityCreate],
  );

  if (viewMode === "2d-cad") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: COLORS.background,
          overflow: "hidden",
          fontFamily: "Segoe UI, Arial, sans-serif",
        }}
      >
        {/* Ribbon Toolbar */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: COLORS.panel,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          {/* Tab bar */}
          <div
            style={{
              display: "flex",
              background: "#2a2a2a",
              borderBottom: `1px solid ${COLORS.border}`,
              padding: "0 4px",
            }}
          >
            {["Home", "Annotate", "View", "Manage"].map((tab, i) => (
              <div
                key={tab}
                style={{
                  padding: "6px 16px",
                  color: activeTab === tab ? COLORS.text : COLORS.textDim,
                  fontSize: "12px",
                  fontWeight: activeTab === tab ? 600 : 400,
                  borderBottom:
                    activeTab === tab ? `2px solid ${COLORS.accent}` : "none",
                  cursor: "pointer",
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </div>
            ))}
          </div>

          {/* Tool panels */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "4px 8px",
              gap: "4px",
              background: COLORS.panel,
              flexWrap: "wrap",
            }}
          >
            {/* Draw tools */}
            <ToolButton
              icon={<Icons.Select />}
              label="Select"
              shortcut="S"
              active={currentTool === "select"}
              onClick={() => handleToolClick("select")}
            />
            <ToolButton
              icon={<Icons.Line />}
              label="Line"
              shortcut="L"
              active={currentTool === "line"}
              onClick={() => handleToolClick("line")}
            />
            <ToolButton
              icon={<Icons.Polyline />}
              label="Polyline"
              shortcut="P"
              active={currentTool === "polyline"}
              onClick={() => handleToolClick("polyline")}
            />
            <ToolButton
              icon={<Icons.Circle />}
              label="Circle"
              shortcut="C"
              active={currentTool === "circle"}
              onClick={() => handleToolClick("circle")}
            />
            <ToolButton
              icon={<Icons.Arc />}
              label="Arc"
              shortcut="A"
              active={currentTool === "arc"}
              onClick={() => handleToolClick("arc")}
            />
            <ToolButton
              icon={<Icons.Text />}
              label="Text"
              shortcut="T"
              active={currentTool === "text"}
              onClick={() => handleToolClick("text")}
            />
            <ToolButton
              icon={<Icons.Point />}
              label="Point"
              shortcut="PT"
              active={currentTool === "point"}
              onClick={() => handleToolClick("point")}
            />

            <div
              style={{
                width: "1px",
                height: "32px",
                background: COLORS.border,
                margin: "0 8px",
              }}
            />

            {/* Modify tools */}
            <ToolButton
              icon={<Icons.Move />}
              label="Move"
              shortcut="M"
              active={false}
              onClick={() => {}}
              disabled
              title="Not yet implemented"
            />
            <ToolButton
              icon={<Icons.Rotate />}
              label="Rotate"
              shortcut="RO"
              active={false}
              onClick={() => {}}
              disabled
              title="Not yet implemented"
            />
            <ToolButton
              icon={<Icons.Scale />}
              label="Scale"
              shortcut="SC"
              active={false}
              onClick={() => {}}
              disabled
              title="Not yet implemented"
            />

            <div
              style={{
                width: "1px",
                height: "32px",
                background: COLORS.border,
                margin: "0 8px",
              }}
            />

            {/* View toggles */}
            <ToolButton
              icon={<Icons.Grid />}
              label="Grid"
              active={showGrid}
              onClick={() => setShowGrid(!showGrid)}
            />
            <ToolButton
              icon={<Icons.Snap />}
              label="Snap"
              active={snapEnabled}
              onClick={() => setSnapEnabled(!snapEnabled)}
            />

            <div style={{ flex: 1 }} />

            {/* Utility buttons */}
            <button
              onClick={clearEntities}
              style={{
                padding: "4px 12px",
                border: "none",
                borderRadius: "4px",
                background: "#8b0000",
                color: COLORS.text,
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
            <button
              onClick={resetView}
              style={{
                padding: "4px 12px",
                border: "none",
                borderRadius: "4px",
                background: COLORS.buttonBg,
                color: COLORS.text,
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              Reset View
            </button>
            <button
              onClick={() => setShowExport(true)}
              style={{
                padding: "4px 12px",
                border: "none",
                borderRadius: "4px",
                background: "#006400",
                color: COLORS.text,
                fontSize: "11px",
                cursor: "pointer",
              }}
            >
              Export
            </button>
          </div>
        </div>

        {/* Main content area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            overflow: "hidden",
          }}
        >
          {/* Left panel - Layers */}
          {showLayers && (
            <div
              style={{
                width: "200px",
                background: COLORS.panel,
                borderRight: `1px solid ${COLORS.border}`,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "8px 12px",
                  borderBottom: `1px solid ${COLORS.border}`,
                  color: COLORS.text,
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Icons.Layers />
                Layers
              </div>
              <LayersPanel
                layers={layers}
                activeLayer={activeLayer}
                onLayerSelect={handleLayerSelect}
                onToggleVisibility={handleToggleLayerVisibility}
                onToggleLock={handleToggleLayerLock}
                onAddLayer={handleAddLayer}
                onDeleteLayer={handleDeleteLayer}
              />
            </div>
          )}

          {/* Canvas area */}
          <div
            data-cad-viewport-surface
            style={{
              flex: 1,
              position: "relative",
              width: "100%",
              height: "100%",
              minHeight: 0,
              overflow: "hidden",
              background: "#1a1a1a",
              touchAction: "none",
            }}
          >
            <CadCanvasLayer
              entities={entities}
              viewport={viewport}
              onViewportChange={handleViewportChange}
              onMouseMove={handleCanvasMouseMove}
              onClick={handleCanvasClick}
              onDoubleClick={handleCanvasDoubleClick}
              selectedIds={selectedIds}
              canvasRef={canvasRef}
            />
            <SnapOverlay snap={snapIndicator} viewport={viewport} />
          </div>

          {/* Right panel - Properties */}
          <div
            style={{
              width: "220px",
              background: COLORS.panel,
              borderLeft: `1px solid ${COLORS.border}`,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {selectedIds.length > 0 ? (
              <PropertiesPanel
                selectedEntity={entities.find((e) => e.id === selectedIds[0]) ?? null}
              />
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  fontSize: "11px",
                  color: COLORS.textDim,
                  padding: "8px",
                }}
              >
                <div style={{ marginBottom: "8px", fontSize: "11px", color: COLORS.textDim, textAlign: "center", padding: "20px" }}>
                  No selection
                </div>
                <div style={{ marginTop: "auto", fontSize: "10px", color: COLORS.textDim }}>
                  <div>Entities: {entities.length}</div>
                  <div>Zoom: {(viewport.zoom * 100).toFixed(0)}%</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Command line */}
        <CommandLine onCommand={handleCommand} />

        {/* Status bar */}
        <StatusBar
          cursor={cursorWorld}
          zoom={viewport.zoom}
          snapMode="Endpoint, Midpoint, Center"
          tool={currentTool}
        />

        {/* Export dialog */}
        {showExport && (
          <ExportDialog
            canvasRef={canvasRef}
            onClose={() => setShowExport(false)}
            defaultFilename="cad-export"
          />
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#0f172a",
        overflow: "hidden",
      }}
    >
      <div style={{ textAlign: "center", color: "#94a3b8" }}>
        <p style={{ margin: "0 0 0.5rem" }}>CadPointCloudEditor</p>
        <p style={{ fontSize: "12px", color: "#64748b" }}>
          viewMode: {viewMode}
        </p>
      </div>
    </div>
  );
}
