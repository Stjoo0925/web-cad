import React, { useState } from "react";
import { EditorShell } from "@web-cad/sdk-react";

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

  const handleChange = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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
        <form
          onSubmit={handleSubmit}
          style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "8px", fontFamily: "system-ui" }}
        >
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
              <option value="3d">3D</option>
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

import { CadPointCloudEditor } from "@web-cad/sdk-react";