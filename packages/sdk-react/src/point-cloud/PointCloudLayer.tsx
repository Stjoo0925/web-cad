import React, { useEffect, useRef } from "react";
import { createScene, type SceneOptions, type PointCloudData } from "./point-cloud-scene.js";

export interface PointCloudLayerProps {
  data?: PointCloudData;
  pointSize?: number;
  visible?: boolean;
  opacity?: number;
  colorMode?: string;
}

export function PointCloudLayer({
  data,
  pointSize = 2,
  visible = true,
  opacity = 1,
  colorMode = "rgb"
}: PointCloudLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ReturnType<typeof createScene> | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;

    const scene = createScene({ container: containerRef.current });
    sceneRef.current = scene;
    initializedRef.current = true;

    return () => {
      scene.dispose();
      sceneRef.current = null;
      initializedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current || !data?.positions) return;
    sceneRef.current.addPoints(data);
  }, [data]);

  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.setPointSize(pointSize);
  }, [pointSize]);

  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.setVisible(visible);
  }, [visible]);

  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.setOpacity(opacity);
  }, [opacity]);

  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.setColorMode(colorMode);
  }, [colorMode]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      {data?.positions?.length === 0 && (
        <span style={{ fontSize: "12px", color: "#999" }}>포인트클라우드 로딩 중...</span>
      )}
    </div>
  );
}
