// backup-restore 테스트 — 백업/복구 스크립트
import test from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// backup.ps1 파일이 존재해야 함
test("backup.ps1 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../scripts/backup.ps1");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "backup.ps1 파일이 존재해야 함");
});

// restore.ps1 파일이 존재해야 함
test("restore.ps1 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../scripts/restore.ps1");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "restore.ps1 파일이 존재해야 함");
});

// 백업 스크립트에 저장소 백업 함수가 있어야 함
test("백업 스크립트에 저장소 백업 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../scripts/backup.ps1");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("storage") || content.includes("Storage") || content.includes("backup"),
    "저장소 백업 함수가 있어야 함"
  );
});

// 복구 스크립트에 복구 함수가 있어야 함
test("복구 스크립트에 복구 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../scripts/restore.ps1");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("restore") || content.includes("Restore") || content.includes("복구"),
    "복구 함수가 있어야 함"
  );
});