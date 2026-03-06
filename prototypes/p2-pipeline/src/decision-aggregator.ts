import type { CheckOutcome, Decision, DecisionReason } from "@cliver/contracts";

const DEFAULT_FLAG_CHECK_IDS = new Set(["sanctions"]);

export interface DecisionAggregatorOptions {
  /** Check IDs that should produce FLAG (not REVIEW) when they flag. Defaults to `new Set(["sanctions"])`. */
  flagCheckIds?: Set<string>;
  /** Map from checkId to human-readable criterion display name for DecisionReason.criterion. */
  criterionNames?: Map<string, string>;
}

/**
 * Aggregates check outcomes into a final PASS/FLAG/REVIEW decision.
 *
 * Rules:
 * - All checks pass -> PASS
 * - Sanctions flag -> FLAG (highest priority)
 * - Non-sanctions flag, error, or undetermined -> REVIEW
 * - Empty checks -> REVIEW
 * - Sanctions flag takes priority over other flags
 */
export class DecisionAggregator {
  private readonly flagCheckIds: Set<string>;
  private readonly criterionNames: Map<string, string>;

  constructor(options?: DecisionAggregatorOptions) {
    this.flagCheckIds = options?.flagCheckIds ?? DEFAULT_FLAG_CHECK_IDS;
    this.criterionNames = options?.criterionNames ?? new Map();
  }

  computeDecision(outcomes: CheckOutcome[]): Decision {
    if (outcomes.length === 0) {
      return {
        status: "REVIEW",
        flagCount: 0,
        summary: "No checks were completed.",
        reasons: [],
      };
    }

    const nonPassOutcomes = outcomes.filter((o) => o.status !== "pass");
    const sanctionsFlag = outcomes.some(
      (o) => this.flagCheckIds.has(o.checkId) && o.status === "flag",
    );

    const reasons: DecisionReason[] = nonPassOutcomes.map((o) => ({
      checkId: o.checkId,
      criterion: this.criterionNames.get(o.checkId) ?? o.checkId,
      detail: o.evidence,
    }));

    if (sanctionsFlag) {
      return {
        status: "FLAG",
        flagCount: nonPassOutcomes.length,
        summary: "Sanctions screening flagged — requires immediate review.",
        reasons,
      };
    }

    if (nonPassOutcomes.length > 0) {
      const issueTypes = nonPassOutcomes.map((o) => o.status);
      const hasError = issueTypes.includes("error");
      const hasUndetermined = issueTypes.includes("undetermined");
      const hasFlag = issueTypes.includes("flag");

      let summary = "Some criteria require manual review.";
      if (hasError) summary = "Check errors occurred — manual review required.";
      else if (hasFlag) summary = "Non-critical flags detected — manual review required.";
      else if (hasUndetermined)
        summary = "Some criteria could not be determined — manual review required.";

      return {
        status: "REVIEW",
        flagCount: nonPassOutcomes.length,
        summary,
        reasons,
      };
    }

    return {
      status: "PASS",
      flagCount: 0,
      summary: "All verification criteria passed.",
      reasons: [],
    };
  }
}
