/**
 * Export Tool - PNG/PDF export utilities for CAD canvas
 * @module tools/export-tool
 */

import type { Entity, Viewport } from "../canvas/cad-canvas-renderer.js";

// ============================================================================
// Types
// ============================================================================

export type ExportFormat = "png" | "pdf";

export type PngQuality = 0.8 | 0.95 | 1.0;

export type PdfPageSize = "a4" | "letter" | "legal";

export interface ExportOptions {
  format: ExportFormat;
  /** PNG quality (0.8 = compressed, 1.0 = lossless) */
  quality?: PngQuality;
  /** PDF page size */
  pageSize?: PdfPageSize;
  /** Export selection only vs full canvas */
  selectionOnly?: boolean;
  /** Filename without extension */
  filename?: string;
}

export interface ExportResult {
  success: boolean;
  blob?: Blob;
  dataUrl?: string;
  filename?: string;
  error?: string;
}

// ============================================================================
// Utility: downloadFile
// ============================================================================

/**
 * Trigger browser download from a data URL or Blob
 */
export function downloadFile(
  dataUrlOrBlob: string | Blob,
  filename: string,
): void {
  const url =
    typeof dataUrlOrBlob === "string"
      ? dataUrlOrBlob
      : URL.createObjectURL(dataUrlOrBlob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoke only for blob URLs (data URLs are inline and tiny)
  if (typeof dataUrlOrBlob !== "string") {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

// ============================================================================
// PNG Export
// ============================================================================

/**
 * Export canvas as PNG and trigger download
 */
export async function exportPng(
  canvas: HTMLCanvasElement,
  options: {
    quality?: PngQuality;
    filename?: string;
  } = {},
): Promise<ExportResult> {
  try {
    const quality = options.quality ?? 1.0;
    const filename = options.filename ?? "cad-export.png";

    // Force highest resolution export
    const dataUrl = canvas.toDataURL("image/png", quality);

    downloadFile(dataUrl, filename);

    return { success: true, dataUrl, filename };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { success: false, error };
  }
}

/**
 * Export canvas as a Blob (useful for PDF generation)
 */
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality?: PngQuality,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      "image/png",
      quality,
    );
  });
}

// ============================================================================
// PDF Export (jsPDF)
// ============================================================================

/**
 * Export canvas as PDF using jsPDF
 * Requires jspdf package: npm install jspdf
 */
export async function exportPdf(
  canvas: HTMLCanvasElement,
  options: {
    pageSize?: PdfPageSize;
    filename?: string;
  } = {},
): Promise<ExportResult> {
  try {
    // Dynamic import jsPDF to avoid bloating the bundle if not used
    const { jsPDF } = await import("jspdf");

    const pageSize = options.pageSize ?? "a4";
    const filename = options.filename ?? "cad-export.pdf";

    // Page dimensions in mm
    const pageSizes: Record<PdfPageSize, { width: number; height: number }> = {
      a4: { width: 210, height: 297 },
      letter: { width: 215.9, height: 279.4 },
      legal: { width: 215.9, height: 355.6 },
    };

    const page = pageSizes[pageSize];
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate scale to fit canvas into page (with margins)
    const margin = 10; // mm
    const availableWidth = page.width - margin * 2;
    const availableHeight = page.height - margin * 2;

    const scaleX = availableWidth / (canvasWidth / 96); // 96 DPI assumption
    const scaleY = availableHeight / (canvasHeight / 96);
    const scale = Math.min(scaleX, scaleY, 1); // cap at 1x

    const imgWidth = (canvasWidth / 96) * scale;
    const imgHeight = (canvasHeight / 96) * scale;

    // Center on page
    const offsetX = margin + (availableWidth - imgWidth) / 2;
    const offsetY = margin + (availableHeight - imgHeight) / 2;

    // Create PDF
    const pdf = new jsPDF({
      orientation: imgWidth > imgHeight ? "landscape" : "portrait",
      unit: "mm",
      format: pageSize === "legal" ? "letter" : pageSize, // jsPDF supports a4, letter
    });

    const dataUrl = canvas.toDataURL("image/png", 0.95);
    pdf.addImage(dataUrl, "PNG", offsetX, offsetY, imgWidth, imgHeight);
    pdf.save(filename);

    return { success: true, filename };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { success: false, error };
  }
}

// ============================================================================
// Print
// ============================================================================

/**
 * Open browser print dialog with canvas content
 */
export function printCanvas(canvas: HTMLCanvasElement): void {
  const dataUrl = canvas.toDataURL("image/png");

  // Create a print-friendly window
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>CAD Print</title>
        <style>
          @page { margin: 10mm; }
          body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
          img { max-width: 100%; max-height: 100vh; }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" />
        <script>window.onload = () => { window.print(); window.close(); }</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// ============================================================================
// Main export function
// ============================================================================

/**
 * Unified export function
 */
export async function exportCanvas(
  canvas: HTMLCanvasElement,
  options: ExportOptions,
): Promise<ExportResult> {
  const filename = options.filename ?? `cad-export.${options.format}`;

  switch (options.format) {
    case "png":
      return exportPng(canvas, { quality: options.quality, filename });
    case "pdf":
      return exportPdf(canvas, { pageSize: options.pageSize, filename });
    default:
      return { success: false, error: `Unsupported format: ${options.format}` };
  }
}