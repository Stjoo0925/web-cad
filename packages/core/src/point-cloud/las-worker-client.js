/**
 * las-worker-client.js
 * LAS/LAZ 포인트클라우드 파일을 처리하는 워커 클라이언트
 *
 * 메인 스레드에서 LAS/LAZ 파일 처리를 워커로 분리하기 위한 인터페이스입니다.
 * 실제 디코더 라이브러리 교체가 가능하도록 어댑터 구조를 가집니다.
 */

// 워커 메시지 유형
export const WORKER_MESSAGE_TYPES = {
  PROCESS: "las:process",
  PROGRESS: "las:progress",
  COMPLETE: "las:complete",
  ERROR: "las:error"
};

/**
 * LAS 워커 클라이언트를 생성합니다.
 *
 * @param {Object} options - 옵션
 * @param {Worker} [options.worker] - Web Worker 인스턴스 (선택적, 없으면 simulated 모드)
 * @param {Function} [options.onProgress] - 진행률 콜백 (percent: 0~100)
 * @param {Function} [options.onComplete] - 완료 콜백 (result: 파싱 결과)
 * @param {Function} [options.onError] - 오류 콜백 (error: Error 객체)
 * @returns {Object} 워커 클라이언트 인스턴스
 */
export function createLasWorkerClient(options = {}) {
  const { worker, onProgress, onComplete, onError } = options;

  let activeRequestId = null;

  /**
   * LAS/LAS 파일을 처리합니다.
   *
   * @param {Object} params - 처리 파라미터
   * @param {ArrayBuffer} params.buffer - LAS/LAZ 파일 버퍼
   * @param {string} [params.assetId] - 애셋 ID
   * @param {string} [params.documentId] - 문서 ID
   * @returns {Promise<Object>} 처리 결과
   */
  async function processLas({ buffer, assetId, documentId }) {
    const requestId = `las-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    activeRequestId = requestId;

    // simulated 모드 (워커 없음 — 실제 디코더 없이 구조만 검증)
    if (!worker) {
      return simulateProcess({ buffer, assetId, documentId, requestId });
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`LAS 처리 시간 초과: ${requestId}`));
      }, 60000);

      const handleMessage = (event) => {
        const { type, requestId: respReqId, data, error, percent } = event.data;
        if (respReqId !== requestId) return;

        if (type === WORKER_MESSAGE_TYPES.PROGRESS) {
          onProgress?.({ percent: percent ?? 0, requestId });
        } else if (type === WORKER_MESSAGE_TYPES.COMPLETE) {
          clearTimeout(timeoutId);
          worker.removeEventListener("message", handleMessage);
          onComplete?.(data);
          resolve(data);
        } else if (type === WORKER_MESSAGE_TYPES.ERROR) {
          clearTimeout(timeoutId);
          worker.removeEventListener("message", handleMessage);
          const err = new Error(error ?? "LAS 처리 오류");
          onError?.(err);
          reject(err);
        }
      };

      worker.addEventListener("message", handleMessage);
      worker.postMessage({
        type: WORKER_MESSAGE_TYPES.PROCESS,
        requestId,
        data: { buffer, assetId, documentId }
      });
    });
  }

  /**
   * simulated 처리 (디코더 라이브러리 없이 구조만 검증)
   */
  async function simulateProcess({ buffer, assetId, documentId, requestId }) {
    return new Promise((resolve) => {
      let percent = 0;
      const interval = setInterval(() => {
        percent += 20;
        onProgress?.({ percent: Math.min(percent, 90), requestId });
        if (percent >= 80) {
          clearInterval(interval);

          // 메타데이터만 추출 (실제 디코딩은 simulated)
          const result = {
            requestId,
            assetId: assetId ?? null,
            documentId: documentId ?? null,
            format: "las",
            pointCount: 0, // simulated — 실제 라이브러리 필요
            bbox: null,
            processedAt: new Date().toISOString(),
            simulated: true,
            note: "실제 LAS 디코딩은 디코더 라이브러리 연동 필요"
          };

          onComplete?.(result);
          resolve(result);
        }
      }, 50);
    });
  }

  /**
   * 진행 중인 요청을 취소합니다.
   */
  function cancel() {
    if (worker && activeRequestId) {
      worker.postMessage({ type: "las:cancel", requestId: activeRequestId });
    }
    activeRequestId = null;
  }

  return { processLas, cancel };
}

/**
 * LAS 워커 메시지 포맷을 검증합니다.
 *
 * @param {Object} message - 워커 메시지
 * @returns {Object} 검증 결과 { valid, errors }
 */
export function validateWorkerMessage(message) {
  const errors = [];
  if (!message) {
    errors.push("메시지가 null입니다");
    return { valid: false, errors };
  }
  if (!message.type) {
    errors.push("메시지 유형(type)이 없습니다");
  }
  if (!message.requestId) {
    errors.push("요청 ID(requestId)가 없습니다");
  }
  return { valid: errors.length === 0, errors };
}