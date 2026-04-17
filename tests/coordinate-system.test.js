import test from "node:test";
import assert from "node:assert/strict";

import { CoordinateSystem } from "../packages/core/src/geometry/coordinate-system.js";

test("converts large world coordinates into stable local coordinates", () => {
  const coordinateSystem = new CoordinateSystem();
  coordinateSystem.setOriginFromBoundingBox({
    min: { x: 357000, y: 4162000, z: 42 },
    max: { x: 357200, y: 4162200, z: 62 },
    center: { x: 357100, y: 4162100, z: 52 }
  });

  const local = coordinateSystem.worldToLocal({
    x: 357140,
    y: 4162140,
    z: 57
  });

  assert.deepEqual(local, { x: 40, y: 40, z: 5 });
  assert.deepEqual(coordinateSystem.localToWorld(local), {
    x: 357140,
    y: 4162140,
    z: 57
  });
});
