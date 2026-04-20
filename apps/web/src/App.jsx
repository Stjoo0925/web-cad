import React, { useState } from "react";
import { EditorShell } from "@web-cad/sdk-react";
import { CadPointCloudEditor } from "@web-cad/sdk-react";
import { DemoApp } from "./DemoApp.jsx";
import "./demo-app.css";

const DEFAULT_CONFIG = {
  baseUrl: "http://localhost:4010",
  token: "demo-token",
  documentId: "demo-doc-001",
  viewMode: "2d-cad",
  mapProvider: "naver",
  naverMapClientId: ""
};

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [submitted, setSubmitted] = useState(false);
  const [mode, setMode] = useState("form"); // "form" | "demo"

  const handleChange = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setMode("form");
  };

  const handleLaunchDemo = () => {
    setMode("demo");
    setSubmitted(true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #e5e5e5",
          background: "#fafafa",
          fontFamily: "system-ui"
        }}
      >
        <h1 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Web CAD Editor — Host App</h1>
      </header>

      {!submitted ? (
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px", fontFamily: "system-ui" }}>
          {/* 데모 모드 선택 */}
          <div style={{ padding: "16px", background: "#f0f7ff", borderRadius: "8px", border: "1px solid #b8daff" }}>
            <h2 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#004a99" }}>Web CAD 데모</h2>
            <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "#666" }}>
              실제 API 서버 없이 독립적으로 동작하는 데모 모드입니다.
              도면 작성, 레이어 관리, 뷰포트 제어를 체험할 수 있습니다.
            </p>
            <button
              onClick={handleLaunchDemo}
              style={{ padding: "8px 20px", background: "#0d7dd4", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px", fontWeight: 500 }}
            >
              데모 시작하기 →
            </button>
          </div>

          {/* API 연결 모드 */}
          <details style={{ marginTop: "8px" }}>
            <summary style={{ cursor: "pointer", padding: "8px 0", color: "#666", fontSize: "13px" }}>
              API 서버에 연결하여 편집기 실행 (고급)
            </summary>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                Base URL
                <input
                  type="text"
                  value={config.baseUrl}
                  onChange={(e) => handleChange("baseUrl", e.target.value)}
                  style={{ flex: 1 }}
                />
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                Token
                <input
                  type="text"
                  value={config.token}
                  onChange={(e) => handleChange("token", e.target.value)}
                  style={{ flex: 1 }}
                />
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                Document ID
                <input
                  type="text"
                  value={config.documentId}
                  onChange={(e) => handleChange("documentId", e.target.value)}
                  style={{ flex: 1 }}
                />
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                View Mode
                <select value={config.viewMode} onChange={(e) => handleChange("viewMode", e.target.value)} style={{ flex: 1 }}>
                  <option value="2d-cad">2D CAD</option>
                  <option value="point-cloud">Point Cloud</option>
                </select>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                NAVER Map Client ID
                <input
                  type="text"
                  value={config.naverMapClientId}
                  onChange={(e) => handleChange("naverMapClientId", e.target.value)}
                  style={{ flex: 1 }}
                />
              </label>
              <button type="submit" style={{ marginTop: "8px", padding: "8px 16px", width: "fit-content" }}>
                Launch Editor
              </button>
            </form>
          </details>
        </div>
      ) : mode === "demo" ? (
        <DemoApp baseUrl={config.baseUrl} />
      ) : (
        <EditorShell viewMode={config.viewMode}>
          <CadPointCloudEditor
            baseUrl={config.baseUrl}
            token={config.token}
            documentId={config.documentId}
            viewMode={config.viewMode}
            mapProvider={config.mapProvider}
            naverMapClientId={config.naverMapClientId}
            mapCenter={{ lat: 37.3595704, lng: 127.105399 }}
            mapZoom={16}
          />
        </EditorShell>
      )}
    </div>
  );
}
