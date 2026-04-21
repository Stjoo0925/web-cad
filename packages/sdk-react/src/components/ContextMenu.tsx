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
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy,
  Cut,
  Clipboard,
  X,
  Info,
  Move,
  RefreshCw,
  Scale,
  CancelCircleIcon,
  Maximize,
  Maximize2,
  Magnet,
  Grid,
  Square,
} from "@hugeicons/core-free-icons";

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
    icon: <HugeiconsIcon icon={Clipboard} size={14} />,
  },
  { id: "divider1", label: "", divider: true },
  {
    id: "zoom-extents",
    label: "Zoom Extents",
    shortcut: "Ctrl+E",
    icon: <HugeiconsIcon icon={Maximize} size={14} />,
  },
  {
    id: "zoom-fit",
    label: "Zoom Fit",
    icon: <HugeiconsIcon icon={Maximize2} size={14} />,
  },
  { id: "divider2", label: "", divider: true },
  {
    id: "toggle-snap",
    label: "Snap Mode",
    icon: <HugeiconsIcon icon={Magnet} size={14} />,
  },
  {
    id: "toggle-grid",
    label: "Grid Display",
    icon: <HugeiconsIcon icon={Grid} size={14} />,
  },
  {
    id: "toggle-ortho",
    label: "Ortho Mode",
    icon: <HugeiconsIcon icon={Square} size={14} />,
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
    icon: <HugeiconsIcon icon={Info} size={14} />,
  },
  { id: "divider1", label: "", divider: true },
  {
    id: "copy",
    label: "Copy",
    shortcut: "Ctrl+C",
    icon: <HugeiconsIcon icon={Copy} size={14} />,
  },
  {
    id: "cut",
    label: "Cut",
    shortcut: "Ctrl+X",
    icon: <HugeiconsIcon icon={Cut} size={14} />,
  },
  {
    id: "paste",
    label: "Paste",
    shortcut: "Ctrl+V",
    icon: <HugeiconsIcon icon={Clipboard} size={14} />,
  },
  { id: "divider2", label: "", divider: true },
  {
    id: "delete",
    label: "Delete",
    shortcut: "Del",
    icon: <HugeiconsIcon icon={X} size={14} />,
  },
  { id: "divider3", label: "", divider: true },
  {
    id: "move",
    label: "Move",
    shortcut: "M",
    icon: <HugeiconsIcon icon={Move} size={14} />,
  },
  {
    id: "rotate",
    label: "Rotate",
    shortcut: "RO",
    icon: <HugeiconsIcon icon={RefreshCw} size={14} />,
  },
  {
    id: "scale",
    label: "Scale",
    shortcut: "SC",
    icon: <HugeiconsIcon icon={Scale} size={14} />,
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
    icon: <HugeiconsIcon icon={Copy} size={14} />,
  },
  {
    id: "grip-stretch",
    label: "Stretch",
    icon: <HugeiconsIcon icon={Scale} size={14} />,
  },
  { id: "divider1", label: "", divider: true },
  {
    id: "grip-cancel",
    label: "Cancel",
    shortcut: "Esc",
    icon: <HugeiconsIcon icon={CancelCircleIcon} size={14} />,
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

export default ContextMenu;
