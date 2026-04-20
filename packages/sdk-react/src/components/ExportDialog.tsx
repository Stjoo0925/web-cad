/**
 * ExportDialog - UI component for PNG/PDF export
 * @module components/ExportDialog
 */

import React, { useState, useCallback } from "react";
import type {
  ExportFormat,
  PngQuality,
  PdfPageSize,
  ExportOptions,
} from "../tools/export-tool.js";
import { exportCanvas } from "../tools/export-tool.js";

export interface ExportDialogProps {
  /** Reference to the canvas element to export */
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Initial format selection */
  initialFormat?: ExportFormat;
  /** Callback when dialog closes */
  onClose?: () => void;
  /** Default filename (without extension) */
  defaultFilename?: string;
}

const FORMAT_LABELS: Record<ExportFormat, string> = {
  png: "PNG (Image)",
  pdf: "PDF (Document)",
};

const PAGE_SIZE_LABELS: Record<PdfPageSize, string> = {
  a4: "A4 (210 x 297 mm)",
  letter: "Letter (8.5 x 11 in)",
  legal: "Legal (8.5 x 14 in)",
};

const QUALITY_LABELS: Record<PngQuality, string> = {
  0.8: "Compressed (smaller file)",
  0.95: "High quality",
  1.0: "Lossless (largest)",
};

const QUALITY_OPTIONS: PngQuality[] = Object.keys(QUALITY_LABELS).map(
  (q) => Number(q) as PngQuality,
);

const STYLE = {
  overlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  dialog: {
    background: "#2d2d2d",
    border: "1px solid #4d4d4d",
    borderRadius: "8px",
    padding: "20px",
    width: "340px",
    color: "#fff",
    fontFamily: "Segoe UI, Arial, sans-serif",
    fontSize: "13px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  },
  title: {
    fontSize: "15px",
    fontWeight: 600,
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  field: {
    marginBottom: "12px",
  },
  label: {
    display: "block",
    fontSize: "11px",
    color: "#888",
    marginBottom: "4px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  select: {
    width: "100%",
    padding: "6px 8px",
    background: "#1e1e1e",
    border: "1px solid #4d4d4d",
    borderRadius: "4px",
    color: "#fff",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  input: {
    width: "100%",
    padding: "6px 8px",
    background: "#1e1e1e",
    border: "1px solid #4d4d4d",
    borderRadius: "4px",
    color: "#fff",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box" as const,
  },
  hint: {
    fontSize: "10px",
    color: "#666",
    marginTop: "4px",
  },
  actions: {
    display: "flex",
    gap: "8px",
    marginTop: "16px",
    justifyContent: "flex-end",
  },
  btn: {
    padding: "7px 16px",
    borderRadius: "4px",
    border: "none",
    fontSize: "12px",
    cursor: "pointer",
    fontWeight: 500,
  },
  btnPrimary: {
    background: "#0078d4",
    color: "#fff",
  },
  btnSecondary: {
    background: "#4d4d4d",
    color: "#fff",
  },
  error: {
    color: "#ff6b6b",
    fontSize: "11px",
    marginTop: "8px",
  },
  info: {
    background: "#1e1e1e",
    border: "1px solid #4d4d4d",
    borderRadius: "4px",
    padding: "8px",
    marginBottom: "12px",
    fontSize: "11px",
    color: "#888",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "4px",
  },
};

export function ExportDialog({
  canvasRef,
  initialFormat = "png",
  onClose,
  defaultFilename = "cad-export",
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>(initialFormat);
  const [quality, setQuality] = useState<PngQuality>(0.95);
  const [pageSize, setPageSize] = useState<PdfPageSize>("a4");
  const [filename, setFilename] = useState(defaultFilename);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setError("Canvas not available");
      return;
    }

    setLoading(true);
    setError(null);

    const options: ExportOptions = {
      format,
      quality: format === "png" ? quality : undefined,
      pageSize: format === "pdf" ? pageSize : undefined,
      filename: `${filename}.${format}`,
    };

    const result = await exportCanvas(canvas, options);

    setLoading(false);

    if (result.success) {
      onClose?.();
    } else {
      setError(result.error ?? "Export failed");
    }
  }, [canvasRef, format, quality, pageSize, filename, onClose]);

  const handlePrint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    import("../tools/export-tool.js").then(({ printCanvas }) => {
      printCanvas(canvas);
    });
  }, [canvasRef]);

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose?.();
    },
    [onClose],
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose?.();
    },
    [onClose],
  );

  const canvas = canvasRef.current;
  const canvasSize = canvas
    ? `${canvas.width} x ${canvas.height} px`
    : "unknown";

  return (
    <div style={STYLE.overlay} onClick={handleOverlayClick}>
      <div style={STYLE.dialog} onClick={(e) => e.stopPropagation()}>
        {/* Title */}
        <div style={STYLE.title}>
          <span>Export CAD Drawing</span>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              color: "#888",
              cursor: "pointer",
              fontSize: "18px",
              padding: "0",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Canvas info */}
        <div style={STYLE.info}>
          <span style={{ color: "#666" }}>Canvas size:</span>
          <span>{canvasSize}</span>
        </div>

        {/* Format */}
        <div style={STYLE.field}>
          <label style={STYLE.label}>Format</label>
          <select
            style={STYLE.select}
            value={format}
            onChange={(e) => setFormat(e.target.value as ExportFormat)}
          >
            {(Object.keys(FORMAT_LABELS) as ExportFormat[]).map((f) => (
              <option key={f} value={f}>
                {FORMAT_LABELS[f]}
              </option>
            ))}
          </select>
        </div>

        {/* PNG: quality */}
        {format === "png" && (
          <div style={STYLE.field}>
            <label style={STYLE.label}>Quality</label>
            <select
              style={STYLE.select}
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value) as PngQuality)}
            >
              {QUALITY_OPTIONS.map((q) => (
                <option key={q} value={q}>
                  {QUALITY_LABELS[q]}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* PDF: page size */}
        {format === "pdf" && (
          <div style={STYLE.field}>
            <label style={STYLE.label}>Page Size</label>
            <select
              style={STYLE.select}
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as PdfPageSize)}
            >
              {(Object.keys(PAGE_SIZE_LABELS) as PdfPageSize[]).map((s) => (
                <option key={s} value={s}>
                  {PAGE_SIZE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Filename */}
        <div style={STYLE.field}>
          <label style={STYLE.label}>Filename</label>
          <input
            type="text"
            style={STYLE.input}
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
          />
          <div style={STYLE.hint}>.{format} extension will be added</div>
        </div>

        {/* Error */}
        {error && <div style={STYLE.error}>{error}</div>}

        {/* Actions */}
        <div style={STYLE.actions}>
          <button
            style={{ ...STYLE.btn, ...STYLE.btnSecondary }}
            onClick={handlePrint}
          >
            Print
          </button>
          <button
            style={{ ...STYLE.btn, ...STYLE.btnSecondary }}
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            style={{ ...STYLE.btn, ...STYLE.btnPrimary }}
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? "Exporting..." : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}