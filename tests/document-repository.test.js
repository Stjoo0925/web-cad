// document-repository 테스트 — 데이터베이스 리포지토리
import test from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// document-repository.js 파일이 존재해야 함
test("document-repository.js 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/server/src/db/document-repository.js");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "document-repository.js 파일이 존재해야 함");
});

// CRUD 메서드가 있어야 함
test("CRUD 메서드가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/server/src/db/document-repository.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    (content.includes("create") || content.includes("insert")) &&
    (content.includes("find") || content.includes("get") || content.includes("select")) &&
    (content.includes("update") || content.includes("modify")),
    "CRUD 메서드가 있어야 함"
  );
});

// delete 메서드가 있어야 함
test("delete 메서드가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/server/src/db/document-repository.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("delete") || content.includes("remove"),
    "delete 메서드가 있어야 함"
  );
});

// 문서 목록 조회 함수가 있어야 함
test("문서 목록 조회 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/server/src/db/document-repository.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("list") || content.includes("findAll") || content.includes("getAll"),
    "문서 목록 조회 함수가 있어야 함"
  );
});