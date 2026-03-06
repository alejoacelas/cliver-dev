import type { SSEEvent, ViewFilter } from "@cliver/contracts";
import { filterForView } from "./event-router.js";

export type EventListener = (event: SSEEvent) => void;

interface Subscription {
  screeningId: string;
  view: ViewFilter;
  listener: EventListener;
}

/**
 * In-memory pub/sub event bus for SSE events.
 *
 * Events are routed by screeningId and filtered per subscriber's ViewFilter.
 * Subscribers only receive events matching their screeningId, filtered
 * through the event router for their view.
 */
export class EventBus {
  private subscriptions = new Map<string, Set<Subscription>>();

  /**
   * Emit an SSE event to all subscribers for its screeningId.
   * Each subscriber receives a filtered copy according to their view.
   *
   * Listener errors are caught and logged so that one failing listener
   * does not prevent other listeners from receiving the event.
   */
  async emit(screeningId: string, event: SSEEvent): Promise<void> {
    const subs = this.subscriptions.get(screeningId);
    if (!subs) return;

    for (const sub of subs) {
      const filtered = filterForView(event, sub.view);
      if (filtered !== null) {
        try {
          sub.listener(filtered);
        } catch (err: unknown) {
          console.error(
            `EventBus: listener threw for screeningId="${screeningId}", event type="${event.type}":`,
            err,
          );
        }
      }
    }
  }

  /**
   * Subscribe to events for a specific screening session and view.
   * Returns an unsubscribe function.
   */
  subscribe(
    screeningId: string,
    view: ViewFilter,
    listener: EventListener,
  ): () => void {
    const sub: Subscription = { screeningId, view, listener };

    let subs = this.subscriptions.get(screeningId);
    if (!subs) {
      subs = new Set();
      this.subscriptions.set(screeningId, subs);
    }
    subs.add(sub);

    return () => {
      subs!.delete(sub);
      if (subs!.size === 0) {
        this.subscriptions.delete(screeningId);
      }
    };
  }
}
