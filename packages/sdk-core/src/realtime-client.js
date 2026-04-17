/**
 * realtime-client.js
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
};

/**
 * 연결 상태
 */
export const CONNECTION_STATE = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  RECONNECTING: "reconnecting",
  FAILED: "failed"
};

/**
 * 재연결 기본 설정
 */
const DEFAULT_RECONNECT_OPTIONS = {
  maxRetries: 5,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2
};

/**
 * realtime-client 인스턴스를 생성합니다.
 *
 * @param {Object} options - 클라이언트 옵션
 * @param {string} options.baseUrl - WebSocket 서버 URL
 * @param {string} options.token - 인증 토큰
 * @param {string} [options.documentId] - 문서 ID
 * @param {Function} [options.onEvent] - 이벤트 수신 콜백
 * @param {Function} [options.onStateChange] - 연결 상태 변경 콜백
 * @param {Object} [options.reconnectOptions] - 재연결 옵션
 * @returns {Object} realtime-client 인스턴스
 */
export function createRealtimeClient(options = {}) {
  const {
    baseUrl,
    token,
    documentId = null,
    onEvent,
    onStateChange,
    reconnectOptions = {}
  } = options;

  const reconnect = { ...DEFAULT_RECONNECT_OPTIONS, ...reconnectOptions };

  /** @type {WebSocket|null} */
  let ws = null;

  /** @type {string} */
  let currentDocumentId = documentId;

  /** @type {string} */
  let state = CONNECTION_STATE.DISCONNECTED;

  /** @type {number} */
  let retryCount = 0;

  /** @type {ReturnType<setTimeout>|null} */
  let reconnectTimer = null;

  /**
   * 연결 상태 업데이트 및 알림
   *
   * @param {string} newState - 새 연결 상태
   */
  function setState(newState) {
    if (state === newState) return;
    state = newState;
    onStateChange?.(newState);
  }

  /**
   * WebSocket 연결을Establish 합니다.
   *
   * @param {string} [docId] - 연결할 문서 ID
   */
  function connect(docId) {
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
          onEvent?.({ type: COLLAB_EVENTS.ERROR, message: "메시지 파싱 오류", error: err.message });
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
      setState(CONNECTION_STATE.FAILED);
      onEvent?.({ type: COLLAB_EVENTS.ERROR, message: "연결 실패", error: err.message });
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
   *
   * @param {Object} message - 수신된 메시지
   */
  function handleMessage(message) {
    const { type, payload } = message;

    switch (type) {
      case COLLAB_EVENTS.ENTITY_LOCKED:
      case COLLAB_EVENTS.ENTITY_UNLOCKED:
      case COLLAB_EVENTS.PRESENCE_UPDATE:
      case COLLAB_EVENTS.ERROR:
        onEvent?.({ type, payload, raw: message });
        break;

      case "checkout.response":
      case "commit.response":
        onEvent?.({ type, payload, raw: message });
        break;

      default:
        onEvent?.({ type, payload, raw: message });
    }
  }

  /**
   * 협업 이벤트를 전송합니다.
   *
   * @param {string} eventType - 이벤트 타입
   * @param {Object} payload - 이벤트 페이로드
   * @returns {boolean} 전송 성공 여부
   */
  function sendEvent(eventType, payload = {}) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    const message = JSON.stringify({ type: eventType, payload, documentId: currentDocumentId });

    try {
      ws.send(message);
      return true;
    } catch (err) {
      onEvent?.({ type: COLLAB_EVENTS.ERROR, message: "메시지 전송 실패", error: err.message });
      return false;
    }
  }

  /**
   * 엔티티 체크아웃 요청을 보냅니다.
   *
   * @param {string} entityId - 체크아웃할 엔티티 ID
   * @returns {boolean} 전송 성공 여부
   */
  function checkout(entityId) {
    return sendEvent(COLLAB_EVENTS.CHECKOUT, { entityId });
  }

  /**
   * 엔티티 체크아웃 취소 요청을 보냅니다.
   *
   * @param {string} entityId - 체크아웃 취소할 엔티티 ID
   * @returns {boolean} 전송 성공 여부
   */
  function cancel(entityId) {
    return sendEvent(COLLAB_EVENTS.CANCEL, { entityId });
  }

  /**
   * 변경 사항 커밋을 요청합니다.
   *
   * @param {string} entityId - 커밋할 엔티티 ID
   * @param {Object} changes - 변경 사항
   * @returns {boolean} 전송 성공 여부
   */
  function commit(entityId, changes) {
    return sendEvent(COLLAB_EVENTS.COMMIT, { entityId, changes });
  }

  /**
   * 임시 수정 시작을 알립니다.
   *
   * @param {string} entityId - 수정할 엔티티 ID
   * @returns {boolean} 전송 성공 여부
   */
  function draft(entityId) {
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

    // 지수 백오프
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
   *
   * @param {string} newDocumentId - 새 문서 ID
   */
  function changeDocument(newDocumentId) {
    disconnect();
    currentDocumentId = newDocumentId;
    connect(newDocumentId);
  }

  /**
   * 현재 연결 상태를 반환합니다.
   *
   * @returns {string}
   */
  function getState() {
    return state;
  }

  /**
   * WebSocket URL을 구성합니다.
   *
   * @param {string} base - 기본 URL
   * @param {string} docId - 문서 ID
   * @param {string} authToken - 인증 토큰
   * @returns {string} 완전한 WebSocket URL
   */
  function buildWebSocketUrl(base, docId, authToken) {
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