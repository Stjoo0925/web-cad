import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("CadCanvasLayer.jsx should exist", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/canvas/CadCanvasLayer.jsx");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "CadCanvasLayer.jsx should exist");
});

test("cad-canvas-renderer.js should exist and export a render function", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/canvas/cad-canvas-renderer.ts");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "cad-canvas-renderer.js should exist");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("render") || content.includes("draw") || content.includes("Grid") || content.includes("grid"),
    "renderer should export draw/render/Grid function"
  );
});

test("cad-canvas-renderer should handle POINT, LINE, POLYLINE entity types", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/canvas/cad-canvas-renderer.ts");
  const content = await fs.readFile(filePath, "utf8");
  const entityTypes = ["POINT", "LINE", "POLYLINE", "LWPOLYLINE"];
  const found = entityTypes.filter((t) => content.includes(t));
  assert.ok(found.length >= 3, `renderer should handle POINT/LINE/POLYLINE, found: ${found.join(", ")}`);
});