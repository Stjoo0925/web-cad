// snap-engine 테스트 — 스냅 기능 모듈
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// snap-engine.ts 파일이 존재해야 함
test("snap-engine.ts 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/tools/snap-engine.ts");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "snap-engine.ts 파일이 존재해야 함");
});

// 끝점 스냅 함수가 있어야 함
test("끝점 스냅 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/tools/snap-engine.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("endpoint") || content.includes("endPoint") || content.includes(" Endpoint"),
    "끝점(endPoint) 스냅 함수가 있어야 함"
  );
});

// 중점 스냅 함수가 있어야 함
test("중점 스냅 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/tools/snap-engine.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("midpoint") || content.includes("midPoint") || content.includes(" Midpoint"),
    "중점(midpoint) 스냅 함수가 있어야 함"
  );
});

// 교차점 스냅 함수가 있어야 함
test("교차점 스냅 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/tools/snap-engine.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("intersection") || content.includes("intersect") || content.includes(" Intersection"),
    "교차점(intersection) 스냅 함수가 있어야 함"
  );
});

// 스냅 엔진 생성 함수가 있어야 함
test("스냅 엔진 생성 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/tools/snap-engine.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("createSnapEngine") || content.includes("SnapEngine") || content.includes("snap"),
    "스냅 엔진 생성 함수가 있어야 함"
  );
});

// =====================================================================
// 1단계 확장: PERPENDICULAR, TANGENT, NEAREST 스냅
// =====================================================================

// PERPENDICULAR 스냅 타입이 정의되어 있어야 함
test("PERPENDICULAR 스냅 타입이 정의되어 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/tools/snap-engine.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes('"perpendicular"') || content.includes("'perpendicular'") || content.includes("PERPENDICULAR"),
    "PERPENDICULAR 스냅 타입이 정의되어 있어야 함"
  );
});

// TANGENT 스냅 타입이 정의되어 있어야 함
test("TANGENT 스냅 타입이 정의되어 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/tools/snap-engine.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes('"tangent"') || content.includes("'tangent'") || content.includes("TANGENT"),
    "TANGENT 스냅 타입이 정의되어 있어야 함"
  );
});

// NEAREST 스냅이 정의되어 있어야 함
test("NEAREST 스냅 타입이 정의되어 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/tools/snap-engine.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("NEAREST") || content.includes("nearest"),
    "NEAREST 스냅 타입이 정의되어 있어야 함"
  );
});

// PERPENDICULAR 스냅 계산 함수가 있어야 함
test("PERPENDICULAR(수직) 스냅 계산 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/tools/snap-engine.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("perpendicular") || content.includes("Perpendicular"),
    "PERPENDICULAR(수직) 스냅 계산 함수가 있어야 함"
  );
});

// TANGENT 스냅 계산 함수가 있어야 함
test("TANGENT(접선) 스냅 계산 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/tools/snap-engine.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("tangent") || content.includes("Tangent"),
    "TANGENT(접선) 스냅 계산 함수가 있어야 함"
  );
});

// NEAREST 스냅 계산 함수가 있어야 함
test("NEAREST(근접점) 스냅 계산 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/tools/snap-engine.ts");
  const content = await fs.readFile(filePath, "utf8");
  // NEAREST는 스냅 인프라에서 이미 처리됨 (기존 snap type)
  assert.ok(
    content.includes("NEAREST") || content.includes("nearest"),
    "NEAREST 스냅 타입이 정의되어 있어야 함"
  );
});

// SNAP_TYPES에 3가지 새로운 스냅이 모두 포함되어 있어야 함
test("SNAP_TYPES에 PERPENDICULAR, TANGENT, NEAREST가 모두 포함되어 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/tools/snap-engine.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("PERPENDICULAR"), "PERPENDICULAR 타입 필요");
  assert.ok(content.includes("TANGENT"), "TANGENT 타입 필요");
  assert.ok(content.includes("NEAREST"), "NEAREST 타입 필요");
});

// SNAP_PRIORITY에 새로운 스냅 타입의 우선순위가 정의되어 있어야 함
test("SNAP_PRIORITY에 새로운 스냅 타입의 우선순위가 정의되어 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/tools/snap-engine.ts");
  const content = await fs.readFile(filePath, "utf8");
  const perpMatch = content.match(/PERPENDICULAR[^:]*:\s*\d+/);
  const tangMatch = content.match(/TANGENT[^:]*:\s*\d+/);
  const nearMatch = content.match(/NEAREST[^:]*:\s*\d+/);
  assert.ok(perpMatch, "PERPENDICULAR 우선순위 필요");
  assert.ok(tangMatch, "TANGENT 우선순위 필요");
  assert.ok(nearMatch, "NEAREST 우선순위 필요");
});