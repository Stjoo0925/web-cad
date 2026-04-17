// entity-commands 테스트 — 엔티티 명령 모델 표준화
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// entity-commands.js 파일이 존재해야 함
test("entity-commands.js 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/entity-commands.js");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "entity-commands.js 파일이 존재해야 함");
});

// create, update, delete 명령 팩토리 함수가 있어야 함
test("create, update, delete 명령 팩토리 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/entity-commands.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("createEntity") || content.includes("createCommand"), "create 명령 함수가 있어야 함");
  assert.ok(content.includes("updateEntity") || content.includes("updateCommand"), "update 명령 함수가 있어야 함");
  assert.ok(content.includes("deleteEntity") || content.includes("deleteCommand"), "delete 명령 함수가 있어야 함");
});

// 명령의 공통 형식 (type, entity, timestamp)이 있어야 함
test("명령의 공통 형식(type, entity, timestamp)이 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/entity-commands.js");
  const content = await fs.readFile(filePath, "utf8");
  const hasFormat = content.includes("type") && content.includes("entity") && (content.includes("timestamp") || content.includes("createdAt"));
  assert.ok(hasFormat, "명령의 공통 형식(type, entity, timestamp)이 있어야 함");
});

// 명령 유효성 검증 함수가 있어야 함
test("명령 유효성 검증 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/entity-commands.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("validate") || content.includes("isValid") || content.includes("validateCommand"),
    "명령 유효성 검증 함수가 있어야 함"
  );
});