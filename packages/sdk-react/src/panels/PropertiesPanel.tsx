import React, { useCallback } from "react";
import type { Entity } from "../canvas/cad-canvas-renderer";

const ENTITY_FIELDS: Record<string, Array<{ key: string; label: string; type: string }>> = {
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

interface NumberFieldProps {
  label: string;
  fieldKey: string;
  value?: number;
  onChange: (key: string, value: number) => void;
}

function NumberField({ label, fieldKey, value, onChange }: NumberFieldProps) {
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

interface TextFieldProps {
  label: string;
  fieldKey: string;
  value?: string;
  onChange: (key: string, value: string) => void;
}

function TextField({ label, fieldKey, value, onChange }: TextFieldProps) {
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

interface PointFieldProps {
  label: string;
  value?: { x: number; y: number };
  onChange: (value: { x: number; y: number }) => void;
}

function PointField({ label, value, onChange }: PointFieldProps) {
  const handleXChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ x: parseFloat(e.target.value) || 0, y: value?.y ?? 0 });
  }, [value, onChange]);

  const handleYChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ x: value?.x ?? 0, y: parseFloat(e.target.value) || 0 });
  }, [value, onChange]);

  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <div style={styles.pointRow}>
        <span style={styles.coordLabel}>X</span>
        <input type="number" value={value?.x ?? ""} onChange={handleXChange} style={{ ...styles.input, width: "70px" }} />
        <span style={styles.coordLabel}>Y</span>
        <input type="number" value={value?.y ?? ""} onChange={handleYChange} style={{ ...styles.input, width: "70px" }} />
      </div>
    </div>
  );
}

interface BooleanFieldProps {
  label: string;
  value?: boolean;
  onChange: (value: boolean) => void;
}

function BooleanField({ label, value, onChange }: BooleanFieldProps) {
  return (
    <div style={styles.field}>
      <label style={styles.checkboxLabel}>
        <input type="checkbox" checked={value ?? false} onChange={(e) => onChange(e.target.checked)} />
        {` ${label}`}
      </label>
    </div>
  );
}

export interface PropertiesPanelProps {
  selectedEntity?: Entity | null;
  onEntityUpdate?: (entity: Entity, command: { type: string; entityId: string; params: Record<string, unknown> }) => void;
}

export function createUpdateEntityCommand(entityId: string, fieldKey: string, newValue: unknown) {
  return {
    type: "UPDATE_ENTITY",
    entityId,
    params: { [fieldKey]: newValue }
  };
}

const styles: Record<string, React.CSSProperties> = {
  panel: { width: "100%", height: "100%", background: "#1e293b", color: "#e2e8f0", fontFamily: "system-ui, sans-serif", fontSize: "12px", display: "flex", flexDirection: "column", overflow: "hidden" },
  header: { padding: "10px 12px", fontWeight: 600, borderBottom: "1px solid rgba(148, 163, 184, 0.12)", background: "#0f172a" },
  content: { padding: "8px 12px", overflowY: "auto", flex: 1 },
  entityId: { fontSize: "10px", color: "#64748b", marginBottom: "8px", wordBreak: "break-all" },
  field: { marginBottom: "8px" },
  label: { display: "block", marginBottom: "2px", color: "#94a3b8" },
  input: { width: "100%", padding: "4px 6px", border: "1px solid #334155", borderRadius: "3px", background: "#0f172a", color: "#e2e8f0", fontSize: "12px", boxSizing: "border-box" },
  pointRow: { display: "flex", alignItems: "center", gap: "4px" },
  coordLabel: { fontSize: "11px", color: "#64748b", width: "16px" },
  checkboxLabel: { display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" },
  emptyMessage: { padding: "20px 12px", textAlign: "center", color: "#64748b", fontSize: "12px" }
};

export function PropertiesPanel({ selectedEntity, onEntityUpdate }: PropertiesPanelProps) {
  const handleFieldChange = useCallback((key: string, newValue: unknown) => {
    if (!selectedEntity || !onEntityUpdate) return;
    const updatedEntity = { ...selectedEntity, [key]: newValue };
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
      <div style={styles.header}>속성 — {entityType}</div>
      <div style={styles.content}>
        <div style={styles.entityId}>ID: {selectedEntity.id}</div>
        {fields.map((field) => {
          const value = (selectedEntity as Record<string, unknown>)[field.key];
          switch (field.type) {
            case "number":
              return <NumberField key={field.key} label={field.label} fieldKey={field.key} value={value as number} onChange={handleFieldChange} />;
            case "text":
              return <TextField key={field.key} label={field.label} fieldKey={field.key} value={value as string} onChange={handleFieldChange} />;
            case "point":
              return <PointField key={field.key} label={field.label} value={value as { x: number; y: number }} onChange={(newValue) => handleFieldChange(field.key, newValue)} />;
            case "boolean":
              return <BooleanField key={field.key} label={field.label} value={value as boolean} onChange={(newValue) => handleFieldChange(field.key, newValue)} />;
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
