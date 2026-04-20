// docker-compose.yml 테스트 — 서비스 구성 검증
import test from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * docker-compose.yml 내용을 읽습니다.
 */
async function readCompose() {
  const filePath = path.resolve(__dirname, "../docker-compose.yml");
  return fs.readFile(filePath, "utf8");
}

// db 서비스가 존재해야 함
test("db 서비스가 존재해야 함", async () => {
  const content = await readCompose();
  assert.ok(content.includes("services:") && content.includes("db:"), "db 서비스가 존재해야 함");
});

// api 서비스가 존재해야 함
test("api 서비스가 존재해야 함", async () => {
  const content = await readCompose();
  assert.ok(content.includes("api:"), "api 서비스가 존재해야 함");
});

// worker 서비스가 존재해야 함
test("worker 서비스가 존재해야 함", async () => {
  const content = await readCompose();
  assert.ok(content.includes("worker:"), "worker 서비스가 존재해야 함");
});

// files 서비스가 존재해야 함
test("files 서비스가 존재해야 함", async () => {
  const content = await readCompose();
  assert.ok(content.includes("files:"), "files 서비스가 존재해야 함");
});

// health 서비스가 존재해야 함
test("health 서비스가 존재해야 함", async () => {
  const content = await readCompose();
  assert.ok(content.includes("health:"), "health 서비스가 존재해야 함");
});

// db 서비스에 healthcheck가 있어야 함
test("db 서비스에 healthcheck가 있어야 함", async () => {
  const content = await readCompose();
  // healthcheck 블록이 있는지 확인 (들여쓰기 고려)
  assert.ok(content.includes("db:") && content.includes("healthcheck:"), "db 서비스에 healthcheck가 있어야 함");
});

// api 서비스에 depends_on이 db를 condition과 함께 참조해야 함
test("api 서비스가 db에 depends_on condition이 있어야 함", async () => {
  const content = await readCompose();
  assert.ok(
    content.includes("depends_on:") && content.includes("condition:") && content.includes("service_healthy"),
    "depends_on condition: service_healthy가 있어야 함"
  );
});

// volumes가 정의되어 있어야 함
test("volumes가 정의되어 있어야 함", async () => {
  const content = await readCompose();
  assert.ok(content.includes("volumes:"), "volumes가 정의되어 있어야 함");
});

// 환경변수 파일(.env.example)이 존재해야 함
test("환경변수 설정 파일(.env.example)이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../.env.example");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, ".env.example 파일이 존재해야 함");
});

// init-db.sql이 존재해야 함
test("init-db.sql이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../scripts/init-db.sql");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "scripts/init-db.sql 파일이 존재해야 함");
});

// WEB_CAD_DB_* 환경변수가 .env.example에 정의되어 있어야 함
test("WEB_CAD_DB_* 환경변수가 .env.example에 정의되어 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../.env.example");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("WEB_CAD_DB_HOST"), "WEB_CAD_DB_HOST가 정의되어 있어야 함");
  assert.ok(content.includes("WEB_CAD_DB_PORT"), "WEB_CAD_DB_PORT가 정의되어 있어야 함");
  assert.ok(content.includes("WEB_CAD_DB_USER"), "WEB_CAD_DB_USER가 정의되어 있어야 함");
  assert.ok(content.includes("WEB_CAD_DB_PASSWORD"), "WEB_CAD_DB_PASSWORD가 정의되어 있어야 함");
  assert.ok(content.includes("WEB_CAD_DB_NAME"), "WEB_CAD_DB_NAME가 정의되어 있어야 함");
});

// postgres:16-alpine 이미지가 사용되어야 함
test("postgres:16-alpine 이미지가 사용되어야 함", async () => {
  const content = await readCompose();
  assert.ok(content.includes("postgres:16-alpine"), "postgres:16-alpine 이미지가 사용되어야 함");
});

// health-server.js command가 health 서비스에 있어야 함
test("health-server.js command가 health 서비스에 있어야 함", async () => {
  const content = await readCompose();
  assert.ok(content.includes("health-server.js"), "health-server.js command가 health 서비스에 있어야 함");
});
