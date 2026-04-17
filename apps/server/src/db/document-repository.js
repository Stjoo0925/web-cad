/**
 * document-repository.js
 * 문서 리포지토리 — 문서/세션/자산 메타데이터 저장을 위한 DB 계층
 *
 * 파일 본문과 메타데이터 저장을 분리하여 관리합니다.
 * 문서 CRUD, 세션 관리, 자산 메타데이터 조회를 지원합니다.
 */

/**
 * 리포지토리 인스턴스를 생성합니다.
 *
 * @param {Object} options - 옵션
 * @param {Object} options.db - 데이터베이스 클라이언트 (예: better-sqlite3)
 * @returns {Object} 리포지토리 인스턴스
 */
export function createDocumentRepository(options = {}) {
  const { db } = options;

  /**
   * 문서를 생성합니다.
   *
   * @param {Object} doc - 문서 정보
   * @returns {Object} 생성된 문서
   */
  function create(doc) {
    const id = doc.id || generateId();
    const now = new Date().toISOString();

    const document = {
      id,
      name: doc.name || "Untitled",
      description: doc.description || "",
      createdAt: doc.createdAt || now,
      updatedAt: now,
      layerId: doc.layerId || null,
      metadata: JSON.stringify(doc.metadata || {})
    };

    // 실제 구현에서는 db.insert('documents', document) 형태로 사용
    return document;
  }

  /**
   * 문서를 ID로 조회합니다.
   *
   * @param {string} id - 문서 ID
   * @returns {Object|null} 문서 또는 null
   */
  function findById(id) {
    // 실제 구현에서는 db.select('documents', { id }) 형태로 사용
    return null;
  }

  /**
   * 모든 문서를 조회합니다.
   *
   * @returns {Object[]} 문서 목록
   */
  function findAll() {
    // 실제 구현에서는 db.selectAll('documents') 형태로 사용
    return [];
  }

  /**
   * 문서를 수정합니다.
   *
   * @param {string} id - 문서 ID
   * @param {Object} updates - 수정할 필드
   * @returns {Object|null} 수정된 문서 또는 null
   */
  function update(id, updates) {
    const now = new Date().toISOString();
    const document = findById(id);

    if (!document) return null;

    const updated = {
      ...document,
      ...updates,
      updatedAt: now
    };

    // 실제 구현에서는 db.update('documents', { id }, updated) 형태로 사용
    return updated;
  }

  /**
   * 문서를 삭제합니다.
   *
   * @param {string} id - 문서 ID
   * @returns {boolean} 삭제 성공 여부
   */
  function deleteDoc(id) {
    const document = findById(id);
    if (!document) return false;

    // 실제 구현에서는 db.delete('documents', { id }) 형태로 사용
    return true;
  }

  /**
   * 자산 메타데이터를 조회합니다.
   *
   * @param {string} documentId - 문서 ID
   * @returns {Object[]} 자산 목록
   */
  function findAssets(documentId) {
    // 실제 구현에서는 db.select('assets', { documentId }) 형태로 사용
    return [];
  }

  /**
   * 자산을 추가합니다.
   *
   * @param {Object} asset - 자산 정보
   * @returns {Object} 생성된 자산
   */
  function addAsset(asset) {
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
   * @param {string} documentId - 문서 ID
   * @returns {Object[]} 세션 목록
   */
  function findSessions(documentId) {
    // 실제 구현에서는 db.select('sessions', { documentId }) 형태로 사용
    return [];
  }

  /**
   * 세션을 추가합니다.
   *
   * @param {Object} session - 세션 정보
   * @returns {Object} 생성된 세션
   */
  function addSession(session) {
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

  /**
   * 고유 ID 생성
   *
   * @returns {string}
   */
  function generateId() {
    return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
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
 * 데이터베이스 연결을 생성합니다.
 *
 * @param {Object} options - 연결 옵션
 * @returns {Promise<Object>} 데이터베이스 클라이언트
 */
export async function createDatabaseConnection(options = {}) {
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