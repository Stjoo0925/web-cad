function formatNumber(value) {
  return Number.isInteger(value)
    ? String(value)
    : Number(value).toFixed(6).replace(/0+$/u, "").replace(/\.$/u, "");
}

function serializePointEntity(entity) {
  return [
    "0", "POINT",
    "8", entity.layer ?? "0",
    "10", formatNumber(entity.position.x),
    "20", formatNumber(entity.position.y),
    "30", formatNumber(entity.position.z ?? 0)
  ];
}

function serializeLineEntity(entity) {
  return [
    "0", "LINE",
    "8", entity.layer ?? "0",
    "10", formatNumber(entity.start.x),
    "20", formatNumber(entity.start.y),
    "30", formatNumber(entity.start.z ?? 0),
    "11", formatNumber(entity.end.x),
    "21", formatNumber(entity.end.y),
    "31", formatNumber(entity.end.z ?? 0)
  ];
}

function serializeCircleEntity(entity) {
  return [
    "0", "CIRCLE",
    "8", entity.layer ?? "0",
    "10", formatNumber(entity.center.x),
    "20", formatNumber(entity.center.y),
    "30", formatNumber(entity.center.z ?? 0),
    "40", formatNumber(entity.radius)
  ];
}

function serializeArcEntity(entity) {
  return [
    "0", "ARC",
    "8", entity.layer ?? "0",
    "10", formatNumber(entity.center.x),
    "20", formatNumber(entity.center.y),
    "30", formatNumber(entity.center.z ?? 0),
    "40", formatNumber(entity.radius),
    "50", formatNumber(entity.startAngle),
    "51", formatNumber(entity.endAngle)
  ];
}

function serializeTextEntity(entity) {
  return [
    "0", "TEXT",
    "8", entity.layer ?? "0",
    "10", formatNumber(entity.position.x),
    "20", formatNumber(entity.position.y),
    "30", formatNumber(entity.position.z ?? 0),
    "40", formatNumber(entity.height ?? 1),
    "1", entity.value ?? ""
  ];
}

function serializePolylineEntity(entity) {
  const lines = [
    "0", "LWPOLYLINE",
    "8", entity.layer ?? "0",
    "90", String(entity.vertices.length),
    "70", entity.closed ? "1" : "0"
  ];

  for (const vertex of entity.vertices) {
    lines.push("10", formatNumber(vertex.x), "20", formatNumber(vertex.y));
  }

  return lines;
}

function serializeEntity(entity) {
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

function serializeDxf(entities) {
  const body = [
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

function applyEvent(entityMap, event) {
  if (event.type === "entity.commit.applied") {
    entityMap.set(event.entity.id, event.entity);
  }
  if (event.type === "entity.deleted") {
    entityMap.delete(event.entityId);
  }
}

export class DxfDocumentService {
  constructor({ storage }) {
    this.storage = storage;
  }

  async createDocument({ documentId, pointCloudReference = null }) {
    const sidecar = {
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

  async appendEvent({ documentId, event }) {
    const sidecar = await this.readSidecar({ documentId });
    sidecar.events.push(event);
    sidecar.updatedAt = new Date().toISOString();
    await this.storage.writeJson(this.#sidecarPath(documentId), sidecar);
    return event;
  }

  async readSidecar({ documentId }) {
    return this.storage.readJson(this.#sidecarPath(documentId));
  }

  async createSnapshot({ documentId }) {
    const sidecar = await this.readSidecar({ documentId });
    const entityMap = new Map();

    for (const event of sidecar.events) {
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

  async readSnapshot({ documentId }) {
    return this.storage.readText(this.#snapshotPath(documentId));
  }

  /**
   * DXF 텍스트 내용에서 새 문서를 생성합니다.
   * 파싱된 엔티티를 초기 이벤트로 기록하고 첫 스냅샷을 생성합니다.
   *
   * @param {Object} options - 옵션
   * @param {string} options.documentId - 문서 ID
   * @param {string} options.dxfContent - DXF 파일 텍스트
   * @param {string} [options.originalFileName] - 원본 파일명
   * @param {Object} [options.pointCloudReference] - 포인트클라우드 참조
   * @returns {Object} 생성된 문서 정보 { documentId, entityCount, entities }
   */
  async importDxf({ documentId, dxfContent, originalFileName = null, pointCloudReference = null }) {
    // DXF 파서 임포트 (지연 로드)
    const { parseDxf } = await import("./dxf-parser.js");
    const { entities, warnings } = parseDxf(dxfContent);

    // 사이드카 생성 (원본 파일 참조 및 메타데이터 포함)
    const sidecar = {
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

    // 각 엔티티를 초기 커밋 이벤트로 등록
    for (const entity of entities) {
      const event = {
        type: "entity.commit.applied",
        entity,
        timestamp: new Date().toISOString()
      };
      sidecar.events.push(event);
    }
    await this.storage.writeJson(this.#sidecarPath(documentId), sidecar);

    // 첫 스냅샷 생성
    const snapshot = await this.createSnapshot({ documentId });

    return {
      documentId,
      entityCount: entities.length,
      entities,
      warnings
    };
  }

  /**
   * 문서의 현재 엔티티 수를 반환합니다.
   * 사이드카에 기록된 entityCount 또는 events 기반 수를 반환합니다.
   *
   * @param {Object} options - 옵션
   * @param {string} options.documentId - 문서 ID
   * @returns {number} 엔티티 수
   */
  async getEntityCount({ documentId }) {
    const sidecar = await this.readSidecar({ documentId });
    return sidecar.entityCount ?? sidecar.events.filter((e) => e.type === "entity.commit.applied").length;
  }

  #sidecarPath(documentId) {
    return `documents/${documentId}/sidecar.json`;
  }

  #snapshotPath(documentId) {
    return `documents/${documentId}/snapshot.dxf`;
  }
}
