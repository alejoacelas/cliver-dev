import type { IEventEmitter, PipelineEvent, SSEEvent, ViewFilter } from "@cliver/contracts";
import type { EventBus } from "./event-bus.js";

/**
 * Maps PipelineEvent types to SSEEvent types where there is a direct
 * correspondence. PipelineEvents whose type has no SSE equivalent are
 * silently dropped.
 */
const PIPELINE_TO_SSE_TYPE: Record<string, string | undefined> = {
  error: "error",
  action_proposed: "action_proposed",
  consent_requested: "consent_request",
};

/**
 * Attempts to map a PipelineEvent to an SSEEvent. Returns null if the
 * pipeline event type has no SSE equivalent.
 */
function mapPipelineToSSE(event: PipelineEvent): SSEEvent | null {
  switch (event.type) {
    case "error":
      return {
        type: "error",
        screeningId: event.screeningId,
        message: event.message,
      };

    case "action_proposed":
      return {
        type: "action_proposed",
        screeningId: event.screeningId,
        actionId: event.actionId,
        description: event.description,
        requiresConsent: event.requiresConsent,
      };

    case "consent_requested":
      return {
        type: "consent_request",
        screeningId: event.screeningId,
        checkId: event.checkId,
        description: event.description,
      };

    // Pipeline event types with no direct SSE equivalent are dropped.
    case "field_completed":
    case "check_started":
    case "check_completed":
    case "consent_received":
    case "pipeline_complete":
      return null;

    default: {
      // Exhaustiveness guard — if new PipelineEvent types are added,
      // TypeScript will flag this at compile time.
      const _exhaustive: never = event;
      return null;
    }
  }
}

/**
 * Adapter that wraps an EventBus and implements the P0 IEventEmitter
 * interface. This bridges the gap between the pipeline layer (which
 * emits PipelineEvents) and the SSE layer (which works with SSEEvents).
 *
 * - `emit(event)` maps PipelineEvent → SSEEvent and forwards to
 *   `eventBus.emit(screeningId, sseEvent)`.
 * - `subscribe(filter, listener)` wraps the EventBus subscription,
 *   converting received SSEEvents back to the listener signature
 *   expected by IEventEmitter consumers. (Since the listener expects
 *   PipelineEvent but the bus emits SSEEvent, we pass through the
 *   SSEEvent as-is — it shares the same discriminated-union shape
 *   for the overlapping types.)
 */
export class EventBusAdapter implements IEventEmitter {
  constructor(private readonly eventBus: EventBus) {}

  async emit(event: PipelineEvent): Promise<void> {
    const mapped = mapPipelineToSSE(event);
    if (mapped) {
      await this.eventBus.emit(event.screeningId, mapped);
    }
  }

  subscribe(
    filter: { screeningId?: string; viewFilter?: ViewFilter },
    listener: (event: PipelineEvent) => void,
  ): () => void {
    const screeningId = filter.screeningId ?? "*";
    const viewFilter = filter.viewFilter ?? "debug";

    return this.eventBus.subscribe(screeningId, viewFilter, (sseEvent) => {
      // The listener expects PipelineEvent, but at the adapter boundary
      // we pass the SSEEvent through. The overlapping types (error,
      // action_proposed, consent_request) are structurally compatible
      // for the fields that matter. We cast here because this is the
      // adapter seam — the caller already knows they're getting events
      // filtered through the SSE layer.
      listener(sseEvent as unknown as PipelineEvent);
    });
  }
}
