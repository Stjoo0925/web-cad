/**
 * point-cloud-manifest.js
 * 포인트클라우드 메타데이터 저장 구조
 *
 * 원본 파일 참조, 포맷, bbox, pointCount, 색상 모드 가능 여부 등을 저장합니다.
 * 파일서버와 렌더러가 동일한 메타데이터를 재사용합니다.
 */

// 포인트클라우드 포맷 목록
export const POINT_CLOUD_FORMATS = {
  XYZ: "xyz",
  PTS: "pts",
  LAS: "las",
  LAZ: "laz",
  PCD: "pcd",
  UNKNOWN: "unknown"
};

// 색상 모드
export const COLOR_MODES = {
  NONE: "none",
  RGB: "rgb",
  RGBA: "rgba",
  INTENSITY: "intensity",
  CLASSIFICATION: "classification"
};

/**
 * 포인트클라우드 메니페스트(메타데이터)를 생성합니다.
 *
 * @param {Object} options - 메타데이터 옵션
 * @param {string} options.assetId - 애셋 ID
 * @param {string} options.documentId - 문서 ID
 * @param {string} options.format - 포인트클라우드 포맷 (POINT_CLOUD_FORMATS)
 * @param {string} options.originalFileName - 원본 파일명
 * @param {string} [options.originalPath] - 저장소 내 원본 파일 경로
 * @param {number} options.pointCount - 포인트 수
 * @param {Object} options.bbox - 바운딩 박스 { min, max, center }
 * @param {string} [options.colorMode] - 색상 모드 (COLOR_MODES)
 * @param {Object} [options.colorStats] - 색상 통계 { minR, maxR, ... }
 * @param {number} [options.fileSizeBytes] - 파일 크기 (바이트)
 * @returns {Object} 포인트클라우드 메니페스트
 */
export function createPointCloudManifest({
  assetId,
  documentId,
  format,
  originalFileName,
  originalPath = null,
  pointCount,
  bbox,
  colorMode = COLOR_MODES.NONE,
  colorStats = null,
  fileSizeBytes = null
}) {
  return {
    assetId,
    documentId,
    format,
    originalFileName,
    originalPath,
    pointCount,
    bbox: bbox ? { ...bbox } : null,
    colorMode,
    colorStats: colorStats ? { ...colorStats } : null,
    fileSizeBytes,
    version: "1.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * 메니페스트에서 필수 필드가 누락되지 않았는지 검증합니다.
 *
 * @param {Object} manifest - 메니페스트 객체
 * @returns {Object} 검증 결과 { valid, errors }
 */
export function validateManifest(manifest) {
  const errors = [];

  if (!manifest) {
    return { valid: false, errors: ["메니페스트가 null입니다"] };
  }

  const requiredFields = ["assetId", "documentId", "format", "originalFileName", "pointCount"];
  for (const field of requiredFields) {
    if (!manifest[field]) {
      errors.push(`필수 필드 누락: ${field}`);
    }
  }

  if (manifest.pointCount !== undefined && manifest.pointCount < 0) {
    errors.push("pointCount는 0 이상이어야 합니다");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 메니페스트가 유효한지 간단히 확인합니다.
 *
 * @param {Object} manifest - 메니페스트 객체
 * @returns {boolean} 유효 여부
 */
export function isManifestValid(manifest) {
  return validateManifest(manifest).valid;
}

/**
 * 메니페스트의 포맷이 지원되는지 확인합니다.
 *
 * @param {string} format - 포맷 문자열
 * @returns {boolean} 지원 여부
 */
export function isFormatSupported(format) {
  return Object.values(POINT_CLOUD_FORMATS).includes(format);
}

/**
 * 메니페스트를 JSON으로 직렬화합니다.
 *
 * @param {Object} manifest - 메니페스트
 * @returns {string} JSON 문자열
 */
export function serializeManifest(manifest) {
  return JSON.stringify(manifest, null, 2);
}

/**
 * JSON에서 메니페스트를 역직렬화합니다.
 *
 * @param {string} json - JSON 문자열
 * @returns {Object} 메니페스트
 */
export function deserializeManifest(json) {
  const parsed = JSON.parse(json);
  if (!isManifestValid(parsed)) {
    throw new Error("메타데이터가 유효하지 않습니다");
  }
  return parsed;
}

/**
 * 메니페스트를 저장소 경로로 변환합니다.
 *
 * @param {string} documentId - 문서 ID
 * @param {string} assetId - 애셋 ID
 * @returns {string} 메니페스트 저장소 경로
 */
export function manifestPath(documentId, assetId) {
  return `documents/${documentId}/derived/${assetId}/metadata.json`;
}