/**
 * line-tool.js
 * 선(LINE) 그리기 도구 모듈
 *
 * 클릭 두 번으로 시작점/끝점을 지정하여 LINE 엔티티를 생성합니다.
 * 완료 시 onComplete 콜백과 CREATE_ENTITY 문서 명령을 생성합니다.
 */

/**
 * LINE 도구를 사용하여 사용자가 클릭으로 지정한 시작점과 끝점을 저장합니다.
 *
 * @typedef {Object} LineToolState
 * @property {Object|null} startPoint - 시작점 { x, y } (화면 좌표)
 * @property {Object|null} endPoint - 끝점 { x, y } (화면 좌표)
 * @property {boolean} isDrawing - 그리기 진행 중 여부
 */

/**
 * LINE 도구 인스턴스를 생성합니다.
 *
 * @param {Object} options - 도구 옵션
 * @param {Function} [options.onComplete] - 선 완성 시 호출될 콜백 (entity, command)
 * @param {Function} [options.onPreview] - 미리보기 업데이트 시 호출될 콜백 (entity)
 * @returns {Object} LINE 도구 인스턴스
 */
export function createLineTool(options = {}) {
  const { onComplete, onPreview } = options;

  /** @type {LineToolState} */
  const state = {
    startPoint: null,
    endPoint: null,
    isDrawing: false
  };

  /**
   * 클릭 이벤트 처리 — 첫 클릭은 시작점, 두 번째 클릭은 끝점 설정 후 완성
   *
   * @param {Object} screenPoint - 클릭한 화면 좌표 { x, y }
   * @returns {Object|null} 완성된 엔티티 또는 null (진행 중인 경우)
   */
  function handleClick(screenPoint) {
    if (!state.isDrawing) {
      // 첫 번째 클릭 — 시작점 설정
      state.startPoint = { ...screenPoint };
      state.endPoint = { ...screenPoint };
      state.isDrawing = true;

      // 미리보기 엔티티通知
      if (onPreview) {
        onPreview(createLineEntity(state.startPoint, state.endPoint));
      }
      return null;
    } else {
      // 두 번째 클릭 — 끝점 설정 후 완성
      state.endPoint = { ...screenPoint };
      state.isDrawing = false;

      const entity = createLineEntity(state.startPoint, state.endPoint);
      const command = createCreateLineCommand(entity);

      // 완료 콜백 호출
      if (onComplete) {
        onComplete(entity, command);
      }

      // 상태 초기화
      const result = entity;
      state.startPoint = null;
      state.endPoint = null;

      return result;
    }
  }

  /**
   * 마우스 이동 시 미리보기 업데이트
   *
   * @param {Object} screenPoint - 현재 마우스 좌표 { x, y }
   */
  function handleMove(screenPoint) {
    if (!state.isDrawing || !state.startPoint) return;

    state.endPoint = { ...screenPoint };

    if (onPreview) {
      onPreview(createLineEntity(state.startPoint, state.endPoint));
    }
  }

  /**
   * 그리기 취소 (ESC 등)
   */
  function cancel() {
    state.startPoint = null;
    state.endPoint = null;
    state.isDrawing = false;
  }

  /**
   * 현재 진행 상태 반환
   *
   * @returns {LineToolState}
   */
  function getState() {
    return { ...state };
  }

  /**
   * 현재 미리보기 엔티티 반환
   *
   * @returns {Object|null}
   */
  function getPreviewEntity() {
    if (!state.startPoint || !state.endPoint) return null;
    return createLineEntity(state.startPoint, state.endPoint);
  }

  return {
    handleClick,
    handleMove,
    cancel,
    getState,
    getPreviewEntity
  };
}

/**
 * LINE 엔티티 객체를 생성합니다.
 *
 * @param {Object} start - 시작점 { x, y }
 * @param {Object} end - 끝점 { x, y }
 * @returns {Object} LINE 엔티티
 */
export function createLineEntity(start, end) {
  return {
    id: generateEntityId(),
    type: "LINE",
    start: { x: start.x, y: start.y },
    end: { x: end.x, y: end.y },
    layer: "0",
    color: "BYLAYER"
  };
}

/**
 * LINE 생성 문서 명령을 생성합니다.
 *
 * @param {Object} entity - 생성할 LINE 엔티티
 * @returns {Object} CREATE_ENTITY 명령
 */
export function createCreateLineCommand(entity) {
  return {
    type: "CREATE_ENTITY",
    entityType: "LINE",
    entityId: entity.id,
    params: {
      start: entity.start,
      end: entity.end,
      layer: entity.layer,
      color: entity.color
    }
  };
}

/**
 * 고유 엔티티 ID 생성 (임시 — 실제 구현 시 UUID 사용)
 *
 * @returns {string}
 */
function generateEntityId() {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * LINE 도구에서 사용할 수 있는 도구 모드를 반환합니다.
 *
 * @returns {string[]}
 */
export function getLineToolModes() {
  return ["click", "direct"];
}