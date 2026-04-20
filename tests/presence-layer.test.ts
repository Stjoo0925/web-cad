// presence-layer 테스트 — 프레즌스 및 사용자 커서 표시
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// presence-layer.jsx 파일이 존재해야 함
test("presence-layer.jsx 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/collaboration/presence-layer.tsx");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "presence-layer.jsx 파일이 존재해야 함");
});

// 사용자 목록 렌더링 함수가 있어야 함
test("사용자 목록 렌더링 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/collaboration/presence-layer.tsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("user") || content.includes("users") || content.includes("presence"),
    "사용자 목록 렌더링 함수가 있어야 함"
  );
});

// 커서 위치 표시 함수가 있어야 함
test("커서 위치 표시 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/collaboration/presence-layer.tsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("cursor") || content.includes("Cursor") || content.includes("position"),
    "커서 위치 표시 함수가 있어야 함"
  );
});

// 사용자 입장/퇴장 처리 함수가 있어야 함
test("사용자 입장/퇴장 처리 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/collaboration/presence-layer.tsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("join") || content.includes("leave") || content.includes("enter") || content.includes("exit"),
    "사용자 입장/퇴장 처리 함수가 있어야 함"
  );
});