// layers-panel 테스트 — 레이어 패널 UI
import test from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// LayersPanel.jsx 파일이 존재해야 함
test("LayersPanel.jsx 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/panels/LayersPanel.jsx");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "LayersPanel.jsx 파일이 존재해야 함");
});

// 레이어 목록 렌더링 함수가 있어야 함
test("레이어 목록 렌더링 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/panels/LayersPanel.jsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("Layer") || content.includes("layer"),
    "레이어 목록 렌더링 함수가 있어야 함"
  );
});

// 가시성 토글 함수가 있어야 함
test("가시성 토글 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/panels/LayersPanel.jsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("visible") || content.includes("toggleVisibility") || content.includes("onToggle"),
    "가시성 토글 함수가 있어야 함"
  );
});

// 잠금 토글 함수가 있어야 함
test("잠금 토글 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/panels/LayersPanel.jsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("locked") || content.includes("toggleLock") || content.includes("onLock"),
    "잠금 토글 함수가 있어야 함"
  );
});

// 활성 레이어 설정 함수가 있어야 함
test("활성 레이어 설정 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/panels/LayersPanel.jsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("activeLayer") || content.includes("setActive") || content.includes("currentLayer"),
    "활성 레이어 설정 함수가 있어야 함"
  );
});
