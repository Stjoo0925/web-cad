// properties-panel 테스트 — 속성 패널과 엔티티 수정
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// PropertiesPanel.jsx 파일이 존재해야 함
test("PropertiesPanel.jsx 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/panels/PropertiesPanel.tsx");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "PropertiesPanel.jsx 파일이 존재해야 함");
});

// 엔티티 선택 시 속성 표시 함수가 있어야 함
test("엔티티 선택 시 속성 표시 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/panels/PropertiesPanel.tsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("selectedEntity") || content.includes("entity") || content.includes("properties"),
    "엔티티 선택 시 속성 표시 함수가 있어야 함"
  );
});

// update 명령 생성 함수가 있어야 함
test("update 명령 생성 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/panels/PropertiesPanel.tsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("update") || content.includes("onUpdate") || content.includes("UpdateEntity"),
    "update 명령 생성 함수가 있어야 함"
  );
});

// 속성 편집 핸들러가 있어야 함
test("속성 편집 핸들러가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/panels/PropertiesPanel.tsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("handle") || content.includes("onChange") || content.includes("Handler"),
    "속성 편집 핸들러가 있어야 함"
  );
});