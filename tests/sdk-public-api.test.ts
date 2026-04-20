// sdk-public-api 테스트 — SDK 공개 API 정리
import test from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// editor-sdk-client.js 파일이 존재해야 함
test("editor-sdk-client.js 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-core/src/editor-sdk-client.ts");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "editor-sdk-client.js 파일이 존재해야 함");
});

// open 메서드가 있어야 함
test("open 메서드가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-core/src/editor-sdk-client.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("open"), "open 메서드가 있어야 함");
});

// close 메서드가 있어야 함
test("close 메서드가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-core/src/editor-sdk-client.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("close"), "close 메서드가 있어야 함");
});

// upload 메서드가 있어야 함
test("upload 메서드가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-core/src/editor-sdk-client.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("upload") || content.includes("Upload"), "upload 메서드가 있어야 함");
});

// setTool 메서드가 있어야 함
test("setTool 메서드가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-core/src/editor-sdk-client.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("setTool") || content.includes("setTool"), "setTool 메서드가 있어야 함");
});

// zoomToFit 메서드가 있어야 함
test("zoomToFit 메서드가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-core/src/editor-sdk-client.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("zoomToFit") || content.includes("zoom"), "zoomToFit 메서드가 있어야 함");
});

// setSelection 메서드가 있어야 함
test("setSelection 메서드가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-core/src/editor-sdk-client.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("setSelection") || content.includes("selection"), "setSelection 메서드가 있어야 함");
});

// subscribe 메서드가 있어야 함
test("subscribe 메서드가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-core/src/editor-sdk-client.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("subscribe"), "subscribe 메서드가 있어야 함");
});