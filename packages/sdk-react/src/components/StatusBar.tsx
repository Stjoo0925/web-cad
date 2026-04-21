import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Magnet, Square, Grid } from "@hugeicons/core-free-icons";

interface StatusBarProps {
  coordinates: { x: number; y: number };
  zoom: number;
  snapMode: boolean;
  orthoMode: boolean;
  gridVisible: boolean;
  cursorSnap?: string;
}

export function StatusBar({
  coordinates,
  zoom,
  snapMode,
  orthoMode,
  gridVisible,
  cursorSnap,
}: StatusBarProps) {
  return (
    <div className="flex items-center justify-between h-6 px-2 bg-[var(--color-cad-bg-secondary)] border-t border-[var(--color-cad-border)] text-[11px] text-[var(--color-cad-text-dim)] flex-shrink-0">
      <div className="flex items-center gap-3">
        <span>
          X: {coordinates.x.toFixed(4)} Y: {coordinates.y.toFixed(4)}
        </span>
        {cursorSnap && (
          <span className="text-green-500">SNAP: {cursorSnap}</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] ${snapMode
          ? "bg-[var(--color-cad-accent)] border-[var(--color-cad-accent-hover)] text-white"
          : "bg-[var(--color-cad-bg-tertiary)] border-[var(--color-cad-border)] text-[var(--color-cad-text-dim)]"
          }`}>
          <HugeiconsIcon icon={Magnet} size={12} />
          SNAP
        </span>
        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] ${orthoMode
          ? "bg-[var(--color-cad-accent)] border-[var(--color-cad-accent-hover)] text-white"
          : "bg-[var(--color-cad-bg-tertiary)] border-[var(--color-cad-border)] text-[var(--color-cad-text-dim)]"
          }`}>
          <HugeiconsIcon icon={Square} size={12} />
          ORTHO
        </span>
        <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] ${gridVisible
          ? "bg-[var(--color-cad-accent)] border-[var(--color-cad-accent-hover)] text-white"
          : "bg-[var(--color-cad-bg-tertiary)] border-[var(--color-cad-border)] text-[var(--color-cad-text-dim)]"
          }`}>
          <HugeiconsIcon icon={Grid} size={12} />
          GRID
        </span>
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--color-cad-bg-tertiary)] border border-[var(--color-cad-border)] text-[10px] text-[var(--color-cad-text-dim)]">
          Zoom: {(zoom * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
