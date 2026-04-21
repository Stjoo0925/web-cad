/**
 * dxf-importer.ts
 * DXF 파일을 엔티티로 가져오는 모듈
 *
 * Supports: POINT, LINE, LWPOLYLINE, POLYLINE, CIRCLE, ARC, TEXT, MTEXT, ELLIPSE, SPLINE, HATCH, DIMENSION, BLOCK, INSERT, 3DFACE, SOLID
 */

import type { Entity } from "../canvas/cad-canvas-renderer.js";

// Supported entity types
const SUPPORTED_ENTITY_TYPES = new Set([
  "POINT",
  "LINE",
  "LWPOLYLINE",
  "POLYLINE",
  "CIRCLE",
  "ARC",
  "TEXT",
  "MTEXT",
  "ELLIPSE",
  "SPLINE",
  "HATCH",
  "DIMENSION",
  "BLOCK",
  "INSERT",
  "3DFACE",
  "SOLID",
]);

interface DxfPoint {
  x: number;
  y: number;
  z?: number;
}

interface DxfEntity {
  type: string;
  id: string;
  layer?: string;
  position?: DxfPoint;
  start?: DxfPoint;
  end?: DxfPoint;
  center?: DxfPoint;
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  height?: number;
  width?: number;
  value?: string;
  text?: string;
  vertices?: DxfPoint[];
  vertexCount?: number;
  closed?: boolean;
  majorAxisEndpoint?: DxfPoint;
  minorAxisRatio?: number;
  rotation?: number;
  controlVertices?: { x: number; y?: number; z?: number }[];
  degree?: number;
  knots?: number[];
  hatchPattern?: string;
  hatchScale?: number;
  hatchRotation?: number;
  boundaryVertices?: DxfPoint[][];
  blockName?: string;
  blockPosition?: DxfPoint;
  blockRotation?: number;
  blockScale?: { x: number; y: number };
  thickness?: number;
  dimensionType?: string;
  dimensionText?: string;
  definitionPoint?: DxfPoint;
}

interface ParseResult {
  entities: DxfEntity[];
  warnings: string[];
}

/**
 * DXF 파싱 결과를 SDK Entity 형태로 변환합니다.
 */
function convertToSdkEntity(entity: DxfEntity): Entity {
  const base: Entity = {
    id: entity.id,
    type: entity.type,
    layer: entity.layer ?? "0",
  };

  switch (entity.type) {
    case "POINT":
    case "TEXT":
    case "MTEXT":
      return {
        ...base,
        position: entity.position,
        height: entity.height,
        value: entity.value,
        rotation: entity.rotation,
        width: entity.width,
      };
    case "LINE":
      return {
        ...base,
        start: entity.start,
        end: entity.end,
      };
    case "CIRCLE":
      return {
        ...base,
        center: entity.center,
        radius: entity.radius,
      };
    case "ARC":
      return {
        ...base,
        center: entity.center,
        radius: entity.radius,
        startAngle: entity.startAngle,
        endAngle: entity.endAngle,
      };
    case "POLYLINE":
    case "LWPOLYLINE":
      return {
        ...base,
        vertices: entity.vertices,
        closed: entity.closed,
      };
    case "ELLIPSE":
      return {
        ...base,
        center: entity.center,
        majorAxisEndpoint: entity.majorAxisEndpoint,
        radius: entity.radius,
        minorAxisRatio: entity.minorAxisRatio,
        startAngle: entity.startAngle,
        endAngle: entity.endAngle,
      };
    case "SPLINE":
      return {
        ...base,
        controlVertices: entity.controlVertices?.map((v) => ({
          x: v.x,
          y: v.y!,
        })),
        degree: entity.degree,
        knots: entity.knots,
      };
    case "HATCH":
      return {
        ...base,
        hatchPattern: entity.hatchPattern,
        hatchScale: entity.hatchScale,
        hatchRotation: entity.hatchRotation,
        boundaryVertices: entity.boundaryVertices,
      };
    case "BLOCK":
      return {
        ...base,
        blockName: entity.blockName,
        blockPosition: entity.blockPosition,
      };
    case "INSERT":
      return {
        ...base,
        blockName: entity.blockName,
        blockPosition: entity.blockPosition,
        blockRotation: entity.blockRotation,
        blockScale: entity.blockScale,
      };
    case "3DFACE":
    case "SOLID":
      return {
        ...base,
        vertices: entity.vertices,
        thickness: entity.thickness,
      };
    default:
      // For unknown types, preserve all properties (except partial controlVertices)
      const { controlVertices, ...rest } = entity as DxfEntity & {
        controlVertices?: { x: number; y?: number; z?: number }[];
      };
      return {
        ...base,
        ...rest,
        ...(controlVertices
          ? {
              controlVertices: controlVertices
                .filter((v) => v.y !== undefined)
                .map((v) => ({ x: v.x, y: v.y! })),
            }
          : {}),
      };
  }
}

/**
 * DXF 파일을 파싱하여 엔티티 배열을 반환합니다.
 */
export async function parseDxfFile(file: File): Promise<Entity[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const entities = parseDxfString(content);
        resolve(entities);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
}

/**
 * Generate unique entity ID
 */
function generateEntityId(): string {
  return `entity-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Find the end index of an entity in DXF lines
 */
function findEntityEndIndex(lines: string[], startIndex: number): number {
  for (let i = startIndex; i < lines.length - 1; i++) {
    if (lines[i] === "0" && i + 1 < lines.length) {
      const next = lines[i + 1];
      if (
        next === "ENDSEC" ||
        next === "EOF" ||
        SUPPORTED_ENTITY_TYPES.has(next)
      ) {
        return i;
      }
    }
  }
  return lines.length;
}

/**
 * Parse a single entity from DXF lines
 */
function parseEntity(
  lines: string[],
  startIndex: number,
  entityType: string,
): DxfEntity | null {
  const entity: DxfEntity = { type: entityType, id: generateEntityId() };
  const vertexAcc: { x?: number; y?: number; z?: number } = {};
  let i = startIndex + 2;
  const endIndex = findEntityEndIndex(lines, i);

  while (i < lines.length && i < endIndex) {
    const groupCode = lines[i];
    const value = lines[i + 1];

    if (groupCode === "8") {
      entity.layer = value;
    } else if (entityType === "POINT" && groupCode === "10") {
      entity.position = entity.position || { x: 0, y: 0 };
      entity.position.x = parseFloat(value);
    } else if (entityType === "POINT" && groupCode === "20") {
      if (!entity.position) entity.position = { x: 0, y: 0 };
      entity.position.y = parseFloat(value);
    } else if (entityType === "POINT" && groupCode === "30") {
      if (!entity.position) entity.position = { x: 0, y: 0 };
      entity.position.z = parseFloat(value) || 0;
    } else if (entityType === "LINE" && groupCode === "10") {
      entity.start = entity.start || { x: 0, y: 0 };
      entity.start.x = parseFloat(value);
    } else if (entityType === "LINE" && groupCode === "20") {
      if (!entity.start) entity.start = { x: 0, y: 0 };
      entity.start.y = parseFloat(value);
    } else if (entityType === "LINE" && groupCode === "30") {
      if (!entity.start) entity.start = { x: 0, y: 0 };
      entity.start.z = parseFloat(value) || 0;
    } else if (entityType === "LINE" && groupCode === "11") {
      entity.end = entity.end || { x: 0, y: 0 };
      entity.end.x = parseFloat(value);
    } else if (entityType === "LINE" && groupCode === "21") {
      if (!entity.end) entity.end = { x: 0, y: 0 };
      entity.end.y = parseFloat(value);
    } else if (entityType === "LINE" && groupCode === "31") {
      if (!entity.end) entity.end = { x: 0, y: 0 };
      entity.end.z = parseFloat(value) || 0;
    } else if (entityType === "CIRCLE" && groupCode === "10") {
      entity.center = entity.center || { x: 0, y: 0 };
      entity.center.x = parseFloat(value);
    } else if (entityType === "CIRCLE" && groupCode === "20") {
      if (!entity.center) entity.center = { x: 0, y: 0 };
      entity.center.y = parseFloat(value);
    } else if (entityType === "CIRCLE" && groupCode === "30") {
      if (!entity.center) entity.center = { x: 0, y: 0 };
      entity.center.z = parseFloat(value) || 0;
    } else if (entityType === "CIRCLE" && groupCode === "40") {
      entity.radius = parseFloat(value);
    } else if (entityType === "ARC" && groupCode === "10") {
      entity.center = entity.center || { x: 0, y: 0 };
      entity.center.x = parseFloat(value);
    } else if (entityType === "ARC" && groupCode === "20") {
      if (!entity.center) entity.center = { x: 0, y: 0 };
      entity.center.y = parseFloat(value);
    } else if (entityType === "ARC" && groupCode === "30") {
      if (!entity.center) entity.center = { x: 0, y: 0 };
      entity.center.z = parseFloat(value) || 0;
    } else if (entityType === "ARC" && groupCode === "40") {
      entity.radius = parseFloat(value);
    } else if (entityType === "ARC" && groupCode === "50") {
      entity.startAngle = parseFloat(value);
    } else if (entityType === "ARC" && groupCode === "51") {
      entity.endAngle = parseFloat(value);
    } else if (entityType === "TEXT" && groupCode === "10") {
      entity.position = entity.position || { x: 0, y: 0 };
      entity.position.x = parseFloat(value);
    } else if (entityType === "TEXT" && groupCode === "20") {
      if (!entity.position) entity.position = { x: 0, y: 0 };
      entity.position.y = parseFloat(value);
    } else if (entityType === "TEXT" && groupCode === "30") {
      if (!entity.position) entity.position = { x: 0, y: 0 };
      entity.position.z = parseFloat(value) || 0;
    } else if (entityType === "TEXT" && groupCode === "40") {
      entity.height = parseFloat(value);
    } else if (entityType === "TEXT" && groupCode === "1") {
      entity.value = value;
    } else if (entityType === "MTEXT" && groupCode === "10") {
      entity.position = entity.position || { x: 0, y: 0 };
      entity.position.x = parseFloat(value);
    } else if (entityType === "MTEXT" && groupCode === "20") {
      if (!entity.position) entity.position = { x: 0, y: 0 };
      entity.position.y = parseFloat(value);
    } else if (entityType === "MTEXT" && groupCode === "30") {
      if (!entity.position) entity.position = { x: 0, y: 0 };
      entity.position.z = parseFloat(value) || 0;
    } else if (entityType === "MTEXT" && groupCode === "40") {
      entity.height = parseFloat(value);
    } else if (entityType === "MTEXT" && groupCode === "41") {
      entity.width = parseFloat(value);
    } else if (entityType === "MTEXT" && groupCode === "50") {
      entity.rotation = parseFloat(value);
    } else if (entityType === "MTEXT" && groupCode === "1") {
      entity.value = value;
    } else if (entityType === "MTEXT" && groupCode === "3") {
      entity.text = (entity.text || "") + value;
    } else if (
      (entityType === "LWPOLYLINE" || entityType === "POLYLINE") &&
      groupCode === "90"
    ) {
      entity.vertexCount = parseInt(value, 10);
    } else if (
      (entityType === "LWPOLYLINE" || entityType === "POLYLINE") &&
      groupCode === "70"
    ) {
      entity.closed = value === "1";
    } else if (
      (entityType === "LWPOLYLINE" || entityType === "POLYLINE") &&
      groupCode === "10"
    ) {
      vertexAcc.x = parseFloat(value);
      if (vertexAcc.y !== undefined) {
        entity.vertices = entity.vertices || [];
        entity.vertices.push({ x: vertexAcc.x!, y: vertexAcc.y! });
        vertexAcc.x = undefined;
        vertexAcc.y = undefined;
      }
    } else if (
      (entityType === "LWPOLYLINE" || entityType === "POLYLINE") &&
      groupCode === "20"
    ) {
      vertexAcc.y = parseFloat(value);
      if (vertexAcc.x !== undefined) {
        entity.vertices = entity.vertices || [];
        entity.vertices.push({ x: vertexAcc.x!, y: vertexAcc.y! });
        vertexAcc.x = undefined;
        vertexAcc.y = undefined;
      }
    } else if (entityType === "ELLIPSE" && groupCode === "10") {
      entity.center = entity.center || { x: 0, y: 0 };
      entity.center.x = parseFloat(value);
    } else if (entityType === "ELLIPSE" && groupCode === "20") {
      if (!entity.center) entity.center = { x: 0, y: 0 };
      entity.center.y = parseFloat(value);
    } else if (entityType === "ELLIPSE" && groupCode === "30") {
      if (!entity.center) entity.center = { x: 0, y: 0 };
      entity.center.z = parseFloat(value) || 0;
    } else if (entityType === "ELLIPSE" && groupCode === "11") {
      entity.majorAxisEndpoint = entity.majorAxisEndpoint || { x: 0, y: 0 };
      entity.majorAxisEndpoint.x = parseFloat(value);
    } else if (entityType === "ELLIPSE" && groupCode === "21") {
      if (!entity.majorAxisEndpoint) entity.majorAxisEndpoint = { x: 0, y: 0 };
      entity.majorAxisEndpoint.y = parseFloat(value);
    } else if (entityType === "ELLIPSE" && groupCode === "40") {
      entity.minorAxisRatio = parseFloat(value);
    } else if (entityType === "SPLINE" && groupCode === "10") {
      entity.controlVertices = entity.controlVertices || [];
      entity.controlVertices.push({ x: parseFloat(value) });
    } else if (entityType === "SPLINE" && groupCode === "20") {
      if (entity.controlVertices && entity.controlVertices.length > 0) {
        entity.controlVertices[entity.controlVertices.length - 1].y =
          parseFloat(value);
      }
    } else if (entityType === "SPLINE" && groupCode === "30") {
      if (entity.controlVertices && entity.controlVertices.length > 0) {
        entity.controlVertices[entity.controlVertices.length - 1].z =
          parseFloat(value);
      }
    } else if (entityType === "SPLINE" && groupCode === "71") {
      entity.degree = parseInt(value, 10);
    } else if (entityType === "SPLINE" && groupCode === "40") {
      entity.knots = entity.knots || [];
      entity.knots.push(parseFloat(value));
    } else if (entityType === "HATCH" && groupCode === "2") {
      entity.hatchPattern = value;
    } else if (entityType === "HATCH" && groupCode === "41") {
      entity.hatchScale = parseFloat(value);
    } else if (entityType === "HATCH" && groupCode === "50") {
      entity.hatchRotation = parseFloat(value);
    } else if (entityType === "BLOCK" && groupCode === "2") {
      entity.blockName = value;
    } else if (entityType === "BLOCK" && groupCode === "10") {
      entity.blockPosition = entity.blockPosition || { x: 0, y: 0 };
      entity.blockPosition.x = parseFloat(value);
    } else if (entityType === "BLOCK" && groupCode === "20") {
      if (!entity.blockPosition) entity.blockPosition = { x: 0, y: 0 };
      entity.blockPosition.y = parseFloat(value);
    } else if (entityType === "INSERT" && groupCode === "2") {
      entity.blockName = value;
    } else if (entityType === "INSERT" && groupCode === "10") {
      entity.blockPosition = entity.blockPosition || { x: 0, y: 0 };
      entity.blockPosition.x = parseFloat(value);
    } else if (entityType === "INSERT" && groupCode === "20") {
      if (!entity.blockPosition) entity.blockPosition = { x: 0, y: 0 };
      entity.blockPosition.y = parseFloat(value);
    } else if (entityType === "INSERT" && groupCode === "50") {
      entity.blockRotation = parseFloat(value);
    }

    i += 2;
  }

  return entity;
}

/**
 * Parse DXF content into entities
 */
function parseDxf(content: string): ParseResult {
  const warnings: string[] = [];
  const lines = content.split(/\r?\n/).map((line) => line.trim());
  const entities: DxfEntity[] = [];

  let i = 0;
  while (i < lines.length) {
    if (lines[i] === "ENTITIES") break;
    i++;
  }
  i++;

  while (i < lines.length) {
    if (lines[i] === "ENDSEC" || lines[i] === "EOF") break;

    if (lines[i] === "0" && i + 1 < lines.length) {
      const entityType = lines[i + 1];

      if (SUPPORTED_ENTITY_TYPES.has(entityType)) {
        const entity = parseEntity(lines, i, entityType);
        if (entity) {
          entities.push(entity);
          i = findEntityEndIndex(lines, i);
          continue;
        }
      } else if (entityType !== "ENDSEC" && entityType !== "EOF") {
        warnings.push(`Unsupported entity: ${entityType} — ignored`);
      }
    }
    i++;
  }

  return { entities, warnings };
}

/**
 * DXF 문자열을 파싱합니다.
 */
export function parseDxfString(content: string): Entity[] {
  const { entities } = parseDxf(content);
  return entities.map(convertToSdkEntity);
}

/**
 * Parse DXF string with full metadata
 */
export function parseDxfStringWithMeta(content: string): {
  entities: Entity[];
  warnings: string[];
  supportedTypes: string[];
} {
  const { entities, warnings } = parseDxf(content);
  return {
    entities: entities.map(convertToSdkEntity),
    warnings,
    supportedTypes: Array.from(SUPPORTED_ENTITY_TYPES),
  };
}

/**
 * Get list of supported entity types
 */
export function getSupportedEntityTypes(): string[] {
  return Array.from(SUPPORTED_ENTITY_TYPES);
}
