export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Origin {
  x: number;
  y: number;
  z: number;
}

export class CoordinateSystem {
  private origin: Point3D;

  constructor(origin: Origin = { x: 0, y: 0, z: 0 }) {
    this.origin = { ...origin };
  }

  setOrigin(origin: Origin): void {
    this.origin = { ...origin };
  }

  setOriginFromBoundingBox(boundingBox: { center: Point3D }): void {
    this.origin = { ...boundingBox.center };
  }

  worldToLocal(point: Point3D): Point3D {
    return {
      x: point.x - this.origin.x,
      y: point.y - this.origin.y,
      z: point.z - this.origin.z
    };
  }

  localToWorld(point: Point3D): Point3D {
    return {
      x: point.x + this.origin.x,
      y: point.y + this.origin.y,
      z: point.z + this.origin.z
    };
  }

  getOrigin(): Point3D {
    return { ...this.origin };
  }
}