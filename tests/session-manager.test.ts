import test from "node:test";
import assert from "node:assert/strict";

import { CollaborationSessionManager } from "../packages/core/src/collaboration/session-manager";

test("automatically checks out an entity, broadcasts previews, and releases on commit", () => {
  const manager = new CollaborationSessionManager();
  const events: Array<{ type: string }> = [];

  manager.subscribe((event) => {
    events.push(event);
  });

  const checkout = manager.beginEntityEdit({
    documentId: "doc-1",
    entityId: "line-1",
    userId: "alice",
  });

  assert.equal(checkout.status, "acquired");
  const currentCheckout = manager.getCheckout("doc-1", "line-1");
  assert.ok(currentCheckout);
  assert.equal(currentCheckout.userId, "alice");

  manager.publishDraft({
    documentId: "doc-1",
    entityId: "line-1",
    userId: "alice",
    draft: {
      type: "LINE",
      start: { x: 0, y: 0, z: 0 },
      end: { x: 10, y: 0, z: 0 },
    },
  });

  assert.throws(
    () =>
      manager.beginEntityEdit({
        documentId: "doc-1",
        entityId: "line-1",
        userId: "bob",
      }),
    /checked out/i,
  );

  const committed = manager.commitEntityEdit({
    documentId: "doc-1",
    entityId: "line-1",
    userId: "alice",
    entity: {
      id: "line-1",
      type: "LINE",
      layer: "survey",
      start: { x: 0, y: 0, z: 0 },
      end: { x: 10, y: 0, z: 0 },
    },
  });

  assert.equal(committed.type, "entity.commit.applied");
  assert.equal(manager.getCheckout("doc-1", "line-1"), undefined);
  assert.deepEqual(
    events.map((event) => event.type),
    [
      "entity.checkout.started",
      "entity.locked",
      "entity.draft.updated",
      "entity.commit.applied",
      "entity.checkout.released",
      "entity.unlocked",
    ],
  );
});

test("allows concurrent editing of different entities in the same document", () => {
  const manager = new CollaborationSessionManager();

  manager.beginEntityEdit({
    documentId: "doc-1",
    entityId: "line-1",
    userId: "alice",
  });

  const secondCheckout = manager.beginEntityEdit({
    documentId: "doc-1",
    entityId: "point-1",
    userId: "bob",
  });

  assert.equal(secondCheckout.status, "acquired");
  assert.equal(manager.listCheckouts("doc-1").length, 2);
});
