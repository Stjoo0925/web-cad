import React, { useRef, useEffect, useCallback, useState } from "react";
import {
  drawGrid,
  renderEntities,
  clearCanvas,
  worldToScreen,
  renderSnapPoint,
  renderOrthoGuides,
  type Point,
  type Entity,
  type Viewport,
} from "./cad-canvas-renderer.js";
import {
  createSnapEngine,
  SNAP_TYPES,
  type SnapResult,
} from "../tools/snap-engine.js";

export interface CadCanvasLayerProps {
  entities?: Entity[];
  viewport?: Viewport;
  onViewportChange?: (viewport: Viewport) => void;
  /** 캔버스 ref를 부모에 노출하여 export 등에 활용 */
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  /** 스냅 기능 활성화 여부 */
  snapEnabled?: boolean;
  /** Ortho 모드 활성화 여부 */
  orthoEnabled?: boolean;
  /** 마우스 이동 시 world 좌표 콜백 */
  onMouseMove?: (worldPos: Point) => void;
  /** 캔버스 클릭 시 world 좌표 콜백 */
  onClick?: (worldPos: Point) => void;
  /** 캔버스 더블클릭 시 world 좌표 콜백 */
  onDoubleClick?: (worldPos: Point) => void;
  /** 선택된 엔티티 ID 배열 */
  selectedIds?: string[];
  /** 선택된 엔티티 렌더링 스타일 */
  selectedColor?: string;
}

export function CadCanvasLayer({
  entities = [],
  viewport: viewportProp,
  onViewportChange,
  canvasRef: canvasRefProp,
  snapEnabled = true,
  orthoEnabled = false,
  onMouseMove,
  onClick,
  onDoubleClick,
  selectedIds = [],
  selectedColor = "#0078d4",
}: CadCanvasLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportWrapperRef = useRef<HTMLDivElement>(null);

  // Sync canvas ref to parent when available
  const syncCanvasRef = useCallback((el: HTMLCanvasElement | null) => {
    if (canvasRefProp) {
      (canvasRefProp as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
    }
  }, [canvasRefProp]);

  const viewport = viewportProp ?? {
    width: 800,
    height: 600,
    pan: { x: 0, y: 0 },
    zoom: 1,
  };

  const [snapResult, setSnapResult] = useState<SnapResult | null>(null);
  const [mouseScreenPos, setMouseScreenPos] = useState<Point>({ x: 0, y: 0 });

  const snapEngine = useRef(createSnapEngine());

  const screenToWorld = useCallback(
    (screenPoint: Point): Point => {
      const cx = viewport.width / 2;
      const cy = viewport.height / 2;
      return {
        x: (screenPoint.x - cx) / viewport.zoom + viewport.pan.x,
        y: (screenPoint.y - cy) / viewport.zoom + viewport.pan.y,
      };
    },
    [viewport],
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    clearCanvas(ctx, canvas.width, canvas.height);
    drawGrid(ctx, viewport);
    renderEntities(ctx, entities, viewport, selectedIds, selectedColor);

    // 스냅 포인트 렌더링
    if (snapEnabled && snapResult) {
      renderSnapPoint(ctx, snapResult.point, snapResult.type, viewport, {
        showCrosshair: true,
        showLabel: true,
      });
    }

    // Ortho 모드 가이드선 렌더링
    if (orthoEnabled && snapResult) {
      const worldMouse = screenToWorld(mouseScreenPos);
      renderOrthoGuides(ctx, snapResult.point, worldMouse, viewport);
    }
  }, [
    entities,
    viewport,
    snapEnabled,
    orthoEnabled,
    snapResult,
    mouseScreenPos,
    screenToWorld,
  ]);

  // 스냅 포인트 계산
  const updateSnap = useCallback(
    (screenPoint: Point) => {
      if (!snapEnabled) {
        setSnapResult(null);
        return;
      }
      const worldPoint = screenToWorld(screenPoint);
      const result = snapEngine.current.findSnapPoint(worldPoint, entities);
      setSnapResult(result);
    },
    [snapEnabled, screenToWorld, entities],
  );

  useEffect(() => {
    const wrapper = viewportWrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    // ResizeObserver on the viewport wrapper (not the canvas)
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          onViewportChange?.({ ...viewport, width, height });
          render();
        }
      }
    });

    // Wheel handler on the wrapper — uses { passive: false } so preventDefault works
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.05, Math.min(50, viewport.zoom * delta));
      onViewportChange?.({ ...viewport, zoom: newZoom });
    };

    // Mousemove handler — reads fresh rect inside the handler
    const handleMouseMove = (e: MouseEvent) => {
      const rect = wrapper.getBoundingClientRect();
      const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setMouseScreenPos(screenPoint);
      updateSnap(screenPoint);

      // World 좌표 계산 및 콜백 호출
      const worldPos = screenToWorld(screenPoint);
      onMouseMove?.(worldPos);

      render();
    };

    // Click handler — reads fresh rect inside the handler
    const handleClick = (e: MouseEvent) => {
      const rect = wrapper.getBoundingClientRect();
      const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const worldPos = screenToWorld(screenPoint);
      onClick?.(worldPos);
    };

    // Double-click handler for polyline close
    const handleDoubleClick = (e: MouseEvent) => {
      const rect = wrapper.getBoundingClientRect();
      const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const worldPos = screenToWorld(screenPoint);
      onDoubleClick?.(worldPos);
    };

    // Attach all input listeners to the viewport wrapper
    wrapper.addEventListener("wheel", handleWheel, { passive: false });
    wrapper.addEventListener("mousemove", handleMouseMove);
    wrapper.addEventListener("click", handleClick);
    wrapper.addEventListener("dblclick", handleDoubleClick);
    resizeObserver.observe(wrapper);
    render();

    return () => {
      resizeObserver.disconnect();
      wrapper.removeEventListener("wheel", handleWheel);
      wrapper.removeEventListener("mousemove", handleMouseMove);
      wrapper.removeEventListener("click", handleClick);
      wrapper.removeEventListener("dblclick", handleDoubleClick);
    };
  }, [
    viewport,
    onViewportChange,
    render,
    updateSnap,
    screenToWorld,
    onMouseMove,
    onClick,
    onDoubleClick,
  ]);

  // Pointer drag with setPointerCapture for fullscreen-safe pan
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const wrapper = viewportWrapperRef.current;
      if (!wrapper) return;

      // Capture pointer so we receive move/up events even if cursor leaves the element
      wrapper.setPointerCapture(e.pointerId);

      const rect = wrapper.getBoundingClientRect();
      const startX = e.clientX - rect.left;
      const startY = e.clientY - rect.top;
      let dragged = false;

      const onMove = (moveEvent: PointerEvent) => {
        const dx = moveEvent.clientX - rect.left - startX;
        const dy = moveEvent.clientY - rect.top - startY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          dragged = true;
          const newPan = {
            x: viewport.pan.x + dx / viewport.zoom,
            y: viewport.pan.y + dy / viewport.zoom,
          };
          onViewportChange?.({ ...viewport, pan: newPan });
        }
      };

      const onUp = (upEvent: PointerEvent) => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        try {
          wrapper.releasePointerCapture(upEvent.pointerId);
        } catch {
          // ignore if already released
        }
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [viewport, onViewportChange],
  );

  return (
    <>
      <style>{`[data-cad-viewport-surface] { overflow: hidden; }`}</style>
      <div
        ref={viewportWrapperRef}
        data-cad-viewport-surface
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          touchAction: "none",
        }}
        onPointerDown={handlePointerDown}
      >
      <canvas
        ref={(el) => { canvasRef.current = el; syncCanvasRef(el); }}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          cursor: "crosshair",
        }}
      />
    </div>
    </>
  );
}
