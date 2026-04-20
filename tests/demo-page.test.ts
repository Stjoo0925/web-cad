// 데모 페이지 테스트 — DemoApp.jsx 검증
import test from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// DemoApp.jsx 파일이 존재해야 함
test("DemoApp.jsx 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/web/src/DemoApp.tsx");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "DemoApp.jsx 파일이 존재해야 함");
});

// Canvas 2D 렌더링 함수가 있어야 함
test("Canvas 2D 렌더링 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/web/src/DemoApp.tsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("canvas") || content.includes("Canvas") || content.includes("getContext"),
    "Canvas 2D 렌더링 관련 코드가 있어야 함"
  );
});

// 그리드 렌더링 함수가 있어야 함
test("그리드 렌더링 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/web/src/DemoApp.tsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("grid") || content.includes("Grid") || content.includes("drawGrid"),
    "그리드 렌더링 관련 코드가 있어야 함"
  );
});

// 도구 선택 함수가 있어야 함 (select, line, polyline)
test("도구 선택 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/web/src/DemoApp.tsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    (content.includes("select") || content.includes("Select")) &&
    (content.includes("line") || content.includes("Line")),
    "도구 선택 관련 코드가 있어야 함"
  );
});

// 뷰 모드 전환 함수가 있어야 함 (2D CAD / 포인트클라우드)
test("뷰 모드 전환 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/web/src/DemoApp.tsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("viewMode") || content.includes("setViewMode") || content.includes("2d") || content.includes("3d"),
    "뷰 모드 전환 관련 코드가 있어야 함"
  );
});

// 샘플 엔티티 데이터가 있어야 함
test("샘플 엔티티 데이터가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/web/src/DemoApp.tsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("entities") || content.includes("sample") || content.includes("demo"),
    "샘플 엔티티 데이터가 있어야 함"
  );
});

// 레이어 목록이 있어야 함
test("레이어 목록이 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/web/src/DemoApp.tsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("layer") || content.includes("Layer"),
    "레이어 목록 관련 코드가 있어야 함"
  );
});

// 마우스 이벤트 핸들러가 있어야 함 (pan, zoom)
test("마우스 이벤트 핸들러가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/web/src/DemoApp.tsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("onMouseDown") || content.includes("onMouseMove") || content.includes("onWheel") ||
    content.includes("mousedown") || content.includes("mousemove") || content.includes("wheel"),
    "마우스 이벤트 핸들러가 있어야 함"
  );
});

// DemoApp 컴포넌트가 export되어 있어야 함
test("DemoApp 컴포넌트가 export되어 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/web/src/DemoApp.tsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("export") && (content.includes("DemoApp") || content.includes("default")),
    "DemoApp 컴포넌트가 export되어 있어야 함"
  );
});
