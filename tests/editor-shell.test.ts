import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("EditorShell.tsx 파일이 존재해야 함", async () => {
  const filePath = path.resolve(
    __dirname,
    "../packages/sdk-react/src/components/EditorShell.tsx",
  );
  const exists = await fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
  assert.ok(exists, "EditorShell.tsx 파일이 존재해야 함");
});

test("EditorShell은 함수를 export해야 함", async () => {
  const filePath = path.resolve(
    __dirname,
    "../packages/sdk-react/src/components/EditorShell.tsx",
  );
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("export"), "EditorShell.tsx는 export가 있어야 함");
});

test("EditorShell은 circle, arc, point, text 도구를 지원해야 함", async () => {
  const filePath = path.resolve(
    __dirname,
    "../packages/sdk-react/src/components/EditorShell.tsx",
  );
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("circleTool"), "circleTool이 있어야 함");
  assert.ok(content.includes("arcTool"), "arcTool이 있어야 함");
  assert.ok(content.includes("pointTool"), "pointTool이 있어야 함");
  assert.ok(content.includes("textTool"), "textTool이 있어야 함");
});

test("EditorShell은 undo/redo 히스토리를 지원해야 함", async () => {
  const filePath = path.resolve(
    __dirname,
    "../packages/sdk-react/src/components/EditorShell.tsx",
  );
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("history"), "history state가 있어야 함");
  assert.ok(content.includes("undo"), "undo 함수가 있어야 함");
  assert.ok(content.includes("redo"), "redo 함수가 있어야 함");
  assert.ok(
    content.includes("Ctrl") || content.includes("keydown"),
    "키보드 단축키가 있어야 함",
  );
});

test("EditorShell은 handleCanvasClick에서 circle, arc, point, text를 처리해야 함", async () => {
  const filePath = path.resolve(
    __dirname,
    "../packages/sdk-react/src/components/EditorShell.tsx",
  );
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes('activeTool === "circle"'),
    "circle 클릭 처리가 있어야 함",
  );
  assert.ok(
    content.includes('activeTool === "arc"'),
    "arc 클릭 처리가 있어야 함",
  );
  assert.ok(
    content.includes('activeTool === "point"'),
    "point 클릭 처리가 있어야 함",
  );
  assert.ok(
    content.includes('activeTool === "text"'),
    "text 클릭 처리가 있어야 함",
  );
});

test("CadPointCloudEditor.tsx가 존재해야 함", async () => {
  const filePath = path.resolve(
    __dirname,
    "../packages/sdk-react/src/CadPointCloudEditor.tsx",
  );
  const exists = await fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
  assert.ok(exists, "CadPointCloudEditor.tsx 파일이 존재해야 함");
});
