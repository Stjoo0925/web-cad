/**
 * entity-commands.ts
 * 엔티티 명령 모델 모듈
 *
 * 엔티티 생성/수정/삭제를 명령 객체로 표준화합니다.
 * 생성, 수정, 삭제 명령은 공통 형식을 따르며,
 * 동일한 명령 모델이 협업 이벤트와 DXF 스냅샷 생성에 사용됩니다.
 */

// 명령 타입
export const COMMAND_TYPES = {
  CREATE: "entity.created",
  UPDATE: "entity.updated",
  DELETE: "entity.deleted"
} as const;

export type CommandType = (typeof COMMAND_TYPES)[keyof typeof COMMAND_TYPES];

export interface EntityCommandOptions {
  userId?: string | null;
  documentId?: string | null;
  previousEntity?: unknown;
}

export interface EntityCommand {
  id: string;
  type: CommandType;
  entity?: unknown;
  entityId?: string | null;
  previousEntity?: unknown | null;
  userId: string | null;
  documentId: string | null;
  createdAt: string;
  timestamp: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * 고유 명령 ID를 생성합니다.
 */
function generateCommandId(): string {
  return `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * 엔티티 생성 명령을 생성합니다.
 */
export function createEntityCommand(entity: unknown, options: EntityCommandOptions = {}): EntityCommand {
  return {
    id: generateCommandId(),
    type: COMMAND_TYPES.CREATE,
    entity: { ...entity as object },
    userId: options.userId ?? null,
    documentId: options.documentId ?? null,
    createdAt: new Date().toISOString(),
    timestamp: new Date().toISOString()
  };
}

/**
 * 엔티티 수정 명령을 생성합니다.
 */
export function updateEntityCommand(entity: unknown, options: EntityCommandOptions = {}): EntityCommand {
  return {
    id: generateCommandId(),
    type: COMMAND_TYPES.UPDATE,
    entity: { ...entity as object },
    previousEntity: options.previousEntity ? { ...(options.previousEntity as object) } : null,
    userId: options.userId ?? null,
    documentId: options.documentId ?? null,
    createdAt: new Date().toISOString(),
    timestamp: new Date().toISOString()
  };
}

/**
 * 엔티티 삭제 명령을 생성합니다.
 */
export function deleteEntityCommand(entity: unknown, options: EntityCommandOptions = {}): EntityCommand {
  const entityObj = entity as { id?: string; entityId?: string };
  return {
    id: generateCommandId(),
    type: COMMAND_TYPES.DELETE,
    entityId: entityObj.id ?? entityObj.entityId ?? null,
    entity: { ...entityObj },
    userId: options.userId ?? null,
    documentId: options.documentId ?? null,
    createdAt: new Date().toISOString(),
    timestamp: new Date().toISOString()
  };
}

/**
 * 명령 객체를 생성합니다 (제네릭 팩토리).
 */
export function createCommand(commandType: CommandType, payload: unknown, options: EntityCommandOptions = {}): EntityCommand {
  const entityObj = payload as { id?: string; entityId?: string };
  const baseCommand: Omit<EntityCommand, "type" | "entity" | "entityId" | "previousEntity"> = {
    id: generateCommandId(),
    createdAt: new Date().toISOString(),
    timestamp: new Date().toISOString(),
    userId: options.userId ?? null,
    documentId: options.documentId ?? null
  };

  switch (commandType) {
    case COMMAND_TYPES.CREATE:
      return { ...baseCommand, type: commandType, entity: { ...entityObj } };
    case COMMAND_TYPES.UPDATE:
      return {
        ...baseCommand,
        type: commandType,
        entity: { ...entityObj },
        previousEntity: options.previousEntity ? { ...(options.previousEntity as object) } : null
      };
    case COMMAND_TYPES.DELETE:
      return {
        ...baseCommand,
        type: commandType,
        entityId: entityObj.id ?? entityObj.entityId ?? null,
        entity: { ...entityObj }
      };
    default:
      throw new Error(`알 수 없는 명령 타입: ${commandType}`);
  }
}

/**
 * 명령 객체의 유효성을 검사합니다.
 */
export function validateCommand(command: unknown): ValidationResult {
  const errors: string[] = [];
  const cmd = command as EntityCommand | null;

  if (!cmd) {
    return { valid: false, errors: ["명령 객체가 null 또는 undefined입니다"] };
  }

  if (!cmd.id) {
    errors.push("명령 ID(id)가 누락되었습니다");
  }

  if (!cmd.type) {
    errors.push("명령 타입(type)이 누락되었습니다");
  } else if (!Object.values(COMMAND_TYPES).includes(cmd.type as CommandType)) {
    errors.push(`유효하지 않은 명령 타입: ${cmd.type}`);
  }

  if (!cmd.timestamp) {
    errors.push("타임스탬프가 누락되었습니다");
  }

  if (cmd.type === COMMAND_TYPES.DELETE) {
    if (!cmd.entityId) {
      errors.push("삭제 명령은 entityId가 필요합니다");
    }
  } else if (!cmd.entity) {
    errors.push("엔티티 명령은 entity가 필요합니다");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 명령 객체가 유효한지 확인합니다 (간단 검사).
 */
export function isCommandValid(command: unknown): boolean {
  return validateCommand(command).valid;
}

/**
 * 협업 이벤트에서 명령을 추출합니다.
 */
export function extractCommandFromEvent(event: unknown): EntityCommand | null {
  const evt = event as { type?: string; id?: string; entity?: unknown; entityId?: string; userId?: string; documentId?: string } | null;

  if (!evt || !evt.type) return null;

  // 이미 명령 형식임
  if (evt.id && evt.type && evt.entity) {
    return evt as EntityCommand;
  }

  // 이벤트를 명령으로 변환
  switch (evt.type) {
    case "entity.commit.applied":
      return createEntityCommand(evt.entity, { userId: evt.userId, documentId: evt.documentId });
    case "entity.deleted":
      return deleteEntityCommand({ id: evt.entityId }, { userId: evt.userId, documentId: evt.documentId });
    default:
      return null;
  }
}