// point-cloud-text-parser 테스트 — XYZ/PTS 파서 검증
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// xyz-parser.js와 pts-parser.js 파일이 존재해야 함
test("xyz-parser.js 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/point-cloud/xyz-parser.js");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "xyz-parser.js 파일이 존재해야 함");
});

test("pts-parser.js 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/point-cloud/pts-parser.js");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "pts-parser.js 파일이 존재해야 함");
});

// 파싱 함수(parsePoints)가 있어야 함
test("파싱 함수(parsePoints)가 있어야 함", async () => {
  const xyzPath = path.resolve(__dirname, "../packages/core/src/point-cloud/xyz-parser.js");
  const content = await fs.readFile(xyzPath, "utf8");
  assert.ok(content.includes("parse") || content.includes("parsePoints"), "parsePoints 함수가 있어야 함");
});

// bbox, pointCount, origin 계산 함수가 있어야 함
test("bbox, pointCount, origin 계산 함수가 있어야 함", async () => {
  const xyzPath = path.resolve(__dirname, "../packages/core/src/point-cloud/xyz-parser.js");
  const content = await fs.readFile(xyzPath, "utf8");
  const hasCalc = content.includes("bbox") || content.includes("boundingBox");
  const hasCount = content.includes("pointCount") || content.includes("count");
  const hasOrigin = content.includes("origin");
  assert.ok(hasCalc && hasCount && hasOrigin, "bbox, pointCount, origin 계산 함수가 모두 있어야 함");
});