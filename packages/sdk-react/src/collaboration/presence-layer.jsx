/**
 * presence-layer.jsx
 * 프레즌스 및 사용자 커서 표시 레이어
 *
 * 접속한 사용자들의 목록과 커서 위치를 표시합니다.
 * 실시간 협업에서 누가 어떤 문서를 보고 있는지 시각적으로 표현합니다.
 */

import React, { useState, useEffect, useCallback } from "react";

/**
 * 사용자 커서 색상 팔레트
 */
const CURSOR_COLORS = [
  "#FF6B6B", // 빨강
  "#4ECDC4", // 청록
  "#45B7D1", // 파랑
  "#96CEB4", // 연두
  "#FFEAA7", // 노랑
  "#DDA0DD", // 보라
  "#98D8C8", // 민트
  "#F7DC6F"  // 주황
];

/**
 * 커서 색상 선택 (사용자 ID 기반 일관된 색상 배정)
 *
 * @param {string} userId - 사용자 ID
 * @returns {string} 색상 hex 코드
 */
function getCursorColor(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

/**
 * PresenceLayer — 사용자 프레즌스 및 커서 표시 컴포넌트
 *
 * @param {Object} props - 컴포넌트 속성
 * @param {Object[]} props.users - 접속 사용자 목록
 * @param {Object} [props.viewport] - 뷰포트 상태 (마우스 위치 계산을 위해)
 * @param {Function} [props.onUserClick] - 사용자 클릭 핸들러
 */
export function PresenceLayer({
  users = [],
  viewport,
  onUserClick
}) {
  const [cursors, setCursors] = useState({});

  /**
   * 사용자별 커서 위치 업데이트
   */
  const updateCursor = useCallback((userId, position) => {
    setCursors((prev) => ({
      ...prev,
      [userId]: { ...position, updatedAt: Date.now() }
    }));
  }, []);

  /**
   * 사용자 퇴장 처리
   */
  const removeCursor = useCallback((userId) => {
    setCursors((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }, []);

  /**
   * presence.update 이벤트 처리
   */
  const handlePresenceUpdate = useCallback((event) => {
    const { userId, position, type } = event.payload;

    if (type === "cursor") {
      updateCursor(userId, position);
    } else if (type === "leave") {
      removeCursor(userId);
    }
  }, [updateCursor, removeCursor]);

  // 프레즌스 구독 (실제 구현에서는 realtime-client와 연동)
  useEffect(() => {
    // 사용자 목록 변경 시 커서 동기화
    const activeUserIds = users.map((u) => u.id);
    setCursors((prev) => {
      const next = {};
      for (const user of users) {
        if (prev[user.id]) {
          next[user.id] = prev[user.id];
        }
      }
      return next;
    });
  }, [users]);

  return (
    <div style={styles.container}>
      {/* 사용자 목록 패널 */}
      <UserListPanel users={users} onUserClick={onUserClick} />

      {/* 커서 오버레이 */}
      <CursorOverlay cursors={cursors} viewport={viewport} />
    </div>
  );
}

/**
 * 사용자 목록 패널
 *
 * @param {Object} props
 * @param {Object[]} props.users - 사용자 목록
 * @param {Function} [props.onUserClick] - 클릭 핸들러
 */
function UserListPanel({ users, onUserClick }) {
  return (
    <div style={styles.userList}>
      <div style={styles.userListHeader}>
        접속 사용자 ({users.length})
      </div>
      <div style={styles.userListContent}>
        {users.length === 0 ? (
          <div style={styles.emptyMessage}>접속자 없음</div>
        ) : (
          users.map((user) => (
            <UserBadge
              key={user.id}
              user={user}
              onClick={() => onUserClick?.(user)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * 사용자 배지 컴포넌트
 *
 * @param {Object} props
 * @param {Object} props.user - 사용자 정보
 * @param {Function} [props.onClick] - 클릭 핸들러
 */
function UserBadge({ user, onClick }) {
  const color = getCursorColor(user.id);
  const isActive = user.isActive ?? true;

  return (
    <div
      style={{
        ...styles.userBadge,
        borderLeftColor: color
      }}
      onClick={onClick}
    >
      <div style={{ ...styles.userDot, backgroundColor: color }} />
      <div style={styles.userInfo}>
        <div style={styles.userName}>{user.name || user.id}</div>
        {user.email && (
          <div style={styles.userEmail}>{user.email}</div>
        )}
      </div>
      <div
        style={{
          ...styles.activeIndicator,
          backgroundColor: isActive ? "#4ade80" : "#94a3b8"
        }}
        title={isActive ? "편집 중" : "비활성"}
      />
    </div>
  );
}

/**
 * 커서 오버레이 — 다른 사용자의 커서 위치 표시
 *
 * @param {Object} props
 * @param {Object} props.cursors - 커서 위치 맵 { userId: { x, y } }
 * @param {Object} [props.viewport] - 뷰포트 정보
 */
function CursorOverlay({ cursors, viewport }) {
  return (
    <div style={styles.cursorOverlay}>
      {Object.entries(cursors).map(([userId, cursor]) => {
        const color = getCursorColor(userId);
        return (
          <div
            key={userId}
            style={{
              ...styles.cursor,
              left: cursor.x,
              top: cursor.y
            }}
          >
            {/* 커서 화살표 */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              style={{ filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.5))` }}
            >
              <path
                d="M0 0 L12 12 L6 12 L4 16 Z"
                fill={color}
              />
            </svg>
            {/* 사용자 이름 라벨 */}
            <div
              style={{
                ...styles.cursorLabel,
                backgroundColor: color
              }}
            >
              {userId.slice(0, 8)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * PresenceManager — 프레즌스 상태 관리자
 *
 * @param {Object} options - 옵션
 * @param {Function} [options.onPresenceUpdate] - 프레즌스 업데이트 콜백
 * @returns {Object} PresenceManager 인스턴스
 */
export function createPresenceManager(options = {}) {
  const { onPresenceUpdate } = options;

  /** @type {Map<string, Object>} */
  const users = new Map();

  /**
   * 사용자 입장
   *
   * @param {Object} userInfo - 사용자 정보
   */
  function addUser(userInfo) {
    users.set(userInfo.id, {
      ...userInfo,
      joinedAt: Date.now(),
      isActive: true
    });
    notifyUpdate("join", userInfo);
  }

  /**
   * 사용자 퇴장
   *
   * @param {string} userId - 퇴장할 사용자 ID
   */
  function removeUser(userId) {
    if (users.has(userId)) {
      const user = users.get(userId);
      users.delete(userId);
      notifyUpdate("leave", user);
    }
  }

  /**
   * 커서 위치 업데이트
   *
   * @param {string} userId - 사용자 ID
   * @param {Object} position - 커서 위치 { x, y }
   */
  function updateCursor(userId, position) {
    if (users.has(userId)) {
      const user = users.get(userId);
      user.cursor = position;
      user.lastActiveAt = Date.now();
      notifyUpdate("cursor", { userId, position });
    }
  }

  /**
   * 사용자 활성 상태 업데이트
   *
   * @param {string} userId - 사용자 ID
   * @param {boolean} isActive - 활성 상태
   */
  function setUserActive(userId, isActive) {
    if (users.has(userId)) {
      const user = users.get(userId);
      user.isActive = isActive;
      user.lastActiveAt = Date.now();
      notifyUpdate("active", { userId, isActive });
    }
  }

  /**
   * 모든 사용자 목록 반환
   *
   * @returns {Object[]}
   */
  function getUsers() {
    return Array.from(users.values());
  }

  /**
   * 프레즌스 업데이트 알림
   *
   * @param {string} type - 이벤트 타입
   * @param {Object} payload - 페이로드
   */
  function notifyUpdate(type, payload) {
    onPresenceUpdate?.({ type, payload });
  }

  return {
    addUser,
    removeUser,
    updateCursor,
    setUserActive,
    getUsers
  };
}

/**
 * CSS 스타일
 */
const styles = {
  container: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    zIndex: 100
  },
  userList: {
    position: "absolute",
    top: "8px",
    right: "8px",
    width: "160px",
    background: "rgba(15, 23, 42, 0.9)",
    borderRadius: "6px",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    overflow: "hidden",
    pointerEvents: "auto"
  },
  userListHeader: {
    padding: "8px 12px",
    fontSize: "11px",
    fontWeight: 600,
    color: "#94a3b8",
    borderBottom: "1px solid rgba(148, 163, 184, 0.1)"
  },
  userListContent: {
    maxHeight: "200px",
    overflowY: "auto"
  },
  emptyMessage: {
    padding: "16px 12px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "11px"
  },
  userBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 10px",
    borderLeft: "3px solid",
    cursor: "pointer",
    transition: "background 0.15s"
  },
  userDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0
  },
  userInfo: {
    flex: 1,
    minWidth: 0
  },
  userName: {
    fontSize: "12px",
    fontWeight: 500,
    color: "#e2e8f0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  userEmail: {
    fontSize: "10px",
    color: "#64748b",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  },
  activeIndicator: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    flexShrink: 0
  },
  cursorOverlay: {
    position: "absolute",
    inset: 0
  },
  cursor: {
    position: "absolute",
    transform: "translate(-2px, -2px)",
    transition: "left 0.1s, top 0.1s"
  },
  cursorLabel: {
    position: "absolute",
    top: "16px",
    left: "8px",
    padding: "2px 6px",
    borderRadius: "3px",
    fontSize: "10px",
    fontWeight: 500,
    color: "#fff",
    whiteSpace: "nowrap",
    pointerEvents: "none"
  }
};