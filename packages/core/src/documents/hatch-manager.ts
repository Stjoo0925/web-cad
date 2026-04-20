/**
 * hatch-manager.ts
 * 해치/치수/주석 엔티티 관리 모듈
 *
 * HATCH, DIMENSION, LEADER(주석 인도선), MTEXT(다중행 텍스트) 엔티티를 관리합니다.
 */

// 주요 해치 패턴 타입
export const HATCH_PATTERN_TYPES = {
  PREDEFINED: "predefined",
  USER_DEFINED: "user_defined",
  CUSTOM: "custom"
} as const;

export type HatchPatternType = (typeof HATCH_PATTERN_TYPES)[keyof typeof HATCH_PATTERN_TYPES];

// 해치 스타일
export const HATCH_STYLES = {
  NORMAL: "normal",
  OUTER: "outer",
  IGNORE: "ignore"
} as const;

export type HatchStyle = (typeof HATCH_STYLES)[keyof typeof HATCH_STYLES];

// 치수 타입
export const DIMENSION_TYPES = {
  LINEAR: "linear",
  ALIGNED: "aligned",
  ANGULAR: "angular",
  DIAMETER: "diameter",
  RADIUS: "radius",
  ORDINATE: "ordinate"
} as const;

export type DimensionType = (typeof DIMENSION_TYPES)[keyof typeof DIMENSION_TYPES];

export interface HatchEntity {
  id: string;
  patternType: HatchPatternType;
  pattern: string;
  boundaries: unknown[];
  style?: HatchStyle;
  scale?: number;
  rotation?: number;
  layer?: string;
  color?: string;
  metadata: Record<string, unknown>;
}

export interface Point {
  x: number;
  y: number;
}

export interface DimensionEntity {
  id: string;
  type: DimensionType;
  defPoint: Point;
  midPoint: Point;
  xline1Point?: Point;
  xline2Point?: Point;
  deflection?: number;
  angle?: number;
  radius?: number;
  diameter?: number;
  text?: string;
  layer?: string;
  metadata: Record<string, unknown>;
}

export interface LeaderEntity {
  id: string;
  vertices: Point[];
  annotationType?: string;
  annotationId?: string | null;
  layer?: string;
  metadata: Record<string, unknown>;
}

export interface MTextEntity {
  id: string;
  text: string;
  x: number;
  y: number;
  height?: number;
  width?: number;
  attachment?: string;
  style?: string;
  rotation?: number;
  layer?: string;
  metadata: Record<string, unknown>;
}

export interface CreateHatchOptions {
  patternType?: HatchPatternType;
  pattern?: string;
  boundaries?: unknown[];
  style?: HatchStyle;
  scale?: number;
  rotation?: number;
  layer?: string;
  color?: string;
}

export interface UpdateHatchOptions {
  patternType?: HatchPatternType;
  pattern?: string;
  boundaries?: unknown[];
  style?: HatchStyle;
  scale?: number;
  rotation?: number;
  layer?: string;
  color?: string;
}

export interface CreateDimensionOptions {
  type: DimensionType;
  defPoint: Point;
  midPoint: Point;
  xline1Point?: Point;
  xline2Point?: Point;
  deflection?: number;
  angle?: number;
  radius?: number;
  diameter?: number;
  text?: string;
  layer?: string;
}

export interface UpdateDimensionOptions {
  type?: DimensionType;
  defPoint?: Point;
  midPoint?: Point;
  xline1Point?: Point;
  xline2Point?: Point;
  deflection?: number;
  angle?: number;
  radius?: number;
  diameter?: number;
  text?: string;
  layer?: string;
}

export interface CreateLeaderOptions {
  vertices: Point[];
  annotationType?: string;
  annotationId?: string | null;
  layer?: string;
}

export interface UpdateLeaderOptions {
  vertices?: Point[];
  annotationType?: string;
  annotationId?: string;
  layer?: string;
}

export interface CreateMTextOptions {
  text: string;
  x: number;
  y: number;
  height?: number;
  width?: number;
  attachment?: string;
  style?: string;
  rotation?: number;
  layer?: string;
}

export interface UpdateMTextOptions {
  text?: string;
  x?: number;
  y?: number;
  height?: number;
  width?: number;
  attachment?: string;
  style?: string;
  rotation?: number;
  layer?: string;
}

export class HatchManager {
  private readonly hatches: Map<string, HatchEntity>;
  private readonly dimensions: Map<string, DimensionEntity>;
  private readonly leaders: Map<string, LeaderEntity>;
  private readonly mtexts: Map<string, MTextEntity>;
  private _nextId: number;

  constructor() {
    this.hatches = new Map();
    this.dimensions = new Map();
    this.leaders = new Map();
    this.mtexts = new Map();
    this._nextId = 1;
  }

  private _genId(prefix: string): string {
    return `${prefix}-${this._nextId++}`;
  }

  // ========== 해치(HATCH) ==========

  createHatch({ patternType = HATCH_PATTERN_TYPES.PREDEFINED, pattern = "SOLID", boundaries = [], style = HATCH_STYLES.NORMAL, scale = 1, rotation = 0, layer = "0", color }: CreateHatchOptions = {}): HatchEntity {
    const hatch: HatchEntity = {
      id: this._genId("HATCH"),
      patternType,
      pattern,
      boundaries: [...boundaries],
      style,
      scale,
      rotation,
      layer,
      color,
      metadata: {}
    };
    this.hatches.set(hatch.id, hatch);
    return hatch;
  }

  getHatches(): HatchEntity[] {
    return Array.from(this.hatches.values());
  }

  updateHatch(id: string, updates: UpdateHatchOptions): boolean {
    const h = this.hatches.get(id);
    if (!h) return false;
    Object.assign(h, updates);
    return true;
  }

  removeHatch(id: string): boolean {
    return this.hatches.delete(id);
  }

  // ========== 치수(DIMENSION) ==========

  createDimension({ type, defPoint, midPoint, xline1Point, xline2Point, deflection = 0, angle, radius, diameter, text, layer = "0" }: CreateDimensionOptions): DimensionEntity {
    const dim: DimensionEntity = {
      id: this._genId("DIM"),
      type,
      defPoint: { ...defPoint },
      midPoint: { ...midPoint },
      xline1Point: xline1Point ? { ...xline1Point } : undefined,
      xline2Point: xline2Point ? { ...xline2Point } : undefined,
      deflection,
      angle,
      radius,
      diameter,
      text,
      layer,
      metadata: {}
    };
    this.dimensions.set(dim.id, dim);
    return dim;
  }

  createLinearDimension({ xline1Point, xline2Point, dimLinePoint, deflection = 0, layer }: { xline1Point: Point; xline2Point: Point; dimLinePoint: Point; deflection?: number; layer?: string }): DimensionEntity {
    return this.createDimension({
      type: DIMENSION_TYPES.LINEAR,
      defPoint: xline1Point,
      midPoint: dimLinePoint,
      xline1Point,
      xline2Point,
      deflection,
      layer
    });
  }

  createRadiusDimension({ center, dimLinePoint, radius, layer }: { center: Point; dimLinePoint: Point; radius: number; layer?: string }): DimensionEntity {
    return this.createDimension({
      type: DIMENSION_TYPES.RADIUS,
      defPoint: center,
      midPoint: dimLinePoint,
      radius,
      layer
    });
  }

  createDiameterDimension({ center, dimLinePoint, diameter, layer }: { center: Point; dimLinePoint: Point; diameter: number; layer?: string }): DimensionEntity {
    return this.createDimension({
      type: DIMENSION_TYPES.DIAMETER,
      defPoint: center,
      midPoint: dimLinePoint,
      diameter,
      layer
    });
  }

  getDimensions(): DimensionEntity[] {
    return Array.from(this.dimensions.values());
  }

  updateDimension(id: string, updates: UpdateDimensionOptions): boolean {
    const d = this.dimensions.get(id);
    if (!d) return false;
    Object.assign(d, updates);
    return true;
  }

  removeDimension(id: string): boolean {
    return this.dimensions.delete(id);
  }

  // ========== 인도선(LEADER) ==========

  createLeader({ vertices, annotationType = "none", annotationId = null, layer = "0" }: CreateLeaderOptions): LeaderEntity {
    const leader: LeaderEntity = {
      id: this._genId("LEADER"),
      vertices: vertices.map((v) => ({ ...v })),
      annotationType,
      annotationId,
      layer,
      metadata: {}
    };
    this.leaders.set(leader.id, leader);
    return leader;
  }

  getLeaders(): LeaderEntity[] {
    return Array.from(this.leaders.values());
  }

  updateLeader(id: string, updates: UpdateLeaderOptions): boolean {
    const l = this.leaders.get(id);
    if (!l) return false;
    if (updates.vertices) l.vertices = updates.vertices.map((v) => ({ ...v }));
    if (updates.annotationType !== undefined) l.annotationType = updates.annotationType;
    if (updates.annotationId !== undefined) l.annotationId = updates.annotationId;
    if (updates.layer !== undefined) l.layer = updates.layer;
    return true;
  }

  removeLeader(id: string): boolean {
    return this.leaders.delete(id);
  }

  // ========== 다중행 텍스트(MTEXT) ==========

  createMText({ text, x, y, height = 1, width = 0, attachment = "TL", style, rotation = 0, layer = "0" }: CreateMTextOptions): MTextEntity {
    const mtext: MTextEntity = {
      id: this._genId("MTEXT"),
      text,
      x,
      y,
      height,
      width,
      attachment,
      style,
      rotation,
      layer,
      metadata: {}
    };
    this.mtexts.set(mtext.id, mtext);
    return mtext;
  }

  getMTexts(): MTextEntity[] {
    return Array.from(this.mtexts.values());
  }

  updateMText(id: string, updates: UpdateMTextOptions): boolean {
    const m = this.mtexts.get(id);
    if (!m) return false;
    Object.assign(m, updates);
    return true;
  }

  removeMText(id: string): boolean {
    return this.mtexts.delete(id);
  }

  // ========== 직렬화 ==========

  toJSON(): { hatches: number; dimensions: number; leaders: number; mtexts: number } {
    return {
      hatches: this.getHatches().length,
      dimensions: this.getDimensions().length,
      leaders: this.getLeaders().length,
      mtexts: this.getMTexts().length
    };
  }
}