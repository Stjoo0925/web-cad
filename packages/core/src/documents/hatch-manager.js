/**
 * hatch-manager.js
 * 해치/치수/주석 엔티티 관리 모듈
 *
 * HATCH (해치), DIMENSION (치수), LEADER (주석 치선), MTEXT (다중 행 텍스트) 엔티티를 관리합니다.
 */

// 주요 해치 패턴 타입
const HATCH_PATTERN_TYPES = {
  PREDEFINED: "predefined",    // ANSI31, ANSI32, AR-B816, etc.
  USER_DEFINED: "user_defined", // 사용자 정의
  CUSTOM: "custom"             // 커스텀
};

// 해치 스타일
const HATCH_STYLES = {
  NORMAL: "normal",
  OUTER: "outer",
  IGNORE: "ignore"
};

// 치수 타입
const DIMENSION_TYPES = {
  LINEAR: "linear",           // 선형 치수
  ALIGNED: "aligned",         // 정렬 치수
  ANGULAR: "angular",         // 각도 치수
  DIAMETER: "diameter",       // 지름 치수
  RADIUS: "radius",           // 반지름 치수
  ORDINATE: "ordinate"       // 좌표 치수
};

/**
 * 해치 엔티티
 *
 * @typedef {Object} HatchEntity
 * @property {string} id - 고유 ID
 * @property {string} patternType - 패턴 타입 (predefined, user_defined, custom)
 * @property {string} pattern - 해치 패턴 이름 (ANSI31, SOLID, etc.)
 * @property {Array} boundaries - 경계선 배열 (엔티티 참조 또는 좌표)
 * @property {string} [style] - 해치 스타일 (normal, outer, ignore)
 * @property {number} [scale=1] - 해치 스케일
 * @property {number} [rotation=0] - 해치 회전 각도 (도)
 * @property {string} [layer="0"] - 소속 레이어
 * @property {string} [color] - 해치 색상
 * @property {Object} [metadata] - 메타데이터
 */

/**
 * 치수 엔티티
 *
 * @typedef {Object} DimensionEntity
 * @property {string} id - 고유 ID
 * @property {string} type - 치수 타입 (linear, aligned, angular, diameter, radius, ordinate)
 * @property {Object} defPoint - 정의점 (measurement 기준점)
 * @property {Object} midPoint - 치수선 중점
 * @property {Object} [xline1Point] - 1차 확장선 기준점 (linear/aligned)
 * @property {Object} [xline2Point] - 2차 확장선 기준점 (linear/aligned)
 * @property {number} [deflection] - 선형 치수 기울기 (도)
 * @property {number} [angle] - 각도 치수 값 (도)
 * @property {number} [radius] - 반지름 치수 반지름
 * @property {number} [diameter] - 지름 치수 지름
 * @property {string} [text] - 치수 텍스트 (자동 계산된 값 override)
 * @property {string} [layer="0"] - 소속 레이어
 * @property {Object} [metadata] - 메타데이터
 */

/**
 * Leader (주석 치선) 엔티티
 *
 * @typedef {Object} LeaderEntity
 * @property {string} id - 고유 ID
 * @property {Array} vertices -顶点 배열 [{x, y}, ...]
 * @property {string} [annotationType] - 주석 타입 (mtext, none)
 * @property {string} [annotationId] - 연결된 주석 ID
 * @property {string} [layer="0"] - 소속 레이어
 * @property {Object} [metadata] - 메타데이터
 */

/**
 * MText (다중 행 텍스트) 엔티티
 *
 * @typedef {Object} MTextEntity
 * @property {string} id - 고유 ID
 * @property {string} text - 텍스트 내용
 * @property {number} x - 기준점 X 좌표
 * @property {number} y - 기준점 Y 좌표
 * @property {number} [height=1] - 텍스트 높이
 * @property {number} [width=0] - 단락 너비 (0 = 제한 없음)
 * @property {string} [attachment="TL"] - 정착점 (TL, TC, TR, ML, MC, MR, BL, BC, BR)
 * @property {string} [style] - 텍스트 스타일
 * @property {number} [rotation=0] - 회전 각도 (도)
 * @property {string} [layer="0"] - 소속 레이어
 * @property {Object} [metadata] - 메타데이터
 */

/**
 * HatchManager 클래스
 *
 * 해치, 치수, Leader, MText 엔티티를 관리합니다.
 */
class HatchManager {
  constructor() {
    /** @type {Map<string, HatchEntity>} */
    this.hatches = new Map();
    /** @type {Map<string, DimensionEntity>} */
    this.dimensions = new Map();
    /** @type {Map<string, LeaderEntity>} */
    this.leaders = new Map();
    /** @type {Map<string, MTextEntity>} */
    this.mtexts = new Map();
    /** @type {number} */
    this._nextId = 1;
  }

  /** 고유 ID 생성 */
  _genId(prefix) {
    return `${prefix}-${this._nextId++}`;
  }

  // ========== HATCH ==========

  /**
   * 해치를 생성합니다.
   *
   * @param {Object} options - 해치 옵션
   * @param {string} [options.patternType] - 패턴 타입
   * @param {string} [options.pattern="SOLID"] - 해치 패턴
   * @param {Array} [options.boundaries=[]] - 경계선
   * @param {string} [options.style="normal"] - 해치 스타일
   * @param {number} [options.scale=1] - 스케일
   * @param {number} [options.rotation=0] - 회전
   * @param {string} [options.layer="0"] - 레이어
   * @param {string} [options.color] - 색상
   * @returns {HatchEntity}
   */
  createHatch({ patternType = HATCH_PATTERN_TYPES.PREDEFINED, pattern = "SOLID", boundaries = [], style = HATCH_STYLES.NORMAL, scale = 1, rotation = 0, layer = "0", color }) {
    const hatch = {
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

  /**
   * 모든 해치 목록을 조회합니다.
   * @returns {HatchEntity[]}
   */
  getHatches() {
    return Array.from(this.hatches.values());
  }

  /**
   * 해치를 수정합니다.
   * @param {string} id
   * @param {Partial<HatchEntity>} updates
   * @returns {boolean}
   */
  updateHatch(id, updates) {
    const h = this.hatches.get(id);
    if (!h) return false;
    Object.assign(h, updates);
    return true;
  }

  /**
   * 해치를 삭제합니다.
   * @param {string} id
   * @returns {boolean}
   */
  removeHatch(id) {
    return this.hatches.delete(id);
  }

  // ========== DIMENSION ==========

  /**
   * 치수를 생성합니다.
   *
   * @param {Object} options - 치수 옵션
   * @param {string} options.type - 치수 타입
   * @param {Object} options.defPoint - 정의점
   * @param {Object} options.midPoint - 치수선 중점
   * @param {Object} [options.xline1Point] - 1차 확장선 기준점
   * @param {Object} [options.xline2Point] - 2차 확장선 기준점
   * @param {number} [options.deflection=0] - 기울기 (linear)
   * @param {number} [options.angle] - 각도 값 (angular)
   * @param {number} [options.radius] - 반지름 (radius)
   * @param {number} [options.diameter] - 지름 (diameter)
   * @param {string} [options.text] - 치수 텍스트
   * @param {string} [options.layer="0"]
   * @returns {DimensionEntity}
   */
  createDimension({ type, defPoint, midPoint, xline1Point, xline2Point, deflection = 0, angle, radius, diameter, text, layer = "0" }) {
    const dim = {
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

  /**
   * 선형 치수를 생성합니다.
   *
   * @param {Object} opts
   * @param {Object} opts.xline1Point - 1차 확장선 기준점
   * @param {Object} opts.xline2Point - 2차 확장선 기준점
   * @param {Object} opts.dimLinePoint - 치수선 위치
   * @param {number} [opts.deflection=0] - 기울기 (도)
   * @param {string} [opts.layer="0"]
   * @returns {DimensionEntity}
   */
  createLinearDimension({ xline1Point, xline2Point, dimLinePoint, deflection = 0, layer }) {
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

  /**
   * 반지름 치수를 생성합니다.
   *
   * @param {Object} opts
   * @param {Object} opts.center - 원 중심
   * @param {Object} opts.dimLinePoint - 치수선 위치
   * @param {number} opts.radius - 반지름
   * @param {string} [opts.layer="0"]
   * @returns {DimensionEntity}
   */
  createRadiusDimension({ center, dimLinePoint, radius, layer }) {
    return this.createDimension({
      type: DIMENSION_TYPES.RADIUS,
      defPoint: center,
      midPoint: dimLinePoint,
      radius,
      layer
    });
  }

  /**
   * 지름 치수를 생성합니다.
   *
   * @param {Object} opts
   * @param {Object} opts.center - 원 중심
   * @param {Object} opts.dimLinePoint - 치수선 위치
   * @param {number} opts.diameter - 지름
   * @param {string} [opts.layer="0"]
   * @returns {DimensionEntity}
   */
  createDiameterDimension({ center, dimLinePoint, diameter, layer }) {
    return this.createDimension({
      type: DIMENSION_TYPES.DIAMETER,
      defPoint: center,
      midPoint: dimLinePoint,
      diameter,
      layer
    });
  }

  /**
   * 모든 치수 목록을 조회합니다.
   * @returns {DimensionEntity[]}
   */
  getDimensions() {
    return Array.from(this.dimensions.values());
  }

  /**
   * 치수를 수정합니다.
   * @param {string} id
   * @param {Partial<DimensionEntity>} updates
   * @returns {boolean}
   */
  updateDimension(id, updates) {
    const d = this.dimensions.get(id);
    if (!d) return false;
    Object.assign(d, updates);
    return true;
  }

  /**
   * 치수를 삭제합니다.
   * @param {string} id
   * @returns {boolean}
   */
  removeDimension(id) {
    return this.dimensions.delete(id);
  }

  // ========== LEADER ==========

  /**
   * Leader (주석 치선)를 생성합니다.
   *
   * @param {Object} options
   * @param {Array} options.vertices -顶点 배열 [{x, y}, ...]
   * @param {string} [options.annotationType] - 주석 타입 (mtext, none)
   * @param {string} [options.annotationId] - 연결된 주석 ID
   * @param {string} [options.layer="0"]
   * @returns {LeaderEntity}
   */
  createLeader({ vertices, annotationType = "none", annotationId = null, layer = "0" }) {
    const leader = {
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

  /**
   * 모든 Leader 목록을 조회합니다.
   * @returns {LeaderEntity[]}
   */
  getLeaders() {
    return Array.from(this.leaders.values());
  }

  /**
   * Leader를 수정합니다.
   * @param {string} id
   * @param {Partial<LeaderEntity>} updates
   * @returns {boolean}
   */
  updateLeader(id, updates) {
    const l = this.leaders.get(id);
    if (!l) return false;
    if (updates.vertices) l.vertices = updates.vertices.map((v) => ({ ...v }));
    if (updates.annotationType !== undefined) l.annotationType = updates.annotationType;
    if (updates.annotationId !== undefined) l.annotationId = updates.annotationId;
    if (updates.layer !== undefined) l.layer = updates.layer;
    return true;
  }

  /**
   * Leader를 삭제합니다.
   * @param {string} id
   * @returns {boolean}
   */
  removeLeader(id) {
    return this.leaders.delete(id);
  }

  // ========== MTEXT ==========

  /**
   * MText를 생성합니다.
   *
   * @param {Object} options
   * @param {string} options.text - 텍스트 내용
   * @param {number} options.x - 기준점 X
   * @param {number} options.y - 기준점 Y
   * @param {number} [options.height=1] - 텍스트 높이
   * @param {number} [options.width=0] - 단락 너비
   * @param {string} [options.attachment="TL"] - 정착점
   * @param {string} [options.style] - 텍스트 스타일
   * @param {number} [options.rotation=0] - 회전
   * @param {string} [options.layer="0"]
   * @returns {MTextEntity}
   */
  createMText({ text, x, y, height = 1, width = 0, attachment = "TL", style, rotation = 0, layer = "0" }) {
    const mtext = {
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

  /**
   * 모든 MText 목록을 조회합니다.
   * @returns {MTextEntity[]}
   */
  getMTexts() {
    return Array.from(this.mtexts.values());
  }

  /**
   * MText를 수정합니다.
   * @param {string} id
   * @param {Partial<MTextEntity>} updates
   * @returns {boolean}
   */
  updateMText(id, updates) {
    const m = this.mtexts.get(id);
    if (!m) return false;
    Object.assign(m, updates);
    return true;
  }

  /**
   * MText를 삭제합니다.
   * @param {string} id
   * @returns {boolean}
   */
  removeMText(id) {
    return this.mtexts.delete(id);
  }

  // ========== 직렬화 ==========

  /**
   * 전체 정보를 직렬화합니다.
   * @returns {Object}
   */
  toJSON() {
    return {
      hatches: this.getHatches().length,
      dimensions: this.getDimensions().length,
      leaders: this.getLeaders().length,
      mtexts: this.getMTexts().length
    };
  }
}

module.exports = {
  HatchManager,
  HATCH_PATTERN_TYPES,
  HATCH_STYLES,
  DIMENSION_TYPES
};
