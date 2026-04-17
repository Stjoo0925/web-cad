<!-- Parent: ../../../../AGENTS.md -->
<!-- Generated: 2026-04-17 | Updated: 2026-04-17 -->

# packages/core/src/storage

## Purpose
Local filesystem storage layer for reading/writing text, JSON, and binary files with logical path abstraction.

## Key Files

| File | Description |
|------|-------------|
| `local-storage-service.js` | `LocalStorageService` class — read/write text/JSON/binary, list directory, move files |
| `storage-path-config.js` | `resolveStorageRoot()` — resolves storage root from explicit arg, env var, or default `data/` |

## For AI Agents

### Logical Path Convention
All paths are logical (relative to `rootDir`). Path traversal protection (`..` or `.`) throws `Error("Unsafe logical path")`.

### Storage Operations
- `writeText` / `readText` — UTF-8 text
- `writeJson` / `readJson` — JSON (pretty-printed with 2-space indent)
- `writeBuffer` / `readBuffer` — raw binary
- `exists(path)` — check file existence
- `list(dirPath)` — list directory entries (returns `[]` if absent)
- `move(src, dst)` — atomic rename

### Storage Root Resolution Priority
1. Explicit `rootDir` argument to constructor
2. `WEB_CAD_STORAGE_ROOT_CONTAINER` environment variable
3. Default: `<cwd>/data`

<!-- MANUAL: -->