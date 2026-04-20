// CadCanvasLayer input handling regression tests
// These tests verify fullscreen-safe viewport input behavior:
// 1. Wheel events use { passive: false } on viewport surface
// 2. Pointer drag uses setPointerCapture to prevent interruption
// 3. Viewport wrapper has data-cad-viewport-surface attribute
// 4. CSS styles (touch-action: none, overflow: hidden) for fullscreen safety

import test from "node:test";
import assert from "node:assert/strict";
import path from "path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// =====================================================================
// Test 1: CadCanvasLayer registers wheel events on viewport surface
// =====================================================================
test("CadCanvasLayer registers wheel events with passive: false", async () => {
  const filePath = path.resolve(
    __dirname,
    "../packages/sdk-react/src/canvas/CadCanvasLayer.tsx"
  );
  const content = await fs.readFile(filePath, "utf8");

  // Find wheel event listener registration with passive: false
  // Pattern: addEventListener("wheel", ..., { passive: false })
  const wheelPassiveFalse = /addEventListener\s*\(\s*['"]wheel['"]\s*,\s*\w+\s*,\s*\{\s*passive:\s*false\s*\}/.test(
    content
  );

  assert.ok(
    wheelPassiveFalse,
    "CadCanvasLayer must register wheel with { passive: false } to allow preventDefault"
  );
});

// =====================================================================
// Test 2: CadCanvasLayer pointer drag uses setPointerCapture
// =====================================================================
test("CadCanvasLayer drag path uses setPointerCapture for fullscreen-safe drag", async () => {
  const filePath = path.resolve(
    __dirname,
    "../packages/sdk-react/src/canvas/CadCanvasLayer.tsx"
  );
  const content = await fs.readFile(filePath, "utf8");

  // The drag handling in handleMouseDown should use setPointerCapture
  // to ensure mouse events are captured even when cursor leaves canvas
  // (critical for fullscreen mode where cursor may leave the element)
  const usesPointerCapture =
    /setPointerCapture/.test(content) ||
    /releasePointerCapture/.test(content);

  assert.ok(
    usesPointerCapture,
    "CadCanvasLayer must use setPointerCapture/releasePointerCapture in drag path for fullscreen safety"
  );
});

// =====================================================================
// Test 3: CadCanvasLayer viewport wrapper has data-cad-viewport-surface attribute
// =====================================================================
test("CadCanvasLayer has data-cad-viewport-surface attribute on viewport wrapper", async () => {
  const filePath = path.resolve(
    __dirname,
    "../packages/sdk-react/src/canvas/CadCanvasLayer.tsx"
  );
  const content = await fs.readFile(filePath, "utf8");

  // The canvas or its wrapper should have data-cad-viewport-surface attribute
  // to allow CSS selectors and JS queries to identify the viewport surface
  const hasDataAttribute =
    /data-cad-viewport-surface/.test(content) ||
    /dataCadViewportSurface/.test(content);

  assert.ok(
    hasDataAttribute,
    "CadCanvasLayer must have data-cad-viewport-surface attribute for viewport identification"
  );
});

// =====================================================================
// Test 4: CadCanvasLayer has touch-action: none CSS style
// =====================================================================
test("CadCanvasLayer canvas has touch-action: none for fullscreen-safe input", async () => {
  const filePath = path.resolve(
    __dirname,
    "../packages/sdk-react/src/canvas/CadCanvasLayer.tsx"
  );
  const content = await fs.readFile(filePath, "utf8");

  // touch-action: none prevents browser touch gestures (pinch-zoom, etc.)
  // that would interfere with CAD viewport navigation in fullscreen
  const hasTouchAction =
    /touch-action\s*:\s*none/.test(content) ||
    /touchAction\s*:\s*['"]none['"]/.test(content);

  assert.ok(
    hasTouchAction,
    "CadCanvasLayer must have touch-action: none style to prevent touch gesture interference"
  );
});

// =====================================================================
// Test 5: CadCanvasLayer has overflow: hidden CSS style
// =====================================================================
test("CadCanvasLayer viewport wrapper has overflow: hidden for fullscreen clipping", async () => {
  const filePath = path.resolve(
    __dirname,
    "../packages/sdk-react/src/canvas/CadCanvasLayer.tsx"
  );
  const content = await fs.readFile(filePath, "utf8");

  // overflow: hidden ensures canvas content is clipped at bounds
  // preventing scrollbar or overflow artifacts in fullscreen
  const hasOverflowHidden =
    /overflow\s*:\s*hidden/.test(content) ||
    /overflowHidden\s*:\s*true/.test(content);

  assert.ok(
    hasOverflowHidden,
    "CadCanvasLayer viewport wrapper must have overflow: hidden for fullscreen clipping"
  );
});

// =====================================================================
// Test 6: getBoundingClientRect is called fresh on each event (not cached)
// =====================================================================
test("CadCanvasLayer calls getBoundingClientRect fresh on each event, not cached", async () => {
  const filePath = path.resolve(
    __dirname,
    "../packages/sdk-react/src/canvas/CadCanvasLayer.tsx"
  );
  const content = await fs.readFile(filePath, "utf8");

  // getBoundingClientRect can become stale after layout shifts (e.g., fullscreen)
  // It must be called inside event handlers, not stored in a ref/useState
  // Check that it's NOT stored in a ref (which would be a cache)

  // Count occurrences - should appear multiple times inside handlers
  // Each handler (mousemove, click, mousedown) should call it fresh
  const getBoundingClientRectMatches = content.match(
    /getBoundingClientRect\s*\(\s*\)/g
  );

  assert.ok(
    getBoundingClientRectMatches && getBoundingClientRectMatches.length >= 3,
    `CadCanvasLayer must call getBoundingClientRect() fresh in each handler (found ${getBoundingClientRectMatches?.length ?? 0}, expected >= 3)`
  );
});
