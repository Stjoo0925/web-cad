/**
 * polar-tracking.ts
 * Polar Tracking System - 15° 단위 각도 가이드 라인 표시
 *
 * 기능:
 * - 15° 단위 각도 가이드 라인 표시
 * - 사용자 정의 각도 설정 (7.5°, 15°, 30°, 45°, 90° 등)
 * - 각도 값 커서 근처 표시
 * - ORTHO 모드와의 차이: Polar은 각도별 가이드, ORTHO는 수평/수직만
 */

import type { Point } from "./cad-canvas-renderer.js";

export type PolarAngleStep = 5 | 7.5 | 10 | 15 | 30 | 45 | 90 | 180;

export interface PolarTrackingOptions {
  /** Polar Tracking 활성화 여부 */
  enabled?: boolean;
  /** 각도 단계 */
  angleStep?: PolarAngleStep;
  /**自定义 추가 각도 */
  customAngles?: number[];
  /** 가이드 라인 길이 (픽셀) */
  guideLength?: number;
}

export interface PolarTrackingState {
  enabled: boolean;
  angleStep: PolarAngleStep;
  customAngles: number[];
  guideLength: number;
}

export interface PolarGuide {
  /** 가이드 선의 각도 (라디안) */
  angle: number;
  /** 가이드 선의 길이 */
  length: number;
  /** 시작점 */
  startPoint: Point;
  /** 끝점 */
  endPoint: Point;
  /** 해당 각도에 대한 설명 */
  label: string;
  /**是否是捕捉到的角度 */
  isSnapAngle: boolean;
}

/**
 * 기본 Polar 각도 단계
 */
export const DEFAULT_POLAR_ANGLES: number[] = [
  0, 5, 7.5, 10, 15, 22.5, 30, 45, 60, 67.5, 75, 90,
  105, 112.5, 120, 135, 150, 157.5, 165, 180,
  -180, -157.5, -150, -135, -120, -112.5, -105, -90,
  -75, -67.5, -60, -45, -30, -22.5, -15, -10, -7.5, -5,
];

/**
 * 도각 단위 (정각 포함)
 */
export const CARDINAL_ANGLES = [0, 90, 180, -180, -90];

/**
 * Polar Tracking Handler 생성
 */
export function createPolarTrackingHandler(
  options: PolarTrackingOptions = {},
) {
  let state: PolarTrackingState = {
    enabled: options.enabled ?? false,
    angleStep: options.angleStep ?? 15,
    customAngles: options.customAngles ?? [],
    guideLength: options.guideLength ?? 200,
  };

  /**
   * 특정 각도에 가장 가까운 Polar 각도 찾기
   */
  function snapToPolarAngle(angle: number): {
    snappedAngle: number;
    delta: number;
    isSnapped: boolean;
  } {
    const tolerance = state.angleStep / 2;

    // Normalize angle to -180 ~ 180
    let normalizedAngle = angle;
    while (normalizedAngle > 180) normalizedAngle -= 360;
    while (normalizedAngle < -180) normalizedAngle += 360;

    // Check all possible angles
    const allAngles = getAllPolarAngles();

    let closestAngle = normalizedAngle;
    let minDelta = Infinity;

    for (const polarAngle of allAngles) {
      let delta = normalizedAngle - polarAngle;
      // Normalize delta to -180 ~ 180
      while (delta > 180) delta -= 360;
      while (delta < -180) delta += 360;

      const absDelta = Math.abs(delta);
      if (absDelta < minDelta) {
        minDelta = absDelta;
        closestAngle = polarAngle;
      }
    }

    return {
      snappedAngle: closestAngle,
      delta: minDelta,
      isSnapped: minDelta <= tolerance,
    };
  }

  /**
   * 두 점 사이의 각도 계산 (라디안)
   */
  function calculateAngle(from: Point, to: Point): number {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return Math.atan2(dy, dx);
  }

  /**
   * 두 점 사이의 각도 계산 (도)
   */
  function calculateAngleDegrees(from: Point, to: Point): number {
    const radians = calculateAngle(from, to);
    return (radians * 180) / Math.PI;
  }

  /**
   * 모든 Polar 각도 배열 반환
   */
  function getAllPolarAngles(): number[] {
    const angles: Set<number> = new Set();

    // Add cardinal angles (0, 90, 180, -90)
    for (const angle of CARDINAL_ANGLES) {
      angles.add(angle);
    }

    // Add step-based angles
    for (let i = 0; i <= 360; i += state.angleStep) {
      angles.add(i);
      angles.add(-i);
    }

    // Add custom angles
    for (const angle of state.customAngles) {
      angles.add(angle);
      angles.add(-angle);
    }

    return Array.from(angles);
  }

  /**
   * 현재 마우스 위치에서 Polar 가이드 계산
   */
  function calculateGuides(
    basePoint: Point,
    currentPoint: Point,
    viewport: { width: number; height: number },
  ): PolarGuide[] {
    if (!state.enabled) return [];

    const guides: PolarGuide[] = [];
    const dx = currentPoint.x - basePoint.x;
    const dy = currentPoint.y - basePoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const currentAngle = Math.atan2(dy, dx);
    const currentAngleDeg = (currentAngle * 180) / Math.PI;

    // Get all polar angles
    const allAngles = getAllPolarAngles();

    for (const angleDeg of allAngles) {
      // Skip very small differences
      const delta = Math.abs(currentAngleDeg - angleDeg);
      const normalizedDelta = delta > 180 ? 360 - delta : delta;

      // Show guide if within 5 degrees of polar angle
      if (normalizedDelta <= 5 || normalizedDelta >= 355) {
        const angleRad = (angleDeg * Math.PI) / 180;
        const length = Math.max(state.guideLength, distance * 1.5);

        const endX = basePoint.x + length * Math.cos(angleRad);
        const endY = basePoint.y + length * Math.sin(angleRad);

        // Snap indicator for angles near current angle
        const isSnapAngle = normalizedDelta <= state.angleStep / 2;

        guides.push({
          angle: angleRad,
          length,
          startPoint: { ...basePoint },
          endPoint: { x: endX, y: endY },
          label: `${Math.abs(angleDeg)}°`,
          isSnapAngle,
        });
      }
    }

    return guides;
  }

  /**
   * Snap 적용: 스냅될 경우 강제 각도로 변환
   */
  function applyPolarSnap(basePoint: Point, currentPoint: Point): Point {
    if (!state.enabled) return currentPoint;

    const angleDeg = calculateAngleDegrees(basePoint, currentPoint);
    const { snappedAngle, isSnapped } = snapToPolarAngle(angleDeg);

    if (isSnapped) {
      const distance = Math.sqrt(
        Math.pow(currentPoint.x - basePoint.x, 2) +
          Math.pow(currentPoint.y - basePoint.y, 2),
      );
      const snappedRad = (snappedAngle * Math.PI) / 180;

      return {
        x: basePoint.x + distance * Math.cos(snappedRad),
        y: basePoint.y + distance * Math.sin(snappedRad),
      };
    }

    return currentPoint;
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

  function setAngleStep(step: PolarAngleStep) {
    state.angleStep = step;
  }

  function setCustomAngles(angles: number[]) {
    state.customAngles = angles;
  }

  function addCustomAngle(angle: number) {
    if (!state.customAngles.includes(angle)) {
      state.customAngles.push(angle);
    }
  }

  function setGuideLength(length: number) {
    state.guideLength = length;
  }

  function getState(): PolarTrackingState {
    return { ...state };
  }

  function getAngleStep(): PolarAngleStep {
    return state.angleStep;
  }

  function isEnabled(): boolean {
    return state.enabled;
  }

  return {
    calculateGuides,
    applyPolarSnap,
    snapToPolarAngle,
    setEnabled,
    toggle,
    setAngleStep,
    setCustomAngles,
    addCustomAngle,
    setGuideLength,
    getState,
    getAngleStep,
    isEnabled,
  };
}

export type PolarTrackingHandler = ReturnType<typeof createPolarTrackingHandler>;

/**
 * Polar 가이드 렌더링 유틸리티
 */
export function renderPolarGuides(
  ctx: CanvasRenderingContext2D,
  guides: PolarGuide[],
  viewport: { pan: Point; zoom: number; width: number; height: number },
) {
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;

  for (const guide of guides) {
    // Convert world coords to screen coords
    const startScreen = {
      x: (guide.startPoint.x - viewport.pan.x) * viewport.zoom + cx,
      y: (guide.startPoint.y - viewport.pan.y) * viewport.zoom + cy,
    };
    const endScreen = {
      x: (guide.endPoint.x - viewport.pan.x) * viewport.zoom + cx,
      y: (guide.endPoint.y - viewport.pan.y) * viewport.zoom + cy,
    };

    // Style: dashed for regular, solid for snap angles
    ctx.strokeStyle = guide.isSnapAngle ? "#00ffff80" : "#00ffff40";
    ctx.lineWidth = guide.isSnapAngle ? 1.5 : 1;
    ctx.setLineDash(guide.isSnapAngle ? [] : [6, 4]);

    ctx.beginPath();
    ctx.moveTo(startScreen.x, startScreen.y);
    ctx.lineTo(endScreen.x, endScreen.y);
    ctx.stroke();

    ctx.setLineDash([]);

    // Draw angle label at end of snap angle guides
    if (guide.isSnapAngle) {
      const labelX = endScreen.x + 10;
      const labelY = endScreen.y - 5;

      ctx.font = "bold 10px monospace";
      ctx.fillStyle = "#00ffff";
      ctx.fillText(guide.label, labelX, labelY);
    }
  }
}
