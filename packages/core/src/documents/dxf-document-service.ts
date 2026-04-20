/**
 * dxf-document-service.ts
 * DXF document management service
 *
 * Manages document sidecar, snapshots, and DXF import/export operations.
 */

interface StorageService {
  writeJson(path: string, data: unknown): Promise<void>;
  readJson(path: string): Promise<unknown>;
  writeText(path: string, content: string): Promise<void>;
  readText(path: string): Promise<string>;
}

interface Entity {
  id: string;
  type: string;
  layer?: string;
  position?: { x: number; y: number; z?: number };
  start?: { x: number; y: number; z?: number };
  end?: { x: number; y: number; z?: number };
  center?: { x: number; y: number; z?: number };
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  value?: string;
  height?: number;
  vertices?: { x: number; y: number }[];
  closed?: boolean;
}

interface Sidecar {
  documentId: string;
  pointCloudReference: string | null;
  originalFileName?: string | null;
  sourceFormat?: string;
  importedAt?: string;
  entityCount?: number;
  events: unknown[];
  snapshots: { createdAt: string; entityCount: number }[];
  createdAt: string;
  updatedAt: string;
  parseWarnings?: string[];
}

interface DocumentEvent {
  type: string;
  entity?: Entity;
  entityId?: string;
  timestamp: string;
  userId?: string;
  documentId?: string;
}

function formatNumber(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : Number(value).toFixed(6).replace(/0+$/u, "").replace(/\.$/u, "");
}

function serializePointEntity(entity: Entity): string[] {
  return [
    "0", "POINT",
    "8", entity.layer ?? "0",
    "10", formatNumber(entity.position?.x ?? 0),
    "20", formatNumber(entity.position?.y ?? 0),
    "30", formatNumber(entity.position?.z ?? 0)
  ];
}

function serializeLineEntity(entity: Entity): string[] {
  return [
    "0", "LINE",
    "8", entity.layer ?? "0",
    "10", formatNumber(entity.start?.x ?? 0),
    "20", formatNumber(entity.start?.y ?? 0),
    "30", formatNumber(entity.start?.z ?? 0),
    "11", formatNumber(entity.end?.x ?? 0),
    "21", formatNumber(entity.end?.y ?? 0),
    "31", formatNumber(entity.end?.z ?? 0)
  ];
}

function serializeCircleEntity(entity: Entity): string[] {
  return [
    "0", "CIRCLE",
    "8", entity.layer ?? "0",
    "10", formatNumber(entity.center?.x ?? 0),
    "20", formatNumber(entity.center?.y ?? 0),
    "30", formatNumber(entity.center?.z ?? 0),
    "40", formatNumber(entity.radius ?? 0)
  ];
}

function serializeArcEntity(entity: Entity): string[] {
  return [
    "0", "ARC",
    "8", entity.layer ?? "0",
    "10", formatNumber(entity.center?.x ?? 0),
    "20", formatNumber(entity.center?.y ?? 0),
    "30", formatNumber(entity.center?.z ?? 0),
    "40", formatNumber(entity.radius ?? 0),
    "50", formatNumber(entity.startAngle ?? 0),
    "51", formatNumber(entity.endAngle ?? 0)
  ];
}

function serializeTextEntity(entity: Entity): string[] {
  return [
    "0", "TEXT",
    "8", entity.layer ?? "0",
    "10", formatNumber(entity.position?.x ?? 0),
    "20", formatNumber(entity.position?.y ?? 0),
    "30", formatNumber(entity.position?.z ?? 0),
    "40", formatNumber(entity.height ?? 1),
    "1", entity.value ?? ""
  ];
}

function serializePolylineEntity(entity: Entity): string[] {
  const lines: string[] = [
    "0", "LWPOLYLINE",
    "8", entity.layer ?? "0",
    "90", String(entity.vertices?.length ?? 0),
    "70", entity.closed ? "1" : "0"
  ];

  for (const vertex of entity.vertices ?? []) {
    lines.push("10", formatNumber(vertex.x), "20", formatNumber(vertex.y));
  }

  return lines;
}

function serializeEntity(entity: Entity): string[] {
  switch (entity.type) {
    case "POINT":
      return serializePointEntity(entity);
    case "LINE":
      return serializeLineEntity(entity);
    case "CIRCLE":
      return serializeCircleEntity(entity);
    case "ARC":
      return serializeArcEntity(entity);
    case "TEXT":
      return serializeTextEntity(entity);
    case "LWPOLYLINE":
    case "POLYLINE":
      return serializePolylineEntity(entity);
    default:
      return ["999", `Unsupported entity preserved in sidecar only: ${entity.type}`];
  }
}

function serializeDxf(entities: Entity[]): string {
  const body: string[] = [
    "0", "SECTION",
    "2", "HEADER",
    "9", "$ACADVER",
    "1", "AC1027",
    "0", "ENDSEC",
    "0", "SECTION",
    "2", "ENTITIES"
  ];

  for (const entity of entities) {
    body.push(...serializeEntity(entity));
  }

  body.push("0", "ENDSEC", "0", "EOF");
  return `${body.join("\n")}\n`;
}

function applyEvent(entityMap: Map<string, Entity>, event: DocumentEvent): void {
  if (event.type === "entity.commit.applied" && event.entity) {
    entityMap.set(event.entity.id, event.entity);
  }
  if (event.type === "entity.deleted" && event.entityId) {
    entityMap.delete(event.entityId);
  }
}

export interface DxfDocumentServiceOptions {
  storage: StorageService;
}

export interface CreateDocumentOptions {
  documentId: string;
  pointCloudReference?: string | null;
}

export interface AppendEventOptions {
  documentId: string;
  event: DocumentEvent;
}

export interface ReadSidecarOptions {
  documentId: string;
}

export interface CreateSnapshotOptions {
  documentId: string;
}

export interface ReadSnapshotOptions {
  documentId: string;
}

export interface ImportDxfOptions {
  documentId: string;
  dxfContent: string;
  originalFileName?: string | null;
  pointCloudReference?: string | null;
}

export interface ImportDxfResult {
  documentId: string;
  entityCount: number;
  entities: Entity[];
  warnings: string[];
}

export interface GetEntityCountOptions {
  documentId: string;
}

export interface SnapshotResult {
  documentId: string;
  dxfContent: string;
  entities: Entity[];
  pointCloudReference: string | null;
}

export class DxfDocumentService {
  private readonly storage: StorageService;

  constructor({ storage }: DxfDocumentServiceOptions) {
    this.storage = storage;
  }

  async createDocument({ documentId, pointCloudReference = null }: CreateDocumentOptions): Promise<Sidecar> {
    const sidecar: Sidecar = {
      documentId,
      pointCloudReference,
      events: [],
      snapshots: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.storage.writeJson(this.#sidecarPath(documentId), sidecar);
    await this.storage.writeText(this.#snapshotPath(documentId), serializeDxf([]));
    return sidecar;
  }

  async appendEvent({ documentId, event }: AppendEventOptions): Promise<DocumentEvent> {
    const sidecar = await this.readSidecar({ documentId }) as Sidecar;
    sidecar.events.push(event);
    sidecar.updatedAt = new Date().toISOString();
    await this.storage.writeJson(this.#sidecarPath(documentId), sidecar);
    return event;
  }

  async readSidecar({ documentId }: ReadSidecarOptions): Promise<Sidecar> {
    return this.storage.readJson(this.#sidecarPath(documentId)) as Promise<Sidecar>;
  }

  async createSnapshot({ documentId }: CreateSnapshotOptions): Promise<SnapshotResult> {
    const sidecar = await this.readSidecar({ documentId });
    const entityMap = new Map<string, Entity>();

    for (const event of sidecar.events as DocumentEvent[]) {
      applyEvent(entityMap, event);
    }

    const entities = Array.from(entityMap.values()).sort((left, right) => left.id.localeCompare(right.id));
    const dxfContent = serializeDxf(entities);
    await this.storage.writeText(this.#snapshotPath(documentId), dxfContent);

    sidecar.snapshots.push({
      createdAt: new Date().toISOString(),
      entityCount: entities.length
    });
    await this.storage.writeJson(this.#sidecarPath(documentId), sidecar);

    return {
      documentId,
      dxfContent,
      entities,
      pointCloudReference: sidecar.pointCloudReference
    };
  }

  async readSnapshot({ documentId }: ReadSnapshotOptions): Promise<string> {
    return this.storage.readText(this.#snapshotPath(documentId));
  }

  async importDxf({ documentId, dxfContent, originalFileName = null, pointCloudReference = null }: ImportDxfOptions): Promise<ImportDxfResult> {
    // DXF parser (lazy load)
    const { parseDxf } = await import("./dxf-parser.js");
    const { entities, warnings } = parseDxf(dxfContent) as { entities: Entity[]; warnings: string[] };

    // Create sidecar with original file reference and metadata
    const sidecar: Sidecar = {
      documentId,
      pointCloudReference,
      originalFileName,
      sourceFormat: "dxf",
      importedAt: new Date().toISOString(),
      entityCount: entities.length,
      events: [],
      snapshots: [],
      parseWarnings: warnings,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await this.storage.writeJson(this.#sidecarPath(documentId), sidecar);

    // Register each entity as initial commit event
    for (const entity of entities) {
      const event: DocumentEvent = {
        type: "entity.commit.applied",
        entity,
        timestamp: new Date().toISOString()
      };
      sidecar.events.push(event);
    }
    await this.storage.writeJson(this.#sidecarPath(documentId), sidecar);

    // Create first snapshot
    await this.createSnapshot({ documentId });

    return {
      documentId,
      entityCount: entities.length,
      entities,
      warnings
    };
  }

  async getEntityCount({ documentId }: GetEntityCountOptions): Promise<number> {
    const sidecar = await this.readSidecar({ documentId });
    return sidecar.entityCount ?? (sidecar.events as DocumentEvent[]).filter((e) => e.type === "entity.commit.applied").length;
  }

  #sidecarPath(documentId: string): string {
    return `documents/${documentId}/sidecar.json`;
  }

  #snapshotPath(documentId: string): string {
    return `documents/${documentId}/snapshot.dxf`;
  }
}