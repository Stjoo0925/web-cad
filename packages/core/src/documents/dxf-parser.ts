/**
 * dxf-parser.ts
 * DXF file parsing module
 *
 * Parses DXF file text into internal entity collection.
 * Supported entities: POINT, LINE, LWPOLYLINE, CIRCLE, ARC, TEXT
 * Unsupported entities are logged as warnings and skipped.
 */

// Supported entity types
const SUPPORTED_ENTITY_TYPES = new Set([
  "POINT",
  "LINE",
  "LWPOLYLINE",
  "POLYLINE",
  "CIRCLE",
  "ARC",
  "TEXT"
]);

export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface Entity {
  type: string;
  id: string;
  layer?: string;
  position?: Point;
  start?: Point;
  end?: Point;
  center?: Point;
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  height?: number;
  value?: string;
  vertexCount?: number;
  closed?: boolean;
  vertices?: Point[];
  _endIndex?: number;
}

export interface ParseDxfResult {
  entities: Entity[];
  warnings: string[];
}

// Warnings log collector
const warnings: string[] = [];

function generateEntityId(): string {
  return `entity-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function parseEntity(lines: string[], startIndex: number, entityType: string): Entity | null {
  const entity: Entity = { type: entityType, id: generateEntityId() };
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
    } else if ((entityType === "LWPOLYLINE" || entityType === "POLYLINE") && groupCode === "90") {
      entity.vertexCount = parseInt(value, 10);
    } else if ((entityType === "LWPOLYLINE" || entityType === "POLYLINE") && groupCode === "70") {
      entity.closed = value === "1";
    } else if ((entityType === "LWPOLYLINE" || entityType === "POLYLINE") && groupCode === "10") {
      entity.vertices = entity.vertices || [];
      const x = parseFloat(value);
      entity.vertices.push({ x, y: 0 });
    } else if ((entityType === "LWPOLYLINE" || entityType === "POLYLINE") && groupCode === "20") {
      if (entity.vertices && entity.vertices.length > 0) {
        entity.vertices[entity.vertices.length - 1].y = parseFloat(value);
      }
    }

    i += 2;
  }

  entity._endIndex = i;
  return entity;
}

function findEntityEndIndex(lines: string[], startIndex: number): number {
  for (let i = startIndex; i < lines.length - 1; i++) {
    if (lines[i] === "0" && i + 1 < lines.length) {
      const next = lines[i + 1];
      if (next === "ENDSEC" || next === "EOF" || SUPPORTED_ENTITY_TYPES.has(next)) {
        return i;
      }
    }
  }
  return lines.length;
}

export function parseDxf(dxfContent: string): ParseDxfResult {
  warnings.length = 0;
  const lines = dxfContent.split("\n").map((line) => line.trim());
  const entities: Entity[] = [];

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
          i = entity._endIndex!;
        } else {
          i += 2;
        }
      } else {
        warnings.push(`Unsupported entity type: ${entityType} — ignored`);
        i += 2;
      }
    } else {
      i++;
    }
  }

  return { entities, warnings };
}

export function getDxfParserWarnings(): string[] {
  return [...warnings];
}