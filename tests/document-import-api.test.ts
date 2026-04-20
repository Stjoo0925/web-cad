// document-import-api 테스트 — DXF 업로드로 문서 초기화
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// DXF 업로드 API 핸들러 함수가 dxf-document-service.ts에 있어야 함
test("DXF 업로드로 문서 초기화 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/dxf-document-service.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("importDxf") || content.includes("loadFromDxf") || content.includes("createFromDxf"),
    "DXF 업로드로 문서 초기화 함수가 있어야 함 (importDxf/loadFromDxf/createFromDxf)"
  );
});

// 문서 조회 시 엔티티 수 반환 함수가 있어야 함
test("문서 조회 시 엔티티 수를 반환하는 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/dxf-document-service.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("getEntityCount") || content.includes("entityCount"), "엔티티 수 반환 함수가 있어야 함");
});

// 사이드카에 원본 파일 참조와 초기 메타데이터 기록 함수가 있어야 함
test("사이드카에 원본 파일 참조와 메타데이터 기록 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/dxf-document-service.ts");
  const content = await fs.readFile(filePath, "utf8");
  const hasMetadata = content.includes("metadata") || content.includes("originalFile") || content.includes("sourceFile");
  assert.ok(hasMetadata, "원본 파일 참조와 메타데이터 기록 함수가 있어야 함");
});

// 스냅샷 생성 함수가 이미 존재해야 함 (기존 dxf-document-service.ts에 있음)
test("스냅샷 생성 함수(createSnapshot)가 이미 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/dxf-document-service.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("createSnapshot"), "createSnapshot 함수가 이미 존재해야 함");
});

// API 서버는 GET /api/documents/:id에 parseWarnings, snapshots, entityCount를 반환해야 함
test("GET /api/documents/:id는 parseWarnings, snapshots, entityCount를 반환해야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/server/src/api-server.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("parseWarnings"), "parseWarnings 필드가 있어야 함");
  assert.ok(content.includes("snapshots"), "snapshots 필드가 있어야 함");
  assert.ok(content.includes("entityCount"), "entityCount 필드가 있어야 함");
  assert.ok(content.includes("originalFileName"), "originalFileName 필드가 있어야 함");
  assert.ok(content.includes("sourceFormat"), "sourceFormat 필드가 있어야 함");
});

// API 서버는 POST /api/documents/:id/import-dxf 엔드포인트를 지원해야 함
test("POST /api/documents/:id/import-dxf 엔드포인트가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/server/src/api-server.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("import-dxf"), "import-dxf 경로가 있어야 함");
  assert.ok(content.includes("importDxf"), "documentService.importDxf 호출이 있어야 함");
});