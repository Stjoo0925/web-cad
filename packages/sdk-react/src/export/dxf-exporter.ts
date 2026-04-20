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

/**
 * 포인트 객체 생성 헬퍼
 */
function pointToDxf(point: { x: number; y: number }, elevation?: number): string {
  return ` 10\n${point.x.toFixed(6)}\n 20\n${point.y.toFixed(6)}\n 30\n${(elevation ?? 0).toFixed(6)}\n`;
}

/**
 * LINE 엔티티를 DXF 문자열로 변환
 */
function entityToDxfLINE(entity: Entity): string {
  if (!entity.start || !entity.end) return "";
  return `0\nLINE\n8\n${entity.layer ?? "0"}\n10\n${entity.start.x.toFixed(6)}\n20\n${entity.start.y.toFixed(6)}\n30\n0\n11\n${entity.end.x.toFixed(6)}\n21\n${entity.end.y.toFixed(6)}\n31\n0\n`;
}

/**
 * CIRCLE 엔티티를 DXF 문자열로 변환
 */
function entityToDxfCIRCLE(entity: Entity): string {
  if (!entity.center || entity.radius === undefined) return "";
  return `0\nCIRCLE\n8\n${entity.layer ?? "0"}\n10\n${entity.center.x.toFixed(6)}\n20\n${entity.center.y.toFixed(6)}\n30\n0\n40\n${entity.radius.toFixed(6)}\n`;
}

/**
 * ARC 엔티티를 DXF 문자열로 변환
 */
function entityToDxfARC(entity: Entity): string {
  if (!entity.center || entity.radius === undefined) return "";
  const startAngle = entity.startAngle ?? 0;
  const endAngle = entity.endAngle ?? 360;
  return `0\nARC\n8\n${entity.layer ?? "0"}\n10\n${entity.center.x.toFixed(6)}\n20\n${entity.center.y.toFixed(6)}\n30\n0\n40\n${entity.radius.toFixed(6)}\n50\n${startAngle.toFixed(6)}\n51\n${endAngle.toFixed(6)}\n`;
}

/**
 * POLYLINE/LWPOLYLINE 엔티티를 DXF 문자열로 변환
 */
function entityToDxfPOLYLINE(entity: Entity): string {
  if (!entity.vertices || entity.vertices.length === 0) return "";

  const isClosed = entity.closed ?? false;
  const vertexCount = entity.vertices.length + (isClosed ? 1 : 0);

  let dxf = `0\nPOLYLINE\n8\n${entity.layer ?? "0"}\n66\n1\n70\n${isClosed ? 1 : 0}\n`;

  // Add vertices as SEQEND(sub) entities
  for (let i = 0; i < entity.vertices.length; i++) {
    const v = entity.vertices[i];
    dxf += `0\nVERTEX\n8\n${entity.layer ?? "0"}\n10\n${v.x.toFixed(6)}\n20\n${v.y.toFixed(6)}\n30\n0\n`;
  }

  // Close the polyline if needed
  if (isClosed && entity.vertices.length > 1) {
    const first = entity.vertices[0];
    dxf += `0\nVERTEX\n8\n${entity.layer ?? "0"}\n10\n${first.x.toFixed(6)}\n20\n${first.y.toFixed(6)}\n30\n0\n`;
  }

  dxf += `0\nSEQEND\n8\n${entity.layer ?? "0"}\n`;

  return dxf;
}

/**
 * POINT 엔티티를 DXF 문자열로 변환
 */
function entityToDxfPOINT(entity: Entity): string {
  if (!entity.position) return "";
  return `0\nPOINT\n8\n${entity.layer ?? "0"}\n${pointToDxf(entity.position)}`;
}

/**
 * 엔티티를 DXF 문자열로 변환
 */
function entityToDxf(entity: Entity): string {
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
    default:
      return "";
  }
}

/**
 * DXF 헤더 생성
 */
function generateDxfHeader(): string {
  return `999\nDXF created by Web CAD\n0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n1\n0\nLAYER\n2\n0\n70\n0\n62\n7\n6\nCONTINUOUS\n0\nENDTAB\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n`;
}

/**
 * DXF 푸터 생성
 */
function generateDxfFooter(): string {
  return `0\nENDSEC\n0\nEOF\n`;
}

/**
 * 엔티티 배열을 DXF 문자열로 변환
 */
export function entitiesToDxf(entities: Entity[]): string {
  let dxf = generateDxfHeader();

  for (const entity of entities) {
    dxf += entityToDxf(entity);
  }

  dxf += generateDxfFooter();

  return dxf;
}

/**
 * 엔티티를 DXF 파일로 다운로드
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
