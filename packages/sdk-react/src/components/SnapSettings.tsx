/**
 * SnapSettings.tsx
 * 스냅 설정 패널 UI
 *
 * 스냅 타입별 토글 버튼을 제공합니다.
 */

import React from "react";

interface SnapSettingsProps {
  snapEnabled: boolean;
  onSnapEnabledChange: (enabled: boolean) => void;
  snapTypes: {
    endpoint: boolean;
    midpoint: boolean;
    intersection: boolean;
    center: boolean;
    perpendicular: boolean;
    tangent: boolean;
  };
  onSnapTypeToggle: (type: string) => void;
}

const SNAP_TYPE_COLORS: Record<string, string> = {
  endpoint: "#00ff00",
  midpoint: "#00ffff",
  intersection: "#ffff00",
  center: "#00ff88",
  perpendicular: "#ff00ff",
  tangent: "#ff8800",
};

export function SnapSettings({
  snapEnabled,
  onSnapEnabledChange,
  snapTypes,
  onSnapTypeToggle,
}: SnapSettingsProps) {
  const snapTypeList = [
    { key: "endpoint", label: "Endpoint" },
    { key: "midpoint", label: "Midpoint" },
    { key: "intersection", label: "Intersection" },
    { key: "center", label: "Center" },
    { key: "perpendicular", label: "Perpendicular" },
    { key: "tangent", label: "Tangent" },
  ];

  return (
    <div
      style={{
        padding: "8px",
        borderBottom: "1px solid #4d4d4d",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "8px",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            cursor: "pointer",
            color: "#ffffff",
            fontSize: "11px",
          }}
        >
          <input
            type="checkbox"
            checked={snapEnabled}
            onChange={(e) => onSnapEnabledChange(e.target.checked)}
          />
          OSNAP
        </label>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "4px",
        }}
      >
        {snapTypeList.map(({ key, label }) => {
          const isActive = snapTypes[key as keyof typeof snapTypes];
          const color = SNAP_TYPE_COLORS[key];
          return (
            <button
              key={key}
              onClick={() => onSnapTypeToggle(key)}
              style={{
                padding: "2px 6px",
                border: "none",
                borderRadius: "3px",
                fontSize: "9px",
                fontWeight: 600,
                cursor: "pointer",
                background: isActive ? color : "#3d3d3d",
                color: isActive ? "#000000" : "#888888",
                opacity: snapEnabled ? 1 : 0.4,
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
