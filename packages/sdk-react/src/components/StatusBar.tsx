import React from "react";

interface StatusBarProps {
  coordinates: { x: number; y: number };
  zoom: number;
  snapMode: boolean;
  orthoMode: boolean;
  gridVisible: boolean;
  cursorSnap?: string;
}

const STATUSBAR_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  height: "24px",
  padding: "0 8px",
  background: "#2d2d2d",
  borderTop: "1px solid #4d4d4d",
  fontSize: "11px",
  color: "#b0b0b0",
  fontFamily: "Arial, sans-serif",
  flexShrink: 0,
};

const SECTION_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const INDICATOR_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  padding: "2px 6px",
  borderRadius: "2px",
  background: "#3d3d3d",
  border: "1px solid #4d4d4d",
  fontSize: "10px",
};

const ACTIVE_STYLE: React.CSSProperties = {
  ...INDICATOR_STYLE,
  background: "#0e639c",
  borderColor: "#1e8ece",
  color: "#ffffff",
};

export function StatusBar({
  coordinates,
  zoom,
  snapMode,
  orthoMode,
  gridVisible,
  cursorSnap,
}: StatusBarProps) {
  return (
    <div style={STATUSBAR_STYLE}>
      <div style={SECTION_STYLE}>
        <span>
          X: {coordinates.x.toFixed(4)} Y: {coordinates.y.toFixed(4)}
        </span>
        {cursorSnap && (
          <span style={{ color: "#22c55e" }}>SNAP: {cursorSnap}</span>
        )}
      </div>

      <div style={SECTION_STYLE}>
        <span style={snapMode ? ACTIVE_STYLE : INDICATOR_STYLE}>
          <SnapIcon active={snapMode} />
          SNAP
        </span>
        <span style={orthoMode ? ACTIVE_STYLE : INDICATOR_STYLE}>
          <OrthoIcon active={orthoMode} />
          ORTHO
        </span>
        <span style={gridVisible ? ACTIVE_STYLE : INDICATOR_STYLE}>
          <GridIcon active={gridVisible} />
          GRID
        </span>
        <span style={INDICATOR_STYLE}>Zoom: {(zoom * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}

function SnapIcon({ active }: { active: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <circle
        cx="5"
        cy="5"
        r="3"
        stroke={active ? "#ffffff" : "#707070"}
        strokeWidth="1"
        fill={active ? "#0e639c" : "none"}
      />
      <line
        x1="5"
        y1="0"
        x2="5"
        y2="3"
        stroke={active ? "#ffffff" : "#707070"}
        strokeWidth="1"
      />
      <line
        x1="5"
        y1="7"
        x2="5"
        y2="10"
        stroke={active ? "#ffffff" : "#707070"}
        strokeWidth="1"
      />
      <line
        x1="0"
        y1="5"
        x2="3"
        y2="5"
        stroke={active ? "#ffffff" : "#707070"}
        strokeWidth="1"
      />
      <line
        x1="7"
        y1="5"
        x2="10"
        y2="5"
        stroke={active ? "#ffffff" : "#707070"}
        strokeWidth="1"
      />
    </svg>
  );
}

function OrthoIcon({ active }: { active: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <line
        x1="5"
        y1="0"
        x2="5"
        y2="10"
        stroke={active ? "#ffffff" : "#707070"}
        strokeWidth="1"
      />
      <line
        x1="0"
        y1="5"
        x2="10"
        y2="5"
        stroke={active ? "#ffffff" : "#707070"}
        strokeWidth="1"
      />
      <rect
        x="3"
        y="3"
        width="4"
        height="4"
        stroke={active ? "#ffffff" : "#707070"}
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

function GridIcon({ active }: { active: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <line
        x1="0"
        y1="3"
        x2="10"
        y2="3"
        stroke={active ? "#ffffff" : "#707070"}
        strokeWidth="0.5"
      />
      <line
        x1="0"
        y1="7"
        x2="10"
        y2="7"
        stroke={active ? "#ffffff" : "#707070"}
        strokeWidth="0.5"
      />
      <line
        x1="3"
        y1="0"
        x2="3"
        y2="10"
        stroke={active ? "#ffffff" : "#707070"}
        strokeWidth="0.5"
      />
      <line
        x1="7"
        y1="0"
        x2="7"
        y2="10"
        stroke={active ? "#ffffff" : "#707070"}
        strokeWidth="0.5"
      />
    </svg>
  );
}
