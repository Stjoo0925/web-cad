<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-04-17 | Updated: 2026-04-17 -->

# tests

## Purpose
Node.js test suite using `node:test` and `assert/strict` for verifying core business logic.

## Key Files

| File | Description |
|------|-------------|
| `coordinate-system.test.js` | Tests `CoordinateSystem.worldToLocal` / `localToWorld` with UTM-scale coordinates |
| `dxf-document-service.test.js` | Tests DXF entity serialization, snapshot creation, event replay |
| `editor-sdk-client.test.js` | Tests `EditorSdkClient` token, document open, asset upload, events |
| `naver-map-config.test.js` | Tests `shouldEnableNaverMapBackground`, `buildNaverMapScriptUrl`, `createNaverMapOptions` |
| `session-manager.test.js` | Tests `CollaborationSessionManager` checkout, draft, commit, cancel lifecycle |
| `storage-path-config.test.js` | Tests `resolveStorageRoot` priority: explicit arg → env var → `data/` default |
| `token-service.test.js` | Tests `TokenService` issue/verify with HMAC timing safety and expiry |
| `web-app-files.test.js` | Tests web app file enumeration and structure (file missing — likely TBD) |

## For AI Agents

### Running Tests
```bash
npm test
```

### Test Framework
Uses Node.js built-in `node:test` module with `assert/strict`. No third-party test runner or assertion library required.

<!-- MANUAL: -->