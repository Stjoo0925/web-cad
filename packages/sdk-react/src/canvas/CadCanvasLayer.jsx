import React, { useRef, useEffect, useCallback } from "react";
import {
  drawGrid,
  renderEntities,
  clearCanvas,
  worldToScreen
} from "./cad-canvas-renderer.js";

const INITIAL_VIEWPORT = {
  width: 800,
  height: 600,
  pan: { x: 0, y: 0 },
  zoom: 1,
  origin: { x: 0, y: 0, z: 0 }
};

export function CadCanvasLayer({
  entities = [],
  viewport: viewportProp,
  onViewportChange
}) {
  const canvasRef = useRef(null);
  const viewport = viewportProp ?? INITIAL_VIEWPORT;

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    clearCanvas(ctx, canvas.width, canvas.height);
    drawGrid(ctx, viewport);
    renderEntities(ctx, entities, viewport);
  }, [entities, viewport]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
          render();
        }
      }
    });

    resizeObserver.observe(canvas);
    render();

    return () => resizeObserver.disconnect();
  }, [render]);

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.05, Math.min(50, viewport.zoom * delta));
      onViewportChange?.({ ...viewport, zoom: newZoom });
    },
    [viewport, onViewportChange]
  );

  const handleMouseDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const startX = mouseX;
      const startY = mouseY;
      let dragged = false;

      const onMove = (moveEvent) => {
        const dx = moveEvent.clientX - rect.left - startX;
        const dy = moveEvent.clientY - rect.top - startY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          dragged = true;
          const newPan = {
            x: viewport.pan.x + dx / viewport.zoom,
            y: viewport.pan.y + dy / viewport.zoom
          };
          onViewportChange?.({ ...viewport, pan: newPan });
        }
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [viewport, onViewportChange]
  );

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        cursor: "crosshair"
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
    />
  );
}