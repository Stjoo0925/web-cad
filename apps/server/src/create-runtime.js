import path from "node:path";
import { mkdir } from "node:fs/promises";

import { TokenService } from "../../../packages/core/src/auth/token-service.js";
import { CollaborationSessionManager } from "../../../packages/core/src/collaboration/session-manager.js";
import { DxfDocumentService } from "../../../packages/core/src/documents/dxf-document-service.js";
import { LocalStorageService } from "../../../packages/core/src/storage/local-storage-service.js";
import { resolveStorageRoot } from "../../../packages/core/src/storage/storage-path-config.js";
import { AssetIngestWorker } from "../../../packages/core/src/workers/asset-ingest-worker.js";

export async function createRuntime({ rootDir } = {}) {
  const resolvedRootDir = resolveStorageRoot({
    rootDir,
    cwd: path.resolve(process.cwd())
  });
  await mkdir(resolvedRootDir, { recursive: true });

  const storage = new LocalStorageService({ rootDir: resolvedRootDir });
  const tokenService = new TokenService({
    secret: process.env.WEB_CAD_JWT_SECRET ?? "change-me",
    issuer: process.env.WEB_CAD_JWT_ISSUER ?? "web-cad-onprem"
  });
  const documentService = new DxfDocumentService({ storage });
  const sessionManager = new CollaborationSessionManager();
  const ingestWorker = new AssetIngestWorker({ storage });

  return {
    rootDir: resolvedRootDir,
    storage,
    tokenService,
    documentService,
    sessionManager,
    ingestWorker
  };
}
