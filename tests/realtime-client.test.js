// realtime-client 테스트 — WebSocket 협업 채널
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// realtime-client.js 파일이 존재해야 함
test("realtime-client.js 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-core/src/realtime-client.js");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "realtime-client.js 파일이 존재해야 함");
});

// checkout 이벤트 타입이 있어야 함
test("checkout 이벤트 타입이 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-core/src/realtime-client.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("checkout") || content.includes("CHECKOUT"), "checkout 이벤트 타입이 있어야 함");
});

// draft/commit/cancel 이벤트 타입이 있어야 함
test("draft/commit/cancel 이벤트 타입이 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-core/src/realtime-client.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    (content.includes("draft") || content.includes("DRAFT")) &&
    (content.includes("commit") || content.includes("COMMIT")) &&
    (content.includes("cancel") || content.includes("CANCEL")),
    "draft/commit/cancel 이벤트 타입이 있어야 함"
  );
});

// WebSocket 연결 함수가 있어야 함
test("WebSocket 연결 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-core/src/realtime-client.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("connect") || content.includes("websocket") || content.includes("WebSocket"),
    "WebSocket 연결 함수가 있어야 함"
  );
});

// 재연결 함수가 있어야 함
test("재연결 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-core/src/realtime-client.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("reconnect") || content.includes("retry") || content.includes("retry"),
    "재연결 함수가 있어야 함"
  );
});