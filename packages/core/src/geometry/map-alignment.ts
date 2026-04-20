/**
 * map-alignment.ts
 * 지도 좌표와 현장 좌표계 간 정합 규칙 모듈
 *
 * 위경도 기반 NAVER 지도와 CAD 현장 좌표 간 1개 이상의 기준점을 이용한 좌표 변환을 지원합니다.
 * 정합 파라미터는 문서별로 저장할 수 있으며, 정합이 없는 문서는 지도 배경만 표시합니다.
 */

export interface MapPoint {
  lat: number;
  lng: number;
}

export interface CadPoint {
  x: number;
  y: number;
}

export interface CadOrigin {
  x: number;
  y: number;
}

export interface AlignmentParams {
  mapOrigin: MapPoint;
  cadOrigin: CadOrigin;
  projection: string;
  createdAt: string;
}

export interface AlignmentOptions {
  mapOrigin: MapPoint;
  cadOrigin: CadOrigin;
  projection?: string;
}

export interface ReferencePoint {
  mapPoint: MapPoint;
  cadPoint: CadPoint;
}

export interface ValidationResult {
  valid: boolean;
  error: string | null;
}

export interface StorageService {
  writeJson(key: string, data: unknown): Promise<void>;
  readJson(key: string): Promise<unknown>;
  exists(key: string): Promise<boolean>;
}

/**
 * 정합 파라미터를 생성합니다.
 *
 * @param options - 정합 옵션
 * @param options.mapOrigin - 지도 위경도 기준점 { lat, lng }
 * @param options.cadOrigin - CAD 현장 기준점 { x, y }
 * @param options.projection - 투영 방식 (현재는 "simple-shift"만 지원)
 * @returns 정합 파라미터
 */
export function createAlignmentParams({ mapOrigin, cadOrigin, projection = "simple-shift" }: AlignmentOptions): AlignmentParams {
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
 * @param params - 정합 파라미터
 * @returns 유효 여부
 */
export function isAlignmentValid(params: unknown): boolean {
  if (!params) return false;
  const p = params as AlignmentParams;
  if (!p.mapOrigin || !p.cadOrigin) return false;
  if (typeof p.mapOrigin.lat !== "number" || typeof p.mapOrigin.lng !== "number") return false;
  if (typeof p.cadOrigin.x !== "number" || typeof p.cadOrigin.y !== "number") return false;
  return true;
}

/**
 * CAD 세계 좌표를 지도 위경도로 변환합니다.
 *
 * @param cadPoint - CAD 좌표 { x, y }
 * @param params - 정합 파라미터
 * @returns 지도 위경도 { lat, lng }
 */
export function cadToMap(cadPoint: CadPoint, params: AlignmentParams): MapPoint {
  if (!isAlignmentValid(params)) {
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
 * @param mapPoint - 지도 위경도 { lat, lng }
 * @param params - 정합 파라미터
 * @returns CAD 좌표 { x, y }
 */
export function mapToCad(mapPoint: MapPoint, params: AlignmentParams): CadPoint {
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
 * @param mapPoint - 지도 위경도 좌표 { lat, lng }
 * @param cadPoint - CAD 현장 좌표 { x, y }
 * @returns 기준점 { mapPoint, cadPoint }
 */
export function createReferencePoint(mapPoint: MapPoint, cadPoint: CadPoint): ReferencePoint {
  return {
    mapPoint: { ...mapPoint },
    cadPoint: { ...cadPoint }
  };
}

/**
 * 정합 파라미터를 JSON 형태로 직렬화합니다.
 *
 * @param params - 정합 파라미터
 * @returns JSON 문자열
 */
export function serializeAlignment(params: AlignmentParams): string {
  return JSON.stringify(params, null, 2);
}

/**
 * JSON 문자열에서 정합 파라미터를 역직렬화합니다.
 *
 * @param json - JSON 문자열
 * @returns 정합 파라미터
 */
export function deserializeAlignment(json: string): AlignmentParams {
  const parsed = JSON.parse(json) as AlignmentParams;
  if (!isAlignmentValid(parsed)) {
    throw new Error("정합 파라미터가 유효하지 않습니다");
  }
  return parsed;
}

/**
 * 문서 ID를 키로 하여 정합 파라미터를 저장합니다.
 * 저장소는 로컬 스토리지 또는 파일 시스템을 사용합니다.
 *
 * @param storage - 저장소 서비스 인스턴스 (LocalStorageService와 호환)
 * @param documentId - 문서 ID
 * @param params - 정합 파라미터
 */
export async function saveAlignmentForDocument(storage: StorageService, documentId: string, params: AlignmentParams): Promise<void> {
  const key = `documents/${documentId}/alignment.json`;
  await storage.writeJson(key, params);
}

/**
 * 문서 ID에 해당하는 정합 파라미터를 로드합니다.
 *
 * @param storage - 저장소 서비스 인스턴스
 * @param documentId - 문서 ID
 * @returns 정합 파라미터 (없으면 null)
 */
export async function loadAlignmentForDocument(storage: StorageService, documentId: string): Promise<AlignmentParams | null> {
  const key = `documents/${documentId}/alignment.json`;
  const exists = await storage.exists(key);
  if (!exists) return null;
  const params = await storage.readJson(key) as AlignmentParams;
  return isAlignmentValid(params) ? params : null;
}

/**
 * 정합 좌표 변환 검증 테스트를 수행합니다.
 * 기준점 1개로 설정된 정합이 올바르게 동작하는지 확인합니다.
 *
 * @param params - 정합 파라미터
 * @returns 검증 결과 { valid, error }
 */
export function validateAlignmentTransform(params: AlignmentParams): ValidationResult {
  try {
    const testCad: CadPoint = { x: 100, y: 200 };
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
    return { valid: false, error: (err as Error).message };
  }
}