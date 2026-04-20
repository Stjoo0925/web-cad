import React, { useState, useCallback } from "react";

export type ToolType =
  | "select"
  | "line"
  | "polyline"
  | "circle"
  | "arc"
  | "text"
  | "point"
  | "move"
  | "rotate"
  | "scale"
  | "dimension";

export interface RibbonTab {
  id: string;
  label: string;
  panels: RibbonPanel[];
}

export interface RibbonPanel {
  id: string;
  title: string;
  tools: RibbonTool[];
}

export interface RibbonTool {
  id: ToolType;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
}

interface RibbonToolbarProps {
  activeTab?: string;
  activeTool?: ToolType;
  onToolSelect?: (tool: ToolType) => void;
  onTabChange?: (tabId: string) => void;
  onToggleSnap?: () => void;
  onToggleGrid?: () => void;
  onToggleOrtho?: () => void;
  snapEnabled?: boolean;
  gridEnabled?: boolean;
  orthoEnabled?: boolean;
}

const RIBBON_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  background: "#2d2d2d",
  borderBottom: "1px solid #4d4d4d",
  flexShrink: 0,
};

const TAB_BAR_STYLE: React.CSSProperties = {
  display: "flex",
  background: "#2d2d2d",
  borderBottom: "1px solid #4d4d4d",
  padding: "0 4px",
};

const TAB_STYLE: React.CSSProperties = {
  padding: "8px 16px",
  color: "#b0b0b0",
  fontSize: "12px",
  fontWeight: 500,
  cursor: "pointer",
  borderBottom: "2px solid transparent",
  transition: "all 0.15s ease",
  userSelect: "none",
};

const TAB_ACTIVE: React.CSSProperties = {
  ...TAB_STYLE,
  color: "#ffffff",
  borderBottomColor: "#0e639c",
};

const PANEL_CONTAINER_STYLE: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "4px",
  padding: "8px 12px",
  background: "#3d3d3d",
  borderBottom: "1px solid #4d4d4d",
};

const PANEL_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  padding: "4px 8px",
  background: "#353535",
  borderRadius: "4px",
  minWidth: "80px",
};

const PANEL_TITLE_STYLE: React.CSSProperties = {
  color: "#888888",
  fontSize: "9px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: "4px",
  textAlign: "center",
};

const TOOL_GRID_STYLE: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "2px",
  justifyContent: "center",
};

const TOOL_BTN_STYLE: React.CSSProperties = {
  width: "32px",
  height: "32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "1px solid transparent",
  borderRadius: "3px",
  cursor: "pointer",
  transition: "all 0.1s ease",
};

const TOOL_BTN_HOVER: React.CSSProperties = {
  ...TOOL_BTN_STYLE,
  background: "#4d4d4d",
};

const TOOL_BTN_ACTIVE: React.CSSProperties = {
  ...TOOL_BTN_STYLE,
  background: "#0e639c",
  borderColor: "#1e8ece",
};

const TOOLBTN_TOOLTIP: React.CSSProperties = {
  position: "absolute" as const,
  bottom: "100%",
  left: "50%",
  transform: "translateX(-50%)",
  background: "#1e1e1e",
  color: "#ffffff",
  padding: "4px 8px",
  borderRadius: "3px",
  fontSize: "10px",
  whiteSpace: "nowrap",
  pointerEvents: "none" as const,
  zIndex: 1000,
  marginBottom: "4px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
};

const TOGGLE_BTN_STYLE: React.CSSProperties = {
  ...TOOL_BTN_STYLE,
  width: "28px",
  height: "28px",
};

const TOOLBAR_DIVIDER: React.CSSProperties = {
  width: "1px",
  background: "#4d4d4d",
  margin: "0 8px",
  alignSelf: "stretch",
};

const MODE_BAR_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  padding: "4px 12px",
  background: "#2d2d2d",
  borderBottom: "1px solid #353535",
};

const MODE_BTN_STYLE: React.CSSProperties = {
  padding: "4px 12px",
  fontSize: "11px",
  borderRadius: "3px",
  border: "1px solid #4d4d4d",
  background: "#3d3d3d",
  color: "#b0b0b0",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "4px",
  transition: "all 0.1s ease",
};

const MODE_BTN_ACTIVE: React.CSSProperties = {
  ...MODE_BTN_STYLE,
  background: "#0e639c",
  borderColor: "#1e8ece",
  color: "#ffffff",
};

const HOME_TAB: RibbonTab = {
  id: "home",
  label: "Home",
  panels: [
    {
      id: "selection",
      title: "Selection",
      tools: [
        {
          id: "select",
          label: "Select",
          icon: <SelectIcon />,
          shortcut: "ESC",
        },
      ],
    },
    {
      id: "draw",
      title: "Draw",
      tools: [
        { id: "line", label: "Line", icon: <LineIcon />, shortcut: "L" },
        {
          id: "polyline",
          label: "Polyline",
          icon: <PolylineIcon />,
          shortcut: "PL",
        },
        { id: "circle", label: "Circle", icon: <CircleIcon />, shortcut: "C" },
        { id: "arc", label: "Arc", icon: <ArcIcon />, shortcut: "A" },
        { id: "text", label: "Text", icon: <TextIcon />, shortcut: "DT" },
        { id: "point", label: "Point", icon: <PointIcon />, shortcut: "PO" },
      ],
    },
    {
      id: "modify",
      title: "Modify",
      tools: [
        { id: "move", label: "Move", icon: <MoveIcon />, shortcut: "M" },
        { id: "rotate", label: "Rotate", icon: <RotateIcon />, shortcut: "RO" },
        { id: "scale", label: "Scale", icon: <ScaleIcon />, shortcut: "SC" },
      ],
    },
  ],
};

const ANNOTATE_TAB: RibbonTab = {
  id: "annotate",
  label: "Annotate",
  panels: [
    {
      id: "text",
      title: "Text",
      tools: [
        { id: "text", label: "Text", icon: <TextIcon />, shortcut: "DT" },
      ],
    },
    {
      id: "dimension",
      title: "Dimension",
      tools: [
        {
          id: "dimension",
          label: "Dimension",
          icon: <DimensionIcon />,
          shortcut: "D",
        },
      ],
    },
  ],
};

export function RibbonToolbar({
  activeTab = "home",
  activeTool = "select",
  onToolSelect,
  onTabChange,
  onToggleSnap,
  onToggleGrid,
  onToggleOrtho,
  snapEnabled = false,
  gridEnabled = true,
  orthoEnabled = false,
}: RibbonToolbarProps) {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const tabs = [HOME_TAB, ANNOTATE_TAB];

  const currentTab = tabs.find((t) => t.id === activeTab) || HOME_TAB;

  const handleToolClick = useCallback(
    (toolId: ToolType) => {
      onToolSelect?.(toolId);
    },
    [onToolSelect],
  );

  return (
    <div style={RIBBON_STYLE}>
      <div style={TAB_BAR_STYLE}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            style={tab.id === activeTab ? TAB_ACTIVE : TAB_STYLE}
            onClick={() => onTabChange?.(tab.id)}
          >
            {tab.label}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "0 8px",
          }}
        >
          <button
            style={snapEnabled ? MODE_BTN_ACTIVE : MODE_BTN_STYLE}
            onClick={onToggleSnap}
            title="Snap Mode"
          >
            <SnapMiniIcon />
            SNAP
          </button>
          <button
            style={gridEnabled ? MODE_BTN_ACTIVE : MODE_BTN_STYLE}
            onClick={onToggleGrid}
            title="Grid Display"
          >
            <GridMiniIcon />
            GRID
          </button>
          <button
            style={orthoEnabled ? MODE_BTN_ACTIVE : MODE_BTN_STYLE}
            onClick={onToggleOrtho}
            title="Orthogonal Mode"
          >
            <OrthoMiniIcon />
            ORTHO
          </button>
        </div>
      </div>

      <div style={PANEL_CONTAINER_STYLE}>
        {currentTab.panels.map((panel) => (
          <div key={panel.id} style={PANEL_STYLE}>
            <div style={PANEL_TITLE_STYLE}>{panel.title}</div>
            <div style={TOOL_GRID_STYLE}>
              {panel.tools.map((tool) => {
                const isActive = tool.id === activeTool;
                const isHovered = hoveredTool === tool.id;
                return (
                  <div
                    key={tool.id}
                    style={{ position: "relative" }}
                    onMouseEnter={() => setHoveredTool(tool.id)}
                    onMouseLeave={() => setHoveredTool(null)}
                  >
                    <button
                      style={
                        isActive
                          ? TOOL_BTN_ACTIVE
                          : isHovered
                            ? TOOL_BTN_HOVER
                            : TOOL_BTN_STYLE
                      }
                      onClick={() => handleToolClick(tool.id)}
                      title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ""}`}
                    >
                      {tool.icon}
                    </button>
                    {isHovered && (
                      <div style={TOOLBTN_TOOLTIP}>
                        {tool.label}
                        {tool.shortcut && (
                          <span style={{ color: "#888", marginLeft: "4px" }}>
                            {tool.shortcut}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SelectIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M3 2L3 14L7 10L10 14L12 12L9 8L14 8L3 2Z"
        fill="#e0e0e0"
        stroke="#e0e0e0"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <line
        x1="3"
        y1="15"
        x2="15"
        y2="3"
        stroke="#e0e0e0"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="3" cy="15" r="2" fill="#e0e0e0" />
      <circle cx="15" cy="3" r="2" fill="#e0e0e0" />
    </svg>
  );
}

function PolylineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <polyline
        points="3,15 7,9 11,12 15,3"
        stroke="#e0e0e0"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="3" cy="15" r="1.5" fill="#e0e0e0" />
      <circle cx="7" cy="9" r="1.5" fill="#e0e0e0" />
      <circle cx="11" cy="12" r="1.5" fill="#e0e0e0" />
      <circle cx="15" cy="3" r="1.5" fill="#e0e0e0" />
    </svg>
  );
}

function CircleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle
        cx="9"
        cy="9"
        r="6"
        stroke="#e0e0e0"
        strokeWidth="2"
        fill="none"
      />
      <line x1="9" y1="3" x2="9" y2="6" stroke="#e0e0e0" strokeWidth="1.5" />
    </svg>
  );
}

function ArcIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M3 14 A8 8 0 0 1 15 6"
        stroke="#e0e0e0"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <line x1="3" y1="14" x2="5" y2="12" stroke="#e0e0e0" strokeWidth="1.5" />
      <line x1="15" y1="6" x2="13" y2="8" stroke="#e0e0e0" strokeWidth="1.5" />
    </svg>
  );
}

function TextIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <text
        x="4"
        y="14"
        fill="#e0e0e0"
        fontSize="12"
        fontFamily="Arial"
        fontWeight="bold"
      >
        A
      </text>
      <line x1="3" y1="16" x2="15" y2="16" stroke="#e0e0e0" strokeWidth="1" />
    </svg>
  );
}

function PointIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="3" fill="#e0e0e0" />
      <line x1="9" y1="2" x2="9" y2="5" stroke="#e0e0e0" strokeWidth="1" />
      <line x1="9" y1="13" x2="9" y2="16" stroke="#e0e0e0" strokeWidth="1" />
      <line x1="2" y1="9" x2="5" y2="9" stroke="#e0e0e0" strokeWidth="1" />
      <line x1="13" y1="9" x2="16" y2="9" stroke="#e0e0e0" strokeWidth="1" />
    </svg>
  );
}

function MoveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M9 2L9 16M2 9L16 9"
        stroke="#e0e0e0"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M5 5L9 2L13 5M5 13L9 16L13 13"
        stroke="#e0e0e0"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RotateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M14 9C14 12.3137 11.3137 15 8 15C4.68629 15 2 12.3137 2 9C2 5.68629 4.68629 3 8 3"
        stroke="#e0e0e0"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M6 3L8 6L11 4"
        stroke="#e0e0e0"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect
        x="3"
        y="3"
        width="5"
        height="5"
        stroke="#e0e0e0"
        strokeWidth="1.5"
        fill="none"
      />
      <rect
        x="10"
        y="10"
        width="5"
        height="5"
        stroke="#e0e0e0"
        strokeWidth="1.5"
        fill="none"
      />
      <line
        x1="8"
        y1="5.5"
        x2="10"
        y2="5.5"
        stroke="#e0e0e0"
        strokeWidth="1.5"
      />
      <line
        x1="8"
        y1="12.5"
        x2="10"
        y2="12.5"
        stroke="#e0e0e0"
        strokeWidth="1.5"
      />
      <line
        x1="5.5"
        y1="8"
        x2="5.5"
        y2="10"
        stroke="#e0e0e0"
        strokeWidth="1.5"
      />
      <line
        x1="12.5"
        y1="8"
        x2="12.5"
        y2="10"
        stroke="#e0e0e0"
        strokeWidth="1.5"
      />
      <path
        d="M6 8L9 11L12 8"
        stroke="#e0e0e0"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DimensionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <line x1="3" y1="14" x2="15" y2="14" stroke="#e0e0e0" strokeWidth="1.5" />
      <line x1="3" y1="10" x2="3" y2="16" stroke="#e0e0e0" strokeWidth="1.5" />
      <line
        x1="15"
        y1="10"
        x2="15"
        y2="16"
        stroke="#e0e0e0"
        strokeWidth="1.5"
      />
      <line
        x1="3"
        y1="12"
        x2="15"
        y2="12"
        stroke="#e0e0e0"
        strokeWidth="1"
        strokeDasharray="2 1"
      />
    </svg>
  );
}

function SnapMiniIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <circle
        cx="5"
        cy="5"
        r="2"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

function GridMiniIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <line
        x1="0"
        y1="3"
        x2="10"
        y2="3"
        stroke="currentColor"
        strokeWidth="0.5"
      />
      <line
        x1="0"
        y1="7"
        x2="10"
        y2="7"
        stroke="currentColor"
        strokeWidth="0.5"
      />
      <line
        x1="3"
        y1="0"
        x2="3"
        y2="10"
        stroke="currentColor"
        strokeWidth="0.5"
      />
      <line
        x1="7"
        y1="0"
        x2="7"
        y2="10"
        stroke="currentColor"
        strokeWidth="0.5"
      />
    </svg>
  );
}

function OrthoMiniIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <line
        x1="5"
        y1="0"
        x2="5"
        y2="10"
        stroke="currentColor"
        strokeWidth="1"
      />
      <line
        x1="0"
        y1="5"
        x2="10"
        y2="5"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}
