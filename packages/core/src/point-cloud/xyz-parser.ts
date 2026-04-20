/**
 * xyz-parser.ts
 * XYZ 텍스트 포맷 파서
 *
 * XYZ 파일을 파싱하여 좌표 및 색상 정보를 추출합니다.
 * 각 줄은 "X Y Z [R G B]" 형식을 따릅니다.
 */

export const XYZ_DEFAULTS = {
  origin: { x: 0, y: 0, z: 0 }
};

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Color3 {
  r: number;
  g: number;
  b: number;
}

export interface BoundingBox {
  min: Point3D;
  max: Point3D;
  center: Point3D;
}

export interface XyzParseResult {
  positions: Point3D[];
  colors: (Color3 | null)[];
  pointCount: number;
  bbox: BoundingBox;
  origin: Point3D;
}

export interface XyzValidationResult {
  valid: boolean;
  error: string | null;
  lineCount: number;
}

/**
 * XYZ 텍스트 내용을 파싱합니다.
 *
 * @param content - XYZ 파일 텍스트
 * @returns 파싱 결과 { positions, colors, pointCount, bbox, origin }
 */
export function parseXyz(content: string): XyzParseResult {
  const lines = content.split("\n").filter((line) => {
    const trimmed = line.trim();
    return trimmed.length > 0 && !trimmed.startsWith("#");
  });

  const positions: Point3D[] = [];
  const colors: (Color3 | null)[] = [];
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 3) continue;

    const x = parseFloat(parts[0]);
    const y = parseFloat(parts[1]);
    const z = parseFloat(parts[2]);

    if (isNaN(x) || isNaN(y) || isNaN(z)) continue;

    positions.push({ x, y, z });

    // 색상 정보 파싱 (선택적)
    if (parts.length >= 6) {
      const r = parseFloat(parts[3]);
      const g = parseFloat(parts[4]);
      const b = parseFloat(parts[5]);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        colors.push({ r: r / 255, g: g / 255, b: b / 255 });
      } else {
        colors.push(null);
      }
    } else {
      colors.push(null);
    }

    // bbox 갱신
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }

  const pointCount = positions.length;

  // bbox 계산
  const bbox: BoundingBox = {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
    center: {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      z: (minZ + maxZ) / 2
    }
  };

  // origin = bbox center (파일이 대규모 좌표일 경우 오프셋 용)
  const origin: Point3D = { ...bbox.center };

  return { positions, colors, pointCount, bbox, origin };
}

/**
 * XYZ 파일 내용을 검증합니다.
 *
 * @param content - XYZ 파일 텍스트
 * @returns 검증 결과 { valid, error, lineCount }
 */
export function validateXyz(content: string): XyzValidationResult {
  const lines = content.split("\n").filter((l) => l.trim().length > 0 && !l.trim().startsWith("#"));
  if (lines.length === 0) {
    return { valid: false, error: "XYZ 파일이 비어 있습니다", lineCount: 0 };
  }

  let validLineCount = 0;
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length >= 3) {
      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[1]);
      const z = parseFloat(parts[2]);
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        validLineCount++;
      }
    }
  }

  return { valid: validLineCount > 0, error: null, lineCount: validLineCount };
}