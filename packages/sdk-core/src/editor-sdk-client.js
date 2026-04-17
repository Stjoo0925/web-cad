export class EditorSdkClient {
  constructor({ baseUrl, fetchImpl = globalThis.fetch }) {
    this.baseUrl = baseUrl.replace(/\/$/u, "");
    this.fetchImpl = fetchImpl;
    this.listeners = new Set();
    this.token = null;
    this.currentSelection = [];
  }

  setToken(token) {
    this.token = token;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async openDocument(documentId) {
    this.#emit({ type: "document.status", status: "loading", documentId });
    const response = await this.fetchImpl(`${this.baseUrl}/api/documents/${documentId}`, {
      headers: this.#headers()
    });

    if (!response.ok) {
      const errorEvent = { type: "document.error", documentId, message: "Failed to open document" };
      this.#emit(errorEvent);
      throw new Error(errorEvent.message);
    }

    const document = await response.json();
    this.#emit({ type: "document.opened", documentId, document });
    return document;
  }

  async uploadAsset({ documentId, assetType, fileName, content }) {
    this.#emit({
      type: "upload.progress",
      documentId,
      assetType,
      fileName,
      loadedBytes: content.byteLength ?? content.length ?? 0
    });

    const response = await this.fetchImpl(`${this.baseUrl}/api/documents/${documentId}/assets?assetType=${assetType}`, {
      method: "POST",
      headers: {
        ...this.#headers(),
        "content-type": "application/octet-stream",
        "x-file-name": fileName
      },
      body: content
    });

    if (!response.ok) {
      const errorEvent = { type: "upload.error", documentId, assetType, fileName, message: "Upload failed" };
      this.#emit(errorEvent);
      throw new Error(errorEvent.message);
    }

    const result = await response.json();
    this.#emit({
      type: "upload.completed",
      documentId,
      assetType,
      fileName,
      assetId: result.assetId,
      receivedBytes: result.receivedBytes
    });
    return result;
  }

  setSelection({ entityIds }) {
    this.currentSelection = [...entityIds];
    this.#emit({ type: "selection.changed", entityIds: [...entityIds] });
  }

  async closeDocument(documentId) {
    this.#emit({ type: "document.status", status: "closing", documentId });
    this.currentSelection = [];
    this.#emit({ type: "document.closed", documentId });
  }

  setTool(tool) {
    this.currentTool = tool;
    this.#emit({ type: "tool.changed", tool });
  }

  zoomToFit(documentId) {
    this.#emit({ type: "viewport.zoomToFit", documentId });
  }

  async upload({ documentId, assetType, fileName, content }) {
    return this.uploadAsset({ documentId, assetType, fileName, content });
  }

  reportAutosave(status, documentId) {
    this.#emit({ type: "save.status", status, documentId });
  }

  #headers() {
    const headers = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  #emit(event) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
