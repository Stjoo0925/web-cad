// block-manager 테스트 — 블록/심벌 관리
import test from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// block-manager.js 파일이 존재해야 함
test("block-manager.js 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/block-manager.js");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "block-manager.js 파일이 존재해야 함");
});

// 블록 정의 생성 함수가 있어야 함
test("블록 정의 생성 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/block-manager.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("createBlock") || content.includes("addBlock") || content.includes("defineBlock"),
    "블록 정의 생성 함수가 있어야 함"
  );
});

// 블록 목록 조회 함수가 있어야 함
test("블록 목록 조회 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/block-manager.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("getBlocks") || content.includes("listBlocks") || content.includes("getAll"),
    "블록 목록 조회 함수가 있어야 함"
  );
});

// 블록 참조(Insert) 생성 함수가 있어야 함
test("블록 참조 생성 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/block-manager.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("insertBlock") || content.includes("createInsert") || content.includes("addReference"),
    "블록 참조 생성 함수가 있어야 함"
  );
});

// 회전/스케일/기준점 속성이 있어야 함
test("회전/스케일/기준점 속성이 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/block-manager.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    (content.includes("rotation") || content.includes("rotate")) &&
    (content.includes("scale") || content.includes("scaleX")) &&
    (content.includes("basePoint") || content.includes("origin") || content.includes("insertionPoint")),
    "회전/스케일/기준점 속성이 있어야 함"
  );
});

// 블록 속성(Attribute) 처리가 있어야 함
test("블록 속성 처리가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/block-manager.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("attribute") || content.includes("Attribute") || content.includes("attr"),
    "블록 속성 처리가 있어야 함"
  );
});

// 블록 Explode(분해) 함수가 있어야 함
test("블록 분해 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/block-manager.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("explode") || content.includes("explodeBlock") || content.includes("unlock"),
    "블록 분해 함수가 있어야 함"
  );
});
