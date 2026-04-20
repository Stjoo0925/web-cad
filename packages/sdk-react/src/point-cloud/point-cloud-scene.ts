export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface PointColor {
  r: number;
  g: number;
  b: number;
}

export interface BBox {
  min: Point3D;
  max: Point3D;
  center?: Point3D;
}

export interface PointCloudData {
  positions: Point3D[];
  colors?: PointColor[];
  bbox?: BBox;
}

export interface SceneState {
  visible: boolean;
  pointSize: number;
  opacity: number;
  colorMode: string;
  pointCount: number;
  origin?: Point3D;
}

export interface SceneResult {
  positionArray: Float32Array;
  colorArray?: Float32Array;
  bbox?: BBox;
  pointCount: number;
  origin?: Point3D;
}

export interface MaterialMock {
  size: number;
  opacity: number;
  transparent: boolean;
  vertexColors: boolean;
}

export interface SceneOptions {
  container?: HTMLElement;
  origin?: Point3D;
}

/**
 * Transform a point using origin offset (world to local coordinates)
 */
function worldToLocal(point: Point3D, origin: Point3D): Point3D {
  return {
    x: point.x - origin.x,
    y: point.y - origin.y,
    z: point.z - origin.z,
  };
}

/**
 * 포인트클라우드 씬을 생성합니다.
 * 좌표계 정합을 위해 bbox center를 origin으로 사용합니다.
 */
export function createScene(options: SceneOptions = {}): {
  addPoints: (data: PointCloudData) => SceneResult;
  setPointSize: (size: number) => void;
  setVisible: (visible: boolean) => void;
  setOpacity: (opacity: number) => void;
  setColorMode: (mode: string) => void;
  setOrigin: (origin: Point3D) => void;
  dispose: () => void;
  getState: () => SceneState;
} {
  const { container, origin: initialOrigin } = options;

  const state: SceneState = {
    visible: true,
    pointSize: 2,
    opacity: 1,
    colorMode: "rgb",
    pointCount: 0,
    origin: initialOrigin ?? { x: 0, y: 0, z: 0 },
  };

  let material: MaterialMock | null = null;
  let positions: Float32Array | null = null;
  let colors: Float32Array | null = null;

  function addPoints(data: PointCloudData): SceneResult {
    const { positions: pos, colors: col, bbox } = data;

    // bbox가 제공되면 center를 origin으로 자동 설정 (좌표계 정합)
    if (bbox?.center && !initialOrigin) {
      state.origin = bbox.center;
    }

    const positionArray = new Float32Array(pos.length * 3);
    for (let i = 0; i < pos.length; i++) {
      const local = worldToLocal(pos[i], state.origin ?? { x: 0, y: 0, z: 0 });
      positionArray[i * 3] = local.x;
      positionArray[i * 3 + 1] = local.y;
      positionArray[i * 3 + 2] = local.z;
    }

    positions = positionArray;
    state.pointCount = pos.length;

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
      pointCount: state.pointCount,
      origin: state.origin,
    };
  }

  function setPointSize(size: number) {
    state.pointSize = size;
    if (material) {
      material.size = size;
    }
  }

  function setVisible(visible: boolean) {
    state.visible = visible;
  }

  function setOpacity(opacity: number) {
    state.opacity = Math.max(0, Math.min(1, opacity));
    if (material) {
      material.opacity = state.opacity;
      material.transparent = state.opacity < 1;
    }
  }

  function setColorMode(mode: string) {
    state.colorMode = mode;
  }

  function setOrigin(origin: Point3D) {
    state.origin = origin;
  }

  function dispose() {
    material = null;
    positions = null;
    colors = null;
  }

  return {
    addPoints,
    setPointSize,
    setVisible,
    setOpacity,
    setColorMode,
    setOrigin,
    dispose,
    getState: () => ({ ...state }),
  };
}

export function buildSceneConfig(data: PointCloudData) {
  return {
    positions: data.positions ?? [],
    colors: data.colors ?? null,
    bbox: data.bbox ?? null,
    metadata: {
      pointCount: data.positions?.length ?? 0,
      hasColors: !!(data.colors && data.colors.length > 0),
    },
  };
}

export function colorModeToMaterialOptions(colorMode: string) {
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
