/**
 * pts-parser.js
 * PTS (Terrasolid) 포인트 클라우드 텍스트 포맷 파서
 *
 * PTS 파일을 파싱하여 좌표 및 색상(RGB) 정보를 추출합니다.
 * PTS 형식: X Y Z R G B 또는 X Y Z 만 있는 경우도 있음
 */

export const PTS_DEFAULTS = {
  origin: { x: 0, y: 0, z: 0 }
};

/**
 * PTS 텍스트 내용을 파싱합니다.
 *
 * @param {string} content - PTS 파일 텍스트
 * @param {Object} [options] - 파싱 옵션
 * @param {number} [options.skipHeader] - 헤더로 처리할 줄 수 (기본: 0)
 * @returns {Object} 파싱 결과 { positions, colors, pointCount, bbox, origin }
 */
export function parsePts(content, options = {}) {
  const { skipHeader = 0 } = options;
  const lines = content.split("\n");

  const positions = [];
  const colors = [];
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  let lineIndex = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;

    // 헤더 줄 건너뛰기
    if (lineIndex < skipHeader) {
      lineIndex++;
      continue;
    }

    // PTS 형식은 탭 또는 공백으로 분리
    const parts = trimmed.split(/\s+/);
    if (parts.length < 3) {
      lineIndex++;
      continue;
    }

    const x = parseFloat(parts[0]);
    const y = parseFloat(parts[1]);
    const z = parseFloat(parts[2]);

    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      lineIndex++;
      continue;
    }

    positions.push({ x, y, z });

    // 색상 정보 파싱 (선택적, 6개 이상 값이 있을 때)
    if (parts.length >= 6) {
      const r = parseFloat(parts[3]);
      const g = parseFloat(parts[4]);
      const b = parseFloat(parts[5]);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        // RGB가 0-255 범위일 경우 0-1로 정규화
        const normalizedR = r > 1 ? r / 255 : r;
        const normalizedG = g > 1 ? g / 255 : g;
        const normalizedB = b > 1 ? b / 255 : b;
        colors.push({ r: normalizedR, g: normalizedG, b: normalizedB });
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

    lineIndex++;
  }

  const pointCount = positions.length;

  // bbox 계산
  const bbox = (pointCount > 0) ? {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
    center: {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      z: (minZ + maxZ) / 2
    }
  } : {
    min: { x: 0, y: 0, z: 0 },
    max: { x: 0, y: 0, z: 0 },
    center: { x: 0, y: 0, z: 0 }
  };

  // origin = bbox center
  const origin = { ...bbox.center };

  return { positions, colors, pointCount, bbox, origin };
}

/**
 * PTS 파일 내용을 검증합니다.
 *
 * @param {string} content - PTS 파일 텍스트
 * @param {number} [skipHeader=0] - 건너뛸 헤더 줄 수
 * @returns {Object} 검증 결과 { valid, error, lineCount }
 */
export function validatePts(content, skipHeader = 0) {
  const lines = content.split("\n");
  let validLineCount = 0;

  for (let i = skipHeader; i < lines.length; i++) {
    const parts = lines[i].trim().split(/\s+/);
    if (parts.length >= 3) {
      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[1]);
      const z = parseFloat(parts[2]);
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        validLineCount++;
      }
    }
  }

  return {
    valid: validLineCount > 0,
    error: validLineCount === 0 ? "PTS 파일에 유효한 좌표가 없습니다" : null,
    lineCount: validLineCount
  };
}