import React from "react";

const LOCK_COLORS = {
  LOCKED: "#f59e0b",
  CONFLICT: "#ef4444",
  WARNING: "#eab308"
} as const;

export interface LockedEntity {
  id: string;
  type: string;
  lockedBy?: string;
  lockedByName?: string;
  isEditing?: boolean;
}

export interface CheckoutIndicatorProps {
  lockedEntities?: LockedEntity[];
  currentUserId?: string;
  onEntityClick?: (entity: LockedEntity) => void;
}

export interface CheckoutManager {
  lock: (entityId: string, entity: LockedEntity) => boolean;
  unlock: (entityId: string) => void;
  startEditing: (entityId: string) => void;
  finishEditing: (entityId: string) => void;
  getLock: (entityId: string) => LockedEntity | null;
  getLocks: () => LockedEntity[];
  getLocksByUser: (userId: string) => LockedEntity[];
  canLock: (entityId: string) => boolean;
}

function LockedEntityBadge({ entity, isOwn, onClick }: { entity: LockedEntity; isOwn: boolean; onClick?: () => void }) {
  const color = isOwn ? LOCK_COLORS.LOCKED : LOCK_COLORS.CONFLICT;
  return (
    <div
      style={{ ...styles.badge, borderLeftColor: color }}
      onClick={onClick}
      title={isOwn ? "내가 점유한 엔티티" : `${entity.lockedBy}님이 점유 중`}
    >
      <div style={{ ...styles.lockIcon, color }}>{isOwn ? "✏️" : "🔒"}</div>
      <div style={styles.entityInfo}>
        <div style={styles.entityType}>{entity.type}</div>
        <div style={styles.lockedBy}>{isOwn ? "나" : entity.lockedByName || entity.lockedBy}</div>
      </div>
      {entity.isEditing && <div style={styles.editingIndicator}>수정 중...</div>}
    </div>
  );
}

export function createConflictMessage(entity: LockedEntity, lockedBy: string) {
  return {
    type: "conflict" as const,
    entityId: entity.id,
    entityType: entity.type,
    message: `이 엔티티는 현재 ${lockedBy}님이 편집 중입니다.`,
    timestamp: Date.now()
  };
}

const styles: Record<string, React.CSSProperties> = {
  container: { position: "absolute", bottom: "8px", left: "8px", width: "200px", background: "rgba(15, 23, 42, 0.95)", borderRadius: "6px", border: "1px solid rgba(148, 163, 184, 0.2)", overflow: "hidden", zIndex: 90 },
  header: { padding: "6px 10px", fontSize: "11px", fontWeight: 600, color: "#94a3b8", borderBottom: "1px solid rgba(148, 163, 184, 0.1)" },
  list: { maxHeight: "150px", overflowY: "auto" },
  badge: { display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", borderLeft: "3px solid", cursor: "pointer", transition: "background 0.15s" },
  lockIcon: { fontSize: "14px", width: "20px", textAlign: "center" },
  entityInfo: { flex: 1, minWidth: 0 },
  entityType: { fontSize: "12px", fontWeight: 500, color: "#e2e8f0" },
  lockedBy: { fontSize: "10px", color: "#64748b" },
  editingIndicator: { fontSize: "10px", color: "#f59e0b", animation: "pulse 1.5s infinite" }
};

export function CheckoutIndicator({ lockedEntities = [], currentUserId, onEntityClick }: CheckoutIndicatorProps) {
  if (lockedEntities.length === 0) return null;
  return (
    <div style={styles.container}>
      <div style={styles.header}>점유된 엔티티 ({lockedEntities.length})</div>
      <div style={styles.list}>
        {lockedEntities.map((entity) => (
          <LockedEntityBadge key={entity.id} entity={entity} isOwn={entity.lockedBy === currentUserId} onClick={() => onEntityClick?.(entity)} />
        ))}
      </div>
    </div>
  );
}

export function createCheckoutManager(options: { currentUserId: string; onLockChange?: (locks: LockedEntity[]) => void }): CheckoutManager {
  const { currentUserId, onLockChange } = options;
  const locks = new Map<string, LockedEntity & { lockedAt: number; isEditing: boolean }>();

  function lock(entityId: string, entity: LockedEntity): boolean {
    if (locks.has(entityId)) {
      const existing = locks.get(entityId)!;
      if (existing.lockedBy !== currentUserId) return false;
    }
    locks.set(entityId, { ...entity, lockedBy: currentUserId, lockedAt: Date.now(), isEditing: false });
    onLockChange?.(getLocks());
    return true;
  }

  function unlock(entityId: string) {
    if (locks.has(entityId)) {
      const lock = locks.get(entityId)!;
      if (lock.lockedBy === currentUserId) {
        locks.delete(entityId);
        onLockChange?.(getLocks());
      }
    }
  }

  function startEditing(entityId: string) {
    if (locks.has(entityId) && locks.get(entityId)!.lockedBy === currentUserId) {
      const lock = locks.get(entityId)!;
      lock.isEditing = true;
      onLockChange?.(getLocks());
    }
  }

  function finishEditing(entityId: string) {
    if (locks.has(entityId) && locks.get(entityId)!.lockedBy === currentUserId) {
      const lock = locks.get(entityId)!;
      lock.isEditing = false;
      onLockChange?.(getLocks());
    }
  }

  function getLock(entityId: string) {
    return locks.get(entityId) || null;
  }

  function getLocks() {
    return Array.from(locks.values());
  }

  function getLocksByUser(userId: string) {
    return Array.from(locks.values()).filter((l) => l.lockedBy === userId);
  }

  function canLock(entityId: string) {
    if (!locks.has(entityId)) return true;
    return locks.get(entityId)!.lockedBy === currentUserId;
  }

  return { lock, unlock, startEditing, finishEditing, getLock, getLocks, getLocksByUser, canLock };
}
