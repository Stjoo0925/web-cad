// point-cloud-scene 테스트 — Three.js 포인트클라우드 씬
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// PointCloudLayer.tsx 파일이 존재해야 함
test("PointCloudLayer.tsx 파일이 존재해야 함", async () => {
  const filePath = path.resolve(
    __dirname,
    "../packages/sdk-react/src/point-cloud/PointCloudLayer.tsx",
  );
  const exists = await fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
  assert.ok(exists, "PointCloudLayer.tsx 파일이 존재해야 함");
});

// point-cloud-scene.js 파일이 존재해야 함
test("point-cloud-scene.js 파일이 존재해야 함", async () => {
  const filePath = path.resolve(
    __dirname,
    "../packages/sdk-react/src/point-cloud/point-cloud-scene.ts",
  );
  const exists = await fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);
  assert.ok(exists, "point-cloud-scene.js 파일이 존재해야 함");
});

// 씬 구성 함수가 있어야 함 (createScene, buildScene 등)
test("씬 구성 함수가 있어야 함 (createScene, buildScene)", async () => {
  const filePath = path.resolve(
    __dirname,
    "../packages/sdk-react/src/point-cloud/point-cloud-scene.ts",
  );
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("createScene") ||
      content.includes("buildScene") ||
      content.includes("Scene"),
    "씬 구성 함수가 있어야 함",
  );
});

// 포인트 옵션(point size, visibility, opacity, colorMode)이 있어야 함
test("포인트 옵션(point size, visibility, opacity, colorMode)이 있어야 함", async () => {
  const filePath = path.resolve(
    __dirname,
    "../packages/sdk-react/src/point-cloud/point-cloud-scene.ts",
  );
  const content = await fs.readFile(filePath, "utf8");
  const hasOptions = content.includes("pointSize") || content.includes("size");
  const hasVisibility =
    content.includes("visible") || content.includes("visibility");
  const hasOpacity = content.includes("opacity");
  const hasColorMode = content.includes("colorMode");
  assert.ok(
    hasOptions && hasVisibility && hasOpacity && hasColorMode,
    "포인트 옵션(pointSize, visibility, opacity, colorMode)이 모두 있어야 함",
  );
});

// 좌표계 정합을 위해 bbox center를 origin으로 사용해야 함
test("bbox center를 origin으로 사용하는 좌표계 정합이 있어야 함", async () => {
  const filePath = path.resolve(
    __dirname,
    "../packages/sdk-react/src/point-cloud/point-cloud-scene.ts",
  );
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("bbox?.center") || content.includes("bbox.center"),
    "bbox center를 origin으로 설정해야 함",
  );
  assert.ok(
    content.includes("worldToLocal") || content.includes("origin"),
    "좌표 변환(worldToLocal) 또는 origin이 있어야 함",
  );
  assert.ok(content.includes("setOrigin"), "setOrigin 함수가 있어야 함");
});

// BBox에 center 필드가 있어야 함
test("BBox는 center 좌표를 포함해야 함", async () => {
  const filePath = path.resolve(
    __dirname,
    "../packages/sdk-react/src/point-cloud/point-cloud-scene.ts",
  );
  const content = await fs.readFile(filePath, "utf8");
  assert.ok(
    content.includes("center?: Point3D"),
    "BBox에 center?: Point3D 필드가 있어야 함",
  );
});
