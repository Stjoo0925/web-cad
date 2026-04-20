/**
 * entity-commands.ts
 * Entity command model module
 *
 * Standardizes entity create/update/delete as command objects.
 * create, update, delete commands follow a common format,
 * and the same command model is used for collaboration events and DXF snapshot creation.
 */

// Command types
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
 * Generate unique command ID
 */
function generateCommandId(): string {
  return `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Create an entity creation command
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
 * Create an entity update command
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
 * Create an entity delete command
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
 * Create a command object (generic factory)
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
      throw new Error(`Unknown command type: ${commandType}`);
  }
}

/**
 * Validate a command object
 */
export function validateCommand(command: unknown): ValidationResult {
  const errors: string[] = [];
  const cmd = command as EntityCommand | null;

  if (!cmd) {
    return { valid: false, errors: ["Command object is null or undefined"] };
  }

  if (!cmd.id) {
    errors.push("Missing command ID (id)");
  }

  if (!cmd.type) {
    errors.push("Missing command type (type)");
  } else if (!Object.values(COMMAND_TYPES).includes(cmd.type as CommandType)) {
    errors.push(`Invalid command type: ${cmd.type}`);
  }

  if (!cmd.timestamp) {
    errors.push("Missing timestamp");
  }

  if (cmd.type === COMMAND_TYPES.DELETE) {
    if (!cmd.entityId) {
      errors.push("Delete command requires entityId");
    }
  } else if (!cmd.entity) {
    errors.push("Entity command requires entity");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if a command object is valid (simple check)
 */
export function isCommandValid(command: unknown): boolean {
  return validateCommand(command).valid;
}

/**
 * Extract command from collaboration event
 */
export function extractCommandFromEvent(event: unknown): EntityCommand | null {
  const evt = event as { type?: string; id?: string; entity?: unknown; entityId?: string; userId?: string; documentId?: string } | null;

  if (!evt || !evt.type) return null;

  // Already in command format
  if (evt.id && evt.type && evt.entity) {
    return evt as EntityCommand;
  }

  // Convert from event to command
  switch (evt.type) {
    case "entity.commit.applied":
      return createEntityCommand(evt.entity, { userId: evt.userId, documentId: evt.documentId });
    case "entity.deleted":
      return deleteEntityCommand({ id: evt.entityId }, { userId: evt.userId, documentId: evt.documentId });
    default:
      return null;
  }
}