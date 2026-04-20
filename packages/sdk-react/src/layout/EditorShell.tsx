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

  return React.createElement(
    "div",
    {
      className: ["cad-editor-shell", className].filter(Boolean).join(" "),
      "data-view-mode":   viewMode,
      "data-left-panel":  String(hasLeft),
      "data-right-panel": String(hasRight),
      style,
    },
    React.createElement(
      "aside",
      { className: "cad-editor-shell__left", "aria-label": "Layer panel" },
      leftPanel
    ),
    React.createElement(
      "main",
      { className: "cad-editor-shell__viewport", role: "application", "aria-label": "CAD viewport" },
      viewport
    ),
    React.createElement(
      "aside",
      { className: "cad-editor-shell__right", "aria-label": "Properties panel" },
      rightPanel
    ),
    React.createElement(
      "footer",
      { className: "cad-editor-shell__statusbar" },
      hasStatus ? statusBar : defaultBar
    )
  );
}
