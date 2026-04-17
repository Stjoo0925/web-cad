import React from "react";

export function EditorShell({
  viewport = null,
  leftPanel = null,
  rightPanel = null,
  statusBar = null,
  viewMode = "2d-cad",
  className = "",
  style,
} = {}) {
  const hasLeft  = (leftPanel  === null || leftPanel  === undefined) ? false : true;
  const hasRight = (rightPanel === null || rightPanel === undefined) ? false : true;
  const hasStatus = (statusBar === null || statusBar === undefined) ? false : true;

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
