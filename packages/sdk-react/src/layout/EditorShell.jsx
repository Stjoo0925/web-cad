import React from "react";

/**
 * EditorShell — 편집기 최상위 레이아웃 컴포넌트
 *
 * 4-zone CSS Grid 레이아웃: toolbar, left panel, viewport, right panel, statusbar
 * viewMode에 따라 커서 스타일과 동작이 달라집니다.
 *
 * @param {Object} props - 컴포넌트 속성
 * @param {React.ReactNode} [props.children] - 뷰포트 영역 콘텐츠
 * @param {string} [props.viewMode="2d"] - 뷰 모드
 * @param {React.ReactNode} [props.leftPanel] - 왼쪽 패널 콘텐츠
 * @param {React.ReactNode} [props.rightPanel] - 오른쪽 패널 콘텐츠
 */
export function EditorShell({
  children,
  viewMode = "2d",
  leftPanel,
  rightPanel
}) {
  const hasLeftPanel = leftPanel !== undefined && leftPanel !== null;
  const hasRightPanel = rightPanel !== undefined && rightPanel !== null;

  return (
    <div
      className="editor-shell"
      data-view-mode={viewMode}
      data-left-panel={hasLeftPanel ? "true" : "false"}
      data-right-panel={hasRightPanel ? "true" : "false"}
    >
      <header className="editor-shell__toolbar" data-region="toolbar">
        <span className="editor-shell__toolbar-title">Web CAD</span>
        <div className="editor-shell__toolbar-actions">
          <button data-tool="select" title="선택 (S)">S</button>
          <button data-tool="line" title="선 (L)">L</button>
          <button data-tool="polyline" title="폴리라인 (P)">P</button>
        </div>
      </header>
      <div className="editor-shell__body">
        <aside
          className="editor-shell__panel editor-shell__panel--left"
          data-region="left-panel"
        >
          {leftPanel ?? "Layers / Browser"}
        </aside>
        <main className="editor-shell__viewport" data-region="viewport">
          {children}
        </main>
        <aside
          className="editor-shell__panel editor-shell__panel--right"
          data-region="right-panel"
        >
          {rightPanel ?? "Properties"}
        </aside>
      </div>
      <footer className="editor-shell__statusbar" data-region="statusbar">
        <span data-status="mode">Mode: {viewMode}</span>
        <span data-status="cursor">X: — Y: —</span>
      </footer>
    </div>
  );
}