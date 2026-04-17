import React, { useEffect, useRef, useState } from "react";

import { EditorSdkClient } from "../../sdk-core/src/editor-sdk-client.js";
import { NaverMapBackground } from "./maps/NaverMapBackground.jsx";
import { shouldEnableNaverMapBackground } from "./maps/naver-map-config.js";
import { EditorShell } from "./layout/EditorShell.js";

export function CadPointCloudEditor({
  baseUrl,
  token,
  documentId,
  viewMode = "2d-cad",
  mapProvider = null,
  naverMapClientId = null,
  mapCenter = { lat: 37.3595704, lng: 127.105399 },
  mapZoom = 16,
  onDocumentOpened,
  onSaveStatus,
  onSelectionChange,
  onUploadCompleted,
  onError
}) {
  const clientRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [selection, setSelection] = useState([]);

  useEffect(() => {
    const client = new EditorSdkClient({ baseUrl });
    client.setToken(token);
    clientRef.current = client;

    return client.subscribe((event) => {
      switch (event.type) {
        case "document.status":
          setStatus(event.status);
          break;
        case "document.opened":
          setStatus("ready");
          if (onDocumentOpened) onDocumentOpened(event.document);
          break;
        case "save.status":
          if (onSaveStatus) onSaveStatus(event);
          break;
        case "selection.changed":
          setSelection(event.entityIds);
          if (onSelectionChange) onSelectionChange(event.entityIds);
          break;
        case "upload.completed":
          if (onUploadCompleted) onUploadCompleted(event);
          break;
        case "document.error":
        case "upload.error":
          if (onError) onError(event);
          break;
        default:
          break;
      }
    });
  }, [baseUrl, token, onDocumentOpened, onError, onSaveStatus, onSelectionChange, onUploadCompleted]);

  useEffect(() => {
    if (clientRef.current === null || documentId === null || documentId === undefined) return;
    clientRef.current.openDocument(documentId).catch((error) => {
      if (onError) onError({ type: "document.error", message: error.message, documentId });
    });
  }, [documentId, onError]);

  const showNaverMap = shouldEnableNaverMapBackground({ viewMode, mapProvider, naverMapClientId });

  // ── 뷰포트 슬롯 ──────────────────────────────────
  const viewportSlot = React.createElement(
    React.Fragment,
    null,
    showNaverMap ? React.createElement(NaverMapBackground, {
      naverMapClientId,
      center: mapCenter,
      zoom: mapZoom,
      onError: (error) => { if (onError) onError({ type: "map.error", message: error.message, provider: "naver" }); }
    }) : null,
    React.createElement("div", {
      className: "cad-editor-overlay",
      style: { position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", border: "1px dashed #9aa4b2" }
    })
  );

  // ── 상태바 슬롯 ──────────────────────────────────
  const statusBarSlot = React.createElement(
    React.Fragment,
    null,
    React.createElement("span", null, documentId ? ("doc: " + documentId) : "no document"),
    React.createElement("span", { style: { marginLeft: "auto" } }, "status: " + status),
    selection.length > 0
      ? React.createElement("span", null, "selected: " + selection.length)
      : null
  );

  return React.createElement(EditorShell, {
    viewMode,
    viewport: viewportSlot,
    statusBar: statusBarSlot,
    style: { height: "100%" },
  });
}
