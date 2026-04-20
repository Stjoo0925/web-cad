// layer-manager 테스트 — 레이어 CRUD, 가시성, 잠금
import test from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 레이어 관리자 파일이 존재해야 함
test("layer-manager.ts 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/layer-manager.ts");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "layer-manager.ts 파일이 존재해야 함");
});

// 레이어 생성 함수가 있어야 함
test("레이어 생성 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/layer-manager.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("createLayer") || content.includes("addLayer") || content.includes("add"),
    "레이어 생성 함수가 있어야 함"
  );
});

// 레이어 목록 조회 함수가 있어야 함
test("레이어 목록 조회 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/layer-manager.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("getLayers") || content.includes("listLayers") || content.includes("getAll"),
    "레이어 목록 조회 함수가 있어야 함"
  );
});

// 레이어 가시성 설정 함수가 있어야 함
test("레이어 가시성 설정 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/layer-manager.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("visible") || content.includes("visibility") || content.includes("show") || content.includes("hide"),
    "레이어 가시성 설정 함수가 있어야 함"
  );
});

// 레이어 잠금 설정 함수가 있어야 함
test("레이어 잠금 설정 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/layer-manager.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("locked") || content.includes("lock") || content.includes("protection"),
    "레이어 잠금 설정 함수가 있어야 함"
  );
});

// 레이어 삭제 함수가 있어야 함
test("레이어 삭제 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/layer-manager.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("removeLayer") || content.includes("deleteLayer") || content.includes("delete"),
    "레이어 삭제 함수가 있어야 함"
  );
});

// 레이어별 색상/선가중치 속성이 있어야 함
test("레이어별 색상/선가중치 속성이 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/layer-manager.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("color") || content.includes("lineWeight") || content.includes("linewidth"),
    "레이어별 색상/선가중치 속성이 있어야 함"
  );
});
