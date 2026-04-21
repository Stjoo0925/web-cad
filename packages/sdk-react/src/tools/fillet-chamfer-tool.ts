/**
 * fillet-chamfer-tool.ts
 * Fillet (모따기) 및 Chamfer (모내기) 도구
 *
 * 두 선분 또는 원호를 연결합니다.
 * - Fillet: 반지름으로 연결
 * - Chamfer: 경사로 연결
 * - Trim/No-Trim 옵션
 */

export interface Point {
  x: number;
  y: number;
}

export interface Line {
  start: Point;
  end: Point;
}

export interface FilletChamferOptions {
  radius?: number; // Fillet 반지름
  distance1?: number; // Chamfer 첫 번째 거리
  distance2?: number; // Chamfer 두 번째 거리
  trimMode?: boolean; // true = trim, false = no trim
}

export interface FilletChamferToolState {
  mode: "fillet" | "chamfer";
  firstEntity: { id: string; type: string; data: unknown } | null;
  isSelectingSecond: boolean;
  radius: number;
  distance1: number;
  distance2: number;
  trimMode: boolean;
}

export interface FilletChamferToolOptions {
  mode?: "fillet" | "chamfer";
  onComplete?: (result: { modified: string[]; added: string[] }) => void;
  onPreview?: (result: unknown) => void;
}

/**
 * Fillet 계산 - 두 선분의 교차점과 반지름 원호 생성
 */
export function calculateFillet(
  line1: Line,
  line2: Line,
  radius: number,
): {
  arcCenter: Point;
  arcStartAngle: number;
  arcEndAngle: number;
  arcRadius: number;
  valid: boolean;
  trimmedLine1?: { start: Point; end: Point };
  trimmedLine2?: { start: Point; end: Point };
} | null {
  // Find intersection point of the two lines
  const intersection = lineLineIntersection(line1, line2);

  if (!intersection) {
    // Parallel lines - cannot fillet
    return null;
  }

  // Calculate angles of the lines
  const angle1 = Math.atan2(
    line1.end.y - line1.start.y,
    line1.end.x - line1.start.x,
  );
  const angle2 = Math.atan2(
    line2.end.y - line2.start.y,
    line2.end.x - line2.start.x,
  );

  // Calculate the angle between the two lines
  let angleDiff = angle2 - angle1;
  while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
  while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

  // The lines must form an angle > 0 and < PI for a valid fillet
  if (
    Math.abs(angleDiff) < 0.01 ||
    Math.abs(Math.abs(angleDiff) - Math.PI) < 0.01
  ) {
    return null;
  }

  // Calculate the offset distances needed to create the fillet
  const offsetDist = radius;

  // For simplicity, we'll create a circular arc
  // This is a simplified implementation
  const arcCenter = intersection;
  const arcRadius = radius;

  // Calculate approximate arc endpoints
  // This is a simplified version - proper implementation would be more complex
  const arcStartAngle = angle1;
  const arcEndAngle = angle1 + angleDiff;

  return {
    arcCenter,
    arcStartAngle,
    arcEndAngle,
    arcRadius,
    valid: true,
    trimmedLine1: {
      start: line1.start,
      end: intersection,
    },
    trimmedLine2: {
      start: intersection,
      end: line2.end,
    },
  };
}

/**
 * Chamfer 계산 - 두 선분의경사면 생성
 */
export function calculateChamfer(
  line1: Line,
  line2: Line,
  distance1: number,
  distance2: number,
): {
  chamferPoints: Point[];
  valid: boolean;
  trimmedLine1?: { start: Point; end: Point };
  trimmedLine2?: { start: Point; end: Point };
} | null {
  const intersection = lineLineIntersection(line1, line2);

  if (!intersection) {
    return null;
  }

  // Calculate points along each line at the specified distances
  const len1 = lineLength(line1);
  const len2 = lineLength(line2);

  if (len1 < distance1 || len2 < distance2) {
    return null;
  }

  // Point along line1 at distance1 from intersection
  const dir1 = {
    x: (intersection.x - line1.start.x) / len1,
    y: (intersection.y - line1.start.y) / len1,
  };

  // Point along line2 at distance2 from intersection
  const dir2 = {
    x: (intersection.x - line2.start.x) / len2,
    y: (intersection.y - line2.start.y) / len2,
  };

  const point1 = {
    x: intersection.x - dir1.x * distance1,
    y: intersection.y - dir1.y * distance1,
  };

  const point2 = {
    x: intersection.x - dir2.x * distance2,
    y: intersection.y - dir2.y * distance2,
  };

  return {
    chamferPoints: [point1, intersection, point2],
    valid: true,
    trimmedLine1: {
      start: line1.start,
      end: point1,
    },
    trimmedLine2: {
      start: point2,
      end: line2.end,
    },
  };
}

/**
 * 두 선분의 교차점 계산
 */
export function lineLineIntersection(line1: Line, line2: Line): Point | null {
  const x1 = line1.start.x;
  const y1 = line1.start.y;
  const x2 = line1.end.x;
  const y2 = line1.end.y;
  const x3 = line2.start.x;
  const y3 = line2.start.y;
  const x4 = line2.end.x;
  const y4 = line2.end.y;

  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  if (Math.abs(denom) < 1e-10) {
    return null; // Parallel lines
  }

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;

  return {
    x: x1 + t * (x2 - x1),
    y: y1 + t * (y2 - y1),
  };
}

/**
 * 선분 길이 계산
 */
export function lineLength(line: Line): number {
  return Math.hypot(line.end.x - line.start.x, line.end.y - line.start.y);
}

/**
 * Fillet/Chamfer 도구 인스턴스
 */
export function createFilletChamferTool(
  options: FilletChamferToolOptions = {},
) {
  const { mode = "fillet", onComplete, onPreview } = options;

  const state: FilletChamferToolState = {
    mode,
    firstEntity: null,
    isSelectingSecond: false,
    radius: 5,
    distance1: 5,
    distance2: 5,
    trimMode: true,
  };

  /**
   * 첫 번째 엔티티 선택
   */
  function selectFirst(entity: {
    id: string;
    type: string;
    data: unknown;
  }): void {
    state.firstEntity = entity;
    state.isSelectingSecond = true;

    if (onPreview) {
      onPreview({ state: "select-second" });
    }
  }

  /**
   * 두 번째 엔티티 선택 및 fillet/chamfer 수행
   */
  function selectSecond(entity: {
    id: string;
    type: string;
    data: unknown;
  }): { modified: string[]; added: string[] } | null {
    if (!state.firstEntity || !state.isSelectingSecond) {
      return null;
    }

    state.isSelectingSecond = false;

    // Calculate fillet or chamfer
    let result: { modified: string[]; added: string[] } | null = null;

    if (state.mode === "fillet") {
      result = performFillet(state.firstEntity, entity);
    } else {
      result = performChamfer(state.firstEntity, entity);
    }

    if (result && onComplete) {
      onComplete(result);
    }

    // Reset for next use
    state.firstEntity = null;

    return result;
  }

  function performFillet(
    entity1: { id: string; type: string; data: unknown },
    entity2: { id: string; type: string; data: unknown },
  ): { modified: string[]; added: string[] } {
    // Simplified - just return the two entities for now
    return {
      modified: [entity1.id, entity2.id],
      added: [],
    };
  }

  function performChamfer(
    entity1: { id: string; type: string; data: unknown },
    entity2: { id: string; type: string; data: unknown },
  ): { modified: string[]; added: string[] } {
    // Simplified - just return the two entities for now
    return {
      modified: [entity1.id, entity2.id],
      added: [],
    };
  }

  function cancel(): void {
    state.firstEntity = null;
    state.isSelectingSecond = false;
    if (onPreview) {
      onPreview(null);
    }
  }

  function setMode(mode: "fillet" | "chamfer"): void {
    state.mode = mode;
  }

  function setRadius(radius: number): void {
    state.radius = Math.max(0, radius);
  }

  function setDistances(d1: number, d2?: number): void {
    state.distance1 = Math.max(0, d1);
    state.distance2 = d2 !== undefined ? Math.max(0, d2) : d1;
  }

  function setTrimMode(enabled: boolean): void {
    state.trimMode = enabled;
  }

  function getState(): FilletChamferToolState {
    return { ...state };
  }

  function isSelectingSecond(): boolean {
    return state.isSelectingSecond;
  }

  return {
    selectFirst,
    selectSecond,
    cancel,
    setMode,
    setRadius,
    setDistances,
    setTrimMode,
    getState,
    isSelectingSecond,
  };
}
