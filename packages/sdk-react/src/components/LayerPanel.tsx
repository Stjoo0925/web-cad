import React, { useState, useCallback } from "react";

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
}

interface LayerPanelProps {
  layers?: Layer[];
  activeLayer?: string;
  onLayerSelect?: (layerId: string) => void;
  onLayerToggleVisibility?: (layerId: string) => void;
  onLayerToggleLock?: (layerId: string) => void;
  onLayerAdd?: (name: string) => void;
  onLayerDelete?: (layerId: string) => void;
  collapsed?: boolean;
  onCollapse?: () => void;
}

const PANEL_BASE_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  background: "#3d3d3d",
  borderRight: "1px solid #4d4d4d",
  fontSize: "12px",
  fontFamily: "Arial, sans-serif",
  transition: "width 0.2s ease",
  overflow: "hidden",
  flexShrink: 0,
};

const HEADER_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "8px",
  background: "#2d2d2d",
  borderBottom: "1px solid #4d4d4d",
  cursor: "pointer",
  userSelect: "none",
};

const TITLE_STYLE: React.CSSProperties = {
  color: "#e0e0e0",
  fontWeight: "bold",
  fontSize: "12px",
};

const CONTENT_STYLE: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
};

const LAYER_ITEM_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "6px 8px",
  cursor: "pointer",
  borderBottom: "1px solid #353535",
  gap: "6px",
};

const LAYER_ITEM_ACTIVE: React.CSSProperties = {
  ...LAYER_ITEM_STYLE,
  background: "#0e639c",
};

const VISIBILITY_BTN_STYLE: React.CSSProperties = {
  width: "18px",
  height: "18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  padding: 0,
  borderRadius: "2px",
  flexShrink: 0,
};

const LOCK_BTN_STYLE: React.CSSProperties = {
  ...VISIBILITY_BTN_STYLE,
  color: "#b0b0b0",
};

const COLOR_SWATCH_STYLE: React.CSSProperties = {
  width: "14px",
  height: "14px",
  borderRadius: "2px",
  border: "1px solid #555",
  flexShrink: 0,
};

const LAYER_NAME_STYLE: React.CSSProperties = {
  flex: 1,
  color: "#d0d0d0",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  fontSize: "11px",
};

const ADD_BTN_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "6px",
  background: "#2d2d2d",
  borderTop: "1px solid #4d4d4d",
  cursor: "pointer",
  color: "#b0b0b0",
  fontSize: "11px",
  gap: "4px",
};

const DEFAULT_LAYERS: Layer[] = [
  { id: "0", name: "0", visible: true, locked: false, color: "#ffffff" },
  { id: "1", name: "Layer_1", visible: true, locked: false, color: "#ff0000" },
  { id: "2", name: "Layer_2", visible: true, locked: false, color: "#00ff00" },
  { id: "3", name: "Layer_3", visible: false, locked: true, color: "#0000ff" },
];

function getPanelStyle(collapsed: boolean): React.CSSProperties {
  return {
    ...PANEL_BASE_STYLE,
    width: collapsed ? "32px" : "220px",
  };
}

export function LayerPanel({
  layers = DEFAULT_LAYERS,
  activeLayer = "0",
  onLayerSelect,
  onLayerToggleVisibility,
  onLayerToggleLock,
  onLayerAdd,
  onLayerDelete,
  collapsed = false,
  onCollapse,
}: LayerPanelProps) {
  const [localLayers, setLocalLayers] = useState<Layer[]>(layers);
  const panelStyle = getPanelStyle(collapsed);

  const handleToggleVisibility = useCallback(
    (layerId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setLocalLayers((prev) =>
        prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l)),
      );
      onLayerToggleVisibility?.(layerId);
    },
    [onLayerToggleVisibility],
  );

  const handleToggleLock = useCallback(
    (layerId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setLocalLayers((prev) =>
        prev.map((l) => (l.id === layerId ? { ...l, locked: !l.locked } : l)),
      );
      onLayerToggleLock?.(layerId);
    },
    [onLayerToggleLock],
  );

  const handleAddLayer = useCallback(() => {
    const newId = `layer-${Date.now()}`;
    const newLayer: Layer = {
      id: newId,
      name: `Layer_${localLayers.length + 1}`,
      visible: true,
      locked: false,
      color:
        "#" +
        Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, "0"),
    };
    setLocalLayers((prev) => [...prev, newLayer]);
    onLayerAdd?.(newLayer.name);
  }, [localLayers.length, onLayerAdd]);

  return (
    <div style={panelStyle}>
      <div style={HEADER_STYLE} onClick={onCollapse}>
        <span style={TITLE_STYLE}>{collapsed ? "" : "Layers"}</span>
        <CollapseIcon collapsed={collapsed} />
      </div>

      {!collapsed && (
        <>
          <div style={CONTENT_STYLE}>
            {localLayers.map((layer) => (
              <div
                key={layer.id}
                style={
                  layer.id === activeLayer
                    ? LAYER_ITEM_ACTIVE
                    : LAYER_ITEM_STYLE
                }
                onClick={() => onLayerSelect?.(layer.id)}
              >
                <button
                  style={VISIBILITY_BTN_STYLE}
                  onClick={(e) => handleToggleVisibility(layer.id, e)}
                  title={layer.visible ? "Hide Layer" : "Show Layer"}
                >
                  <VisibilityIcon visible={layer.visible} />
                </button>

                <button
                  style={LOCK_BTN_STYLE}
                  onClick={(e) => handleToggleLock(layer.id, e)}
                  title={layer.locked ? "Unlock Layer" : "Lock Layer"}
                >
                  <LockIcon locked={layer.locked} />
                </button>

                <div
                  style={{
                    ...COLOR_SWATCH_STYLE,
                    backgroundColor: layer.color,
                    opacity: layer.visible ? 1 : 0.3,
                  }}
                />

                <span
                  style={{
                    ...LAYER_NAME_STYLE,
                    opacity: layer.visible ? 1 : 0.5,
                  }}
                >
                  {layer.name}
                </span>
              </div>
            ))}
          </div>

          <div style={ADD_BTN_STYLE} onClick={handleAddLayer}>
            <PlusIcon />
            <span>Add Layer</span>
          </div>
        </>
      )}
    </div>
  );
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d={collapsed ? "M4 2L8 6L4 10" : "M2 4L6 8L10 4"}
        stroke="#b0b0b0"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VisibilityIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M1 7C1 7 3 3 7 3C11 3 13 7 13 7C13 7 11 11 7 11C3 11 1 7 1 7Z"
          stroke="#22c55e"
          strokeWidth="1.2"
          fill="none"
        />
        <circle
          cx="7"
          cy="7"
          r="2"
          stroke="#22c55e"
          strokeWidth="1.2"
          fill="none"
        />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M1 7C1 7 3 3 7 3C11 3 13 7 13 7C13 7 11 11 7 11C3 11 1 7 1 7Z"
        stroke="#ef4444"
        strokeWidth="1.2"
        fill="none"
      />
      <line x1="2" y1="12" x2="12" y2="2" stroke="#ef4444" strokeWidth="1.2" />
    </svg>
  );
}

function LockIcon({ locked }: { locked: boolean }) {
  if (locked) {
    return (
      <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
        <rect
          x="2"
          y="6"
          width="8"
          height="7"
          rx="1"
          stroke="#f59e0b"
          strokeWidth="1.2"
          fill="none"
        />
        <path
          d="M4 6V4C4 2.89543 4.89543 2 6 2V2C7.10457 2 8 2.89543 8 4V6"
          stroke="#f59e0b"
          strokeWidth="1.2"
        />
      </svg>
    );
  }
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
      <rect
        x="2"
        y="6"
        width="8"
        height="7"
        rx="1"
        stroke="#707070"
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M4 6V4C4 2.89543 4.89543 2 6 2V2C7.10457 2 8 2.89543 8 4"
        stroke="#707070"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <line
        x1="6"
        y1="1"
        x2="6"
        y2="11"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="1"
        y1="6"
        x2="11"
        y2="6"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
