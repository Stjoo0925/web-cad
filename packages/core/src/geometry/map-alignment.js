/**
 * map-alignment.js
 * 지도 좌표와 현장 좌표계 간 정합 규칙 모듈
 *
 * 위경도 기반 NAVER 지도와 CAD 현장 좌표 간 1개 이상의 기준점을 이용한 좌표 변환을 지원합니다.
 * 정합 파라미터는 문서별로 저장할 수 있으며, 정합이 없는 문서는 지도 배경만 표시합니다.
 */

/**
 * 정합 파라미터를 생성합니다.
 *
 * @param {Object} options - 정합 옵션
 * @param {Object} options.mapOrigin - 지도 위경도 기준점 { lat, lng }
 * @param {Object} options.cadOrigin - CAD 현장 기준점 { x, y }
 * @param {string} options.projection - 투영 방식 (현재는 "simple-shift"만 지원)
 * @returns {Object} 정합 파라미터
 */
export function createAlignmentParams({ mapOrigin, cadOrigin, projection = "simple-shift" }) {
  return {
    mapOrigin: { ...mapOrigin },
    cadOrigin: { ...cadOrigin },
    projection,
    createdAt: new Date().toISOString()
  };
}

/**
 * 정합 파라미터가 유효한지 검사합니다.
 *
 * @param {Object} params - 정합 파라미터
 * @returns {boolean} 유효 여부
 */
export function isAlignmentValid(params) {
  if (!params) return false;
  if (!params.mapOrigin || !params.cadOrigin) return false;
  if (typeof params.mapOrigin.lat !== "number" || typeof params.mapOrigin.lng !== "number") return false;
  if (typeof params.cadOrigin.x !== "number" || typeof params.cadOrigin.y !== "number") return false;
  return true;
}

/**
 * CAD 세계 좌표를 지도 위경도로 변환합니다.
 *
 * @param {Object} cadPoint - CAD 좌표 { x, y }
 * @param {Object} params - 정합 파라미터
 * @returns {Object} 지도 위경도 { lat, lng }
 */
export function cadToMap(cadPoint, params) {
  if (!isAlignmentValid(params)) {
    // 정합 없으면 원점 반환
    return { lat: 0, lng: 0 };
  }
  return {
    lat: cadPoint.y + params.mapOrigin.lat,
    lng: cadPoint.x + params.mapOrigin.lng
  };
}

/**
 * 지도 위경도를 CAD 세계 좌표로 변환합니다.
 *
 * @param {Object} mapPoint - 지도 위경도 { lat, lng }
 * @param {Object} params - 정합 파라미터
 * @returns {Object} CAD 좌표 { x, y }
 */
export function mapToCad(mapPoint, params) {
  if (!isAlignmentValid(params)) {
    return { x: 0, y: 0 };
  }
  return {
    x: mapPoint.lng - params.cadOrigin.x,
    y: mapPoint.lat - params.cadOrigin.y
  };
}

/**
 * 지도-현장 정합을 위한 기준점을 생성합니다.
 * 좌표계 변환에 사용할 1개 이상의 기준점을 설정합니다.
 *
 * @param {Object} mapPoint - 지도 위경도 좌표 { lat, lng }
 * @param {Object} cadPoint - CAD 현장 좌표 { x, y }
 * @returns {Object} 기준점 { mapPoint, cadPoint }
 */
export function createReferencePoint(mapPoint, cadPoint) {
  return {
    mapPoint: { ...mapPoint },
    cadPoint: { ...cadPoint }
  };
}

/**
 * 정합 파라미터를 JSON 형태로 직렬화합니다.
 *
 * @param {Object} params - 정합 파라미터
 * @returns {string} JSON 문자열
 */
export function serializeAlignment(params) {
  return JSON.stringify(params, null, 2);
}

/**
 * JSON 문자열에서 정합 파라미터를 역직렬화합니다.
 *
 * @param {string} json - JSON 문자열
 * @returns {Object} 정합 파라미터
 */
export function deserializeAlignment(json) {
  const parsed = JSON.parse(json);
  if (!isAlignmentValid(parsed)) {
    throw new Error("정합 파라미터가 유효하지 않습니다");
  }
  return parsed;
}

/**
 * 문서 ID를 키로 하여 정합 파라미터를 저장합니다.
 * 저장소는 로컬 스토리지 또는 파일 시스템을 사용합니다.
 *
 * @param {Object} storage - 저장소 서비스 인스턴스 (LocalStorageService와 호환)
 * @param {string} documentId - 문서 ID
 * @param {Object} params - 정합 파라미터
 */
export async function saveAlignmentForDocument(storage, documentId, params) {
  const key = `documents/${documentId}/alignment.json`;
  await storage.writeJson(key, params);
}

/**
 * 문서 ID에 해당하는 정합 파라미터를 로드합니다.
 *
 * @param {Object} storage - 저장소 서비스 인스턴스
 * @param {string} documentId - 문서 ID
 * @returns {Object|null} 정합 파라미터 (없으면 null)
 */
export async function loadAlignmentForDocument(storage, documentId) {
  const key = `documents/${documentId}/alignment.json`;
  const exists = await storage.exists(key);
  if (!exists) return null;
  const params = await storage.readJson(key);
  return isAlignmentValid(params) ? params : null;
}

/**
 * 정합 좌표 변환 검증 테스트를 수행합니다.
 * 기준점 1개로 설정된 정합이 올바르게 동작하는지 확인합니다.
 *
 * @param {Object} params - 정합 파라미터
 * @returns {Object} 검증 결과 { valid, error }
 */
export function validateAlignmentTransform(params) {
  try {
    const testCad = { x: 100, y: 200 };
    const mapPoint = cadToMap(testCad, params);
    const backToCad = mapToCad(mapPoint, params);

    const tolerance = 0.0001;
    const xDiff = Math.abs(backToCad.x - testCad.x);
    const yDiff = Math.abs(backToCad.y - testCad.y);

    if (xDiff > tolerance || yDiff > tolerance) {
      return { valid: false, error: `좌표 변환 정합 오차 초과: x=${xDiff}, y=${yDiff}` };
    }

    return { valid: true, error: null };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}