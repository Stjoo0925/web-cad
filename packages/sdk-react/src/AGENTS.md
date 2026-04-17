<!-- Parent: ../../../AGENTS.md -->
<!-- Generated: 2026-04-17 | Updated: 2026-04-17 -->

# packages/sdk-react/src

## Purpose
React integration layer providing the `CadPointCloudEditor` component and NAVER Maps background layer.

## Key Files

| File | Description |
|------|-------------|
| `index.js` | Barrel export — re-exports `CadPointCloudEditor` and `NaverMapBackground` |
| `CadPointCloudEditor.jsx` | Main React component (file missing — likely generated or separately provided) |
| `maps/NaverMapBackground.jsx` | React component loading NAVER Maps JS API as 2D CAD background |
| `maps/naver-map-config.js` | NAVER Maps URL builder, options factory, and `shouldEnableNaverMapBackground()` guard |

## For AI Agents

### 2D CAD Mode with NAVER Maps
When `viewMode="2d-cad"` and `mapProvider="naver"` with a valid `naverMapClientId`, the editor renders the NAVER Maps background underneath the CAD canvas.

### Component Props (from README)
`baseUrl`, `token`, `documentId`, `viewMode`, `mapProvider`, `naverMapClientId`, `mapCenter`, `mapZoom`

### NAVER Maps Loading
Script is loaded dynamically (once) via `buildNaverMapScriptUrl()`. Map is only created when `viewMode === "2d-cad"` and client ID is provided.

<!-- MANUAL: -->