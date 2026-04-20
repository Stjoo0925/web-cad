/**
 * block-manager.js
 * 블록/심벌 관리 모듈
 *
 * 블록 정의 생성, 블록 참조(Insert) 삽입, 회전/스케일/기준점, 속성(Attribute),
 * Explode(분해) 기능을 관리합니다.
 */

/**
 * 블록 속성 (Attribute) 정의
 *
 * @typedef {Object} BlockAttribute
 * @property {string} tag - 속성 태그 (DXF ATTRIB tag)
 * @property {string} value - 속성 값
 * @property {number} x - X 좌표
 * @property {number} y - Y 좌표
 * @property {number} [height] - 텍스트 높이
 * @property {number} [rotation] - 회전 각도 (도)
 * @property {string} [layer] -所属 레이어
 */

/**
 * 블록 정의
 *
 * @typedef {Object} BlockDefinition
 * @property {string} name - 블록 이름
 * @property {Array} entities - 구성 엔티티 배열
 * @property {Object} basePoint - 기준점 {x, y}
 * @property {string} [layer] - 소속 레이어
 * @property {BlockAttribute[]} [attributes] - 속성 배열
 * @property {Object} [metadata] - 메타데이터
 */

/**
 * 블록 참조 (INSERT 엔티티)
 *
 * @typedef {Object} BlockReference
 * @property {string} id - 참조 고유 ID
 * @property {string} blockName - 참조할 블록 이름
 * @property {number} x - 삽입점 X 좌표
 * @property {number} y - 삽입점 Y 좌표
 * @property {number} [scaleX=1] - X 스케일
 * @property {number} [scaleY=1] - Y 스케일
 * @property {number} [rotation=0] - 회전 각도 (도)
 * @property {string} [layer] - 소속 레이어
 * @property {Object} [attributeValues] - 속성 값 맵 {tag: value}
 * @property {Object} [metadata] - 메타데이터
 */

/**
 * BlockManager 클래스
 *
 * 블록 정의 및 블록 참조를 관리합니다.
 */
class BlockManager {
  constructor() {
    /** @type {Map<string, BlockDefinition>} */
    this.blockDefinitions = new Map();
    /** @type {Map<string, BlockReference>} */
    this.blockReferences = new Map();
    /** @type {number} */
    this._nextRefId = 1;
  }

  /**
   * 블록 정의를 생성합니다.
   *
   * @param {Object} options - 블록 옵션
   * @param {string} options.name - 블록 이름 (고유해야 함)
   * @param {Array} [options.entities=[]] - 구성 엔티티 배열
   * @param {Object} [options.basePoint={x:0, y:0}] - 기준점
   * @param {string} [options.layer="0"] - 소속 레이어
   * @param {BlockAttribute[]} [options.attributes=[]] - 속성 배열
   * @returns {BlockDefinition} 생성된 블록 정의
   */
  createBlock({ name, entities = [], basePoint = { x: 0, y: 0 }, layer = "0", attributes = [] }) {
    if (this.blockDefinitions.has(name)) {
      throw new Error(`블록 "${name}"은(는) 이미 존재합니다.`);
    }

    const block = {
      name,
      entities: [...entities],
      basePoint: { ...basePoint },
      layer,
      attributes: attributes.map((a) => ({ ...a })),
      metadata: {}
    };

    this.blockDefinitions.set(name, block);
    return block;
  }

  /**
   * 모든 블록 정의 목록을 조회합니다.
   *
   * @returns {BlockDefinition[]} 블록 정의 배열
   */
  getBlocks() {
    return Array.from(this.blockDefinitions.values());
  }

  /**
   * 이름으로 블록 정의를 조회합니다.
   *
   * @param {string} name - 블록 이름
   * @returns {BlockDefinition|undefined}
   */
  getBlock(name) {
    return this.blockDefinitions.get(name);
  }

  /**
   * 블록 정의를 수정합니다.
   *
   * @param {string} name - 블록 이름
   * @param {Partial<BlockDefinition>} updates - 수정할 속성
   * @returns {boolean} 성공 여부
   */
  updateBlock(name, updates) {
    const block = this.blockDefinitions.get(name);
    if (!block) return false;

    if (updates.entities !== undefined) block.entities = [...updates.entities];
    if (updates.basePoint !== undefined) block.basePoint = { ...updates.basePoint };
    if (updates.layer !== undefined) block.layer = updates.layer;
    if (updates.attributes !== undefined) block.attributes = updates.attributes.map((a) => ({ ...a }));

    return true;
  }

  /**
   * 블록 정의를 삭제합니다. 해당 블록을 참조하는 참조가 있으면 실패합니다.
   *
   * @param {string} name - 블록 이름
   * @returns {boolean} 성공 여부
   */
  removeBlock(name) {
    // 참조 확인
    for (const ref of this.blockReferences.values()) {
      if (ref.blockName === name) {
        throw new Error(`블록 "${name}"을(를) 참조하는 참조가 있어 삭제할 수 없습니다.`);
      }
    }

    return this.blockDefinitions.delete(name);
  }

  /**
   * 블록 참조(Insert)를 생성합니다.
   *
   * @param {Object} options - 참조 옵션
   * @param {string} options.blockName - 참조할 블록 이름
   * @param {number} [options.x=0] - 삽입점 X 좌표
   * @param {number} [options.y=0] - 삽입점 Y 좌표
   * @param {number} [options.scaleX=1] - X 스케일
   * @param {number} [options.scaleY=1] - Y 스케일
   * @param {number} [options.rotation=0] - 회전 각도 (도)
   * @param {string} [options.layer="0"] - 소속 레이어
   * @param {Object} [options.attributeValues={}] - 속성 값 맵
   * @returns {BlockReference} 생성된 블록 참조
   */
  insertBlock({ blockName, x = 0, y = 0, scaleX = 1, scaleY = 1, rotation = 0, layer = "0", attributeValues = {} }) {
    if (!this.blockDefinitions.has(blockName)) {
      throw new Error(`블록 "${blockName}"이(가) 존재하지 않습니다.`);
    }

    const ref = {
      id: `BR-${this._nextRefId++}`,
      blockName,
      x,
      y,
      scaleX,
      scaleY,
      rotation,
      layer,
      attributeValues: { ...attributeValues },
      metadata: {}
    };

    this.blockReferences.set(ref.id, ref);
    return ref;
  }

  /**
   * 모든 블록 참조 목록을 조회합니다.
   *
   * @param {string} [blockName] - 필터링할 블록 이름 (선택)
   * @returns {BlockReference[]} 블록 참조 배열
   */
  getReferences(blockName) {
    const refs = Array.from(this.blockReferences.values());
    if (blockName) {
      return refs.filter((r) => r.blockName === blockName);
    }
    return refs;
  }

  /**
   * ID로 블록 참조를 조회합니다.
   *
   * @param {string} id - 참조 ID
   * @returns {BlockReference|undefined}
   */
  getReference(id) {
    return this.blockReferences.get(id);
  }

  /**
   * 블록 참조를 수정합니다.
   *
   * @param {string} id - 참조 ID
   * @param {Partial<BlockReference>} updates - 수정할 속성
   * @returns {boolean} 성공 여부
   */
  updateReference(id, updates) {
    const ref = this.blockReferences.get(id);
    if (!ref) return false;

    if (updates.x !== undefined) ref.x = updates.x;
    if (updates.y !== undefined) ref.y = updates.y;
    if (updates.scaleX !== undefined) ref.scaleX = updates.scaleX;
    if (updates.scaleY !== undefined) ref.scaleY = updates.scaleY;
    if (updates.rotation !== undefined) ref.rotation = updates.rotation;
    if (updates.layer !== undefined) ref.layer = updates.layer;
    if (updates.attributeValues !== undefined) ref.attributeValues = { ...updates.attributeValues };

    return true;
  }

  /**
   * 블록 참조를 삭제합니다.
   *
   * @param {string} id - 참조 ID
   * @returns {boolean} 성공 여부
   */
  removeReference(id) {
    return this.blockReferences.delete(id);
  }

  /**
   * 블록을 분해(explode)하여 원본 엔티티 배열을 반환합니다.
   * 분해 시 삽입점, 스케일, 회전을 적용합니다.
   *
   * @param {string} id - 참조 ID
   * @returns {Array} 변환된 엔티티 배열 (실패 시 빈 배열)
   */
  explode(id) {
    const ref = this.blockReferences.get(id);
    if (!ref) return [];

    const block = this.blockDefinitions.get(ref.blockName);
    if (!block) return [];

    const { x, y, scaleX, scaleY, rotation, attributeValues } = ref;
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    // 속성 값 치환
    const attrMap = attributeValues || {};

    return block.entities.map((entity) => {
      // 좌표 변환: 스케일 → 회전 → 이동
      let ex = entity.x * scaleX;
      let ey = entity.y * scaleY;

      // 회전 적용
      const rx = ex * cos - ey * sin;
      const ry = ex * sin + ey * cos;

      // 이동
      const fx = rx + x;
      const fy = ry + y;

      // 엔티티 복사 후 좌표 적용
      const exploded = { ...entity, x: fx, y: fy, layer: ref.layer };

      // 속성값 치환 (ATTRIB 있는 경우)
      if (entity.tag && attrMap[entity.tag] !== undefined) {
        exploded.value = attrMap[entity.tag];
      }

      return exploded;
    });
  }

  /**
   * 블록 참조의 실체 엔티티를 계산하여 반환합니다.
   *
   * @param {string} id - 참조 ID
   * @returns {Array} 변환된 엔티티 배열
   */
  getReferenceEntities(id) {
    return this.explode(id);
  }

  /**
   * 블록 정의를 DXF 형식으로 내보내기 위한 데이터를 반환합니다.
   *
   * @param {string} name - 블록 이름
   * @returns {Object|null} DXF BLOCK/ENDBLK 데이터
   */
  toDXF(name) {
    const block = this.blockDefinitions.get(name);
    if (!block) return null;

    return {
      type: "BLOCK",
      name: block.name,
      basePoint: block.basePoint,
      flags: 0,
      layer: block.layer,
      entities: block.entities,
      attributes: block.attributes
    };
  }

  /**
   * 블록 정보를 직렬화합니다. (JSON 내보내기용)
   *
   * @returns {Object}
   */
  toJSON() {
    return {
      blockDefinitions: this.getBlocks().map((b) => ({
        name: b.name,
        basePoint: b.basePoint,
        layer: b.layer,
        entityCount: b.entities.length,
        attributeCount: b.attributes.length
      })),
      blockReferences: this.getReferences().map((r) => ({
        id: r.id,
        blockName: r.blockName,
        x: r.x,
        y: r.y,
        scaleX: r.scaleX,
        scaleY: r.scaleY,
        rotation: r.rotation,
        layer: r.layer
      }))
    };
  }
}

module.exports = {
  BlockManager
};
