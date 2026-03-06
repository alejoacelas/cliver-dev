import type { Decision } from "@cliver/contracts";

export interface DecisionBadgeProps {
  decision: Decision;
}

const STATUS_STYLES: Record<string, string> = {
  PASS: "bg-green-100 text-green-800 border-green-300",
  FLAG: "bg-red-100 text-red-800 border-red-300",
  REVIEW: "bg-yellow-100 text-yellow-800 border-yellow-300",
};

/**
 * Renders a decision status badge with color coding.
 *
 * - PASS = green
 * - FLAG = red
 * - REVIEW = yellow
 *
 * Shows the flag count (if any) and the decision summary.
 */
export function DecisionBadge({ decision }: DecisionBadgeProps) {
  const style = STATUS_STYLES[decision.status] ?? "bg-gray-100 text-gray-800 border-gray-300";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-semibold border ${style}`}
        >
          {decision.status}
        </span>
        {decision.flagCount > 0 && (
          <span className="text-xs text-gray-500">
            {decision.flagCount} flag{decision.flagCount === 1 ? "" : "s"}
          </span>
        )}
      </div>
      {decision.summary && (
        <p className="text-sm text-gray-600">{decision.summary}</p>
      )}
    </div>
  );
}
