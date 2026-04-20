import path from "node:path";

function extensionFor(fileName: string): string {
  const extension = path.extname(fileName).toLowerCase();
  return extension.startsWith(".") ? extension.slice(1) : extension;
}

interface Manifest {
  assetId: string;
  documentId: string;
  assetType: string;
  fileName: string;
}

interface AssetMetadata {
  assetId: string;
  documentId: string;
  assetType: string;
  fileName: string;
  extension: string;
  receivedBytes: number;
  processedAt: string;
}

interface Storage {
  list(path: string): Promise<string[]>;
  readJson<T = unknown>(path: string): Promise<T>;
  readBuffer(path: string): Promise<Buffer>;
  writeJson(path: string, value: unknown): Promise<void>;
  move(source: string, target: string): Promise<void>;
}

interface AssetIngestWorkerOptions {
  storage: Storage;
  now?: () => string;
}

export class AssetIngestWorker {
  private readonly storage: Storage;
  private readonly now: () => string;

  constructor({ storage, now = () => new Date().toISOString() }: AssetIngestWorkerOptions) {
    this.storage = storage;
    this.now = now;
  }

  async processPendingIngests(): Promise<AssetMetadata[]> {
    const manifests = await this.storage.list("ingest");
    const processed: AssetMetadata[] = [];

    for (const manifestName of manifests.filter((name) => name.endsWith(".json"))) {
      const manifestPath = `ingest/${manifestName}`;
      const manifest = await this.storage.readJson<Manifest>(manifestPath);
      const sourcePath = `documents/${manifest.documentId}/assets/${manifest.assetId}/${manifest.fileName}`;
      const bytes = await this.storage.readBuffer(sourcePath);

      const metadata: AssetMetadata = {
        assetId: manifest.assetId,
        documentId: manifest.documentId,
        assetType: manifest.assetType,
        fileName: manifest.fileName,
        extension: extensionFor(manifest.fileName),
        receivedBytes: bytes.byteLength,
        processedAt: this.now()
      };

      await this.storage.writeJson(
        `documents/${manifest.documentId}/derived/${manifest.assetId}/metadata.json`,
        metadata
      );
      await this.storage.move(manifestPath, `ingest/processed/${manifestName}`);
      processed.push(metadata);
    }

    return processed;
  }
}
