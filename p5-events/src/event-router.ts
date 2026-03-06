import type { SSEEvent, ViewFilter } from "@cliver/contracts";

/**
 * Determines whether an SSE event should be visible to a given view,
 * and optionally redacts fields before returning it.
 *
 * Returns the (possibly redacted) event, or null if it should be hidden.
 */
export function filterForView(
  event: SSEEvent,
  view: ViewFilter,
): SSEEvent | null {
  if (view === "debug") {
    // Debug sees everything, unfiltered.
    return event;
  }

  if (view === "provider") {
    // Provider sees everything except raw debug data.
    // For now, all SSE event types are visible to providers.
    return event;
  }

  // --- Customer view ---
  // Customers see: consent_request, action_proposed, status, field_event,
  // and a redacted version of complete (decision only, no evidence details).
  // Customers do NOT see: tool_call, tool_result, delta, error.

  switch (event.type) {
    case "consent_request":
    case "action_proposed":
    case "status":
    case "field_event":
      return event;

    case "complete": {
      // Redact: strip evidence details, keep only the decision status.
      return {
        type: "complete",
        screeningId: event.screeningId,
        data: {
          decision: event.data.decision,
          checks: [],
          backgroundWork: null,
          audit: {
            toolCalls: [],
            raw: { verification: "", work: null },
          },
        },
      };
    }

    case "tool_call":
    case "tool_result":
    case "delta":
    case "error":
      return null;

    default: {
      // Exhaustiveness check — if a new event type is added to the union
      // and not handled here, TypeScript will flag it at compile time.
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}
