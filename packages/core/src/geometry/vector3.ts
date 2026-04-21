/**
 * vector3.ts
 * 3D Vector Operations
 *
 * Basic 3D vector math operations for CAD geometry.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Mat4 {
  // Row-major 4x4 matrix
  m: number[];
}

/**
 * Create a new vector
 */
export function vec3(x: number = 0, y: number = 0, z: number = 0): Vec3 {
  return { x, y, z };
}

/**
 * Create vector from array
 */
export function vec3FromArray(arr: number[]): Vec3 {
  return { x: arr[0] ?? 0, y: arr[1] ?? 0, z: arr[2] ?? 0 };
}

/**
 * Convert vector to array
 */
export function vec3ToArray(v: Vec3): number[] {
  return [v.x, v.y, v.z];
}

/**
 * Add two vectors
 */
export function vec3Add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

/**
 * Subtract vectors (a - b)
 */
export function vec3Sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

/**
 * Multiply vector by scalar
 */
export function vec3Scale(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

/**
 * Divide vector by scalar
 */
export function vec3Div(v: Vec3, s: number): Vec3 {
  return { x: v.x / s, y: v.y / s, z: v.z / s };
}

/**
 * Vector dot product
 */
export function vec3Dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Vector cross product (a x b)
 */
export function vec3Cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/**
 * Vector magnitude (length)
 */
export function vec3Length(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/**
 * Vector magnitude squared (faster than length)
 */
export function vec3LengthSq(v: Vec3): number {
  return v.x * v.x + v.y * v.y + v.z * v.z;
}

/**
 * Normalize vector (unit length)
 */
export function vec3Normalize(v: Vec3): Vec3 {
  const len = vec3Length(v);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return vec3Div(v, len);
}

/**
 * Vector distance
 */
export function vec3Distance(a: Vec3, b: Vec3): number {
  return vec3Length(vec3Sub(b, a));
}

/**
 * Vector distance squared
 */
export function vec3DistanceSq(a: Vec3, b: Vec3): number {
  return vec3LengthSq(vec3Sub(b, a));
}

/**
 * Linear interpolation between two vectors
 */
export function vec3Lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

/**
 * Vector negation (-v)
 */
export function vec3Negate(v: Vec3): Vec3 {
  return { x: -v.x, y: -v.y, z: -v.z };
}

/**
 * Vector perpendicular (rotated 90 degrees in XY plane)
 */
export function vec3Perpendicular(v: Vec3): Vec3 {
  return { x: -v.y, y: v.x, z: 0 };
}

/**
 * Project vector a onto vector b
 */
export function vec3Project(a: Vec3, b: Vec3): Vec3 {
  const dot = vec3Dot(a, b);
  const lenSq = vec3LengthSq(b);
  if (lenSq === 0) return { x: 0, y: 0, z: 0 };
  const t = dot / lenSq;
  return vec3Scale(b, t);
}

/**
 * Reflect vector about normal
 */
export function vec3Reflect(v: Vec3, normal: Vec3): Vec3 {
  const dot = vec3Dot(v, normal);
  return {
    x: v.x - 2 * dot * normal.x,
    y: v.y - 2 * dot * normal.y,
    z: v.z - 2 * dot * normal.z,
  };
}

/**
 * Angle between two vectors (in radians)
 */
export function vec3Angle(a: Vec3, b: Vec3): number {
  const dot = vec3Dot(a, b);
  const lenA = vec3Length(a);
  const lenB = vec3Length(b);
  if (lenA === 0 || lenB === 0) return 0;
  return Math.acos(Math.max(-1, Math.min(1, dot / (lenA * lenB))));
}

/**
 * Check if vectors are approximately equal
 */
export function vec3Equals(a: Vec3, b: Vec3, epsilon: number = 1e-10): boolean {
  return (
    Math.abs(a.x - b.x) < epsilon &&
    Math.abs(a.y - b.y) < epsilon &&
    Math.abs(a.z - b.z) < epsilon
  );
}

/**
 * Midpoint between two vectors
 */
export function vec3Midpoint(a: Vec3, b: Vec3): Vec3 {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
  };
}

/**
 * Create vector from spherical coordinates
 */
export function vec3FromSpherical(
  radius: number,
  theta: number,
  phi: number,
): Vec3 {
  return {
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.sin(phi) * Math.sin(theta),
    z: radius * Math.cos(phi),
  };
}

/**
 * Transform vector by 4x4 matrix (assumes w=1)
 */
export function vec3Transform(v: Vec3, m: Mat4): Vec3 {
  const x = v.x * m.m[0] + v.y * m.m[4] + v.z * m.m[8] + m.m[12];
  const y = v.x * m.m[1] + v.y * m.m[5] + v.z * m.m[9] + m.m[13];
  const z = v.x * m.m[2] + v.y * m.m[6] + v.z * m.m[10] + m.m[14];
  return { x, y, z };
}

/**
 * Rotate vector around X axis
 */
export function vec3RotateX(v: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x: v.x,
    y: v.y * c - v.z * s,
    z: v.y * s + v.z * c,
  };
}

/**
 * Rotate vector around Y axis
 */
export function vec3RotateY(v: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x: v.x * c + v.z * s,
    y: v.y,
    z: -v.x * s + v.z * c,
  };
}

/**
 * Rotate vector around Z axis
 */
export function vec3RotateZ(v: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    x: v.x * c - v.y * s,
    y: v.x * s + v.y * c,
    z: v.z,
  };
}

/**
 * Get face normal from 3 vertices (right-hand rule)
 */
export function vec3FaceNormal(v0: Vec3, v1: Vec3, v2: Vec3): Vec3 {
  const a = vec3Sub(v1, v0);
  const b = vec3Sub(v2, v0);
  return vec3Normalize(vec3Cross(a, b));
}

/**
 * Signed volume of tetrahedron (positive = left-handed, negative = right-handed)
 */
export function vec3Volume(a: Vec3, b: Vec3, c: Vec3, d: Vec3): number {
  const ab = vec3Sub(b, a);
  const ac = vec3Sub(c, a);
  const ad = vec3Sub(d, a);
  return vec3Dot(ab, vec3Cross(ac, ad)) / 6;
}
