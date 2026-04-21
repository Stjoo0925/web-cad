/**
 * mesh-operations.ts
 * 3D Mesh Operations for CAD
 *
 * Creates 3D geometry from 2D profiles:
 * - EXTRUDE: 2D profile → 3D solid (extrusion)
 * - REVOLVE: 2D profile → 3D solid by rotating around axis
 * - LOFT: Blend between cross-sections
 * - SWEEP: Move profile along path
 */

import {
  vec3,
  type Vec3,
  vec3Sub,
  vec3Scale,
  vec3Dot,
  vec3Cross,
  vec3Add,
  vec3Normalize,
} from "./vector3.js";
import { mat4Identity, mat4TransformPoint, type Mat4 } from "./matrix4.js";

export interface Mesh {
  vertices: Vec3[];
  faces: number[];
  normals: Vec3[];
}

export interface Profile {
  vertices: Vec3[];
  closed: boolean;
}

export interface Path {
  points: Vec3[];
  tangents: Vec3[];
}

export interface SweepOptions {
  scale?: number;
  rotation?: number;
  pivot?: Vec3;
}

/**
 * Create 3D mesh from 2D profile by extrusion
 */
export function extrudeMesh(
  profile: Profile,
  height: number,
  direction: Vec3 = { x: 0, y: 0, z: 1 },
): Mesh {
  const { vertices, closed } = profile;
  if (vertices.length < 3) {
    return { vertices: [], faces: [], normals: [] };
  }

  const mesh: Mesh = { vertices: [], faces: [], normals: [] };
  const normal = vec3Normalize(direction);
  const heightAbs = Math.abs(height);
  const sign = height >= 0 ? 1 : -1;

  // Bottom vertices
  const bottomVerts = vertices.map((v) => ({ ...v }));
  // Top vertices (translated)
  const topVerts = vertices.map((v) => ({
    x: v.x + normal.x * heightAbs * sign,
    y: v.y + normal.y * heightAbs * sign,
    z: v.z + normal.z * heightAbs * sign,
  }));

  // Side face vertex indices
  const n = vertices.length;

  // Add all vertices
  mesh.vertices.push(...bottomVerts);
  mesh.vertices.push(...topVerts);

  // Side faces (quads → triangles)
  for (let i = 0; i < n - 1; i++) {
    const b0 = i;
    const b1 = i + 1;
    const t0 = n + i;
    const t1 = n + i + 1;

    // Bottom triangle
    mesh.faces.push(b0, b1, t1);
    // Top triangle (reversed for correct winding)
    mesh.faces.push(b0, t1, t0);
  }

  if (closed) {
    // Close the side faces
    const b0 = n - 1;
    const b1 = 0;
    const t0 = 2 * n - 1;
    const t1 = n;

    mesh.faces.push(b0, b1, t1);
    mesh.faces.push(b0, t1, t0);
  }

  // Bottom face
  if (closed) {
    const bottomCenter = calculateCentroid(vertices);
    const bottomCenterIdx = mesh.vertices.length;
    mesh.vertices.push(bottomCenter);

    for (let i = 0; i < n - 1; i++) {
      mesh.faces.push(bottomCenterIdx, i + 1, i);
    }
  }

  // Top face
  if (closed) {
    const topCenter = calculateCentroid(topVerts);
    const topCenterIdx = mesh.vertices.length;
    mesh.vertices.push(topCenter);

    for (let i = 0; i < n - 1; i++) {
      mesh.faces.push(topCenterIdx, n + i, n + i + 1);
    }
  }

  // Calculate normals
  mesh.normals = calculateVertexNormals(mesh.vertices, mesh.faces);

  return mesh;
}

/**
 * Create 3D mesh by revolving profile around axis
 */
export function revolveMesh(
  profile: Profile,
  axisStart: Vec3,
  axisEnd: Vec3,
  angle: number = 360,
  segments: number = 32,
): Mesh {
  const { vertices, closed } = profile;
  if (vertices.length < 2) {
    return { vertices: [], faces: [], normals: [] };
  }

  const mesh: Mesh = { vertices: [], faces: [], normals: [] };
  const axis = vec3Sub(axisEnd, axisStart);
  const axisLen = Math.sqrt(
    axis.x * axis.x + axis.y * axis.y + axis.z * axis.z,
  );
  const axisNorm = {
    x: axis.x / axisLen,
    y: axis.y / axisLen,
    z: axis.z / axisLen,
  };

  // Calculate rotation matrix around axis
  const angleRad = (angle * Math.PI) / 180;
  const actualSegments = angle >= 360 ? segments : Math.max(segments, 4);

  // Generate vertices for each segment
  const allVerts: Vec3[][] = [];

  for (let seg = 0; seg <= actualSegments; seg++) {
    const segVerts: Vec3[] = [];
    const segAngle = (seg / actualSegments) * angleRad;

    // Rotate each vertex around axis
    for (const v of vertices) {
      const rotated = rotatePointAroundAxis(v, axisStart, axisNorm, segAngle);
      segVerts.push(rotated);
    }

    allVerts.push(segVerts);
    mesh.vertices.push(...segVerts);
  }

  // Generate faces
  const vertsPerRing = vertices.length;

  for (let seg = 0; seg < actualSegments; seg++) {
    for (let i = 0; i < vertsPerRing - 1; i++) {
      const v0 = seg * vertsPerRing + i;
      const v1 = seg * vertsPerRing + i + 1;
      const v2 = (seg + 1) * vertsPerRing + i + 1;
      const v3 = (seg + 1) * vertsPerRing + i;

      // Quad → two triangles
      mesh.faces.push(v0, v1, v2);
      mesh.faces.push(v0, v2, v3);
    }

    if (closed) {
      // Close each ring
      const v0 = seg * vertsPerRing + vertsPerRing - 1;
      const v1 = seg * vertsPerRing;
      const v2 = (seg + 1) * vertsPerRing;
      const v3 = (seg + 1) * vertsPerRing + vertsPerRing - 1;

      mesh.faces.push(v0, v1, v2);
      mesh.faces.push(v0, v2, v3);
    }
  }

  // Calculate normals
  mesh.normals = calculateVertexNormals(mesh.vertices, mesh.faces);

  return mesh;
}

/**
 * Create 3D mesh by lofting between cross-sections
 */
export function loftMesh(profiles: Profile[], closed: boolean = false): Mesh {
  if (profiles.length < 2) {
    return { vertices: [], faces: [], normals: [] };
  }

  const mesh: Mesh = { vertices: [], faces: [], normals: [] };

  // Determine maximum vertex count
  let maxVerts = 0;
  for (const profile of profiles) {
    maxVerts = Math.max(maxVerts, profile.vertices.length);
  }

  // Generate vertices for each profile level
  const levelVerts: Vec3[][] = [];

  for (let level = 0; level < profiles.length; level++) {
    const profile = profiles[level];
    const levelVertCount = profile.vertices.length;

    // Distribute vertices evenly if counts differ
    const levelVertsList: Vec3[] = [];

    for (let i = 0; i < maxVerts; i++) {
      const srcIdx = (i * levelVertCount) / maxVerts;
      const srcIdxFloor = Math.floor(srcIdx);
      const srcIdxCeil = Math.min(srcIdxFloor + 1, levelVertCount - 1);
      const t = srcIdx - srcIdxFloor;

      const v0 = profile.vertices[srcIdxFloor];
      const v1 = profile.vertices[srcIdxCeil];

      levelVertsList.push({
        x: v0.x + (v1.x - v0.x) * t,
        y: v0.y + (v1.y - v0.y) * t,
        z: v0.z + (v1.z - v0.z) * t,
      });
    }

    levelVerts.push(levelVertsList);
    mesh.vertices.push(...levelVertsList);
  }

  // Generate faces between adjacent levels
  const vertsPerLevel = maxVerts;

  for (let level = 0; level < profiles.length - 1; level++) {
    for (let i = 0; i < maxVerts - 1; i++) {
      const v0 = level * vertsPerLevel + i;
      const v1 = level * vertsPerLevel + i + 1;
      const v2 = (level + 1) * vertsPerLevel + i + 1;
      const v3 = (level + 1) * vertsPerLevel + i;

      mesh.faces.push(v0, v1, v2);
      mesh.faces.push(v0, v2, v3);
    }

    if (closed) {
      const v0 = level * vertsPerLevel + maxVerts - 1;
      const v1 = level * vertsPerLevel;
      const v2 = (level + 1) * vertsPerLevel;
      const v3 = (level + 1) * vertsPerLevel + maxVerts - 1;

      mesh.faces.push(v0, v1, v2);
      mesh.faces.push(v0, v2, v3);
    }
  }

  // Calculate normals
  mesh.normals = calculateVertexNormals(mesh.vertices, mesh.faces);

  return mesh;
}

/**
 * Create 3D mesh by sweeping profile along path
 */
export function sweepMesh(
  profile: Profile,
  path: Path,
  options: SweepOptions = {},
): Mesh {
  const { vertices } = profile;
  if (vertices.length < 3 || path.points.length < 2) {
    return { vertices: [], faces: [], normals: [] };
  }

  const mesh: Mesh = { vertices: [], faces: [], normals: [] };
  const { scale = 1, rotation = 0, pivot = { x: 0, y: 0, z: 0 } } = options;

  // Generate vertices along path
  const allVerts: Vec3[][] = [];
  const n = vertices.length;

  for (let seg = 0; seg < path.points.length; seg++) {
    const point = path.points[seg];
    const tangent = path.tangents[seg] || { x: 0, y: 0, z: 1 };
    const segVerts: Vec3[] = [];

    for (const v of vertices) {
      // Apply scale
      const scaled = {
        x: v.x * scale,
        y: v.y * scale,
        z: v.z,
      };

      // Create transformation matrix along path
      const matrix = createFrameMatrix(point, tangent, pivot);
      const transformed = mat4TransformPoint(matrix, scaled);
      segVerts.push(transformed);
    }

    allVerts.push(segVerts);
    mesh.vertices.push(...segVerts);
  }

  // Generate faces
  const vertsPerRing = vertices.length;

  for (let seg = 0; seg < path.points.length - 1; seg++) {
    for (let i = 0; i < n - 1; i++) {
      const v0 = seg * vertsPerRing + i;
      const v1 = seg * vertsPerRing + i + 1;
      const v2 = (seg + 1) * vertsPerRing + i + 1;
      const v3 = (seg + 1) * vertsPerRing + i;

      mesh.faces.push(v0, v1, v2);
      mesh.faces.push(v0, v2, v3);
    }

    if (profile.closed) {
      const v0 = seg * vertsPerRing + n - 1;
      const v1 = seg * vertsPerRing;
      const v2 = (seg + 1) * vertsPerRing;
      const v3 = (seg + 1) * vertsPerRing + n - 1;

      mesh.faces.push(v0, v1, v2);
      mesh.faces.push(v0, v2, v3);
    }
  }

  // Calculate normals
  mesh.normals = calculateVertexNormals(mesh.vertices, mesh.faces);

  return mesh;
}

/**
 * Calculate centroid of vertices
 */
function calculateCentroid(vertices: Vec3[]): Vec3 {
  if (vertices.length === 0) return { x: 0, y: 0, z: 0 };

  let cx = 0,
    cy = 0,
    cz = 0;
  for (const v of vertices) {
    cx += v.x;
    cy += v.y;
    cz += v.z;
  }

  const n = vertices.length;
  return { x: cx / n, y: cy / n, z: cz / n };
}

/**
 * Rotate point around axis
 */
function rotatePointAroundAxis(
  point: Vec3,
  axisStart: Vec3,
  axisDir: Vec3,
  angle: number,
): Vec3 {
  // Translate point to origin
  const p = vec3Sub(point, axisStart);

  // Decompose into parallel and perpendicular components
  const parallel = vec3Scale(axisDir, vec3Dot(p, axisDir));
  const perpendicular = vec3Sub(p, parallel);

  // Cross product gives rotation direction
  const cross = vec3Cross(axisDir, perpendicular);
  const dot = vec3Dot(axisDir, perpendicular);

  // Calculate rotated perpendicular component
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  const rotated = {
    x: perpendicular.x * cosA + cross.x * sinA + parallel.x,
    y: perpendicular.y * cosA + cross.y * sinA + parallel.y,
    z: perpendicular.z * cosA + cross.z * sinA + parallel.z,
  };

  return vec3Add(rotated, axisStart);
}

/**
 * Calculate vertex normals using face normals
 */
function calculateVertexNormals(vertices: Vec3[], faces: number[]): Vec3[] {
  const normals: Vec3[] = vertices.map(() => ({ x: 0, y: 0, z: 0 }));

  // Accumulate face normals
  for (let i = 0; i < faces.length; i += 3) {
    const i0 = faces[i];
    const i1 = faces[i + 1];
    const i2 = faces[i + 2];

    const v0 = vertices[i0];
    const v1 = vertices[i1];
    const v2 = vertices[i2];

    const edge1 = vec3Sub(v1, v0);
    const edge2 = vec3Sub(v2, v0);
    const faceNormal = vec3Normalize(vec3Cross(edge1, edge2));

    normals[i0] = vec3Add(normals[i0], faceNormal);
    normals[i1] = vec3Add(normals[i1], faceNormal);
    normals[i2] = vec3Add(normals[i2], faceNormal);
  }

  // Normalize each normal
  for (let i = 0; i < normals.length; i++) {
    normals[i] = vec3Normalize(normals[i]);
  }

  return normals;
}

/**
 * Create a frame matrix at point with given tangent
 */
function createFrameMatrix(position: Vec3, tangent: Vec3, pivot: Vec3): Mat4 {
  // Create orthonormal basis
  const up = { x: 0, y: 0, z: 1 };
  const normalizedTangent = vec3Normalize(tangent);

  // Handle case where tangent is parallel to up
  let right: Vec3;
  if (Math.abs(vec3Dot(normalizedTangent, up)) > 0.99) {
    right = vec3Normalize(vec3Cross(normalizedTangent, { x: 1, y: 0, z: 0 }));
  } else {
    right = vec3Normalize(vec3Cross(up, normalizedTangent));
  }

  const newUp = vec3Cross(normalizedTangent, right);

  // Create transformation matrix
  return {
    m: [
      right.x,
      right.y,
      right.z,
      0,
      newUp.x,
      newUp.y,
      newUp.z,
      0,
      normalizedTangent.x,
      normalizedTangent.y,
      normalizedTangent.z,
      0,
      position.x + pivot.x,
      position.y + pivot.y,
      position.z + pivot.z,
      1,
    ],
  };
}

/**
 * Convert mesh to Float32Array for WebGL rendering
 */
export function meshToBuffers(mesh: Mesh): {
  vertices: Float32Array;
  normals: Float32Array;
  indices: Uint16Array;
} {
  return {
    vertices: new Float32Array(mesh.vertices.flatMap((v) => [v.x, v.y, v.z])),
    normals: new Float32Array(mesh.normals.flatMap((n) => [n.x, n.y, n.z])),
    indices: new Uint16Array(mesh.faces),
  };
}
