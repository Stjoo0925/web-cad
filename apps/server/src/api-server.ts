import crypto from "node:crypto";
import http from "node:http";
import path from "node:path";

import { createRuntime, type Runtime } from "./create-runtime.js";

function jsonResponse(response: http.ServerResponse, statusCode: number, payload: object): void {
  response.writeHead(statusCode, { "content-type": "application/json" });
  response.end(JSON.stringify(payload));
}

async function readJson(request: http.IncomingMessage): Promise<object> {
  const buffers: Buffer[] = [];
  for await (const chunk of request) {
    buffers.push(chunk as Buffer);
  }
  const content = Buffer.concat(buffers).toString("utf8");
  return content ? JSON.parse(content) : {};
}

async function readBuffer(request: http.IncomingMessage): Promise<Buffer> {
  const buffers: Buffer[] = [];
  for await (const chunk of request) {
    buffers.push(chunk as Buffer);
  }
  return Buffer.concat(buffers);
}

function bearerToken(request: http.IncomingMessage): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length);
}

function parseUrl(request: http.IncomingMessage): URL {
  return new URL(request.url ?? "/", `http://${request.headers.host}`);
}

function routeMatch(pathname: string, expression: RegExp): Record<string, string> | null {
  const match = pathname.match(expression);
  return match ? (match.groups as Record<string, string> ?? {}) : null;
}

function createSseSession(response: http.ServerResponse): void {
  response.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache",
    connection: "keep-alive"
  });
  response.write("\n");
}

interface Entity {
  id: string;
  type: string;
  [key: string]: unknown;
}

interface CollaborationEvent {
  type: string;
  documentId: string;
  entityId?: string;
  userId?: string;
  startedAt?: string;
}

interface SseClient {
  response: http.ServerResponse;
}

const runtime: Runtime = await createRuntime({
  rootDir: path.resolve(process.cwd(), "data")
});

const sseClients = new Map<string, SseClient[]>();

runtime.sessionManager.subscribe((event: CollaborationEvent) => {
  const clients = sseClients.get(event.documentId) ?? [];
  for (const client of clients) {
    client.response.write(`data: ${JSON.stringify(event)}\n\n`);
  }
});

const server = http.createServer(async (request, response) => {
  try {
    const url = parseUrl(request);
    const pathname = url.pathname;

    // 헬스체크 엔드포인트
    if (pathname === "/health/live" || pathname === "/health") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ status: "ok", service: "api" }));
      return;
    }

    if (request.method === "POST" && pathname === "/api/tokens/issue") {
      const body = await readJson(request) as { userId?: string };
      const token = runtime.tokenService.issueToken({ userId: body.userId ?? "anonymous", documentId: undefined });
      return jsonResponse(response, 200, { token });
    }

    if (request.method === "POST" && pathname === "/api/documents") {
      const body = await readJson(request) as { documentId?: string; pointCloudReference?: string };
      const documentId = body.documentId ?? crypto.randomUUID();
      await runtime.documentService.createDocument({
        documentId,
        pointCloudReference: body.pointCloudReference !== undefined ? body.pointCloudReference : null
      });
      return jsonResponse(response, 201, { documentId });
    }

    const documentIdParams = routeMatch(pathname, /^\/api\/documents\/(?<documentId>[^/]+)$/u);
    if (request.method === "GET" && documentIdParams) {
      runtime.tokenService.verifyToken(bearerToken(request) ?? "");
      const sidecar = await runtime.documentService.readSidecar({ documentId: documentIdParams.documentId });
      const dxfContent = await runtime.documentService.readSnapshot({ documentId: documentIdParams.documentId });
      return jsonResponse(response, 200, {
        documentId: documentIdParams.documentId,
        pointCloudReference: sidecar.pointCloudReference,
        events: sidecar.events.length,
        dxfContent
      });
    }

    const streamParams = routeMatch(pathname, /^\/api\/documents\/(?<documentId>[^/]+)\/stream$/u);
    if (request.method === "GET" && streamParams) {
      createSseSession(response);
      const clients = sseClients.get(streamParams.documentId) ?? [];
      clients.push({ response });
      sseClients.set(streamParams.documentId, clients);

      request.on("close", () => {
        const current = sseClients.get(streamParams.documentId) ?? [];
        sseClients.set(
          streamParams.documentId,
          current.filter((candidate) => candidate.response !== response)
        );
      });
      return;
    }

    const assetParams = routeMatch(pathname, /^\/api\/documents\/(?<documentId>[^/]+)\/assets$/u);
    if (request.method === "POST" && assetParams) {
      runtime.tokenService.verifyToken(bearerToken(request) ?? "");
      const fileName = request.headers["x-file-name"] ?? `${crypto.randomUUID()}.bin`;
      const assetId = crypto.randomUUID();
      const content = await readBuffer(request);
      await runtime.storage.writeBuffer(
        `documents/${assetParams.documentId}/assets/${assetId}/${fileName}`,
        content
      );
      await runtime.storage.writeJson(`ingest/${assetId}.json`, {
        assetId,
        documentId: assetParams.documentId,
        assetType: url.searchParams.get("assetType") ?? "unknown",
        fileName
      });
      return jsonResponse(response, 201, {
        assetId,
        receivedBytes: content.byteLength
      });
    }

    const checkoutParams = routeMatch(
      pathname,
      /^\/api\/documents\/(?<documentId>[^/]+)\/entities\/(?<entityId>[^/]+)\/checkout$/u
    );
    if (request.method === "POST" && checkoutParams) {
      const payload = runtime.tokenService.verifyToken(bearerToken(request) ?? "") as { userId: string };
      const checkout = runtime.sessionManager.beginEntityEdit({
        documentId: checkoutParams.documentId,
        entityId: checkoutParams.entityId,
        userId: payload.userId
      });
      return jsonResponse(response, 200, checkout);
    }

    const draftParams = routeMatch(
      pathname,
      /^\/api\/documents\/(?<documentId>[^/]+)\/entities\/(?<entityId>[^/]+)\/draft$/u
    );
    if (request.method === "POST" && draftParams) {
      const payload = runtime.tokenService.verifyToken(bearerToken(request) ?? "") as { userId: string };
      const draft = await readJson(request);
      const event = runtime.sessionManager.publishDraft({
        documentId: draftParams.documentId,
        entityId: draftParams.entityId,
        userId: payload.userId,
        draft
      });
      return jsonResponse(response, 200, event);
    }

    const commitParams = routeMatch(
      pathname,
      /^\/api\/documents\/(?<documentId>[^/]+)\/entities\/(?<entityId>[^/]+)\/commit$/u
    );
    if (request.method === "POST" && commitParams) {
      const payload = runtime.tokenService.verifyToken(bearerToken(request) ?? "") as { userId: string };
      const body = await readJson(request) as { entity?: object };
      const commitEvent = runtime.sessionManager.commitEntityEdit({
        documentId: commitParams.documentId,
        entityId: commitParams.entityId,
        userId: payload.userId,
        entity: body.entity as Entity
      });
      await runtime.documentService.appendEvent({
        documentId: commitParams.documentId,
        event: commitEvent
      });
      const snapshot = await runtime.documentService.createSnapshot({
        documentId: commitParams.documentId
      });
      return jsonResponse(response, 200, {
        event: commitEvent,
        snapshotEntityCount: snapshot.entities.length
      });
    }

    const cancelParams = routeMatch(
      pathname,
      /^\/api\/documents\/(?<documentId>[^/]+)\/entities\/(?<entityId>[^/]+)\/cancel$/u
    );
    if (request.method === "POST" && cancelParams) {
      const payload = runtime.tokenService.verifyToken(bearerToken(request) ?? "") as { userId: string };
      const event = runtime.sessionManager.cancelEntityEdit({
        documentId: cancelParams.documentId,
        entityId: cancelParams.entityId,
        userId: payload.userId
      });
      return jsonResponse(response, 200, event);
    }

    return jsonResponse(response, 404, { error: "Not found" });
  } catch (error) {
    return jsonResponse(response, 500, { error: (error as Error).message });
  }
});

const port = Number(process.env.PORT ?? 4010);
server.listen(port, () => {
  console.log(`web-cad on-prem api listening on ${port}`);
});
