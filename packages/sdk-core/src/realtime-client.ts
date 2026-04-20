/**
 * realtime-client.ts
 * WebSocket 기반 양방향 협업 채널 클라이언트
 *
 * checkout, draft, commit, cancel 이벤트를 양방향으로 주고받습니다.
 * 인증 토큰 전달 및 자동 재연결을 지원합니다.
 */

/**
 * 협업 이벤트 타입
 */
export const COLLAB_EVENTS = {
  CHECKOUT: "checkout",
  DRAFT: "draft",
  COMMIT: "commit",
  CANCEL: "cancel",
  ENTITY_LOCKED: "entity.locked",
  ENTITY_UNLOCKED: "entity.unlocked",
  PRESENCE_UPDATE: "presence.update",
  ERROR: "error"
} as const;

export type CollabEventType = (typeof COLLAB_EVENTS)[keyof typeof COLLAB_EVENTS];

/**
 * 연결 상태
 */
export const CONNECTION_STATE = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  RECONNECTING: "reconnecting",
  FAILED: "failed"
} as const;

export type ConnectionState = (typeof CONNECTION_STATE)[keyof typeof CONNECTION_STATE];

/**
 * 재연결 기본 설정
 */
const DEFAULT_RECONNECT_OPTIONS = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2
};

export interface RealtimeClientOptions {
  baseUrl: string;
  token: string;
  documentId?: string | null;
  onEvent?: (event: CollabEvent) => void;
  onStateChange?: (state: ConnectionState) => void;
  reconnectOptions?: Partial<typeof DEFAULT_RECONNECT_OPTIONS>;
}

export interface CollabEvent {
  type: string;
  payload?: unknown;
  raw?: Record<string, unknown>;
  message?: string;
  error?: unknown;
  documentId?: string;
  reason?: string;
}

/**
 * realtime-client 인스턴스를 생성합니다.
 */
export function createRealtimeClient(options: RealtimeClientOptions = {} as RealtimeClientOptions) {
  const {
    baseUrl,
    token,
    documentId = null,
    onEvent,
    onStateChange,
    reconnectOptions = {}
  } = options;

  const reconnect = { ...DEFAULT_RECONNECT_OPTIONS, ...reconnectOptions };

  let ws: WebSocket | null = null;
  let currentDocumentId: string | null = documentId;
  let state: ConnectionState = CONNECTION_STATE.DISCONNECTED;
  let retryCount = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * 연결 상태 업데이트 및 알림
   */
  function setState(newState: ConnectionState) {
    if (state === newState) return;
    state = newState;
    onStateChange?.(newState);
  }

  /**
   * WebSocket 연결을 설정합니다.
   */
  function connect(docId?: string | null) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      return;
    }

    const targetDocId = docId || currentDocumentId;
    if (!targetDocId) {
      onEvent?.({ type: COLLAB_EVENTS.ERROR, message: "문서 ID가 필요합니다" });
      return;
    }

    currentDocumentId = targetDocId;
    setState(CONNECTION_STATE.CONNECTING);

    const wsUrl = buildWebSocketUrl(baseUrl, targetDocId, token);

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setState(CONNECTION_STATE.CONNECTED);
        retryCount = 0;
        onEvent?.({ type: "connected", documentId: targetDocId });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (err) {
          const e = err as Error;
          onEvent?.({ type: COLLAB_EVENTS.ERROR, message: "메시지 파싱 오류", error: e.message });
        }
      };

      ws.onerror = (error) => {
        onEvent?.({ type: COLLAB_EVENTS.ERROR, message: "WebSocket 오류", error });
      };

      ws.onclose = (event) => {
        if (event.wasClean) {
          setState(CONNECTION_STATE.DISCONNECTED);
          onEvent?.({ type: "disconnected", reason: "clean" });
        } else {
          setState(CONNECTION_STATE.DISCONNECTED);
          scheduleReconnect();
        }
      };
    } catch (err) {
      const e = err as Error;
      setState(CONNECTION_STATE.FAILED);
      onEvent?.({ type: COLLAB_EVENTS.ERROR, message: "연결 실패", error: e.message });
    }
  }

  /**
   * 연결을 종료합니다.
   */
  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    retryCount = 0;

    if (ws) {
      ws.close();
      ws = null;
    }
    setState(CONNECTION_STATE.DISCONNECTED);
  }

  /**
   * 메시지를 처리합니다.
   */
  function handleMessage(message: Record<string, unknown>) {
    const { type, payload } = message;

    switch (type) {
      case COLLAB_EVENTS.ENTITY_LOCKED:
      case COLLAB_EVENTS.ENTITY_UNLOCKED:
      case COLLAB_EVENTS.PRESENCE_UPDATE:
      case COLLAB_EVENTS.ERROR:
        onEvent?.({ type: type as string, payload, raw: message });
        break;

      case "checkout.response":
      case "commit.response":
        onEvent?.({ type: type as string, payload, raw: message });
        break;

      default:
        onEvent?.({ type: type as string, payload, raw: message });
    }
  }

  /**
   * 협업 이벤트를 전송합니다.
   */
  function sendEvent(eventType: string, payload: Record<string, unknown> = {}): boolean {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    const message = JSON.stringify({ type: eventType, payload, documentId: currentDocumentId });

    try {
      ws.send(message);
      return true;
    } catch (err) {
      const e = err as Error;
      onEvent?.({ type: COLLAB_EVENTS.ERROR, message: "메시지 전송 실패", error: e.message });
      return false;
    }
  }

  /**
   * 엔티티 체크아웃 요청을 보냅니다.
   */
  function checkout(entityId: string): boolean {
    return sendEvent(COLLAB_EVENTS.CHECKOUT, { entityId });
  }

  /**
   * 엔티티 체크아웃 취소 요청을 보냅니다.
   */
  function cancel(entityId: string): boolean {
    return sendEvent(COLLAB_EVENTS.CANCEL, { entityId });
  }

  /**
   * 변경 사항 커밋을 요청합니다.
   */
  function commit(entityId: string, changes: Record<string, unknown>): boolean {
    return sendEvent(COLLAB_EVENTS.COMMIT, { entityId, changes });
  }

  /**
   * 임시 수정 시작을 알립니다.
   */
  function draft(entityId: string): boolean {
    return sendEvent(COLLAB_EVENTS.DRAFT, { entityId });
  }

  /**
   * 재연결을 예약합니다.
   */
  function scheduleReconnect() {
    if (retryCount >= reconnect.maxRetries) {
      setState(CONNECTION_STATE.FAILED);
      onEvent?.({
        type: COLLAB_EVENTS.ERROR,
        message: `재연결 실패: 최대 ${reconnect.maxRetries}회 시도 완료`
      });
      return;
    }

    setState(CONNECTION_STATE.RECONNECTING);
    retryCount++;

    const delay = Math.min(
      reconnect.baseDelayMs * Math.pow(reconnect.backoffMultiplier, retryCount - 1),
      reconnect.maxDelayMs
    );

    reconnectTimer = setTimeout(() => {
      if (currentDocumentId) {
        connect(currentDocumentId);
      }
    }, delay);
  }

  /**
   * 문서를 변경합니다.
   */
  function changeDocument(newDocumentId: string) {
    disconnect();
    currentDocumentId = newDocumentId;
    connect(newDocumentId);
  }

  /**
   * 현재 연결 상태를 반환합니다.
   */
  function getState(): ConnectionState {
    return state;
  }

  /**
   * WebSocket URL을 구성합니다.
   */
  function buildWebSocketUrl(base: string, docId: string, authToken: string): string {
    const url = new URL(base);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = `/ws/collab/${docId}`;
    if (authToken) {
      url.searchParams.set("token", authToken);
    }
    return url.toString();
  }

  return {
    connect,
    disconnect,
    sendEvent,
    checkout,
    cancel,
    commit,
    draft,
    changeDocument,
    getState,
    COLLAB_EVENTS,
    CONNECTION_STATE
  };
}
