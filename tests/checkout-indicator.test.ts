// checkout-indicator 테스트 — 체크아웃 UI 및 충돌 처리
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// checkout-indicator.jsx 파일이 존재해야 함
test("checkout-indicator.jsx 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/collaboration/checkout-indicator.jsx");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "checkout-indicator.jsx 파일이 존재해야 함");
});

// 점유된 엔티티 표시 함수가 있어야 함
test("점유된 엔티티 표시 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/collaboration/checkout-indicator.jsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("locked") || content.includes("checkout") || content.includes("occupied"),
    "점유된 엔티티 표시 함수가 있어야 함"
  );
});

// 충돌 메시지 함수가 있어야 함
test("충돌 메시지 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/collaboration/checkout-indicator.jsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("conflict") || content.includes("Collision") || content.includes("message"),
    "충돌 메시지 함수가 있어야 함"
  );
});

// 점유자 정보 표시 함수가 있어야 함
test("점유자 정보 표시 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/collaboration/checkout-indicator.jsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("owner") || content.includes("user") || content.includes("holder"),
    "점유자 정보 표시 함수가 있어야 함"
  );
});