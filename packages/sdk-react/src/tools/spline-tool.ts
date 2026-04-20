/**
 * spline-tool.ts
 * 스플라인(SPLINE) 그리기 도구
 *
 * 여러 클릭으로 제어점을 지정하여 스플라인(Bezier/NURBS) 곡선을 생성합니다.
 * - 통과점 지정 (fit point) 또는 제어점 지정 (control vertex)
 * - 차수(Degree) 설정
 * - 창닫기 옵션
 */

export interface Point {
  x: number;
  y: number;
}

export interface SplineEntity {
  id: string;
  type: "SPLINE";
  /** 제어점 (Control Vertices) */
  controlVertices: Point[];
  /** 차수 (Degree) */
  degree: number;
  /** 닫힘 여부 */
  closed: boolean;
  /** Knot 벡터 (optional, auto-generated if not provided) */
  knots?: number[];
  layer: string;
  color: string;
}

export interface CreateEntityCommand {
  type: "CREATE_ENTITY";
  entityType: "SPLINE";
  entityId: string;
  params: {
    controlVertices: Point[];
    degree: number;
    closed: boolean;
    knots?: number[];
    layer: string;
    color: string;
  };
}

export interface SplineToolState {
  controlVertices: Point[];
  isDrawing: boolean;
  degree: number;
  closed: boolean;
  /** 연속 실행 모드 */
  continuousMode: boolean;
}

export interface SplineToolOptions {
  onComplete?: (
    entity: SplineEntity,
    command: CreateEntityCommand,
  ) => void;
  onPreview?: (entity: SplineEntity) => void;
  defaultDegree?: number;
}

/**
 * SPLINE 도구 인스턴스를 생성합니다.
 */
export function createSplineTool(options: SplineToolOptions = {}) {
  const { onComplete, onPreview, defaultDegree = 3 } = options;

  const state: SplineToolState = {
    controlVertices: [],
    isDrawing: false,
    degree: defaultDegree,
    closed: false,
    continuousMode: true,
  };

  /**
   * Knot 벡터 자동 생성
   * NURBS 스플라인용
   */
  function generateKnotVector(
    numControlPoints: number,
    degree: number,
    closed: boolean,
  ): number[] {
    const numKnots = numControlPoints + degree + 1;
    const knots: number[] = [];

    // Simple uniform knot vector
    for (let i = 0; i < numKnots; i++) {
      if (i <= degree) {
        knots.push(0);
      } else if (i >= numKnots - degree - 1) {
        knots.push(1);
      } else {
        knots.push((i - degree) / (numKnots - 2 * degree - 1));
      }
    }

    return knots;
  }

  /**
   * 클릭: 제어점 추가
   * 더블클릭: 스플라인 완료
   * C: 창닫기
   */
  function handleClick(screenPoint: Point): SplineEntity | null {
    if (!state.isDrawing) {
      // Start new spline
      state.isDrawing = true;
      state.controlVertices = [{ ...screenPoint }];

      if (onPreview) {
        onPreview(createSplineEntity());
      }
      return null;
    } else {
      // Add control vertex
      // Minimum points needed: degree + 1
      state.controlVertices.push({ ...screenPoint });

      if (onPreview && state.controlVertices.length >= 2) {
        onPreview(createSplineEntity());
      }

      // Don't complete yet - wait for double-click
      return null;
    }
  }

  /**
   * 더블클릭: 스플라인 완료
   */
  function handleDoubleClick(): SplineEntity | null {
    if (!state.isDrawing || state.controlVertices.length < state.degree + 1) {
      cancel();
      return null;
    }

    const entity = createSplineEntity();
    const command = createCreateSplineCommand(entity);

    if (onComplete) {
      onComplete(entity, command);
    }

    const result = entity;

    // Reset for next use (continuous mode)
    if (state.continuousMode) {
      // Keep last point as start of next spline if we have enough
      const lastPoint = state.controlVertices[state.controlVertices.length - 1];
      state.controlVertices = lastPoint ? [lastPoint] : [];
      // Don't reset isDrawing - continue adding points
    } else {
      state.isDrawing = false;
      state.controlVertices = [];
    }

    return result;
  }

  /**
   * C키: 현재 스플라인 닫기
   */
  function closeSpline(): SplineEntity | null {
    if (!state.isDrawing || state.controlVertices.length < 3) {
      return null;
    }

    state.closed = true;

    const entity = createSplineEntity();
    const command = createCreateSplineCommand(entity);

    if (onComplete) {
      onComplete(entity, command);
    }

    const result = entity;

    // Reset
    state.isDrawing = false;
    state.controlVertices = [];
    state.closed = false;

    return result;
  }

  function handleMove(screenPoint: Point) {
    if (!state.isDrawing || state.controlVertices.length < 1) return;

    // Preview shows the line from last control point to current mouse
    if (onPreview) {
      onPreview(createSplineEntity());
    }
  }

  function cancel() {
    state.controlVertices = [];
    state.isDrawing = false;
    state.closed = false;
  }

  function setDegree(degree: number) {
    // Degree must be >= 2 and <= number of points - 1
    state.degree = Math.max(2, Math.min(degree, 10));
  }

  function setContinuousMode(enabled: boolean) {
    state.continuousMode = enabled;
  }

  function getState(): SplineToolState {
    return { ...state };
  }

  function getPreviewEntity(): SplineEntity | null {
    if (state.controlVertices.length < 1) return null;
    return createSplineEntity();
  }

  /**
   * SPLINE 엔티티 생성
   */
  function createSplineEntity(): SplineEntity {
    const vertices = [...state.controlVertices];

    // If we have more than degree + 1 points, we can create the spline
    // Otherwise just return the control polygon
    return {
      id: generateEntityId(),
      type: "SPLINE",
      controlVertices: vertices,
      degree: state.degree,
      closed: state.closed,
      knots: generateKnotVector(vertices.length, state.degree, state.closed),
      layer: "0",
      color: "BYLAYER",
    };
  }

  return {
    handleClick,
    handleDoubleClick,
    closeSpline,
    handleMove,
    cancel,
    setDegree,
    setContinuousMode,
    getState,
    getPreviewEntity,
  };
}

/**
 * SPLINE 엔티티를 생성합니다.
 */
export function createSplineEntityFromParams(
  controlVertices: Point[],
  degree: number,
  closed: boolean,
  knots?: number[],
): SplineEntity {
  return {
    id: generateEntityId(),
    type: "SPLINE",
    controlVertices: [...controlVertices],
    degree,
    closed,
    knots: knots ?? generateKnotVectorAuto(controlVertices.length, degree, closed),
    layer: "0",
    color: "BYLAYER",
  };
}

/**
 * Knot 벡터 자동 생성 유틸리티
 */
function generateKnotVectorAuto(
  numControlPoints: number,
  degree: number,
  closed: boolean,
): number[] {
  // For a simple cubic spline (degree 3)
  // we need n + degree + 1 knots
  const numKnots = numControlPoints + degree + 1;
  const knots: number[] = [];

  for (let i = 0; i < numKnots; i++) {
    if (i <= degree) {
      knots.push(0);
    } else if (i >= numKnots - degree - 1) {
      knots.push(1);
    } else {
      // Uniform distribution between 0 and 1
      knots.push((i - degree) / (numKnots - 2 * degree - 1));
    }
  }

  return knots;
}

/**
 * SPLINE 생성 문서 명령을 생성합니다.
 */
export function createCreateSplineCommand(
  entity: SplineEntity,
): CreateEntityCommand {
  return {
    type: "CREATE_ENTITY",
    entityType: "SPLINE",
    entityId: entity.id,
    params: {
      controlVertices: entity.controlVertices,
      degree: entity.degree,
      closed: entity.closed,
      knots: entity.knots,
      layer: entity.layer,
      color: entity.color,
    },
  };
}

/**
 * 고유 엔티티 ID 생성
 */
function generateEntityId(): string {
  return `spline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * NURBS evaluation helper
 * Calculates a point on the NURBS curve at parameter t
 */
export function evaluateNURBS(
  controlPoints: Point[],
  knots: number[],
  degree: number,
  t: number,
): Point {
  // This is a simplified NURBS evaluation
  // For full NURBS, you'd need proper basis function calculation
  const n = controlPoints.length;

  if (n < 2) return controlPoints[0] ?? { x: 0, y: 0 };

  // Clamp t to [0, 1]
  t = Math.max(0, Math.min(1, t));

  // For simple cubic splines, use de Boor-like interpolation
  // Simplified: just interpolate between control points based on t
  const segmentCount = n - 1;
  const segment = Math.min(Math.floor(t * segmentCount), segmentCount - 1);
  const localT = (t * segmentCount) - segment;

  const p0 = controlPoints[Math.max(0, segment - 1)] ?? controlPoints[0];
  const p1 = controlPoints[segment] ?? controlPoints[0];
  const p2 = controlPoints[Math.min(n - 1, segment + 1)] ?? controlPoints[n - 1];
  const p3 = controlPoints[Math.min(n - 1, segment + 2)] ?? controlPoints[n - 1];

  // Catmull-Rom spline interpolation
  const t2 = localT * localT;
  const t3 = t2 * localT;

  const x =
    0.5 *
    ((2 * p1.x) +
      (-p0.x + p2.x) * localT +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

  const y =
    0.5 *
    ((2 * p1.y) +
      (-p0.y + p2.y) * localT +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

  return { x, y };
}
