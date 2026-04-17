import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

test("apps/web 스캐폴드 파일이 존재해야 함", async () => {
  const expectedFiles = [
    "apps/web/package.json",
    "apps/web/vite.config.js",
    "apps/web/index.html",
    "apps/web/src/main.jsx",
    "apps/web/src/App.jsx"
  ];

  for (const relativePath of expectedFiles) {
    const fullPath = path.join(rootDir, relativePath);
    const exists = await fs.access(fullPath).then(() => true).catch(() => false);
    assert.ok(exists, `${relativePath} 파일이 존재해야 함`);
  }
});

test("apps/web/package.json에 dev 스크립트가 있어야 함", async () => {
  const packageJsonPath = path.join(rootDir, "apps/web/package.json");
  const content = await fs.readFile(packageJsonPath, "utf8");
  const packageJson = JSON.parse(content);
  assert.ok(packageJson.scripts?.dev, "package.json에 dev 스크립트가 있어야 함");
  assert.ok(packageJson.dependencies?.react, "package.json에 react 의존성이 있어야 함");
  assert.ok(packageJson.devDependencies?.vite, "package.json에 vite devDependency가 있어야 함");
});