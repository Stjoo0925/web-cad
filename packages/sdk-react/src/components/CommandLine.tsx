import React, { useState, useCallback, useRef, useEffect } from "react";

interface CommandLineProps {
  onCommand?: (command: string) => void;
  onEscape?: () => void;
  history?: string[];
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
  maxHeight: "150px",
  overflowY: "auto",
  zIndex: 1000,
};

const DROPDOWN_ITEM_STYLE: React.CSSProperties = {
  padding: "4px 12px",
  color: "#b0b0b0",
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
};

const DROPDOWN_ITEM_HOVER: React.CSSProperties = {
  ...DROPDOWN_ITEM_STYLE,
  background: "#0e639c",
  color: "#ffffff",
};

const COMMANDS = [
  "LINE",
  "POLYLINE",
  "CIRCLE",
  "ARC",
  "POINT",
  "TEXT",
  "MOVE",
  "ROTATE",
  "SCALE",
  "COPY",
  "ERASE",
  "LAYER",
  "COLOR",
  "GRID",
  "SNAP",
  "ORTHO",
  "ZOOM",
  "PAN",
  "RESET",
  "CLEAR",
];

export function CommandLine({ onCommand, onEscape, history = [] }: CommandLineProps) {
  const [value, setValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value.length > 0) {
      const filtered = COMMANDS.filter((cmd) =>
        cmd.toLowerCase().startsWith(value.toUpperCase())
      );
      setFilteredCommands(filtered);
      setShowDropdown(filtered.length > 0);
      setSelectedIndex(0);
    } else {
      setShowDropdown(false);
    }
  }, [value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        if (value.trim()) {
          onCommand?.(value.trim().toUpperCase());
        }
        setValue("");
        setShowDropdown(false);
      } else if (e.key === "Escape") {
        setValue("");
        setShowDropdown(false);
        onEscape?.();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Tab" && filteredCommands.length > 0) {
        e.preventDefault();
        setValue(filteredCommands[selectedIndex]);
        setShowDropdown(false);
      }
    },
    [value, filteredCommands, selectedIndex, onCommand, onEscape]
  );

  const handleDropdownClick = useCallback(
    (cmd: string) => {
      setValue(cmd);
      setShowDropdown(false);
      inputRef.current?.focus();
    },
    []
  );

  return (
    <div style={{ position: "relative" }}>
      {showDropdown && (
        <div style={DROPDOWN_STYLE}>
          {filteredCommands.map((cmd, index) => (
            <div
              key={cmd}
              style={index === selectedIndex ? DROPDOWN_ITEM_HOVER : DROPDOWN_ITEM_STYLE}
              onClick={() => handleDropdownClick(cmd)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span>{cmd}</span>
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
        />
      </div>
    </div>
  );
}
