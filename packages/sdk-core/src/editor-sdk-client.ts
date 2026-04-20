export type SdkEventType =
  | "document.status"
  | "document.error"
  | "document.opened"
  | "document.closed"
  | "upload.progress"
  | "upload.error"
  | "upload.completed"
  | "selection.changed"
  | "tool.changed"
  | "viewport.zoomToFit"
  | "save.status";

export interface SdkEvent {
  type: SdkEventType;
  documentId?: string;
  status?: string;
  message?: string;
  document?: unknown;
  assetType?: string;
  fileName?: string;
  loadedBytes?: number;
  receivedBytes?: number;
  assetId?: string;
  entityIds?: string[];
  tool?: string;
}

export interface EditorSdkClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

export class EditorSdkClient {
  baseUrl: string;
  fetchImpl: typeof fetch;
  listeners: Set<(event: SdkEvent) => void>;
  token: string | null;
  currentSelection: string[];
  currentTool?: string;

  constructor({ baseUrl, fetchImpl = globalThis.fetch }: EditorSdkClientOptions) {
    this.baseUrl = baseUrl.replace(/\/$/u, "");
    this.fetchImpl = fetchImpl;
    this.listeners = new Set();
    this.token = null;
    this.currentSelection = [];
  }

  setToken(token: string) {
    this.token = token;
  }

  subscribe(listener: (event: SdkEvent) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async openDocument(documentId: string) {
    this.#emit({ type: "document.status", status: "loading", documentId });
    const response = await this.fetchImpl(`${this.baseUrl}/api/documents/${documentId}`, {
      headers: this.#headers()
    });

    if (!response.ok) {
      const errorEvent = { type: "document.error" as const, documentId, message: "Failed to open document" };
      this.#emit(errorEvent);
      throw new Error(errorEvent.message);
    }

    const document = await response.json();
    this.#emit({ type: "document.opened", documentId, document });
    return document;
  }

  async uploadAsset({ documentId, assetType, fileName, content }: {
    documentId: string;
    assetType: string;
    fileName: string;
    content: ArrayBuffer | string;
  }) {
    this.#emit({
      type: "upload.progress",
      documentId,
      assetType,
      fileName,
      loadedBytes: (content as ArrayBuffer).byteLength ?? (content as string).length ?? 0
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
      const errorEvent = { type: "upload.error" as const, documentId, assetType, fileName, message: "Upload failed" };
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

  setSelection({ entityIds }: { entityIds: string[] }) {
    this.currentSelection = [...entityIds];
    this.#emit({ type: "selection.changed", entityIds: [...entityIds] });
  }

  async closeDocument(documentId: string) {
    this.#emit({ type: "document.status", status: "closing", documentId });
    this.currentSelection = [];
    this.#emit({ type: "document.closed", documentId });
  }

  setTool(tool: string) {
    this.currentTool = tool;
    this.#emit({ type: "tool.changed", tool });
  }

  zoomToFit(documentId: string) {
    this.#emit({ type: "viewport.zoomToFit", documentId });
  }

  async upload({ documentId, assetType, fileName, content }: {
    documentId: string;
    assetType: string;
    fileName: string;
    content: ArrayBuffer | string;
  }) {
    return this.uploadAsset({ documentId, assetType, fileName, content });
  }

  reportAutosave(status: string, documentId: string) {
    this.#emit({ type: "save.status", status, documentId });
  }

  #headers(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    return headers;
  }

  #emit(event: SdkEvent) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
