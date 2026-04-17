<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 | Updated: 2026-04-17 -->

# apps/server/src

## Purpose
Entry-point servers for the on-prem deployment: HTTP API, background worker, and static file server.

## Key Files

| File | Description |
|------|-------------|
| `api-server.js` | HTTP API server (port 4010) — token issuance, document CRUD, entity checkout, SSE streaming, asset upload |
| `worker.js` | Asset ingest worker — processes pending `ingest/` manifests and generates `derived/` metadata |
| `file-server.js` | Static file server (port 4011) — serves DXF, point cloud, and binary assets from storage |
| `create-runtime.js` | Runtime factory — resolves storage root, instantiates all core services |

## For AI Agents

### Entry Point Wiring
`api-server.js`, `worker.js`, and `file-server.js` all call `createRuntime()` which wires together: `LocalStorageService`, `TokenService`, `DxfDocumentService`, `CollaborationSessionManager`, `AssetIngestWorker`.

### API Routes
All routes use Bearer token auth (except `/api/tokens/issue` and `GET /api/documents/:id`):
- `POST /api/tokens/issue` — issue JWT
- `POST /api/documents` — create document
- `GET /api/documents/:id` — read document snapshot
- `GET /api/documents/:id/stream` — SSE collaboration stream
- `POST /api/documents/:id/assets` — upload asset
- `POST /api/documents/:id/entities/:entityId/checkout` — begin edit
- `POST /api/documents/:id/entities/:entityId/draft` — publish draft
- `POST /api/documents/:id/entities/:entityId/commit` — commit edit
- `POST /api/documents/:id/entities/:entityId/cancel` — cancel edit

### SSE Collaboration
SSE sessions are stored in `sseClients` Map keyed by `documentId`. The `sessionManager` subscribes to all events and broadcasts to SSE clients.

## Dependencies

### Internal
- `packages/core/src/auth/token-service.js`
- `packages/core/src/collaboration/session-manager.js`
- `packages/core/src/documents/dxf-document-service.js`
- `packages/core/src/storage/local-storage-service.js`
- `packages/core/src/storage/storage-path-config.js`
- `packages/core/src/workers/asset-ingest-worker.js`

<!-- MANUAL: -->