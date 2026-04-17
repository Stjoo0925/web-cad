/**
 * select-tool.js
 * 엔티티 선택 도구 및 히트 테스트 모듈
 *
 * Canvas 2D 뷰포트에서 POINT, LINE, POLYLINE 엔티티의 클릭/더블클릭 선택을 지원합니다.
 * 단일/다중 선택, 선택 해제, 히트 테스트 기능을 제공합니다.
 */

/**
 * 히트 허용 오차 (픽셀)
 */
const HIT_TOLERANCE = 8;

/**
 * 포인트와 세그먼트(선분) 사이의 최소 거리를 계산합니다.
 *
 * @param {Object} p - 테스트할 점 { x, y }
 * @param {Object} a - 선분 시작점 { x, y }
 * @param {Object} b - 선분 끝점 { x, y }
 * @returns {number} 최소 거리 (픽셀)
 */
function pointToSegmentDistance(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    // 선분이 점인 경우
    return Math.hypot(p.x - a.x, p.y - a.y);
  }

  // 선분 위의 투영 비율 t 계산
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  // 투영된 점
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;

  return Math.hypot(p.x - projX, p.y - projY);
}

/**
 * 포인트 엔티티에 대한 히트 테스트를 수행합니다.
 *
 * @param {Object} entity - 엔티티
 * @param {Object} screenPoint - 화면 좌표 { x, y }
 * @param {Object} viewport - 뷰포트 상태
 * @param {number} tolerance - 허용 오차
 * @returns {boolean} 히트 여부
 */
function hitTestPoint(entity, screenPoint, tolerance) {
  const p = entity.position;
  const dist = Math.hypot(screenPoint.x - p.x, screenPoint.y - p.y);
  return dist <= tolerance;
}

/**
 * 라인 엔티티에 대한 히트 테스트를 수행합니다.
 *
 * @param {Object} entity - 엔티티
 * @param {Object} screenPoint - 화면 좌표 { x, y }
 * @param {Object} tolerance - 허용 오차
 * @returns {boolean} 히트 여부
 */
function hitTestLine(entity, screenPoint, tolerance) {
  const dist = pointToSegmentDistance(screenPoint, entity.start, entity.end);
  return dist <= tolerance;
}

/**
 * 폴리라인 엔티티에 대한 히트 테스트를 수행합니다.
 *
 * @param {Object} entity - 엔티티
 * @param {Object} screenPoint - 화면 좌표 { x, y }
 * @param {Object} tolerance - 허용 오차
 * @returns {boolean} 히트 여부
 */
function hitTestPolyline(entity, screenPoint, tolerance) {
  if (!entity.vertices || entity.vertices.length < 2) return false;

  for (let i = 0; i < entity.vertices.length - 1; i++) {
    const dist = pointToSegmentDistance(screenPoint, entity.vertices[i], entity.vertices[i + 1]);
    if (dist <= tolerance) return true;
  }

  // 닫힌 폴리라인의 경우 마지막-첫 버텍스도 확인
  if (entity.closed && entity.vertices.length > 2) {
    const dist = pointToSegmentDistance(
      screenPoint,
      entity.vertices[entity.vertices.length - 1],
      entity.vertices[0]
    );
    if (dist <= tolerance) return true;
  }

  return false;
}

/**
 * 원형 엔티티에 대한 히트 테스트를 수행합니다.
 *
 * @param {Object} entity - 엔티티
 * @param {Object} screenPoint - 화면 좌표 { x, y }
 * @param {Object} tolerance - 허용 오차
 * @returns {boolean} 히트 여부
 */
function hitTestCircle(entity, screenPoint, tolerance) {
  const dist = Math.hypot(screenPoint.x - entity.center.x, screenPoint.y - entity.center.y);
  return Math.abs(dist - entity.radius) <= tolerance;
}

/**
 * 특정 엔티티에 대한 히트 테스트를 수행합니다.
 *
 * @param {Object} entity - 엔티티
 * @param {Object} screenPoint - 화면 좌표 { x, y }
 * @param {Object} viewport - 뷰포트 (현재 미사용, 확대 시Tolerance 조정이 필요할 수 있음)
 * @param {number} [tolerance=HIT_TOLERANCE] - 허용 오차
 * @returns {boolean} 히트 여부
 */
export function hitTest(entity, screenPoint, viewport, tolerance = HIT_TOLERANCE) {
  switch (entity.type) {
    case "POINT":
      return hitTestPoint(entity, screenPoint, tolerance);
    case "LINE":
      return hitTestLine(entity, screenPoint, tolerance);
    case "POLYLINE":
    case "LWPOLYLINE":
      return hitTestPolyline(entity, screenPoint, tolerance);
    case "CIRCLE":
      return hitTestCircle(entity, screenPoint, tolerance);
    default:
      return false;
  }
}

/**
 * 여러 엔티티 중 주어진 화면 좌표와 히트되는 첫 번째 엔티티를 찾습니다.
 *
 * @param {Object[]} entities - 엔티티 배열
 * @param {Object} screenPoint - 화면 좌표 { x, y }
 * @param {Object} viewport - 뷰포트
 * @param {number} [tolerance] - 허용 오차
 * @returns {Object|null} 히트된 엔티티 또는 null
 */
export function hitTestEntities(entities, screenPoint, viewport, tolerance) {
  for (const entity of entities) {
    if (hitTest(entity, screenPoint, viewport, tolerance)) {
      return entity;
    }
  }
  return null;
}

/**
 * 선택 목록을 관리하는 선택기 인스턴스를 생성합니다.
 *
 * @param {Function} [onSelectionChange] - 선택 변경 시 호출될 콜백
 * @returns {Object} 선택기 인스턴스
 */
export function createSelectionManager(onSelectionChange) {
  let selectedIds = [];

  const notify = () => {
    onSelectionChange?.([...selectedIds]);
  };

  /**
   * 단일 엔티티를 선택합니다.
   *
   * @param {Object} entity - 선택할 엔티티
   */
  function select(entity) {
    selectedIds = [entity.id];
    notify();
  }

  /**
   * 여러 엔티티를 선택합니다 (다중 선택).
   *
   * @param {Object[]} entities - 선택할 엔티티 배열
   */
  function selectMultiple(entities) {
    selectedIds = entities.map((e) => e.id);
    notify();
  }

  /**
   * 엔티티를 선택에 추가합니다 (토글).
   *
   * @param {Object} entity - 토글할 엔티티
   */
  function toggle(entity) {
    const idx = selectedIds.indexOf(entity.id);
    if (idx >= 0) {
      selectedIds.splice(idx, 1);
    } else {
      selectedIds.push(entity.id);
    }
    notify();
  }

  /**
   * 모든 선택을 해제합니다.
   */
  function clearSelection() {
    if (selectedIds.length === 0) return;
    selectedIds = [];
    notify();
  }

  /**
   * 현재 선택 목록을 반환합니다.
   *
   * @returns {string[]} 선택된 엔티티 ID 배열
   */
  function getSelection() {
    return [...selectedIds];
  }

  /**
   * 특정 엔티티가 선택되어 있는지 확인합니다.
   *
   * @param {string} entityId - 엔티티 ID
   * @returns {boolean} 선택 여부
   */
  function isSelected(entityId) {
    return selectedIds.includes(entityId);
  }

  return {
    select,
    selectMultiple,
    toggle,
    clearSelection,
    getSelection,
    isSelected
  };
}