/**
 * GripsOverlay.tsx
 * 선택된 엔티티의 Grips를 렌더링하는 오버레이 컴포넌트
 */

import React, { useMemo } from "react";
import type { Point, Viewport } from "../canvas/cad-canvas-renderer.js";
import {
  createGripsHandler,
  type GripPoint,
  type GripType,
  getGripLabel,
  getGripStyle,
} from "../tools/grips-handler.js";

export interface GripsOverlayProps {
  /** Grip 포인트 목록 */
  grips: GripPoint[];
  /** 현재 호버된 Grip ID */
  hoveredGripId: string | null;
  /** 선택된 Grip ID 목록 */
  selectedGripIds: Set<string>;
  /** 뷰포트 */
  viewport: Viewport;
  /** Grip 사이즈 (픽셀) */
  gripSize?: number;
  /** 클래스명 */
  className?: string;
}

/**
 * Grip 포인트 하나를 렌더링합니다.
 */
function GripMarker({
  grip,
  isHovered,
  isSelected,
  viewport,
}: {
  grip: GripPoint;
  isHovered: boolean;
  isSelected: boolean;
  viewport: Viewport;
}) {
  const style = getGripStyle(grip.type);
  const screenPos = worldToScreen(grip.position, viewport);
  const size = isHovered ? style.size * 1.3 : style.size;

  // Glow effect for hovered/selected
  const glowSize = isHovered || isSelected ? size * 2 : 0;
  const glowOpacity = isHovered || isSelected ? 0.3 : 0;

  return (
    <g>
      {/* Glow effect */}
      {glowSize > 0 && (
        <circle
          cx={screenPos.x}
          cy={screenPos.y}
          r={glowSize}
          fill={style.color}
          opacity={glowOpacity}
        />
      )}
      {/* Main grip square */}
      <rect
        x={screenPos.x - size / 2}
        y={screenPos.y - size / 2}
        width={size}
        height={size}
        fill={isHovered ? "#ffffff" : style.fillColor}
        stroke={isHovered ? "#ffffff" : "#000000"}
        strokeWidth={1}
        style={{ cursor: "move" }}
      />
    </g>
  );
}

/**
 * Grips 레이블을 렌더링합니다.
 */
function GripLabel({
  grip,
  viewport,
}: {
  grip: GripPoint;
  viewport: Viewport;
}) {
  const style = getGripStyle(grip.type);
  const screenPos = worldToScreen(grip.position, viewport);
  const label = getGripLabel(grip.type);

  return (
    <text
      x={screenPos.x + 8}
      y={screenPos.y - 8}
      fill={style.color}
      fontSize={10}
      fontFamily="monospace"
      fontWeight="bold"
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      {label}
    </text>
  );
}

/**
 * GripsOverlay 컴포넌트
 */
export function GripsOverlay({
  grips,
  hoveredGripId,
  selectedGripIds,
  viewport,
  className,
}: GripsOverlayProps) {
  if (grips.length === 0) return null;

  return (
    <svg
      className={className}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
      }}
      viewBox={`0 0 ${viewport.width} ${viewport.height}`}
    >
      {grips.map((grip) => (
        <GripMarker
          key={grip.id}
          grip={grip}
          isHovered={grip.id === hoveredGripId}
          isSelected={selectedGripIds.has(grip.id)}
          viewport={viewport}
        />
      ))}
      {/* Show labels for hovered grips */}
      {hoveredGripId &&
        grips
          .filter((g) => g.id === hoveredGripId)
          .map((grip) => (
            <GripLabel key={`label-${grip.id}`} grip={grip} viewport={viewport} />
          ))}
    </svg>
  );
}

/**
 * World 좌표를 Screen 좌표로 변환
 */
function worldToScreen(point: Point, viewport: Viewport): Point {
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  return {
    x: (point.x - viewport.pan.x) * viewport.zoom + cx,
    y: (point.y - viewport.pan.y) * viewport.zoom + cy,
  };
}

/**
 * Grip 드래그 시 보여줄 임시 엔티티 생성 (move/stretch 미리보기)
 */
export interface GripPreviewEntity {
  id: string;
  type: string;
  start?: Point;
  end?: Point;
  position?: Point;
  center?: Point;
  radius?: number;
  vertices?: Point[];
  [key: string]: unknown;
}

/**
 * Grip 드래그에 따른 임시 엔티티 위치 계산
 */
export function calculateGripPreview(
  originalEntity: GripPreviewEntity,
  grip: GripPoint,
  delta: Point,
): GripPreviewEntity {
  const { type } = originalEntity;
  const dx = delta.x;
  const dy = delta.y;

  switch (type) {
    case "LINE":
      return {
        ...originalEntity,
        start: originalEntity.start
          ? { x: originalEntity.start.x + dx, y: originalEntity.start.y + dy }
          : undefined,
        end: originalEntity.end
          ? { x: originalEntity.end.x + dx, y: originalEntity.end.y + dy }
          : undefined,
      };

    case "CIRCLE":
      return {
        ...originalEntity,
        center: originalEntity.center
          ? {
              x: originalEntity.center.x + dx,
              y: originalEntity.center.y + dy,
            }
          : undefined,
      };

    case "ARC":
      return {
        ...originalEntity,
        center: originalEntity.center
          ? {
              x: originalEntity.center.x + dx,
              y: originalEntity.center.y + dy,
            }
          : undefined,
      };

    case "POLYLINE":
    case "LWPOLYLINE":
      if (originalEntity.vertices) {
        const newVertices = [...originalEntity.vertices];
        if (grip.index !== undefined && newVertices[grip.index]) {
          newVertices[grip.index] = {
            x: newVertices[grip.index].x + dx,
            y: newVertices[grip.index].y + dy,
          };
        }
        return {
          ...originalEntity,
          vertices: newVertices,
        };
      }
      return originalEntity;

    case "POINT":
      return {
        ...originalEntity,
        position: originalEntity.position
          ? {
              x: originalEntity.position.x + dx,
              y: originalEntity.position.y + dy,
            }
          : undefined,
      };

    default:
      return originalEntity;
  }
}

export default GripsOverlay;
