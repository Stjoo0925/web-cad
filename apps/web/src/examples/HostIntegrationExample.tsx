/**
 * HostIntegrationExample.tsx
 * Host app integration example — actual usage of CadPointCloudEditor
 *
 * Handles document open, save status, selection change, upload complete, and map error events.
 * Shows the flow where host app supplies the token.
 */

import React, { useState, useCallback } from "react";
import { CadPointCloudEditor } from "@web-cad/sdk-react";

interface EventLogEntry {
  type: string;
  message: string;
  timestamp: string;
}

interface HostIntegrationExampleProps {
  baseUrl: string;
  token: string;
}

/**
 * HostIntegrationExample — host app integration example component
 */
export function HostIntegrationExample({ baseUrl, token }: HostIntegrationExampleProps) {
  const [documentId, setDocumentId] = useState("doc-001");
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);

  /**
   * Add to event log
   */
  const addLog = useCallback((type: string, message: string) => {
    setEventLog((prev) => [
      { type, message, timestamp: new Date().toLocaleTimeString() },
      ...prev.slice(0, 49)
    ]);
  }, []);

  /**
   * Document open event handler
   */
  const handleDocumentOpened = useCallback((document: { id?: string }) => {
    addLog("document.opened", `Document opened: ${document.id || documentId}`);
  }, [addLog, documentId]);

  /**
   * Save status event handler
   */
  const handleSaveStatus = useCallback((event: { status: string; documentId: string }) => {
    addLog("save.status", `Save status: ${event.status} — ${event.documentId}`);
  }, [addLog]);

  /**
   * Selection change event handler
   */
  const handleSelectionChange = useCallback((entityIds: string[]) => {
    setSelectedEntities(entityIds);
    addLog("selection.changed", `Selection changed: ${entityIds.length} entities`);
  }, [addLog]);

  /**
   * Upload complete event handler
   */
  const handleUploadCompleted = useCallback((event: { assetType: string; fileName: string }) => {
    addLog("upload.completed", `Upload complete: ${event.assetType} — ${event.fileName}`);
  }, [addLog]);

  /**
   * Error event handler
   */
  const handleError = useCallback((event: { type: string; message: string }) => {
    addLog("error", `${event.type}: ${event.message}`);
  }, [addLog]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Web CAD Host Integration Example</h1>
        <p style={styles.subtitle}>Example of using CadPointCloudEditor from host app</p>
      </div>

      {/* Config panel */}
      <div style={styles.configPanel}>
        <div style={styles.configRow}>
          <label style={styles.label}>Document ID:</label>
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
          <span style={styles.configLabel}>Token:</span> {token ? "Set" : "Not set"}
        </div>
      </div>

      {/* Editor area */}
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

      {/* Event log */}
      <div style={styles.eventLog}>
        <div style={styles.eventLogHeader}>
          Event Log ({eventLog.length})
          <button
            onClick={() => setEventLog([])}
            style={styles.clearButton}
          >
            Clear
          </button>
        </div>
        <div style={styles.eventList}>
          {eventLog.length === 0 ? (
            <div style={styles.emptyLog}>No events...</div>
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

      {/* Selected entity info */}
      {selectedEntities.length > 0 && (
        <div style={styles.selectionInfo}>
          Selected entities: {selectedEntities.join(", ")}
        </div>
      )}
    </div>
  );
}

/**
 * Return color by event type
 */
function getEventColor(type: string): string {
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
 * CSS styles
 */
const styles: Record<string, React.CSSProperties> = {
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
