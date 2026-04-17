import test from "node:test";
import assert from "node:assert/strict";

import { TokenService } from "../packages/core/src/auth/token-service.js";

test("issues and verifies short lived editor tokens", () => {
  let now = Date.parse("2026-04-17T00:00:00.000Z");
  const tokenService = new TokenService({
    secret: "test-secret",
    issuer: "web-cad-local",
    defaultTtlSeconds: 60,
    now: () => now
  });

  const token = tokenService.issueToken({
    userId: "alice",
    documentId: "doc-1",
    scopes: ["documents:read", "documents:write"]
  });

  const payload = tokenService.verifyToken(token);

  assert.equal(payload.userId, "alice");
  assert.equal(payload.documentId, "doc-1");
  assert.deepEqual(payload.scopes, ["documents:read", "documents:write"]);
  assert.equal(payload.iss, "web-cad-local");
  assert.ok(payload.exp > payload.iat);

  now += 61_000;
  assert.throws(() => tokenService.verifyToken(token), /expired/i);
});
