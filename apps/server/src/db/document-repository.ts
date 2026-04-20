/**
 * document-repository.ts
 * 문서 리포지토리 — 문서/세션/자산 메타데이터 저장을 위한 DB 계층
 *
 * 파일 본문과 메타데이터 저장을 분리하여 관리합니다.
 * 문서 CRUD, 세션 관리, 자산 메타데이터 조회를 지원합니다.
 */

/**
 * 문서 메타데이터
 */
export interface Document {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  layerId: string | null;
  metadata: string;
}

/**
 * 문서 생성 입력
 */
export interface DocumentCreateInput {
  id?: string;
  name?: string;
  description?: string;
  createdAt?: string;
  layerId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * 문서 수정 입력
 */
export interface DocumentUpdateInput {
  name?: string;
  description?: string;
  layerId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * 자산 메타데이터
 */
export interface Asset {
  id: string;
  documentId: string;
  assetType: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

/**
 * 자산 생성 입력
 */
export interface AssetCreateInput {
  id?: string;
  documentId: string;
  assetType: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
}

/**
 * 세션 기록
 */
export interface Session {
  id: string;
  documentId: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
}

/**
 * 세션 생성 입력
 */
export interface SessionCreateInput {
  id?: string;
  documentId: string;
  userId: string;
}

/**
 * 데이터베이스 클라이언트 (타입 agnostic)
 */
export interface DatabaseClient {
  type: "sqlite" | "postgres" | "memory";
  connected: boolean;
}

/**
 * 리포지토리 옵션
 */
export interface DocumentRepositoryOptions {
  db?: DatabaseClient;
}

/**
 * 리포지토리 인스턴스
 */
export interface DocumentRepository {
  create(doc: DocumentCreateInput): Document;
  findById(id: string): Document | null;
  findAll(): Document[];
  update(id: string, updates: DocumentUpdateInput): Document | null;
  delete(id: string): boolean;
  findAssets(documentId: string): Asset[];
  addAsset(asset: AssetCreateInput): Asset;
  findSessions(documentId: string): Session[];
  addSession(session: SessionCreateInput): Session;
}

/**
 * 리포지토리 인스턴스를 생성합니다.
 *
 * @param options - 옵션
 * @param options.db - 데이터베이스 클라이언트 (예: better-sqlite3)
 * @returns 리포지토리 인스턴스
 */
export function createDocumentRepository(options: DocumentRepositoryOptions = {}): DocumentRepository {
  const { db } = options;

  /**
   * 고유 ID 생성
   *
   * @returns 생성된 ID
   */
  function generateId(): string {
    return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * 문서를 생성합니다.
   *
   * @param doc - 문서 정보
   * @returns 생성된 문서
   */
  function create(doc: DocumentCreateInput): Document {
    const id = doc.id || generateId();
    const now = new Date().toISOString();

    const document: Document = {
      id,
      name: doc.name || "Untitled",
      description: doc.description || "",
      createdAt: doc.createdAt || now,
      updatedAt: now,
      layerId: doc.layerId ?? null,
      metadata: JSON.stringify(doc.metadata || {})
    };

    // 실제 구현에서는 db.insert('documents', document) 형태로 사용
    return document;
  }

  /**
   * 문서를 ID로 조회합니다.
   *
   * @param id - 문서 ID
   * @returns 문서 또는 null
   */
  function findById(id: string): Document | null {
    // 실제 구현에서는 db.select('documents', { id }) 형태로 사용
    return null;
  }

  /**
   * 모든 문서를 조회합니다.
   *
   * @returns 문서 목록
   */
  function findAll(): Document[] {
    // 실제 구현에서는 db.selectAll('documents') 형태로 사용
    return [];
  }

  /**
   * 문서를 수정합니다.
   *
   * @param id - 문서 ID
   * @param updates - 수정할 필드
   * @returns 수정된 문서 또는 null
   */
  function update(id: string, updates: DocumentUpdateInput): Document | null {
    const now = new Date().toISOString();
    const document = findById(id);

    if (!document) return null;

    const updated: Document = {
      id: document.id,
      name: updates.name ?? document.name,
      description: updates.description ?? document.description,
      createdAt: document.createdAt,
      updatedAt: now,
      layerId: updates.layerId !== undefined ? updates.layerId : document.layerId,
      metadata: updates.metadata !== undefined ? JSON.stringify(updates.metadata) : document.metadata
    };

    // 실제 구현에서는 db.update('documents', { id }, updated) 형태로 사용
    return updated;
  }

  /**
   * 문서를 삭제합니다.
   *
   * @param id - 문서 ID
   * @returns 삭제 성공 여부
   */
  function deleteDoc(id: string): boolean {
    const document = findById(id);
    if (!document) return false;

    // 실제 구현에서는 db.delete('documents', { id }) 형태로 사용
    return true;
  }

  /**
   * 자산 메타데이터를 조회합니다.
   *
   * @param documentId - 문서 ID
   * @returns 자산 목록
   */
  function findAssets(documentId: string): Asset[] {
    // 실제 구현에서는 db.select('assets', { documentId }) 형태로 사용
    return [];
  }

  /**
   * 자산을 추가합니다.
   *
   * @param asset - 자산 정보
   * @returns 생성된 자산
   */
  function addAsset(asset: AssetCreateInput): Asset {
    const id = asset.id || generateId();
    const now = new Date().toISOString();

    return {
      id,
      documentId: asset.documentId,
      assetType: asset.assetType,
      fileName: asset.fileName,
      fileSize: asset.fileSize || 0,
      mimeType: asset.mimeType || "application/octet-stream",
      createdAt: now
    };
  }

  /**
   * 세션 기록을 조회합니다.
   *
   * @param documentId - 문서 ID
   * @returns 세션 목록
   */
  function findSessions(documentId: string): Session[] {
    // 실제 구현에서는 db.select('sessions', { documentId }) 형태로 사용
    return [];
  }

  /**
   * 세션을 추가합니다.
   *
   * @param session - 세션 정보
   * @returns 생성된 세션
   */
  function addSession(session: SessionCreateInput): Session {
    const id = session.id || generateId();
    const now = new Date().toISOString();

    return {
      id,
      documentId: session.documentId,
      userId: session.userId,
      startedAt: now,
      endedAt: null
    };
  }

  return {
    create,
    findById,
    findAll,
    update,
    delete: deleteDoc,
    findAssets,
    addAsset,
    findSessions,
    addSession
  };
}

/**
 * 데이터베이스 연결 옵션
 */
export interface DatabaseConnectionOptions {
  type?: "sqlite" | "postgres" | "memory";
}

/**
 * 데이터베이스 연결을 생성합니다.
 *
 * @param options - 연결 옵션
 * @returns 데이터베이스 클라이언트
 */
export async function createDatabaseConnection(options: DatabaseConnectionOptions = {}): Promise<DatabaseClient> {
  const { type = "memory" } = options;

  // 실제 구현에서는 선택된 데이터베이스 타입에 따라 연결
  switch (type) {
    case "sqlite":
      // better-sqlite3 사용
      return { type: "sqlite", connected: true };
    case "postgres":
      // pg 클라이언트 사용
      return { type: "postgres", connected: true };
    case "memory":
    default:
      // 인메모리 모드 (테스트용)
      return { type: "memory", connected: true };
  }
}
