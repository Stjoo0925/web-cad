import React, { useState, useCallback, useMemo } from "react";
import {
  filterLayers,
  filterEntitiesByLayer,
  batchChangeEntityColor,
  batchChangeEntityLineWidth,
  getLayerEntityStats,
} from "../tools/layer-filter";
import type { Layer, Entity, LayerFilterCriteria } from "../tools/layer-filter";

interface LayerPanelProps {
  layers?: Layer[];
  entities?: Entity[];
  activeLayer?: string;
  onLayerSelect?: (layerId: string) => void;
  onLayerToggleVisibility?: (layerId: string) => void;
  onLayerToggleLock?: (layerId: string) => void;
  onLayerAdd?: (name: string) => void;
  onLayerDelete?: (layerId: string) => void;
  onBatchColorChange?: (layerName: string, color: string, entityIds: string[]) => void;
  onBatchLineWeightChange?: (layerName: string, lineWidth: number, entityIds: string[]) => void;
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

const FILTER_INPUT_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  background: "#2d2d2d",
  border: "1px solid #4d4d4d",
  borderRadius: "3px",
  color: "#e0e0e0",
  fontSize: "11px",
  margin: "6px 8px",
  boxSizing: "border-box",
};

const BATCH_SECTION_STYLE: React.CSSProperties = {
  padding: "8px",
  borderTop: "1px solid #4d4d4d",
  borderBottom: "1px solid #353535",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const BATCH_ROW_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const BATCH_LABEL_STYLE: React.CSSProperties = {
  color: "#b0b0b0",
  fontSize: "10px",
  minWidth: "50px",
};

const COLOR_INPUT_STYLE: React.CSSProperties = {
  width: "28px",
  height: "22px",
  border: "1px solid #555",
  borderRadius: "2px",
  cursor: "pointer",
  padding: 0,
  background: "transparent",
};

const LINEWIDTH_SELECT_STYLE: React.CSSProperties = {
  flex: 1,
  padding: "3px 4px",
  background: "#2d2d2d",
  border: "1px solid #4d4d4d",
  borderRadius: "2px",
  color: "#e0e0e0",
  fontSize: "11px",
};

const BATCH_BTN_STYLE: React.CSSProperties = {
  padding: "4px 8px",
  background: "#0d7dd4",
  border: "none",
  borderRadius: "3px",
  color: "#fff",
  fontSize: "10px",
  cursor: "pointer",
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

const ENTITY_COUNT_STYLE: React.CSSProperties = {
  color: "#707070",
  fontSize: "10px",
  minWidth: "30px",
  textAlign: "right",
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

const LINEWIDTH_OPTIONS = [
  { value: 0.25, label: "0.25" },
  { value: 0.5, label: "0.5" },
  { value: 0.75, label: "0.75" },
  { value: 1.0, label: "1.0" },
  { value: 1.5, label: "1.5" },
  { value: 2.0, label: "2.0" },
  { value: 3.0, label: "3.0" },
];

const DEFAULT_LAYERS: Layer[] = [
  { id: "0", name: "0", visible: true, locked: false, color: "#ffffff" },
  { id: "1", name: "Layer_1", visible: true, locked: false, color: "#ff0000" },
  { id: "2", name: "Layer_2", visible: true, locked: false, color: "#00ff00" },
  { id: "3", name: "Layer_3", visible: false, locked: true, color: "#0000ff" },
];

function getPanelStyle(collapsed: boolean): React.CSSProperties {
  return {
    ...PANEL_BASE_STYLE,
    width: collapsed ? "32px" : "240px",
  };
}

export function LayerPanel({
  layers = DEFAULT_LAYERS,
  entities = [],
  activeLayer = "0",
  onLayerSelect,
  onLayerToggleVisibility,
  onLayerToggleLock,
  onLayerAdd,
  onLayerDelete,
  onBatchColorChange,
  onBatchLineWeightChange,
  collapsed = false,
  onCollapse,
}: LayerPanelProps) {
  const [localLayers, setLocalLayers] = useState<Layer[]>(layers);
  const [filterText, setFilterText] = useState("");
  const [batchColor, setBatchColor] = useState("#ff0000");
  const [batchLineWidth, setBatchLineWidth] = useState(1.0);
  const panelStyle = getPanelStyle(collapsed);

  // 레이어별 엔티티 수 통계
  const layerStats = useMemo(() => {
    return getLayerEntityStats(entities, localLayers);
  }, [entities, localLayers]);

  // 필터링된 레이어
  const filteredLayers = useMemo(() => {
    if (!filterText.trim()) return localLayers;
    const criteria: LayerFilterCriteria = { namePattern: filterText };
    return filterLayers(localLayers, criteria);
  }, [localLayers, filterText]);

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

  // 선택된 레이어의 엔티티 일괄 색상 변경
  const handleBatchColorApply = useCallback(() => {
    const layer = localLayers.find((l) => l.id === activeLayer);
    if (!layer) return;
    const entityIds = batchChangeEntityColor(entities, layer.name, batchColor);
    if (entityIds.length > 0) {
      onBatchColorChange?.(layer.name, batchColor, entityIds);
    }
  }, [localLayers, activeLayer, entities, batchColor, onBatchColorChange]);

  // 선택된 레이어의 엔티티 일괄 선폭 변경
  const handleBatchLineWidthApply = useCallback(() => {
    const layer = localLayers.find((l) => l.id === activeLayer);
    if (!layer) return;
    const entityIds = batchChangeEntityLineWidth(entities, layer.name, batchLineWidth);
    if (entityIds.length > 0) {
      onBatchLineWeightChange?.(layer.name, batchLineWidth, entityIds);
    }
  }, [localLayers, activeLayer, entities, batchLineWidth, onBatchLineWeightChange]);

  // 선택된 레이어 이름
  const activeLayerName = useMemo(() => {
    const layer = localLayers.find((l) => l.id === activeLayer);
    return layer?.name ?? "";
  }, [localLayers, activeLayer]);

  // 선택된 레이어의 엔티티 수
  const activeLayerEntityCount = activeLayerName ? layerStats.get(activeLayerName) ?? 0 : 0;

  return (
    <div style={panelStyle}>
      <div style={HEADER_STYLE} onClick={onCollapse}>
        <span style={TITLE_STYLE}>{collapsed ? "" : "Layers"}</span>
        <CollapseIcon collapsed={collapsed} />
      </div>

      {!collapsed && (
        <>
          {/* 필터 입력창 */}
          <input
            style={FILTER_INPUT_STYLE}
            type="text"
            placeholder="Filter layers..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            title="Filter layers by name"
          />

          {/* 선택된 레이어의 일괄 작업 */}
          {activeLayer && activeLayerEntityCount > 0 && (
            <div style={BATCH_SECTION_STYLE}>
              <div style={{ color: "#888", fontSize: "10px", marginBottom: "2px" }}>
                Batch Edit ({activeLayerEntityCount} entities)
              </div>
              <div style={BATCH_ROW_STYLE}>
                <span style={BATCH_LABEL_STYLE}>Color:</span>
                <input
                  style={COLOR_INPUT_STYLE}
                  type="color"
                  value={batchColor}
                  onChange={(e) => setBatchColor(e.target.value)}
                  title="Select color for batch change"
                />
                <button
                  style={BATCH_BTN_STYLE}
                  onClick={handleBatchColorApply}
                  title="Apply color to all entities in selected layer"
                >
                  Apply
                </button>
              </div>
              <div style={BATCH_ROW_STYLE}>
                <span style={BATCH_LABEL_STYLE}>Line W:</span>
                <select
                  style={LINEWIDTH_SELECT_STYLE}
                  value={batchLineWidth}
                  onChange={(e) => setBatchLineWidth(parseFloat(e.target.value))}
                  title="Select line width for batch change"
                >
                  {LINEWIDTH_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  style={BATCH_BTN_STYLE}
                  onClick={handleBatchLineWidthApply}
                  title="Apply line width to all entities in selected layer"
                >
                  Apply
                </button>
              </div>
            </div>
          )}

          <div style={CONTENT_STYLE}>
            {filteredLayers.map((layer) => (
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

                {/* 엔티티 수 표시 */}
                <span
                  style={{
                    ...ENTITY_COUNT_STYLE,
                    opacity: layer.visible ? 1 : 0.5,
                  }}
                  title="Entity count"
                >
                  {layerStats.get(layer.name) ?? 0}
                </span>
              </div>
            ))}
            {filteredLayers.length === 0 && (
              <div style={{ padding: "12px 8px", color: "#666", fontSize: "11px", textAlign: "center" }}>
                No layers match filter
              </div>
            )}
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