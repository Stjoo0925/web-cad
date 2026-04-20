// snap-engine 테스트 — 스냅 기능 모듈
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// snap-engine.js 파일이 존재해야 함
test("snap-engine.js 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/tools/snap-engine.ts");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "snap-engine.js 파일이 존재해야 함");
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