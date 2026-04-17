/**
 * LayersPanel.jsx
 * 레이어 관리 패널 컴포넌트
 *
 * 레이어 목록, 가시성, 잠금, 활성 레이어 선택 UI를 제공합니다.
 */

import React, { useCallback } from "react";

/**
 * 눈 아이콘 SVG
 */
const EyeIcon = ({ visible }) => (
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

/**
 * 자물쇠 아이콘 SVG
 */
const LockIcon = ({ locked }) => (
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

/**
 * 레이어 패널 컴포넌트
 *
 * @param {Object} props
 * @param {Array} props.layers - 레이어 배열
 * @param {string|null} props.activeLayer - 현재 활성 레이어 이름
 * @param {Function} props.onLayerSelect - 레이어 선택 시 콜백 (name) => void
 * @param {Function} props.onToggleVisibility - 가시성 토글 콜백 (name, visible) => void
 * @param {Function} props.onToggleLock - 잠금 토글 콜백 (name, locked) => void
 * @param {Function} props.onAddLayer - 레이어 추가 버튼 콜백 () => void
 * @param {Function} props.onDeleteLayer - 레이어 삭제 콜백 (name) => void
 * @param {Function} props.onRenameLayer - 레이어 이름 변경 콜백 (oldName, newName) => void
 */
export function LayersPanel({
  layers = [],
  activeLayer = null,
  onLayerSelect,
  onToggleVisibility,
  onToggleLock,
  onAddLayer,
  onDeleteLayer,
  onRenameLayer
}) {
  /**
   * 가시성 토글 핸들러
   * @param {string} name
   * @param {boolean} currentVisible
   * @param {React.MouseEvent} e
   */
  const handleVisibilityToggle = useCallback((name, currentVisible, e) => {
    e.stopPropagation();
    if (onToggleVisibility) {
      onToggleVisibility(name, !currentVisible);
    }
  }, [onToggleVisibility]);

  /**
   * 잠금 토글 핸들러
   * @param {string} name
   * @param {boolean} currentLocked
   * @param {React.MouseEvent} e
   */
  const handleLockToggle = useCallback((name, currentLocked, e) => {
    e.stopPropagation();
    if (onToggleLock) {
      onToggleLock(name, !currentLocked);
    }
  }, [onToggleLock]);

  /**
   * 레이어 클릭 핸들러
   * @param {string} name
   */
  const handleLayerClick = useCallback((name) => {
    if (onLayerSelect) {
      onLayerSelect(name);
    }
  }, [onLayerSelect]);

  return (
    <div className="layers-panel" style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.title}>레이어</span>
        {onAddLayer && (
          <button style={styles.addButton} onClick={onAddLayer} title="레이어 추가">
            +
          </button>
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
              style={{
                ...styles.layerItem,
                ...(isActive ? styles.layerItemActive : {})
              }}
              onClick={() => handleLayerClick(layer.name)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleLayerClick(layer.name);
                }
              }}
            >
              {/* 가시성 토글 */}
              <button
                style={styles.iconButton}
                onClick={(e) => handleVisibilityToggle(layer.name, layer.visible, e)}
                title={layer.visible ? "가시성 끄기" : "가시성 켜기"}
              >
                <EyeIcon visible={layer.visible} />
              </button>

              {/* 잠금 토글 */}
              <button
                style={styles.iconButton}
                onClick={(e) => handleLockToggle(layer.name, layer.locked, e)}
                title={layer.locked ? "잠금 해제" : "잠금"}
              >
                <LockIcon locked={layer.locked} />
              </button>

              {/* 레이어 이름 */}
              <span style={styles.layerName} title={layer.name}>
                {layer.name}
              </span>

              {/* 색상 표시 */}
              {layer.color !== undefined && (
                <span
                  style={{
                    ...styles.colorSwatch,
                    backgroundColor: getColorHex(layer.color)
                  }}
                  title={`색상: ${layer.color}`}
                />
              )}

              {/* 삭제 버튼 */}
              {layer.name !== "0" && onDeleteLayer && (
                <button
                  style={styles.deleteButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteLayer(layer.name);
                  }}
                  title="레이어 삭제"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * AutoCAD 색상 번호를 HEX로 변환 (간단한 변환)
 * @param {number} colorIndex
 * @returns {string}
 */
function getColorHex(colorIndex) {
  // AutoCAD 색상 인덱스 -> HEX 매핑 (기본 16색)
  const cadColors = {
    1: "#FF0000", // 빨강
    2: "#FFFF00", // 노랑
    3: "#00FF00", // 초록
    4: "#00FFFF", // 하늘
    5: "#0000FF", // 파랑
    6: "#FF00FF", // 자홍
    7: "#FFFFFF", // 흰색
    8: "#404040", // 어두운 회색
    9: "#808080", // 회색
    10: "#FF8080",
    11: "#FFFF80",
    12: "#80FF80",
    13: "#80FFFF",
    14: "#8080FF",
    15: "#FF80FF",
    30: "#804000",
    40: "#008040",
    50: "#004080",
    60: "#800080",
    70: "#808000",
    140: "#FF8000",
    160: "#8000FF"
  };

  return cadColors[colorIndex] || `#${String(colorIndex).padStart(6, "0")}`;
}

const styles = {
  panel: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    color: "#ccc",
    backgroundColor: "#1e1e1e"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    borderBottom: "1px solid #333"
  },
  title: {
    fontWeight: 600,
    fontSize: "13px",
    color: "#fff"
  },
  addButton: {
    width: "20px",
    height: "20px",
    padding: 0,
    border: "none",
    borderRadius: "3px",
    backgroundColor: "#0d7dd4",
    color: "#fff",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    lineHeight: 1
  },
  layerList: {
    flex: 1,
    overflowY: "auto",
    padding: "4px 0"
  },
  emptyState: {
    padding: "16px",
    textAlign: "center",
    color: "#666",
    fontStyle: "italic"
  },
  layerItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "5px 8px",
    cursor: "pointer",
    borderLeft: "3px solid transparent",
    transition: "background-color 0.15s"
  },
  layerItemActive: {
    backgroundColor: "#2a2d3a",
    borderLeftColor: "#0d7dd4"
  },
  iconButton: {
    width: "22px",
    height: "22px",
    padding: "3px",
    border: "none",
    borderRadius: "3px",
    backgroundColor: "transparent",
    color: "#aaa",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  layerName: {
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    fontSize: "12px",
    color: "#ccc"
  },
  colorSwatch: {
    width: "14px",
    height: "14px",
    borderRadius: "2px",
    border: "1px solid #444",
    flexShrink: 0
  },
  deleteButton: {
    width: "18px",
    height: "18px",
    padding: 0,
    border: "none",
    borderRadius: "3px",
    backgroundColor: "transparent",
    color: "#888",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    flexShrink: 0,
    lineHeight: 1,
    opacity: 0
  }
};

export default LayersPanel;
