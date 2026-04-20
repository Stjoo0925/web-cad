import React, { useState, useEffect, useCallback } from "react";

const CURSOR_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"];

function getCursorColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length];
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  isActive?: boolean;
}

export interface Cursor {
  x: number;
  y: number;
  updatedAt: number;
}

export interface PresenceLayerProps {
  users?: User[];
  viewport?: { pan: { x: number; y: number }; zoom: number };
  onUserClick?: (user: User) => void;
}

export interface PresenceManager {
  addUser: (userInfo: User) => void;
  removeUser: (userId: string) => void;
  updateCursor: (userId: string, position: { x: number; y: number }) => void;
  setUserActive: (userId: string, isActive: boolean) => void;
  getUsers: () => User[];
}

function UserListPanel({ users, onUserClick }: { users: User[]; onUserClick?: (user: User) => void }) {
  return (
    <div style={styles.userList}>
      <div style={styles.userListHeader}>접속 사용자 ({users.length})</div>
      <div style={styles.userListContent}>
        {users.length === 0 ? (
          <div style={styles.emptyMessage}>접속자 없음</div>
        ) : (
          users.map((user) => (
            <UserBadge key={user.id} user={user} onClick={() => onUserClick?.(user)} />
          ))
        )}
      </div>
    </div>
  );
}

function UserBadge({ user, onClick }: { user: User; onClick?: () => void }) {
  const color = getCursorColor(user.id);
  const isActive = user.isActive ?? true;
  return (
    <div style={{ ...styles.userBadge, borderLeftColor: color }} onClick={onClick}>
      <div style={{ ...styles.userDot, backgroundColor: color }} />
      <div style={styles.userInfo}>
        <div style={styles.userName}>{user.name || user.id}</div>
        {user.email && <div style={styles.userEmail}>{user.email}</div>}
      </div>
      <div style={{ ...styles.activeIndicator, backgroundColor: isActive ? "#4ade80" : "#94a3b8" }} title={isActive ? "편집 중" : "비활성"} />
    </div>
  );
}

function CursorOverlay({ cursors }: { cursors: Record<string, Cursor> }) {
  return (
    <div style={styles.cursorOverlay}>
      {Object.entries(cursors).map(([userId, cursor]) => {
        const color = getCursorColor(userId);
        return (
          <div key={userId} style={{ ...styles.cursor, left: cursor.x, top: cursor.y }}>
            <svg width="16" height="16" viewBox="0 0 16 16" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}>
              <path d="M0 0 L12 12 L6 12 L4 16 Z" fill={color} />
            </svg>
            <div style={{ ...styles.cursorLabel, backgroundColor: color }}>{userId.slice(0, 8)}</div>
          </div>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { position: "absolute", inset: 0, pointerEvents: "none", zIndex: 100 },
  userList: { position: "absolute", top: "8px", right: "8px", width: "160px", background: "rgba(15, 23, 42, 0.9)", borderRadius: "6px", border: "1px solid rgba(148, 163, 184, 0.2)", overflow: "hidden", pointerEvents: "auto" },
  userListHeader: { padding: "8px 12px", fontSize: "11px", fontWeight: 600, color: "#94a3b8", borderBottom: "1px solid rgba(148, 163, 184, 0.1)" },
  userListContent: { maxHeight: "200px", overflowY: "auto" },
  emptyMessage: { padding: "16px 12px", textAlign: "center", color: "#64748b", fontSize: "11px" },
  userBadge: { display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", borderLeft: "3px solid", cursor: "pointer", transition: "background 0.15s" },
  userDot: { width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0 },
  userInfo: { flex: 1, minWidth: 0 },
  userName: { fontSize: "12px", fontWeight: 500, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  userEmail: { fontSize: "10px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  activeIndicator: { width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0 },
  cursorOverlay: { position: "absolute", inset: 0 },
  cursor: { position: "absolute", transform: "translate(-2px, -2px)", transition: "left 0.1s, top 0.1s" },
  cursorLabel: { position: "absolute", top: "16px", left: "8px", padding: "2px 6px", borderRadius: "3px", fontSize: "10px", fontWeight: 500, color: "#fff", whiteSpace: "nowrap", pointerEvents: "none" }
};

export function PresenceLayer({ users = [], viewport, onUserClick }: PresenceLayerProps) {
  const [cursors, setCursors] = useState<Record<string, Cursor>>({});

  const updateCursor = useCallback((userId: string, position: { x: number; y: number }) => {
    setCursors((prev) => ({ ...prev, [userId]: { ...position, updatedAt: Date.now() } }));
  }, []);

  const removeCursor = useCallback((userId: string) => {
    setCursors((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }, []);

  useEffect(() => {
    const activeUserIds = users.map((u) => u.id);
    setCursors((prev) => {
      const next: Record<string, Cursor> = {};
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
      <UserListPanel users={users} onUserClick={onUserClick} />
      <CursorOverlay cursors={cursors} />
    </div>
  );
}

export function createPresenceManager(options: { onPresenceUpdate?: (event: { type: string; payload: unknown }) => void } = {}) {
  const { onPresenceUpdate } = options;
  const users = new Map<string, User & { joinedAt: number; isActive: boolean; cursor?: { x: number; y: number }; lastActiveAt?: number }>();

  function addUser(userInfo: User) {
    users.set(userInfo.id, { ...userInfo, joinedAt: Date.now(), isActive: true });
    onPresenceUpdate?.({ type: "join", payload: userInfo });
  }

  function removeUser(userId: string) {
    if (users.has(userId)) {
      const user = users.get(userId)!;
      users.delete(userId);
      onPresenceUpdate?.({ type: "leave", payload: user });
    }
  }

  function updateCursor(userId: string, position: { x: number; y: number }) {
    if (users.has(userId)) {
      const user = users.get(userId)!;
      user.cursor = position;
      user.lastActiveAt = Date.now();
      onPresenceUpdate?.({ type: "cursor", payload: { userId, position } });
    }
  }

  function setUserActive(userId: string, isActive: boolean) {
    if (users.has(userId)) {
      const user = users.get(userId)!;
      user.isActive = isActive;
      user.lastActiveAt = Date.now();
      onPresenceUpdate?.({ type: "active", payload: { userId, isActive } });
    }
  }

  function getUsers() {
    return Array.from(users.values());
  }

  return { addUser, removeUser, updateCursor, setUserActive, getUsers };
}
