/**
 * measure-tool.ts
 * 거리/면적 측정 도구
 *
 * 엔티티를 클릭하여 길이, 면적, 반지름 등을 표시합니다.
 */

import type { Point, Entity } from "../canvas/cad-canvas-renderer.js";

export interface MeasurementResult {
  type: "distance" | "area" | "angle" | "radius";
  value: number;
  label: string;
  points: Point[];
  entityId?: string;
}

/**
 * 선분의 길이를 계산합니다.
 */
function calculateLineLength(start: Point, end: Point): number {
  return Math.hypot(end.x - start.x, end.y - start.y);
}

/**
 * POLYLINE의 총 길이를 계산합니다.
 */
function calculatePolylineLength(vertices: Point[], closed: boolean): number {
  let length = 0;
  for (let i = 0; i < vertices.length - 1; i++) {
    length += Math.hypot(
      vertices[i + 1].x - vertices[i].x,
      vertices[i + 1].y - vertices[i].y,
    );
  }
  if (closed && vertices.length > 1) {
    length += Math.hypot(
      vertices[0].x - vertices[vertices.length - 1].x,
      vertices[0].y - vertices[vertices.length - 1].y,
    );
  }
  return length;
}

/**
 * 다각형의 면적을 계산합니다. ( Shoelace formula )
 */
function calculatePolygonArea(vertices: Point[]): number {
  let area = 0;
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += vertices[i].x * vertices[j].y;
    area -= vertices[j].x * vertices[i].y;
  }
  return Math.abs(area) / 2;
}

/**
 * 측정 결과를 생성합니다.
 */
export function createMeasureTool() {
  function measureEntity(
    entity: Entity,
    clickPoint: Point,
  ): MeasurementResult | null {
    switch (entity.type) {
      case "LINE": {
        if (!entity.start || !entity.end) return null;
        const length = calculateLineLength(entity.start, entity.end);
        return {
          type: "distance",
          value: length,
          label: `Length: ${length.toFixed(2)}`,
          points: [entity.start, entity.end],
          entityId: entity.id,
        };
      }

      case "POLYLINE":
      case "LWPOLYLINE": {
        if (!entity.vertices || entity.vertices.length === 0) return null;
        const length = calculatePolylineLength(entity.vertices, entity.closed ?? false);
        if (entity.closed && entity.vertices.length >= 3) {
          const area = calculatePolygonArea(entity.vertices);
          return {
            type: "area",
            value: area,
            label: `Area: ${area.toFixed(2)} | Length: ${length.toFixed(2)}`,
            points: entity.vertices,
            entityId: entity.id,
          };
        }
        return {
          type: "distance",
          value: length,
          label: `Length: ${length.toFixed(2)}`,
          points: entity.vertices,
          entityId: entity.id,
        };
      }

      case "CIRCLE": {
        if (!entity.center || entity.radius === undefined) return null;
        const area = Math.PI * entity.radius * entity.radius;
        const circumference = 2 * Math.PI * entity.radius;
        return {
          type: "radius",
          value: entity.radius,
          label: `R: ${entity.radius.toFixed(2)} | Area: ${area.toFixed(2)}`,
          points: [entity.center],
          entityId: entity.id,
        };
      }

      case "ARC": {
        if (!entity.center || entity.radius === undefined) return null;
        const startAngle = (entity.startAngle ?? 0) * Math.PI / 180;
        const endAngle = (entity.endAngle ?? 360) * Math.PI / 180;
        let angleDiff = endAngle - startAngle;
        if (angleDiff < 0) angleDiff += 2 * Math.PI;
        const arcLength = entity.radius * angleDiff;
        return {
          type: "distance",
          value: arcLength,
          label: `Arc: ${arcLength.toFixed(2)} | R: ${entity.radius.toFixed(2)}`,
          points: [entity.center],
          entityId: entity.id,
        };
      }

      case "POINT": {
        if (!entity.position) return null;
        return {
          type: "distance",
          value: 0,
          label: `Point (${entity.position.x.toFixed(2)}, ${entity.position.y.toFixed(2)})`,
          points: [entity.position],
          entityId: entity.id,
        };
      }

      default:
        return null;
    }
  }

  function measureTwoPoints(p1: Point, p2: Point): MeasurementResult {
    const distance = calculateLineLength(p1, p2);
    return {
      type: "distance",
      value: distance,
      label: `Distance: ${distance.toFixed(2)}`,
      points: [p1, p2],
    };
  }

  return {
    measureEntity,
    measureTwoPoints,
  };
}