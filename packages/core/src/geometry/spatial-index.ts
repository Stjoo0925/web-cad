/**
 * spatial-index.ts
 * Spatial Indexing for CAD entities
 *
 * Provides R-tree and Quadtree implementations for:
 * - Viewport culling (skip off-screen entities)
 * - Range queries (select entities in area)
 * - Point queries (find entity at location)
 */

import type { Vec3 } from "./vector3.js";

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  minZ?: number;
  maxZ?: number;
}

export interface Entity {
  id: string;
  bounds: BoundingBox;
  type: string;
  data?: unknown;
}

export interface SpatialIndex {
  insert(entity: Entity): void;
  remove(entityId: string): void;
  update(entity: Entity): void;
  query(bounds: BoundingBox): Entity[];
  queryPoint(x: number, y: number, radius?: number): Entity[];
  clear(): void;
  get size(): number;
}

/**
 * Quadtree for 2D spatial indexing
 */
export class Quadtree implements SpatialIndex {
  private root: QuadtreeNode;
  private maxDepth: number;
  private entityMap = new Map<string, Entity>();

  constructor(bounds: BoundingBox, maxDepth: number = 8) {
    this.root = new QuadtreeNode(bounds);
    this.maxDepth = maxDepth;
  }

  insert(entity: Entity): void {
    this.entityMap.set(entity.id, entity);
    this.root.insert(entity, 0, this.maxDepth);
  }

  remove(entityId: string): void {
    const entity = this.entityMap.get(entityId);
    if (entity) {
      this.root.remove(entity);
      this.entityMap.delete(entityId);
    }
  }

  update(entity: Entity): void {
    this.remove(entity.id);
    this.insert(entity);
  }

  query(bounds: BoundingBox): Entity[] {
    return this.root.query(bounds);
  }

  queryPoint(x: number, y: number, radius: number = 0): Entity[] {
    const bounds: BoundingBox = {
      minX: x - radius,
      minY: y - radius,
      maxX: x + radius,
      maxY: y + radius,
    };
    return this.query(bounds).filter((e) => this.pointInBounds(x, y, e.bounds));
  }

  clear(): void {
    this.root = new QuadtreeNode(this.root.bounds);
    this.entityMap.clear();
  }

  get size(): number {
    return this.entityMap.size;
  }

  private pointInBounds(x: number, y: number, bounds: BoundingBox): boolean {
    return (
      x >= bounds.minX &&
      x <= bounds.maxX &&
      y >= bounds.minY &&
      y <= bounds.maxY
    );
  }
}

class QuadtreeNode {
  bounds: BoundingBox;
  children: QuadtreeNode[] | null = null;
  entities: Entity[] = [];

  constructor(bounds: BoundingBox) {
    this.bounds = bounds;
  }

  insert(entity: Entity, depth: number, maxDepth: number): void {
    if (this.children) {
      // Insert into child nodes that contain the entity
      const childIndex = this.getChildIndex(entity.bounds);
      if (childIndex !== -1) {
        this.children[childIndex].insert(entity, depth + 1, maxDepth);
        return;
      }
    }

    this.entities.push(entity);

    // Subdivide if needed
    if (
      !this.children &&
      depth < maxDepth &&
      this.entities.length > QuadtreeNode.MAX_ENTITIES
    ) {
      this.subdivide();
      this.reinsertEntities(depth, maxDepth);
    }
  }

  remove(entity: Entity): boolean {
    // Remove from this node
    const idx = this.entities.findIndex((e) => e.id === entity.id);
    if (idx !== -1) {
      this.entities.splice(idx, 1);
      return true;
    }

    // Remove from children
    if (this.children) {
      const childIndex = this.getChildIndex(entity.bounds);
      if (childIndex !== -1) {
        return this.children[childIndex].remove(entity);
      }
    }

    return false;
  }

  query(bounds: BoundingBox): Entity[] {
    const results: Entity[] = [];

    // Check if query bounds intersects this node
    if (!this.intersects(bounds, this.bounds)) {
      return results;
    }

    // Check entities in this node
    for (const entity of this.entities) {
      if (this.intersects(bounds, entity.bounds)) {
        results.push(entity);
      }
    }

    // Query children
    if (this.children) {
      for (const child of this.children) {
        results.push(...child.query(bounds));
      }
    }

    return results;
  }

  private subdivide(): void {
    const { minX, minY, maxX, maxY } = this.bounds;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    this.children = [
      // NW
      new QuadtreeNode({ minX, minY: midY, maxX: midX, maxY }),
      // NE
      new QuadtreeNode({ minX: midX, minY: midY, maxX, maxY }),
      // SW
      new QuadtreeNode({ minX, minY, maxX: midX, maxY: midY }),
      // SE
      new QuadtreeNode({ minX: midX, minY, maxX, maxY: midY }),
    ];
  }

  private reinsertEntities(depth: number, maxDepth: number): void {
    const entities = this.entities;
    this.entities = [];

    for (const entity of entities) {
      const childIndex = this.getChildIndex(entity.bounds);
      if (childIndex !== -1) {
        this.children![childIndex].insert(entity, depth + 1, maxDepth);
      } else {
        this.entities.push(entity);
      }
    }
  }

  private getChildIndex(entityBounds: BoundingBox): number {
    if (!this.children) return -1;

    const { minX, minY, maxX, maxY } = this.bounds;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    // Find the child that fully contains the entity center
    const centerX = (entityBounds.minX + entityBounds.maxX) / 2;
    const centerY = (entityBounds.minY + entityBounds.maxY) / 2;

    // Determine which quadrant the center falls into
    const left = centerX < midX;
    const top = centerY >= midY;

    if (left && top) return 0; // NW
    if (!left && top) return 1; // NE
    if (left && !top) return 2; // SW
    return 3; // SE
  }

  private intersects(a: BoundingBox, b: BoundingBox): boolean {
    return (
      a.minX <= b.maxX &&
      a.maxX >= b.minX &&
      a.minY <= b.maxY &&
      a.maxY >= b.minY
    );
  }

  static MAX_ENTITIES = 8;
}

/**
 * R-tree for more efficient range queries
 */
export class RTree implements SpatialIndex {
  private root: RTreeNode;
  private entityMap = new Map<string, Entity>();

  constructor() {
    this.root = new RTreeNode();
  }

  insert(entity: Entity): void {
    this.entityMap.set(entity.id, entity);
    this.root.insert(entity);
  }

  remove(entityId: string): void {
    const entity = this.entityMap.get(entityId);
    if (entity) {
      this.root.remove(entity);
      this.entityMap.delete(entityId);
    }
  }

  update(entity: Entity): void {
    this.remove(entity.id);
    this.insert(entity);
  }

  query(bounds: BoundingBox): Entity[] {
    return this.root.query(bounds);
  }

  queryPoint(x: number, y: number, radius: number = 0): Entity[] {
    const bounds: BoundingBox = {
      minX: x - radius,
      minY: y - radius,
      maxX: x + radius,
      maxY: y + radius,
    };
    return this.query(bounds).filter((e) => this.pointInBounds(x, y, e.bounds));
  }

  clear(): void {
    this.root = new RTreeNode();
    this.entityMap.clear();
  }

  get size(): number {
    return this.entityMap.size;
  }

  private pointInBounds(x: number, y: number, bounds: BoundingBox): boolean {
    return (
      x >= bounds.minX &&
      x <= bounds.maxX &&
      y >= bounds.minY &&
      y <= bounds.maxY
    );
  }
}

class RTreeNode {
  bounds: BoundingBox | null = null;
  children: RTreeNode[] = [];
  entities: Entity[] = [];
  isLeaf: boolean = true;

  insert(entity: Entity): void {
    if (this.isLeaf) {
      this.entities.push(entity);
      this.updateBounds();
    } else {
      // Find best child to insert into
      if (this.children.length === 0) {
        this.entities.push(entity);
        this.updateBounds();
        return;
      }
      let bestChild = this.children[0];
      let bestEnlargement = this.enlargement(
        this.children[0].bounds,
        entity.bounds,
      );

      for (let i = 1; i < this.children.length; i++) {
        const childBounds = this.children[i].bounds;
        if (!childBounds) continue;
        const enlargement = this.enlargement(childBounds, entity.bounds);
        if (enlargement < bestEnlargement) {
          bestEnlargement = enlargement;
          bestChild = this.children[i];
        }
      }

      bestChild.insert(entity);
      this.updateBounds();
    }
  }

  remove(entity: Entity): boolean {
    if (this.isLeaf) {
      const idx = this.entities.findIndex((e) => e.id === entity.id);
      if (idx !== -1) {
        this.entities.splice(idx, 1);
        this.updateBounds();
        return true;
      }
    } else {
      for (const child of this.children) {
        if (child.remove(entity)) {
          this.updateBounds();
          return true;
        }
      }
    }
    return false;
  }

  query(bounds: BoundingBox): Entity[] {
    const results: Entity[] = [];

    if (this.bounds && !this.intersects(bounds, this.bounds)) {
      return results;
    }

    if (this.isLeaf) {
      for (const entity of this.entities) {
        if (this.intersects(bounds, entity.bounds)) {
          results.push(entity);
        }
      }
    } else {
      for (const child of this.children) {
        results.push(...child.query(bounds));
      }
    }

    return results;
  }

  private updateBounds(): void {
    if (this.isLeaf) {
      if (this.entities.length === 0) {
        this.bounds = null;
        return;
      }

      this.bounds = { ...this.entities[0].bounds };
      for (let i = 1; i < this.entities.length; i++) {
        this.bounds = this.union(this.bounds, this.entities[i].bounds);
      }
    } else {
      if (this.children.length === 0) {
        this.bounds = null;
        return;
      }

      this.bounds = { ...this.children[0].bounds! };
      for (let i = 1; i < this.children.length; i++) {
        this.bounds = this.union(this.bounds, this.children[i].bounds!);
      }
    }
  }

  private union(a: BoundingBox, b: BoundingBox): BoundingBox {
    return {
      minX: Math.min(a.minX, b.minX),
      minY: Math.min(a.minY, b.minY),
      maxX: Math.max(a.maxX, b.maxX),
      maxY: Math.max(a.maxY, b.maxY),
      minZ: Math.min(a.minZ ?? 0, b.minZ ?? 0),
      maxZ: Math.max(a.maxZ ?? 0, b.maxZ ?? 0),
    };
  }

  private enlargement(
    existing: BoundingBox | null,
    newBounds: BoundingBox,
  ): number {
    if (!existing) return this.area(newBounds);

    const union = this.union(existing, newBounds);
    return this.area(union) - this.area(existing);
  }

  private area(bounds: BoundingBox): number {
    return (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY);
  }

  private intersects(a: BoundingBox, b: BoundingBox): boolean {
    return (
      a.minX <= b.maxX &&
      a.maxX >= b.minX &&
      a.minY <= b.maxY &&
      a.maxY >= b.minY
    );
  }
}

/**
 * Create entity bounding box from entity data
 */
export function createEntityBounds(entity: {
  start?: Vec3;
  end?: Vec3;
  center?: Vec3;
  radius?: number;
  vertices?: Vec3[];
  position?: Vec3;
}): BoundingBox {
  if (entity.vertices && entity.vertices.length > 0) {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const v of entity.vertices) {
      minX = Math.min(minX, v.x);
      minY = Math.min(minY, v.y);
      maxX = Math.max(maxX, v.x);
      maxY = Math.max(maxY, v.y);
    }

    return { minX, minY, maxX, maxY };
  }

  if (entity.start && entity.end) {
    return {
      minX: Math.min(entity.start.x, entity.end.x),
      minY: Math.min(entity.start.y, entity.end.y),
      maxX: Math.max(entity.start.x, entity.end.x),
      maxY: Math.max(entity.start.y, entity.end.y),
    };
  }

  if (entity.center && entity.radius !== undefined) {
    return {
      minX: entity.center.x - entity.radius,
      minY: entity.center.y - entity.radius,
      maxX: entity.center.x + entity.radius,
      maxY: entity.center.y + entity.radius,
    };
  }

  if (entity.position) {
    return {
      minX: entity.position.x,
      minY: entity.position.y,
      maxX: entity.position.x,
      maxY: entity.position.y,
    };
  }

  return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
}

/**
 * Check if bounds are visible in viewport
 */
export function boundsInViewport(
  bounds: BoundingBox,
  viewportCenter: Vec3,
  viewportHalfWidth: number,
  viewportHalfHeight: number,
  margin: number = 0,
): boolean {
  return (
    bounds.maxX >= viewportCenter.x - viewportHalfWidth - margin &&
    bounds.minX <= viewportCenter.x + viewportHalfWidth + margin &&
    bounds.maxY >= viewportCenter.y - viewportHalfHeight - margin &&
    bounds.minY <= viewportCenter.y + viewportHalfHeight + margin
  );
}
