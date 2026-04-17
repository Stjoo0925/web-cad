<!-- Parent: ../../../../AGENTS.md -->
<!-- Generated: 2026-04-17 | Updated: 2026-04-17 -->

# packages/core/src/documents

## Purpose
DXF document service that manages sidecar JSON metadata and DXF snapshot files for CAD documents.

## Key Files

| File | Description |
|------|-------------|
| `dxf-document-service.js` | `DxfDocumentService` class — creates documents, appends events, creates/replaces DXF snapshots |

## For AI Agents

### Storage Layout
```
documents/<documentId>/
  sidecar.json   ← event log, pointCloudReference, snapshots metadata
  snapshot.dxf   ← current DXF snapshot (regenerated on each commit)
```

### Entity Type Support
DXF serialization supports: `POINT`, `LINE`, `CIRCLE`, `ARC`, `TEXT`, `LWPOLYLINE`, `POLYLINE`. Unsupported types are preserved in sidecar only.

### Snapshot Generation
On every commit, `createSnapshot()` replays all events through `applyEvent()` to rebuild the entity map, then serializes to DXF and writes both sidecar and snapshot.

### Ingest Events
The `entity.commit.applied` and `entity.deleted` events are the two types that `applyEvent()` handles when replaying.

<!-- MANUAL: -->