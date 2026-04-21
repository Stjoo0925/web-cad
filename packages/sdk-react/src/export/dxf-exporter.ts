/**
 * dxf-exporter.ts
 * DXF 포맷으로 엔티티를 내보내는 모듈
 *
 * AutoCAD DXF (Drawing Exchange Format) ASCII 버전을 지원합니다.
 */

import type { Entity } from "../canvas/cad-canvas-renderer.js";

export interface DxfExportOptions {
  filename?: string;
}

// Number formatter for DXF output
function formatNumber(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : Number(value).toFixed(6).replace(/0+$/u, "").replace(/\.$/u, "");
}

/**
 * Entity to DXF string conversion
 */
function entityToDxf(entity: Entity): string {
  return entityToDxfByType(entity);
}

/**
 * LINE entity to DXF string
 */
function entityToDxfLINE(entity: Entity): string {
  if (!entity.start || !entity.end) return "";
  return `0\nLINE\n8\n${entity.layer ?? "0"}\n10\n${formatNumber(entity.start.x)}\n20\n${formatNumber(entity.start.y)}\n30\n0\n11\n${formatNumber(entity.end.x)}\n21\n${formatNumber(entity.end.y)}\n31\n0\n`;
}

/**
 * CIRCLE entity to DXF string
 */
function entityToDxfCIRCLE(entity: Entity): string {
  if (!entity.center || entity.radius === undefined) return "";
  return `0\nCIRCLE\n8\n${entity.layer ?? "0"}\n10\n${formatNumber(entity.center.x)}\n20\n${formatNumber(entity.center.y)}\n30\n0\n40\n${formatNumber(entity.radius)}\n`;
}

/**
 * ARC entity to DXF string
 */
function entityToDxfARC(entity: Entity): string {
  if (!entity.center || entity.radius === undefined) return "";
  const startAngle = entity.startAngle ?? 0;
  const endAngle = entity.endAngle ?? 360;
  return `0\nARC\n8\n${entity.layer ?? "0"}\n10\n${formatNumber(entity.center.x)}\n20\n${formatNumber(entity.center.y)}\n30\n0\n40\n${formatNumber(entity.radius)}\n50\n${formatNumber(startAngle)}\n51\n${formatNumber(endAngle)}\n`;
}

/**
 * POLYLINE/LWPOLYLINE entity to DXF string
 */
function entityToDxfPOLYLINE(entity: Entity): string {
  if (!entity.vertices || entity.vertices.length === 0) return "";

  const isClosed = entity.closed ?? false;
  const vertexCount = entity.vertices.length + (isClosed ? 1 : 0);

  let dxf = `0\nPOLYLINE\n8\n${entity.layer ?? "0"}\n66\n1\n70\n${isClosed ? 1 : 0}\n`;

  // Add vertices as SEQEND(sub) entities
  for (let i = 0; i < entity.vertices.length; i++) {
    const v = entity.vertices[i];
    dxf += `0\nVERTEX\n8\n${entity.layer ?? "0"}\n10\n${formatNumber(v.x)}\n20\n${formatNumber(v.y)}\n30\n0\n`;
  }

  // Close the polyline if needed
  if (isClosed && entity.vertices.length > 1) {
    const first = entity.vertices[0];
    dxf += `0\nVERTEX\n8\n${entity.layer ?? "0"}\n10\n${formatNumber(first.x)}\n20\n${formatNumber(first.y)}\n30\n0\n`;
  }

  dxf += `0\nSEQEND\n8\n${entity.layer ?? "0"}\n`;

  return dxf;
}

/**
 * POINT entity to DXF string
 */
function entityToDxfPOINT(entity: Entity): string {
  if (!entity.position) return "";
  return `0\nPOINT\n8\n${entity.layer ?? "0"}\n10\n${formatNumber(entity.position.x)}\n20\n${formatNumber(entity.position.y)}\n30\n${formatNumber(entity.position.z ?? 0)}\n`;
}

/**
 * TEXT entity to DXF string
 */
function entityToDxfTEXT(entity: Entity): string {
  if (!entity.position || entity.height === undefined) return "";
  return `0\nTEXT\n8\n${entity.layer ?? "0"}\n10\n${formatNumber(entity.position.x)}\n20\n${formatNumber(entity.position.y)}\n30\n${formatNumber(entity.position.z ?? 0)}\n40\n${formatNumber(entity.height)}\n1\n${entity.value ?? ""}\n`;
}

/**
 * MTEXT entity to DXF string
 */
function entityToDxfMTEXT(entity: Entity): string {
  if (!entity.position || entity.height === undefined) return "";
  let dxf = `0\nMTEXT\n8\n${entity.layer ?? "0"}\n10\n${formatNumber(entity.position.x)}\n20\n${formatNumber(entity.position.y)}\n30\n${formatNumber(entity.position.z ?? 0)}\n40\n${formatNumber(entity.height)}\n`;
  if (entity.width !== undefined) {
    dxf += `41\n${formatNumber(entity.width)}\n`;
  }
  if (entity.rotation !== undefined) {
    dxf += `50\n${formatNumber(entity.rotation)}\n`;
  }
  // Multi-line text: split into 250-char chunks (group code 3), remainder (group code 1)
  const text = entity.value ?? "";
  const MAX_CHUNK = 250;
  for (let i = 0; i < text.length; i += MAX_CHUNK) {
    const chunk = text.slice(i, i + MAX_CHUNK);
    if (i + MAX_CHUNK < text.length) {
      dxf += `3\n${chunk}\n`;
    } else {
      dxf += `1\n${chunk}\n`;
    }
  }
  return dxf;
}

/**
 * ELLIPSE entity to DXF string
 */
function entityToDxfELLIPSE(entity: Entity): string {
  if (
    !entity.center ||
    !entity.majorAxisEndpoint ||
    entity.radius === undefined
  )
    return "";
  let dxf = `0\nELLIPSE\n8\n${entity.layer ?? "0"}\n10\n${formatNumber(entity.center.x)}\n20\n${formatNumber(entity.center.y)}\n30\n0\n`;
  dxf += `11\n${formatNumber(entity.majorAxisEndpoint.x)}\n21\n${formatNumber(entity.majorAxisEndpoint.y)}\n31\n0\n`;
  dxf += `40\n${formatNumber(entity.radius)}\n`;
  if (entity.minorAxisRatio !== undefined) {
    dxf += `41\n${formatNumber(entity.minorAxisRatio)}\n`;
  }
  if (entity.startAngle !== undefined) {
    dxf += `42\n${formatNumber(entity.startAngle)}\n`;
  }
  if (entity.endAngle !== undefined) {
    dxf += `43\n${formatNumber(entity.endAngle)}\n`;
  }
  return dxf;
}

/**
 * SPLINE entity to DXF string
 */
function entityToDxfSPLINE(entity: Entity): string {
  if (!entity.controlVertices || entity.controlVertices.length === 0) return "";
  const degree = entity.degree ?? 3;
  const knotCount =
    entity.knots?.length ?? entity.controlVertices.length + degree + 1;

  let dxf = `0\nSPLINE\n8\n${entity.layer ?? "0"}\n70\n0\n71\n${degree}\n72\n${knotCount}\n73\n${entity.controlVertices.length}\n`;

  // Add control points
  for (const v of entity.controlVertices) {
    dxf += `10\n${formatNumber(v.x)}\n20\n${formatNumber(v.y)}\n30\n${formatNumber(v.z ?? 0)}\n`;
  }

  // Add knots
  if (entity.knots) {
    for (const k of entity.knots) {
      dxf += `40\n${formatNumber(k)}\n`;
    }
  }

  return dxf;
}

/**
 * HATCH entity to DXF string
 */
function entityToDxfHATCH(entity: Entity): string {
  let dxf = `0\nHATCH\n8\n${entity.layer ?? "0"}\n`;
  if (entity.hatchPattern) {
    dxf += `2\n${entity.hatchPattern}\n`;
  }
  dxf += `70\n0\n`;
  if (entity.hatchScale !== undefined) {
    dxf += `41\n${formatNumber(entity.hatchScale)}\n`;
  }
  if (entity.hatchRotation !== undefined) {
    dxf += `50\n${formatNumber(entity.hatchRotation)}\n`;
  }
  dxf += `71\n1\n`;
  // Add boundary vertices
  if (entity.boundaryVertices) {
    for (const boundary of entity.boundaryVertices) {
      dxf += `91\n${boundary.length}\n`;
      for (const v of boundary) {
        dxf += `10\n${formatNumber(v.x)}\n20\n${formatNumber(v.y)}\n`;
      }
    }
  }
  return dxf;
}

/**
 * BLOCK entity to DXF string
 */
function entityToDxfBLOCK(entity: Entity): string {
  if (!entity.blockName) return "";
  let dxf = `0\nBLOCK\n8\n${entity.layer ?? "0"}\n2\n${entity.blockName}\n`;
  if (entity.blockPosition) {
    dxf += `10\n${formatNumber(entity.blockPosition.x)}\n20\n${formatNumber(entity.blockPosition.y)}\n30\n${formatNumber(entity.blockPosition.z ?? 0)}\n`;
  }
  dxf += `70\n0\n`;
  return dxf;
}

/**
 * INSERT entity to DXF string
 */
function entityToDxfINSERT(entity: Entity): string {
  if (!entity.blockName) return "";
  let dxf = `0\nINSERT\n8\n${entity.layer ?? "0"}\n2\n${entity.blockName}\n`;
  if (entity.blockPosition) {
    dxf += `10\n${formatNumber(entity.blockPosition.x)}\n20\n${formatNumber(entity.blockPosition.y)}\n30\n${formatNumber(entity.blockPosition.z ?? 0)}\n`;
  }
  if (entity.blockRotation !== undefined) {
    dxf += `50\n${formatNumber(entity.blockRotation)}\n`;
  }
  if (entity.blockScale) {
    dxf += `44\n${formatNumber(entity.blockScale.x)}\n45\n${formatNumber(entity.blockScale.y)}\n`;
  }
  return dxf;
}

/**
 * Generic entity to DXF string
 */
function genericEntityToDxf(entity: Entity): string {
  return ""; // Unknown entity types are skipped
}

/**
 * DXF header generation
 */
function generateDxfHeader(): string {
  return `999\nDXF created by Web CAD\n0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n1\n0\nLAYER\n2\n0\n70\n0\n62\n7\n6\nCONTINUOUS\n0\nENDTAB\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n`;
}

/**
 * DXF footer generation
 */
function generateDxfFooter(): string {
  return `0\nENDSEC\n0\nEOF\n`;
}

/**
 * Entity to DXF string based on type
 */
function entityToDxfByType(entity: Entity): string {
  switch (entity.type) {
    case "LINE":
      return entityToDxfLINE(entity);
    case "CIRCLE":
      return entityToDxfCIRCLE(entity);
    case "ARC":
      return entityToDxfARC(entity);
    case "POLYLINE":
    case "LWPOLYLINE":
      return entityToDxfPOLYLINE(entity);
    case "POINT":
      return entityToDxfPOINT(entity);
    case "TEXT":
      return entityToDxfTEXT(entity);
    case "MTEXT":
      return entityToDxfMTEXT(entity);
    case "ELLIPSE":
      return entityToDxfELLIPSE(entity);
    case "SPLINE":
      return entityToDxfSPLINE(entity);
    case "HATCH":
      return entityToDxfHATCH(entity);
    case "BLOCK":
      return entityToDxfBLOCK(entity);
    case "INSERT":
      return entityToDxfINSERT(entity);
    default:
      // Use registry for other entity types
      return genericEntityToDxf(entity);
  }
}

/**
 * Entities array to DXF string
 */
export function entitiesToDxf(entities: Entity[]): string {
  let dxf = generateDxfHeader();

  for (const entity of entities) {
    dxf += entityToDxfByType(entity);
  }

  dxf += generateDxfFooter();

  return dxf;
}

/**
 * Entity to DXF file download
 */
export function exportToDxf(
  entities: Entity[],
  options: DxfExportOptions = {},
): { success: boolean; error?: string } {
  try {
    const dxfContent = entitiesToDxf(entities);
    const blob = new Blob([dxfContent], { type: "application/dxf" });
    const url = URL.createObjectURL(blob);

    const link = window.document.createElement("a");
    link.href = url;
    link.download = options.filename ?? "cad-export.dxf";
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);

    URL.revokeObjectURL(url);

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
