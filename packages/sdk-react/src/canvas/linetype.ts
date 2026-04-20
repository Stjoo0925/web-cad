/**
 * linetype.ts
 * Linetype 및 Lineweight 렌더링 유틸리티
 *
 * 지원 선 종류:
 * - CONTINUOUS: 실선
 * - DASHED: 파선 (__ __)
 * - DASHDOT: 파점선 (__ . __)
 * - DOT: 점선 (. . .)
 * - CENTER: 중심선 (_ . _ .)
 * - BORDER: 테두리선 (__ __ __)
 */

import type { Linetype } from "./cad-canvas-renderer.js";

/**
 * 선 종류별 대시 패턴 (선 길이, 공백 길이) - 픽셀 단위
 */
export const LINETYPE_PATTERNS: Record<Linetype, number[]> = {
  CONTINUOUS: [], // 실선 - 빈 배열 = 선 없음
  DASHED: [12, 6], // 파선
  DASHDOT: [12, 4, 2, 4], // 파점선
  DOT: [2, 4], // 점선
  CENTER: [16, 4, 2, 4], // 중심선
  BORDER: [12, 4, 2, 4], // 테두리선
};

/**
 * 선 종류 이름 (표시용)
 */
export const LINETYPE_NAMES: Record<Linetype, string> = {
  CONTINUOUS: "실선",
  DASHED: "파선",
  DASHDOT: "파점선",
  DOT: "점선",
  CENTER: "중심선",
  BORDER: "테두리",
};

/**
 * 선 종류별 기본 dash 패턴을 Canvas context에 설정
 * @param ctx CanvasRenderingContext2D
 * @param linetype 선 종류
 * @param lineWidth 선 두께 (zoom 적용된 픽셀 단위)
 */
export function setLinetype(
  ctx: CanvasRenderingContext2D,
  linetype: Linetype | undefined,
  lineWidth: number,
): void {
  if (!linetype || linetype === "CONTINUOUS") {
    ctx.setLineDash([]);
    return;
  }

  const pattern = LINETYPE_PATTERNS[linetype];
  if (!pattern) {
    ctx.setLineDash([]);
    return;
  }

  // 선 두께에 따라 패턴 스케일 조정
  const scale = Math.max(1, lineWidth / 1);
  ctx.setLineDash(pattern.map((v) => v * scale));
}

/**
 * Lineweight (선 두께) 목록 - mm 단위
 */
export const LINEWEIGHTS = [
  { value: 0.13, name: "0.13mm" },
  { value: 0.18, name: "0.18mm" },
  { value: 0.25, name: "0.25mm" },
  { value: 0.35, name: "0.35mm" },
  { value: 0.50, name: "0.50mm" },
  { value: 0.70, name: "0.70mm" },
  { value: 1.00, name: "1.00mm" },
  { value: 1.40, name: "1.40mm" },
  { value: 2.00, name: "2.00mm" },
];

/**
 * mm 단위의 lineWidth를 캔버스 픽셀로 변환
 * @param mm/mm 단위
 * @param dpi DPI (기본값 96)
 * @returns 픽셀 단위
 */
export function mmToPixels(mm: number, dpi = 96): number {
  // 1 inch = 25.4mm
  const inches = mm / 25.4;
  return inches * dpi;
}

/**
 * 픽셀을 mm로 변환
 */
export function pixelsToMm(pixels: number, dpi = 96): number {
  const inches = pixels / dpi;
  return inches * 25.4;
}

/**
 * Entity의 lineWidth를 픽셀로 변환
 * BYLAYER의 경우 레이어 기본값 사용
 */
export function getLineWidthInPixels(
  lineWidth: number | undefined,
  layerLineWidth: number = 0.25,
  dpi = 96,
): number {
  if (!lineWidth || lineWidth <= 0) {
    return mmToPixels(layerLineWidth, dpi);
  }
  return mmToPixels(lineWidth, dpi);
}

/**
 * 선 종류 미리보기 SVG 생성
 */
export function getLinetypePreviewSvg(linetype: Linetype): string {
  const pattern = LINETYPE_PATTERNS[linetype];
  if (!pattern || pattern.length === 0) {
    // CONTINUOUS - solid line
    return `<line x1="0" y1="8" x2="48" y2="8" stroke="currentColor" strokeWidth="2"/>`;
  }

  let pathD = "";
  let x = 0;
  for (let i = 0; i < pattern.length; i++) {
    const len = pattern[i];
    if (i % 2 === 0) {
      // 선分
      pathD += `M${x},8 L${x + len},8 `;
    }
    x += len;
  }

  return `<path d="${pathD.trim()}" stroke="currentColor" strokeWidth="2" fill="none"/>`;
}
