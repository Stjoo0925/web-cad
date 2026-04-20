import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("editor-store.js should exist and export createEditorStore", async () => {
  const filePath = path.resolve(
    __dirname,
    "../packages/sdk-react/src/state/editor-store.ts",
  );
  const exists = await fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
  assert.ok(exists, "editor-store.js should exist");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("createEditorStore") || content.includes("EditorStore"),
    "should export createEditorStore or EditorStore",
  );
});

test("editor-store initial state should have tool, selection, viewMode, zoom, pan, mapActive", async () => {
  const filePath = path.resolve(
    __dirname,
    "../packages/sdk-react/src/state/editor-store.ts",
  );
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("tool") || content.includes("Tool"),
    "should have tool state",
  );
  assert.ok(
    content.includes("selection") || content.includes("Selection"),
    "should have selection state",
  );
  assert.ok(content.includes("viewMode"), "should have viewMode");
  assert.ok(
    content.includes("zoom") || content.includes("Zoom"),
    "should have zoom state",
  );
  assert.ok(
    content.includes("pan") || content.includes("Pan"),
    "should have pan state",
  );
  assert.ok(
    content.includes("mapActive") || content.includes("map"),
    "should have mapActive state",
  );
});

test("editor-store should support state transitions", async () => {
  const filePath = path.resolve(
    __dirname,
    "../packages/sdk-react/src/state/editor-store.ts",
  );
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("setTool") ||
      content.includes("setSelection") ||
      content.includes("setViewMode") ||
      content.includes("setZoom"),
    "should support at least one state transition method",
  );
});

test("editor-contracts.ts should exist and export unified types", async () => {
  const filePath = path.resolve(
    __dirname,
    "../packages/sdk-react/src/state/editor-contracts.ts",
  );
  const exists = await fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
  assert.ok(exists, "editor-contracts.ts should exist");

  const content = await fs.readFile(filePath, "utf8");

  // Verify unified Entity type with required id
  assert.ok(
    content.includes("id: string"),
    "Entity.id should be required (not optional)",
  );

  // Verify unified EditorToolType includes all tools
  assert.ok(content.includes('SELECT: "select"'), "should have select tool");
  assert.ok(content.includes('LINE: "line"'), "should have line tool");
  assert.ok(content.includes('CIRCLE: "circle"'), "should have circle tool");
  assert.ok(content.includes('ARC: "arc"'), "should have arc tool");
  assert.ok(content.includes('MOVE: "move"'), "should have move tool");
  assert.ok(content.includes('ROTATE: "rotate"'), "should have rotate tool");
  assert.ok(content.includes('SCALE: "scale"'), "should have scale tool");

  // Verify unified EDITOR_EVENTS
  assert.ok(
    content.includes("SELECTION_CHANGED"),
    "should have selection.changed event",
  );
  assert.ok(content.includes("TOOL_CHANGED"), "should have tool.changed event");
  assert.ok(content.includes("CHECKOUT"), "should have checkout event");
  assert.ok(
    content.includes("PRESENCE_UPDATE"),
    "should have presence.update event",
  );

  // Verify generateEntityId helper
  assert.ok(
    content.includes("generateEntityId"),
    "should export generateEntityId",
  );
  assert.ok(content.includes("createEntity"), "should export createEntity");
});

test("Entity.id should be required not optional in cad-canvas-renderer", async () => {
  const filePath = path.resolve(
    __dirname,
    "../packages/sdk-react/src/canvas/cad-canvas-renderer.ts",
  );
  const content = await fs.readFile(filePath, "utf8");

  // The Entity interface should have `id: string` (required)
  // not `id?: string` (optional)
  const entityMatch = content.match(/export interface Entity\s*\{[^}]+\}/);
  assert.ok(entityMatch, "should have Entity interface");

  const entityDef = entityMatch[0];
  assert.ok(
    entityDef.includes("id: string") && !entityDef.includes("id?: string"),
    "Entity.id should be required (id: string), not optional (id?: string)",
  );
});
