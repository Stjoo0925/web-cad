// naver-map-sync 테스트
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// naver-map-sync.js 파일이 존재해야 함
test("naver-map-sync.js 파일이 존재해야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/maps/naver-map-sync.ts");
  const exists = await fs.access(filePath).then(() => true).catch(() => false);
  assert.ok(exists, "naver-map-sync.js 파일이 존재해야 함");
});

// 지도 옵션 변환 함수가 있어야 함 (뷰 상태 → 지도 옵션)
test("뷰 상태를 지도 옵션으로 변환하는 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/maps/naver-map-sync.ts");
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("toMapOptions") || content.includes("toNaverMapOptions") || content.includes("syncView"),
    "뷰 상태를 지도 옵션으로 변환하는 함수가 있어야 함"
  );
});

// 양방향 동기화 함수 또는 CAD 뷰 상태 업데이트 함수가 있어야 함
test("양방향 동기화를 위한 함수(syncViewToMap, syncMapToView)가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/maps/naver-map-sync.ts");
  const content = await fs.readFile(filePath, "utf8");
  const hasSyncFunctions =
    (content.includes("syncViewToMap") || content.includes("syncView")) &&
    (content.includes("syncMapToView") || content.includes("onMapChange"));
  assert.ok(hasSyncFunctions, "양방향 동기화 함수(syncViewToMap, syncMapToView)가 있어야 함");
});

// 3D/포인트클라우드 모드에서 동기화 비활성화 함수 또는 조건 처리가 있어야 함
test("모드별 동기화 활성화/비활성화 함수가 있어야 함", async () => {
  const filePath = path.resolve(__dirname, "../packages/sdk-react/src/maps/naver-map-sync.ts");
  const content = await fs.readFile(filePath, "utf8");
  const hasModeCheck = content.includes("viewMode") && (content.includes("2d-cad") || content.includes("isSyncEnabled"));
  assert.ok(hasModeCheck, "모드별 동기화 활성화/비활성화 함수가 있어야 함");
});