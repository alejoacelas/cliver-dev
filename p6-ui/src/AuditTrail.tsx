import type { PipelineEvent } from "@cliver/contracts";

export interface AuditTrailProps {
  entries: PipelineEvent[];
}

/**
 * Chronological audit log of all pipeline events for a screening session.
 *
 * Shows event type, timestamp, screening ID, and relevant details.
 * Used in the provider dashboard for compliance and debugging.
 */
export function AuditTrail({ entries }: AuditTrailProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500 py-4">No audit entries</p>;
  }

  return (
    <ol className="divide-y divide-gray-100">
      {entries.map((entry, i) => (
        <li key={`${entry.timestamp}-${i}`} className="py-2 text-sm">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-gray-400 shrink-0">
              {formatTime(entry.timestamp)}
            </span>
            <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 shrink-0">
              {entry.type}
            </span>
            <span className="text-xs text-gray-400 shrink-0">
              {entry.screeningId}
            </span>
          </div>
          <div className="mt-1 pl-[76px] text-xs text-gray-600">
            {formatDetails(entry)}
          </div>
        </li>
      ))}
    </ol>
  );
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toISOString().slice(11, 19);
  } catch {
    return iso;
  }
}

function formatDetails(event: PipelineEvent): string {
  switch (event.type) {
    case "field_completed":
      return `Field: ${event.fieldId}`;
    case "check_started":
      return `Check: ${event.checkId}`;
    case "check_completed":
      return `Check: ${event.checkId} — ${event.outcome.status} — ${event.outcome.evidence}`;
    case "consent_requested":
      return `Check: ${event.checkId} — ${event.description}`;
    case "consent_received":
      return `Check: ${event.checkId} — ${event.granted ? "granted" : "denied"}`;
    case "action_proposed":
      return `Action: ${event.actionId} — ${event.description}`;
    case "pipeline_complete":
      return `Decision: ${event.decision.status} — ${event.decision.summary}`;
    case "error":
      return event.message;
    default: {
      const _exhaustive: never = event;
      return "";
    }
  }
}
