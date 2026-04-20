/**
 * block-manager.ts
 * Block/symbol management module
 *
 * Manages block definition creation, block reference (Insert) placement with rotation/scale/base point,
 * attributes (Attribute), and explode functionality.
 */

export interface BlockAttribute {
  tag: string;
  value: string;
  x: number;
  y: number;
  height?: number;
  rotation?: number;
  layer?: string;
}

export interface BlockDefinition {
  name: string;
  entities: unknown[];
  basePoint: { x: number; y: number };
  layer: string;
  attributes: BlockAttribute[];
  metadata: Record<string, unknown>;
}

export interface BlockReference {
  id: string;
  blockName: string;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  layer: string;
  attributeValues: Record<string, string>;
  metadata: Record<string, unknown>;
}

export interface InsertBlockOptions {
  blockName: string;
  x?: number;
  y?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  layer?: string;
  attributeValues?: Record<string, string>;
}

export interface UpdateBlockOptions {
  entities?: unknown[];
  basePoint?: { x: number; y: number };
  layer?: string;
  attributes?: BlockAttribute[];
}

export interface UpdateReferenceOptions {
  x?: number;
  y?: number;
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  layer?: string;
  attributeValues?: Record<string, string>;
}

export class BlockManager {
  private readonly blockDefinitions: Map<string, BlockDefinition>;
  private readonly blockReferences: Map<string, BlockReference>;
  private _nextRefId: number;

  constructor() {
    this.blockDefinitions = new Map();
    this.blockReferences = new Map();
    this._nextRefId = 1;
  }

  createBlock({ name, entities = [], basePoint = { x: 0, y: 0 }, layer = "0", attributes = [] }: {
    name: string;
    entities?: unknown[];
    basePoint?: { x: number; y: number };
    layer?: string;
    attributes?: BlockAttribute[];
  }): BlockDefinition {
    if (this.blockDefinitions.has(name)) {
      throw new Error(`Block "${name}" already exists.`);
    }

    const block: BlockDefinition = {
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

  getBlocks(): BlockDefinition[] {
    return Array.from(this.blockDefinitions.values());
  }

  getBlock(name: string): BlockDefinition | undefined {
    return this.blockDefinitions.get(name);
  }

  updateBlock(name: string, updates: UpdateBlockOptions): boolean {
    const block = this.blockDefinitions.get(name);
    if (!block) return false;

    if (updates.entities !== undefined) block.entities = [...updates.entities];
    if (updates.basePoint !== undefined) block.basePoint = { ...updates.basePoint };
    if (updates.layer !== undefined) block.layer = updates.layer;
    if (updates.attributes !== undefined) block.attributes = updates.attributes.map((a) => ({ ...a }));

    return true;
  }

  removeBlock(name: string): boolean {
    for (const ref of this.blockReferences.values()) {
      if (ref.blockName === name) {
        throw new Error(`Block "${name}" cannot be deleted because it is referenced.`);
      }
    }

    return this.blockDefinitions.delete(name);
  }

  insertBlock({ blockName, x = 0, y = 0, scaleX = 1, scaleY = 1, rotation = 0, layer = "0", attributeValues = {} }: InsertBlockOptions): BlockReference {
    if (!this.blockDefinitions.has(blockName)) {
      throw new Error(`Block "${blockName}" does not exist.`);
    }

    const ref: BlockReference = {
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

  getReferences(blockName?: string): BlockReference[] {
    const refs = Array.from(this.blockReferences.values());
    if (blockName) {
      return refs.filter((r) => r.blockName === blockName);
    }
    return refs;
  }

  getReference(id: string): BlockReference | undefined {
    return this.blockReferences.get(id);
  }

  updateReference(id: string, updates: UpdateReferenceOptions): boolean {
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

  removeReference(id: string): boolean {
    return this.blockReferences.delete(id);
  }

  explode(id: string): unknown[] {
    const ref = this.blockReferences.get(id);
    if (!ref) return [];

    const block = this.blockDefinitions.get(ref.blockName);
    if (!block) return [];

    const { x, y, scaleX, scaleY, rotation, attributeValues } = ref;
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const attrMap = attributeValues || {};

    return block.entities.map((entity) => {
      const entityWithCoords = entity as { x?: number; y?: number; tag?: string; value?: string };
      let ex = (entityWithCoords.x ?? 0) * scaleX;
      let ey = (entityWithCoords.y ?? 0) * scaleY;

      const rx = ex * cos - ey * sin;
      const ry = ex * sin + ey * cos;

      const fx = rx + x;
      const fy = ry + y;

      const exploded = { ...entity, x: fx, y: fy, layer: ref.layer } as Record<string, unknown>;

      if (entityWithCoords.tag && attrMap[entityWithCoords.tag] !== undefined) {
        exploded.value = attrMap[entityWithCoords.tag];
      }

      return exploded;
    });
  }

  getReferenceEntities(id: string): unknown[] {
    return this.explode(id);
  }

  toDXF(name: string): { type: string; name: string; basePoint: { x: number; y: number }; flags: number; layer: string; entities: unknown[]; attributes: BlockAttribute[] } | null {
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

  toJSON(): { blockDefinitions: { name: string; basePoint: { x: number; y: number }; layer: string; entityCount: number; attributeCount: number }[]; blockReferences: { id: string; blockName: string; x: number; y: number; scaleX: number; scaleY: number; rotation: number; layer: string }[] } {
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