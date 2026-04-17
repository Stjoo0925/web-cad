<!-- Parent: ../../../../AGENTS.md -->
<!-- Generated: 2026-04-17 | Updated: 2026-04-17 -->

# packages/core/src/workers

## Purpose
Background asset ingest worker that processes uploaded assets and generates metadata sidecars.

## Key Files

| File | Description |
|------|-------------|
| `asset-ingest-worker.js` | `AssetIngestWorker` class — processes `ingest/` manifests, derives metadata, moves processed files |

## For AI Agents

### Ingest Pipeline
1. List all `.json` files in `ingest/`
2. For each manifest: read asset from `documents/<docId>/assets/<assetId>/<fileName>`
3. Write metadata to `documents/<docId>/derived/<assetId>/metadata.json`
4. Move manifest to `ingest/processed/<name>` (marks as done)

### Metadata Output
Each processed asset gets `metadata.json` containing: `assetId`, `documentId`, `assetType`, `fileName`, `extension`, `receivedBytes`, `processedAt`.

### Triggered By
`worker.js` entry point calls `processPendingIngests()` once on startup. In production, this would be on a schedule or queue trigger.

<!-- MANUAL: -->