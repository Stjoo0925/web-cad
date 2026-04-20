import test from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, rm } from "node:fs/promises";

import { LocalStorageService } from "../packages/core/src/storage/local-storage-service";
import { DxfDocumentService } from "../packages/core/src/documents/dxf-document-service";

test("replays commit events into a DXF snapshot while keeping collaboration sidecar metadata", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "web-cad-docs-"));

  try {
    const storage = new LocalStorageService({ rootDir: tempRoot });
    const documentService = new DxfDocumentService({ storage });

    await documentService.createDocument({
      documentId: "survey-1",
      pointCloudReference: "pc-asset-1"
    });

    await documentService.appendEvent({
      documentId: "survey-1",
      event: {
        type: "entity.commit.applied",
        timestamp: new Date().toISOString(),
        entity: {
          id: "line-1",
          type: "LINE",
          layer: "survey",
          start: { x: 0, y: 0, z: 0 },
          end: { x: 10, y: 0, z: 0 }
        }
      }
    });

    await documentService.appendEvent({
      documentId: "survey-1",
      event: {
        type: "entity.commit.applied",
        timestamp: new Date().toISOString(),
        entity: {
          id: "point-1",
          type: "POINT",
          layer: "survey-points",
          position: { x: 1, y: 2, z: 3 }
        }
      }
    });

    const snapshot = await documentService.createSnapshot({ documentId: "survey-1" });
    const sidecar = await documentService.readSidecar({ documentId: "survey-1" });

    assert.match(snapshot.dxfContent, /LINE/);
    assert.match(snapshot.dxfContent, /POINT/);
    assert.equal(sidecar.events.length, 2);
    assert.equal(sidecar.pointCloudReference, "pc-asset-1");
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
