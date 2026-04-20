import React, { useCallback } from "react";

export interface Layer {
  name: string;
  color?: number;
  visible?: boolean;
  locked?: boolean;
}

export interface LayersPanelProps {
  layers?: Layer[];
  activeLayer?: string | null;
  onLayerSelect?: (name: string) => void;
  onToggleVisibility?: (name: string, visible: boolean) => void;
  onToggleLock?: (name: string, locked: boolean) => void;
  onAddLayer?: () => void;
  onDeleteLayer?: (name: string) => void;
  onRenameLayer?: (oldName: string, newName: string) => void;
}

const EyeIcon = ({ visible }: { visible?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    {visible ? (
      <>
        <path d="M1 8C1 8 3.5 3 8 3C12.5 3 15 8 15 8C15 8 12.5 13 8 13C3.5 13 1 8 1 8Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </>
    ) : (
      <>
        <path d="M2 2L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M5.5 5.5C4.5 6.5 3.5 8 3 8C3 8 4.5 11.5 8 11.5C9.5 11.5 11 10.5 12 9.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M13 6.5C11.5 5 9.5 4 8 4C4.5 4 1.5 7 1 8C2 9 3.5 10 5 10.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </>
    )}
  </svg>
);

const LockIcon = ({ locked }: { locked?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    {locked ? (
      <>
        <rect x="3" y="7" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M5 7V5C5 3.34315 6.34315 2 8 2C9.65685 2 11 3.34315 11 5V7" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="8" cy="11" r="1" fill="currentColor" />
      </>
    ) : (
      <>
        <rect x="3" y="7" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M5 7V5C5 3.34315 6.34315 2 8 2C9.65685 2 11 3.34315 11 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <circle cx="8" cy="11" r="1" fill="currentColor" />
      </>
    )}
  </svg>
);

function getColorHex(colorIndex: number): string {
  const cadColors: Record<number, string> = {
    1: "#FF0000", 2: "#FFFF00", 3: "#00FF00", 4: "#00FFFF",
    5: "#0000FF", 6: "#FF00FF", 7: "#FFFFFF", 8: "#404040",
    9: "#808080", 10: "#FF8080", 11: "#FFFF80", 12: "#80FF80",
    13: "#80FFFF", 14: "#8080FF", 15: "#FF80FF",
    30: "#804000", 40: "#008040", 50: "#004080",
    60: "#800080", 70: "#808000", 140: "#FF8000", 160: "#8000FF"
  };
  return cadColors[colorIndex] || `#${String(colorIndex).padStart(6, "0")}`;
}

const styles: Record<string, React.CSSProperties> = {
  panel: { display: "flex", flexDirection: "column", width: "100%", height: "100%", fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#ccc", backgroundColor: "#1e1e1e" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid #333" },
  title: { fontWeight: 600, fontSize: "13px", color: "#fff" },
  addButton: { width: "20px", height: "20px", padding: 0, border: "none", borderRadius: "3px", backgroundColor: "#0d7dd4", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: "pointer", lineHeight: 1 },
  layerList: { flex: 1, overflowY: "auto", padding: "4px 0" },
  emptyState: { padding: "16px", textAlign: "center", color: "#666", fontStyle: "italic" },
  layerItem: { display: "flex", alignItems: "center", gap: "4px", padding: "5px 8px", cursor: "pointer", borderLeft: "3px solid transparent", transition: "background-color 0.15s" },
  layerItemActive: { backgroundColor: "#2a2d3a", borderLeftColor: "#0d7dd4" },
  iconButton: { width: "22px", height: "22px", padding: "3px", border: "none", borderRadius: "3px", backgroundColor: "transparent", color: "#aaa", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  layerName: { flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "12px", color: "#ccc" },
  colorSwatch: { width: "14px", height: "14px", borderRadius: "2px", border: "1px solid #444", flexShrink: 0 },
  deleteButton: { width: "18px", height: "18px", padding: 0, border: "none", borderRadius: "3px", backgroundColor: "transparent", color: "#888", fontSize: "14px", fontWeight: 700, cursor: "pointer", flexShrink: 0, lineHeight: 1, opacity: 0 }
};

export function LayersPanel({
  layers = [],
  activeLayer = null,
  onLayerSelect,
  onToggleVisibility,
  onToggleLock,
  onAddLayer,
  onDeleteLayer
}: LayersPanelProps) {
  const handleVisibilityToggle = useCallback((name: string, currentVisible: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleVisibility?.(name, !currentVisible);
  }, [onToggleVisibility]);

  const handleLockToggle = useCallback((name: string, currentLocked: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleLock?.(name, !currentLocked);
  }, [onToggleLock]);

  const handleLayerClick = useCallback((name: string) => {
    onLayerSelect?.(name);
  }, [onLayerSelect]);

  return (
    <div className="layers-panel" style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.title}>레이어</span>
        {onAddLayer && (
          <button style={styles.addButton} onClick={onAddLayer} title="레이어 추가">+</button>
        )}
      </div>
      <div style={styles.layerList}>
        {layers.length === 0 && (
          <div style={styles.emptyState}>레이어가 없습니다</div>
        )}
        {layers.map((layer) => {
          const isActive = layer.name === activeLayer;
          return (
            <div
              key={layer.name}
              style={{ ...styles.layerItem, ...(isActive ? styles.layerItemActive : {}) }}
              onClick={() => handleLayerClick(layer.name)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleLayerClick(layer.name);
                }
              }}
            >
              <button
                style={styles.iconButton}
                onClick={(e) => handleVisibilityToggle(layer.name, layer.visible ?? true, e)}
                title={layer.visible ? "가시성 끄기" : "가시성 켜기"}
              >
                <EyeIcon visible={layer.visible} />
              </button>
              <button
                style={styles.iconButton}
                onClick={(e) => handleLockToggle(layer.name, layer.locked ?? false, e)}
                title={layer.locked ? "잠금 해제" : "잠금"}
              >
                <LockIcon locked={layer.locked} />
              </button>
              <span style={styles.layerName} title={layer.name}>{layer.name}</span>
              {layer.color !== undefined && (
                <span style={{ ...styles.colorSwatch, backgroundColor: getColorHex(layer.color) }} title={`색상: ${layer.color}`} />
              )}
              {layer.name !== "0" && onDeleteLayer && (
                <button
                  style={styles.deleteButton}
                  onClick={(e) => { e.stopPropagation(); onDeleteLayer(layer.name); }}
                  title="레이어 삭제"
                >×</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LayersPanel;
