import React, { ReactNode } from "react";

export interface EditorShellProps {
  viewport?: ReactNode;
  leftPanel?: ReactNode;
  rightPanel?: ReactNode;
  statusBar?: ReactNode;
  viewMode?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function EditorShell({
  viewport = null,
  leftPanel = null,
  rightPanel = null,
  statusBar = null,
  viewMode = "2d-cad",
  className = "",
  style,
}: EditorShellProps = {}) {
  const hasLeft  = leftPanel  !== null && leftPanel  !== undefined;
  const hasRight = rightPanel !== null && rightPanel !== undefined;
  const hasStatus = statusBar !== null && statusBar !== undefined;

  const defaultBar = React.createElement(
    React.Fragment, null,
    React.createElement("span", null, viewMode === "2d-cad" ? "2D CAD" : "Point Cloud"),
    React.createElement("span", null, "Ready")
  );

  // Dynamic grid classes based on panel presence
  const gridCols = !hasLeft && !hasRight
    ? "grid-cols-[0_1fr_0]"
    : !hasLeft
    ? "grid-cols-[0_1fr_var(--shell-panel-width,200px)]"
    : !hasRight
    ? "grid-cols-[var(--shell-panel-width,200px)_1fr_0]"
    : "grid-cols-[var(--shell-panel-width,200px)_1fr_var(--shell-panel-width,200px)]";

  return React.createElement(
    "div",
    {
      className: [
        "grid w-full h-full box-border font-[system-ui] text-[13px]",
        gridCols,
        "grid-rows-[40px_1fr_24px]",
        className
      ].filter(Boolean).join(" "),
      "data-view-mode":   viewMode,
      "data-left-panel":  String(hasLeft),
      "data-right-panel": String(hasRight),
      style,
    },
    // Toolbar
    React.createElement(
      "div",
      { className: "col-span-full flex items-center px-2 border-b border-[#ccc] bg-[#fafafa] gap-2" },
      React.createElement("span", { className: "font-semibold mr-4" }, "Editor"),
      React.createElement(
        "div",
        { className: "flex gap-1" },
        React.createElement("button", {
          className: "px-[10px] py-1 border border-[#ccc] rounded bg-white text-xs cursor-pointer hover:bg-[#e5e5e5]"
        }, "Save"),
        React.createElement("button", {
          className: "px-[10px] py-1 border border-[#ccc] rounded bg-white text-xs cursor-pointer hover:bg-[#e5e5e5]"
        }, "Export")
      )
    ),
    // Left panel
    hasLeft && React.createElement(
      "aside",
      {
        className: "border-r border-[#e5e5e5] bg-[#fafafa] overflow-auto p-2",
        "aria-label": "Layer panel"
      },
      leftPanel
    ),
    // Viewport
    React.createElement(
      "main",
      {
        className: [
          "overflow-hidden bg-white flex items-stretch",
          viewMode === "2d-cad" ? "cursor-crosshair" : "",
          viewMode === "point-cloud" ? "cursor-grab" : "",
          viewMode === "point-cloud" ? "active:cursor-grabbing" : ""
        ].filter(Boolean).join(" "),
        role: "application",
        "aria-label": "CAD viewport"
      },
      viewport
    ),
    // Right panel
    hasRight && React.createElement(
      "aside",
      {
        className: "border-l border-[#e5e5e5] bg-[#fafafa] overflow-auto p-2",
        "aria-label": "Properties panel"
      },
      rightPanel
    ),
    // Statusbar
    React.createElement(
      "footer",
      { className: "col-span-full flex items-center gap-4 px-2 border-t border-[#ccc] bg-[#f0f0f0] text-xs text-[#555]" },
      hasStatus ? statusBar : defaultBar
    )
  );
}