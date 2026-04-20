/**
 * layer-manager.ts
 * 레이어 관리 모듈
 *
 * 레이어 생성/삭제/이름 변경, 가시성, 잠금, 색상, 선 굵기를 관리합니다.
 */

// 기본 레이어 색상 팔레트 (AutoCAD 표준)
export const DEFAULT_COLORS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9,
  10, 11, 12, 13, 14, 15, 30, 40, 50,
  60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250
];

// 기본 선 굵기 (mm 단위)
export const DEFAULT_LINE_WEIGHTS = [
  0.00, 0.05, 0.09, 0.13, 0.15, 0.18, 0.20, 0.25, 0.30, 0.35,
  0.40, 0.50, 0.53, 0.60, 0.70, 0.80, 0.90, 1.00, 1.06, 1.20,
  1.40, 1.60, 1.80, 2.00, 2.11, 2.40, 2.80, 3.00, 3.20, 3.50,
  4.00, 4.20, 5.00, 5.50, 6.00, 7.00, 8.00, 9.00, 10.0, 11.0,
  12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0, 19.0, 20.0, 21.0,
  22.0, 23.0, 24.0, 25.0, 26.0, 27.0, 28.0, 29.0, 30.0
];

export const LayerState = {
  ACTIVE: "active",
  INACTIVE: "inactive"
} as const;

export type LayerStateType = (typeof LayerState)[keyof typeof LayerState];

export interface Layer {
  name: string;
  color: number;
  lineWeight: number;
  visible: boolean;
  locked: boolean;
  state: LayerStateType;
  entities: unknown[];
  metadata: Record<string, unknown>;
}

export interface CreateLayerOptions {
  name: string;
  color?: number;
  lineWeight?: number;
  visible?: boolean;
  locked?: boolean;
}

export interface LayerManagerOptions {
  activeLayerName?: string;
}

export class LayerManager {
  private readonly layers: Map<string, Layer>;
  private activeLayerName: string;

  constructor(options: LayerManagerOptions = {}) {
    this.layers = new Map();
    this.activeLayerName = options.activeLayerName || "0";

    // 기본 "0" 레이어 자동 생성
    this.createLayer({
      name: "0",
      color: 7,
      lineWeight: -1,
      locked: false,
      visible: true
    });
  }

  createLayer({ name, color = 7, lineWeight = -1, visible = true, locked = false }: CreateLayerOptions): Layer {
    if (this.layers.has(name)) {
      throw new Error(`Layer "${name}" already exists.`);
    }

    const layer: Layer = {
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

  getLayers(): Layer[] {
    return Array.from(this.layers.values());
  }

  getLayer(name: string): Layer | undefined {
    return this.layers.get(name);
  }

  renameLayer(oldName: string, newName: string): boolean {
    if (!this.layers.has(oldName)) {
      return false;
    }
    if (this.layers.has(newName)) {
      throw new Error(`Layer "${newName}" already exists.`);
    }

    const layer = this.layers.get(oldName)!;
    this.layers.delete(oldName);
    layer.name = newName;
    this.layers.set(newName, layer);

    if (this.activeLayerName === oldName) {
      this.activeLayerName = newName;
    }

    return true;
  }

  removeLayer(name: string): boolean {
    if (name === "0") {
      throw new Error('"0" layer cannot be deleted.');
    }
    if (!this.layers.has(name)) {
      return false;
    }

    if (this.activeLayerName === name) {
      this.activeLayerName = "0";
    }

    this.layers.delete(name);
    return true;
  }

  setLayerVisible(name: string, visible: boolean): boolean {
    const layer = this.layers.get(name);
    if (!layer) return false;
    layer.visible = visible;
    return true;
  }

  setLayerLocked(name: string, locked: boolean): boolean {
    const layer = this.layers.get(name);
    if (!layer) return false;
    layer.locked = locked;
    return true;
  }

  setLayerColor(name: string, color: number): boolean {
    const layer = this.layers.get(name);
    if (!layer) return false;
    layer.color = color;
    return true;
  }

  setLayerLineWeight(name: string, lineWeight: number): boolean {
    const layer = this.layers.get(name);
    if (!layer) return false;
    layer.lineWeight = lineWeight;
    return true;
  }

  setActiveLayer(name: string): boolean {
    if (!this.layers.has(name)) return false;
    this.activeLayerName = name;
    return true;
  }

  getActiveLayer(): Layer | undefined {
    return this.layers.get(this.activeLayerName);
  }

  getVisibleLayers(visible = true): Layer[] {
    return this.getLayers().filter((l) => l.visible === visible);
  }

  getLockedLayers(locked = true): Layer[] {
    return this.getLayers().filter((l) => l.locked === locked);
  }

  getEditableLayers(): Layer[] {
    return this.getLayers().filter((l) => !l.locked && l.visible);
  }

  addEntityToLayer(layerName: string, entity: unknown): boolean {
    const layer = this.layers.get(layerName);
    if (!layer) return false;
    if (layer.locked) {
      throw new Error(`Layer "${layerName}" is locked and cannot accept entities.`);
    }
    layer.entities.push(entity);
    return true;
  }

  removeEntityFromLayer(layerName: string, entity: unknown): boolean {
    const layer = this.layers.get(layerName);
    if (!layer) return false;

    const entityObj = entity as { id?: string };
    const entityId = typeof entity === "string" ? entity : entityObj.id;
    const idx = layer.entities.findIndex((e) => {
      const eObj = e as { id?: string };
      return (typeof e === "string" ? e : eObj.id) === entityId;
    });
    if (idx === -1) return false;

    layer.entities.splice(idx, 1);
    return true;
  }

  toJSON(): { activeLayer: string; layers: { name: string; color: number; lineWeight: number; visible: boolean; locked: boolean; entityCount: number }[] } {
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