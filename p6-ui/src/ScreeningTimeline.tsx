import type { PipelineEvent } from "@cliver/contracts";

export interface ScreeningTimelineProps {
  events: PipelineEvent[];
}

/**
 * Displays pipeline events in a chronological timeline.
 *
 * Used in the provider dashboard to show real-time progress of a
 * screening session — which checks are starting, completing, when
 * consent was requested/received, etc.
 */
export function ScreeningTimeline({ events }: ScreeningTimelineProps) {
  if (events.length === 0) {
    return <p className="text-sm text-gray-500 py-4">No events yet</p>;
  }

  return (
    <ol className="space-y-2">
      {events.map((event, i) => (
        <li
          key={`${event.timestamp}-${i}`}
          className="flex items-start gap-3 text-sm py-1.5 border-l-2 border-gray-200 pl-4"
        >
          <span className="text-xs text-gray-400 font-mono shrink-0 pt-0.5 min-w-[60px]">
            {formatTime(event.timestamp)}
          </span>
          <span className="text-gray-700">{describeEvent(event)}</span>
        </li>
      ))}
    </ol>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toISOString().slice(11, 19); // HH:MM:SS
  } catch {
    return iso;
  }
}

function describeEvent(event: PipelineEvent): string {
  switch (event.type) {
    case "field_completed":
      return `Field "${event.fieldId}" completed`;
    case "check_started":
      return `Check "${event.checkId}" started`;
    case "check_completed":
      return `Check "${event.checkId}" completed — ${event.outcome.status}`;
    case "consent_requested":
      return `Consent requested: ${event.description}`;
    case "consent_received":
      return event.granted ? "Consent granted" : "Consent denied";
    case "action_proposed":
      return `Action proposed: ${event.description}`;
    case "pipeline_complete":
      return `Pipeline complete — ${event.decision.status}`;
    case "error":
      return `Error: ${event.message}`;
    default: {
      const _exhaustive: never = event;
      return "Unknown event";
    }
  }
}
