/**
 * 뷰포트 좌표 변환을 위한 순수 수학 함수들입니다.
 * DOM 인프라 없이 테스트할 수 있습니다.
 */

import type { Point, Viewport } from "./cad-canvas-renderer.js";

/**
 * 화면 공간의 점을 월드 공간 좌표로 변환합니다.
 *
 * @param screenPoint - 화면(픽셀) 좌표의 점
 * @param viewport    - 현재 뷰포트 상태 (너비, 높이, 팬, 줌)
 * @returns 월드 공간 좌표의 점
 */
export function screenToWorld(screenPoint: Point, viewport: Viewport): Point {
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  return {
    x: (screenPoint.x - cx) / viewport.zoom + viewport.pan.x,
    y: (screenPoint.y - cy) / viewport.zoom + viewport.pan.y,
  };
}

/**
 * HTML 요소의 현재 경계 사각형을 읽습니다.
 * 이벤트 핸들러 내부에서 호출해야 합니다 — 절대 캐싱하지 마세요 —
 * 레이아웃 변경(예: 전체 화면 전환)으로 인해 캐시된 값이 무효화되기 때문입니다.
 *
 * @param element - 경계를 읽을 요소
 * @returns x, y, 너비, 높이를 포함하는 뷰포트 유사 객체
 */
export function getViewportFromElement(element: HTMLElement): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.top,
    width: rect.width,
    height: rect.height,
  };
}
