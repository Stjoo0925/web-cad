import React, { useState } from "react";
import { CadPointCloudEditor } from "../../../packages/sdk-react/src/index.js";

const DEFAULT_BASE_URL = "http://localhost:4010";
const DEFAULT_DOC_ID = "survey-demo";

const styles: Record<string, React.CSSProperties> = {
  root: {
    fontFamily: "system-ui, sans-serif",
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    margin: 0,
    background: "#0f172a",
    color: "#e2e8f0"
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "0.75rem 1.5rem",
    background: "rgba(15, 23, 42, 0.95)",
    borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
    flexWrap: "wrap"
  },
  title: {
    margin: 0,
    fontSize: "1rem",
    fontWeight: 600,
    color: "#e2e8f0",
    flexShrink: 0
  },
  field: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.8rem"
  },
  label: { color: "#94a3b8", whiteSpace: "nowrap" as const },
  input: {
    background: "rgba(30, 41, 59, 0.8)",
    border: "1px solid rgba(148, 163, 184, 0.25)",
    borderRadius: "0.375rem",
    color: "#e2e8f0",
    padding: "0.3rem 0.6rem",
    fontSize: "0.8rem",
    outline: "none",
    width: "16rem"
  },
  inputSmall: { width: "8rem" },
  editorWrap: { flex: 1, display: "flex", flexDirection: "column" as const }
};

export function App() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [documentId, setDocumentId] = useState(DEFAULT_DOC_ID);
  const [token, setToken] = useState("");
  const [mapMode, setMapMode] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  function addLog(msg: string) {
    setLog((prev) => [...prev.slice(-4), msg]);
  }

  return React.createElement(
    "div",
    { style: styles.root },

    React.createElement(
      "header",
      { style: styles.header },
      React.createElement("h1", { style: styles.title }, "Web CAD Host"),

      React.createElement(
        "div",
        { style: styles.field },
        React.createElement("span", { style: styles.label }, "API URL"),
        React.createElement("input", {
          style: styles.input,
          value: baseUrl,
          onChange: (e) => setBaseUrl(e.target.value),
          placeholder: DEFAULT_BASE_URL
        })
      ),

      React.createElement(
        "div",
        { style: styles.field },
        React.createElement("span", { style: styles.label }, "문서 ID"),
        React.createElement("input", {
          style: { ...styles.input, ...styles.inputSmall },
          value: documentId,
          onChange: (e) => setDocumentId(e.target.value),
          placeholder: DEFAULT_DOC_ID
        })
      ),

      React.createElement(
        "div",
        { style: styles.field },
        React.createElement("span", { style: styles.label }, "JWT"),
        React.createElement("input", {
          style: { ...styles.input, width: "20rem" },
          value: token,
          onChange: (e) => setToken(e.target.value),
          placeholder: "Bearer 토큰 (선택)"
        })
      ),

      React.createElement(
        "div",
        { style: styles.field },
        React.createElement("label", { style: styles.label },
          React.createElement("input", {
            type: "checkbox",
            checked: mapMode,
            onChange: (e) => setMapMode(e.target.checked),
            style: { marginRight: "0.4rem" }
          }),
          "네이버 지도"
        )
      ),

      status !== null &&
        React.createElement(
          "span",
          {
            style: {
              fontSize: "0.75rem",
              padding: "0.25rem 0.6rem",
              borderRadius: "9999px",
              background: status === "ready" ? "#166534" : "#1e3a5f",
              color: status === "ready" ? "#bbf7d0" : "#bfdbfe",
              marginLeft: "auto"
            }
          },
          status
        )
    ),

    log.length > 0 &&
      React.createElement(
        "div",
        {
          style: {
            padding: "0.4rem 1.5rem",
            background: "rgba(15, 23, 42, 0.7)",
            borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
            fontSize: "0.72rem",
            color: "#64748b",
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap" as const
          }
        },
        ...log.map((msg, i) =>
          React.createElement("span", { key: i }, msg)
        )
      ),

    React.createElement(
      "div",
      { style: styles.editorWrap },
      React.createElement(CadPointCloudEditor, {
        baseUrl,
        token: token || undefined,
        documentId,
        viewMode: "2d-cad",
        mapProvider: mapMode ? "naver" : null,
        naverMapClientId: mapMode ? ((import.meta as unknown as { env?: { VITE_NAVER_MAP_CLIENT_ID?: string } }).env?.VITE_NAVER_MAP_CLIENT_ID ?? "") : null,
        onDocumentOpened: (doc) => {
          setStatus("ready");
          addLog(`문서 열림: ${doc?.id ?? documentId}`);
        },
        onSaveStatus: (e) => addLog(`저장: ${e.status}`),
        onSelectionChange: (ids) => addLog(`선택: [${ids.join(", ")}]`),
        onUploadCompleted: (e) => addLog(`업로드 완료: ${e.assetId ?? ""}`),
        onError: (e) => {
          setStatus("error");
          addLog(`오류: ${e.message ?? e.type}`);
        }
      })
    )
  );
}
