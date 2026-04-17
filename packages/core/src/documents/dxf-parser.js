/**
 * dxf-parser.js
 * DXF 파일 파싱 모듈
 *
 * DXF 파일을 읽어 내부 엔티티 컬렉션으로 변환합니다.
 * 지원되는 엔티티: POINT, LINE, LWPOLYLINE, CIRCLE, ARC, TEXT
 * 미지원 엔티티는 경고 후 무시합니다.
 */

// 지원되는 엔티티 타입 목록
const SUPPORTED_ENTITY_TYPES = new Set([
  "POINT",
  "LINE",
  "LWPOLYLINE",
  "POLYLINE",
  "CIRCLE",
  "ARC",
  "TEXT"
]);

// 경고 로그 수집
const warnings = [];

/**
 * DXF 텍스트 내용에서 엔티티 목록을 파싱합니다.
 *
 * @param {string} dxfContent - DXF 파일 텍스트 내용
 * @returns {Object} 파싱 결과 { entities, warnings }
 */
export function parseDxf(dxfContent) {
  warnings.length = 0;
  const lines = dxfContent.split("\n").map((line) => line.trim());
  const entities = [];

  let i = 0;
  // ENTITIES 섹션 시작 전까지 스캔
  while (i < lines.length) {
    if (lines[i] === "ENTITIES") break;
    i++;
  }
  i++; // ENTITIES 다음 줄부터 파싱 시작

  // ENTITIES 섹션 파싱
  while (i < lines.length) {
    // EOF 또는 섹션 끝 확인
    if (lines[i] === "ENDSEC" || lines[i] === "EOF") break;

    // 엔티티 코드 "0" (엔티티 타입 시작)
    if (lines[i] === "0" && i + 1 < lines.length) {
      const entityType = lines[i + 1];

      if (SUPPORTED_ENTITY_TYPES.has(entityType)) {
        const entity = parseEntity(lines, i, entityType);
        if (entity) {
          entities.push(entity);
          i = entity._endIndex;
        } else {
          i += 2;
        }
      } else {
        // 미지원 엔티티 — 경고 추가 후 건너뛰기
        warnings.push(`지원되지 않는 엔티티 타입: ${entityType} — 무시됨`);
        i += 2;
      }
    } else {
      i++;
    }
  }

  return { entities, warnings };
}

/**
 * 특정 엔티티를 파싱합니다.
 *
 * @param {string[]} lines - DXF 라인 배열
 * @param {number} startIndex - 엔티티 시작 인덱스
 * @param {string} entityType - 엔티티 타입
 * @returns {Object|null} 파싱된 엔티티 객체
 */
function parseEntity(lines, startIndex, entityType) {
  const entity = { type: entityType, id: generateEntityId() };
  let i = startIndex + 2;
  const endIndex = findEntityEndIndex(lines, i);

  // 그룹 코드-값 쌍 읽기
  while (i < lines.length && i < endIndex) {
    const groupCode = lines[i];
    const value = lines[i + 1];

    if (groupCode === "8") {
      // 레이어
      entity.layer = value;
    } else if (entityType === "POINT" && groupCode === "10") {
      entity.position = entity.position || {};
      entity.position.x = parseFloat(value);
    } else if (entityType === "POINT" && groupCode === "20") {
      if (!entity.position) entity.position = {};
      entity.position.y = parseFloat(value);
    } else if (entityType === "POINT" && groupCode === "30") {
      if (!entity.position) entity.position = {};
      entity.position.z = parseFloat(value) || 0;
    } else if (entityType === "LINE" && groupCode === "10") {
      entity.start = entity.start || {};
      entity.start.x = parseFloat(value);
    } else if (entityType === "LINE" && groupCode === "20") {
      if (!entity.start) entity.start = {};
      entity.start.y = parseFloat(value);
    } else if (entityType === "LINE" && groupCode === "30") {
      if (!entity.start) entity.start = {};
      entity.start.z = parseFloat(value) || 0;
    } else if (entityType === "LINE" && groupCode === "11") {
      entity.end = entity.end || {};
      entity.end.x = parseFloat(value);
    } else if (entityType === "LINE" && groupCode === "21") {
      if (!entity.end) entity.end = {};
      entity.end.y = parseFloat(value);
    } else if (entityType === "LINE" && groupCode === "31") {
      if (!entity.end) entity.end = {};
      entity.end.z = parseFloat(value) || 0;
    } else if (entityType === "CIRCLE" && groupCode === "10") {
      entity.center = entity.center || {};
      entity.center.x = parseFloat(value);
    } else if (entityType === "CIRCLE" && groupCode === "20") {
      if (!entity.center) entity.center = {};
      entity.center.y = parseFloat(value);
    } else if (entityType === "CIRCLE" && groupCode === "30") {
      if (!entity.center) entity.center = {};
      entity.center.z = parseFloat(value) || 0;
    } else if (entityType === "CIRCLE" && groupCode === "40") {
      entity.radius = parseFloat(value);
    } else if (entityType === "ARC" && groupCode === "10") {
      entity.center = entity.center || {};
      entity.center.x = parseFloat(value);
    } else if (entityType === "ARC" && groupCode === "20") {
      if (!entity.center) entity.center = {};
      entity.center.y = parseFloat(value);
    } else if (entityType === "ARC" && groupCode === "30") {
      if (!entity.center) entity.center = {};
      entity.center.z = parseFloat(value) || 0;
    } else if (entityType === "ARC" && groupCode === "40") {
      entity.radius = parseFloat(value);
    } else if (entityType === "ARC" && groupCode === "50") {
      entity.startAngle = parseFloat(value);
    } else if (entityType === "ARC" && groupCode === "51") {
      entity.endAngle = parseFloat(value);
    } else if (entityType === "TEXT" && groupCode === "10") {
      entity.position = entity.position || {};
      entity.position.x = parseFloat(value);
    } else if (entityType === "TEXT" && groupCode === "20") {
      if (!entity.position) entity.position = {};
      entity.position.y = parseFloat(value);
    } else if (entityType === "TEXT" && groupCode === "30") {
      if (!entity.position) entity.position = {};
      entity.position.z = parseFloat(value) || 0;
    } else if (entityType === "TEXT" && groupCode === "40") {
      entity.height = parseFloat(value);
    } else if (entityType === "TEXT" && groupCode === "1") {
      entity.value = value;
    } else if ((entityType === "LWPOLYLINE" || entityType === "POLYLINE") && groupCode === "90") {
      entity.vertexCount = parseInt(value, 10);
    } else if ((entityType === "LWPOLYLINE" || entityType === "POLYLINE") && groupCode === "70") {
      entity.closed = value === "1";
    } else if ((entityType === "LWPOLYLINE" || entityType === "POLYLINE") && groupCode === "10") {
      entity.vertices = entity.vertices || [];
      const x = parseFloat(value);
      entity.vertices.push({ x });
    } else if ((entityType === "LWPOLYLINE" || entityType === "POLYLINE") && groupCode === "20") {
      if (entity.vertices && entity.vertices.length > 0) {
        entity.vertices[entity.vertices.length - 1].y = parseFloat(value);
      }
    }

    i += 2;
  }

  entity._endIndex = i;
  return entity;
}

/**
 * 엔티티의 끝 인덱스를 찾습니다 (다음 엔티티 시작 전까지).
 *
 * @param {string[]} lines - DXF 라인 배열
 * @param {number} startIndex - 검색 시작 인덱스
 * @returns {number} 엔티티 끝 인덱스
 */
function findEntityEndIndex(lines, startIndex) {
  // 다음 엔티티("0") 또는 섹션 끝까지
  for (let i = startIndex; i < lines.length - 1; i++) {
    if (lines[i] === "0" && i + 1 < lines.length) {
      const next = lines[i + 1];
      if (next === "ENDSEC" || next === "EOF" || SUPPORTED_ENTITY_TYPES.has(next)) {
        return i;
      }
    }
  }
  return lines.length;
}

/**
 * 고유 엔티티 ID 생성
 *
 * @returns {string} UUID 형태의 고유 ID
 */
function generateEntityId() {
  return `entity-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * DXF 파서 경고 메시지를 반환합니다.
 *
 * @returns {string[]} 경고 메시지 배열
 */
export function getDxfParserWarnings() {
  return [...warnings];
}