/**
 * las-worker-entry.ts
 * LAS/LAZ 포인트클라우드 워커 엔트리 포인트
 *
 * Web Worker 환경에서 실행되어 메인 스레드에서 받은 LAS/LAZ 버퍼를 처리합니다.
 * 실제 디코딩 로직은 여기에 구현됩니다 (디코더 라이브러리 연동).
 */

// 워커 메시지 유형 (las-worker-client.ts와 동일)
const MESSAGE_TYPES = {
  PROCESS: "las:process",
  PROGRESS: "las:progress",
  COMPLETE: "las:complete",
  ERROR: "las:error",
  CANCEL: "las:cancel"
} as const;

interface WorkerMessageData {
  buffer: ArrayBuffer;
  assetId?: string;
  documentId?: string;
}

interface WorkerMessage {
  type: string;
  requestId: string;
  data: WorkerMessageData;
}

/**
 * 포인트 수 추정 (파일 크기 기준)
 * 실제 디코딩 시 정확한 수를 얻습니다.
 *
 * @param bufferSize - 파일 크기 (바이트)
 * @returns 추정 포인트 수
 */
function estimatePointCount(bufferSize: number): number {
  // LAS 헤더 기준 약 375바이트/헤더 + 32바이트/포인트
  return Math.floor((bufferSize - 375) / 32);
}

/**
 * 메시지 핸들러
 */
self.onmessage = function (event: MessageEvent) {
  const { type, requestId, data } = event.data as WorkerMessage;

  if (type === MESSAGE_TYPES.CANCEL) {
    // 취소 요청 처리
    return;
  }

  if (type !== MESSAGE_TYPES.PROCESS) return;

  const { buffer, assetId, documentId } = data;

  try {
    // 진행률 보고 (시작)
    self.postMessage({
      type: MESSAGE_TYPES.PROGRESS,
      requestId,
      percent: 10
    });

    // TODO: 실제 LAS 디코더 라이브러리 연동
    // 현재는 구조만 검증하는 simulated 처리
    const pointCount = estimatePointCount(buffer.byteLength);

    self.postMessage({
      type: MESSAGE_TYPES.PROGRESS,
      requestId,
      percent: 70
    });

    // 결과 반환 (simulated)
    const result = {
      requestId,
      assetId: assetId ?? null,
      documentId: documentId ?? null,
      format: "las",
      pointCount,
      bbox: null, // TODO: 디코더 연동 시 계산
      processedAt: new Date().toISOString(),
      simulated: true
    };

    self.postMessage({
      type: MESSAGE_TYPES.COMPLETE,
      requestId,
      data: result,
      percent: 100
    });
  } catch (error) {
    self.postMessage({
      type: MESSAGE_TYPES.ERROR,
      requestId,
      error: (error as Error).message ?? "알 수 없는 오류"
    });
  }
};