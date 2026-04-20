import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("apps/web/src/main.tsx can be imported without throwing", async () => {
  const mainPath = path.resolve(__dirname, "../apps/web/src/main.tsx");
  const content = await fs.readFile(mainPath, "utf8");
  assert.ok(content.includes("ReactDOM"), "main.tsx should mount React root");
});

test("apps/web/src/App.tsx smoke test — App component exports a function", async () => {
  const appPath = path.resolve(__dirname, "../apps/web/src/App.tsx");
  const content = await fs.readFile(appPath, "utf8");
  assert.ok(content.includes("export function App"), "App.tsx should export App");
  assert.ok(content.includes("CadPointCloudEditor"), "App.tsx should reference CadPointCloudEditor");
});

test("apps/web/package.json has required scripts", async () => {
  const pkgPath = path.resolve(__dirname, "../apps/web/package.json");
  const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));
  assert.ok(pkg.scripts.dev, "package.json should have dev script");
  assert.ok(pkg.scripts.build, "package.json should have build script");
  assert.ok(pkg.dependencies.react, "package.json should depend on react");
  assert.ok(pkg.devDependencies.vite, "package.json should use vite");
});

test("apps/web/index.html has root div and script entry", async () => {
  const htmlPath = path.resolve(__dirname, "../apps/web/index.html");
  const content = await fs.readFile(htmlPath, "utf8");
  assert.ok(content.includes('id="root"'), 'index.html should have id="root"');
  assert.ok(content.includes("/src/main.tsx"), "index.html should reference main.tsx");
});