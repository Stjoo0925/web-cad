<!-- Parent: ../../../AGENTS.md -->
<!-- Generated: 2026-04-17 | Updated: 2026-04-17 -->

# packages/sdk-core/src

## Purpose
Framework-agnostic JavaScript SDK client for browser integrations connecting to the web-cad API server.

## Key Files

| File | Description |
|------|-------------|
| `editor-sdk-client.js` | `EditorSdkClient` class — token management, document open, asset upload, selection, save status |

## For AI Agents

### Client API
- `setToken(token)` — set Bearer token for authenticated requests
- `openDocument(documentId)` → document JSON (loads via `GET /api/documents/:id`)
- `uploadAsset({ documentId, assetType, fileName, content })` → `{ assetId, receivedBytes }`
- `setSelection({ entityIds })` — update local selection state and emit event
- `reportAutosave(status, documentId)` — emit save status event
- `subscribe(listener)` — subscribe to all SDK events (returns unsubscribe)

### Event Types Emitted
`document.status` (loading), `document.opened`, `document.error`, `upload.progress`, `upload.completed`, `upload.error`, `selection.changed`, `save.status`

### Integration
Used by `packages/sdk-react` to power the `CadPointCloudEditor` React component.

<!-- MANUAL: -->