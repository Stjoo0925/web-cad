/**
 * 엔티티 체크아웃 및 임시 수정을 위한 협업 세션 관리자
 * @module collaboration/session-manager
 */

// 공유 엔티티 타입 (dxf-document-service의 Entity와 동일)
interface Entity {
  id: string;
  type: string;
  layer?: string;
  [key: string]: unknown;
}

// 이벤트 타입
interface EntityCheckoutStartedEvent {
  type: "entity.checkout.started";
  documentId: string;
  entityId: string;
  userId: string;
  startedAt: string;
}

interface EntityDraftUpdatedEvent {
  type: "entity.draft.updated";
  documentId: string;
  entityId: string;
  userId: string;
  draft: unknown;
  timestamp: string;
}

interface EntityCommitAppliedEvent {
  type: "entity.commit.applied";
  documentId: string;
  entityId: string;
  userId: string;
  entity: Entity;
  timestamp: string;
}

interface EntityCheckoutReleasedEvent {
  type: "entity.checkout.released";
  documentId: string;
  entityId: string;
  userId: string;
  cancelled?: boolean;
  timestamp: string;
}

interface EntityLockedEvent {
  type: "entity.locked";
  documentId: string;
  entityId: string;
  lockedBy: string;
  timestamp: string;
}

interface EntityUnlockedEvent {
  type: "entity.unlocked";
  documentId: string;
  entityId: string;
  timestamp: string;
}

type CollaborationEvent =
  | EntityCheckoutStartedEvent
  | EntityDraftUpdatedEvent
  | EntityCommitAppliedEvent
  | EntityCheckoutReleasedEvent
  | EntityLockedEvent
  | EntityUnlockedEvent;

type EventListener = (event: CollaborationEvent) => void;

// 입력 타입
interface BeginEntityEditInput {
  documentId: string;
  entityId: string;
  userId: string;
}

interface PublishDraftInput {
  documentId: string;
  entityId: string;
  userId: string;
  draft: unknown;
}

interface CommitEntityEditInput {
  documentId: string;
  entityId: string;
  userId: string;
  entity: Entity;
}

interface CancelEntityEditInput {
  documentId: string;
  entityId: string;
  userId: string;
}

// 내부 타입
interface Checkout {
  documentId: string;
  entityId: string;
  userId: string;
  startedAt: string;
}

interface DocumentState {
  checkouts: Map<string, Checkout>;
}

interface SessionManagerOptions {
  now?: () => string;
}

export class CollaborationSessionManager {
  private now: () => string;
  private listeners: Set<EventListener>;
  private documents: Map<string, DocumentState>;

  constructor({
    now = () => new Date().toISOString(),
  }: SessionManagerOptions = {}) {
    this.now = now;
    this.listeners = new Set();
    this.documents = new Map();
  }

  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getCheckout(documentId: string, entityId: string): Checkout | undefined {
    return this.#getDocumentState(documentId).checkouts.get(entityId);
  }

  listCheckouts(documentId: string): Checkout[] {
    return Array.from(this.#getDocumentState(documentId).checkouts.values());
  }

  beginEntityEdit({ documentId, entityId, userId }: BeginEntityEditInput): {
    status: "acquired";
    checkout: Checkout;
  } {
    const documentState = this.#getDocumentState(documentId);
    const existing = documentState.checkouts.get(entityId);

    if (existing && existing.userId !== userId) {
      throw new Error(
        `Entity ${entityId} is already checked out by ${existing.userId}`,
      );
    }

    const checkout: Checkout = {
      documentId,
      entityId,
      userId,
      startedAt: this.now(),
    };
    documentState.checkouts.set(entityId, checkout);
    this.#emit({ type: "entity.checkout.started", ...checkout });
    this.#emit({
      type: "entity.locked",
      documentId,
      entityId,
      lockedBy: userId,
      timestamp: this.now(),
    });
    return { status: "acquired", checkout };
  }

  publishDraft({
    documentId,
    entityId,
    userId,
    draft,
  }: PublishDraftInput): EntityDraftUpdatedEvent {
    this.#assertCheckoutOwner({ documentId, entityId, userId });
    const event: EntityDraftUpdatedEvent = {
      type: "entity.draft.updated",
      documentId,
      entityId,
      userId,
      draft,
      timestamp: this.now(),
    };
    this.#emit(event);
    return event;
  }

  commitEntityEdit({
    documentId,
    entityId,
    userId,
    entity,
  }: CommitEntityEditInput): EntityCommitAppliedEvent {
    this.#assertCheckoutOwner({ documentId, entityId, userId });
    const documentState = this.#getDocumentState(documentId);
    const event: EntityCommitAppliedEvent = {
      type: "entity.commit.applied",
      documentId,
      entityId,
      userId,
      entity,
      timestamp: this.now(),
    };
    this.#emit(event);
    documentState.checkouts.delete(entityId);
    this.#emit({
      type: "entity.checkout.released",
      documentId,
      entityId,
      userId,
      timestamp: this.now(),
    });
    this.#emit({
      type: "entity.unlocked",
      documentId,
      entityId,
      timestamp: this.now(),
    });
    return event;
  }

  cancelEntityEdit({
    documentId,
    entityId,
    userId,
  }: CancelEntityEditInput): EntityCheckoutReleasedEvent {
    this.#assertCheckoutOwner({ documentId, entityId, userId });
    const documentState = this.#getDocumentState(documentId);
    documentState.checkouts.delete(entityId);
    const event: EntityCheckoutReleasedEvent = {
      type: "entity.checkout.released",
      documentId,
      entityId,
      userId,
      cancelled: true,
      timestamp: this.now(),
    };
    this.#emit(event);
    this.#emit({
      type: "entity.unlocked",
      documentId,
      entityId,
      timestamp: this.now(),
    });
    return event;
  }

  #assertCheckoutOwner({
    documentId,
    entityId,
    userId,
  }: BeginEntityEditInput): void {
    const checkout = this.getCheckout(documentId, entityId);
    if (!checkout) {
      throw new Error(`Entity ${entityId} is not checked out`);
    }
    if (checkout.userId !== userId) {
      throw new Error(
        `Entity ${entityId} is checked out by ${checkout.userId}`,
      );
    }
  }

  #getDocumentState(documentId: string): DocumentState {
    if (!this.documents.has(documentId)) {
      this.documents.set(documentId, {
        checkouts: new Map(),
      });
    }
    return this.documents.get(documentId)!;
  }

  #emit(event: CollaborationEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
