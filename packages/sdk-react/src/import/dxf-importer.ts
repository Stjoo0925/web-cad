/**
 * dxf-importer.ts
 * DXF 파일을 엔티티로 가져오는 모듈
 *
 * File API와 기존 dxf-parser를 사용합니다.
 */

import type { Entity } from "../canvas/cad-canvas-renderer.js";

/**
 * DXF 파싱 결과를 SDK Entity 형태로 변환합니다.
 */
function convertToSdkEntity(entity: {
  type: string;
  id: string;
  layer?: string;
  position?: { x: number; y: number };
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  center?: { x: number; y: number };
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  vertices?: { x: number; y: number }[];
  closed?: boolean;
}): Entity {
  const base: Entity = {
    id: entity.id,
    type: entity.type,
    layer: entity.layer ?? "0",
  };

  switch (entity.type) {
    case "POINT":
      return {
        ...base,
        position: entity.position,
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
    default:
      return base;
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
 * DXF 문자열을 파싱합니다.
 */
export function parseDxfString(content: string): Entity[] {
  const lines = content.split(/\r?\n/);
  const entities: Entity[] = [];
  let i = 0;

  // Find ENTITIES section
  let inEntities = false;
  while (i < lines.length) {
    const line = lines[i].trim();

    if (line === "0" && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();

      if (nextLine === "SECTION") {
        const sectionName = lines[i + 3]?.trim();
        if (sectionName === "ENTITIES") {
          inEntities = true;
          i += 4;
          continue;
        }
      } else if (nextLine === "ENDSEC") {
        if (inEntities) {
          break;
        }
      } else if (nextLine === "EOF") {
        break;
      } else if (inEntities && isSupportedEntity(nextLine)) {
        const entity = parseEntity(lines, i);
        if (entity) {
          entities.push(convertToSdkEntity(entity));
          i = entity._endIndex ?? i + 2;
          continue;
        }
      }
    }
    i++;
  }

  return entities;
}

function isSupportedEntity(type: string): boolean {
  return ["POINT", "LINE", "LWPOLYLINE", "POLYLINE", "CIRCLE", "ARC", "TEXT"].includes(type);
}

interface ParsedEntity {
  type: string;
  id: string;
  layer?: string;
  position?: { x: number; y: number };
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  center?: { x: number; y: number };
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  vertices?: { x: number; y: number }[];
  closed?: boolean;
  _endIndex?: number;
}

function generateEntityId(): string {
  return `dxf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function parseEntity(lines: string[], startIndex: number): ParsedEntity | null {
  const entityType = lines[startIndex + 1]?.trim();
  if (!entityType) return null;

  const entity: ParsedEntity = { type: entityType, id: generateEntityId() };
  let i = startIndex + 2;

  while (i < lines.length) {
    const groupCode = lines[i]?.trim();
    const value = lines[i + 1]?.trim();

    if (groupCode === "0") {
      // Next entity or end of section
      entity._endIndex = i;
      break;
    }

    if (!groupCode || value === undefined) {
      i++;
      continue;
    }

    if (groupCode === "8") {
      entity.layer = value;
    } else if (entity.type === "POINT") {
      if (groupCode === "10") {
        entity.position = entity.position || { x: 0, y: 0 };
        entity.position.x = parseFloat(value);
      } else if (groupCode === "20") {
        entity.position = entity.position || { x: 0, y: 0 };
        entity.position.y = parseFloat(value);
      }
    } else if (entity.type === "LINE") {
      if (groupCode === "10") {
        entity.start = entity.start || { x: 0, y: 0 };
        entity.start.x = parseFloat(value);
      } else if (groupCode === "20") {
        entity.start = entity.start || { x: 0, y: 0 };
        entity.start.y = parseFloat(value);
      } else if (groupCode === "11") {
        entity.end = entity.end || { x: 0, y: 0 };
        entity.end.x = parseFloat(value);
      } else if (groupCode === "21") {
        entity.end = entity.end || { x: 0, y: 0 };
        entity.end.y = parseFloat(value);
      }
    } else if (entity.type === "CIRCLE") {
      if (groupCode === "10") {
        entity.center = entity.center || { x: 0, y: 0 };
        entity.center.x = parseFloat(value);
      } else if (groupCode === "20") {
        entity.center = entity.center || { x: 0, y: 0 };
        entity.center.y = parseFloat(value);
      } else if (groupCode === "40") {
        entity.radius = parseFloat(value);
      }
    } else if (entity.type === "ARC") {
      if (groupCode === "10") {
        entity.center = entity.center || { x: 0, y: 0 };
        entity.center.x = parseFloat(value);
      } else if (groupCode === "20") {
        entity.center = entity.center || { x: 0, y: 0 };
        entity.center.y = parseFloat(value);
      } else if (groupCode === "40") {
        entity.radius = parseFloat(value);
      } else if (groupCode === "50") {
        entity.startAngle = parseFloat(value);
      } else if (groupCode === "51") {
        entity.endAngle = parseFloat(value);
      }
    } else if (entity.type === "LWPOLYLINE" || entity.type === "POLYLINE") {
      if (groupCode === "70") {
        entity.closed = value === "1";
      } else if (groupCode === "10") {
        entity.vertices = entity.vertices || [];
        entity.vertices.push({ x: parseFloat(value), y: 0 });
      } else if (groupCode === "20") {
        if (entity.vertices && entity.vertices.length > 0) {
          entity.vertices[entity.vertices.length - 1].y = parseFloat(value);
        }
      }
    }

    i += 2;
  }

  return entity;
}
