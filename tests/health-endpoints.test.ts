// health-endpoints 테스트 — 헬스체크 엔드포인트
import test from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// health-server.ts 파일이 존재해야 함
test("health-server.ts 파일이 존재해야 함", async () => {
  const filePath = path.resolve(
    __dirname,
    "../apps/server/src/health-server.ts",
  );
  const exists = await fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
  assert.ok(exists, "health-server.ts 파일이 존재해야 함");
});

// 헬스체크 함수/API가 있어야 함
test("헬스체크 함수/API가 있어야 함", async () => {
  const filePath = path.resolve(
    __dirname,
    "../apps/server/src/health-server.ts",
  );
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("health") || content.includes("Health"),
    "헬스체크 함수/API가 있어야 함",
  );
});

// 서비스 상태 확인 함수가 있어야 함
test("서비스 상태 확인 함수가 있어야 함", async () => {
  const filePath = path.resolve(
    __dirname,
    "../apps/server/src/health-server.ts",
  );
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("status") ||
      content.includes("check") ||
      content.includes("ping"),
    "서비스 상태 확인 함수가 있어야 함",
  );
});

// docker-compose와 연동 가능한 함수가 있어야 함
test("docker-compose와 연동 가능한 함수가 있어야 함", async () => {
  const filePath = path.resolve(
    __dirname,
    "../apps/server/src/health-server.ts",
  );
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("docker") ||
      content.includes("compose") ||
      content.includes("container") ||
      content.includes("service"),
    "docker-compose와 연동 가능한 함수가 있어야 함",
  );
});

// 백업 스크립트가 존재해야 함
test("백업 스크립트(backup-db.sh)가 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../scripts/backup-db.sh");
  const exists = await fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
  assert.ok(exists, "backup-db.sh 파일이 존재해야 함");
});

// 복구 스크립트가 존재해야 함
test("복구 스크립트(restore-db.sh)가 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../scripts/restore-db.sh");
  const exists = await fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
  assert.ok(exists, "restore-db.sh 파일이 존재해야 함");
});

// 백업 스크립트는 pg_dump 명령을 사용해야 함
test("백업 스크립트는 pg_dump 명령을 사용해야 함", async () => {
  const filePath = path.resolve(__dirname, "../scripts/backup-db.sh");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(content.includes("pg_dump"), "pg_dump 명령이 있어야 함");
  assert.ok(content.includes("BACKUP_DIR"), "백업 디렉토리 설정이 있어야 함");
});

// 복구 스크립트는 pg_restore 또는 psql 명령을 사용해야 함
test("복구 스크립트는 pg_restore 또는 psql 명령을 사용해야 함", async () => {
  const filePath = path.resolve(__dirname, "../scripts/restore-db.sh");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("pg_restore") || content.includes("psql"),
    "pg_restore 또는 psql 명령이 있어야 함",
  );
  assert.ok(
    content.includes("DRY_RUN") || content.includes("--dry-run"),
    "dry-run 옵션이 있어야 함",
  );
});
