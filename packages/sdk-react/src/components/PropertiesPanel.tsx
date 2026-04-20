import React, { useState, useCallback } from "react";

export interface EntityProperty {
  id: string;
  type: string;
  layer: string;
  color: string;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  center?: { x: number; y: number };
  radius?: number;
  vertices?: { x: number; y: number }[];
  position?: { x: number; y: number };
  text?: string;
}

interface PropertiesPanelProps {
  selectedEntity?: EntityProperty | null;
  onPropertyChange?: (id: string, key: string, value: unknown) => void;
  collapsed?: boolean;
  onCollapse?: () => void;
}

const PANEL_BASE_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  background: "#3d3d3d",
  borderLeft: "1px solid #4d4d4d",
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
  padding: "8px",
};

const SECTION_STYLE: React.CSSProperties = {
  marginBottom: "12px",
};

const SECTION_TITLE_STYLE: React.CSSProperties = {
  color: "#888888",
  fontSize: "10px",
  textTransform: "uppercase",
  marginBottom: "6px",
  letterSpacing: "0.5px",
};

const PROPERTY_ROW_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "4px 0",
  gap: "8px",
};

const PROPERTY_LABEL_STYLE: React.CSSProperties = {
  color: "#b0b0b0",
  fontSize: "11px",
  flexShrink: 0,
};

const PROPERTY_VALUE_STYLE: React.CSSProperties = {
  color: "#e0e0e0",
  fontSize: "11px",
  fontFamily: "Consolas, 'Courier New', monospace",
  textAlign: "right",
  flex: 1,
  minWidth: 0,
};

const COORD_INPUT_STYLE: React.CSSProperties = {
  width: "60px",
  background: "#2d2d2d",
  border: "1px solid #4d4d4d",
  borderRadius: "2px",
  color: "#e0e0e0",
  padding: "2px 4px",
  fontSize: "10px",
  fontFamily: "inherit",
  textAlign: "right",
};

const COLOR_PICKER_STYLE: React.CSSProperties = {
  width: "20px",
  height: "20px",
  border: "1px solid #555",
  borderRadius: "2px",
  cursor: "pointer",
  padding: 0,
};

const EMPTY_STATE_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px 20px",
  color: "#707070",
  textAlign: "center",
  fontSize: "11px",
  gap: "8px",
};

function getPanelStyle(collapsed: boolean): React.CSSProperties {
  return {
    ...PANEL_BASE_STYLE,
    width: collapsed ? "32px" : "240px",
  };
}

export function PropertiesPanel({
  selectedEntity,
  onPropertyChange,
  collapsed = false,
  onCollapse,
}: PropertiesPanelProps) {
  const [localEntity, setLocalEntity] = useState<EntityProperty | null>(
    selectedEntity ?? null,
  );
  const panelStyle = getPanelStyle(collapsed);

  React.useEffect(() => {
    setLocalEntity(selectedEntity ?? null);
  }, [selectedEntity]);

  const handleCoordChange = useCallback(
    (key: string, axis: "x" | "y", value: string) => {
      if (!localEntity) return;
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return;

      const coordKey = key as keyof EntityProperty;
      const current = localEntity[coordKey] as
        | { x: number; y: number }
        | undefined;
      if (!current) return;

      const updated = {
        ...localEntity,
        [coordKey]: { ...current, [axis]: numValue },
      };
      setLocalEntity(updated);
      onPropertyChange?.(localEntity.id, coordKey, updated[coordKey]);
    },
    [localEntity, onPropertyChange],
  );

  if (collapsed) {
    return (
      <div style={panelStyle}>
        <div style={HEADER_STYLE} onClick={onCollapse}>
          <CollapseIcon collapsed={collapsed} />
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <div style={HEADER_STYLE} onClick={onCollapse}>
        <span style={TITLE_STYLE}>Properties</span>
        <CollapseIcon collapsed={collapsed} />
      </div>

      <div style={CONTENT_STYLE}>
        {!localEntity ? (
          <div style={EMPTY_STATE_STYLE}>
            <EmptyIcon />
            <span>No entity selected</span>
            <span style={{ fontSize: "10px" }}>
              Select an entity to view its properties
            </span>
          </div>
        ) : (
          <>
            <div style={SECTION_STYLE}>
              <div style={SECTION_TITLE_STYLE}>General</div>
              <div style={PROPERTY_ROW_STYLE}>
                <span style={PROPERTY_LABEL_STYLE}>Type</span>
                <span style={PROPERTY_VALUE_STYLE}>{localEntity.type}</span>
              </div>
              <div style={PROPERTY_ROW_STYLE}>
                <span style={PROPERTY_LABEL_STYLE}>Layer</span>
                <span style={PROPERTY_VALUE_STYLE}>{localEntity.layer}</span>
              </div>
              <div style={PROPERTY_ROW_STYLE}>
                <span style={PROPERTY_LABEL_STYLE}>Color</span>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <div
                    style={{
                      ...COLOR_PICKER_STYLE,
                      backgroundColor:
                        localEntity.color === "BYLAYER"
                          ? "#888"
                          : localEntity.color,
                    }}
                  />
                  <span style={PROPERTY_VALUE_STYLE}>{localEntity.color}</span>
                </div>
              </div>
            </div>

            {(localEntity.start || localEntity.end) && (
              <div style={SECTION_STYLE}>
                <div style={SECTION_TITLE_STYLE}>Geometry</div>
                {localEntity.start && (
                  <>
                    <div style={PROPERTY_ROW_STYLE}>
                      <span style={PROPERTY_LABEL_STYLE}>Start X</span>
                      <input
                        style={COORD_INPUT_STYLE}
                        type="number"
                        value={localEntity.start.x.toFixed(4)}
                        onChange={(e) =>
                          handleCoordChange("start", "x", e.target.value)
                        }
                      />
                    </div>
                    <div style={PROPERTY_ROW_STYLE}>
                      <span style={PROPERTY_LABEL_STYLE}>Start Y</span>
                      <input
                        style={COORD_INPUT_STYLE}
                        type="number"
                        value={localEntity.start.y.toFixed(4)}
                        onChange={(e) =>
                          handleCoordChange("start", "y", e.target.value)
                        }
                      />
                    </div>
                  </>
                )}
                {localEntity.end && (
                  <>
                    <div style={PROPERTY_ROW_STYLE}>
                      <span style={PROPERTY_LABEL_STYLE}>End X</span>
                      <input
                        style={COORD_INPUT_STYLE}
                        type="number"
                        value={localEntity.end.x.toFixed(4)}
                        onChange={(e) =>
                          handleCoordChange("end", "x", e.target.value)
                        }
                      />
                    </div>
                    <div style={PROPERTY_ROW_STYLE}>
                      <span style={PROPERTY_LABEL_STYLE}>End Y</span>
                      <input
                        style={COORD_INPUT_STYLE}
                        type="number"
                        value={localEntity.end.y.toFixed(4)}
                        onChange={(e) =>
                          handleCoordChange("end", "y", e.target.value)
                        }
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {localEntity.center && (
              <div style={SECTION_STYLE}>
                <div style={SECTION_TITLE_STYLE}>Center</div>
                <div style={PROPERTY_ROW_STYLE}>
                  <span style={PROPERTY_LABEL_STYLE}>X</span>
                  <input
                    style={COORD_INPUT_STYLE}
                    type="number"
                    value={localEntity.center.x.toFixed(4)}
                    onChange={(e) =>
                      handleCoordChange("center", "x", e.target.value)
                    }
                  />
                </div>
                <div style={PROPERTY_ROW_STYLE}>
                  <span style={PROPERTY_LABEL_STYLE}>Y</span>
                  <input
                    style={COORD_INPUT_STYLE}
                    type="number"
                    value={localEntity.center.y.toFixed(4)}
                    onChange={(e) =>
                      handleCoordChange("center", "y", e.target.value)
                    }
                  />
                </div>
                {localEntity.radius !== undefined && (
                  <div style={PROPERTY_ROW_STYLE}>
                    <span style={PROPERTY_LABEL_STYLE}>Radius</span>
                    <input
                      style={COORD_INPUT_STYLE}
                      type="number"
                      value={localEntity.radius.toFixed(4)}
                      onChange={(e) => {
                        if (!localEntity) return;
                        const numValue = parseFloat(e.target.value);
                        if (!isNaN(numValue)) {
                          const updated = { ...localEntity, radius: numValue };
                          setLocalEntity(updated);
                          onPropertyChange?.(
                            localEntity.id,
                            "radius",
                            numValue,
                          );
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {localEntity.position && (
              <div style={SECTION_STYLE}>
                <div style={SECTION_TITLE_STYLE}>Position</div>
                <div style={PROPERTY_ROW_STYLE}>
                  <span style={PROPERTY_LABEL_STYLE}>X</span>
                  <input
                    style={COORD_INPUT_STYLE}
                    type="number"
                    value={localEntity.position.x.toFixed(4)}
                    onChange={(e) =>
                      handleCoordChange("position", "x", e.target.value)
                    }
                  />
                </div>
                <div style={PROPERTY_ROW_STYLE}>
                  <span style={PROPERTY_LABEL_STYLE}>Y</span>
                  <input
                    style={COORD_INPUT_STYLE}
                    type="number"
                    value={localEntity.position.y.toFixed(4)}
                    onChange={(e) =>
                      handleCoordChange("position", "y", e.target.value)
                    }
                  />
                </div>
              </div>
            )}

            {localEntity.vertices && localEntity.vertices.length > 0 && (
              <div style={SECTION_STYLE}>
                <div style={SECTION_TITLE_STYLE}>
                  Vertices ({localEntity.vertices.length})
                </div>
                {localEntity.vertices.map((v, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", gap: "4px", marginBottom: "2px" }}
                  >
                    <span style={{ ...PROPERTY_LABEL_STYLE, fontSize: "10px" }}>
                      {i + 1}:
                    </span>
                    <span style={{ ...PROPERTY_VALUE_STYLE, fontSize: "10px" }}>
                      {v.x.toFixed(2)}, {v.y.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d={collapsed ? "M8 2L4 6L8 10" : "M2 4L6 8L10 4"}
        stroke="#b0b0b0"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect
        x="4"
        y="4"
        width="24"
        height="24"
        rx="2"
        stroke="#555"
        strokeWidth="1.5"
        strokeDasharray="4 2"
      />
      <circle
        cx="16"
        cy="16"
        r="6"
        stroke="#555"
        strokeWidth="1.5"
        strokeDasharray="3 2"
      />
    </svg>
  );
}
