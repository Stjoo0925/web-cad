/**
 * pdf-exporter.ts
 * PDF Export Module
 *
 * Exports CAD drawings to PDF format using jsPDF.
 */

import type { Point } from "../tools/line-tool.ts";

export interface PDFExportOptions {
  paperSize?: "A4" | "A3" | "A2" | "A1" | "LETTER" | "LEGAL";
  orientation?: "portrait" | "landscape";
  scale?: number;
  includeGrid?: boolean;
  includeLayers?: boolean;
  title?: string;
  author?: string;
}

export interface EntityForExport {
  type: string;
  start?: Point;
  end?: Point;
  center?: Point;
  radius?: number;
  vertices?: Point[];
  color?: string;
  linetype?: string;
  lineweight?: number;
  text?: string;
  height?: number;
  rotation?: number;
}

/**
 * Creates a PDF exporter instance.
 */
export function createPDFExporter() {
  let isInitialized = false;
  let pdfDoc: unknown = null;

  /**
   * Initialize PDF document
   */
  async function initialize(options: PDFExportOptions = {}): Promise<boolean> {
    try {
      // Dynamic import of jsPDF
      const jsPDFModule = await import("jspdf");
      const jsPDF = jsPDFModule.default;

      const paperSizes: Record<string, [number, number]> = {
        A4: [210, 297],
        A3: [297, 420],
        A2: [420, 594],
        A1: [594, 841],
        LETTER: [215.9, 279.4],
        LEGAL: [215.9, 355.6],
      };

      const [width, height] = paperSizes[options.paperSize ?? "A4"];
      const orientation = options.orientation ?? "landscape";

      pdfDoc = new jsPDF({
        orientation,
        unit: "mm",
        format: options.paperSize ?? "A4",
      });

      // Set document properties
      if (options.title) {
        const doc = pdfDoc as { setProperties: (props: { title: string; author: string }) => void };
        doc.setProperties({
          title: options.title,
          author: options.author ?? "Web CAD",
        });
      }

      isInitialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize PDF export:", error);
      return false;
    }
  }

  /**
   * Export entities to PDF
   */
  function exportEntities(
    entities: EntityForExport[],
    viewport: { pan: Point; zoom: number; width: number; height: number },
    options: PDFExportOptions = {},
  ): boolean {
    if (!isInitialized || !pdfDoc) {
      console.error("PDF document not initialized");
      return false;
    }

    const scale = options.scale ?? 1;
    const doc = pdfDoc as {
      setDrawColor: (r: number, g?: number, b?: number) => void;
      setLineWidth: (width: number) => void;
      line: (x1: number, y1: number, x2: number, y2: number) => void;
      circle: (x: number, y: number, r: number, style?: string) => void;
      setFont: (family: string, style?: string) => void;
      setFontSize: (size: number) => void;
      text: (text: string, x: number, y: number) => void;
      addPage: () => void;
    };

    for (const entity of entities) {
      const color = entity.color ?? "#000000";
      const rgb = hexToRgb(color);

      doc.setDrawColor(rgb.r, rgb.g, rgb.b);
      doc.setLineWidth((entity.lineweight ?? 0.25) * scale);

      switch (entity.type.toUpperCase()) {
        case "LINE":
          if (entity.start && entity.end) {
            const p1 = worldToPage(entity.start, viewport, scale);
            const p2 = worldToPage(entity.end, viewport, scale);
            doc.line(p1.x, p1.y, p2.x, p2.y);
          }
          break;

        case "CIRCLE":
          if (entity.center && entity.radius !== undefined) {
            const center = worldToPage(entity.center, viewport, scale);
            doc.circle(center.x, center.y, entity.radius * scale);
          }
          break;

        case "TEXT":
          if (entity.text && entity.start) {
            const pos = worldToPage(entity.start, viewport, scale);
            doc.setFont("helvetica", "normal");
            doc.setFontSize((entity.height ?? 10) * scale);
            doc.text(entity.text, pos.x, pos.y);
          }
          break;
      }
    }

    return true;
  }

  /**
   * Save PDF to blob
   */
  async function save(filename: string = "drawing.pdf"): Promise<Blob | null> {
    if (!isInitialized || !pdfDoc) {
      return null;
    }

    try {
      const doc = pdfDoc as { output: (type: string) => Blob };
      return doc.output("blob");
    } catch (error) {
      console.error("Failed to save PDF:", error);
      return null;
    }
  }

  /**
   * Download PDF
   */
  async function download(filename: string = "drawing.pdf"): Promise<boolean> {
    const blob = await save(filename);
    if (!blob) return false;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  }

  /**
   * Add new page
   */
  function addPage(): void {
    if (pdfDoc) {
      const doc = pdfDoc as { addPage: () => void };
      doc.addPage();
    }
  }

  return {
    initialize,
    exportEntities,
    save,
    download,
    addPage,
  };
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    };
  }
  return { r: 0, g: 0, b: 0 };
}

/**
 * Convert world coordinates to page coordinates
 */
function worldToPage(
  point: Point,
  viewport: { pan: Point; zoom: number; width: number; height: number },
  scale: number,
): { x: number; y: number } {
  return {
    x: (point.x - viewport.pan.x) * viewport.zoom * scale + viewport.width / 2,
    y: (point.y - viewport.pan.y) * viewport.zoom * scale + viewport.height / 2,
  };
}
