/**
 * ContextMenu.tsx
 * Context Menu - 우클릭 메뉴 시스템
 *
 * 기능:
 * - 엔티티 위 우클릭: 객체성질, 삭제, 복사, 붙여넣기, 클립보드
 * - 빈 공간 우클릭: 새엔티티, 붙여넣기, zoom 설정
 * - Grip 드래그 중 우클릭: 취소, 복사옵션
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

export interface ContextMenuItem {
  id: string;
  label: string;
  shortcut?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  divider?: boolean;
  submenu?: ContextMenuItem[];
}

export interface ContextMenuProps {
  /** 메뉴 표시 여부 */
  visible: boolean;
  /** 메뉴 위치 (화면 좌표) */
  position: { x: number; y: number };
  /** 메뉴 타입 */
  menuType: "canvas" | "entity" | "grip" | "empty";
  /** 선택된 엔티티 정보 */
  selectedEntity?: {
    id: string;
    type: string;
    layer?: string;
  } | null;
  /** Grip 드래그 상태 */
  isGripDragging?: boolean;
  /** 메뉴 항목 클릭 콜백 */
  onItemClick?: (itemId: string) => void;
  /** 메뉴 닫기 콜백 */
  onClose?: () => void;
}

const MENU_STYLE: React.CSSProperties = {
  position: "fixed",
  background: "#2d2d2d",
  border: "1px solid #4d4d4d",
  borderRadius: "4px",
  padding: "4px 0",
  minWidth: "180px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
  zIndex: 10000,
};

const MENU_ITEM_STYLE: React.CSSProperties = {
  padding: "6px 12px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: "12px",
  color: "#d4d4d4",
  gap: "16px",
};

const MENU_ITEM_HOVER: React.CSSProperties = {
  ...MENU_ITEM_STYLE,
  background: "#0e639c",
};

const MENU_ITEM_DISABLED: React.CSSProperties = {
  ...MENU_ITEM_STYLE,
  color: "#666666",
  cursor: "default",
};

const MENU_DIVIDER_STYLE: React.CSSProperties = {
  height: 1,
  background: "#4d4d4d",
  margin: "4px 0",
};

const MENU_SHORTCUT_STYLE: React.CSSProperties = {
  fontSize: "11px",
  color: "#888888",
  marginLeft: "auto",
};

const MENU_ICON_STYLE: React.CSSProperties = {
  marginRight: "8px",
  display: "flex",
  alignItems: "center",
};

const MENU_LABEL_STYLE: React.CSSProperties = {
  flex: 1,
};

/**
 * 기본 Canvas 메뉴 항목
 */
const CANVAS_MENU_ITEMS: ContextMenuItem[] = [
  {
    id: "paste",
    label: "Paste",
    shortcut: "Ctrl+V",
    icon: <PasteIcon />,
  },
  { id: "divider1", label: "", divider: true },
  {
    id: "zoom-extents",
    label: "Zoom Extents",
    shortcut: "Ctrl+E",
    icon: <ZoomExtentsIcon />,
  },
  {
    id: "zoom-fit",
    label: "Zoom Fit",
    icon: <ZoomFitIcon />,
  },
  { id: "divider2", label: "", divider: true },
  {
    id: "toggle-snap",
    label: "Snap Mode",
    icon: <SnapIcon />,
  },
  {
    id: "toggle-grid",
    label: "Grid Display",
    icon: <GridIcon />,
  },
  {
    id: "toggle-ortho",
    label: "Ortho Mode",
    icon: <OrthoIcon />,
  },
];

/**
 * 엔티티 선택 시 메뉴 항목
 */
const ENTITY_MENU_ITEMS: ContextMenuItem[] = [
  {
    id: "properties",
    label: "Properties",
    shortcut: "Ctrl+I",
    icon: <PropertiesIcon />,
  },
  { id: "divider1", label: "", divider: true },
  {
    id: "copy",
    label: "Copy",
    shortcut: "Ctrl+C",
    icon: <CopyIcon />,
  },
  {
    id: "cut",
    label: "Cut",
    shortcut: "Ctrl+X",
    icon: <CutIcon />,
  },
  {
    id: "paste",
    label: "Paste",
    shortcut: "Ctrl+V",
    icon: <PasteIcon />,
  },
  { id: "divider2", label: "", divider: true },
  {
    id: "delete",
    label: "Delete",
    shortcut: "Del",
    icon: <DeleteIcon />,
  },
  { id: "divider3", label: "", divider: true },
  {
    id: "move",
    label: "Move",
    shortcut: "M",
    icon: <MoveIcon />,
  },
  {
    id: "rotate",
    label: "Rotate",
    shortcut: "RO",
    icon: <RotateIcon />,
  },
  {
    id: "scale",
    label: "Scale",
    shortcut: "SC",
    icon: <ScaleIcon />,
  },
];

/**
 * Grip 드래그 중 메뉴 항목
 */
const GRIP_MENU_ITEMS: ContextMenuItem[] = [
  {
    id: "grip-copy",
    label: "Copy",
    shortcut: "Shift+Drag",
    icon: <CopyIcon />,
  },
  {
    id: "grip-stretch",
    label: "Stretch",
    icon: <StretchIcon />,
  },
  { id: "divider1", label: "", divider: true },
  {
    id: "grip-cancel",
    label: "Cancel",
    shortcut: "Esc",
    icon: <CancelIcon />,
  },
];

/**
 * ContextMenu 컴포넌트
 */
export function ContextMenu({
  visible,
  position,
  menuType,
  selectedEntity,
  isGripDragging,
  onItemClick,
  onClose,
}: ContextMenuProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Determine which menu items to show
  const menuItems = isGripDragging
    ? GRIP_MENU_ITEMS
    : menuType === "entity"
      ? ENTITY_MENU_ITEMS
      : CANVAS_MENU_ITEMS;

  // Close on click outside
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose?.();
      }
    };

    // Delay to prevent immediate close on right-click
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [visible, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [visible, onClose]);

  const handleItemClick = useCallback(
    (item: ContextMenuItem) => {
      if (item.disabled || item.divider) return;
      onItemClick?.(item.id);
      onClose?.();
    },
    [onItemClick, onClose],
  );

  if (!visible) return null;

  // Adjust position to keep menu in viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 200),
    y: Math.min(position.y, window.innerHeight - 300),
  };

  return (
    <div
      ref={menuRef}
      style={{
        ...MENU_STYLE,
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      {/* Entity type header */}
      {menuType === "entity" && selectedEntity && (
        <div
          style={{
            padding: "4px 12px",
            fontSize: "10px",
            color: "#888888",
            borderBottom: "1px solid #4d4d4d",
            marginBottom: "4px",
          }}
        >
          {selectedEntity.type}{" "}
          {selectedEntity.layer ? `(${selectedEntity.layer})` : ""}
        </div>
      )}

      {menuItems.map((item) => {
        if (item.divider) {
          return <div key={item.id} style={MENU_DIVIDER_STYLE} />;
        }

        const isHovered = hoveredItem === item.id;
        const isDisabled = item.disabled;

        return (
          <div
            key={item.id}
            style={
              isDisabled
                ? MENU_ITEM_DISABLED
                : isHovered
                  ? MENU_ITEM_HOVER
                  : MENU_ITEM_STYLE
            }
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => handleItemClick(item)}
          >
            {item.icon && <span style={MENU_ICON_STYLE}>{item.icon}</span>}
            <span style={MENU_LABEL_STYLE}>{item.label}</span>
            {item.shortcut && (
              <span style={MENU_SHORTCUT_STYLE}>{item.shortcut}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Icon components (simple SVG icons)
function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <rect
        x="4"
        y="4"
        width="8"
        height="8"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M2 10V2H10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path
        d="M3 1L11 7L3 13"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="1"
        y1="5"
        x2="3"
        y2="7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PasteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <rect
        x="2"
        y="2"
        width="10"
        height="10"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5 2V4H9V2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path
        d="M3 3L11 11M3 11L11 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PropertiesIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <circle
        cx="7"
        cy="7"
        r="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="7" cy="7" r="2" fill="currentColor" />
    </svg>
  );
}

function MoveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path
        d="M7 1V13M1 7H13M4 4L7 1L10 4M4 10L7 13L10 10M4 4L4 10M10 4L10 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RotateIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path
        d="M11 7C11 9.76142 8.76142 12 6 12C3.23858 12 1 9.76142 1 7C1 4.23858 3.23858 2 6 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 2L11 4L13 2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ScaleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <rect
        x="1"
        y="1"
        width="4"
        height="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="9"
        y="9"
        width="4"
        height="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5 3H9M3 5V9M9 5V9M5 11H9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StretchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path
        d="M2 7H12M7 2V12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4 4L2 7L4 10M10 4L12 7L10 10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CancelIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <circle
        cx="7"
        cy="7"
        r="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5 5L9 9M9 5L5 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ZoomExtentsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <rect
        x="2"
        y="2"
        width="10"
        height="10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M5 2V4M9 2V4M5 10V12M9 10V12M2 5H4M2 9H4M10 5H12M10 9H12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ZoomFitIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path
        d="M1 5V1H5M9 1H13V5M13 9V13H9M5 13H1V9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SnapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <circle
        cx="7"
        cy="7"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M7 1V4M7 10V13M1 7H4M10 7H13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path
        d="M1 5H13M1 9H13M5 1V13M9 1V13"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

function OrthoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path
        d="M1 7H13M7 1V13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default ContextMenu;
