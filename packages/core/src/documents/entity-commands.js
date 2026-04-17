/**
 * entity-commands.js
 * 엔티티 명령 모델 모듈
 *
 * 엔티티 생성/수정/삭제를 명령 객체로 표준화합니다.
 * create, update, delete 명령이 공통 형식을 따르며,
 * 협업 이벤트와 DXF 스냅샷 생성에서 동일한 명령 모델을 사용합니다.
 */

// 명령 유형
export const COMMAND_TYPES = {
  CREATE: "entity.created",
  UPDATE: "entity.updated",
  DELETE: "entity.deleted"
};

/**
 * 고유 명령 ID 생성
 *
 * @returns {string} UUID 형태의 명령 ID
 */
function generateCommandId() {
  return `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 엔티티 생성 명령을 생성합니다.
 *
 * @param {Object} entity - 생성할 엔티티
 * @param {Object} [options] - 추가 옵션
 * @param {string} [options.userId] - 명령을 실행한 사용자 ID
 * @param {string} [options.documentId] - 문서 ID
 * @returns {Object} 생성 명령 객체
 */
export function createEntityCommand(entity, options = {}) {
  return {
    id: generateCommandId(),
    type: COMMAND_TYPES.CREATE,
    entity: { ...entity },
    userId: options.userId ?? null,
    documentId: options.documentId ?? null,
    createdAt: new Date().toISOString(),
    timestamp: new Date().toISOString()
  };
}

/**
 * 엔티티 수정 명령을 생성합니다.
 *
 * @param {Object} entity - 수정된 엔티티 (전체 엔티티 또는 변경된 필드만 포함)
 * @param {Object} [options] - 추가 옵션
 * @param {string} [options.userId] - 명령을 실행한 사용자 ID
 * @param {string} [options.documentId] - 문서 ID
 * @param {Object} [options.previousEntity] - 수정 전 엔티티 (변경 이력 추적용)
 * @returns {Object} 수정 명령 객체
 */
export function updateEntityCommand(entity, options = {}) {
  return {
    id: generateCommandId(),
    type: COMMAND_TYPES.UPDATE,
    entity: { ...entity },
    previousEntity: options.previousEntity ? { ...options.previousEntity } : null,
    userId: options.userId ?? null,
    documentId: options.documentId ?? null,
    createdAt: new Date().toISOString(),
    timestamp: new Date().toISOString()
  };
}

/**
 * 엔티티 삭제 명령을 생성합니다.
 *
 * @param {Object} entity - 삭제할 엔티티
 * @param {Object} [options] - 추가 옵션
 * @param {string} [options.userId] - 명령을 실행한 사용자 ID
 * @param {string} [options.documentId] - 문서 ID
 * @returns {Object} 삭제 명령 객체
 */
export function deleteEntityCommand(entity, options = {}) {
  return {
    id: generateCommandId(),
    type: COMMAND_TYPES.DELETE,
    entityId: entity.id ?? entity.entityId ?? null,
    entity: { ...entity },
    userId: options.userId ?? null,
    documentId: options.documentId ?? null,
    createdAt: new Date().toISOString(),
    timestamp: new Date().toISOString()
  };
}

/**
 * 명령 객체를 생성합니다 (범용 팩토리).
 *
 * @param {string} commandType - 명령 유형 (COMMAND_TYPES.CREATE/UPDATE/DELETE)
 * @param {Object} payload - 명령 페이로드
 * @param {Object} [options] - 추가 메타데이터
 * @returns {Object} 명령 객체
 */
export function createCommand(commandType, payload, options = {}) {
  const baseCommand = {
    id: generateCommandId(),
    type: commandType,
    createdAt: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    userId: options.userId ?? null,
    documentId: options.documentId ?? null
  };

  switch (commandType) {
    case COMMAND_TYPES.CREATE:
      return { ...baseCommand, entity: { ...payload } };
    case COMMAND_TYPES.UPDATE:
      return { ...baseCommand, entity: { ...payload }, previousEntity: options.previousEntity ? { ...options.previousEntity } : null };
    case COMMAND_TYPES.DELETE:
      return { ...baseCommand, entityId: payload.id ?? payload.entityId ?? null, entity: { ...payload } };
    default:
      throw new Error(`알 수 없는 명령 유형: ${commandType}`);
  }
}

/**
 * 명령 객체의 유효성을 검증합니다.
 *
 * @param {Object} command - 명령 객체
 * @returns {Object} 검증 결과 { valid, errors }
 */
export function validateCommand(command) {
  const errors = [];

  if (!command) {
    return { valid: false, errors: ["명령 객체가 null 또는 undefined입니다"] };
  }

  if (!command.id) {
    errors.push("명령 ID(id)가 없습니다");
  }

  if (!command.type) {
    errors.push("명령 유형(type)이 없습니다");
  } else if (!Object.values(COMMAND_TYPES).includes(command.type)) {
    errors.push(`유효하지 않은 명령 유형: ${command.type}`);
  }

  if (!command.timestamp) {
    errors.push("타임스탬프(timestamp)가 없습니다");
  }

  if (command.type === COMMAND_TYPES.DELETE) {
    if (!command.entityId) {
      errors.push("삭제 명령에는 entityId가 필요합니다");
    }
  } else if (!command.entity) {
    errors.push("엔티티 명령에는 entity가 필요합니다");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 명령 객체가 유효한지 간단히 확인합니다.
 *
 * @param {Object} command - 명령 객체
 * @returns {boolean} 유효 여부
 */
export function isCommandValid(command) {
  return validateCommand(command).valid;
}

/**
 * 협업 이벤트에서 명령을 추출합니다.
 *
 * @param {Object} event - 협업 이벤트 객체
 * @returns {Object|null} 추출된 명령 또는 null
 */
export function extractCommandFromEvent(event) {
  if (!event || !event.type) return null;

  // 이미 명령 형식인 경우
  if (event.id && event.type && event.entity) {
    return event;
  }

  // 이벤트에서 명령으로 변환
  switch (event.type) {
    case "entity.commit.applied":
      return createEntityCommand(event.entity, { userId: event.userId, documentId: event.documentId });
    case "entity.deleted":
      return deleteEntityCommand({ id: event.entityId }, { userId: event.userId, documentId: event.documentId });
    default:
      return null;
  }
}