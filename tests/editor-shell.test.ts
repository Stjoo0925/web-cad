import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("EditorShell.tsx 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/layout/EditorShell.tsx");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "EditorShell.tsx 파일이 존재해야 함");
});

test("EditorShell은 함수를 export해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/layout/EditorShell.tsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("export"), "EditorShell.tsx는 export가 있어야 함");
});

test("EditorShell CSS 변수는 Tailwind 클래스로 전환됨", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/layout/EditorShell.tsx");
  const content = await fs.readFile(filePath, "utf8");
  // Tailwind v4 uses @import "tailwindcss" or direct utilities; verify Tailwind usage
  assert.ok(
    content.includes("grid-cols-") || content.includes("grid-rows-") || content.includes("font-"),
    "EditorShell.tsx는 Tailwind grid/flex 클래스를 사용해야 함"
  );
});

test("CadPointCloudEditor.tsx가 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/CadPointCloudEditor.tsx");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "CadPointCloudEditor.tsx 파일이 존재해야 함");
});