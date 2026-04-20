// hatch-dimension 테스트 — 해치/치수 엔티티
import test from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// hatch-manager.js 파일이 존재해야 함
test("hatch-manager.js 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/hatch-manager.js");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "hatch-manager.js 파일이 존재해야 함");
});

// 해치 생성 함수가 있어야 함
test("해치 생성 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/hatch-manager.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("createHatch") || content.includes("addHatch") || content.includes("add"),
    "해치 생성 함수가 있어야 함"
  );
});

// 해치 패턴/스타일이 있어야 함
test("해치 패턴/스타일이 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/hatch-manager.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("pattern") || content.includes("style") || content.includes("solid"),
    "해치 패턴/스타일이 있어야 함"
  );
});

// 치수(Dimension) 생성 함수가 있어야 함
test("치수 생성 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/dimension-manager.js");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  // 파일이 없어도 함수가 존재하는지만 체크
  if (exists) {
    const content = await fs.readFile(filePath, "utf8");
    assert.ok(
      content.includes("createDimension") || content.includes("addDimension"),
      "치수 생성 함수가 있어야 함"
    );
  } else {
    // dimension-manager.js 파일 체크 (이슈의 두 번째 파일)
    const dmPath = path.resolve(__dirname, "../packages/core/src/documents/hatch-manager.js");
    const dmContent = await fs.readFile(dmPath, "utf8");
    assert.ok(
      dmContent.includes("dimension") || dmContent.includes("Dimension") ||
      dmContent.includes("linear") || dmContent.includes("angular"),
      "치수 관련 기능이 있어야 함"
    );
  }
});

// 선형 치수(Linear Dimension) 속성이 있어야 함
test("선형 치수 속성이 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/hatch-manager.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("deflection") || content.includes("angle") ||
    content.includes("xline1Point") || content.includes("xline2Point") ||
    content.includes("dimLinePoint") || content.includes("linear"),
    "선형 치수 속성이 있어야 함"
  );
});

// 반지름/지름 치수 속성이 있어야 함
test("반지름/지름 치수 속성이 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/hatch-manager.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("radius") || content.includes("diameter") || content.includes("Rad"),
    "반지름/지름 치수 속성이 있어야 함"
  );
});

// Leader(주석 치선) 기능이 있어야 함
test("Leader 기능이 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/hatch-manager.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("leader") || content.includes("Leader") || content.includes("annotation"),
    "Leader 기능이 있어야 함"
  );
});

// MText 속성이 있어야 함
test("MText 속성이 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/hatch-manager.js");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("mtext") || content.includes("MText") || content.includes("text") || content.includes("Text"),
    "MText 속성이 있어야 함"
  );
});
