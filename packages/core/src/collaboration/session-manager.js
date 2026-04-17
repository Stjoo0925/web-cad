export class CollaborationSessionManager {
  constructor({ now = () => new Date().toISOString() } = {}) {
    this.now = now;
    this.listeners = new Set();
    this.documents = new Map();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getCheckout(documentId, entityId) {
    return this.#getDocumentState(documentId).checkouts.get(entityId);
  }

  listCheckouts(documentId) {
    return Array.from(this.#getDocumentState(documentId).checkouts.values());
  }

  beginEntityEdit({ documentId, entityId, userId }) {
    const documentState = this.#getDocumentState(documentId);
    const existing = documentState.checkouts.get(entityId);

    if (existing && existing.userId !== userId) {
      throw new Error(`Entity ${entityId} is already checked out by ${existing.userId}`);
    }

    const checkout = {
      documentId,
      entityId,
      userId,
      startedAt: this.now()
    };
    documentState.checkouts.set(entityId, checkout);
    this.#emit({ type: "entity.checkout.started", ...checkout });
    return { status: "acquired", checkout };
  }

  publishDraft({ documentId, entityId, userId, draft }) {
    this.#assertCheckoutOwner({ documentId, entityId, userId });
    const event = {
      type: "entity.draft.updated",
      documentId,
      entityId,
      userId,
      draft,
      timestamp: this.now()
    };
    this.#emit(event);
    return event;
  }

  commitEntityEdit({ documentId, entityId, userId, entity }) {
    this.#assertCheckoutOwner({ documentId, entityId, userId });
    const documentState = this.#getDocumentState(documentId);
    const event = {
      type: "entity.commit.applied",
      documentId,
      entityId,
      userId,
      entity,
      timestamp: this.now()
    };
    this.#emit(event);
    documentState.checkouts.delete(entityId);
    this.#emit({
      type: "entity.checkout.released",
      documentId,
      entityId,
      userId,
      timestamp: this.now()
    });
    return event;
  }

  cancelEntityEdit({ documentId, entityId, userId }) {
    this.#assertCheckoutOwner({ documentId, entityId, userId });
    const documentState = this.#getDocumentState(documentId);
    documentState.checkouts.delete(entityId);
    const event = {
      type: "entity.checkout.released",
      documentId,
      entityId,
      userId,
      cancelled: true,
      timestamp: this.now()
    };
    this.#emit(event);
    return event;
  }

  #assertCheckoutOwner({ documentId, entityId, userId }) {
    const checkout = this.getCheckout(documentId, entityId);
    if (!checkout) {
      throw new Error(`Entity ${entityId} is not checked out`);
    }
    if (checkout.userId !== userId) {
      throw new Error(`Entity ${entityId} is checked out by ${checkout.userId}`);
    }
  }

  #getDocumentState(documentId) {
    if (!this.documents.has(documentId)) {
      this.documents.set(documentId, {
        checkouts: new Map()
      });
    }
    return this.documents.get(documentId);
  }

  #emit(event) {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
