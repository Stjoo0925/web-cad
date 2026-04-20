import path from "node:path";
import http from "node:http";

import { createRuntime } from "./create-runtime.js";

const runtime = await createRuntime({
  rootDir: path.resolve(process.cwd(), "data")
});

const PORT = Number(process.env.WORKER_PORT ?? 4013);

/**
 * 처리 대기 중인 인제스트 작업을 처리합니다.
 */
async function processLoop(): Promise<void> {
  try {
    const processed = await runtime.ingestWorker.processPendingIngests();
    if (processed.length > 0) {
      console.log("processed " + processed.length + " ingest manifest(s)");
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("ingest processing error:", message);
  }
}

// 초기 처리
await processLoop();

// 주기적 처리 (30초마다)
setInterval(processLoop, 30_000);

// 헬스체크 서버 (healthcheck용)
const server = http.createServer(function(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url ?? "/", "http://localhost:" + PORT);
  if (url.pathname === "/health/live" || url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "worker" }));
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(PORT, function() {
  console.log("web-cad worker running, health on port " + PORT);
});

// graceful shutdown
process.on("SIGTERM", function() {
  console.log("worker shutting down...");
  server.close(function() { process.exit(0); });
});
