import React, { useState, useCallback, useEffect } from "react";
import { RibbonToolbar, type ToolType } from "./RibbonToolbar.js";
import { LayerPanel } from "./LayerPanel.js";
import type { Layer } from "../tools/layer-filter";
import { PropertiesPanel, type EntityProperty } from "./PropertiesPanel.js";
import { CommandLine } from "./CommandLine.js";
import { StatusBar } from "./StatusBar.js";
import { CadCanvasLayer } from "../canvas/CadCanvasLayer.js";
import type { Viewport, Entity } from "../canvas/cad-canvas-renderer.js";
import { createLineTool, type LineEntity } from "../tools/line-tool.js";
import {
  createPolylineTool,
  type PolylineEntity,
} from "../tools/polyline-tool.js";
import { createCircleTool, type CircleEntity } from "../tools/circle-tool.js";
import { createArcTool, type ArcEntity } from "../tools/arc-tool.js";
import { createPointTool, type PointEntity } from "../tools/point-tool.js";
import { createTextTool, type TextEntity } from "../tools/text-tool.js";
import { createMoveCommand } from "../commands/move-command.js";
import { createRotateCommand } from "../commands/rotate-command.js";
import { createScaleCommand } from "../commands/scale-command.js";

interface EditorShellProps {
  initialEntities?: Entity[];
  initialViewport?: Viewport;
  onEntityAdd?: (entity: Entity) => void;
  onSelectionChange?: (entityIds: string[]) => void;
  onViewportChange?: (viewport: Viewport) => void;
  onCommandExecute?: (command: string) => void;
}

const SHELL_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  width: "100%",
  height: "100%",
  background: "#2d2d2d",
  overflow: "hidden",
  fontFamily: "Arial, sans-serif",
};

const MAIN_STYLE: React.CSSProperties = {
  display: "flex",
  flex: 1,
  overflow: "hidden",
};

const VIEWPORT_STYLE: React.CSSProperties = {
  flex: 1,
  position: "relative",
  width: "100%",
  height: "100%",
  minHeight: 0,
  overflow: "hidden",
  background: "#1e1e1e",
  touchAction: "none",
};

const SIDE_PANELS_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const DEFAULT_LAYERS: Layer[] = [
  { id: "0", name: "0", visible: true, locked: false, color: "#ffffff" },
  { id: "1", name: "Layer_1", visible: true, locked: false, color: "#ff0000" },
  { id: "2", name: "Layer_2", visible: true, locked: false, color: "#00ff00" },
];

function makeEntity(type: string): Entity {
  const id = Math.random().toString(36).slice(2, 8);
  if (type === "POINT")
    return {
      type,
      id,
      position: { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 },
      color: "#3b82f6",
    };
  if (type === "LINE")
    return {
      type,
      id,
      start: { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 },
      end: { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 },
      color: "#22c55e",
    };
  if (type === "POLYLINE") {
    const pts = Array.from({ length: 4 }, () => ({
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100,
    }));
    return { type, id, vertices: pts, closed: true, color: "#f59e0b" };
  }
  if (type === "CIRCLE")
    return {
      type,
      id,
      center: { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 },
      radius: 30,
      color: "#ef4444",
    };
  return { type, id };
}

export function EditorShell({
  initialEntities = [],
  initialViewport,
  onEntityAdd,
  onSelectionChange,
  onViewportChange,
  onCommandExecute,
}: EditorShellProps) {
  const [activeTab, setActiveTab] = useState("home");
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [entities, setEntities] = useState<Entity[]>(initialEntities);
  const [viewport, setViewport] = useState<Viewport>(
    initialViewport ?? {
      width: 800,
      height: 600,
      pan: { x: 0, y: 0 },
      zoom: 1,
    },
  );
  const [selection, setSelection] = useState<string[]>([]);
  const [layers, setLayers] = useState<Layer[]>(DEFAULT_LAYERS);
  const [activeLayer, setActiveLayer] = useState("0");
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [orthoEnabled, setOrthoEnabled] = useState(false);
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [history, setHistory] = useState<Entity[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Push current state to history
  const pushHistory = useCallback(
    (newEntities: Entity[]) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push([...newEntities]);
        return newHistory;
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex],
  );

  // Undo: restore previous state
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
      setEntities(history[historyIndex - 1]);
    }
  }, [historyIndex, history]);

  // Redo: restore next state
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1);
      setEntities(history[historyIndex + 1]);
    }
  }, [historyIndex, history]);

  // Keyboard shortcuts for undo/redo (Ctrl+Z / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "y" || (e.shiftKey && e.key === "z"))
      ) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  const [lineTool] = useState(() =>
    createLineTool({
      onComplete: (entity: LineEntity) => {
        const newEntity: Entity = {
          id: entity.id,
          type: entity.type,
          start: entity.start,
          end: entity.end,
          layer: entity.layer,
          color: entity.color,
        };
        setEntities((prev) => [...prev, newEntity]);
        onEntityAdd?.(newEntity);
      },
    }),
  );

  const [polylineTool] = useState(() =>
    createPolylineTool({
      onComplete: (entity: PolylineEntity) => {
        const newEntity: Entity = {
          id: entity.id,
          type: entity.type,
          vertices: entity.vertices,
          closed: entity.closed,
          layer: entity.layer,
          color: entity.color,
        };
        setEntities((prev) => [...prev, newEntity]);
        onEntityAdd?.(newEntity);
      },
    }),
  );

  const [circleTool] = useState(() =>
    createCircleTool({
      onComplete: (entity: CircleEntity) => {
        const newEntity: Entity = {
          id: entity.id,
          type: entity.type,
          center: entity.center,
          radius: entity.radius,
          layer: entity.layer,
          color: entity.color,
        };
        setEntities((prev) => [...prev, newEntity]);
        onEntityAdd?.(newEntity);
      },
    }),
  );

  const [arcTool] = useState(() =>
    createArcTool({
      onComplete: (entity: ArcEntity) => {
        const newEntity: Entity = {
          id: entity.id,
          type: entity.type,
          center: entity.center,
          radius: entity.radius,
          startAngle: entity.startAngle,
          endAngle: entity.endAngle,
          layer: entity.layer,
          color: entity.color,
        };
        setEntities((prev) => [...prev, newEntity]);
        onEntityAdd?.(newEntity);
      },
    }),
  );

  const [pointTool] = useState(() =>
    createPointTool({
      onComplete: (entity: PointEntity) => {
        const newEntity: Entity = {
          id: entity.id,
          type: entity.type,
          position: entity.position,
          layer: entity.layer,
          color: entity.color,
        };
        setEntities((prev) => [...prev, newEntity]);
        onEntityAdd?.(newEntity);
      },
    }),
  );

  const [textTool] = useState(() =>
    createTextTool({
      onComplete: (entity: TextEntity) => {
        const newEntity: Entity = {
          id: entity.id,
          type: entity.type,
          position: entity.position,
          layer: entity.layer,
          color: entity.color,
        };
        setEntities((prev) => [...prev, newEntity]);
        onEntityAdd?.(newEntity);
      },
    }),
  );

  const handleViewportChange = useCallback(
    (newViewport: Viewport) => {
      setViewport(newViewport);
      onViewportChange?.(newViewport);
    },
    [onViewportChange],
  );

  const handleToolSelect = useCallback(
    (tool: ToolType) => {
      setActiveTool(tool);
      if (tool === "line") {
        lineTool.cancel();
      } else if (tool === "polyline") {
        polylineTool.cancel();
      } else if (tool === "circle") {
        circleTool.cancel();
      } else if (tool === "arc") {
        arcTool.cancel();
      } else if (tool === "point") {
        pointTool.cancel();
      } else if (tool === "text") {
        textTool.cancel();
      }
    },
    [lineTool, polylineTool, circleTool, arcTool, pointTool, textTool],
  );

  const handleCommand = useCallback(
    (command: string) => {
      setCommandHistory((prev) => [...prev, command]);
      const cmd = command.toUpperCase();

      if (cmd === "LINE") {
        setActiveTool("line");
      } else if (cmd === "POLYLINE" || cmd === "PL") {
        setActiveTool("polyline");
      } else if (cmd === "CIRCLE" || cmd === "C") {
        setActiveTool("circle");
      } else if (cmd === "ARC" || cmd === "A") {
        setActiveTool("arc");
      } else if (cmd === "POINT" || cmd === "PT") {
        setActiveTool("point");
      } else if (cmd === "TEXT" || cmd === "T") {
        setActiveTool("text");
      } else if (cmd === "CLEAR") {
        setEntities([]);
      } else if (cmd === "RESET") {
        setViewport({ width: 800, height: 600, pan: { x: 0, y: 0 }, zoom: 1 });
      } else if (cmd === "SNAP") {
        setSnapEnabled((prev) => !prev);
      } else if (cmd === "GRID") {
        setGridEnabled((prev) => !prev);
      } else if (cmd === "ORTHO") {
        setOrthoEnabled((prev) => !prev);
      }

      onCommandExecute?.(command);
    },
    [onEntityAdd, onCommandExecute],
  );

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const worldX = (screenX - viewport.pan.x) / viewport.zoom;
      const worldY = (screenY - viewport.pan.y) / viewport.zoom;

      if (activeTool === "line") {
        lineTool.handleClick({ x: worldX, y: worldY });
      } else if (activeTool === "polyline") {
        if (e.detail === 2) {
          polylineTool.handleDoubleClick();
        } else {
          polylineTool.handleClick({ x: worldX, y: worldY });
        }
      } else if (activeTool === "circle") {
        circleTool.handleClick({ x: worldX, y: worldY });
      } else if (activeTool === "arc") {
        arcTool.handleClick({ x: worldX, y: worldY });
      } else if (activeTool === "point") {
        pointTool.handleClick({ x: worldX, y: worldY });
      } else if (activeTool === "text") {
        textTool.handleClick({ x: worldX, y: worldY });
      }
    },
    [
      activeTool,
      lineTool,
      polylineTool,
      circleTool,
      arcTool,
      pointTool,
      textTool,
      viewport,
    ],
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const worldX = (screenX - viewport.pan.x) / viewport.zoom;
      const worldY = (screenY - viewport.pan.y) / viewport.zoom;

      setMouseCoords({ x: worldX, y: worldY });

      if (activeTool === "line") {
        lineTool.handleMove({ x: worldX, y: worldY });
      } else if (activeTool === "polyline") {
        polylineTool.handleMove({ x: worldX, y: worldY });
      } else if (activeTool === "circle") {
        circleTool.handleMove({ x: worldX, y: worldY });
      } else if (activeTool === "arc") {
        arcTool.handleMove({ x: worldX, y: worldY });
      }
    },
    [activeTool, lineTool, polylineTool, circleTool, arcTool, viewport],
  );

  const selectedEntity =
    selection.length === 1
      ? (entities.find((e) => e.id === selection[0]) ?? null)
      : null;

  const selectedProperty: EntityProperty | null = selectedEntity
    ? {
        id: selectedEntity.id!,
        type: selectedEntity.type,
        layer:
          ((selectedEntity as Record<string, unknown>).layer as string) || "0",
        color:
          ((selectedEntity as Record<string, unknown>).color as string) ||
          "BYLAYER",
        start: selectedEntity.start,
        end: selectedEntity.end,
        center: selectedEntity.center,
        radius: selectedEntity.radius,
        vertices: selectedEntity.vertices,
        position: selectedEntity.position,
      }
    : null;

  return (
    <div style={SHELL_STYLE}>
      <RibbonToolbar
        activeTab={activeTab}
        activeTool={activeTool}
        onToolSelect={handleToolSelect}
        onTabChange={setActiveTab}
        onToggleSnap={() => setSnapEnabled((prev) => !prev)}
        onToggleGrid={() => setGridEnabled((prev) => !prev)}
        onToggleOrtho={() => setOrthoEnabled((prev) => !prev)}
        snapEnabled={snapEnabled}
        gridEnabled={gridEnabled}
        orthoEnabled={orthoEnabled}
      />

      <div style={MAIN_STYLE}>
        <LayerPanel
          layers={layers}
          activeLayer={activeLayer}
          onLayerSelect={setActiveLayer}
          onLayerToggleVisibility={(id) => {
            setLayers((prev) =>
              prev.map((l) =>
                l.id === id ? { ...l, visible: !l.visible } : l,
              ),
            );
          }}
          onLayerToggleLock={(id) => {
            setLayers((prev) =>
              prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)),
            );
          }}
          collapsed={leftPanelCollapsed}
          onCollapse={() => setLeftPanelCollapsed((prev) => !prev)}
        />

        <div data-cad-viewport-surface style={VIEWPORT_STYLE}>
          <CadCanvasLayer
            entities={entities}
            viewport={viewport}
            onViewportChange={handleViewportChange}
          />
        </div>

        <div style={SIDE_PANELS_STYLE}>
          <PropertiesPanel
            selectedEntity={selectedProperty}
            collapsed={rightPanelCollapsed}
            onCollapse={() => setRightPanelCollapsed((prev) => !prev)}
          />
        </div>
      </div>

      <CommandLine onCommand={handleCommand} history={commandHistory} />

      <StatusBar
        coordinates={mouseCoords}
        zoom={viewport.zoom}
        snapMode={snapEnabled}
        orthoMode={orthoEnabled}
        gridVisible={gridEnabled}
      />
    </div>
  );
}
