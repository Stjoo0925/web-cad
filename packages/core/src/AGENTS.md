<!-- Parent: ../../../AGENTS.md -->
<!-- Generated: 2026-04-17 | Updated: 2026-04-17 -->

# packages/core/src

## Purpose
Shared business logic: authentication, real-time collaboration, document storage, geometry, and asset processing.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `auth/` | JWT token issuance and verification (see `auth/AGENTS.md`) |
| `collaboration/` | Entity checkout, draft publishing, commit/release (see `collaboration/AGENTS.md`) |
| `documents/` | DXF serialization and document snapshot management (see `documents/AGENTS.md`) |
| `geometry/` | Coordinate system transformations (world ↔ local) (see `geometry/AGENTS.md`) |
| `storage/` | Local filesystem storage with JSON/text/binary support (see `storage/AGENTS.md`) |
| `workers/` | Asset ingest processing pipeline (see `workers/AGENTS.md`) |

## For AI Agents

### Service Wiring Order
Runtime factory (`apps/server/src/create-runtime.js`) instantiates in this order:
1. `LocalStorageService` — filesystem access
2. `TokenService` — JWT operations (reads env vars for secret/issuer)
3. `DxfDocumentService` — document storage using LocalStorageService
4. `CollaborationSessionManager` — in-memory entity checkouts
5. `AssetIngestWorker` — background ingest processing

### Event Flow
Collaboration events flow: `sessionManager` → subscribers (SSE clients) for real-time broadcast. Commit events are also appended to `DxfDocumentService` and trigger snapshot regeneration.

## Dependencies

### Internal
- All modules are internal to the monorepo; no cross-package dependencies within `packages/core/`.

### External
- Node.js built-ins: `node:crypto`, `node:fs/promises`, `node:path`, `node:http`

<!-- MANUAL: -->