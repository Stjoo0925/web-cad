/**
 * DemoApp.jsx
 * Web CAD 데모 애플리케이션
 *
 * 실제 API 없이 독립적으로 동작하는 데모 모드를 제공합니다.
 * 샘플 도면 데이터를 표시하고 툴바, 레이어 패널, 속성 패널을 포함합니다.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";

// =====================================================================
// 샘플 데이터
// =====================================================================

/** 샘플 레이어 데이터 */
const SAMPLE_LAYERS = [
  { name: "0", color: 7, visible: true, locked: false },
  { name: "WALLS", color: 1, visible: true, locked: false },
  { name: "DOORS", color: 3, visible: true, locked: false },
  { name: "WINDOWS", color: 5, visible: true, locked: false },
  { name: "DIMENSIONS", color: 2, visible: true, locked: false },
  { name: "TEXT", color: 4, visible: true, locked: false }
];

/** 샘플 엔티티 데이터 */
const SAMPLE_ENTITIES = [
  // WALLS
  { id: "e1", type: "LINE", layer: "WALLS", points: [{ x: 0, y: 0 }, { x: 100, y: 0 }], color: 1 },
  { id: "e2", type: "LINE", layer: "WALLS", points: [{ x: 100, y: 0 }, { x: 100, y: 80 }], color: 1 },
  { id: "e3", type: "LINE", layer: "WALLS", points: [{ x: 100, y: 80 }, { x: 0, y: 80 }], color: 1 },
  { id: "e4", type: "LINE", layer: "WALLS", points: [{ x: 0, y: 80 }, { x: 0, y: 0 }], color: 1 },
  // DOORS
  { id: "e5", type: "ARC", layer: "DOORS", center: { x: 50, y: 0 }, radius: 15, startAngle: 0, endAngle: 90, color: 3 },
  { id: "e6", type: "LINE", layer: "DOORS", points: [{ x: 50, y: 0 }, { x: 50, y: 15 }], color: 3 },
  // WINDOWS
  { id: "e7", type: "LINE", layer: "WINDOWS", points: [{ x: 20, y: 40 }, { x: 40, y: 40 }], color: 5 },
  { id: "e8", type: "LINE", layer: "WINDOWS", points: [{ x: 20, y: 50 }, { x: 40, y: 50 }], color: 5 },
  { id: "e9", type: "LINE", layer: "WINDOWS", points: [{ x: 20, y: 40 }, { x: 20, y: 50 }], color: 5 },
  { id: "e10", type: "LINE", layer: "WINDOWS", points: [{ x: 40, y: 40 }, { x: 40, y: 50 }], color: 5 },
  // DIMENSIONS
  { id: "e11", type: "LINE", layer: "DIMENSIONS", points: [{ x: 0, y: -10 }, { x: 100, y: -10 }], color: 2 },
  // POLYLINE (테스트용)
  { id: "e12", type: "POLYLINE", layer: "WALLS", points: [{ x: 120, y: 0 }, { x: 180, y: 0 }, { x: 180, y: 60 }, { x: 120, y: 60 }, { x: 120, y: 0 }], color: 1 }
];

// =====================================================================
// 유틸리티
// =====================================================================

/** AutoCAD 색상 인덱스를 HEX로 변환 */
function getColorHex(colorIndex) {
  const colors = {
    1: "#FF0000", 2: "#FFFF00", 3: "#00FF00", 4: "#00FFFF",
    5: "#0000FF", 6: "#FF00FF", 7: "#FFFFFF", 8: "#404040",
    9: "#808080", 10: "#FF8080", 11: "#FFFF80", 12: "#80FF80"
  };
  return colors[colorIndex] || "#FFFFFF";
}

/** world 좌표를 screen 좌표로 변환 */
function worldToScreen(x, y, viewport) {
  return {
    sx: (x - viewport.panX) * viewport.zoom + viewport.width / 2,
    sy: (y - viewport.panY) * viewport.zoom + viewport.height / 2
  };
}

// =====================================================================
// Canvas 렌더러
// =====================================================================

/**
 * Canvas 2D에 그리드를 그립니다.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} viewport
 */
function drawGrid(ctx, viewport) {
  const { width, height, panX, panY, zoom } = viewport;
  const gridSize = 10 * zoom;

  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 0.5;

  // 화면 범위 계산
  const startX = Math.floor((-panX - width / 2 / zoom) / gridSize) * gridSize;
  const endX = Math.ceil((-panX + width / 2 / zoom) / gridSize) * gridSize;
  const startY = Math.floor((-panY - height / 2 / zoom) / gridSize) * gridSize;
  const endY = Math.ceil((-panY + height / 2 / zoom) / gridSize) * gridSize;

  ctx.beginPath();
  for (let x = startX; x <= endX; x += gridSize) {
    const sx = (x - panX) * zoom + width / 2;
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, height);
  }
  for (let y = startY; y <= endY; y += gridSize) {
    const sy = (y - panY) * zoom + height / 2;
    ctx.moveTo(0, sy);
    ctx.lineTo(width, sy);
  }
  ctx.stroke();

  // 축 그리기
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 1;
  ctx.beginPath();
  const originX = (-panX) * zoom + width / 2;
  const originY = (-panY) * zoom + height / 2;
  ctx.moveTo(originX, 0);
  ctx.lineTo(originX, height);
  ctx.moveTo(0, originY);
  ctx.lineTo(width, originY);
  ctx.stroke();
}

/**
 * Canvas 2D에 엔티티를 그립니다.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} entity
 * @param {Object} viewport
 * @param {string|null} selectedId
 */
function drawEntity(ctx, entity, viewport, selectedId) {
  const { width, height, panX, panY, zoom } = viewport;

  ctx.strokeStyle = getColorHex(entity.color || 7);
  ctx.lineWidth = (entity.layer === "WALLS" ? 2 : 1);

  // 선택된 엔티티 highlight
  if (entity.id === selectedId) {
    ctx.shadowColor = "#0d7dd4";
    ctx.shadowBlur = 8;
  } else {
    ctx.shadowBlur = 0;
  }

  const pts = entity.points || [];

  if (entity.type === "LINE" && pts.length >= 2) {
    ctx.beginPath();
    const start = worldToScreen(pts[0].x, pts[0].y, viewport);
    ctx.moveTo(start.sx, start.sy);
    for (let i = 1; i < pts.length; i++) {
      const p = worldToScreen(pts[i].x, pts[i].y, viewport);
      ctx.lineTo(p.sx, p.sy);
    }
    ctx.stroke();
  } else if (entity.type === "POLYLINE" && pts.length >= 2) {
    ctx.beginPath();
    const start = worldToScreen(pts[0].x, pts[0].y, viewport);
    ctx.moveTo(start.sx, start.sy);
    for (let i = 1; i < pts.length; i++) {
      const p = worldToScreen(pts[i].x, pts[i].y, viewport);
      ctx.lineTo(p.sx, p.sy);
    }
    ctx.stroke();
  } else if (entity.type === "ARC" && entity.center) {
    const center = worldToScreen(entity.center.x, entity.center.y, viewport);
    const radius = entity.radius * zoom;
    ctx.beginPath();
    ctx.arc(center.sx, center.sy, radius,
      (entity.startAngle * Math.PI) / 180,
      (entity.endAngle * Math.PI) / 180);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
}

// =====================================================================
// 툴바
// =====================================================================

function Toolbar({ currentTool, onToolChange, viewMode, onViewModeChange, onLoadSample }) {
  return (
    <header className="demo-toolbar">
      <span className="demo-toolbar__title">Web CAD Demo</span>
      <div className="demo-toolbar__tools">
        <button
          className={currentTool === "select" ? "active" : ""}
          onClick={() => onToolChange("select")}
          title="선택 (S)"
        >
          [S] 선택
        </button>
        <button
          className={currentTool === "line" ? "active" : ""}
          onClick={() => onToolChange("line")}
          title="선 (L)"
        >
          [L] 선
        </button>
        <button
          className={currentTool === "polyline" ? "active" : ""}
          onClick={() => onToolChange("polyline")}
          title="폴리라인 (P)"
        >
          [P] 폴리라인
        </button>
      </div>
      <div className="demo-toolbar__views">
        <button
          className={viewMode === "2d-cad" ? "active" : ""}
          onClick={() => onViewModeChange("2d-cad")}
        >
          2D CAD
        </button>
        <button
          className={viewMode === "point-cloud" ? "active" : ""}
          onClick={() => onViewModeChange("point-cloud")}
        >
          포인트클라우드
        </button>
      </div>
      <div className="demo-toolbar__actions">
        <button onClick={onLoadSample}>샘플 도면</button>
      </div>
    </header>
  );
}

// =====================================================================
// 레이어 패널
// =====================================================================

function LayerPanel({ layers, activeLayer, onLayerSelect, onToggleVisibility, onToggleLock }) {
  return (
    <div className="demo-layer-panel">
      <div className="demo-layer-panel__header">레이어</div>
      <div className="demo-layer-panel__list">
        {layers.map((layer) => (
          <div
            key={layer.name}
            className={`demo-layer-item ${layer.name === activeLayer ? "active" : ""}`}
            onClick={() => onLayerSelect(layer.name)}
          >
            <button
              className="demo-layer-item__visibility"
              onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.name, !layer.visible); }}
              title={layer.visible ? "가시성 끄기" : "가시성 켜기"}
            >
              {layer.visible ? "👁" : "○"}
            </button>
            <button
              className="demo-layer-item__lock"
              onClick={(e) => { e.stopPropagation(); onToggleLock(layer.name, !layer.locked); }}
              title={layer.locked ? "잠금 해제" : "잠금"}
            >
              {layer.locked ? "🔒" : "🔓"}
            </button>
            <span
              className="demo-layer-item__color"
              style={{ backgroundColor: getColorHex(layer.color) }}
            />
            <span className="demo-layer-item__name">{layer.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================================================================
// 속성 패널
// =====================================================================

function PropertiesPanel({ entity }) {
  if (!entity) {
    return (
      <div className="demo-properties-panel">
        <div className="demo-properties-panel__header">속성</div>
        <div className="demo-properties-panel__empty">선택된 엔티티 없음</div>
      </div>
    );
  }

  return (
    <div className="demo-properties-panel">
      <div className="demo-properties-panel__header">속성</div>
      <table className="demo-properties-panel__table">
        <tbody>
          <tr><td>ID</td><td>{entity.id}</td></tr>
          <tr><td>타입</td><td>{entity.type}</td></tr>
          <tr><td>레이어</td><td>{entity.layer}</td></tr>
          {entity.points && entity.points.length > 0 && (
            <tr><td>시작점</td><td>X: {entity.points[0].x}, Y: {entity.points[0].y}</td></tr>
          )}
          {entity.radius && (
            <tr><td>반지름</td><td>{entity.radius}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// =====================================================================
// 메인 DemoApp 컴포넌트
// =====================================================================

/**
 * DemoApp — Web CAD 데모 애플리케이션
 *
 * @param {Object} props
 * @param {string} [props.baseUrl] - API 서버 URL (데모 모드에서는 무시됨)
 */
export function DemoApp({ baseUrl }) {
  const canvasRef = useRef(null);

  // 뷰포트 상태
  const [viewport, setViewport] = useState({
    width: 800,
    height: 600,
    panX: 50,
    panY: 40,
    zoom: 5
  });

  // 도구/선택 상태
  const [currentTool, setCurrentTool] = useState("select");
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [viewMode, setViewMode] = useState("2d-cad");

  // 데이터 상태
  const [entities, setEntities] = useState(SAMPLE_ENTITIES);
  const [layers] = useState(SAMPLE_LAYERS);
  const [activeLayer, setActiveLayer] = useState("0");

  // 마우스 드래그 상태
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // selected entity
  const selectedEntity = entities.find((e) => e.id === selectedEntityId) || null;

  // Canvas 리사이즈 감지
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setViewport((v) => ({ ...v, width, height }));
      }
    });

    observer.observe(canvas.parentElement);
    return () => observer.disconnect();
  }, []);

  // Canvas 렌더링
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // 배경
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 그리드
    drawGrid(ctx, viewport);

    // 레이어 가시성 필터
    const visibleLayerNames = layers.filter((l) => l.visible).map((l) => l.name);

    // 엔티티 렌더링
    entities
      .filter((e) => visibleLayerNames.includes(e.layer))
      .forEach((entity) => {
        drawEntity(ctx, entity, viewport, selectedEntityId);
      });
  }, [viewport, entities, layers, selectedEntityId]);

  // 마우스 이벤트
  const handleMouseDown = useCallback((e) => {
    if (currentTool === "select") {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [currentTool]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || currentTool !== "select") return;

    const dx = (e.clientX - dragStart.x) / viewport.zoom;
    const dy = (e.clientY - dragStart.y) / viewport.zoom;

    setViewport((v) => ({
      ...v,
      panX: v.panX - dx,
      panY: v.panY - dy
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [isDragging, dragStart, viewport.zoom, currentTool]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 휠 줌
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setViewport((v) => ({
      ...v,
      zoom: Math.max(0.1, Math.min(50, v.zoom * delta))
    }));
  }, []);

  // Canvas 클릭 (엔티티 선택)
  const handleCanvasClick = useCallback((e) => {
    if (currentTool !== "select") return;

    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // 간단한 히트 테스트 (포인트 기반)
    const worldX = (clickX - viewport.width / 2) / viewport.zoom + viewport.panX;
    const worldY = (clickY - viewport.height / 2) / viewport.zoom + viewport.panY;

    // 클릭 위치 근처의 엔티티 찾기 (간단한 거리 기반)
    let closest = null;
    let closestDist = 10 / viewport.zoom; // 10 screen pixels threshold

    for (const entity of entities) {
      if (!layers.find((l) => l.name === entity.layer && l.visible)) continue;
      const pts = entity.points || [];
      for (const pt of pts) {
        const dist = Math.sqrt((pt.x - worldX) ** 2 + (pt.y - worldY) ** 2);
        if (dist < closestDist) {
          closest = entity.id;
          closestDist = dist;
        }
      }
    }

    setSelectedEntityId(closest);
  }, [currentTool, viewport, entities, layers]);

  // 샘플 도면 로드
  const handleLoadSample = useCallback(() => {
    setEntities([...SAMPLE_ENTITIES]);
    setViewport({ width: viewport.width, height: viewport.height, panX: 50, panY: 40, zoom: 5 });
    setSelectedEntityId(null);
  }, [viewport]);

  return (
    <div className="demo-app">
      <Toolbar
        currentTool={currentTool}
        onToolChange={setCurrentTool}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onLoadSample={handleLoadSample}
      />
      <div className="demo-app__body">
        <LayerPanel
          layers={layers}
          activeLayer={activeLayer}
          onLayerSelect={setActiveLayer}
          onToggleVisibility={(name, visible) => {
            const layer = layers.find((l) => l.name === name);
            if (layer) layer.visible = visible;
            setLayers([...layers]);
          }}
          onToggleLock={(name, locked) => {
            const layer = layers.find((l) => l.name === name);
            if (layer) layer.locked = locked;
            setLayers([...layers]);
          }}
        />
        <div className="demo-app__viewport">
          <canvas
            ref={canvasRef}
            className="demo-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            onClick={handleCanvasClick}
            style={{ cursor: currentTool === "select" ? "default" : "crosshair" }}
          />
        </div>
        <PropertiesPanel entity={selectedEntity} />
      </div>
      <footer className="demo-statusbar">
        <span>모드: {viewMode === "2d-cad" ? "2D CAD" : "포인트클라우드"}</span>
        <span>도구: {currentTool}</span>
        <span>줌: {viewport.zoom.toFixed(1)}x</span>
        <span>선택: {selectedEntityId || "없음"}</span>
        <span>엔티티: {entities.length}</span>
      </footer>
    </div>
  );
}

export default DemoApp;
