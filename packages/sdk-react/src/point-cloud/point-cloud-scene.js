/**
 * point-cloud-scene.js
 * Three.js 포인트클라우드 씬 관리 모듈
 *
 * 포인트클라우드 데이터를 Three.js 씬에 렌더링합니다.
 * 포인트 크기, 가시성, 투명도, 색상 모드를 지원합니다.
 */

// Three.js 모킹 — 실제 환경에서는 import 가능 (브라우저/WebWorker)
const THREE = {
  BufferGeometry: class {},
  BufferAttribute: class {
    constructor(array, itemSize) {
      this.array = array;
      this.itemSize = itemSize;
    }
  },
  Points: class {},
  PointsMaterial: class {
    constructor(options = {}) {
      this.size = options.size ?? 1;
      this.opacity = options.opacity ?? 1;
      this.transparent = options.transparent ?? false;
      this.vertexColors = options.vertexColors ?? false;
    }
  },
  Color: class {
    constructor(value) {
      this.value = value;
    }
  }
};

/**
 * 포인트클라우드 씬을 생성합니다.
 *
 * @param {Object} options - 씬 옵션
 * @param {HTMLElement} [options.container] - 마운트할 DOM 컨테이너
 * @returns {Object} 씬 인스턴스
 */
export function createScene(options = {}) {
  const { container } = options;

  const state = {
    visible: true,
    pointSize: 2,
    opacity: 1,
    colorMode: "rgb",
    pointCount: 0
  };

  let scene = null;
  let points = null;
  let material = null;
  let positions = null;
  let colors = null;

  /**
   * 포인트클라우드를 씬에 추가합니다.
   *
   * @param {Object} data - 포인트 데이터
   * @param {Array} data.positions - 위치 배열 [{ x, y, z }, ...]
   * @param {Array} [data.colors] - 색상 배열 [{ r, g, b }, ...]
   * @param {Object} [data.bbox] - 바운딩 박스
   */
  function addPoints(data) {
    const { positions: pos, colors: col, bbox } = data;

    // 위치 배열 생성
    const positionArray = new Float32Array(pos.length * 3);
    for (let i = 0; i < pos.length; i++) {
      positionArray[i * 3] = pos[i].x;
      positionArray[i * 3 + 1] = pos[i].y;
      positionArray[i * 3 + 2] = pos[i].z;
    }

    positions = positionArray;
    state.pointCount = pos.length;

    // 색상 배열 (선택적)
    if (col && col.length > 0) {
      const colorArray = new Float32Array(col.length * 3);
      for (let i = 0; i < col.length; i++) {
        if (col[i]) {
          colorArray[i * 3] = col[i].r ?? 0;
          colorArray[i * 3 + 1] = col[i].g ?? 0;
          colorArray[i * 3 + 2] = col[i].b ?? 0;
        }
      }
      colors = colorArray;
    }

    return {
      positionArray,
      colorArray: colors,
      bbox,
      pointCount: state.pointCount
    };
  }

  /**
   * 포인트 크기를 설정합니다.
   *
   * @param {number} size - 포인트 크기 (픽셀)
   */
  function setPointSize(size) {
    state.pointSize = size;
    if (material) {
      material.size = size;
    }
  }

  /**
   * 가시성을 설정합니다.
   *
   * @param {boolean} visible - 표시 여부
   */
  function setVisible(visible) {
    state.visible = visible;
    if (points) {
      points.visible = visible;
    }
  }

  /**
   * 투명도를 설정합니다.
   *
   * @param {number} opacity - 투명도 (0~1)
   */
  function setOpacity(opacity) {
    state.opacity = Math.max(0, Math.min(1, opacity));
    if (material) {
      material.opacity = state.opacity;
      material.transparent = state.opacity < 1;
    }
  }

  /**
   * 색상 모드를 설정합니다.
   *
   * @param {string} mode - 색상 모드 ("rgb", "intensity", "none")
   */
  function setColorMode(mode) {
    state.colorMode = mode;
  }

  /**
   * 씬을 정리합니다.
   */
  function dispose() {
    if (points) {
      points = null;
    }
    if (material) {
      material = null;
    }
    positions = null;
    colors = null;
  }

  return {
    addPoints,
    setPointSize,
    setVisible,
    setOpacity,
    setColorMode,
    dispose,
    getState: () => ({ ...state })
  };
}

/**
 * 포인트클라우드 데이터를 위한 기본 씬 구성을 반환합니다.
 *
 * @param {Object} data - 포인트 데이터
 * @returns {Object} 씬 구성
 */
export function buildSceneConfig(data) {
  const config = {
    positions: data.positions ?? [],
    colors: data.colors ?? null,
    bbox: data.bbox ?? null,
    metadata: {
      pointCount: data.positions?.length ?? 0,
      hasColors: !!(data.colors && data.colors.length > 0)
    }
  };

  return config;
}

/**
 * 색상 모드에 따른 렌더링 옵션을 반환합니다.
 *
 * @param {string} colorMode - 색상 모드
 * @returns {Object} Three.js 머티리얼 옵션
 */
export function colorModeToMaterialOptions(colorMode) {
  switch (colorMode) {
    case "rgb":
      return { vertexColors: true, transparent: false };
    case "intensity":
      return { vertexColors: false, color: 0xffffff, transparent: false };
    case "none":
      return { vertexColors: false, color: 0xcccccc, transparent: false };
    default:
      return { vertexColors: false, color: 0xffffff };
  }
}