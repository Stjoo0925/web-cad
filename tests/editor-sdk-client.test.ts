import test from "node:test";
import assert from "node:assert/strict";

import { EditorSdkClient } from "../packages/sdk-core/src/editor-sdk-client";

test("opens documents, uploads assets directly, and emits host facing events", async () => {
  const requests: Array<{
    url: URL | RequestInfo;
    method: string;
    headers: HeadersInit | undefined;
    body: BodyInit | null | undefined;
  }> = [];
  const client = new EditorSdkClient({
    baseUrl: "http://localhost:4010",
    fetchImpl: async (url, init) => {
      requests.push({
        url,
        method: init?.method ?? "GET",
        headers: init?.headers,
        body: init?.body
      });

      if (String(url).endsWith("/documents/doc-1")) {
        return new Response(
          JSON.stringify({
            documentId: "doc-1",
            entities: [],
            pointCloudReference: null,
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }

      if (String(url).includes("/assets")) {
        return new Response(
          JSON.stringify({ assetId: "asset-1", receivedBytes: 4 }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }

      throw new Error(`Unexpected URL: ${url}`);
    }
  });

  const emitted: Array<{ type: string }> = [];
  client.subscribe((event) => emitted.push(event));
  client.setToken("signed-editor-token");

  await client.openDocument("doc-1");
  await client.uploadAsset({
    documentId: "doc-1",
    assetType: "pointcloud",
    fileName: "scan.xyz",
    content: new TextEncoder().encode("test").buffer
  });
  client.setSelection({ entityIds: ["line-1"] });

  const firstRequest = requests[0];
  const secondRequest = requests[1];
  assert.ok(firstRequest);
  assert.ok(secondRequest);

  const firstHeaders = firstRequest.headers as Record<string, string>;
  const secondHeaders = secondRequest.headers as Record<string, string>;
  assert.equal(firstHeaders.Authorization, "Bearer signed-editor-token");
  assert.equal(secondHeaders["x-file-name"], "scan.xyz");
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
