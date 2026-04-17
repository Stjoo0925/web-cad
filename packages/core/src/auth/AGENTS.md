<!-- Parent: ../../../../AGENTS.md -->
<!-- Generated: 2026-04-17 | Updated: 2026-04-17 -->

# packages/core/src/auth

## Purpose
JWT token service for issuing and verifying bearer tokens used in API authorization.

## Key Files

| File | Description |
|------|-------------|
| `token-service.js` | `TokenService` class — HS256 JWT issuance and verification with configurable secret, issuer, and TTL |

## For AI Agents

### Token Lifecycle
- `issueToken({ userId, documentId, scopes, ttlSeconds })` → signed JWT string
- `verifyToken(token)` → decoded payload or throws on invalid/expired/mismatched issuer

### JWT Format
Three-part base64url: `{ alg: "HS256", typ: "JWT" }`.`{ iss, sub, userId, documentId, scopes, iat, exp }`.`HMAC-SHA256 signature`

### Environment Configuration
Reads `WEB_CAD_JWT_SECRET` (default: `"change-me"`) and `WEB_CAD_JWT_ISSUER` (default: `"web-cad-onprem"`).

<!-- MANUAL: -->