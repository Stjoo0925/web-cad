/**
 * point-cloud-manifest.ts
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
} as const;

export type PointCloudFormat = typeof POINT_CLOUD_FORMATS[keyof typeof POINT_CLOUD_FORMATS];

// 색상 모드
export const COLOR_MODES = {
  NONE: "none",
  RGB: "rgb",
  RGBA: "rgba",
  INTENSITY: "intensity",
  CLASSIFICATION: "classification"
} as const;

export type ColorMode = typeof COLOR_MODES[keyof typeof COLOR_MODES];

export interface BoundingBox {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
  center: { x: number; y: number; z: number };
}

export interface ColorStats {
  minR: number;
  maxR: number;
  minG: number;
  maxG: number;
  minB: number;
  maxB: number;
}

export interface PointCloudManifest {
  assetId: string;
  documentId: string;
  format: string;
  originalFileName: string;
  originalPath: string | null;
  pointCount: number;
  bbox: BoundingBox | null;
  colorMode: string;
  colorStats: ColorStats | null;
  fileSizeBytes: number | null;
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManifestOptions {
  assetId: string;
  documentId: string;
  format: string;
  originalFileName: string;
  originalPath?: string | null;
  pointCount: number;
  bbox: BoundingBox;
  colorMode?: string;
  colorStats?: ColorStats | null;
  fileSizeBytes?: number | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * 포인트클라우드 메니페스트(메타데이터)를 생성합니다.
 *
 * @param options - 메타데이터 옵션
 * @param options.assetId - 애셋 ID
 * @param options.documentId - 문서 ID
 * @param options.format - 포인트클라우드 포맷 (POINT_CLOUD_FORMATS)
 * @param options.originalFileName - 원본 파일명
 * @param options.originalPath - 저장소 내 원본 파일 경로
 * @param options.pointCount - 포인트 수
 * @param options.bbox - 바운딩 박스 { min, max, center }
 * @param options.colorMode - 색상 모드 (COLOR_MODES)
 * @param options.colorStats - 색상 통계 { minR, maxR, ... }
 * @param options.fileSizeBytes - 파일 크기 (바이트)
 * @returns 포인트클라우드 메니페스트
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
}: ManifestOptions): PointCloudManifest {
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
 * @param manifest - 메니페스트 객체
 * @returns 검증 결과 { valid, errors }
 */
export function validateManifest(manifest: unknown): ValidationResult {
  const errors: string[] = [];

  if (!manifest) {
    return { valid: false, errors: ["메니페스트가 null입니다"] };
  }

  const m = manifest as Record<string, unknown>;
  const requiredFields = ["assetId", "documentId", "format", "originalFileName", "pointCount"];
  for (const field of requiredFields) {
    if (!m[field]) {
      errors.push(`필수 필드 누락: ${field}`);
    }
  }

  if (m.pointCount !== undefined && (m.pointCount as number) < 0) {
    errors.push("pointCount는 0 이상이어야 합니다");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 메니페스트가 유효한지 간단히 확인합니다.
 *
 * @param manifest - 메니페스트 객체
 * @returns 유효 여부
 */
export function isManifestValid(manifest: unknown): boolean {
  return validateManifest(manifest).valid;
}

/**
 * 메니페스트의 포맷이 지원되는지 확인합니다.
 *
 * @param format - 포맷 문자열
 * @returns 지원 여부
 */
export function isFormatSupported(format: string): boolean {
  return Object.values(POINT_CLOUD_FORMATS).includes(format as PointCloudFormat);
}

/**
 * 메니페스트를 JSON으로 직렬화합니다.
 *
 * @param manifest - 메니페스트
 * @returns JSON 문자열
 */
export function serializeManifest(manifest: PointCloudManifest): string {
  return JSON.stringify(manifest, null, 2);
}

/**
 * JSON에서 메니페스트를 역직렬화합니다.
 *
 * @param json - JSON 문자열
 * @returns 메니페스트
 */
export function deserializeManifest(json: string): PointCloudManifest {
  const parsed = JSON.parse(json) as PointCloudManifest;
  if (!isManifestValid(parsed)) {
    throw new Error("메타데이터가 유효하지 않습니다");
  }
  return parsed;
}

/**
 * 메니페스트를 저장소 경로로 변환합니다.
 *
 * @param documentId - 문서 ID
 * @param assetId - 애셋 ID
 * @returns 메니페스트 저장소 경로
 */
export function manifestPath(documentId: string, assetId: string): string {
  return `documents/${documentId}/derived/${assetId}/metadata.json`;
}