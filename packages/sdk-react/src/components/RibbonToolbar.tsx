import React, { useState, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cursor,
  Pen,
  Circle,
  Type,
  Move,
  Scale,
  Ruler,
  Magnet,
  Grid,
  Square,
  Sun,
  Moon,
  RefreshCw,
  Target,
} from "@hugeicons/core-free-icons";
import { useTheme } from "./ThemeProvider";

export type ToolType =
  | "select"
  | "line"
  | "polyline"
  | "circle"
  | "arc"
  | "text"
  | "point"
  | "move"
  | "rotate"
  | "scale"
  | "dimension";

export interface RibbonTab {
  id: string;
  label: string;
  panels: RibbonPanel[];
}

export interface RibbonPanel {
  id: string;
  title: string;
  tools: RibbonTool[];
}

export interface RibbonTool {
  id: ToolType;
  label: string;
  iconName: string;
  shortcut?: string;
}

interface RibbonToolbarProps {
  activeTab?: string;
  activeTool?: ToolType;
  onToolSelect?: (tool: ToolType) => void;
  onTabChange?: (tabId: string) => void;
  onToggleSnap?: () => void;
  onToggleGrid?: () => void;
  onToggleOrtho?: () => void;
  snapEnabled?: boolean;
  gridEnabled?: boolean;
  orthoEnabled?: boolean;
}

/**
 * 아이콘 매핑 테이블
 */
const ICON_MAP: Record<string, any> = {
  select: Cursor,
  line: Pen,
  polyline: Pen,
  circle: Circle,
  arc: Circle,
  text: Type,
  point: Target,
  move: Move,
  rotate: RefreshCw,
  scale: Scale,
  dimension: Ruler,
  snap: Magnet,
  grid: Grid,
  ortho: Square,
};

const HOME_TAB: RibbonTab = {
  id: "home",
  label: "Home",
  panels: [
    {
      id: "selection",
      title: "Selection",
      tools: [
        {
          id: "select",
          label: "Select",
          iconName: "select",
          shortcut: "ESC",
        },
      ],
    },
    {
      id: "draw",
      title: "Draw",
      tools: [
        { id: "line", label: "Line", iconName: "line", shortcut: "L" },
        {
          id: "polyline",
          label: "Polyline",
          iconName: "polyline",
          shortcut: "PL",
        },
        { id: "circle", label: "Circle", iconName: "circle", shortcut: "C" },
        { id: "arc", label: "Arc", iconName: "arc", shortcut: "A" },
        { id: "text", label: "Text", iconName: "text", shortcut: "DT" },
        { id: "point", label: "Point", iconName: "point", shortcut: "PO" },
      ],
    },
    {
      id: "modify",
      title: "Modify",
      tools: [
        { id: "move", label: "Move", iconName: "move", shortcut: "M" },
        { id: "rotate", label: "Rotate", iconName: "rotate", shortcut: "RO" },
        { id: "scale", label: "Scale", iconName: "scale", shortcut: "SC" },
      ],
    },
  ],
};

const ANNOTATE_TAB: RibbonTab = {
  id: "annotate",
  label: "Annotate",
  panels: [
    {
      id: "text",
      title: "Text",
      tools: [
        { id: "text", label: "Text", iconName: "text", shortcut: "DT" },
      ],
    },
    {
      id: "dimension",
      title: "Dimension",
      tools: [
        {
          id: "dimension",
          label: "Dimension",
          iconName: "dimension",
          shortcut: "D",
        },
      ],
    },
  ],
};

/**
 * 리본 툴바 컴포넌트
 * 현대적인 CAD 스타일의 툴바를 제공합니다.
 */
export function RibbonToolbar({
  activeTab = "home",
  activeTool = "select",
  onToolSelect,
  onTabChange,
  onToggleSnap,
  onToggleGrid,
  onToggleOrtho,
  snapEnabled = false,
  gridEnabled = true,
  orthoEnabled = false,
}: RibbonToolbarProps) {
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const tabs = [HOME_TAB, ANNOTATE_TAB];

  const currentTab = tabs.find((t) => t.id === activeTab) || HOME_TAB;

  const handleToolClick = useCallback(
    (toolId: ToolType) => {
      onToolSelect?.(toolId);
    },
    [onToolSelect],
  );

  return (
    <div className="flex flex-col bg-[var(--color-cad-bg-secondary)] border-b border-[var(--color-cad-border)] flex-shrink-0">
      {/* 탭 바 */}
      <div className="flex bg-[var(--color-cad-bg-secondary)] border-b border-[var(--color-cad-border)] px-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-4 py-2 text-xs font-medium cursor-pointer border-b-2 transition-all duration-200 select-none ${tab.id === activeTab
              ? "text-[var(--color-cad-text)] border-[var(--color-cad-accent)]"
              : "text-[var(--color-cad-text-dim)] border-transparent hover:text-[var(--color-cad-text)]"
              }`}
            onClick={() => onTabChange?.(tab.id)}
          >
            {tab.label}
          </button>
        ))}
        <div className="flex-1" />

        {/* 모드 버튼 그룹 */}
        <div className="flex items-center gap-1 px-2">
          <button
            className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-md border transition-all duration-200 ${snapEnabled
              ? "bg-[var(--color-cad-accent)] border-[var(--color-cad-accent-hover)] text-white"
              : "bg-[var(--color-cad-bg-tertiary)] border-[var(--color-cad-border)] text-[var(--color-cad-text-dim)] hover:bg-[var(--color-cad-button-hover)]"
              }`}
            onClick={onToggleSnap}
            title="Snap Mode"
          >
            <HugeiconsIcon icon={Magnet} size={16} />
            <span>SNAP</span>
          </button>
          <button
            className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-md border transition-all duration-200 ${gridEnabled
              ? "bg-[var(--color-cad-accent)] border-[var(--color-cad-accent-hover)] text-white"
              : "bg-[var(--color-cad-bg-tertiary)] border-[var(--color-cad-border)] text-[var(--color-cad-text-dim)] hover:bg-[var(--color-cad-button-hover)]"
              }`}
            onClick={onToggleGrid}
            title="Grid Display"
          >
            <HugeiconsIcon icon={Grid} size={16} />
            <span>GRID</span>
          </button>
          <button
            className={`flex items-center gap-2 px-3 py-1.5 text-xs rounded-md border transition-all duration-200 ${orthoEnabled
              ? "bg-[var(--color-cad-accent)] border-[var(--color-cad-accent-hover)] text-white"
              : "bg-[var(--color-cad-bg-tertiary)] border-[var(--color-cad-border)] text-[var(--color-cad-text-dim)] hover:bg-[var(--color-cad-button-hover)]"
              }`}
            onClick={onToggleOrtho}
            title="Orthogonal Mode"
          >
            <HugeiconsIcon icon={Square} size={16} />
            <span>ORTHO</span>
          </button>

          {/* 구분선 */}
          <div className="w-px bg-[var(--color-cad-border)] mx-1" />

          {/* 테마 토글 */}
          <button
            className="p-2 rounded-md bg-[var(--color-cad-bg-tertiary)] border border-[var(--color-cad-border)] text-[var(--color-cad-text-dim)] hover:bg-[var(--color-cad-button-hover)] transition-all duration-200"
            onClick={toggleTheme}
            title={theme === "dark" ? "라이트 테마" : "다크 테마"}
          >
            <HugeiconsIcon icon={theme === "dark" ? Sun : Moon} size={18} />
          </button>
        </div>
      </div>

      {/* 패널 컨테이너 */}
      <div className="flex flex-wrap gap-1 p-2 bg-[var(--color-cad-bg-tertiary)] border-b border-[var(--color-cad-border)]">
        {currentTab.panels.map((panel) => (
          <div
            key={panel.id}
            className="flex flex-col gap-1 p-2 bg-[var(--color-cad-bg-secondary)] rounded-lg min-w-[80px]"
          >
            <div className="text-[9px] uppercase tracking-wider text-[var(--color-cad-text-dim)] text-center mb-1">
              {panel.title}
            </div>
            <div className="flex flex-wrap gap-1 justify-center">
              {panel.tools.map((tool) => {
                const isActive = tool.id === activeTool;
                const isHovered = hoveredTool === tool.id;
                const IconComponent = ICON_MAP[tool.iconName];

                return (
                  <div
                    key={tool.id}
                    className="relative"
                    onMouseEnter={() => setHoveredTool(tool.id)}
                    onMouseLeave={() => setHoveredTool(null)}
                  >
                    <button
                      className={`w-8 h-8 flex items-center justify-center rounded-md border transition-all duration-200 ${isActive
                        ? "bg-[var(--color-cad-accent)] border-[var(--color-cad-accent-hover)] text-white shadow-sm"
                        : isHovered
                          ? "bg-[var(--color-cad-button-hover)] border-[var(--color-cad-border)] text-[var(--color-cad-text)]"
                          : "bg-transparent border-transparent text-[var(--color-cad-text-dim)] hover:text-[var(--color-cad-text)]"
                        }`}
                      onClick={() => handleToolClick(tool.id)}
                      aria-label={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ""}`}
                    >
                      {IconComponent && <HugeiconsIcon icon={IconComponent} size={18} />}
                    </button>
                    {isHovered && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[var(--color-cad-bg)] border border-[var(--color-cad-border)] rounded-md text-[10px] text-[var(--color-cad-text)] whitespace-nowrap shadow-lg z-50 pointer-events-none">
                        {tool.label}
                        {tool.shortcut && (
                          <span className="ml-2 text-[var(--color-cad-text-dim)]">
                            {tool.shortcut}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

