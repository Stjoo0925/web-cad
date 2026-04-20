// DemoApp Passive Event Listener 테스트
import test from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Passive event listener 에러가 발생하지 않도록 wheel 핸들러에서 preventDefault를 올바르게 처리해야 함
test("wheel 이벤트 핸들러는 passive_listener 에러를 발생시키지 않아야 함", async () => {
  const filePath = path.resolve(__dirname, "../apps/web/src/DemoApp.tsx");
  const content = await fs.readFile(filePath, "utf8");

  // onWheel 핸들러에서 preventDefault를 사용하는지 확인
  // 문제: React onWheel은 passive이므로 preventDefault 호출 시 에러 발생
  // 해결: wheel 이벤트 리스너를 { passive: false }로 등록하거나 useEffect에서 직접 등록

  // 현재 코드에서 문제점 패턴 확인 ( passive 없이 preventDefault 사용)
  const hasOnWheel = content.includes("onWheel={handleWheel}");
  const hasPreventDefault = content.includes("e.preventDefault()");

  // 핸들러가 있으면, passive 이벤트 리스너로 등록하거나 passive: false 옵션이 필요
  if (hasOnWheel && hasPreventDefault) {
    // useEffect로 wheel 이벤트 직접 등록 (passive: false) 패턴이 있는지 확인
    const hasPassiveFalseListener = content.includes("passive: false");
    const hasWheelEventListener = content.includes("addEventListener") && content.includes('"wheel"');

    // 둘 중 하나는 있어야 함 - 그렇지 않으면 버그
    assert.ok(
      hasPassiveFalseListener || hasWheelEventListener,
      "wheel 핸들러가 passive 이벤트 리스너로 등록되어 preventDefault 에러를 방지해야 함"
    );
  }
});
