import path from "node:path";

function extensionFor(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  return extension.startsWith(".") ? extension.slice(1) : extension;
}

export class AssetIngestWorker {
  constructor({ storage, now = () => new Date().toISOString() }) {
    this.storage = storage;
    this.now = now;
  }

  async processPendingIngests() {
    const manifests = await this.storage.list("ingest");
    const processed = [];

    for (const manifestName of manifests.filter((name) => name.endsWith(".json"))) {
      const manifestPath = `ingest/${manifestName}`;
      const manifest = await this.storage.readJson(manifestPath);
      const sourcePath = `documents/${manifest.documentId}/assets/${manifest.assetId}/${manifest.fileName}`;
      const bytes = await this.storage.readBuffer(sourcePath);

      const metadata = {
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
