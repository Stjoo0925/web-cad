import test from "node:test";
import assert from "node:assert/strict";

import { EditorSdkClient } from "../packages/sdk-core/src/editor-sdk-client.ts";

test("opens documents, uploads assets directly, and emits host facing events", async () => {
  const requests = [];
  const client = new EditorSdkClient({
    baseUrl: "http://localhost:4010",
    fetchImpl: async (url, init) => {
      requests.push({
        url,
        method: init?.method ?? "GET",
        headers: init?.headers ?? {},
        body: init?.body
      });

      if (String(url).endsWith("/documents/doc-1")) {
        return {
          ok: true,
          async json() {
            return {
              documentId: "doc-1",
              entities: [],
              pointCloudReference: null
            };
          }
        };
      }

      if (String(url).includes("/assets")) {
        return {
          ok: true,
          async json() {
            return {
              assetId: "asset-1",
              receivedBytes: 4
            };
          }
        };
      }

      throw new Error(`Unexpected URL: ${url}`);
    }
  });

  const emitted = [];
  client.subscribe((event) => emitted.push(event));
  client.setToken("signed-editor-token");

  await client.openDocument("doc-1");
  await client.uploadAsset({
    documentId: "doc-1",
    assetType: "pointcloud",
    fileName: "scan.xyz",
    content: Buffer.from("test")
  });
  client.setSelection({ entityIds: ["line-1"] });

  assert.equal(requests[0].headers.Authorization, "Bearer signed-editor-token");
  assert.equal(requests[1].headers["x-file-name"], "scan.xyz");
  assert.deepEqual(
    emitted.map((event) => event.type),
    [
      "document.status",
      "document.opened",
      "upload.progress",
      "upload.completed",
      "selection.changed"
    ]
  );
});
