/**
 * LayoutTabs.tsx
 * Layout Tab Component
 *
 * Model/Layout tab management for Paper Space / Layout support.
 */

import React, { useState } from "react";

export interface LayoutTab {
  id: string;
  name: string;
  type: "model" | "layout";
  paperSize?: { width: number; height: number };
  isActive: boolean;
}

export interface LayoutTabsProps {
  tabs: LayoutTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onTabCreate?: (name: string, type: "model" | "layout") => void;
  onTabRename?: (tabId: string, newName: string) => void;
  onTabDelete?: (tabId: string) => void;
}

export const LayoutTabs: React.FC<LayoutTabsProps> = ({
  tabs,
  activeTabId,
  onTabChange,
  onTabCreate,
  onTabRename,
  onTabDelete,
}) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTabName, setNewTabName] = useState("");

  const handleDoubleClick = (tab: LayoutTab) => {
    if (tab.type === "layout") {
      setIsEditing(tab.id);
      setEditName(tab.name);
    }
  };

  const handleEditSubmit = (tabId: string) => {
    if (onTabRename && editName.trim()) {
      onTabRename(tabId, editName.trim());
    }
    setIsEditing(null);
    setEditName("");
  };

  const handleNewTab = () => {
    if (onTabCreate && newTabName.trim()) {
      onTabCreate(newTabName.trim(), "layout");
    }
    setNewTabName("");
    setShowNewDialog(false);
  };

  return (
    <div className="layout-tabs" style={styles.container}>
      <div className="tabs-list" style={styles.tabsList}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${tab.id === activeTabId ? "active" : ""}`}
            style={{
              ...styles.tab,
              ...(tab.id === activeTabId ? styles.activeTab : {}),
            }}
            onClick={() => onTabChange(tab.id)}
            onDoubleClick={() => handleDoubleClick(tab)}
          >
            {isEditing === tab.id ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => handleEditSubmit(tab.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEditSubmit(tab.id);
                  if (e.key === "Escape") {
                    setIsEditing(null);
                    setEditName("");
                  }
                }}
                style={styles.tabInput}
                autoFocus
              />
            ) : (
              <>
                <span style={styles.tabIcon}>
                  {tab.type === "model" ? "📐" : "📄"}
                </span>
                <span style={styles.tabName}>{tab.name}</span>
                {tab.type === "layout" && tab.id !== "layout-1" && (
                  <button
                    className="tab-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onTabDelete) onTabDelete(tab.id);
                    }}
                    style={styles.deleteButton}
                  >
                    ×
                  </button>
                )}
              </>
            )}
          </div>
        ))}

        {onTabCreate && (
          <button
            className="new-tab-button"
            onClick={() => setShowNewDialog(true)}
            style={styles.newTabButton}
          >
            + New Layout
          </button>
        )}
      </div>

      {showNewDialog && (
        <div style={styles.dialogOverlay}>
          <div style={styles.dialog}>
            <h4 style={styles.dialogTitle}>New Layout</h4>
            <input
              type="text"
              value={newTabName}
              onChange={(e) => setNewTabName(e.target.value)}
              placeholder="Layout name"
              style={styles.dialogInput}
              autoFocus
            />
            <div style={styles.dialogButtons}>
              <button onClick={handleNewTab} style={styles.createButton}>
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewDialog(false);
                  setNewTabName("");
                }}
                style={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTabId && (
        <div style={styles.layoutInfo}>
          {tabs.find((t) => t.id === activeTabId)?.type === "layout" && (
            <span style={styles.paperSize}>
              Paper:{" "}
              {tabs.find((t) => t.id === activeTabId)?.paperSize
                ? `${tabs.find((t) => t.id === activeTabId)?.paperSize?.width} x ${tabs.find((t) => t.id === activeTabId)?.paperSize?.height}`
                : "A4"}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#2d2d2d",
    borderBottom: "1px solid #444",
    padding: "0 8px",
    height: "32px",
    gap: "4px",
  },
  tabsList: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    flex: 1,
    overflow: "hidden",
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 12px",
    backgroundColor: "#3a3a3a",
    borderRadius: "4px 4px 0 0",
    cursor: "pointer",
    color: "#ccc",
    fontSize: "12px",
    transition: "background-color 0.15s",
  },
  activeTab: {
    backgroundColor: "#1e1e1e",
    color: "#fff",
    borderBottom: "2px solid #0078d4",
  },
  tabIcon: {
    fontSize: "10px",
  },
  tabName: {
    maxWidth: "100px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  tabInput: {
    backgroundColor: "#555",
    border: "1px solid #0078d4",
    color: "#fff",
    padding: "2px 4px",
    fontSize: "12px",
    width: "80px",
    outline: "none",
  },
  deleteButton: {
    background: "none",
    border: "none",
    color: "#888",
    cursor: "pointer",
    padding: "0 2px",
    fontSize: "14px",
    lineHeight: 1,
  },
  newTabButton: {
    background: "none",
    border: "1px dashed #555",
    color: "#888",
    cursor: "pointer",
    padding: "4px 8px",
    fontSize: "11px",
    borderRadius: "4px",
    marginLeft: "4px",
  },
  dialogOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: "#2d2d2d",
    border: "1px solid #555",
    borderRadius: "8px",
    padding: "20px",
    minWidth: "250px",
  },
  dialogTitle: {
    margin: "0 0 16px 0",
    color: "#fff",
    fontSize: "14px",
  },
  dialogInput: {
    width: "100%",
    padding: "8px",
    backgroundColor: "#3a3a3a",
    border: "1px solid #555",
    borderRadius: "4px",
    color: "#fff",
    fontSize: "13px",
    boxSizing: "border-box",
  },
  dialogButtons: {
    display: "flex",
    gap: "8px",
    marginTop: "16px",
    justifyContent: "flex-end",
  },
  createButton: {
    padding: "6px 16px",
    backgroundColor: "#0078d4",
    border: "none",
    borderRadius: "4px",
    color: "#fff",
    cursor: "pointer",
    fontSize: "12px",
  },
  cancelButton: {
    padding: "6px 16px",
    backgroundColor: "#3a3a3a",
    border: "1px solid #555",
    borderRadius: "4px",
    color: "#ccc",
    cursor: "pointer",
    fontSize: "12px",
  },
  layoutInfo: {
    marginLeft: "auto",
    fontSize: "11px",
    color: "#888",
  },
  paperSize: {
    padding: "2px 8px",
    backgroundColor: "#333",
    borderRadius: "4px",
  },
};

export default LayoutTabs;
