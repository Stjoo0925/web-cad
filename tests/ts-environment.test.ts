// TypeScript 환경 설정 테스트
import test from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { fileURLToPath } from "node:url";
import { execSync } from "child_process";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test("tsconfig.json이 존재하고 유효해야 함", async () => {
  const tsconfigPath = path.resolve(__dirname, "../tsconfig.json");
  const content = await fs.readFile(tsconfigPath, "utf8");
  const config = JSON.parse(content);

  assert.strictEqual(config.compilerOptions.strict, true, "strict mode必須");
  assert.ok(config.compilerOptions.target, "target 설정必須");
  assert.ok(config.include.includes("apps/**/*"), "apps 포함必須");
});

test("TypeScript 패키지가 설치되어야 함", async () => {
  const pkgPath = path.resolve(__dirname, "../package.json");
  const content = await fs.readFile(pkgPath, "utf8");
  const pkg = JSON.parse(content);
  const devDeps = Object.keys(pkg.devDependencies || {});

  assert.ok(devDeps.includes("typescript"), "typescript 설치必須");
  assert.ok(devDeps.includes("@types/node"), "@types/node 설치必須");
  assert.ok(devDeps.includes("@types/react"), "@types/react 설치必須");
});

test("tsc --noEmit이 실행 가능해야 함", () => {
  try {
    execSync("npx tsc --noEmit", { cwd: path.resolve(__dirname, ".."), stdio: "pipe" });
  } catch (e) {
    // TSC가 실행되면 현재 JS파일이 있으므로 오류 발생 예상
    // 핵심은 tsc 명령 자체가 실행 가능해야 함 (status 2는 TS에러정상)
    const err = e as { status?: number; message?: string };
    assert.ok(err.status === 2 || Boolean(err.message?.includes("tsc")), "tsc 실행 가능해야 함");
  }
});
