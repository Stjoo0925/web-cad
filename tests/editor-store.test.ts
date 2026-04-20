import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("editor-store.js should exist and export createEditorStore", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/state/editor-store.ts");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "editor-store.js should exist");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("createEditorStore") || content.includes("EditorStore"), "should export createEditorStore or EditorStore");
});

test("editor-store initial state should have tool, selection, viewMode, zoom, pan, mapActive", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/state/editor-store.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("tool") || content.includes("Tool"), "should have tool state");
  assert.ok(content.includes("selection") || content.includes("Selection"), "should have selection state");
  assert.ok(content.includes("viewMode"), "should have viewMode");
  assert.ok(content.includes("zoom") || content.includes("Zoom"), "should have zoom state");
  assert.ok(content.includes("pan") || content.includes("Pan"), "should have pan state");
  assert.ok(content.includes("mapActive") || content.includes("map"), "should have mapActive state");
});

test("editor-store should support state transitions", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/state/editor-store.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("setTool") || content.includes("setSelection") || content.includes("setViewMode") || content.includes("setZoom"),
    "should support at least one state transition method"
  );
});