import { useState, useMemo } from "react";
import type { PipelineState, PipelineEvent, CompleteData } from "@cliver/contracts";
import { DecisionBadge } from "./DecisionBadge.js";
import { ScreeningTimeline } from "./ScreeningTimeline.js";
import { AuditTrail } from "./AuditTrail.js";

export interface ProviderDashboardProps {
  /** All screening sessions to list. */
  sessions: PipelineState[];
  /** Audit events keyed by screening ID. */
  auditEvents: Record<string, PipelineEvent[]>;
  /** Complete screening data keyed by screening ID. */
  completeDataMap: Record<string, CompleteData>;
  /** Optional: pre-select a session (for testing). */
  initialSelectedId?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  running: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

/**
 * Provider dashboard: session list + screening detail + audit trail.
 *
 * The provider sees full evidence, determinations, tool calls, and
 * decision details — everything the customer does NOT see.
 */
export function ProviderDashboard({
  sessions,
  auditEvents,
  completeDataMap,
  initialSelectedId,
}: ProviderDashboardProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);

  const selectedSession = useMemo(
    () => sessions.find((s) => s.screeningId === selectedId) ?? null,
    [sessions, selectedId],
  );

  const selectedEvents = selectedId ? auditEvents[selectedId] ?? [] : [];
  const selectedComplete = selectedId ? completeDataMap[selectedId] ?? null : null;

  // Detail view
  if (selectedSession) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            aria-label="Back to session list"
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            &larr; Back
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            Screening detail: {selectedSession.screeningId}
          </h1>
        </div>

        {/* Decision badge */}
        {selectedSession.decision && (
          <div className="mb-6">
            <DecisionBadge decision={selectedSession.decision} />
          </div>
        )}

        {/* Check progress */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
            Check progress
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {selectedSession.pendingChecks.length > 0 && (
              <div className="p-3 rounded-lg bg-gray-50">
                <h3 className="text-xs font-medium text-gray-500 mb-2 uppercase">Pending</h3>
                <ul className="space-y-1">
                  {selectedSession.pendingChecks.map((id) => (
                    <li key={id} className="text-sm text-gray-600">{id}</li>
                  ))}
                </ul>
              </div>
            )}
            {selectedSession.runningChecks.length > 0 && (
              <div className="p-3 rounded-lg bg-blue-50">
                <h3 className="text-xs font-medium text-blue-600 mb-2 uppercase">Running</h3>
                <ul className="space-y-1">
                  {selectedSession.runningChecks.map((id) => (
                    <li key={id} className="text-sm text-blue-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      {id}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selectedSession.completedChecks.length > 0 && (
              <div className="p-3 rounded-lg bg-green-50">
                <h3 className="text-xs font-medium text-green-600 mb-2 uppercase">Completed</h3>
                <ul className="space-y-1">
                  {selectedSession.completedChecks.map((id) => (
                    <li key={id} className="text-sm text-green-700">{id}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Evidence table (from complete data) */}
        {selectedComplete && selectedComplete.checks.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
              Evidence
            </h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Criterion</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Evidence</th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Sources</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedComplete.checks.map((check, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 text-gray-800 font-medium">{check.criterion}</td>
                      <td className="px-4 py-2">
                        <span className={checkStatusStyle(check.status)}>
                          {check.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-600">{check.evidence}</td>
                      <td className="px-4 py-2 text-gray-500 font-mono text-xs">
                        {check.sources.map((s, j) => (
                          <span key={j} className="mr-1">[{s}]</span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Background work */}
        {selectedComplete?.backgroundWork && selectedComplete.backgroundWork.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
              Background work
            </h2>
            <div className="space-y-2">
              {selectedComplete.backgroundWork.map((work, i) => (
                <div key={i} className="flex items-start gap-3 py-2">
                  <span className="text-xs font-mono text-gray-400 shrink-0 pt-0.5">
                    {work.relevance}
                  </span>
                  <div>
                    <span className="text-sm font-medium text-gray-800">{work.organism}</span>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {work.summary}
                      {work.sources.length > 0 && (
                        <span className="ml-1 font-mono text-gray-400">
                          {work.sources.map((s) => `[${s}]`).join(" ")}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Screening timeline */}
        {selectedEvents.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
              Timeline
            </h2>
            <ScreeningTimeline events={selectedEvents} />
          </div>
        )}

        {/* Audit trail */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
            Audit trail
          </h2>
          <AuditTrail entries={selectedEvents} />
        </div>
      </div>
    );
  }

  // Session list view
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-lg font-semibold text-gray-900 mb-6">Screening sessions</h1>
      {sessions.length === 0 ? (
        <p className="text-sm text-gray-500">No sessions</p>
      ) : (
        <ol className="divide-y divide-gray-100">
          {sessions.map((session) => (
            <li key={session.screeningId} className="py-3">
              <button
                type="button"
                onClick={() => setSelectedId(session.screeningId)}
                className="w-full text-left flex items-center gap-4 hover:bg-gray-50 rounded-lg px-3 py-2 -mx-3 transition-colors"
              >
                <span className="text-sm font-medium text-gray-800 min-w-[80px]">
                  {session.screeningId}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_COLORS[session.status] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {session.status}
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  {formatDate(session.updatedAt)}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function checkStatusStyle(status: string): string {
  if (status === "FLAG") return "text-xs font-medium text-red-700 bg-red-50 px-1.5 py-0.5 rounded";
  if (status === "UNDETERMINED") return "text-xs font-medium text-yellow-700 bg-yellow-50 px-1.5 py-0.5 rounded";
  return "text-xs font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded";
}
