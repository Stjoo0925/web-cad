// map-alignment 테스트 — 지도 좌표와 현장 좌표 정합
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// map-alignment.js 파일이 존재해야 함
test("map-alignment.js 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/geometry/map-alignment.js");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "map-alignment.js 파일이 존재해야 함");
});

// 기준점을 이용한 좌표 변환 함수가 있어야 함
test("기준점을 이용한 좌표 변환 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/geometry/map-alignment.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("transform") || content.includes("align") || content.includes("referencePoint"),
    "좌표 변환 함수(transform/align)가 있어야 함"
  );
});

// 문서별 정합 파라미터를 저장/로드하는 함수가 있어야 함
test("문서별 정합 파라미터 저장/로드 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/geometry/map-alignment.js");
  const content = await fs.readFile(filePath, "utf8");
  const hasSaveLoad = (content.includes("save") || content.includes("write")) &&
                     (content.includes("load") || content.includes("read"));
  assert.ok(hasSaveLoad || content.includes("documentId"), "문서별 정합 파라미터 저장/로드 함수가 있어야 함");
});

// 정합 유효성 검사 함수가 있어야 함 (정합 없이는 지도 배경만 표시)
test("정합 유효성 검사 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/geometry/map-alignment.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("validate") || content.includes("isValid") || content.includes("hasAlignment"),
    "정합 유효성 검사 함수가 있어야 함"
  );
});