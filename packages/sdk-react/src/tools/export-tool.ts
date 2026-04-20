/**
 * 내보내기 도구 - CAD 캔버스용 PNG/PDF 내보내기 유틸리티
 * @module tools/export-tool
 */

// ============================================================================
// 타입
// ===========================================================================

export type ExportFormat = "png" | "pdf";

export type PngQuality = 0.8 | 0.95 | 1.0;

export type PdfPageSize = "a4" | "letter" | "legal";

export interface ExportOptions {
  format: ExportFormat;
  /** PNG 품질 (0.8 = 압축, 1.0 = 무손실) */
  quality?: PngQuality;
  /** PDF 페이지 크기 */
  pageSize?: PdfPageSize;
  /** 선택 영역만 내보내기 vs 전체 캔버스 */
  selectionOnly?: boolean;
  /** 확장자 없는 파일명 */
  filename?: string;
}

export interface ExportResult {
  success: boolean;
  blob?: Blob;
  dataUrl?: string;
  filename?: string;
  error?: string;
}

// ============================================================================
// 유틸리티: downloadFile
// ===========================================================================

/**
 * 데이터 URL 또는 Blob에서 브라우저 다운로드를 트리거합니다.
 */
export function downloadFile(
  dataUrlOrBlob: string | Blob,
  filename: string,
): void {
  const url =
    typeof dataUrlOrBlob === "string"
      ? dataUrlOrBlob
      : URL.createObjectURL(dataUrlOrBlob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // blob URL만 해제합니다 (데이터 URL은 인라인이고 작음)
  if (typeof dataUrlOrBlob !== "string") {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

// ============================================================================
// PNG 내보내기
// ===========================================================================

/**
 * 캔버스를 PNG로 내보내고 다운로드를 트리거합니다.
 */
export async function exportPng(
  canvas: HTMLCanvasElement,
  options: {
    quality?: PngQuality;
    filename?: string;
  } = {},
): Promise<ExportResult> {
  try {
    const quality = options.quality ?? 1.0;
    const filename = options.filename ?? "cad-export.png";

    // 최고 해상도 내보내기 강제
    const dataUrl = canvas.toDataURL("image/png", quality);

    downloadFile(dataUrl, filename);

    return { success: true, dataUrl, filename };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { success: false, error };
  }
}

/**
 * 캔버스를 Blob으로 내보냅니다 (PDF 생성에 유용)
 */
export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality?: PngQuality,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob),
      "image/png",
      quality,
    );
  });
}

// ============================================================================
// PDF 내보내기 (jsPDF)
// ===========================================================================

/**
 * jsPDF를 사용하여 캔버스를 PDF로 내보냅니다
 * jspdf 패키지 필요: npm install jspdf
 */
export async function exportPdf(
  canvas: HTMLCanvasElement,
  options: {
    pageSize?: PdfPageSize;
    filename?: string;
  } = {},
): Promise<ExportResult> {
  try {
    // 사용하지 않을 경우 번들 크기 증가를 방지하기 위해 jsPDF를 동적으로 임포트
    let jsPDF: any;
    try {
      // @ts-ignore - jspdf는 선택적 의존성으로 타입 선언이 없을 수 있음
      const module = await import("jspdf");
      jsPDF = module.jsPDF;
    } catch (importError) {
      return { success: false, error: "jspdf 패키지가 설치되지 않았습니다. npm install jspdf를 실행하세요." };
    }

    const pageSize = options.pageSize ?? "a4";
    const filename = options.filename ?? "cad-export.pdf";

    // 페이지 크기 (mm 단위)
    const pageSizes: Record<PdfPageSize, { width: number; height: number }> = {
      a4: { width: 210, height: 297 },
      letter: { width: 215.9, height: 279.4 },
      legal: { width: 215.9, height: 355.6 },
    };

    const page = pageSizes[pageSize];
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // 캔버스를 페이지에 맞추기 위한 스케일 계산 (여백 포함)
    const margin = 10; // mm
    const availableWidth = page.width - margin * 2;
    const availableHeight = page.height - margin * 2;

    const scaleX = availableWidth / (canvasWidth / 96); // 96 DPI 가정
    const scaleY = availableHeight / (canvasHeight / 96);
    const scale = Math.min(scaleX, scaleY, 1); // 최대 1배 제한

    const imgWidth = (canvasWidth / 96) * scale;
    const imgHeight = (canvasHeight / 96) * scale;

    // 페이지 중앙 정렬
    const offsetX = margin + (availableWidth - imgWidth) / 2;
    const offsetY = margin + (availableHeight - imgHeight) / 2;

    // PDF 생성
    const pdf = new jsPDF({
      orientation: imgWidth > imgHeight ? "landscape" : "portrait",
      unit: "mm",
      format: pageSize === "legal" ? "letter" : pageSize, // jsPDF는 a4, letter 지원
    });

    const dataUrl = canvas.toDataURL("image/png", 0.95);
    pdf.addImage(dataUrl, "PNG", offsetX, offsetY, imgWidth, imgHeight);
    pdf.save(filename);

    return { success: true, filename };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { success: false, error };
  }
}

// ============================================================================
// 인쇄
// ===========================================================================

/**
 * 캔버스 내용으로 브라우저 인쇄 대화상을 엽니다.
 */
export function printCanvas(canvas: HTMLCanvasElement): void {
  const dataUrl = canvas.toDataURL("image/png");

  // 인쇄 친화적인 창 생성
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>CAD 인쇄</title>
        <style>
          @page { margin: 10mm; }
          body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
          img { max-width: 100%; max-height: 100vh; }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" />
        <script>window.onload = () => { window.print(); window.close(); }</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

// ============================================================================
// 메인 내보내기 함수
// ===========================================================================

/**
 * 통합 내보내기 함수
 */
export async function exportCanvas(
  canvas: HTMLCanvasElement,
  options: ExportOptions,
): Promise<ExportResult> {
  const filename = options.filename ?? `cad-export.${options.format}`;

  switch (options.format) {
    case "png":
      return exportPng(canvas, { quality: options.quality, filename });
    case "pdf":
      return exportPdf(canvas, { pageSize: options.pageSize, filename });
    default:
      return { success: false, error: `지원되지 않는 형식: ${options.format}` };
  }
}