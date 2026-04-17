import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import React from "react";
import { EditorShell } from "../packages/sdk-react/src/layout/EditorShell.js";

const root = process.cwd();

test("EditorShell module files exist", () => {
  assert.ok(existsSync(path.join(root, "packages/sdk-react/src/layout/EditorShell.jsx")));
  assert.ok(existsSync(path.join(root, "packages/sdk-react/src/layout/editor-shell.css")));
});

test("EditorShell exports a function component", () => {
  assert.equal(typeof EditorShell, "function");
});

test("EditorShell returns element with correct slot props", () => {
  const el = EditorShell({
    viewport:   React.createElement("div", null),
    leftPanel:  React.createElement("div", null),
    rightPanel: React.createElement("div", null),
    viewMode:   "2d-cad",
  });
  assert.ok(el, "should return a React element");
  assert.equal(typeof el, "object");
  assert.equal(el.props["data-view-mode"], "2d-cad");
  assert.equal(el.props["data-left-panel"],  "true");
  assert.equal(el.props["data-right-panel"], "true");
});

test("EditorShell reflects viewMode in data-view-mode", () => {
  const el = EditorShell({ viewMode: "point-cloud" });
  assert.equal(el.props["data-view-mode"], "point-cloud");
});

test("EditorShell marks panels absent when not provided", () => {
  const el = EditorShell({ viewMode: "2d-cad" });
  assert.equal(el.props["data-left-panel"],  "false");
  assert.equal(el.props["data-right-panel"], "false");
});
