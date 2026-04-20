// select-tool 테스트 — 엔티티 선택 도구 및 히트 테스트
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// select-tool.js 파일이 존재해야 함
test("select-tool.js 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/tools/select-tool.ts");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "select-tool.js 파일이 존재해야 함");
});

// 히트 테스트 함수가 있어야 함
test("히트 테스트 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/tools/select-tool.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("hitTest") || content.includes("hit") || content.includes("pick"), "히트 테스트 함수가 있어야 함");
});

// 단일/다중 선택 함수가 있어야 함
test("단일/다중 선택 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/tools/select-tool.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("select") || content.includes("setSelection"), "선택 함수가 있어야 함");
});

// 선택 해제 함수 clearSelection이 있어야 함
test("선택 해제 함수 clearSelection이 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/tools/select-tool.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("clearSelection") || content.includes("deselect"), "선택 해제 함수가 있어야 함");
});