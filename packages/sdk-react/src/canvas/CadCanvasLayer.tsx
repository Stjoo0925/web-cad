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
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  /** 스냅 기능 활성화 여부 */
  snapEnabled?: boolean;
  /** Ortho 모드 활성화 여부 */
  orthoEnabled?: boolean;
  /** 그리드 크기 */
  gridSize?: number;
  /** 마우스 이동 시 world 좌표 콜백 */
  onMouseMove?: (worldPos: Point) => void;
  /** 캔버스 클릭 시 world 좌표 콜백 */
  onClick?: (
    worldPos: Point,
    modifiers?: { shift?: boolean; ctrl?: boolean },
  ) => void;
  /** 캔버스 더블클릭 시 world 좌표 콜백 */
  onDoubleClick?: (worldPos: Point) => void;
  /** 드래그 선택 박스 시작 콜백 */
  onSelectionBoxStart?: (
    worldPos: Point,
    modifiers?: { shift?: boolean },
  ) => void;
  /** 드래그 선택 박스 종료 콜백 */
  onSelectionBoxEnd?: (
    worldStart: Point,
    worldEnd: Point,
    modifiers?: { shift?: boolean },
  ) => void;
  /**
   * 드래그 모드 결정.
   * - "selectionBox": 기본 드래그 선택 박스 표시/완료 콜백 호출
   * - "none": 선택 박스는 띄우지 않지만 onDragMove/onDragEnd는 호출됨
   */
  getDragMode?: (
    startWorld: Point,
    modifiers?: { shift?: boolean; ctrl?: boolean },
  ) => "selectionBox" | "none";
  /** 드래그 중(포인터 이동) 콜백 */
  onDragMove?: (
    worldStart: Point,
    worldCurrent: Point,
    modifiers?: { shift?: boolean; ctrl?: boolean },
  ) => void;
  /** 드래그 종료(포인터 업) 콜백 */
  onDragEnd?: (
    worldStart: Point,
    worldEnd: Point,
    modifiers?: { shift?: boolean; ctrl?: boolean },
  ) => void;
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
  gridSize = 50,
  onMouseMove,
  onClick,
  onDoubleClick,
  onSelectionBoxStart,
  onSelectionBoxEnd,
  getDragMode,
  onDragMove,
  onDragEnd,
  selectedIds = [],
  selectedColor = "#0078d4",
}: CadCanvasLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportWrapperRef = useRef<HTMLDivElement>(null);

  // Sync canvas ref to parent when available
  const syncCanvasRef = useCallback(
    (el: HTMLCanvasElement | null) => {
      if (canvasRefProp) {
        (
          canvasRefProp as React.MutableRefObject<HTMLCanvasElement | null>
        ).current = el;
      }
    },
    [canvasRefProp],
  );

  const viewport = viewportProp ?? {
    width: 800,
    height: 600,
    pan: { x: 0, y: 0 },
    zoom: 1,
  };

  const [snapResult, setSnapResult] = useState<SnapResult | null>(null);
  const [mouseScreenPos, setMouseScreenPos] = useState<Point>({ x: 0, y: 0 });
  const [selectionBox, setSelectionBox] = useState<{
    start: Point;
    end: Point;
    shift: boolean;
  } | null>(null);

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
    drawGrid(ctx, { ...viewport, gridSize });
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

    // 드래그 선택 박스 렌더링
    if (selectionBox) {
      const startScreen = worldToScreen(selectionBox.start, viewport);
      const endScreen = worldToScreen(selectionBox.end, viewport);
      const minX = Math.min(startScreen.x, endScreen.x);
      const minY = Math.min(startScreen.y, endScreen.y);
      const maxX = Math.max(startScreen.x, endScreen.x);
      const maxY = Math.max(startScreen.y, endScreen.y);

      ctx.strokeStyle = "#0078d4";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
      ctx.fillStyle = "#0078d420";
      ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
      ctx.setLineDash([]);
    }
  }, [
    entities,
    viewport,
    snapEnabled,
    orthoEnabled,
    snapResult,
    mouseScreenPos,
    screenToWorld,
    selectionBox,
    gridSize,
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
      onClick?.(worldPos, { shift: e.shiftKey, ctrl: e.ctrlKey });
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

      const rect0 = wrapper.getBoundingClientRect();
      const startX = e.clientX - rect0.left;
      const startY = e.clientY - rect0.top;
      const startWorld = screenToWorld({ x: startX, y: startY });
      let dragStarted = false;
      let pendingSelectionBox: { start: Point; end: Point; shift: boolean } | null = null;
      const dragMode = getDragMode?.(startWorld, {
        shift: e.shiftKey,
        ctrl: e.ctrlKey,
      }) ?? "selectionBox";

      const onMove = (moveEvent: PointerEvent) => {
        const rect = wrapper.getBoundingClientRect();
        const dx = moveEvent.clientX - rect.left - startX;
        const dy = moveEvent.clientY - rect.top - startY;

        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          if (!dragStarted) {
            dragStarted = true;
            // Start selection box (optional)
            if (dragMode === "selectionBox") {
              pendingSelectionBox = {
                start: startWorld,
                end: startWorld,
                shift: moveEvent.shiftKey,
              };
            }
          }

          const currentScreen = {
            x: moveEvent.clientX - rect.left,
            y: moveEvent.clientY - rect.top,
          };
          const currentWorld = screenToWorld(currentScreen);

          if (dragMode === "selectionBox") {
            pendingSelectionBox = pendingSelectionBox
              ? { ...pendingSelectionBox, end: currentWorld }
              : null;
            setSelectionBox(pendingSelectionBox);
          }

          onDragMove?.(startWorld, currentWorld, {
            shift: moveEvent.shiftKey,
            ctrl: moveEvent.ctrlKey,
          });
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

        const rect = wrapper.getBoundingClientRect();
        const endScreen = {
          x: upEvent.clientX - rect.left,
          y: upEvent.clientY - rect.top,
        };
        const endWorld = screenToWorld(endScreen);

        if (dragStarted) {
          onDragEnd?.(startWorld, endWorld, {
            shift: upEvent.shiftKey,
            ctrl: upEvent.ctrlKey,
          });
        }

        // Complete selection box if exists
        if (pendingSelectionBox) {
          onSelectionBoxEnd?.(pendingSelectionBox.start, endWorld, {
            shift: pendingSelectionBox.shift,
          });
        }
        pendingSelectionBox = null;
        setSelectionBox(null);
      };

      // Emit selection box start if handler exists
      if (dragMode === "selectionBox" && onSelectionBoxStart) {
        onSelectionBoxStart(startWorld, { shift: e.shiftKey });
      }

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [
      viewport,
      onViewportChange,
      screenToWorld,
      onSelectionBoxStart,
      onSelectionBoxEnd,
      getDragMode,
      onDragMove,
      onDragEnd,
    ],
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
          ref={(el) => {
            canvasRef.current = el;
            syncCanvasRef(el);
          }}
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
