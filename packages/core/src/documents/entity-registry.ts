/**
 * entity-registry.ts
 * DXF Entity Registry - Data-driven entity parsing and serialization
 *
 * Replaces switch-case dispatch with registry pattern for 300+ entity support.
 * Each entity type is defined declaratively with its group codes,
 * parser function, and serializer.
 */

export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface Entity {
  id: string;
  type: string;
  layer?: string;
  // Common geometry
  position?: Point;
  start?: Point;
  end?: Point;
  center?: Point;
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  vertices?: Point[];
  closed?: boolean;
  // Text
  value?: string;
  height?: number;
  width?: number;
  rotation?: number;
  // Ellipse
  majorAxisEndpoint?: Point;
  minorAxisRatio?: number;
  // Spline
  controlVertices?: Point[];
  knots?: number[];
  degree?: number;
  // Hatch
  hatchPattern?: string;
  hatchScale?: number;
  hatchRotation?: number;
  boundaryVertices?: Point[][];
  // Block
  blockName?: string;
  blockPosition?: Point;
  blockRotation?: number;
  blockScale?: { x: number; y: number };
  // Dimension
  dimensionType?: string;
  // Lineweight
  lineWeight?: number;
  // Linetype
  linetype?: string;
  color?: string;
  // 3D
  extrusion?: Point;
  thickness?: number;
  // Extension
  [key: string]: unknown;
}

export interface DxfGroupCode {
  code: number;
  value: string | number;
}

/**
 * Group code to field mapping for parsing
 */
export interface GroupCodeMapping {
  [groupCode: number]: {
    field: string;
    parser: (v: string) => unknown;
  };
}

/**
 * Entity definition for registry
 */
export interface EntityDefinition {
  type: string;
  groupCodes: readonly number[];
  mapping: GroupCodeMapping;
  requiredCodes?: readonly number[];
  hasSubEntities?: boolean;
  subEntityType?: string;
}

/**
 * Serializer function type
 */
export type Serializer = (entity: Entity) => DxfGroupCode[];

/**
 * Entity registry for DXF operations
 */
export class EntityRegistry {
  private definitions = new Map<string, EntityDefinition>();
  private serializers = new Map<string, Serializer>();
  private idGenerator: () => string;

  constructor(idGenerator?: () => string) {
    this.idGenerator =
      idGenerator ??
      (() => `entity-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  }

  /**
   * Register an entity definition
   */
  register(def: EntityDefinition): void {
    this.definitions.set(def.type, def);
  }

  /**
   * Register a serializer for an entity type
   */
  registerSerializer(type: string, serializer: Serializer): void {
    this.serializers.set(type, serializer);
  }

  /**
   * Get entity definition
   */
  getDefinition(type: string): EntityDefinition | undefined {
    return this.definitions.get(type);
  }

  /**
   * Check if entity type is registered
   */
  has(type: string): boolean {
    return this.definitions.has(type);
  }

  /**
   * Get all registered entity types
   */
  getAllTypes(): string[] {
    return Array.from(this.definitions.keys());
  }

  /**
   * Get serializer for entity type
   */
  getSerializer(type: string): Serializer | undefined {
    return this.serializers.get(type);
  }

  /**
   * Generate unique entity ID
   */
  generateId(): string {
    return this.idGenerator();
  }

  /**
   * Parse a group code value
   */
  parseValue(groupCode: number, value: string): unknown {
    if (groupCode >= 1000) {
      return value;
    }
    if (groupCode >= 90) {
      return parseInt(value, 10);
    }
    if (groupCode >= 70 && groupCode < 90) {
      return parseInt(value, 10);
    }
    if (groupCode >= 40 && groupCode < 70) {
      return parseFloat(value);
    }
    if (groupCode >= 20 && groupCode < 30) {
      return parseFloat(value);
    }
    if (groupCode >= 10 && groupCode < 20) {
      return parseFloat(value);
    }
    return value;
  }

  /**
   * Parse entity from DXF group codes
   */
  parseEntity(
    lines: string[],
    startIndex: number,
    entityType: string,
  ): Entity | null {
    const def = this.definitions.get(entityType);
    if (!def) {
      return null;
    }

    const entity: Entity = { type: entityType, id: this.generateId() };
    const vertexBuffer: { x?: number; y?: number; z?: number } = {};
    let i = startIndex + 2;
    const endIndex = this.findEntityEndIndex(lines, i, entityType);

    while (i < lines.length && i < endIndex) {
      const groupCodeStr = lines[i];
      const value = lines[i + 1];
      const groupCode = parseInt(groupCodeStr, 10);

      // Handle X coordinate (group code 10-19)
      if (groupCode >= 10 && groupCode <= 19) {
        const baseCode = Math.floor(groupCode / 10) * 10;
        if (groupCode === baseCode) {
          vertexBuffer.x = parseFloat(value);
        }
      }
      // Handle Y coordinate (group code 20-29)
      else if (groupCode >= 20 && groupCode <= 29) {
        const baseCode = Math.floor(groupCode / 10) * 10;
        if (groupCode === baseCode) {
          vertexBuffer.y = parseFloat(value);
          // Flush vertex when Y is read after X
          if (vertexBuffer.x !== undefined) {
            const field = this.getFieldForCoordinate(entityType, baseCode);
            if (field) {
              if (field.endsWith("[]")) {
                entity[field] = entity[field] || [];
                (entity[field] as Point[]).push({
                  x: vertexBuffer.x!,
                  y: vertexBuffer.y!,
                });
              } else {
                entity[field] = { x: vertexBuffer.x!, y: vertexBuffer.y! };
              }
            }
            vertexBuffer.x = undefined;
            vertexBuffer.y = undefined;
          }
        }
      }
      // Handle Z coordinate (group code 30-39)
      else if (groupCode >= 30 && groupCode <= 39) {
        vertexBuffer.z = parseFloat(value);
        if (vertexBuffer.x !== undefined && vertexBuffer.y !== undefined) {
          const baseCode = Math.floor(groupCode / 10) * 10;
          const field = this.getFieldForCoordinate(entityType, baseCode);
          if (field) {
            entity[field] = {
              x: vertexBuffer.x!,
              y: vertexBuffer.y!,
              z: vertexBuffer.z!,
            };
          }
          vertexBuffer.x = undefined;
          vertexBuffer.y = undefined;
          vertexBuffer.z = undefined;
        }
      }
      // Handle other group codes via mapping
      else if (def.mapping[groupCode]) {
        const { field, parser } = def.mapping[groupCode];
        const parsedValue = parser(value);
        if (field.endsWith("[]")) {
          entity[field] = entity[field] || [];
          (entity[field] as unknown[]).push(parsedValue);
        } else {
          entity[field] = parsedValue;
        }
      }

      i += 2;
    }

    return entity;
  }

  /**
   * Find the end index of an entity
   */
  private findEntityEndIndex(
    lines: string[],
    startIndex: number,
    entityType: string,
  ): number {
    const knownTypes = new Set(this.definitions.keys());
    for (let i = startIndex; i < lines.length - 1; i++) {
      if (lines[i] === "0" && i + 1 < lines.length) {
        const next = lines[i + 1];
        if (next === "ENDSEC" || next === "EOF" || knownTypes.has(next)) {
          return i;
        }
      }
    }
    return lines.length;
  }

  /**
   * Get field name for coordinate group code
   */
  private getFieldForCoordinate(
    entityType: string,
    baseCode: number,
  ): string | null {
    const coordinateFields: { [type: string]: { [code: number]: string } } = {
      POINT: { 10: "position" },
      LINE: { 10: "start", 11: "end" },
      CIRCLE: { 10: "center" },
      ARC: { 10: "center" },
      TEXT: { 10: "position" },
      ELLIPSE: { 10: "center", 11: "majorAxisEndpoint" },
      SPLINE: { 10: "controlVertices[]" },
      LWPOLYLINE: { 10: "vertices[]" },
      POLYLINE: { 10: "vertices[]" },
      HATCH: { 10: "boundaryVertices[][]" },
      BLOCK: { 10: "blockPosition" },
      INSERT: { 10: "blockPosition" },
    };

    return coordinateFields[entityType]?.[baseCode] ?? null;
  }

  /**
   * Serialize entity to DXF group codes
   */
  serializeEntity(entity: Entity): DxfGroupCode[] {
    const serializer = this.serializers.get(entity.type);
    if (serializer) {
      return serializer(entity);
    }

    // Fallback: basic serialization
    return [
      { code: 0, value: entity.type },
      { code: 8, value: entity.layer ?? "0" },
    ];
  }

  /**
   * Serialize entity type to DXF string
   */
  serializeToString(entity: Entity): string {
    const codes = this.serializeEntity(entity);
    return codes.map((c) => `${c.code}\n${c.value}`).join("\n");
  }
}

// Standard group code parsers
export const parsers = {
  string: (v: string) => v,
  int: (v: string) => parseInt(v, 10),
  float: (v: string) => parseFloat(v),
  bool: (v: string) => v === "1",
};

// Standard field mappings for common entity types
export const standardMappings = {
  POINT: {
    8: { field: "layer", parser: parsers.string },
    10: { field: "position", parser: parsers.float },
    20: { field: "position", parser: parsers.float },
    30: { field: "position", parser: parsers.float },
  } as GroupCodeMapping,

  LINE: {
    8: { field: "layer", parser: parsers.string },
    10: { field: "start", parser: parsers.float },
    20: { field: "start", parser: parsers.float },
    30: { field: "start", parser: parsers.float },
    11: { field: "end", parser: parsers.float },
    21: { field: "end", parser: parsers.float },
    31: { field: "end", parser: parsers.float },
  } as GroupCodeMapping,

  CIRCLE: {
    8: { field: "layer", parser: parsers.string },
    10: { field: "center", parser: parsers.float },
    20: { field: "center", parser: parsers.float },
    30: { field: "center", parser: parsers.float },
    40: { field: "radius", parser: parsers.float },
  } as GroupCodeMapping,

  ARC: {
    8: { field: "layer", parser: parsers.string },
    10: { field: "center", parser: parsers.float },
    20: { field: "center", parser: parsers.float },
    30: { field: "center", parser: parsers.float },
    40: { field: "radius", parser: parsers.float },
    50: { field: "startAngle", parser: parsers.float },
    51: { field: "endAngle", parser: parsers.float },
  } as GroupCodeMapping,

  TEXT: {
    8: { field: "layer", parser: parsers.string },
    10: { field: "position", parser: parsers.float },
    20: { field: "position", parser: parsers.float },
    30: { field: "position", parser: parsers.float },
    40: { field: "height", parser: parsers.float },
    1: { field: "value", parser: parsers.string },
  } as GroupCodeMapping,

  MTEXT: {
    8: { field: "layer", parser: parsers.string },
    10: { field: "position", parser: parsers.float },
    20: { field: "position", parser: parsers.float },
    30: { field: "position", parser: parsers.float },
    40: { field: "height", parser: parsers.float },
    41: { field: "width", parser: parsers.float },
    50: { field: "rotation", parser: parsers.float },
    1: { field: "value", parser: parsers.string },
    3: { field: "text", parser: parsers.string },
  } as GroupCodeMapping,

  LWPOLYLINE: {
    8: { field: "layer", parser: parsers.string },
    90: { field: "vertexCount", parser: parsers.int },
    70: { field: "closed", parser: parsers.bool },
  } as GroupCodeMapping,

  POLYLINE: {
    8: { field: "layer", parser: parsers.string },
    66: { field: "follows", parser: parsers.int },
    70: { field: "closed", parser: parsers.bool },
  } as GroupCodeMapping,

  ELLIPSE: {
    8: { field: "layer", parser: parsers.string },
    10: { field: "center", parser: parsers.float },
    20: { field: "center", parser: parsers.float },
    30: { field: "center", parser: parsers.float },
    11: { field: "majorAxisEndpoint", parser: parsers.float },
    21: { field: "majorAxisEndpoint", parser: parsers.float },
    31: { field: "majorAxisEndpoint", parser: parsers.float },
    40: { field: "radius", parser: parsers.float }, // major radius
    41: { field: "minorAxisRatio", parser: parsers.float },
    42: { field: "startAngle", parser: parsers.float },
    43: { field: "endAngle", parser: parsers.float },
  } as GroupCodeMapping,

  SPLINE: {
    8: { field: "layer", parser: parsers.string },
    70: { field: "flags", parser: parsers.int },
    71: { field: "degree", parser: parsers.int },
    72: { field: "knotCount", parser: parsers.int },
    73: { field: "controlPointCount", parser: parsers.int },
    74: { field: "fitPointCount", parser: parsers.int },
  } as GroupCodeMapping,

  HATCH: {
    8: { field: "layer", parser: parsers.string },
    2: { field: "hatchPattern", parser: parsers.string },
    41: { field: "hatchScale", parser: parsers.float },
    50: { field: "hatchRotation", parser: parsers.float },
    70: { field: "solidFill", parser: parsers.bool },
  } as GroupCodeMapping,

  DIMENSION: {
    8: { field: "layer", parser: parsers.string },
    1: { field: "dimensionType", parser: parsers.string },
    10: { field: "position", parser: parsers.float },
    20: { field: "position", parser: parsers.float },
    30: { field: "position", parser: parsers.float },
  } as GroupCodeMapping,

  BLOCK: {
    8: { field: "layer", parser: parsers.string },
    2: { field: "blockName", parser: parsers.string },
    10: { field: "blockPosition", parser: parsers.float },
    20: { field: "blockPosition", parser: parsers.float },
    30: { field: "blockPosition", parser: parsers.float },
  } as GroupCodeMapping,

  INSERT: {
    8: { field: "layer", parser: parsers.string },
    2: { field: "blockName", parser: parsers.string },
    10: { field: "blockPosition", parser: parsers.float },
    20: { field: "blockPosition", parser: parsers.float },
    30: { field: "blockPosition", parser: parsers.float },
    50: { field: "blockRotation", parser: parsers.float },
    44: { field: "blockScale", parser: parsers.float },
    45: { field: "blockScale", parser: parsers.float },
  } as GroupCodeMapping,

  "3DFACE": {
    8: { field: "layer", parser: parsers.string },
    10: { field: "vertices[]", parser: parsers.float },
    20: { field: "vertices[]", parser: parsers.float },
    30: { field: "vertices[]", parser: parsers.float },
  } as GroupCodeMapping,

  SOLID: {
    8: { field: "layer", parser: parsers.string },
    10: { field: "vertices[]", parser: parsers.float },
    20: { field: "vertices[]", parser: parsers.float },
    30: { field: "vertices[]", parser: parsers.float },
    38: { field: "thickness", parser: parsers.float },
  } as GroupCodeMapping,
};

// Number formatter for DXF output
function formatNumber(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : Number(value).toFixed(6).replace(/0+$/u, "").replace(/\.$/u, "");
}

// Standard serializers
export function createSerializer(entityType: string): Serializer {
  return (entity: Entity) => {
    const codes: DxfGroupCode[] = [
      { code: 0, value: entityType },
      { code: 8, value: entity.layer ?? "0" },
    ];

    switch (entityType) {
      case "POINT":
        if (entity.position) {
          codes.push({ code: 10, value: formatNumber(entity.position.x) });
          codes.push({ code: 20, value: formatNumber(entity.position.y) });
          codes.push({ code: 30, value: formatNumber(entity.position.z ?? 0) });
        }
        break;

      case "LINE":
        if (entity.start) {
          codes.push({ code: 10, value: formatNumber(entity.start.x) });
          codes.push({ code: 20, value: formatNumber(entity.start.y) });
          codes.push({ code: 30, value: formatNumber(entity.start.z ?? 0) });
        }
        if (entity.end) {
          codes.push({ code: 11, value: formatNumber(entity.end.x) });
          codes.push({ code: 21, value: formatNumber(entity.end.y) });
          codes.push({ code: 31, value: formatNumber(entity.end.z ?? 0) });
        }
        break;

      case "CIRCLE":
        if (entity.center) {
          codes.push({ code: 10, value: formatNumber(entity.center.x) });
          codes.push({ code: 20, value: formatNumber(entity.center.y) });
          codes.push({ code: 30, value: formatNumber(entity.center.z ?? 0) });
        }
        if (entity.radius !== undefined) {
          codes.push({ code: 40, value: formatNumber(entity.radius) });
        }
        break;

      case "ARC":
        if (entity.center) {
          codes.push({ code: 10, value: formatNumber(entity.center.x) });
          codes.push({ code: 20, value: formatNumber(entity.center.y) });
          codes.push({ code: 30, value: formatNumber(entity.center.z ?? 0) });
        }
        if (entity.radius !== undefined) {
          codes.push({ code: 40, value: formatNumber(entity.radius) });
        }
        if (entity.startAngle !== undefined) {
          codes.push({ code: 50, value: formatNumber(entity.startAngle) });
        }
        if (entity.endAngle !== undefined) {
          codes.push({ code: 51, value: formatNumber(entity.endAngle) });
        }
        break;

      case "TEXT":
        if (entity.position) {
          codes.push({ code: 10, value: formatNumber(entity.position.x) });
          codes.push({ code: 20, value: formatNumber(entity.position.y) });
          codes.push({ code: 30, value: formatNumber(entity.position.z ?? 0) });
        }
        if (entity.height !== undefined) {
          codes.push({ code: 40, value: formatNumber(entity.height) });
        }
        if (entity.value !== undefined) {
          codes.push({ code: 1, value: entity.value });
        }
        break;

      case "MTEXT":
        if (entity.position) {
          codes.push({ code: 10, value: formatNumber(entity.position.x) });
          codes.push({ code: 20, value: formatNumber(entity.position.y) });
          codes.push({ code: 30, value: formatNumber(entity.position.z ?? 0) });
        }
        if (entity.height !== undefined) {
          codes.push({ code: 40, value: formatNumber(entity.height) });
        }
        if (entity.width !== undefined) {
          codes.push({ code: 41, value: formatNumber(entity.width) });
        }
        if (entity.rotation !== undefined) {
          codes.push({ code: 50, value: formatNumber(entity.rotation) });
        }
        if (entity.value !== undefined) {
          codes.push({ code: 1, value: entity.value });
        }
        break;

      case "LWPOLYLINE":
      case "POLYLINE":
        if (entity.vertices) {
          codes.push({ code: 90, value: String(entity.vertices.length) });
          codes.push({ code: 70, value: entity.closed ? "1" : "0" });
          for (const v of entity.vertices) {
            codes.push({ code: 10, value: formatNumber(v.x) });
            codes.push({ code: 20, value: formatNumber(v.y) });
          }
        }
        break;

      case "ELLIPSE":
        if (entity.center) {
          codes.push({ code: 10, value: formatNumber(entity.center.x) });
          codes.push({ code: 20, value: formatNumber(entity.center.y) });
          codes.push({ code: 30, value: formatNumber(entity.center.z ?? 0) });
        }
        if (entity.majorAxisEndpoint) {
          codes.push({
            code: 11,
            value: formatNumber(entity.majorAxisEndpoint.x),
          });
          codes.push({
            code: 21,
            value: formatNumber(entity.majorAxisEndpoint.y),
          });
          codes.push({
            code: 31,
            value: formatNumber(entity.majorAxisEndpoint.z ?? 0),
          });
        }
        if (entity.radius !== undefined) {
          codes.push({ code: 40, value: formatNumber(entity.radius) });
        }
        if (entity.minorAxisRatio !== undefined) {
          codes.push({ code: 41, value: formatNumber(entity.minorAxisRatio) });
        }
        break;

      case "SPLINE":
        if (entity.controlVertices) {
          for (const v of entity.controlVertices) {
            codes.push({ code: 10, value: formatNumber(v.x) });
            codes.push({ code: 20, value: formatNumber(v.y) });
            codes.push({ code: 30, value: formatNumber(v.z ?? 0) });
          }
        }
        if (entity.degree !== undefined) {
          codes.push({ code: 71, value: String(entity.degree) });
        }
        if (entity.knots) {
          for (const k of entity.knots) {
            codes.push({ code: 40, value: formatNumber(k) });
          }
        }
        break;

      case "HATCH":
        if (entity.hatchPattern) {
          codes.push({ code: 2, value: entity.hatchPattern });
        }
        if (entity.hatchScale !== undefined) {
          codes.push({ code: 41, value: formatNumber(entity.hatchScale) });
        }
        if (entity.hatchRotation !== undefined) {
          codes.push({ code: 50, value: formatNumber(entity.hatchRotation) });
        }
        break;

      case "BLOCK":
        if (entity.blockName) {
          codes.push({ code: 2, value: entity.blockName });
        }
        if (entity.blockPosition) {
          codes.push({ code: 10, value: formatNumber(entity.blockPosition.x) });
          codes.push({ code: 20, value: formatNumber(entity.blockPosition.y) });
          codes.push({
            code: 30,
            value: formatNumber(entity.blockPosition.z ?? 0),
          });
        }
        break;

      case "INSERT":
        if (entity.blockName) {
          codes.push({ code: 2, value: entity.blockName });
        }
        if (entity.blockPosition) {
          codes.push({ code: 10, value: formatNumber(entity.blockPosition.x) });
          codes.push({ code: 20, value: formatNumber(entity.blockPosition.y) });
          codes.push({
            code: 30,
            value: formatNumber(entity.blockPosition.z ?? 0),
          });
        }
        if (entity.blockRotation !== undefined) {
          codes.push({ code: 50, value: formatNumber(entity.blockRotation) });
        }
        if (entity.blockScale) {
          codes.push({ code: 44, value: formatNumber(entity.blockScale.x) });
          codes.push({ code: 45, value: formatNumber(entity.blockScale.y) });
        }
        break;
    }

    return codes;
  };
}

// Singleton registry instance
let globalRegistry: EntityRegistry | null = null;

export function getGlobalRegistry(): EntityRegistry {
  if (!globalRegistry) {
    globalRegistry = createDefaultRegistry();
  }
  return globalRegistry;
}

export function createDefaultRegistry(): EntityRegistry {
  const registry = new EntityRegistry();

  // Register entity definitions
  const entityTypes = [
    "POINT",
    "LINE",
    "CIRCLE",
    "ARC",
    "TEXT",
    "MTEXT",
    "LWPOLYLINE",
    "POLYLINE",
    "ELLIPSE",
    "SPLINE",
    "HATCH",
    "DIMENSION",
    "BLOCK",
    "INSERT",
    "3DFACE",
    "SOLID",
  ] as const;

  for (const type of entityTypes) {
    const def = createEntityDefinition(type);
    if (def) {
      registry.register(def);
      registry.registerSerializer(type, createSerializer(type));
    }
  }

  return registry;
}

function createEntityDefinition(type: string): EntityDefinition | null {
  switch (type) {
    case "POINT":
      return {
        type: "POINT",
        groupCodes: [8, 10, 20, 30],
        mapping: standardMappings.POINT,
        requiredCodes: [10],
      };
    case "LINE":
      return {
        type: "LINE",
        groupCodes: [8, 10, 20, 30, 11, 21, 31],
        mapping: standardMappings.LINE,
        requiredCodes: [10, 11],
      };
    case "CIRCLE":
      return {
        type: "CIRCLE",
        groupCodes: [8, 10, 20, 30, 40],
        mapping: standardMappings.CIRCLE,
        requiredCodes: [10, 40],
      };
    case "ARC":
      return {
        type: "ARC",
        groupCodes: [8, 10, 20, 30, 40, 50, 51],
        mapping: standardMappings.ARC,
        requiredCodes: [10, 40],
      };
    case "TEXT":
      return {
        type: "TEXT",
        groupCodes: [8, 10, 20, 30, 40, 1],
        mapping: standardMappings.TEXT,
        requiredCodes: [10, 40],
      };
    case "MTEXT":
      return {
        type: "MTEXT",
        groupCodes: [8, 10, 20, 30, 40, 41, 50, 1],
        mapping: standardMappings.MTEXT,
        requiredCodes: [10, 40],
      };
    case "LWPOLYLINE":
      return {
        type: "LWPOLYLINE",
        groupCodes: [8, 90, 70, 10, 20],
        mapping: standardMappings.LWPOLYLINE,
        requiredCodes: [90],
      };
    case "POLYLINE":
      return {
        type: "POLYLINE",
        groupCodes: [8, 66, 70, 10, 20],
        mapping: standardMappings.POLYLINE,
      };
    case "ELLIPSE":
      return {
        type: "ELLIPSE",
        groupCodes: [8, 10, 20, 30, 11, 21, 31, 40, 41, 42, 43],
        mapping: standardMappings.ELLIPSE,
        requiredCodes: [10, 11, 40],
      };
    case "SPLINE":
      return {
        type: "SPLINE",
        groupCodes: [8, 70, 71, 72, 73, 74, 10, 20, 30, 40],
        mapping: standardMappings.SPLINE,
      };
    case "HATCH":
      return {
        type: "HATCH",
        groupCodes: [8, 2, 41, 50, 70, 10, 20],
        mapping: standardMappings.HATCH,
        requiredCodes: [2],
      };
    case "DIMENSION":
      return {
        type: "DIMENSION",
        groupCodes: [8, 1, 10, 20, 30],
        mapping: standardMappings.DIMENSION,
      };
    case "BLOCK":
      return {
        type: "BLOCK",
        groupCodes: [8, 2, 10, 20, 30],
        mapping: standardMappings.BLOCK,
        requiredCodes: [2],
      };
    case "INSERT":
      return {
        type: "INSERT",
        groupCodes: [8, 2, 10, 20, 30, 50, 44, 45],
        mapping: standardMappings.INSERT,
        requiredCodes: [2],
      };
    case "3DFACE":
      return {
        type: "3DFACE",
        groupCodes: [8, 10, 20, 30],
        mapping: standardMappings["3DFACE"],
      };
    case "SOLID":
      return {
        type: "SOLID",
        groupCodes: [8, 10, 20, 30, 38],
        mapping: standardMappings.SOLID,
      };
    default:
      return null;
  }
}
