import http from "node:http";
import path from "node:path";
import { readFile, stat } from "node:fs/promises";

// Web app root: apps/web (HTML, app-specific JS)
const webRoot = path.resolve(process.cwd(), "apps/web");
// Project root: serves packages/, apps/ for SDK imports
const projectRoot = path.resolve(process.cwd());
const port = Number(process.env.PORT ?? 5173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jsx": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

async function tryReadFile(rootDir, requestPath) {
  const resolvedPath = path.join(rootDir, requestPath);
  const fileStat = await stat(resolvedPath);
  if (fileStat.isDirectory()) {
    return tryReadFile(rootDir, path.join(requestPath, "index.html"));
  }
  const content = await readFile(resolvedPath);
  const contentType = mimeTypes[path.extname(resolvedPath)] ?? "application/octet-stream";
  return { content, contentType };
}

async function readStaticFile(requestPath) {
  // 1. Try web app root first (apps/web)
  try {
    return await tryReadFile(webRoot, requestPath);
  } catch {
    // 2. Fall back to project root for SDK/packages imports
    return await tryReadFile(projectRoot, requestPath);
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const requestPath = url.pathname === "/" ? "/index.html" : url.pathname;

    const { content, contentType } = await readStaticFile(requestPath);
    response.writeHead(200, { "content-type": contentType });
    response.end(content);
  } catch {
    const fallback = await readFile(path.join(webRoot, "index.html"));
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(fallback);
  }
});

server.listen(port, () => {
  console.log(`web host app listening on http://localhost:${port}`);
  console.log(`  web root:     ${webRoot}`);
  console.log(`  project root: ${projectRoot}`);
});
