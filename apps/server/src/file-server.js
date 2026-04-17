import http from "node:http";
import path from "node:path";
import { stat } from "node:fs/promises";

import { createRuntime } from "./create-runtime.js";

function contentTypeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case ".json":
      return "application/json";
    case ".dxf":
      return "application/dxf";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".xyz":
    case ".pts":
    case ".pcd":
      return "text/plain; charset=utf-8";
    case ".las":
    case ".laz":
      return "application/octet-stream";
    default:
      return "application/octet-stream";
  }
}

function logicalPathFromRequest(url) {
  const pathname = new URL(url, "http://localhost").pathname;
  const prefix = "/files/";
  if (!pathname.startsWith(prefix)) {
    return null;
  }
  return pathname.slice(prefix.length);
}

const runtime = await createRuntime();
const port = Number(process.env.FILE_SERVER_PORT ?? 4011);

const server = http.createServer(async (request, response) => {
  try {
    if (request.method !== "GET") {
      response.writeHead(405, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    const logicalPath = logicalPathFromRequest(request.url ?? "");
    if (!logicalPath) {
      response.writeHead(404, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    const absolutePath = runtime.storage.resolve(logicalPath);
    const fileStats = await stat(absolutePath);
    if (!fileStats.isFile()) {
      response.writeHead(404, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "Not found" }));
      return;
    }

    const content = await runtime.storage.readBuffer(logicalPath);
    response.writeHead(200, {
      "content-type": contentTypeFor(logicalPath),
      "content-length": String(content.byteLength)
    });
    response.end(content);
  } catch (error) {
    response.writeHead(404, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: error.message }));
  }
});

server.listen(port, () => {
  console.log(`web-cad on-prem file server listening on ${port} with root ${runtime.rootDir}`);
});
