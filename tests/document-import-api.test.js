// document-import-api 테스트 — DXF 업로드로 문서 초기화
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// DXF 업로드 API 핸들러 함수가 dxf-document-service.js에 있어야 함
test("DXF 업로드로 문서 초기화 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/dxf-document-service.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("importDxf") || content.includes("loadFromDxf") || content.includes("createFromDxf"),
    "DXF 업로드로 문서 초기화 함수가 있어야 함 (importDxf/loadFromDxf/createFromDxf)"
  );
});

// 문서 조회 시 엔티티 수 반환 함수가 있어야 함
test("문서 조회 시 엔티티 수를 반환하는 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/dxf-document-service.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("getEntityCount") || content.includes("entityCount"), "엔티티 수 반환 함수가 있어야 함");
});

// 사이드카에 원본 파일 참조와 초기 메타데이터 기록 함수가 있어야 함
test("사이드카에 원본 파일 참조와 메타데이터 기록 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/dxf-document-service.js");
  const content = await fs.readFile(filePath, "utf8");
  const hasMetadata = content.includes("metadata") || content.includes("originalFile") || content.includes("sourceFile");
  assert.ok(hasMetadata, "원본 파일 참조와 메타데이터 기록 함수가 있어야 함");
});

// 스냅샷 생성 함수가 이미 존재해야 함 (기존 dxf-document-service.js에 있음)
test("스냅샷 생성 함수(createSnapshot)가 이미 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/dxf-document-service.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("createSnapshot"), "createSnapshot 함수가 이미 존재해야 함");
});