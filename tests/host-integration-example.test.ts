// host-integration-example 테스트 — 호스트 앱 통합 예제
import test from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// HostIntegrationExample.jsx 파일이 존재해야 함
test("HostIntegrationExample.jsx 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/web/src/examples/HostIntegrationExample.tsx");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "HostIntegrationExample.jsx 파일이 존재해야 함");
});

// 문서 열림 이벤트 예제가 있어야 함
test("문서 열림 이벤트 예제가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/web/src/examples/HostIntegrationExample.tsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("onDocumentOpened") || content.includes("document.opened"),
    "문서 열림 이벤트 예제가 있어야 함"
  );
});

// 저장 상태 이벤트 예제가 있어야 함
test("저장 상태 이벤트 예제가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/web/src/examples/HostIntegrationExample.tsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("onSaveStatus") || content.includes("save.status"),
    "저장 상태 이벤트 예제가 있어야 함"
  );
});

// 선택 변경 이벤트 예제가 있어야 함
test("선택 변경 이벤트 예제가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/web/src/examples/HostIntegrationExample.tsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("onSelectionChange") || content.includes("selection.changed"),
    "선택 변경 이벤트 예제가 있어야 함"
  );
});

// 토큰 공급 흐름이 예제에 있어야 함
test("토큰 공급 흐름이 예제에 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/web/src/examples/HostIntegrationExample.tsx");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("token") || content.includes("Token"),
    "토큰 공급 흐름이 예제에 있어야 함"
  );
});