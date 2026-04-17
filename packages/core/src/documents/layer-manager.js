/**
 * layer-manager.js
 * 레이어 관리 모듈
 *
 * 레이어 생성/삭제/이름 변경, 가시성, 잠금, 색상, 선가중치를 관리합니다.
 */

// 기본 레이어 색상 팔레트 (AutoCAD 표준)
const DEFAULT_COLORS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9,
  10, 11, 12, 13, 14, 15, 30, 40, 50,
  60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250
];

// 기본 선가중치 값 (mm 단위)
const DEFAULT_LINE_WEIGHTS = [
  0.00, 0.05, 0.09, 0.13, 0.15, 0.18, 0.20, 0.25, 0.30, 0.35,
  0.40, 0.50, 0.53, 0.60, 0.70, 0.80, 0.90, 1.00, 1.06, 1.20,
  1.40, 1.60, 1.80, 2.00, 2.11, 2.40, 2.80, 3.00, 3.20, 3.50,
  4.00, 4.20, 5.00, 5.50, 6.00, 7.00, 8.00, 9.00, 10.0, 11.0,
  12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0, 19.0, 20.0, 21.0,
  22.0, 23.0, 24.0, 25.0, 26.0, 27.0, 28.0, 29.0, 30.0
];

/**
 * 레이어 상태 열거형
 */
const LayerState = {
  ACTIVE: "active",
  INACTIVE: "inactive"
};

/**
 * LayerManager 클래스
 *
 * 레이어 컬렉션을 관리하며 CRUD, 가시성, 잠금, 색상, 선가중치를 처리합니다.
 */
class LayerManager {
  /**
   * @param {Object} options - 초기화 옵션
   * @param {string} [options.activeLayerName="0"] - 기본 활성 레이어 이름
   */
  constructor(options = {}) {
    /** @type {Map<string, Layer>} */
    this.layers = new Map();
    /** @type {string|null} */
    this.activeLayerName = options.activeLayerName || "0";

    // 기본 "0" 레이어 자동 생성
    this.createLayer({
      name: "0",
      color: 7, // 흰색/검정 (_BYBLOCK)
      lineWeight: -1, // _BYLAYER
      locked: false,
      visible: true
    });
  }

  /**
   * 레이어를 생성합니다.
   *
   * @param {Object} options - 레이어 옵션
   * @param {string} options.name - 레이어 이름 (고유해야 함)
   * @param {number} [options.color=7] - AutoCAD 색상 번호 (1-255)
   * @param {number} [options.lineWeight=-1] - 선가중치 (mm, -1=_BYLAYER)
   * @param {boolean} [options.visible=true] - 가시성
   * @param {boolean} [options.locked=false] - 잠금 상태
   * @returns {Layer} 생성된 레이어
   */
  createLayer({ name, color = 7, lineWeight = -1, visible = true, locked = false }) {
    if (this.layers.has(name)) {
      throw new Error(`레이어 "${name}"은(는) 이미 존재합니다.`);
    }

    const layer = {
      name,
      color,
      lineWeight,
      visible,
      locked,
      state: LayerState.ACTIVE,
      entities: [],
      metadata: {}
    };

    this.layers.set(name, layer);
    return layer;
  }

  /**
   * 모든 레이어 목록을 조회합니다.
   *
   * @returns {Layer[]} 레이어 배열
   */
  getLayers() {
    return Array.from(this.layers.values());
  }

  /**
   * 이름으로 레이어를 조회합니다.
   *
   * @param {string} name - 레이어 이름
   * @returns {Layer|undefined}
   */
  getLayer(name) {
    return this.layers.get(name);
  }

  /**
   * 레이어 이름을 변경합니다.
   *
   * @param {string} oldName - 기존 이름
   * @param {string} newName - 새 이름
   * @returns {boolean} 성공 여부
   */
  renameLayer(oldName, newName) {
    if (!this.layers.has(oldName)) {
      return false;
    }
    if (this.layers.has(newName)) {
      throw new Error(`레이어 "${newName}"은(는) 이미 존재합니다.`);
    }

    const layer = this.layers.get(oldName);
    this.layers.delete(oldName);
    layer.name = newName;
    this.layers.set(newName, layer);

    // 활성 레이어 이름이 있었으면 갱신
    if (this.activeLayerName === oldName) {
      this.activeLayerName = newName;
    }

    return true;
  }

  /**
   * 레이어를 삭제합니다. "0" 레이어는 삭제 불가합니다.
   *
   * @param {string} name - 삭제할 레이어 이름
   * @returns {boolean} 성공 여부
   */
  removeLayer(name) {
    if (name === "0") {
      throw new Error('"0" 레이어는 삭제할 수 없습니다.');
    }
    if (!this.layers.has(name)) {
      return false;
    }

    // 삭제 대상이 활성 레이어면 "0"으로 전환
    if (this.activeLayerName === name) {
      this.activeLayerName = "0";
    }

    this.layers.delete(name);
    return true;
  }

  /**
   * 레이어 가시성을 설정합니다.
   *
   * @param {string} name - 레이어 이름
   * @param {boolean} visible - 가시성 여부
   * @returns {boolean} 성공 여부
   */
  setLayerVisible(name, visible) {
    const layer = this.layers.get(name);
    if (!layer) return false;
    layer.visible = visible;
    return true;
  }

  /**
   * 레이어 잠금 상태를 설정합니다.
   *
   * @param {string} name - 레이어 이름
   * @param {boolean} locked - 잠금 여부
   * @returns {boolean} 성공 여부
   */
  setLayerLocked(name, locked) {
    const layer = this.layers.get(name);
    if (!layer) return false;
    layer.locked = locked;
    return true;
  }

  /**
   * 레이어 색상을 설정합니다.
   *
   * @param {string} name - 레이어 이름
   * @param {number} color - AutoCAD 색상 번호 (1-255)
   * @returns {boolean} 성공 여부
   */
  setLayerColor(name, color) {
    const layer = this.layers.get(name);
    if (!layer) return false;
    layer.color = color;
    return true;
  }

  /**
   * 레이어 선가중치를 설정합니다.
   *
   * @param {string} name - 레이어 이름
   * @param {number} lineWeight - 선가중치 (mm, -1=_BYLAYER)
   * @returns {boolean} 성공 여부
   */
  setLayerLineWeight(name, lineWeight) {
    const layer = this.layers.get(name);
    if (!layer) return false;
    layer.lineWeight = lineWeight;
    return true;
  }

  /**
   * 활성 레이어를 설정합니다.
   *
   * @param {string} name - 레이어 이름
   * @returns {boolean} 성공 여부
   */
  setActiveLayer(name) {
    if (!this.layers.has(name)) return false;
    this.activeLayerName = name;
    return true;
  }

  /**
   * 현재 활성 레이어를 조회합니다.
   *
   * @returns {Layer|undefined}
   */
  getActiveLayer() {
    return this.layers.get(this.activeLayerName);
  }

  /**
   * 가시성 상태로 레이어를 필터링합니다.
   *
   * @param {boolean} visible - 가시성 여부
   * @returns {Layer[]} 필터링된 레이어 배열
   */
  getVisibleLayers(visible = true) {
    return this.getLayers().filter((l) => l.visible === visible);
  }

  /**
   * 잠금 상태로 레이어를 필터링합니다.
   *
   * @param {boolean} locked - 잠금 여부
   * @returns {Layer[]} 필터링된 레이어 배열
   */
  getLockedLayers(locked = true) {
    return this.getLayers().filter((l) => l.locked === locked);
  }

  /**
   * 편집 가능한 레이어 목록을 반환합니다. (잠금되지 않은 레이어)
   *
   * @returns {Layer[]}
   */
  getEditableLayers() {
    return this.getLayers().filter((l) => !l.locked && l.visible);
  }

  /**
   * 레이어에 엔티티를 추가합니다.
   *
   * @param {string} layerName - 레이어 이름
   * @param {Object} entity - 엔티티 객체
   * @returns {boolean} 성공 여부
   */
  addEntityToLayer(layerName, entity) {
    const layer = this.layers.get(layerName);
    if (!layer) return false;
    if (layer.locked) {
      throw new Error(`레이어 "${layerName}"은(는) 잠겨 있어 엔티티를 추가할 수 없습니다.`);
    }
    layer.entities.push(entity);
    return true;
  }

  /**
   * 레이어에서 엔티티를 제거합니다.
   *
   * @param {string} layerName - 레이어 이름
   * @param {string|Object} entity - 엔티티 또는 엔티티 ID
   * @returns {boolean} 성공 여부
   */
  removeEntityFromLayer(layerName, entity) {
    const layer = this.layers.get(layerName);
    if (!layer) return false;

    const entityId = typeof entity === "string" ? entity : entity.id;
    const idx = layer.entities.findIndex((e) => (typeof e === "string" ? e : e.id) === entityId);
    if (idx === -1) return false;

    layer.entities.splice(idx, 1);
    return true;
  }

  /**
   * 레이어 정보를 직렬화합니다. (JSON 내보내기용)
   *
   * @returns {Object}
   */
  toJSON() {
    return {
      activeLayer: this.activeLayerName,
      layers: this.getLayers().map((l) => ({
        name: l.name,
        color: l.color,
        lineWeight: l.lineWeight,
        visible: l.visible,
        locked: l.locked,
        entityCount: l.entities.length
      }))
    };
  }
}

module.exports = {
  LayerManager,
  LayerState,
  DEFAULT_COLORS,
  DEFAULT_LINE_WEIGHTS
};
