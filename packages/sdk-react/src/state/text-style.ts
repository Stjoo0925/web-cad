/**
 * text-style.ts
 * Text Style 시스템
 *
 * 텍스트 스타일 정의 및 관리
 * - 폰트 선택
 * - 높이, 폭비율, 기울기
 * - 거꾸러, 아래쪽 효과
 */

export type TextFont =
  | "standard"
  | "romans"
  | "romand"
  | "romanc"
  | "romant"
  | "italic"
  | "gothic"
  | "gothicg"
  | "gothicb"
  | "cyrillic"
  | "acedtec";

export interface TextStyle {
  id: string;
  name: string;
  font: TextFont;
  height: number;
  widthFactor: number;
  obliqueAngle: number;
  isBackward: boolean;
  isUpsideDown: boolean;
  isVertical: boolean;
}

export interface TextStyleOptions {
  name?: string;
  font?: TextFont;
  height?: number;
  widthFactor?: number;
  obliqueAngle?: number;
  isBackward?: boolean;
  isUpsideDown?: boolean;
  isVertical?: boolean;
}

/**
 * 기본 텍스트 스타일
 */
export const DEFAULT_TEXT_STYLES: TextStyle[] = [
  {
    id: "standard",
    name: "Standard",
    font: "standard",
    height: 0,
    widthFactor: 0.7,
    obliqueAngle: 0,
    isBackward: false,
    isUpsideDown: false,
    isVertical: false,
  },
];

/**
 * 사용 가능한 폰트 목록
 */
export const AVAILABLE_FONTS: { id: TextFont; name: string }[] = [
  { id: "standard", name: "Standard" },
  { id: "romans", name: "Roman Simplex" },
  { id: "romand", name: "Roman Duplex" },
  { id: "romanc", name: "Roman Complex" },
  { id: "romant", name: "Roman Triplex" },
  { id: "italic", name: "Italic" },
  { id: "gothic", name: "Gothic" },
  { id: "gothicg", name: "Gothic (German)" },
  { id: "gothicb", name: "Gothic (Block)" },
  { id: "cyrillic", name: "Cyrillic" },
  { id: "acedtec", name: "ACEC Technical" },
];

/**
 * Text Style Manager
 */
export class TextStyleManager {
  private styles: Map<string, TextStyle> = new Map();
  private currentStyleId: string = "standard";

  constructor() {
    // Initialize with default styles
    for (const style of DEFAULT_TEXT_STYLES) {
      this.styles.set(style.id, style);
    }
  }

  /**
   * 새 텍스트 스타일 생성
   */
  createStyle(id: string, options: TextStyleOptions = {}): TextStyle {
    const style: TextStyle = {
      id,
      name: options.name ?? id,
      font: options.font ?? "standard",
      height: options.height ?? 0,
      widthFactor: options.widthFactor ?? 0.7,
      obliqueAngle: options.obliqueAngle ?? 0,
      isBackward: options.isBackward ?? false,
      isUpsideDown: options.isUpsideDown ?? false,
      isVertical: options.isVertical ?? false,
    };

    this.styles.set(id, style);
    return style;
  }

  /**
   * 스타일 조회
   */
  getStyle(id: string): TextStyle | undefined {
    return this.styles.get(id);
  }

  /**
   * 현재 스타일 조회
   */
  getCurrentStyle(): TextStyle {
    return this.styles.get(this.currentStyleId) ?? DEFAULT_TEXT_STYLES[0];
  }

  /**
   * 현재 스타일 설정
   */
  setCurrentStyle(id: string): boolean {
    if (this.styles.has(id)) {
      this.currentStyleId = id;
      return true;
    }
    return false;
  }

  /**
   * 스타일 목록 조회
   */
  getAllStyles(): TextStyle[] {
    return Array.from(this.styles.values());
  }

  /**
   * 스타일 삭제
   */
  deleteStyle(id: string): boolean {
    if (id === "standard") return false; // Cannot delete standard
    return this.styles.delete(id);
  }

  /**
   * 스타일 업데이트
   */
  updateStyle(id: string, updates: Partial<TextStyleOptions>): boolean {
    const style = this.styles.get(id);
    if (!style) return false;

    const updated: TextStyle = {
      ...style,
      ...updates,
      id: style.id, // Preserve original id
    };

    this.styles.set(id, updated);
    return true;
  }
}

// Singleton instance
let textStyleManager: TextStyleManager | null = null;

export function getTextStyleManager(): TextStyleManager {
  if (!textStyleManager) {
    textStyleManager = new TextStyleManager();
  }
  return textStyleManager;
}

/**
 * CSS font string 생성
 */
export function getCssFont(
  style: TextStyle,
  height: number,
): string {
  const fontSize = height;

  // Font family mapping
  const fontFamilies: Record<TextFont, string> = {
    standard: "Arial, sans-serif",
    romans: "Times New Roman, serif",
    romand: "Times New Roman, serif",
    romanc: "Times New Roman, serif",
    romant: "Times New Roman, serif",
    italic: "Times New Roman, serif",
    gothic: "Arial, sans-serif",
    gothicg: "Arial, sans-serif",
    gothicb: "Arial, sans-serif",
    cyrillic: "Times New Roman, serif",
    acedtec: "Courier New, monospace",
  };

  const fontFamily = fontFamilies[style.font] ?? "Arial, sans-serif";

  // Width factor affects the font stretch
  // Oblique angle affects the slant (in degrees, -85 to 85)

  let fontString = "";

  // Style (italic simulation via transform)
  if (style.obliqueAngle !== 0) {
    fontString += "italic ";
  }

  // Weight (not typically used in basic CAD fonts)
  fontString += `${fontSize}px `;

  // Font family
  fontString += fontFamily;

  return fontString;
}

/**
 * Canvas에 텍스트 렌더링 (TextStyle 적용)
 */
export function renderStyledText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  style: TextStyle,
  height: number,
): void {
  ctx.save();

  // Apply horizontal scaling (width factor)
  if (style.widthFactor !== 1.0) {
    ctx.scale(style.widthFactor, 1);
  }

  // Apply oblique/italic effect
  if (style.obliqueAngle !== 0) {
    const skew = Math.tan((style.obliqueAngle * Math.PI) / 180);
    ctx.transform(1, 0, skew, 1, 0, 0);
  }

  // Apply vertical flip (backward)
  if (style.isBackward) {
    ctx.scale(-1, 1);
  }

  // Apply 180 rotation (upside down)
  if (style.isUpsideDown) {
    ctx.scale(1, -1);
  }

  // Set font
  ctx.font = getCssFont(style, height);
  ctx.fillStyle = "#333333";
  ctx.textBaseline = "top";

  // Render text
  ctx.fillText(text, x, y);

  ctx.restore();
}

/**
 * 텍스트 경계 계산
 */
export function measureStyledText(
  ctx: CanvasRenderingContext2D,
  text: string,
  style: TextStyle,
  height: number,
): { width: number; height: number } {
  ctx.save();

  // Apply width factor
  ctx.scale(style.widthFactor, 1);

  ctx.font = getCssFont(style, height);
  const metrics = ctx.measureText(text);

  ctx.restore();

  return {
    width: metrics.width,
    height: height,
  };
}
