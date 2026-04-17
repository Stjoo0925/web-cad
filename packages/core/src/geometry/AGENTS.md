<!-- Parent: ../../../../AGENTS.md -->
<!-- Generated: 2026-04-17 | Updated: 2026-04-17 -->

# packages/core/src/geometry

## Purpose
Coordinate system transformations for translating between world and local coordinate spaces.

## Key Files

| File | Description |
|------|-------------|
| `coordinate-system.js` | `CoordinateSystem` class — world↔local point translation, origin management |

## For AI Agents

### Coordinate System API
- `setOrigin(point)` / `setOriginFromBoundingBox(boundingBox)` — set origin
- `worldToLocal(point)` — subtracts origin from point
- `localToWorld(point)` — adds origin to point
- `getOrigin()` — returns current origin (copy)

### Use Case
Handles large coordinate values (e.g., UTM 357000/4162000) by shifting to a local origin to avoid floating-point precision issues in CAD rendering.

<!-- MANUAL: -->