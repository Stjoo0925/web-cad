// api-server.ts TypeScript 마이그레이션 테스트
import test from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// api-server.ts 파일이 생성되어야 함
test("api-server.ts 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/server/src/api-server.ts");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "api-server.ts 파일이 존재해야 함");
});

// TypeScript 타입 정의를 가져올 수 있어야 함
test("api-server.ts에서 타입을 가져올 수 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/server/src/api-server.ts");
  const content = await fs.readFile(filePath, "utf8");

  // runtime에서 createRuntime 타입을 가져오는지 확인
  assert.ok(
    content.includes("createRuntime") || content.includes("Runtime"),
    "createRuntime 타입 참조가 있어야 함"
  );
});

// HTTP 메서드와 경로 패턴이 타입 정의되어 있어야 함
test("라우트 핸들러가 정의되어 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/server/src/api-server.ts");
  const content = await fs.readFile(filePath, "utf8");

  // api-server.ts의 라우트 패턴 확인 (정규식 named groups 사용)
  const routePatterns = [
    "health/live",
    "tokens/issue",
    "/api/documents",
    "documentId",
    "entityId",
    "/checkout",
    "/draft",
    "/commit",
    "/cancel"
  ];

  for (const pattern of routePatterns) {
    assert.ok(
      content.includes(pattern),
      `Route pattern ${pattern}가 정의되어 있어야 함`
    );
  }
});

// 헬스체크 엔드포인트가 정의되어 있어야 함
test("헬스체크 엔드포인트가 정의되어 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/server/src/api-server.ts");
  const content = await fs.readFile(filePath, "utf8");

  assert.ok(content.includes("/health/live") || content.includes("/health"), "헬스체크 엔드포인트가 있어야 함");
  assert.ok(content.includes("status: ok") || content.includes('"ok"'), "헬스체크 응답 형식이 있어야 함");
});

// JSON 응답 함수가 정의되어 있어야 함
test("JSON 응답 헬퍼 함수가 정의되어 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/server/src/api-server.ts");
  const content = await fs.readFile(filePath, "utf8");

  assert.ok(
    content.includes("jsonResponse") || content.includes("JSONResponse"),
    "jsonResponse 함수가 있어야 함"
  );
});

// SSE 세션 생성 함수가 정의되어 있어야 함
test("SSE 세션 지원이 정의되어 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/server/src/api-server.ts");
  const content = await fs.readFile(filePath, "utf8");

  assert.ok(
    content.includes("text/event-stream") || content.includes("SSE") || content.includes("stream"),
    "SSE 세션 지원이 있어야 함"
  );
});

// 포트 설정이 정의되어 있어야 함
test("포트 설정이 정의되어 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/server/src/api-server.ts");
  const content = await fs.readFile(filePath, "utf8");

  assert.ok(
    content.includes("4010") || content.includes("PORT"),
    "기본 포트 4010이 설정되어 있어야 함"
  );
});
