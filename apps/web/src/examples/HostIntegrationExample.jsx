/**
 * HostIntegrationExample.jsx
 * 호스트 앱 통합 예제 — CadPointCloudEditor를 실제로 사용하는 예시
 *
 * 문서 열림, 저장 상태, 선택 변경, 업로드 완료, 지도 오류 이벤트를 처리합니다.
 * 호스트 앱이 토큰을 공급하는 흐름을 보여줍니다.
 */

import React, { useState, useCallback } from "react";
import { CadPointCloudEditor } from "../../../packages/sdk-react/src/index.js";

/**
 * HostIntegrationExample — 호스트 앱 통합 예제 컴포넌트
 *
 * @param {Object} props
 * @param {string} props.baseUrl - API 서버 URL
 * @param {string} props.token - 인증 토큰
 */
export function HostIntegrationExample({ baseUrl, token }) {
  const [documentId, setDocumentId] = useState("doc-001");
  const [eventLog, setEventLog] = useState([]);
  const [selectedEntities, setSelectedEntities] = useState([]);

  /**
   * 이벤트 로그에 추가
   */
  const addLog = useCallback((type, message) => {
    setEventLog((prev) => [
      { type, message, timestamp: new Date().toLocaleTimeString() },
      ...prev.slice(0, 49) // 최대 50개 유지
    ]);
  }, []);

  /**
   * 문서 열림 이벤트 핸들러
   */
  const handleDocumentOpened = useCallback((document) => {
    addLog("document.opened", `문서 열림: ${document.id || documentId}`);
  }, [addLog, documentId]);

  /**
   * 저장 상태 이벤트 핸들러
   */
  const handleSaveStatus = useCallback((event) => {
    addLog("save.status", `저장 상태: ${event.status} — ${event.documentId}`);
  }, [addLog]);

  /**
   * 선택 변경 이벤트 핸들러
   */
  const handleSelectionChange = useCallback((entityIds) => {
    setSelectedEntities(entityIds);
    addLog("selection.changed", `선택 변경: ${entityIds.length}개 엔티티`);
  }, [addLog]);

  /**
   * 업로드 완료 이벤트 핸들러
   */
  const handleUploadCompleted = useCallback((event) => {
    addLog("upload.completed", `업로드 완료: ${event.assetType} — ${event.fileName}`);
  }, [addLog]);

  /**
   * 오류 이벤트 핸들러
   */
  const handleError = useCallback((event) => {
    addLog("error", `${event.type}: ${event.message}`);
  }, [addLog]);

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <div style={styles.header}>
        <h1 style={styles.title}>Web CAD Host Integration Example</h1>
        <p style={styles.subtitle}>호스트 앱에서 CadPointCloudEditor를 사용하는 예시</p>
      </div>

      {/* 설정 패널 */}
      <div style={styles.configPanel}>
        <div style={styles.configRow}>
          <label style={styles.label}>문서 ID:</label>
          <input
            type="text"
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.configInfo}>
          <span style={styles.configLabel}>API URL:</span> {baseUrl}
        </div>
        <div style={styles.configInfo}>
          <span style={styles.configLabel}>토큰:</span> {token ? "설정됨" : "미설정"}
        </div>
      </div>

      {/* 에디터 영역 */}
      <div style={styles.editorContainer}>
        <CadPointCloudEditor
          baseUrl={baseUrl}
          token={token}
          documentId={documentId}
          viewMode="2d-cad"
          onDocumentOpened={handleDocumentOpened}
          onSaveStatus={handleSaveStatus}
          onSelectionChange={handleSelectionChange}
          onUploadCompleted={handleUploadCompleted}
          onError={handleError}
        />
      </div>

      {/* 이벤트 로그 */}
      <div style={styles.eventLog}>
        <div style={styles.eventLogHeader}>
          이벤트 로그 ({eventLog.length})
          <button
            onClick={() => setEventLog([])}
            style={styles.clearButton}
          >
            초기화
          </button>
        </div>
        <div style={styles.eventList}>
          {eventLog.length === 0 ? (
            <div style={styles.emptyLog}>이벤트가 없습니다...</div>
          ) : (
            eventLog.map((event, index) => (
              <div
                key={index}
                style={{
                  ...styles.eventItem,
                  borderLeftColor: getEventColor(event.type)
                }}
              >
                <span style={styles.eventTime}>{event.timestamp}</span>
                <span style={{ ...styles.eventType, color: getEventColor(event.type) }}>
                  [{event.type}]
                </span>
                <span style={styles.eventMessage}>{event.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 선택된 엔티티 정보 */}
      {selectedEntities.length > 0 && (
        <div style={styles.selectionInfo}>
          선택된 엔티티: {selectedEntities.join(", ")}
        </div>
      )}
    </div>
  );
}

/**
 * 이벤트 타입별 색상 반환
 */
function getEventColor(type) {
  switch (type) {
    case "document.opened":
      return "#4ade80";
    case "save.status":
      return "#60a5fa";
    case "selection.changed":
      return "#a78bfa";
    case "upload.completed":
      return "#34d399";
    case "error":
      return "#ef4444";
    default:
      return "#94a3b8";
  }
}

/**
 * CSS 스타일
 */
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#0f172a",
    color: "#e2e8f0",
    fontFamily: "system-ui, sans-serif"
  },
  header: {
    padding: "16px 20px",
    borderBottom: "1px solid rgba(148, 163, 184, 0.1)"
  },
  title: {
    fontSize: "18px",
    fontWeight: 600,
    margin: "0 0 4px 0"
  },
  subtitle: {
    fontSize: "12px",
    color: "#64748b",
    margin: 0
  },
  configPanel: {
    padding: "12px 20px",
    background: "#1e293b",
    borderBottom: "1px solid rgba(148, 163, 184, 0.1)"
  },
  configRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px"
  },
  label: {
    fontSize: "12px",
    color: "#94a3b8",
    width: "60px"
  },
  input: {
    padding: "4px 8px",
    border: "1px solid #334155",
    borderRadius: "4px",
    background: "#0f172a",
    color: "#e2e8f0",
    fontSize: "12px",
    width: "200px"
  },
  configInfo: {
    fontSize: "11px",
    color: "#64748b",
    marginBottom: "4px"
  },
  configLabel: {
    color: "#94a3b8"
  },
  editorContainer: {
    flex: 1,
    minHeight: "300px",
    position: "relative"
  },
  eventLog: {
    height: "180px",
    background: "#1e293b",
    borderTop: "1px solid rgba(148, 163, 184, 0.1)",
    display: "flex",
    flexDirection: "column"
  },
  eventLogHeader: {
    padding: "8px 12px",
    fontSize: "11px",
    fontWeight: 600,
    color: "#94a3b8",
    borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  clearButton: {
    padding: "2px 8px",
    fontSize: "10px",
    background: "#334155",
    border: "none",
    borderRadius: "3px",
    color: "#e2e8f0",
    cursor: "pointer"
  },
  eventList: {
    flex: 1,
    overflowY: "auto",
    padding: "4px 0"
  },
  emptyLog: {
    padding: "16px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "11px"
  },
  eventItem: {
    display: "flex",
    gap: "8px",
    padding: "4px 12px",
    fontSize: "11px",
    borderLeft: "3px solid"
  },
  eventTime: {
    color: "#64748b",
    flexShrink: 0
  },
  eventType: {
    fontWeight: 500,
    flexShrink: 0
  },
  eventMessage: {
    color: "#e2e8f0"
  },
  selectionInfo: {
    padding: "6px 12px",
    background: "#1e293b",
    fontSize: "11px",
    color: "#a78bfa",
    borderTop: "1px solid rgba(148, 163, 184, 0.1)"
  }
};