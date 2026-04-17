/**
 * polyline-tool.js
 * 폴리라인(POLYLINE) 그리기 도구 모듈
 *
 * 연속 클릭으로 버텍스를 추가하고, 완료 시 POLYLINE 엔티티를 생성합니다.
 * 더블클릭 또는 완료 버튼으로 폴리라인을 종료합니다.
 * 완료 시 onComplete 콜백과 CREATE_ENTITY 문서 명령을 생성합니다.
 */

/**
 * POLYLINE 도구 상태
 *
 * @typedef {Object} PolylineToolState
 * @property {Object[]} vertices - 버텍스 배열 [{ x, y }, ...]
 * @property {boolean} isDrawing - 그리기 진행 중 여부
 * @property {boolean} closed - 닫힌 폴리라인 여부
 */

/**
 * POLYLINE 도구 인스턴스를 생성합니다.
 *
 * @param {Object} options - 도구 옵션
 * @param {Function} [options.onComplete] - 폴리라인 완성 시 호출될 콜백 (entity, command)
 * @param {Function} [options.onPreview] - 미리보기 업데이트 시 호출될 콜백 (entity)
 * @param {number} [options.minVertices=2] - 완성所需的 최소 버텍스 수
 * @returns {Object} POLYLINE 도구 인스턴스
 */
export function createPolylineTool(options = {}) {
  const {
    onComplete,
    onPreview,
    minVertices = 2
  } = options;

  /** @type {PolylineToolState} */
  const state = {
    vertices: [],
    isDrawing: false,
    closed: false
  };

  /**
   * 클릭 이벤트 처리 — 버텍스 추가
   *
   * @param {Object} screenPoint - 클릭한 화면 좌표 { x, y }
   * @returns {Object|null} 완성된 엔티티 또는 null (계속 그리는 경우)
   */
  function handleClick(screenPoint) {
    if (!state.isDrawing) {
      // 첫 클릭 — 그리기 시작
      state.vertices = [{ ...screenPoint }];
      state.isDrawing = true;
      state.closed = false;

      notifyPreview();
      return null;
    }

    // 두 번째 이후 클릭 — 버텍스 추가
    const lastVertex = state.vertices[state.vertices.length - 1];
    const dist = Math.hypot(screenPoint.x - lastVertex.x, screenPoint.y - lastVertex.y);

    // 같은 위치 중복 클릭 무시 (너무 가까운 점도 무시)
    if (dist < 2) return null;

    state.vertices.push({ ...screenPoint });
    notifyPreview();
    return null;
  }

  /**
   * 더블클릭 이벤트 처리 — 폴리라인 완성
   *
   * @returns {Object|null} 완성된 엔티티 또는 null (버텍스 부족 시)
   */
  function handleDoubleClick() {
    if (!state.isDrawing || state.vertices.length < minVertices) {
      return null;
    }

    return finishPolyline(false);
  }

  /**
   * 현재 버텍스에서 폴리라인을 닫고 완성
   *
   * @returns {Object|null} 완성된 엔티티 또는 null
   */
  function handleClose() {
    if (!state.isDrawing || state.vertices.length < minVertices) {
      return null;
    }

    return finishPolyline(true);
  }

  /**
   * 폴리라인 완성 처리 (내부)
   *
   * @param {boolean} closed - 닫힌 폴리라인 여부
   * @returns {Object|null}
   */
  function finishPolyline(closed) {
    const entity = createPolylineEntity(state.vertices, closed);
    const command = createCreatePolylineCommand(entity);

    if (onComplete) {
      onComplete(entity, command);
    }

    const result = entity;

    // 상태 초기화
    state.vertices = [];
    state.isDrawing = false;
    state.closed = false;

    return result;
  }

  /**
   * 마우스 이동 시 미리보기 업데이트
   *
   * @param {Object} screenPoint - 현재 마우스 좌표 { x, y }
   */
  function handleMove(screenPoint) {
    if (!state.isDrawing || state.vertices.length === 0) return;

    // 마지막 버텍스만 이동先で 업데이트 (시각적 피드백)
    // 실제 저장은 클릭에서만 수행
    notifyPreview();
  }

  /**
   * 미리보기 알림
   */
  function notifyPreview() {
    if (onPreview && state.vertices.length > 0) {
      // 현재 경로 미리보기 (마지막 버텍스 포함)
      onPreview(getPreviewEntity());
    }
  }

  /**
   * 그리기 취소 (ESC)
   */
  function cancel() {
    state.vertices = [];
    state.isDrawing = false;
    state.closed = false;
  }

  /**
   * 현재 상태 반환
   *
   * @returns {PolylineToolState}
   */
  function getState() {
    return {
      vertices: [...state.vertices],
      isDrawing: state.isDrawing,
      closed: state.closed
    };
  }

  /**
   * 미리보기 엔티티 반환
   *
   * @returns {Object|null}
   */
  function getPreviewEntity() {
    if (state.vertices.length < 1) return null;
    return createPolylineEntity(state.vertices, state.closed);
  }

  /**
   * 현재 버텍스 수 반환
   *
   * @returns {number}
   */
  function getVertexCount() {
    return state.vertices.length;
  }

  return {
    handleClick,
    handleDoubleClick,
    handleClose,
    handleMove,
    cancel,
    getState,
    getPreviewEntity,
    getVertexCount
  };
}

/**
 * POLYLINE 엔티티 객체를 생성합니다.
 *
 * @param {Object[]} vertices - 버텍스 배열 [{ x, y }, ...]
 * @param {boolean} [closed=false] - 닫힌 폴리라인 여부
 * @returns {Object} POLYLINE 엔티티
 */
export function createPolylineEntity(vertices, closed = false) {
  return {
    id: generateEntityId(),
    type: "POLYLINE",
    vertices: vertices.map((v) => ({ x: v.x, y: v.y })),
    closed,
    layer: "0",
    color: "BYLAYER"
  };
}

/**
 * POLYLINE 생성 문서 명령을 생성합니다.
 *
 * @param {Object} entity - 생성할 POLYLINE 엔티티
 * @returns {Object} CREATE_ENTITY 명령
 */
export function createCreatePolylineCommand(entity) {
  return {
    type: "CREATE_ENTITY",
    entityType: "POLYLINE",
    entityId: entity.id,
    params: {
      vertices: entity.vertices,
      closed: entity.closed,
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
  return `polyline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * POLYLINE 도구에서 사용할 수 있는 모드를 반환합니다.
 *
 * @returns {string[]}
 */
export function getPolylineToolModes() {
  return ["click", "close"];
}