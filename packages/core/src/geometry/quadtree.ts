/**
 * quadtree.ts
 * Quadtree implementation for 2D spatial indexing
 *
 * Provides fast viewport culling and range queries for CAD entities.
 * Automatically subdivides when node capacity exceeds threshold.
 */

import type { BoundingBox, Entity } from "./spatial-index.js";

/**
 * Quadtree node - stores entities and subdivides when capacity exceeded
 */
class QuadtreeNode {
  bounds: BoundingBox;
  children: QuadtreeNode[] | null = null;
  entities: Entity[] = [];

  private static readonly MAX_ENTITIES = 8;

  constructor(bounds: BoundingBox) {
    this.bounds = bounds;
  }

  /**
   * Insert entity into this node or child nodes
   */
  insert(entity: Entity, depth: number, maxDepth: number): void {
    // If has children, try to insert into appropriate child
    if (this.children) {
      const childIndex = this.getChildIndex(entity.bounds);
      if (childIndex !== -1) {
        this.children[childIndex].insert(entity, depth + 1, maxDepth);
        return;
      }
    }

    // Store in this node
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

  /**
   * Remove entity from this node or children
   */
  remove(entity: Entity): boolean {
    // Check this node first
    const idx = this.entities.findIndex((e) => e.id === entity.id);
    if (idx !== -1) {
      this.entities.splice(idx, 1);
      return true;
    }

    // Check children
    if (this.children) {
      const childIndex = this.getChildIndex(entity.bounds);
      if (childIndex !== -1) {
        return this.children[childIndex].remove(entity);
      }
    }

    return false;
  }

  /**
   * Query all entities that intersect with given bounds
   */
  query(bounds: BoundingBox): Entity[] {
    const results: Entity[] = [];

    // Skip if no intersection
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

  /**
   * Subdivide this node into 4 quadrants
   */
  private subdivide(): void {
    const { minX, minY, maxX, maxY } = this.bounds;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    this.children = [
      // NW (top-left)
      new QuadtreeNode({ minX, minY: midY, maxX: midX, maxY }),
      // NE (top-right)
      new QuadtreeNode({ minX: midX, minY: midY, maxX, maxY }),
      // SW (bottom-left)
      new QuadtreeNode({ minX, minY, maxX: midX, maxY: midY }),
      // SE (bottom-right)
      new QuadtreeNode({ minX: midX, minY, maxX, maxY: midY }),
    ];
  }

  /**
   * Reinsert entities into child nodes after subdivision
   */
  private reinsertEntities(depth: number, maxDepth: number): void {
    const entities = this.entities;
    this.entities = [];

    for (const entity of entities) {
      const childIndex = this.getChildIndex(entity.bounds);
      if (childIndex !== -1) {
        this.children![childIndex].insert(entity, depth + 1, maxDepth);
      } else {
        // Entity spans multiple quadrants - keep in parent
        this.entities.push(entity);
      }
    }
  }

  /**
   * Get index of child node that contains the entity center
   * Returns -1 if entity spans multiple children or no children exist
   */
  private getChildIndex(entityBounds: BoundingBox): number {
    if (!this.children) return -1;

    const { minX, minY, maxX, maxY } = this.bounds;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    // Use entity center to determine quadrant
    const centerX = (entityBounds.minX + entityBounds.maxX) / 2;
    const centerY = (entityBounds.minY + entityBounds.maxY) / 2;

    const left = centerX < midX;
    const top = centerY >= midY;

    if (left && top) return 0; // NW
    if (!left && top) return 1; // NE
    if (left && !top) return 2; // SW
    return 3; // SE
  }

  /**
   * Check if two bounding boxes intersect
   */
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
 * Quadtree spatial index for 2D viewport culling
 */
export class Quadtree {
  private root: QuadtreeNode;
  private maxDepth: number;
  private entityMap = new Map<string, Entity>();

  /**
   * Create a new Quadtree with world bounds
   */
  constructor(bounds: BoundingBox, maxDepth: number = 8) {
    this.root = new QuadtreeNode(bounds);
    this.maxDepth = maxDepth;
  }

  /**
   * Insert an entity into the spatial index
   */
  insert(entity: Entity): void {
    this.entityMap.set(entity.id, entity);
    this.root.insert(entity, 0, this.maxDepth);
  }

  /**
   * Remove an entity by ID
   */
  remove(entityId: string): void {
    const entity = this.entityMap.get(entityId);
    if (entity) {
      this.root.remove(entity);
      this.entityMap.delete(entityId);
    }
  }

  /**
   * Update an entity (remove and re-insert)
   */
  update(entity: Entity): void {
    this.remove(entity.id);
    this.insert(entity);
  }

  /**
   * Query all entities within bounding box
   */
  query(bounds: BoundingBox): Entity[] {
    return this.root.query(bounds);
  }

  /**
   * Query entities near a point (within radius)
   */
  queryPoint(x: number, y: number, radius: number = 0): Entity[] {
    const bounds: BoundingBox = {
      minX: x - radius,
      minY: y - radius,
      maxX: x + radius,
      maxY: y + radius,
    };
    return this.query(bounds).filter((e) => this.pointInBounds(x, y, e.bounds));
  }

  /**
   * Clear all entities from the index
   */
  clear(): void {
    this.root = new QuadtreeNode(this.root.bounds);
    this.entityMap.clear();
  }

  /**
   * Get number of entities in the index
   */
  get size(): number {
    return this.entityMap.size;
  }

  /**
   * Check if point is inside bounds
   */
  private pointInBounds(x: number, y: number, bounds: BoundingBox): boolean {
    return (
      x >= bounds.minX &&
      x <= bounds.maxX &&
      y >= bounds.minY &&
      y <= bounds.maxY
    );
  }
}

/**
 * Create default world bounds for quadtree
 */
export function createDefaultBounds(): BoundingBox {
  return {
    minX: -10000,
    minY: -10000,
    maxX: 10000,
    maxY: 10000,
  };
}