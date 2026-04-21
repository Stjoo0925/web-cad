import React, { useState, useCallback, useRef, useEffect } from "react";
import { getCommandRegistry } from "../commands/command-registry.js";
import type { CommandDefinition } from "../commands/command-registry.js";

export interface CommandHistoryItem {
  command: string;
  timestamp: Date;
  success: boolean;
}

interface CommandLineProps {
  onCommand?: (command: string, args: string[]) => void;
  onEscape?: () => void;
  history?: string[];
  commands?: CommandDefinition[];
  maxHistorySize?: number;
}

/**
 * Command aliases (AutoCAD-style)
 * Kept for backward compatibility with resolveCommandAlias function
 */
const COMMAND_ALIASES: Record<string, string> = {
  L: "LINE",
  C: "CIRCLE",
  A: "ARC",
  PL: "POLYLINE",
  EL: "ELLIPSE",
  REC: "RECTANGLE",
  H: "HATCH",
  DIM: "DIMENSION",
  T: "TEXT",
  MT: "MTEXT",
  B: "BLOCK",
  I: "INSERT",
  M: "MOVE",
  CO: "COPY",
  CP: "COPY",
  RO: "ROTATE",
  SC: "SCALE",
  MI: "MIRROR",
  O: "OFFSET",
  TR: "TRIM",
  EX: "EXTEND",
  F: "FILLET",
  CHA: "CHAMFER",
  ST: "STRETCH",
  BR: "BREAK",
  J: "JOIN",
  AR: "ARRAY",
  LA: "LAYER",
  COL: "COLOR",
  LT: "LINETYPE",
  LW: "LINEWEIGHT",
  UN: "UNITS",
  SN: "SNAP",
  GR: "GRID",
  OR: "ORTHO",
  OS: "OSNAP",
  P: "PAN",
  Z: "ZOOM",
  RG: "REGEN",
  U: "UNDO",
  S: "SAVE",
  QSAVE: "SAVE",
  OP: "OPEN",
  N: "NEW",
  LI: "LIST",
  LS: "LIST",
  DI: "DIST",
  "?": "HELP",
};

/**
 * Resolve alias to command name (backward compatibility)
 */
export function resolveCommandAlias(cmd: string): string {
  return COMMAND_ALIASES[cmd.toUpperCase()] ?? cmd.toUpperCase();
}

const COMMANDLINE_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  height: "28px",
  background: "#2d2d2d",
  borderTop: "1px solid #4d4d4d",
  fontFamily: "Consolas, 'Courier New', monospace",
  fontSize: "12px",
  flexShrink: 0,
};

const PROMPT_STYLE: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "0 8px",
  color: "#22c55e",
  fontWeight: "bold",
  userSelect: "none",
  borderRight: "1px solid #4d4d4d",
  height: "100%",
};

const INPUT_STYLE: React.CSSProperties = {
  flex: 1,
  background: "transparent",
  border: "none",
  outline: "none",
  color: "#e0e0e0",
  padding: "0 8px",
  fontFamily: "inherit",
  fontSize: "inherit",
  height: "100%",
};

const DROPDOWN_STYLE: React.CSSProperties = {
  position: "absolute",
  bottom: "100%",
  left: 0,
  right: 0,
  background: "#3d3d3d",
  border: "1px solid #4d4d4d",
  borderBottom: "none",
  maxHeight: "200px",
  overflowY: "auto",
  zIndex: 1000,
};

const DROPDOWN_ITEM_STYLE: React.CSSProperties = {
  padding: "4px 12px",
  color: "#b0b0b0",
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
};

const DROPDOWN_ITEM_HOVER: React.CSSProperties = {
  ...DROPDOWN_ITEM_STYLE,
  background: "#0e639c",
  color: "#ffffff",
};

export function CommandLine({
  onCommand,
  onEscape,
  history = [],
  commands,
  maxHistorySize = 100,
}: CommandLineProps) {
  const [value, setValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState<CommandDefinition[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use registry commands if none provided
  const registryCommands = commands ?? getCommandRegistry().getAll();

  useEffect(() => {
    if (value.length > 0) {
      const upper = value.toUpperCase();
      const filtered = registryCommands.filter(
        (cmd) =>
          cmd.name.includes(upper) ||
          (cmd.aliases && cmd.aliases.some((a) => a.includes(upper))),
      );
      setFilteredCommands(filtered.slice(0, 8));
      setShowDropdown(filtered.length > 0);
      setSelectedIndex(0);
    } else {
      setShowDropdown(false);
    }
  }, [value, registryCommands]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        if (value.trim()) {
          const parts = value.trim().split(/\s+/);
          const command = resolveCommandAlias(parts[0]);
          const args = parts.slice(1);
          onCommand?.(command, args);
          setValue("");
          setShowDropdown(false);
          setHistoryIndex(-1);
        }
      } else if (e.key === "Escape") {
        setValue("");
        setShowDropdown(false);
        setHistoryIndex(-1);
        onEscape?.();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (showDropdown && filteredCommands.length > 0) {
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : prev
          );
        } else if (historyIndex < history.length - 1) {
          setHistoryIndex((h) => h + 1);
          setValue(history[history.length - 1 - historyIndex - 1] || "");
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (showDropdown && filteredCommands.length > 0) {
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        } else if (historyIndex < history.length - 1) {
          setHistoryIndex((h) => h + 1);
          setValue(history[history.length - 1 - historyIndex - 1] || "");
        }
      } else if (e.key === "Tab" && filteredCommands.length > 0) {
        e.preventDefault();
        setValue(filteredCommands[selectedIndex].name);
        setShowDropdown(false);
      }
    },
    [value, filteredCommands, selectedIndex, onCommand, onEscape, showDropdown, history, historyIndex],
  );

  const handleDropdownClick = useCallback(
    (cmd: CommandDefinition) => {
      setValue(cmd.name);
      setShowDropdown(false);
      inputRef.current?.focus();
    },
    [],
  );

  return (
    <div style={{ position: "relative" }}>
      {showDropdown && (
        <div style={DROPDOWN_STYLE}>
          {filteredCommands.map((cmd, index) => (
            <div
              key={cmd.name}
              style={index === selectedIndex ? DROPDOWN_ITEM_HOVER : DROPDOWN_ITEM_STYLE}
              onClick={() => handleDropdownClick(cmd)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span style={{ color: "#ff8c00", fontWeight: "bold" }}>{cmd.name}</span>
              {cmd.aliases && cmd.aliases.length > 0 && (
                <span style={{ color: "#888", minWidth: "60px" }}>
                  ({cmd.aliases.join(", ")})
                </span>
              )}
              <span style={{ color: "#aaa", flex: 1 }}>{cmd.description}</span>
            </div>
          ))}
        </div>
      )}
      <div style={COMMANDLINE_STYLE}>
        <div style={PROMPT_STYLE}>Command:</div>
        <input
          ref={inputRef}
          style={INPUT_STYLE}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command or tool name..."
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
}
