// point-cloud-manifest 테스트 — 포인트클라우드 메타데이터 저장 구조
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// point-cloud-manifest.js 파일이 존재해야 함
test("point-cloud-manifest.js 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/point-cloud/point-cloud-manifest.js");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "point-cloud-manifest.js 파일이 존재해야 함");
});

// 메타데이터 생성 함수가 있어야 함
test("메타데이터 생성 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/point-cloud/point-cloud-manifest.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("createManifest") || content.includes("create") || content.includes("Manifest"),
    "메타데이터 생성 함수가 있어야 함"
  );
});

// 원본 참조, 포맷, bbox, pointCount, 색상 모드 함수가 있어야 함
test("원본 참조, 포맷, bbox, pointCount, 색상 모드 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/point-cloud/point-cloud-manifest.js");
  const content = await fs.readFile(filePath, "utf8");
  const hasFields = content.includes("source") || content.includes("originalFile") || content.includes("assetId");
  const hasFormat = content.includes("format");
  const hasBbox = content.includes("bbox");
  const hasCount = content.includes("pointCount");
  const hasColor = content.includes("colorMode") || content.includes("color");
  assert.ok(hasFields && hasFormat && hasBbox && hasCount && hasColor, "모든 메타데이터 필드가 정의되어야 함");
});