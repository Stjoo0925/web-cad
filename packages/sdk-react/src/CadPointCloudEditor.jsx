import React, { useState, useCallback } from "react";
import { CadCanvasLayer } from "./canvas/CadCanvasLayer.jsx";

/**
 * CadPointCloudEditor — CAD/포인트클라우드 통합 편집기 React 컴포넌트
 *
 * 2D CAD 모드와 포인트클라우드 모드를 지원합니다.
 * Canvas 2D 렌더링, 엔티티 관리, 뷰포트 상태를 관리합니다.
 *
 * @param {Object} props - 컴포넌트 속성
 * @param {string} [props.baseUrl] - API 서버 기본 URL
 * @param {string} [props.token] - 인증 토큰
 * @param {string} [props.documentId] - 열 문서 ID
 * @param {string} [props.viewMode="2d-cad"] - 뷰 모드 ("2d-cad" | "point-cloud")
 * @param {string} [props.mapProvider] - 지도 제공자
 * @param {string} [props.naverMapClientId] - Naver Map Client ID
 * @param {Object} [props.mapCenter] - 지도 중심 좌표 { lat, lng }
 * @param {number} [props.mapZoom] - 지도 줌 레벨
 * @param {Function} [props.onDocumentOpened] - 문서 열림 콜백
 * @param {Function} [props.onSaveStatus] - 저장 상태 콜백
 * @param {Function} [props.onSelectionChange] - 선택 변경 콜백
 * @param {Function} [props.onUploadCompleted] - 업로드 완료 콜백
 * @param {Function} [props.onError] - 에러 콜백
 */
export function CadPointCloudEditor({
  mapProvider,
  naverMapClientId,
  mapCenter,
  mapZoom,
  viewMode = "2d-cad"
}) {
  const [viewport, setViewport] = useState({
    width: 800,
    height: 600,
    pan: { x: 0, y: 0 },
    zoom: 1,
    origin: { x: 0, y: 0, z: 0 }
  });

  const [entities] = useState([]);

  const handleViewportChange = useCallback((newViewport) => {
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
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
        color: "#666",
        fontSize: "14px"
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p>
          <strong>CadPointCloudEditor</strong>
        </p>
        <p style={{ fontSize: "12px", color: "#888" }}>
          viewMode: {viewMode}
        </p>
        <p style={{ fontSize: "11px", color: "#aaa", marginTop: "8px" }}>
          포인트클라우드 모드
        </p>
      </div>
    </div>
  );
}