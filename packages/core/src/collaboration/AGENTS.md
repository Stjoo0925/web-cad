<!-- Parent: ../../../../AGENTS.md -->
<!-- Generated: 2026-04-17 | Updated: 2026-04-17 -->

# packages/core/src/collaboration

## Purpose
Real-time entity collaboration manager handling checkout, draft publishing, commit, and cancel operations with event broadcasting.

## Key Files

| File | Description |
|------|-------------|
| `session-manager.js` | `CollaborationSessionManager` class — manages entity checkouts per document with subscriber-based event broadcasting |

## For AI Agents

### Entity Edit Lifecycle
1. **Checkout** — `beginEntityEdit({ documentId, entityId, userId })` → acquires lock (blocks other users)
2. **Draft** — `publishDraft({ documentId, entityId, userId, draft })` → broadcasts `entity.draft.updated`
3. **Commit** — `commitEntityEdit({ documentId, entityId, userId, entity })` → broadcasts `entity.commit.applied`, releases lock
4. **Cancel** — `cancelEntityEdit({ documentId, entityId, userId })` → releases lock, broadcasts `entity.checkout.released`

### Event Subscription
Call `subscribe(listener)` to register a callback receiving all events. Returns an unsubscribe function.

### SSE Integration
`apps/server/src/api-server.js` subscribes the `sseClients` broadcaster so all collaboration events reach connected browser clients via SSE.

<!-- MANUAL: -->