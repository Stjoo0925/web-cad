/**
 * rotate-tool.ts
 * 회전(ROTATE) 도구 모듈
 *
 * 선택된 엔티티들을 지정된 중심점을 중심으로 지정된 각도만큼 회전합니다.
 * 첫 번째 클릭: 회전 중심점
 * 두 번째 클릭: 회전 각도 결정 (기준 방향)
 */

import type { Point } from "./line-tool.js";
import type { Entity } from "../canvas/cad-canvas-renderer.js";

export interface RotateToolState {
  centerPoint: Point | null;
  referencePoint: Point | null;
  isPending: boolean;
  selectedEntities: Entity[];
}

export interface RotateToolOptions {
  onComplete?: (rotatedEntities: Entity[]) => void;
  onPreview?: (rotatedEntities: Entity[]) => void;
}

/**
 * ROTATE 도구 인스턴스를 생성합니다.
 */
export function createRotateTool(options: RotateToolOptions = {}) {
  const { onComplete, onPreview } = options;

  const state: RotateToolState = {
    centerPoint: null,
    referencePoint: null,
    isPending: false,
    selectedEntities: [],
  };

  /**
   * 포인트를 중심점 기준으로 각도만큼 회전합니다.
   */
  function rotatePoint(point: Point, center: Point, angleRad: number): Point {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos,
    };
  }

  /**
   * 엔티티를 회전합니다.
   */
  function rotateEntity(
    entity: Entity,
    center: Point,
    angleRad: number,
  ): Entity {
    switch (entity.type) {
      case "POINT":
        return {
          ...entity,
          position: entity.position
            ? rotatePoint(entity.position, center, angleRad)
            : undefined,
        };
      case "LINE":
        return {
          ...entity,
          start: entity.start
            ? rotatePoint(entity.start, center, angleRad)
            : undefined,
          end: entity.end
            ? rotatePoint(entity.end, center, angleRad)
            : undefined,
        };
      case "POLYLINE":
      case "LWPOLYLINE":
        return {
          ...entity,
          vertices: entity.vertices?.map((v) =>
            rotatePoint(v, center, angleRad),
          ),
        };
      case "CIRCLE":
        // 원은 내부적으로 회전하지 않지만 중심이 이동함
        return {
          ...entity,
          center: entity.center
            ? rotatePoint(entity.center, center, angleRad)
            : undefined,
        };
      case "ARC":
        return {
          ...entity,
          center: entity.center
            ? rotatePoint(entity.center, center, angleRad)
            : undefined,
          startAngle:
            entity.startAngle !== undefined
              ? entity.startAngle + (angleRad * 180) / Math.PI
              : undefined,
          endAngle:
            entity.endAngle !== undefined
              ? entity.endAngle + (angleRad * 180) / Math.PI
              : undefined,
        };
      case "TEXT":
        return {
          ...entity,
          position: entity.position
            ? rotatePoint(entity.position, center, angleRad)
            : undefined,
        };
      default:
        return entity;
    }
  }

  /**
   * 클릭 핸들러
   */
  function handleClick(
    point: Point,
    selectedEntities: Entity[],
  ): Entity[] | null {
    if (!state.isPending) {
      // 첫 번째 클릭: 중심점 설정
      state.centerPoint = { ...point };
      state.referencePoint = { ...point };
      state.isPending = true;
      state.selectedEntities = selectedEntities;
      return null;
    } else {
      // 두 번째 클릭: 각도 계산 및 회전
      state.referencePoint = { ...point };

      if (!state.centerPoint || !state.referencePoint) return null;

      // 중심에서 기준점까지의 각도 계산
      const angleRad = Math.atan2(
        state.referencePoint.y - state.centerPoint.y,
        state.referencePoint.x - state.centerPoint.x,
      );

      const rotatedEntities = state.selectedEntities.map((e) =>
        rotateEntity(e, state.centerPoint!, angleRad),
      );

      if (onComplete) {
        onComplete(rotatedEntities);
      }

      // 상태 초기화
      state.centerPoint = null;
      state.referencePoint = null;
      state.isPending = false;
      state.selectedEntities = [];

      return rotatedEntities;
    }
  }

  /**
   * 미리보기용 회전된 엔티티 반환
   */
  function getPreview(point: Point): Entity[] | null {
    if (
      !state.isPending ||
      !state.centerPoint ||
      !state.referencePoint ||
      !state.selectedEntities.length
    ) {
      return null;
    }

    const angleRad = Math.atan2(
      point.y - state.centerPoint.y,
      point.x - state.centerPoint.x,
    );

    return state.selectedEntities.map((e) =>
      rotateEntity(e, state.centerPoint!, angleRad),
    );
  }

  function cancel() {
    state.centerPoint = null;
    state.referencePoint = null;
    state.isPending = false;
    state.selectedEntities = [];
  }

  function getState(): RotateToolState {
    return { ...state };
  }

  function isActive(): boolean {
    return state.isPending;
  }

  return {
    handleClick,
    getPreview,
    cancel,
    getState,
    isActive,
  };
}
