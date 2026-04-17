<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-17 | Updated: 2026-04-17 -->

# packages/sdk-react/src/maps

## Purpose
NAVER Maps JavaScript API v3 integration as an optional 2D CAD background layer.

## Key Files

| File | Description |
|------|-------------|
| `NaverMapBackground.jsx` | React component — dynamically loads NAVER Maps script, creates map in designated div ref |
| `naver-map-config.js` | `shouldEnableNaverMapBackground()`, `buildNaverMapScriptUrl()`, `createNaverMapOptions()` |

## For AI Agents

### Script Loading
Uses a randomized callback name (`__webCadNaverMapsReady_<random>`) to avoid collisions. Script is injected into `<head>` with `data-sdk="naver-maps"`.

### Cleanup
The effect in `NaverMapBackground` sets `cancelled = true` on unmount, preventing state updates on an unmounted component.

### Enabling Condition
`shouldEnableNaverMapBackground({ viewMode, mapProvider, naverMapClientId })` returns true only when `viewMode === "2d-cad"`, `mapProvider === "naver"`, and `naverMapClientId` is truthy.

<!-- MANUAL: -->