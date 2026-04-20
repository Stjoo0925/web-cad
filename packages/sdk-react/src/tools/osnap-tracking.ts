/**
 * osnap-tracking.ts
 * Object Snap Tracking (OTRK) System
 *
 * 기능:
 * - OSNAP 점 통과 시 점선 가이드 표시
 * - 경유점 누적 추적 (예: 첫점 → 중점 → 끝점 연결)
 * - 3D 공간에서 X, Y, Z 개별 추적
 */

import type { Point } from "../canvas/cad-canvas-renderer";

export interface TrackingPoint {
  point: Point;
  type: string;
  label: string;
}

export interface OsnapTrackingOptions {
  /** 활성화 여부 */
  enabled?: boolean;
  /** 최대 추적 점 수 */
  maxTrackingPoints?: number;
  /** 추적 가이드 색상 */
  guideColor?: string;
}

export interface OsnapTrackingState {
  enabled: boolean;
  maxTrackingPoints: number;
  guideColor: string;
}

/**
 * OSNAP Tracking Handler 생성
 */
export function createOsnapTrackingHandler(
  options: OsnapTrackingOptions = {},
) {
  let state: OsnapTrackingState = {
    enabled: options.enabled ?? false,
    maxTrackingPoints: options.maxTrackingPoints ?? 5,
    guideColor: options.guideColor ?? "#00ff0080",
  };

  /** 누적된 추적 점들 */
  let trackingPoints: TrackingPoint[] = [];

  /** 마지막으로 스냅된 점 */
  let lastSnapPoint: Point | null = null;

  /**
   * 추적 점 추가
   */
  function addTrackingPoint(point: Point, type: string, label: string) {
    // Don't add duplicate points
    if (
      trackingPoints.length > 0 &&
      trackingPoints[trackingPoints.length - 1].point.x === point.x &&
      trackingPoints[trackingPoints.length - 1].point.y === point.y
    ) {
      return;
    }

    // Limit tracking points
    if (trackingPoints.length >= state.maxTrackingPoints) {
      trackingPoints.shift();
    }

    trackingPoints.push({ point, type, label });
    lastSnapPoint = { ...point };
  }

  /**
   * 추적 점 초기화 (새 명령 시작 시)
   */
  function clearTrackingPoints() {
    trackingPoints = [];
    lastSnapPoint = null;
  }

  /**
   * 마지막 스냅 점 설정
   */
  function setLastSnapPoint(point: Point | null) {
    lastSnapPoint = point ? { ...point } : null;
  }

  /**
   * 현재 마우스 위치에 대한 추적 가이드 계산
   */
  function calculateTrackingGuides(
    currentPoint: Point,
    viewport: { width: number; height: number; pan: Point; zoom: number },
  ): TrackingGuide[] {
    if (!state.enabled || trackingPoints.length === 0) {
      return [];
    }

    const guides: TrackingGuide[] = [];

    // Draw guide from each tracking point to current mouse position
    for (const tp of trackingPoints) {
      // Horizontal guide (from tracking point to current X)
      guides.push({
        start: tp.point,
        end: { x: currentPoint.x, y: tp.point.y },
        label: `${currentPoint.x.toFixed(2)}`,
        isHorizontal: true,
      });

      // Vertical guide (from tracking point to current Y)
      guides.push({
        start: tp.point,
        end: { x: tp.point.x, y: currentPoint.y },
        label: `${currentPoint.y.toFixed(2)}`,
        isHorizontal: false,
      });
    }

    // Draw crosshair guides at last snap point
    if (lastSnapPoint) {
      guides.push({
        start: { x: lastSnapPoint.x, y: lastSnapPoint.y },
        end: { x: currentPoint.x, y: lastSnapPoint.y },
        label: "",
        isHorizontal: true,
        isCrosshair: true,
      });
      guides.push({
        start: { x: lastSnapPoint.x, y: lastSnapPoint.y },
        end: { x: lastSnapPoint.x, y: currentPoint.y },
        label: "",
        isHorizontal: false,
        isCrosshair: true,
      });
    }

    return guides;
  }

  /**
   * 경유점 누적 추적 (Polar Tracking과 함께 사용)
   * AutoCAD 스타일: 첫점 → 중점 → 끝점 연속 추적
   */
  function calculatePathTracking(
    currentPoint: Point,
    snapPoints: Point[],
  ): PathGuide[] {
    if (!state.enabled || trackingPoints.length === 0) {
      return [];
    }

    const paths: PathGuide[] = [];

    // Build path through all tracking points to current position
    let prevPoint: Point | null = null;

    for (const tp of trackingPoints) {
      if (prevPoint) {
        // Draw path segment between tracking points
        paths.push({
          start: prevPoint,
          end: tp.point,
          type: "path",
        });
      }
      prevPoint = tp.point;
    }

    // Connect last tracking point to current mouse position
    if (prevPoint) {
      paths.push({
        start: prevPoint,
        end: currentPoint,
        type: "active",
      });
    }

    // Also connect to nearby snap points
    for (const sp of snapPoints) {
      const dist = Math.hypot(sp.x - currentPoint.x, sp.y - currentPoint.y);
      if (dist < 20) {
        // If current point is near a snap point, show connection
        if (prevPoint) {
          paths.push({
            start: prevPoint,
            end: sp,
            type: "snap-connect",
          });
        }
      }
    }

    return paths;
  }

  /**
   * 설정 업데이트
   */
  function setEnabled(enabled: boolean) {
    state.enabled = enabled;
  }

  function toggle() {
    state.enabled = !state.enabled;
  }

  function setMaxTrackingPoints(max: number) {
    state.maxTrackingPoints = max;
    // Trim if necessary
    while (trackingPoints.length > state.maxTrackingPoints) {
      trackingPoints.shift();
    }
  }

  function setGuideColor(color: string) {
    state.guideColor = color;
  }

  function getState(): OsnapTrackingState {
    return { ...state };
  }

  function isEnabled(): boolean {
    return state.enabled;
  }

  function getTrackingPoints(): TrackingPoint[] {
    return [...trackingPoints];
  }

  function getLastSnapPoint(): Point | null {
    return lastSnapPoint ? { ...lastSnapPoint } : null;
  }

  return {
    addTrackingPoint,
    clearTrackingPoints,
    setLastSnapPoint,
    calculateTrackingGuides,
    calculatePathTracking,
    setEnabled,
    toggle,
    setMaxTrackingPoints,
    setGuideColor,
    getState,
    isEnabled,
    getTrackingPoints,
    getLastSnapPoint,
  };
}

export interface TrackingGuide {
  start: Point;
  end: Point;
  label: string;
  isHorizontal: boolean;
  isCrosshair?: boolean;
}

export interface PathGuide {
  start: Point;
  end: Point;
  type: "path" | "active" | "snap-connect";
}

export type OsnapTrackingHandler = ReturnType<typeof createOsnapTrackingHandler>;

/**
 * OSNAP Tracking 가이드 렌더링 유틸리티
 */
export function renderOsnapTrackingGuides(
  ctx: CanvasRenderingContext2D,
  guides: TrackingGuide[],
  pathGuides: PathGuide[],
  viewport: { pan: Point; zoom: number; width: number; height: number },
) {
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;

  // Helper to convert world to screen
  const toScreen = (p: Point) => ({
    x: (p.x - viewport.pan.x) * viewport.zoom + cx,
    y: (p.y - viewport.pan.y) * viewport.zoom + cy,
  });

  // Render tracking guides
  for (const guide of guides) {
    const startScreen = toScreen(guide.start);
    const endScreen = toScreen(guide.end);

    ctx.strokeStyle = guide.isCrosshair ? "#00ff0060" : "#00ff0040";
    ctx.lineWidth = guide.isCrosshair ? 1.5 : 1;
    ctx.setLineDash(guide.isCrosshair ? [] : [5, 5]);

    ctx.beginPath();
    ctx.moveTo(startScreen.x, startScreen.y);
    ctx.lineTo(endScreen.x, endScreen.y);
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw labels for horizontal/vertical distance
    if (guide.label) {
      const midX = (startScreen.x + endScreen.x) / 2;
      const midY = (startScreen.y + endScreen.y) / 2;

      ctx.font = "10px monospace";
      ctx.fillStyle = "#00ff00";
      ctx.fillText(guide.label, midX + 4, midY - 4);
    }
  }

  // Render path guides
  for (const path of pathGuides) {
    const startScreen = toScreen(path.start);
    const endScreen = toScreen(path.end);

    switch (path.type) {
      case "path":
        ctx.strokeStyle = "#00ff0060";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        break;
      case "active":
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        break;
      case "snap-connect":
        ctx.strokeStyle = "#ffff00";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 2]);
        break;
    }

    ctx.beginPath();
    ctx.moveTo(startScreen.x, startScreen.y);
    ctx.lineTo(endScreen.x, endScreen.y);
    ctx.stroke();

    ctx.setLineDash([]);
  }

  // Draw tracking point markers
  for (const guide of guides) {
    const screenPoint = toScreen(guide.start);

    // Draw small crosshair at tracking point
    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = 1;
    const size = 4;

    ctx.beginPath();
    ctx.moveTo(screenPoint.x - size, screenPoint.y);
    ctx.lineTo(screenPoint.x + size, screenPoint.y);
    ctx.moveTo(screenPoint.x, screenPoint.y - size);
    ctx.lineTo(screenPoint.x, screenPoint.y + size);
    ctx.stroke();
  }
}
