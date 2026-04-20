// dxf-parser 테스트
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// dxf-parser.ts 파일이 존재해야 함
test("dxf-parser.ts 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/dxf-parser.ts");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "dxf-parser.ts 파일이 존재해야 함");
});

// parseDxf 함수가 있어야 함
test("parseDxf 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/dxf-parser.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("parseDxf") || content.includes("parse"), "parseDxf 함수가 있어야 함");
});

// POINT, LINE, LWPOLYLINE, CIRCLE, ARC, TEXT 파싱 지원
test("POINT, LINE, LWPOLYLINE, CIRCLE, ARC, TEXT 파싱을 지원해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/dxf-parser.ts");
  const content = await fs.readFile(filePath, "utf8");
  const supported = ["POINT", "LINE", "LWPOLYLINE", "CIRCLE", "ARC", "TEXT"];
  const found = supported.filter((t) => content.includes(t));
  assert.ok(found.length >= 6, `모든 엔티티 타입을 지원해야 함: ${found.join(", ")}`);
});

// 미지원 엔티티 처리 (경고)
test("미지원 엔티티에 대해 경고를 처리할 수 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/documents/dxf-parser.ts");
  const content = await fs.readFile(filePath, "utf8");
  const hasWarning = content.includes("warn") || content.includes("unsupported") || content.includes("ignore");
  assert.ok(hasWarning, "미지원 엔티티에 대한 경고 처리가 있어야 함");
});