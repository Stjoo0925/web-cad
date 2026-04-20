/**
 * dynamic-input.ts
 * Dynamic Input System - 커서 근처 실시간 좌표/거리 표시
 *
 * 기능:
 * - 커서 근처 실시간 좌표 표시 (X, Y)
 * - 작업 종류별 입력 모드 (거리, 각도, delta)
 * - Tab 키로 입력 필드 전환 (절댓값 ↔ 상대값)
 * - 화살표 키로 값 증감
 * - Direct Distance Entry 지원
 */

import type { Point } from "./cad-canvas-renderer.js";

export type DynamicInputMode =
  | "idle"
  | "distance"
  | "angle"
  | "delta"
  | "point";

export interface DynamicInputState {
  mode: DynamicInputMode;
  /** 기준점 (첫 번째 클릭 지점) */
  basePoint: Point | null;
  /** 현재 마우스 위치 (스냅 적용) */
  currentPoint: Point | null;
  /** 사용자가 입력 중인 값 */
  inputValue: string;
  /** 두 번째 입력 값 (각도 또는 Y좌표) */
  secondValue: string;
  /** 입력 필드 인덱스 (0 = X/거리, 1 = Y/각도) */
  activeField: 0 | 1;
  /** 상대 좌표 모드 여부 */
  isRelative: boolean;
  /** 표시 여부 */
  visible: boolean;
}

export interface DynamicInputOptions {
  /** 입력 완료 시 콜백 */
  onComplete?: (point: Point) => void;
  /** 입력 취소 시 콜백 */
  onCancel?: () => void;
}

/**
 * Dynamic Input Handler 생성
 */
export function createDynamicInputHandler(options: DynamicInputOptions = {}) {
  const { onComplete, onCancel } = options;

  let state: DynamicInputState = {
    mode: "idle",
    basePoint: null,
    currentPoint: null,
    inputValue: "",
    secondValue: "",
    activeField: 0,
    isRelative: false,
    visible: false,
  };

  /**
   * 현재 좌표를 문자열로 반환
   */
  function formatCoordinate(p: Point | null, precision = 2): string {
    if (!p) return "0.00, 0.00";
    return `${p.x.toFixed(precision)}, ${p.y.toFixed(precision)}`;
  }

  /**
   * 거리를 문자열로 반환
   */
  function formatDistance(p1: Point | null, p2: Point | null): string {
    if (!p1 || !p2) return "0.00";
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist.toFixed(2);
  }

  /**
   * 각도를 반환 (도 단위)
   */
  function formatAngle(p1: Point | null, p2: Point | null): string {
    if (!p1 || !p2) return "0°";
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    return `${angle.toFixed(1)}°`;
  }

  /**
   * Dynamic Input 시작 (도구 클릭 후)
   */
  function start(point: Point) {
    state = {
      ...state,
      mode: "distance",
      basePoint: { ...point },
      currentPoint: { ...point },
      inputValue: "",
      secondValue: "",
      activeField: 0,
      isRelative: false,
      visible: true,
    };
  }

  /**
   * 마우스 이동 시 상태 업데이트
   */
  function update(currentPoint: Point) {
    if (!state.visible) return;
    state.currentPoint = { ...currentPoint };
  }

  /**
   * 키 입력 처리
   * @returns 입력 완료 시 true, 미완료 시 false
   */
  function handleKeyDown(
    key: string,
    modifiers: { shift?: boolean; ctrl?: boolean },
  ): boolean {
    if (!state.visible || state.mode === "idle") return false;

    // Tab: 입력 필드 전환 (절댓값 ↔ 상대값)
    if (key === "Tab") {
      if (state.mode === "point" || state.mode === "delta") {
        state.activeField = state.activeField === 0 ? 1 : 0;
      } else if (state.mode === "distance" || state.mode === "angle") {
        state.isRelative = !state.isRelative;
      }
      return false;
    }

    // Escape: 취소
    if (key === "Escape") {
      cancel();
      onCancel?.();
      return true;
    }

    // Enter: 입력 완료
    if (key === "Enter") {
      const point = resolveInput();
      if (point) {
        complete(point);
        return true;
      }
      return false;
    }

    // Backspace: 삭제
    if (key === "Backspace") {
      if (state.activeField === 0) {
        state.inputValue = state.inputValue.slice(0, -1);
      } else {
        state.secondValue = state.secondValue.slice(0, -1);
      }
      return false;
    }

    // Arrow keys: 값 증감
    if (key === "ArrowUp" || key === "ArrowDown") {
      const delta = key === "ArrowUp" ? 1 : -1;
      const shiftMultiplier = modifiers.shift ? 10 : 1;
      const actualDelta = delta * shiftMultiplier;

      if (state.activeField === 0) {
        const num = parseFloat(state.inputValue) || 0;
        state.inputValue = (num + actualDelta).toString();
      } else {
        const num = parseFloat(state.secondValue) || 0;
        state.secondValue = (num + actualDelta).toString();
      }
      return false;
    }

    // Arrow left/right: 필드 전환
    if (key === "ArrowLeft" || key === "ArrowRight") {
      state.activeField = state.activeField === 0 ? 1 : 0;
      return false;
    }

    // 숫자 및 특수문자 입력
    if (/^[0-9.]$/.test(key) || (key === "-" && state.inputValue === "")) {
      if (state.activeField === 0) {
        // 거리/ X 모드
        if (state.mode === "distance") {
          state.inputValue += key;
        } else {
          state.inputValue += key;
        }
      } else {
        // 각도/ Y 모드
        if (state.mode === "angle") {
          state.secondValue += key;
        } else {
          state.secondValue += key;
        }
      }
      return false;
    }

    return false;
  }

  /**
   * 입력값을 실제 좌표로 변환
   */
  function resolveInput(): Point | null {
    if (!state.basePoint || !state.currentPoint) return null;

    if (state.mode === "distance") {
      // Direct Distance Entry
      const distance = parseFloat(state.inputValue);
      if (!isNaN(distance) && distance > 0) {
        const dx = state.currentPoint.x - state.basePoint.x;
        const dy = state.currentPoint.y - state.basePoint.y;
        const currentDist = Math.sqrt(dx * dx + dy * dy);

        if (currentDist > 0) {
          const scale = distance / currentDist;
          return {
            x: state.basePoint.x + dx * scale,
            y: state.basePoint.y + dy * scale,
          };
        }
      }
      // 입력이 없으면 현재 위치 사용
      return { ...state.currentPoint };
    }

    if (state.mode === "point" || state.mode === "delta") {
      const x = parseFloat(state.inputValue);
      const y = parseFloat(state.secondValue);

      if (!isNaN(x) && !isNaN(y)) {
        if (state.isRelative || state.mode === "delta") {
          return {
            x: state.basePoint.x + x,
            y: state.basePoint.y + y,
          };
        }
        return { x, y };
      }
      return null;
    }

    if (state.mode === "angle") {
      // 각도 입력 모드 (basePoint에서 angle 방향으로 거리만큼)
      const angle = parseFloat(state.inputValue);
      const distance = parseFloat(state.secondValue);

      if (!isNaN(angle) && !isNaN(distance)) {
        const angleRad = (angle * Math.PI) / 180;
        return {
          x: state.basePoint.x + distance * Math.cos(angleRad),
          y: state.basePoint.y + distance * Math.sin(angleRad),
        };
      }
      return null;
    }

    return null;
  }

  /**
   * 입력 완료 처리
   */
  function complete(point: Point) {
    onComplete?.(point);
    reset();
  }

  /**
   * 취소 처리
   */
  function cancel() {
    reset();
  }

  /**
   * 상태 초기화
   */
  function reset() {
    state = {
      mode: "idle",
      basePoint: null,
      currentPoint: null,
      inputValue: "",
      secondValue: "",
      activeField: 0,
      isRelative: false,
      visible: false,
    };
  }

  /**
   * 현재 상태 반환
   */
  function getState(): DynamicInputState {
    return { ...state };
  }

  /**
   * 렌더링할 표시 문자열 반환
   */
  function getDisplayStrings(): {
    primary: string;
    secondary: string;
    hint: string;
  } {
    if (!state.visible) {
      return { primary: "", secondary: "", hint: "" };
    }

    if (state.mode === "distance") {
      const dist = formatDistance(state.basePoint, state.currentPoint);
      const angle = formatAngle(state.basePoint, state.currentPoint);
      return {
        primary: state.inputValue || dist,
        secondary: angle,
        hint: state.isRelative ? "@" : "",
      };
    }

    if (state.mode === "point" || state.mode === "delta") {
      const coord = formatCoordinate(state.currentPoint);
      const xLabel = state.activeField === 0 ? ">" : "";
      const yLabel = state.activeField === 1 ? ">" : "";
      return {
        primary: `${xLabel}${state.inputValue || ""}`,
        secondary: `${yLabel}${state.secondValue || ""}`,
        hint: state.isRelative ? "@" : "",
      };
    }

    if (state.mode === "angle") {
      const currentAngle = formatAngle(state.basePoint, state.currentPoint);
      return {
        primary: state.inputValue || currentAngle,
        secondary: state.secondValue || "",
        hint: "°",
      };
    }

    return { primary: "", secondary: "", hint: "" };
  }

  return {
    start,
    update,
    handleKeyDown,
    getState,
    getDisplayStrings,
    cancel,
    reset,
  };
}

export type DynamicInputHandler = ReturnType<typeof createDynamicInputHandler>;
