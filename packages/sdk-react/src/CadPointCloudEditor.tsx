import React, { useState, useCallback } from "react";
import { CadCanvasLayer } from "./canvas/CadCanvasLayer.js";
import type { Viewport } from "./canvas/cad-canvas-renderer.js";
import type { Entity } from "./canvas/cad-canvas-renderer.js";

export interface CadPointCloudEditorProps {
  baseUrl?: string;
  token?: string;
  documentId?: string;
  viewMode?: "2d-cad" | "point-cloud";
  mapProvider?: string | null;
  naverMapClientId?: string | null;
  mapCenter?: { lat: number; lng: number };
  mapZoom?: number;
  onDocumentOpened?: (doc: unknown) => void;
  onSaveStatus?: (e: { status: string }) => void;
  onSelectionChange?: (ids: string[]) => void;
  onUploadCompleted?: (e: { assetId?: string }) => void;
  onError?: (e: { message?: string; type?: string }) => void;
}

export function CadPointCloudEditor({
  viewMode = "2d-cad"
}: CadPointCloudEditorProps) {
  const [viewport, setViewport] = useState<Viewport>({
    width: 800,
    height: 600,
    pan: { x: 0, y: 0 },
    zoom: 1
  });

  const [entities] = useState<Entity[]>([]);

  const handleViewportChange = useCallback((newViewport: Viewport) => {
    setViewport(newViewport);
  }, []);

  if (viewMode === "2d-cad") {
    return (
      <CadCanvasLayer
        entities={entities}
        viewport={viewport}
        onViewportChange={handleViewportChange}
      />
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#0f172a",
        overflow: "hidden"
      }}
    >
      <div style={{ textAlign: "center", color: "#94a3b8" }}>
        <p style={{ margin: "0 0 0.5rem" }}>CadPointCloudEditor</p>
        <p style={{ fontSize: "12px", color: "#64748b" }}>viewMode: {viewMode}</p>
      </div>
    </div>
  );
}
