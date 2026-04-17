import React, { useEffect, useRef, useCallback } from "react";
import { createScene } from "./point-cloud-scene.js";

/**
 * PointCloudLayer — Three.js 포인트클라우드 렌더링 컴포넌트
 *
 * @param {Object} props - 컴포넌트 속성
 * @param {Object} props.data - 포인트 데이터 { positions, colors, bbox }
 * @param {number} [props.pointSize=2] - 포인트 크기
 * @param {boolean} [props.visible=true] - 가시성
 * @param {number} [props.opacity=1] - 투명도
 * @param {string} [props.colorMode="rgb"] - 색상 모드
 */
export function PointCloudLayer({
  data,
  pointSize = 2,
  visible = true,
  opacity = 1,
  colorMode = "rgb"
}) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
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

  // 포인트 데이터 설정
  useEffect(() => {
    if (!sceneRef.current || !data?.positions) return;
    sceneRef.current.addPoints(data);
  }, [data]);

  // 포인트 크기 변경
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.setPointSize(pointSize);
  }, [pointSize]);

  // 가시성 변경
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.setVisible(visible);
  }, [visible]);

  // 투명도 변경
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.setOpacity(opacity);
  }, [opacity]);

  // 색상 모드 변경
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
      {/* 포인트클라우드가 canvas로 렌더링될 위치 */}
      {data?.positions?.length === 0 && (
        <span style={{ fontSize: "12px", color: "#999" }}>포인트클라우드 로딩 중...</span>
      )}
    </div>
  );
}