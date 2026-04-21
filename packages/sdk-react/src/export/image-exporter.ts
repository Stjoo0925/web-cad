/**
 * image-exporter.ts
 * Image Export Module (PNG/SVG)
 *
 * Exports CAD drawings to PNG or SVG image format.
 */

export interface Point {
  x: number;
  y: number;
}

export interface ImageExportOptions {
  format: "png" | "svg" | "jpeg";
  quality?: number; // For JPEG (0-1)
  backgroundColor?: string;
  padding?: number;
  scale?: number;
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
  startAngle?: number;
  endAngle?: number;
  closed?: boolean;
  majorAxisEndpoint?: Point;
  majorAxisRatio?: number;
}

/**
 * Export to PNG
 */
export async function exportToPNG(
  canvas: HTMLCanvasElement,
  options: Omit<ImageExportOptions, "format"> = {},
): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      const scale = options.scale ?? 2; // Higher resolution by default
      const padding = options.padding ?? 0;

      // Create scaled canvas
      const scaledCanvas = document.createElement("canvas");
      scaledCanvas.width = (canvas.width + padding * 2) * scale;
      scaledCanvas.height = (canvas.height + padding * 2) * scale;

      const ctx = scaledCanvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }

      // Fill background
      if (options.backgroundColor) {
        ctx.fillStyle = options.backgroundColor;
      } else {
        ctx.fillStyle = "#ffffff";
      }
      ctx.fillRect(0, 0, scaledCanvas.width, scaledCanvas.height);

      // Scale and draw
      ctx.scale(scale, scale);
      ctx.drawImage(canvas, padding, padding);

      scaledCanvas.toBlob((blob) => resolve(blob), "image/png");
    } catch (error) {
      console.error("Failed to export PNG:", error);
      resolve(null);
    }
  });
}

/**
 * Export to SVG
 */
export function exportToSVG(
  entities: EntityForExport[],
  viewport: { pan: Point; zoom: number; width: number; height: number },
  options: Omit<ImageExportOptions, "format"> = {},
): string {
  const scale = options.scale ?? 1;
  const padding = options.padding ?? 10;

  const minX = viewport.pan.x - viewport.width / 2 / viewport.zoom - padding;
  const minY = viewport.pan.y - viewport.height / 2 / viewport.zoom - padding;
  const maxX = viewport.pan.x + viewport.width / 2 / viewport.zoom + padding;
  const maxY = viewport.pan.y + viewport.height / 2 / viewport.zoom + padding;

  const width = maxX - minX;
  const height = maxY - minY;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${width * scale}"
     height="${height * scale}"
     viewBox="${minX} ${minY} ${width} ${height}">
  <defs>
    <pattern id="dashed" patternUnits="userSpaceOnUse" width="10" height="10">
      <line x1="0" y1="5" x2="5" y2="5" stroke="currentColor" stroke-width="1"/>
    </pattern>
  </defs>
  <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="${options.backgroundColor ?? "#ffffff"}"/>
`;

  for (const entity of entities) {
    const color = entity.color ?? "#000000";
    const strokeWidth = (entity.lineweight ?? 0.25) * scale;
    const opacity = 1;

    switch (entity.type.toUpperCase()) {
      case "LINE":
        if (entity.start && entity.end) {
          svg += `  <line x1="${entity.start.x}" y1="${entity.start.y}" x2="${entity.end.x}" y2="${entity.end.y}" stroke="${color}" stroke-width="${strokeWidth}" opacity="${opacity}"/>\n`;
        }
        break;

      case "CIRCLE":
        if (entity.center && entity.radius !== undefined) {
          svg += `  <circle cx="${entity.center.x}" cy="${entity.center.y}" r="${entity.radius}" stroke="${color}" stroke-width="${strokeWidth}" fill="none" opacity="${opacity}"/>\n`;
        }
        break;

      case "ARC":
        if (
          entity.center &&
          entity.radius !== undefined &&
          entity.start &&
          entity.end
        ) {
          const startAngle = entity.startAngle ?? 0;
          const endAngle = entity.endAngle ?? 90;
          const largeArc = endAngle - startAngle > 180 ? 1 : 0;
          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;
          const x1 = entity.center.x + entity.radius * Math.cos(startRad);
          const y1 = entity.center.y + entity.radius * Math.sin(startRad);
          const x2 = entity.center.x + entity.radius * Math.cos(endRad);
          const y2 = entity.center.y + entity.radius * Math.sin(endRad);
          svg += `  <path d="M ${x1} ${y1} A ${entity.radius} ${entity.radius} 0 ${largeArc} 1 ${x2} ${y2}" stroke="${color}" stroke-width="${strokeWidth}" fill="none" opacity="${opacity}"/>\n`;
        }
        break;

      case "POLYLINE":
      case "LWPOLYLINE":
        if (entity.vertices && entity.vertices.length > 0) {
          const points = entity.vertices.map((v) => `${v.x},${v.y}`).join(" ");
          const closed = entity.closed ?? false;
          svg += `  <polyline points="${points}" stroke="${color}" stroke-width="${strokeWidth}" fill="${closed ? color : "none"}" opacity="${opacity}"/>\n`;
        }
        break;

      case "RECTANGLE":
        if (entity.start && entity.end) {
          const x = Math.min(entity.start.x, entity.end.x);
          const y = Math.min(entity.start.y, entity.end.y);
          const w = Math.abs(entity.end.x - entity.start.x);
          const h = Math.abs(entity.end.y - entity.start.y);
          svg += `  <rect x="${x}" y="${y}" width="${w}" height="${h}" stroke="${color}" stroke-width="${strokeWidth}" fill="none" opacity="${opacity}"/>\n`;
        }
        break;

      case "TEXT":
        if (entity.text && entity.start) {
          const fontSize = (entity.height ?? 10) * scale;
          const rotation = entity.rotation ?? 0;
          svg += `  <text x="${entity.start.x}" y="${entity.start.y}" font-size="${fontSize}" fill="${color}" transform="rotate(${rotation} ${entity.start.x} ${entity.start.y})" opacity="${opacity}">${escapeXml(entity.text)}</text>\n`;
        }
        break;

      case "ELLIPSE":
        if (entity.center && entity.majorAxisEndpoint) {
          const rx = entity.majorAxisRatio
            ? Math.hypot(
              entity.majorAxisEndpoint.x - entity.center.x,
              entity.majorAxisEndpoint.y - entity.center.y,
            ) * entity.majorAxisRatio
            : Math.hypot(
              entity.majorAxisEndpoint.x - entity.center.x,
              entity.majorAxisEndpoint.y - entity.center.y,
            );
          const ry = rx * (entity.majorAxisRatio ?? 0.5);
          const rotation = entity.rotation ?? 0;
          svg += `  <ellipse cx="${entity.center.x}" cy="${entity.center.y}" rx="${rx}" ry="${ry}" stroke="${color}" stroke-width="${strokeWidth}" fill="none" transform="rotate(${rotation} ${entity.center.x} ${entity.center.y})" opacity="${opacity}"/>\n`;
        }
        break;
    }
  }

  svg += "</svg>";
  return svg;
}

/**
 * Export to JPEG
 */
export async function exportToJPEG(
  canvas: HTMLCanvasElement,
  options: Omit<ImageExportOptions, "format"> = {},
): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      const scale = options.scale ?? 1;
      const padding = options.padding ?? 0;
      const quality = options.quality ?? 0.9;

      const scaledCanvas = document.createElement("canvas");
      scaledCanvas.width = (canvas.width + padding * 2) * scale;
      scaledCanvas.height = (canvas.height + padding * 2) * scale;

      const ctx = scaledCanvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.fillStyle = options.backgroundColor ?? "#ffffff";
      ctx.fillRect(0, 0, scaledCanvas.width, scaledCanvas.height);

      ctx.scale(scale, scale);
      ctx.drawImage(canvas, padding, padding);

      scaledCanvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
    } catch (error) {
      console.error("Failed to export JPEG:", error);
      resolve(null);
    }
  });
}

/**
 * Download image
 */
export async function downloadImage(
  blob: Blob,
  filename: string,
): Promise<boolean> {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("Failed to download image:", error);
    return false;
  }
}

/**
 * Escape XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
