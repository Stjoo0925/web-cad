/**
 * snap-engine.js
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
  NEAREST: "nearest"
};

/**
 * 스냅 타입 우선순위 (높을수록 먼저 적용)
 */
const SNAP_PRIORITY = {
  [SNAP_TYPES.ENDPOINT]: 100,
  [SNAP_TYPES.MIDPOINT]: 80,
  [SNAP_TYPES.INTERSECTION]: 90,
  [SNAP_TYPES.CENTER]: 70,
  [SNAP_TYPES.NEAREST]: 50
};

/**
 * 두 점 사이의 거리를 계산합니다.
 *
 * @param {Object} p1 - 점1 { x, y }
 * @param {Object} p2 - 점2 { x, y }
 * @returns {number} 거리
 */
function distance(p1, p2) {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * 두 선분의 교차점을 계산합니다.
 *
 * @param {Object} a1 - 선분1 시작점 { x, y }
 * @param {Object} a2 - 선분1 끝점 { x, y }
 * @param {Object} b1 - 선분2 시작점 { x, y }
 * @param {Object} b2 - 선분2 끝점 { x, y }
 * @returns {Object|null} 교차점 또는 null
 */
function lineLineIntersection(a1, a2, b1, b2) {
  const dx1 = a2.x - a1.x;
  const dy1 = a2.y - a1.y;
  const dx2 = b2.x - b1.x;
  const dy2 = b2.y - b1.y;

  const denom = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denom) < 1e-10) return null; // 평행

  const t = ((b1.x - a1.x) * dy2 - (b1.y - a1.y) * dx2) / denom;
  const u = ((b1.x - a1.x) * dy1 - (b1.y - a1.y) * dx1) / denom;

  // 0~1 범위 내에서 교차하는지 확인
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
 *
 * @param {Object} entity - 엔티티
 * @returns {Object[]} 스냅 포인트 배열
 */
function getEndpointSnapPoints(entity) {
  switch (entity.type) {
    case "LINE":
      return [entity.start, entity.end];
    case "POLYLINE":
    case "LWPOLYLINE":
      return entity.vertices ? [...entity.vertices] : [];
    case "CIRCLE":
      // 원의 경우 네 개의 사분면 끝점
      return [
        { x: entity.center.x + entity.radius, y: entity.center.y },
        { x: entity.center.x - entity.radius, y: entity.center.y },
        { x: entity.center.x, y: entity.center.y + entity.radius },
        { x: entity.center.x, y: entity.center.y - entity.radius }
      ];
    case "ARC":
      if (entity.startAngle !== undefined && entity.endAngle !== undefined) {
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
 *
 * @param {Object} entity - 엔티티
 * @returns {Object[]} 스냅 포인트 배열
 */
function getMidpointSnapPoints(entity) {
  switch (entity.type) {
    case "LINE":
      return [{
        x: (entity.start.x + entity.end.x) / 2,
        y: (entity.start.y + entity.end.y) / 2
      }];
    case "POLYLINE":
    case "LWPOLYLINE":
      if (!entity.vertices || entity.vertices.length < 2) return [];
      const midpoints = [];
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
 * 엔티티 쌍에서 교차점 스냅 포인트를 계산합니다.
 *
 * @param {Object} entity1 - 엔티티1
 * @param {Object} entity2 - 엔티티2
 * @returns {Object[]} 스냅 포인트 배열
 */
function getIntersectionSnapPoints(entity1, entity2) {
  const intersections = [];

  // LINE-LINE 교차
  if (entity1.type === "LINE" && entity2.type === "LINE") {
    const pt = lineLineIntersection(entity1.start, entity1.end, entity2.start, entity2.end);
    if (pt) intersections.push(pt);
  }

  // LINE-POLYLINE 교차
  if (entity1.type === "LINE" && (entity2.type === "POLYLINE" || entity2.type === "LWPOLYLINE")) {
    if (entity2.vertices) {
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
    if (entity1.vertices) {
      for (let i = 0; i < entity1.vertices.length - 1; i++) {
        const pt = lineLineIntersection(
          entity1.vertices[i], entity1.vertices[i + 1],
          entity2.start, entity2.end
        );
        if (pt) intersections.push(pt);
      }
    }
  }

  // POLYLINE-POLYLINE 교차
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
 * 스냅 엔진 인스턴스를 생성합니다.
 *
 * @param {Object} options - 스냅 옵션
 * @param {number} [options.tolerance=SNAP_TOLERANCE] - 스냅 허용 오차 (픽셀)
 * @param {string[]} [options.enabledTypes] - 활성화된 스냅 타입 목록
 * @returns {Object} 스냅 엔진 인스턴스
 */
export function createSnapEngine(options = {}) {
  const {
    tolerance = SNAP_TOLERANCE,
    enabledTypes = Object.values(SNAP_TYPES)
  } = options;

  /**
   * 주어진 화면 좌표에서 가장 가까운 스냅 포인트를 찾습니다.
   *
   * @param {Object} screenPoint - 화면 좌표 { x, y }
   * @param {Object[]} entities - 엔티티 배열
   * @returns {Object|null} 스냅 결과 또는 null
   */
  function findSnapPoint(screenPoint, entities) {
    const candidates = [];

    for (const entity of entities) {
      // 제외할 엔티티 (현재 그리려는 선의 시작점 같은 경우)
      if (!entity) continue;

      // 끝점 스냅
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

      // 중점 스냅
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

    // 교차점 스냅 (엔티티 간 조합)
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

    // 우선순위排序 (높은 우선순위 먼저, 같으면 거리순)
    candidates.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.distance - b.distance;
    });

    return candidates[0];
  }

  /**
   * 특정 스냅 타입만 사용하여 스냅 포인트를 찾습니다.
   *
   * @param {Object} screenPoint - 화면 좌표 { x, y }
   * @param {Object[]} entities - 엔티티 배열
   * @param {string} snapType - 스냅 타입
   * @returns {Object|null} 스냅 결과 또는 null
   */
  function findSnapPointOfType(screenPoint, entities, snapType) {
    const candidates = [];

    for (const entity of entities) {
      if (!entity) continue;

      let points = [];
      switch (snapType) {
        case SNAP_TYPES.ENDPOINT:
          points = getEndpointSnapPoints(entity);
          break;
        case SNAP_TYPES.MIDPOINT:
          points = getMidpointSnapPoints(entity);
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

  /**
   * 모든 활성화된 스냅 타입에 대한 스냅 포인트를 반환합니다.
   *
   * @param {Object} screenPoint - 화면 좌표 { x, y }
   * @param {Object[]} entities - 엔티티 배열
   * @returns {Object[]} 스냅 결과 배열
   */
  function findAllSnapPoints(screenPoint, entities) {
    const results = [];

    for (const entity of entities) {
      if (!entity) continue;

      // 끝점
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

      // 중점
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