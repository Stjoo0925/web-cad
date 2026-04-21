/**
 * matrix4.ts
 * 4x4 Matrix Operations
 *
 * 4x4 matrices for 3D transformations in CAD operations.
 */

import type { Vec3 } from "./vector3.js";

export interface Mat4 {
  m: number[];
}

/**
 * Create identity matrix
 */
export function mat4Identity(): Mat4 {
  return {
    m: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  };
}

/**
 * Create matrix from array (row-major)
 */
export function mat4FromArray(arr: number[]): Mat4 {
  return { m: arr.slice(0, 16) };
}

/**
 * Convert matrix to array
 */
export function mat4ToArray(m: Mat4): number[] {
  return m.m.slice();
}

/**
 * Clone matrix
 */
export function mat4Clone(m: Mat4): Mat4 {
  return { m: m.m.slice() };
}

/**
 * Matrix multiplication (m1 * m2)
 */
export function mat4Mul(m1: Mat4, m2: Mat4): Mat4 {
  const a = m1.m;
  const b = m2.m;
  const result = new Array(16).fill(0);

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      for (let k = 0; k < 4; k++) {
        result[row * 4 + col] += a[row * 4 + k] * b[k * 4 + col];
      }
    }
  }

  return { m: result };
}

/**
 * Matrix addition
 */
export function mat4Add(m1: Mat4, m2: Mat4): Mat4 {
  const result = new Array(16);
  for (let i = 0; i < 16; i++) {
    result[i] = m1.m[i] + m2.m[i];
  }
  return { m: result };
}

/**
 * Matrix subtraction
 */
export function mat4Sub(m1: Mat4, m2: Mat4): Mat4 {
  const result = new Array(16);
  for (let i = 0; i < 16; i++) {
    result[i] = m1.m[i] - m2.m[i];
  }
  return { m: result };
}

/**
 * Matrix scalar multiplication
 */
export function mat4Scale(m: Mat4, s: number): Mat4 {
  const result = new Array(16);
  for (let i = 0; i < 16; i++) {
    result[i] = m.m[i] * s;
  }
  return { m: result };
}

/**
 * Matrix transpose
 */
export function mat4Transpose(m: Mat4): Mat4 {
  const result = new Array(16);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      result[row * 4 + col] = m.m[col * 4 + row];
    }
  }
  return { m: result };
}

/**
 * Matrix determinant
 */
export function mat4Determinant(m: Mat4): number {
  const a = m.m;

  const a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a03 = a[3];
  const a10 = a[4],
    a11 = a[5],
    a12 = a[6],
    a13 = a[7];
  const a20 = a[8],
    a21 = a[9],
    a22 = a[10],
    a23 = a[11];
  const a30 = a[12],
    a31 = a[13],
    a32 = a[14],
    a33 = a[15];

  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;

  return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
}

/**
 * Matrix inverse
 */
export function mat4Inverse(m: Mat4): Mat4 | null {
  const a = m.m;

  const a00 = a[0],
    a01 = a[1],
    a02 = a[2],
    a03 = a[3];
  const a10 = a[4],
    a11 = a[5],
    a12 = a[6],
    a13 = a[7];
  const a20 = a[8],
    a21 = a[9],
    a22 = a[10],
    a23 = a[11];
  const a30 = a[12],
    a31 = a[13],
    a32 = a[14],
    a33 = a[15];

  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;

  let det =
    b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) return null;
  det = 1 / det;

  const result = new Array(16);
  result[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
  result[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
  result[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
  result[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
  result[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
  result[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
  result[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
  result[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
  result[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
  result[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
  result[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
  result[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
  result[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
  result[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
  result[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
  result[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

  return { m: result };
}

/**
 * Translation matrix
 */
export function mat4Translation(x: number, y: number, z: number): Mat4 {
  return {
    m: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1],
  };
}

/**
 * Translation matrix from vector
 */
export function mat4TranslationFromVec(v: Vec3): Mat4 {
  return mat4Translation(v.x, v.y, v.z);
}

/**
 * Scale matrix (xyz components)
 */
export function mat4ScaleXYZ(sx: number, sy: number, sz: number): Mat4 {
  return {
    m: [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1],
  };
}

/**
 * Scale matrix from vector
 */
export function mat4ScaleFromVec(v: Vec3): Mat4 {
  return mat4ScaleXYZ(v.x, v.y, v.z);
}

/**
 * Uniform scale matrix
 */
export function mat4UniformScale(s: number): Mat4 {
  return mat4ScaleXYZ(s, s, s);
}

/**
 * Rotation matrix around X axis (radians)
 */
export function mat4RotationX(angle: number): Mat4 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    m: [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1],
  };
}

/**
 * Rotation matrix around Y axis (radians)
 */
export function mat4RotationY(angle: number): Mat4 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    m: [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1],
  };
}

/**
 * Rotation matrix around Z axis (radians)
 */
export function mat4RotationZ(angle: number): Mat4 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return {
    m: [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  };
}

/**
 * Rotation matrix from axis and angle (radians)
 */
export function mat4RotationAxis(axis: Vec3, angle: number): Mat4 {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const t = 1 - c;
  const x = axis.x,
    y = axis.y,
    z = axis.z;

  return {
    m: [
      t * x * x + c,
      t * x * y + s * z,
      t * x * z - s * y,
      0,
      t * x * y - s * z,
      t * y * y + c,
      t * y * z + s * x,
      0,
      t * x * z + s * y,
      t * y * z - s * x,
      t * z * z + c,
      0,
      0,
      0,
      0,
      1,
    ],
  };
}

/**
 * Rotation matrix from Euler angles (YXZ order, like Blender)
 */
export function mat4Euler(yaw: number, pitch: number, roll: number): Mat4 {
  return mat4Mul(
    mat4Mul(mat4RotationY(yaw), mat4RotationX(pitch)),
    mat4RotationZ(roll),
  );
}

/**
 * Transformation matrix from position, rotation, scale
 */
export function mat4TRS(position: Vec3, rotation: Mat4, scale: Vec3): Mat4 {
  return mat4Mul(
    mat4Mul(rotation, mat4ScaleFromVec(scale)),
    mat4TranslationFromVec(position),
  );
}

/**
 * Look-at view matrix (for camera)
 */
export function mat4LookAt(eye: Vec3, target: Vec3, up: Vec3): Mat4 {
  const z = {
    x: eye.x - target.x,
    y: eye.y - target.y,
    z: eye.z - target.z,
  };
  const zLen = Math.sqrt(z.x * z.x + z.y * z.y + z.z * z.z);
  const zNorm = { x: z.x / zLen, y: z.y / zLen, z: z.z / zLen };

  const x = {
    x: up.y * zNorm.z - up.z * zNorm.y,
    y: up.z * zNorm.x - up.x * zNorm.z,
    z: up.x * zNorm.y - up.y * zNorm.x,
  };
  const xLen = Math.sqrt(x.x * x.x + x.y * x.y + x.z * x.z);
  const xNorm = { x: x.x / xLen, y: x.y / xLen, z: x.z / xLen };

  const y = {
    x: zNorm.y * xNorm.z - zNorm.z * xNorm.y,
    y: zNorm.z * xNorm.x - zNorm.x * xNorm.z,
    z: zNorm.x * xNorm.y - zNorm.y * xNorm.x,
  };

  return {
    m: [
      xNorm.x,
      y.x,
      zNorm.x,
      0,
      xNorm.y,
      y.y,
      zNorm.y,
      0,
      xNorm.z,
      y.z,
      zNorm.z,
      0,
      -(xNorm.x * eye.x + xNorm.y * eye.y + xNorm.z * eye.z),
      -(y.x * eye.x + y.y * eye.y + y.z * eye.z),
      -(zNorm.x * eye.x + zNorm.y * eye.y + zNorm.z * eye.z),
      1,
    ],
  };
}

/**
 * Perspective projection matrix
 */
export function mat4Perspective(
  fovY: number,
  aspect: number,
  near: number,
  far: number,
): Mat4 {
  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);

  return {
    m: [
      f / aspect,
      0,
      0,
      0,
      0,
      f,
      0,
      0,
      0,
      0,
      (far + near) * nf,
      -1,
      0,
      0,
      2 * far * near * nf,
      0,
    ],
  };
}

/**
 * Orthographic projection matrix
 */
export function mat4Ortho(
  left: number,
  right: number,
  bottom: number,
  top: number,
  near: number,
  far: number,
): Mat4 {
  const lr = 1 / (left - right);
  const bt = 1 / (bottom - top);
  const nf = 1 / (near - far);

  return {
    m: [
      -2 * lr,
      0,
      0,
      0,
      0,
      -2 * bt,
      0,
      0,
      0,
      0,
      2 * nf,
      0,
      (left + right) * lr,
      (top + bottom) * bt,
      (far + near) * nf,
      1,
    ],
  };
}

/**
 * Transform point (assumes w=1)
 */
export function mat4TransformPoint(m: Mat4, v: Vec3): Vec3 {
  const x = v.x * m.m[0] + v.y * m.m[4] + v.z * m.m[8] + m.m[12];
  const y = v.x * m.m[1] + v.y * m.m[5] + v.z * m.m[9] + m.m[13];
  const z = v.x * m.m[2] + v.y * m.m[6] + v.z * m.m[10] + m.m[14];
  return { x, y, z };
}

/**
 * Transform direction (ignores translation, assumes w=0)
 */
export function mat4TransformDirection(m: Mat4, v: Vec3): Vec3 {
  const x = v.x * m.m[0] + v.y * m.m[4] + v.z * m.m[8];
  const y = v.x * m.m[1] + v.y * m.m[5] + v.z * m.m[9];
  const z = v.x * m.m[2] + v.y * m.m[6] + v.z * m.m[10];
  return { x, y, z };
}

/**
 * Transform normal (like direction but properly handles non-uniform scale)
 */
export function mat4TransformNormal(m: Mat4, v: Vec3): Vec3 {
  const inv = mat4Inverse(m);
  if (!inv) return v;
  return mat4TransformDirection(mat4Transpose(inv), v);
}

/**
 * Get translation component from matrix
 */
export function mat4GetTranslation(m: Mat4): Vec3 {
  return { x: m.m[12], y: m.m[13], z: m.m[14] };
}

/**
 * Get scale component from matrix
 */
export function mat4GetScale(m: Mat4): Vec3 {
  return {
    x: Math.sqrt(m.m[0] * m.m[0] + m.m[1] * m.m[1] + m.m[2] * m.m[2]),
    y: Math.sqrt(m.m[4] * m.m[4] + m.m[5] * m.m[5] + m.m[6] * m.m[6]),
    z: Math.sqrt(m.m[8] * m.m[8] + m.m[9] * m.m[9] + m.m[10] * m.m[10]),
  };
}
