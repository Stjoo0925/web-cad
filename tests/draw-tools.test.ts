// draw-tools 테스트 — 선/폴리라인 작성 도구
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// line-tool.js 파일이 존재해야 함
test("line-tool.js 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/tools/line-tool.ts");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "line-tool.js 파일이 존재해야 함");
});

// polyline-tool.js 파일이 존재해야 함
test("polyline-tool.js 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/tools/polyline-tool.ts");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "polyline-tool.js 파일이 존재해야 함");
});

// LINE 생성 함수가 있어야 함
test("LINE 생성 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/tools/line-tool.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("createLine") || content.includes("Line"), "LINE 생성 함수가 있어야 함");
});

// POLYLINE 생성 함수가 있어야 함
test("POLYLINE 생성 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/tools/polyline-tool.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("createPolyline") || content.includes("Polyline"), "POLYLINE 생성 함수가 있어야 함");
});

// 완료 이벤트/콜백이 있어야 함
test("완료 이벤트/콜백이 있어야 함", async () => {
  const linePath = path.resolve(__dirname, "../packages/sdk-react/src/tools/line-tool.ts");
  const polyPath = path.resolve(__dirname, "../packages/sdk-react/src/tools/polyline-tool.ts");
  const lineContent = await fs.readFile(linePath, "utf8");
  const polyContent = await fs.readFile(polyPath, "utf8");
  const hasComplete = lineContent.includes("complete") || lineContent.includes("onComplete") ||
                      polyContent.includes("complete") || polyContent.includes("onComplete");
  assert.ok(hasComplete, "완료 이벤트/콜백이 있어야 함");
});