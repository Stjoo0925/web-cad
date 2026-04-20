/**
 * DynamicInputOverlay.tsx
 * Dynamic Input UI 오버레이 - 커서 근처에 입력 상자 표시
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Point } from "../canvas/cad-canvas-renderer.js";
import {
  createDynamicInputHandler,
  type DynamicInputHandler,
  type DynamicInputState,
} from "../canvas/dynamic-input.js";

export interface DynamicInputOverlayProps {
  /** 화면 좌표 (스냅 적용) */
  screenPosition: Point;
  /** 표시 여부 */
  visible: boolean;
  /** 입력 모드 */
  mode: DynamicInputState["mode"];
  /** 기준점 */
  basePoint: Point | null;
  /** 완료 시 콜백 */
  onComplete?: (point: Point) => void;
  /** 취소 시 콜백 */
  onCancel?: () => void;
  /** 상태 업데이트 시 콜백 */
  onStateChange?: (state: DynamicInputState) => void;
}

const OVERLAY_STYLE: React.CSSProperties = {
  position: "absolute",
  pointerEvents: "none",
  zIndex: 1000,
  transform: "translate(-50%, -100%)",
  marginTop: "-20px",
};

const INPUT_BOX_STYLE: React.CSSProperties = {
  background: "#1e1e1e",
  border: "2px solid #0e639c",
  borderRadius: "4px",
  padding: "4px 8px",
  minWidth: "80px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
};

const INPUT_FIELD_STYLE = (active: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: "4px",
  padding: "2px 4px",
  background: active ? "#2d2d2d" : "transparent",
  borderRadius: "2px",
  margin: "2px 0",
});

const INPUT_TEXT_STYLE: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "12px",
  color: "#ffffff",
  outline: "none",
  background: "transparent",
  border: "none",
  minWidth: "40px",
  width: "auto",
};

const LABEL_STYLE: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "11px",
  color: "#b0b0b0",
};

const HINT_STYLE: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "10px",
  color: "#888888",
};

const ARROW_STYLE: React.CSSProperties = {
  width: 0,
  height: 0,
  borderLeft: "6px solid transparent",
  borderRight: "6px solid transparent",
  borderTop: "8px solid #0e639c",
  margin: "0 auto",
};

/**
 * Dynamic Input Overlay 컴포넌트
 */
export function DynamicInputOverlay({
  screenPosition,
  visible,
  mode,
  basePoint,
  onComplete,
  onCancel,
  onStateChange,
}: DynamicInputOverlayProps) {
  const [inputValue, setInputValue] = useState("");
  const [secondValue, setSecondValue] = useState("");
  const [activeField, setActiveField] = useState<0 | 1>(0);
  const [isRelative, setIsRelative] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlerRef = useRef<DynamicInputHandler | null>(null);

  // Initialize handler
  useEffect(() => {
    handlerRef.current = createDynamicInputHandler({
      onComplete: (point) => {
        onComplete?.(point);
        setInputValue("");
        setSecondValue("");
      },
      onCancel: () => {
        onCancel?.();
        setInputValue("");
        setSecondValue("");
      },
    });
  }, [onComplete, onCancel]);

  // Start handler when visible and basePoint changes
  useEffect(() => {
    if (visible && basePoint && handlerRef.current) {
      handlerRef.current.start(basePoint);
    }
  }, [visible, basePoint]);

  // Update display strings
  const displayStrings = handlerRef.current?.getDisplayStrings() ?? {
    primary: "",
    secondary: "",
    hint: "",
  };

  // Focus input when overlay appears
  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (!handlerRef.current) return;

      const key = e.key;

      // Tab: toggle relative mode or switch field
      if (key === "Tab") {
        e.preventDefault();
        setIsRelative((prev) => !prev);
        setActiveField((prev) => (prev === 0 ? 1 : 0));
        return;
      }

      // Escape: cancel
      if (key === "Escape") {
        handlerRef.current.cancel();
        return;
      }

      // Enter: complete
      if (key === "Enter") {
        const state = handlerRef.current.getState();
        const point =
          state.mode === "distance" && state.inputValue
            ? resolveDistanceInput(state)
            : state.currentPoint;

        if (point) {
          onComplete?.(point);
        }
        setInputValue("");
        setSecondValue("");
        return;
      }

      // Backspace
      if (key === "Backspace") {
        e.preventDefault();
        if (activeField === 0) {
          setInputValue((prev) => prev.slice(0, -1));
        } else {
          setSecondValue((prev) => prev.slice(0, -1));
        }
        return;
      }

      // Arrow keys
      if (key === "ArrowUp" || key === "ArrowDown") {
        e.preventDefault();
        const delta = key === "ArrowUp" ? 1 : -1;
        const multiplier = e.shiftKey ? 10 : 1;
        const actualDelta = delta * multiplier;

        if (activeField === 0) {
          const num = parseFloat(inputValue) || 0;
          setInputValue((num + actualDelta).toString());
        } else {
          const num = parseFloat(secondValue) || 0;
          setSecondValue((num + actualDelta).toString());
        }
        return;
      }

      // Arrow left/right: switch field
      if (key === "ArrowLeft" || key === "ArrowRight") {
        e.preventDefault();
        setActiveField((prev) => (prev === 0 ? 1 : 0));
        return;
      }

      // Number input
      if (/^[0-9.]$/.test(key)) {
        e.preventDefault();
        if (activeField === 0) {
          setInputValue((prev) => prev + key);
        } else {
          setSecondValue((prev) => prev + key);
        }
        return;
      }

      // Minus sign at start
      if (key === "-" && (activeField === 0 ? !inputValue : !secondValue)) {
        e.preventDefault();
        if (activeField === 0) {
          setInputValue("-");
        } else {
          setSecondValue("-");
        }
        return;
      }
    },
    [activeField, inputValue, secondValue, onComplete, basePoint],
  );

  // Calculate display based on mode
  const getDisplay = (): {
    firstLabel: string;
    firstValue: string;
    secondLabel: string;
    secondValue: string;
    hint: string;
  } => {
    if (mode === "distance") {
      return {
        firstLabel: "",
        firstValue: inputValue || "0.00",
        secondLabel: "",
        secondValue: displayStrings.secondary || "0°",
        hint: isRelative ? "@" : "",
      };
    }

    if (mode === "angle") {
      return {
        firstLabel: "",
        firstValue: inputValue || "0°",
        secondLabel: "R:",
        secondValue: secondValue || "0.00",
        hint: "",
      };
    }

    // point or delta mode
    return {
      firstLabel: activeField === 0 ? ">" : "",
      firstValue: inputValue || "0.00",
      secondLabel: activeField === 1 ? ">" : "",
      secondValue: secondValue || "0.00",
      hint: isRelative ? "@" : "",
    };
  };

  const display = getDisplay();

  if (!visible) return null;

  return (
    <div
      style={{
        ...OVERLAY_STYLE,
        left: screenPosition.x,
        top: screenPosition.y,
      }}
    >
      <div style={INPUT_BOX_STYLE}>
        {/* First input row (X or Distance) */}
        <div style={INPUT_FIELD_STYLE(activeField === 0)}>
          <span style={LABEL_STYLE}>{display.firstLabel}</span>
          <input
            ref={inputRef}
            type="text"
            value={display.firstValue}
            onChange={() => {}} // Controlled externally
            onKeyDown={handleKeyDown}
            style={INPUT_TEXT_STYLE}
            autoFocus
          />
          {display.hint && <span style={HINT_STYLE}>{display.hint}</span>}
        </div>

        {/* Second input row (Y or Radius) */}
        {mode !== "distance" && (
          <div style={INPUT_FIELD_STYLE(activeField === 1)}>
            <span style={LABEL_STYLE}>{display.secondLabel}</span>
            <input
              type="text"
              value={display.secondValue}
              onChange={() => {}}
              onKeyDown={handleKeyDown}
              style={INPUT_TEXT_STYLE}
            />
          </div>
        )}
      </div>

      {/* Arrow pointing down */}
      <div style={ARROW_STYLE} />
    </div>
  );
}

/**
 * Distance 입력 해석
 */
function resolveDistanceInput(state: DynamicInputState): Point | null {
  if (!state.basePoint || !state.currentPoint) return null;

  const distance = parseFloat(state.inputValue);
  if (isNaN(distance) || distance <= 0) {
    return state.currentPoint;
  }

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

  return state.currentPoint;
}

export default DynamicInputOverlay;
