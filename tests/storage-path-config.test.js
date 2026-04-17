import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import { resolveStorageRoot } from "../packages/core/src/storage/storage-path-config.js";

test("prefers explicit rootDir over environment and defaults", () => {
  const resolved = resolveStorageRoot({
    rootDir: "D:\\web-cad-storage",
    storageRootEnv: "C:\\ignored",
    cwd: "C:\\workspace"
  });

  assert.equal(resolved, "D:\\web-cad-storage");
});

test("uses configured environment storage path when no explicit rootDir is provided", () => {
  const resolved = resolveStorageRoot({
    storageRootEnv: "D:\\company-data\\cad-storage",
    cwd: "C:\\workspace"
  });

  assert.equal(resolved, "D:\\company-data\\cad-storage");
});

test("falls back to a workspace relative data directory", () => {
  const resolved = resolveStorageRoot({
    cwd: path.join("C:\\", "workspace", "web-cad")
  });

  assert.equal(resolved, path.join("C:\\", "workspace", "web-cad", "data"));
});
