/**
 * snap-engine.ts
 * 스냅 기능 모듈
 *
 * 끝점, 중점, 교차점 스냅을 계산하여 스냅 포인트를 반환합니다.
 * 스냅 허용 오차 내에 있는 엔티티들의 스냅 포인트를 수집하고,
 * 우선순위에 따라 가장 적합한 스냅 포인트를 선택합니다.
 */

/**
 * 스냅 허용 오차 (픽셀)
 */
const SNAP_TOLERANCE = 8;

/**
 * 스냅 타입 정의
 */
export const SNAP_TYPES = {
  ENDPOINT: "endpoint",
  MIDPOINT: "midpoint",
  INTERSECTION: "intersection",
  CENTER: "center",
  NEAREST: "nearest",
  PERPENDICULAR: "perpendicular",
  TANGENT: "tangent"
} as const;

export type SnapType = (typeof SNAP_TYPES)[keyof typeof SNAP_TYPES];

/**
 * 스냅 타입 우선순위 (높을수록 먼저 적용)
 */
const SNAP_PRIORITY: Record<SnapType, number> = {
  [SNAP_TYPES.ENDPOINT]: 100,
  [SNAP_TYPES.MIDPOINT]: 80,
  [SNAP_TYPES.INTERSECTION]: 90,
  [SNAP_TYPES.CENTER]: 70,
  [SNAP_TYPES.NEAREST]: 50,
  [SNAP_TYPES.PERPENDICULAR]: 85,
  [SNAP_TYPES.TANGENT]: 75
};

export interface Point {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  type: string;
  start?: Point;
  end?: Point;
  vertices?: Point[];
  center?: Point;
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  closed?: boolean;
  [key: string]: unknown;
}

export interface SnapResult {
  point: Point;
  type: SnapType;
  distance: number;
  priority: number;
  entityId: string | null;
}

export interface SnapEngineOptions {
  tolerance?: number;
  enabledTypes?: SnapType[];
}

/**
 * 두 점 사이의 거리를 계산합니다.
 */
function distance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * 점에서 선까지의 수직 거리를 계산합니다.
 */
function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const len = Math.hypot(dx, dy);
  if (len < 1e-10) return distance(point, lineStart);
  return Math.abs((dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / len);
}

/**
 * 점에서 원까지의 접선 거리를 계산합니다.
 */
function tangentDistance(point: Point, center: Point, radius: number): number {
  const d = distance(point, center);
  if (d < radius) return 0;
  const angle = Math.asin(radius / d);
  return distance(point, {
    x: center.x + radius * Math.cos(Math.atan2(point.y - center.y, point.x - center.x) + angle),
    y: center.y + radius * Math.sin(Math.atan2(point.y - center.y, point.x - center.x) + angle)
  });
}

/**
 * 두 선분의 교차점을 계산합니다.
 */
function lineLineIntersection(a1: Point, a2: Point, b1: Point, b2: Point): Point | null {
  const dx1 = a2.x - a1.x;
  const dy1 = a2.y - a1.y;
  const dx2 = b2.x - b1.x;
  const dy2 = b2.y - b1.y;

  const denom = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denom) < 1e-10) return null;

  const t = ((b1.x - a1.x) * dy2 - (b1.y - a1.y) * dx2) / denom;
  const u = ((b1.x - a1.x) * dy1 - (b1.y - a1.y) * dx1) / denom;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: a1.x + t * dx1,
      y: a1.y + t * dy1
    };
  }

  return null;
}

/**
 * 엔티티에서 끝점 스냅 포인트를 추출합니다.
 */
function getEndpointSnapPoints(entity: Entity): Point[] {
  switch (entity.type) {
    case "LINE":
      return entity.start && entity.end ? [entity.start, entity.end] : [];
    case "POLYLINE":
    case "LWPOLYLINE":
      return entity.vertices ? [...entity.vertices] : [];
    case "CIRCLE":
      if (entity.center && entity.radius !== undefined) {
        return [
          { x: entity.center.x + entity.radius, y: entity.center.y },
          { x: entity.center.x - entity.radius, y: entity.center.y },
          { x: entity.center.x, y: entity.center.y + entity.radius },
          { x: entity.center.x, y: entity.center.y - entity.radius }
        ];
      }
      return [];
    case "ARC":
      if (entity.startAngle !== undefined && entity.endAngle !== undefined && entity.center && entity.radius !== undefined) {
        return [
          {
            x: entity.center.x + entity.radius * Math.cos(entity.startAngle),
            y: entity.center.y + entity.radius * Math.sin(entity.startAngle)
          },
          {
            x: entity.center.x + entity.radius * Math.cos(entity.endAngle),
            y: entity.center.y + entity.radius * Math.sin(entity.endAngle)
          }
        ];
      }
      return [];
    default:
      return [];
  }
}

/**
 * 엔티티에서 중점 스냅 포인트를 추출합니다.
 */
function getMidpointSnapPoints(entity: Entity): Point[] {
  switch (entity.type) {
    case "LINE":
      if (entity.start && entity.end) {
        return [{
          x: (entity.start.x + entity.end.x) / 2,
          y: (entity.start.y + entity.end.y) / 2
        }];
      }
      return [];
    case "POLYLINE":
    case "LWPOLYLINE":
      if (!entity.vertices || entity.vertices.length < 2) return [];
      const midpoints: Point[] = [];
      for (let i = 0; i < entity.vertices.length - 1; i++) {
        midpoints.push({
          x: (entity.vertices[i].x + entity.vertices[i + 1].x) / 2,
          y: (entity.vertices[i].y + entity.vertices[i + 1].y) / 2
        });
      }
      return midpoints;
    default:
      return [];
  }
}

/**
 * 엔티티에서 교차점 스냅 포인트를 계산합니다.
 */
function getIntersectionSnapPoints(entity1: Entity, entity2: Entity): Point[] {
  const intersections: Point[] = [];

  if (entity1.type === "LINE" && entity2.type === "LINE") {
    if (entity1.start && entity1.end && entity2.start && entity2.end) {
      const pt = lineLineIntersection(entity1.start, entity1.end, entity2.start, entity2.end);
      if (pt) intersections.push(pt);
    }
  }

  if (entity1.type === "LINE" && (entity2.type === "POLYLINE" || entity2.type === "LWPOLYLINE")) {
    if (entity1.start && entity1.end && entity2.vertices) {
      for (let i = 0; i < entity2.vertices.length - 1; i++) {
        const pt = lineLineIntersection(
          entity1.start, entity1.end,
          entity2.vertices[i], entity2.vertices[i + 1]
        );
        if (pt) intersections.push(pt);
      }
    }
  }
  if ((entity1.type === "POLYLINE" || entity1.type === "LWPOLYLINE") && entity2.type === "LINE") {
    if (entity1.vertices && entity2.start && entity2.end) {
      for (let i = 0; i < entity1.vertices.length - 1; i++) {
        const pt = lineLineIntersection(
          entity1.vertices[i], entity1.vertices[i + 1],
          entity2.start, entity2.end
        );
        if (pt) intersections.push(pt);
      }
    }
  }

  if ((entity1.type === "POLYLINE" || entity1.type === "LWPOLYLINE") &&
      (entity2.type === "POLYLINE" || entity2.type === "LWPOLYLINE")) {
    if (entity1.vertices && entity2.vertices) {
      for (let i = 0; i < entity1.vertices.length - 1; i++) {
        for (let j = 0; j < entity2.vertices.length - 1; j++) {
          const pt = lineLineIntersection(
            entity1.vertices[i], entity1.vertices[i + 1],
            entity2.vertices[j], entity2.vertices[j + 1]
          );
          if (pt) intersections.push(pt);
        }
      }
    }
  }

  return intersections;
}

/**
 * 엔티티에서 PERPENDICULAR(수직) 스냅 포인트를 계산합니다.
 */
function getPerpendicularSnapPoints(entity: Entity, fromPoint: Point): Point[] {
  switch (entity.type) {
    case "LINE":
      if (entity.start && entity.end) {
        const dx = entity.end.x - entity.start.x;
        const dy = entity.end.y - entity.start.y;
        const len = Math.hypot(dx, dy);
        if (len < 1e-10) return [];
        const t = Math.max(0, Math.min(1, ((fromPoint.x - entity.start.x) * dx + (fromPoint.y - entity.start.y) * dy) / (len * len)));
        return [{
          x: entity.start.x + t * dx,
          y: entity.start.y + t * dy
        }];
      }
      return [];
    case "POLYLINE":
    case "LWPOLYLINE":
      if (!entity.vertices) return [];
      const points: Point[] = [];
      for (let i = 0; i < entity.vertices.length - 1; i++) {
        const dx = entity.vertices[i + 1].x - entity.vertices[i].x;
        const dy = entity.vertices[i + 1].y - entity.vertices[i].y;
        const len = Math.hypot(dx, dy);
        if (len < 1e-10) continue;
        const t = Math.max(0, Math.min(1, ((fromPoint.x - entity.vertices[i].x) * dx + (fromPoint.y - entity.vertices[i].y) * dy) / (len * len)));
        points.push({
          x: entity.vertices[i].x + t * dx,
          y: entity.vertices[i].y + t * dy
        });
      }
      return points;
    default:
      return [];
  }
}

/**
 * 엔티티에서 TANGENT(접선) 스냅 포인트를 계산합니다.
 */
function getTangentSnapPoints(entity: Entity, fromPoint: Point): Point[] {
  switch (entity.type) {
    case "CIRCLE":
      if (entity.center && entity.radius !== undefined) {
        const dx = fromPoint.x - entity.center.x;
        const dy = fromPoint.y - entity.center.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 1e-10) return [];
        const angle = Math.atan2(dy, dx);
        return [{
          x: entity.center.x + entity.radius * Math.cos(angle),
          y: entity.center.y + entity.radius * Math.sin(angle)
        }];
      }
      return [];
    case "ARC":
      if (entity.center && entity.radius !== undefined) {
        const dx = fromPoint.x - entity.center.x;
        const dy = fromPoint.y - entity.center.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 1e-10) return [];
        const angle = Math.atan2(dy, dx);
        return [{
          x: entity.center.x + entity.radius * Math.cos(angle),
          y: entity.center.y + entity.radius * Math.sin(angle)
        }];
      }
      return [];
    default:
      return [];
  }
}

/**
 * 스냅 엔진 인스턴스를 생성합니다.
 */
export function createSnapEngine(options: SnapEngineOptions = {}) {
  const {
    tolerance = SNAP_TOLERANCE,
    enabledTypes = Object.values(SNAP_TYPES) as SnapType[]
  } = options;

  function findSnapPoint(screenPoint: Point, entities: Entity[]): SnapResult | null {
    const candidates: SnapResult[] = [];

    for (const entity of entities) {
      if (!entity) continue;

      if (enabledTypes.includes(SNAP_TYPES.ENDPOINT)) {
        const endpoints = getEndpointSnapPoints(entity);
        for (const ep of endpoints) {
          const dist = distance(screenPoint, ep);
          if (dist <= tolerance) {
            candidates.push({
              point: ep,
              type: SNAP_TYPES.ENDPOINT,
              distance: dist,
              priority: SNAP_PRIORITY[SNAP_TYPES.ENDPOINT],
              entityId: entity.id
            });
          }
        }
      }

      if (enabledTypes.includes(SNAP_TYPES.MIDPOINT)) {
        const midpoints = getMidpointSnapPoints(entity);
        for (const mp of midpoints) {
          const dist = distance(screenPoint, mp);
          if (dist <= tolerance) {
            candidates.push({
              point: mp,
              type: SNAP_TYPES.MIDPOINT,
              distance: dist,
              priority: SNAP_PRIORITY[SNAP_TYPES.MIDPOINT],
              entityId: entity.id
            });
          }
        }
      }
    }

    if (enabledTypes.includes(SNAP_TYPES.INTERSECTION)) {
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const intersections = getIntersectionSnapPoints(entities[i], entities[j]);
          for (const ip of intersections) {
            const dist = distance(screenPoint, ip);
            if (dist <= tolerance) {
              candidates.push({
                point: ip,
                type: SNAP_TYPES.INTERSECTION,
                distance: dist,
                priority: SNAP_PRIORITY[SNAP_TYPES.INTERSECTION],
                entityId: null
              });
            }
          }
        }
      }
    }

    if (candidates.length === 0) return null;

    // PERPENDICULAR 스냅 처리
    if (enabledTypes.includes(SNAP_TYPES.PERPENDICULAR)) {
      for (const entity of entities) {
        const perpPoints = getPerpendicularSnapPoints(entity, screenPoint);
        for (const pp of perpPoints) {
          const dist = distance(screenPoint, pp);
          if (dist <= tolerance) {
            candidates.push({
              point: pp,
              type: SNAP_TYPES.PERPENDICULAR,
              distance: dist,
              priority: SNAP_PRIORITY[SNAP_TYPES.PERPENDICULAR],
              entityId: entity.id
            });
          }
        }
      }
    }

    // TANGENT 스냅 처리
    if (enabledTypes.includes(SNAP_TYPES.TANGENT)) {
      for (const entity of entities) {
        const tangentPoints = getTangentSnapPoints(entity, screenPoint);
        for (const tp of tangentPoints) {
          const dist = distance(screenPoint, tp);
          if (dist <= tolerance) {
            candidates.push({
              point: tp,
              type: SNAP_TYPES.TANGENT,
              distance: dist,
              priority: SNAP_PRIORITY[SNAP_TYPES.TANGENT],
              entityId: entity.id
            });
          }
        }
      }
    }

    candidates.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.distance - b.distance;
    });

    return candidates[0];
  }

  function findSnapPointOfType(screenPoint: Point, entities: Entity[], snapType: SnapType): SnapResult | null {
    const candidates: SnapResult[] = [];

    for (const entity of entities) {
      if (!entity) continue;

      let points: Point[] = [];
      switch (snapType) {
        case SNAP_TYPES.ENDPOINT:
          points = getEndpointSnapPoints(entity);
          break;
        case SNAP_TYPES.MIDPOINT:
          points = getMidpointSnapPoints(entity);
          break;
        case SNAP_TYPES.PERPENDICULAR:
          points = getPerpendicularSnapPoints(entity, screenPoint);
          break;
        case SNAP_TYPES.TANGENT:
          points = getTangentSnapPoints(entity, screenPoint);
          break;
        default:
          points = [];
      }

      for (const pt of points) {
        const dist = distance(screenPoint, pt);
        if (dist <= tolerance) {
          candidates.push({
            point: pt,
            type: snapType,
            distance: dist,
            priority: SNAP_PRIORITY[snapType],
            entityId: entity.id
          });
        }
      }
    }

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.distance - b.distance;
    });

    return candidates[0];
  }

  function findAllSnapPoints(screenPoint: Point, entities: Entity[]): SnapResult[] {
    const results: SnapResult[] = [];

    for (const entity of entities) {
      if (!entity) continue;

      if (enabledTypes.includes(SNAP_TYPES.ENDPOINT)) {
        const endpoints = getEndpointSnapPoints(entity);
        for (const ep of endpoints) {
          const dist = distance(screenPoint, ep);
          if (dist <= tolerance) {
            results.push({
              point: ep,
              type: SNAP_TYPES.ENDPOINT,
              distance: dist,
              entityId: entity.id
            });
          }
        }
      }

      if (enabledTypes.includes(SNAP_TYPES.MIDPOINT)) {
        const midpoints = getMidpointSnapPoints(entity);
        for (const mp of midpoints) {
          const dist = distance(screenPoint, mp);
          if (dist <= tolerance) {
            results.push({
              point: mp,
              type: SNAP_TYPES.MIDPOINT,
              distance: dist,
              entityId: entity.id
            });
          }
        }
      }
    }

    return results;
  }

  return {
    findSnapPoint,
    findSnapPointOfType,
    findAllSnapPoints,
    SNAP_TYPES
  };
}
