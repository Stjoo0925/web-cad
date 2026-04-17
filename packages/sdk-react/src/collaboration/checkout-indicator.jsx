/**
 * checkout-indicator.jsx
 * 체크아웃 UI 및 충돌 처리 표시 컴포넌트
 *
 * 점유된 엔티티를 시각적으로 표시하고,
 * 편집 충돌 시 사용자友好的 메시지를 제공합니다.
 */

import React from "react";

/**
 * 점유 상태 색상
 */
const LOCK_COLORS = {
  LOCKED: "#f59e0b",    // 주황 - 점유됨
  CONFLICT: "#ef4444",  // 빨강 - 충돌
  WARNING: "#eab308"    // 노랑 - 경고
};

/**
 * CheckoutIndicator — 점유된 엔티티 및 충돌 상태 표시
 *
 * @param {Object} props - 컴포넌트 속성
 * @param {Object[]} props.lockedEntities - 점유된 엔티티 목록
 * @param {string} [props.currentUserId] - 현재 사용자 ID
 * @param {Function} [props.onEntityClick] - 엔티티 클릭 핸들러
 */
export function CheckoutIndicator({
  lockedEntities = [],
  currentUserId,
  onEntityClick
}) {
  if (lockedEntities.length === 0) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        점유된 엔티티 ({lockedEntities.length})
      </div>
      <div style={styles.list}>
        {lockedEntities.map((entity) => (
          <LockedEntityBadge
            key={entity.id}
            entity={entity}
            isOwn={entity.lockedBy === currentUserId}
            onClick={() => onEntityClick?.(entity)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 점유된 엔티티 배지
 *
 * @param {Object} props
 * @param {Object} props.entity - 엔티티 정보
 * @param {boolean} props.isOwn - 현재 사용자가 점유한 것인지
 * @param {Function} [props.onClick] - 클릭 핸들러
 */
function LockedEntityBadge({ entity, isOwn, onClick }) {
  const color = isOwn ? LOCK_COLORS.LOCKED : LOCK_COLORS.CONFLICT;

  return (
    <div
      style={{
        ...styles.badge,
        borderLeftColor: color
      }}
      onClick={onClick}
      title={isOwn ? "내가 점유한 엔티티" : `${entity.lockedBy}님이 점유 중`}
    >
      <div style={{ ...styles.lockIcon, color }}>
        {isOwn ? "✏️" : "🔒"}
      </div>
      <div style={styles.entityInfo}>
        <div style={styles.entityType}>{entity.type}</div>
        <div style={styles.lockedBy}>
          {isOwn ? "나" : entity.lockedByName || entity.lockedBy}
        </div>
      </div>
      {entity.isEditing && (
        <div style={styles.editingIndicator}>
          수정 중...
        </div>
      )}
    </div>
  );
}

/**
 * 충돌 알림 메시지를 생성합니다.
 *
 * @param {Object} entity - 충돌난 엔티티
 * @param {string} lockedBy - 점유자 이름
 * @returns {Object} 메시지 객체
 */
export function createConflictMessage(entity, lockedBy) {
  return {
    type: "conflict",
    entityId: entity.id,
    entityType: entity.type,
    message: `이 엔티티는 현재 ${lockedBy}님이 편집 중입니다.`,
    timestamp: Date.now()
  };
}

/**
 * CheckoutManager — 점유 상태 관리자
 *
 * @param {Object} options - 옵션
 * @param {string} options.currentUserId - 현재 사용자 ID
 * @param {Function} [options.onLockChange] - 점유 상태 변경 콜백
 * @returns {Object} CheckoutManager 인스턴스
 */
export function createCheckoutManager(options = {}) {
  const { currentUserId, onLockChange } = options;

  /** @type {Map<string, Object>} */
  const locks = new Map();

  /**
   * 엔티티 점유 요청
   *
   * @param {string} entityId - 엔티티 ID
   * @param {Object} entity - 엔티티 정보
   * @returns {boolean} 점유 성공 여부
   */
  function lock(entityId, entity) {
    if (locks.has(entityId)) {
      const existing = locks.get(entityId);
      if (existing.lockedBy !== currentUserId) {
        return false; // 이미 다른 사용자가 점유
      }
    }

    locks.set(entityId, {
      ...entity,
      lockedBy: currentUserId,
      lockedAt: Date.now(),
      isEditing: false
    });

    onLockChange?.(getLocks());
    return true;
  }

  /**
   * 점유 해제 요청
   *
   * @param {string} entityId - 엔티티 ID
   */
  function unlock(entityId) {
    if (locks.has(entityId)) {
      const lock = locks.get(entityId);
      if (lock.lockedBy === currentUserId) {
        locks.delete(entityId);
        onLockChange?.(getLocks());
      }
    }
  }

  /**
   * 편집 시작
   *
   * @param {string} entityId - 엔티티 ID
   */
  function startEditing(entityId) {
    if (locks.has(entityId) && locks.get(entityId).lockedBy === currentUserId) {
      const lock = locks.get(entityId);
      lock.isEditing = true;
      onLockChange?.(getLocks());
    }
  }

  /**
   * 편집 완료
   *
   * @param {string} entityId - 엔티티 ID
   */
  function finishEditing(entityId) {
    if (locks.has(entityId) && locks.get(entityId).lockedBy === currentUserId) {
      const lock = locks.get(entityId);
      lock.isEditing = false;
      onLockChange?.(getLocks());
    }
  }

  /**
   * 점유 상태 확인
   *
   * @param {string} entityId - 엔티티 ID
   * @returns {Object|null} 점유 정보 또는 null
   */
  function getLock(entityId) {
    return locks.get(entityId) || null;
  }

  /**
   * 모든 점유 목록 반환
   *
   * @returns {Object[]}
   */
  function getLocks() {
    return Array.from(locks.values());
  }

  /**
   * 특정 사용자가 점유한 엔티티 목록 반환
   *
   * @param {string} userId - 사용자 ID
   * @returns {Object[]}
   */
  function getLocksByUser(userId) {
    return Array.from(locks.values()).filter((l) => l.lockedBy === userId);
  }

  /**
   * 점유 가능한지 확인
   *
   * @param {string} entityId - 엔티티 ID
   * @returns {boolean}
   */
  function canLock(entityId) {
    if (!locks.has(entityId)) return true;
    return locks.get(entityId).lockedBy === currentUserId;
  }

  return {
    lock,
    unlock,
    startEditing,
    finishEditing,
    getLock,
    getLocks,
    getLocksByUser,
    canLock
  };
}

/**
 * CSS 스타일
 */
const styles = {
  container: {
    position: "absolute",
    bottom: "8px",
    left: "8px",
    width: "200px",
    background: "rgba(15, 23, 42, 0.95)",
    borderRadius: "6px",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    overflow: "hidden",
    zIndex: 90
  },
  header: {
    padding: "6px 10px",
    fontSize: "11px",
    fontWeight: 600,
    color: "#94a3b8",
    borderBottom: "1px solid rgba(148, 163, 184, 0.1)"
  },
  list: {
    maxHeight: "150px",
    overflowY: "auto"
  },
  badge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 10px",
    borderLeft: "3px solid",
    cursor: "pointer",
    transition: "background 0.15s"
  },
  lockIcon: {
    fontSize: "14px",
    width: "20px",
    textAlign: "center"
  },
  entityInfo: {
    flex: 1,
    minWidth: 0
  },
  entityType: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#e2e8f0"
  },
  lockedBy: {
    fontSize: "10px",
    color: "#64748b"
  },
  editingIndicator: {
    fontSize: "10px",
    color: "#f59e0b",
    animation: "pulse 1.5s infinite"
  }
};