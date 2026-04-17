/**
 * PropertiesPanel.jsx
 * 속성 패널 컴포넌트
 *
 * 선택된 엔티티의 속성을 표시하고 수정할 수 있는 패널입니다.
 * 레이어, 좌표, 반지름, 색상 등 엔티티별 속성을 편집합니다.
 */

import React, { useCallback } from "react";

/**
 * 엔티티 타입별 속성 필드 정의
 */
const ENTITY_FIELDS = {
  LINE: [
    { key: "start", label: "시작점", type: "point" },
    { key: "end", label: "끝점", type: "point" },
    { key: "layer", label: "레이어", type: "text" },
    { key: "color", label: "색상", type: "text" }
  ],
  POLYLINE: [
    { key: "vertices", label: "버텍스", type: "vertices" },
    { key: "closed", label: "닫힘", type: "boolean" },
    { key: "layer", label: "레이어", type: "text" },
    { key: "color", label: "색상", type: "text" }
  ],
  CIRCLE: [
    { key: "center", label: "중심", type: "point" },
    { key: "radius", label: "반지름", type: "number" },
    { key: "layer", label: "레이어", type: "text" },
    { key: "color", label: "색상", type: "text" }
  ],
  ARC: [
    { key: "center", label: "중심", type: "point" },
    { key: "radius", label: "반지름", type: "number" },
    { key: "startAngle", label: "시작 각도", type: "number" },
    { key: "endAngle", label: "끝 각도", type: "number" },
    { key: "layer", label: "레이어", type: "text" }
  ],
  POINT: [
    { key: "position", label: "위치", type: "point" },
    { key: "layer", label: "레이어", type: "text" }
  ]
};

/**
 * 숫자 값을 입력합니다.
 *
 * @param {Object} props
 * @param {string} props.label - 필드 라벨
 * @param {string} props.fieldKey - 필드 키
 * @param {number|string} props.value - 현재 값
 * @param {Function} props.onChange - 변경 핸들러
 */
function NumberField({ label, fieldKey, value, onChange }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(fieldKey, parseFloat(e.target.value) || 0)}
        style={styles.input}
      />
    </div>
  );
}

/**
 * 텍스트 값을 입력합니다.
 *
 * @param {Object} props
 * @param {string} props.label - 필드 라벨
 * @param {string} props.fieldKey - 필드 키
 * @param {string} props.value - 현재 값
 * @param {Function} props.onChange - 변경 핸들러
 */
function TextField({ label, fieldKey, value, onChange }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        style={styles.input}
      />
    </div>
  );
}

/**
 * 좌표 포인트를 입력합니다.
 *
 * @param {Object} props
 * @param {string} props.label - 필드 라벨
 * @param {Object} props.value - 현재 값 { x, y }
 * @param {Function} props.onChange - 변경 핸들러
 */
function PointField({ label, value, onChange }) {
  const handleXChange = useCallback((e) => {
    onChange({ x: parseFloat(e.target.value) || 0, y: value?.y ?? 0 });
  }, [value, onChange]);

  const handleYChange = useCallback((e) => {
    onChange({ x: value?.x ?? 0, y: parseFloat(e.target.value) || 0 });
  }, [value, onChange]);

  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <div style={styles.pointRow}>
        <span style={styles.coordLabel}>X</span>
        <input
          type="number"
          value={value?.x ?? ""}
          onChange={handleXChange}
          style={{ ...styles.input, width: "70px" }}
        />
        <span style={styles.coordLabel}>Y</span>
        <input
          type="number"
          value={value?.y ?? ""}
          onChange={handleYChange}
          style={{ ...styles.input, width: "70px" }}
        />
      </div>
    </div>
  );
}

/**
 * 불리언 (체크박스) 필드
 *
 * @param {Object} props
 * @param {string} props.label - 필드 라벨
 * @param {boolean} props.value - 현재 값
 * @param {Function} props.onChange - 변경 핸들러
 */
function BooleanField({ label, value, onChange }) {
  return (
    <div style={styles.field}>
      <label style={styles.checkboxLabel}>
        <input
          type="checkbox"
          checked={value ?? false}
          onChange={(e) => onChange(e.target.checked)}
        />
        {" "}{label}
      </label>
    </div>
  );
}

/**
 * PropertiesPanel — 선택된 엔티티의 속성을 표시하고 수정하는 패널
 *
 * @param {Object} props - 컴포넌트 속성
 * @param {Object|null} props.selectedEntity - 선택된 엔티티
 * @param {Function} props.onEntityUpdate - 엔티티 업데이트 콜백 (entity, command)
 */
export function PropertiesPanel({
  selectedEntity,
  onEntityUpdate
}) {
  /**
   * 필드 값 변경 핸들러
   *
   * @param {string} key - 필드 키
   * @param {any} newValue - 새로운 값
   */
  const handleFieldChange = useCallback((key, newValue) => {
    if (!selectedEntity || !onEntityUpdate) return;

    // 엔티티 타입별 필드 업데이트
    let updatedEntity;
    if (key === "start" || key === "end" || key === "center" || key === "position") {
      updatedEntity = {
        ...selectedEntity,
        [key]: newValue
      };
    } else {
      updatedEntity = {
        ...selectedEntity,
        [key]: newValue
      };
    }

    // UPDATE_ENTITY 명령 생성
    const command = createUpdateEntityCommand(selectedEntity.id, key, newValue);

    onEntityUpdate(updatedEntity, command);
  }, [selectedEntity, onEntityUpdate]);

  if (!selectedEntity) {
    return (
      <div style={styles.panel}>
        <div style={styles.header}>속성</div>
        <div style={styles.emptyMessage}>선택된 엔티티 없음</div>
      </div>
    );
  }

  const entityType = selectedEntity.type;
  const fields = ENTITY_FIELDS[entityType] || [];

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        속성 — {entityType}
      </div>
      <div style={styles.content}>
        <div style={styles.entityId}>
          ID: {selectedEntity.id}
        </div>
        {fields.map((field) => {
          const value = selectedEntity[field.key];

          switch (field.type) {
            case "number":
              return (
                <NumberField
                  key={field.key}
                  label={field.label}
                  fieldKey={field.key}
                  value={value}
                  onChange={handleFieldChange}
                />
              );
            case "text":
              return (
                <TextField
                  key={field.key}
                  label={field.label}
                  fieldKey={field.key}
                  value={value}
                  onChange={handleFieldChange}
                />
              );
            case "point":
              return (
                <PointField
                  key={field.key}
                  label={field.label}
                  value={value}
                  onChange={(newValue) => handleFieldChange(field.key, newValue)}
                />
              );
            case "boolean":
              return (
                <BooleanField
                  key={field.key}
                  label={field.label}
                  value={value}
                  onChange={(newValue) => handleFieldChange(field.key, newValue)}
                />
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}

/**
 * 엔티티 업데이트 문서 명령을 생성합니다.
 *
 * @param {string} entityId - 엔티티 ID
 * @param {string} fieldKey - 필드 키
 * @param {any} newValue - 새로운 값
 * @returns {Object} UPDATE_ENTITY 명령
 */
export function createUpdateEntityCommand(entityId, fieldKey, newValue) {
  return {
    type: "UPDATE_ENTITY",
    entityId,
    params: {
      [fieldKey]: newValue
    }
  };
}

/**
 * 속성 패널의 CSS 스타일
 */
const styles = {
  panel: {
    width: "100%",
    height: "100%",
    background: "#1e293b",
    color: "#e2e8f0",
    fontFamily: "system-ui, sans-serif",
    fontSize: "12px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },
  header: {
    padding: "10px 12px",
    fontWeight: 600,
    borderBottom: "1px solid rgba(148, 163, 184, 0.12)",
    background: "#0f172a"
  },
  content: {
    padding: "8px 12px",
    overflowY: "auto",
    flex: 1
  },
  entityId: {
    fontSize: "10px",
    color: "#64748b",
    marginBottom: "8px",
    wordBreak: "break-all"
  },
  field: {
    marginBottom: "8px"
  },
  label: {
    display: "block",
    marginBottom: "2px",
    color: "#94a3b8"
  },
  input: {
    width: "100%",
    padding: "4px 6px",
    border: "1px solid #334155",
    borderRadius: "3px",
    background: "#0f172a",
    color: "#e2e8f0",
    fontSize: "12px",
    boxSizing: "border-box"
  },
  pointRow: {
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  coordLabel: {
    fontSize: "11px",
    color: "#64748b",
    width: "16px"
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    cursor: "pointer"
  },
  emptyMessage: {
    padding: "20px 12px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "12px"
  }
};