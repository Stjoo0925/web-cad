import React, { useState, useCallback } from "react";
import { RibbonToolbar, type ToolType } from "./RibbonToolbar.js";
import { LayerPanel, type Layer } from "./LayerPanel.js";
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
      }
    },
    [lineTool, polylineTool],
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
        const newEntity = makeEntity("CIRCLE");
        setEntities((prev) => [...prev, newEntity]);
        onEntityAdd?.(newEntity);
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
      }
    },
    [activeTool, lineTool, polylineTool, viewport],
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
      }
    },
    [activeTool, lineTool, polylineTool, viewport],
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

        <div
          data-cad-viewport-surface
          style={VIEWPORT_STYLE}
        >
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
