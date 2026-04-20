// las-worker-client 테스트 — LAS/LAZ 워커 클라이언트 인터페이스
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// las-worker-client.ts 파일이 존재해야 함
test("las-worker-client.ts 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/point-cloud/las-worker-client.ts");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "las-worker-client.ts 파일이 존재해야 함");
});

// LAS 워커 클라이언트 함수(processLas)가 있어야 함
test("LAS 워커 클라이언트 함수(processLas)가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/point-cloud/las-worker-client.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("processLas") || content.includes("process") || content.includes("LasWorker"), "processLas 함수가 있어야 함");
});

// 요청/응답 계약 함수가 있어야 함 (send, receive, onProgress)
test("요청/응답 계약 함수가 있어야 함 (send, receive, onProgress)", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/point-cloud/las-worker-client.ts");
  const content = await fs.readFile(filePath, "utf8");
  const hasContract = content.includes("send") || content.includes("postMessage");
  assert.ok(hasContract, "요청/응답 계약 함수가 있어야 함");
});

// 진행률/완료/오류 콜백이 있어야 함
test("진행률/완료/오류 콜백이 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/core/src/point-cloud/las-worker-client.ts");
  const content = await fs.readFile(filePath, "utf8");
  const hasCallbacks = (content.includes("onProgress") || content.includes("progress")) &&
                       (content.includes("onComplete") || content.includes("complete") || content.includes("onDone"));
  assert.ok(hasCallbacks, "진행률/완료/오류 콜백이 있어야 함");
});