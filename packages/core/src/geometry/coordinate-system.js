export class CoordinateSystem {
  constructor(origin = { x: 0, y: 0, z: 0 }) {
    this.origin = { ...origin };
  }

  setOrigin(origin) {
    this.origin = { ...origin };
  }

  setOriginFromBoundingBox(boundingBox) {
    this.origin = { ...boundingBox.center };
  }

  worldToLocal(point) {
    return {
      x: point.x - this.origin.x,
      y: point.y - this.origin.y,
      z: point.z - this.origin.z
    };
  }

  localToWorld(point) {
    return {
      x: point.x + this.origin.x,
      y: point.y + this.origin.y,
      z: point.z + this.origin.z
    };
  }

  getOrigin() {
    return { ...this.origin };
  }
}
