import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("EditorShell.jsx 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/layout/EditorShell.jsx");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "EditorShell.jsx 파일이 존재해야 함");
});

test("editor-shell.css 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/layout/editor-shell.css");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "editor-shell.css 파일이 존재해야 함");
});

test("EditorShell은 함수를 export해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/layout/EditorShell.jsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("export"), "EditorShell.jsx는 export가 있어야 함");
});

test("CSS는 grid 레이아웃을 정의해야 함", async () => {
  const cssPath = path.resolve(__dirname, "../packages/sdk-react/src/layout/editor-shell.css");
  const content = await fs.readFile(cssPath, "utf8");
  assert.ok(
    content.includes("grid") && content.includes("editor-shell"),
    "CSS는 grid 레이아웃과 editor-shell 클래스를 정의해야 함"
  );
});

test("CadPointCloudEditor.jsx가 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/CadPointCloudEditor.jsx");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "CadPointCloudEditor.jsx가 존재해야 함");
});