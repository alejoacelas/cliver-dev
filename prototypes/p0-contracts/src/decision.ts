import { z } from "zod";

// --- DecisionStatus ---

export const DecisionStatusSchema = z.enum(["PASS", "FLAG", "REVIEW"]);

export type DecisionStatus = z.infer<typeof DecisionStatusSchema>;

// --- DecisionReason ---

/**
 * A single reason contributing to a FLAG or REVIEW decision.
 * Links a specific check and criterion to a human-readable explanation.
 */
export const DecisionReasonSchema = z.object({
  /** The check that produced this reason. */
  checkId: z.string(),
  /** The verification criterion this reason relates to. */
  criterion: z.string(),
  /** Human-readable explanation of the flag or concern. */
  detail: z.string(),
});

export type DecisionReason = z.infer<typeof DecisionReasonSchema>;

// --- Decision ---

/**
 * The aggregated screening decision after all checks complete.
 *
 * - PASS: All criteria satisfied, no flags.
 * - FLAG: At least one hard flag (e.g., sanctions match). Requires immediate action.
 * - REVIEW: At least one soft flag (e.g., undetermined affiliation). Requires manual review.
 */
export const DecisionSchema = z.object({
  status: DecisionStatusSchema,
  /** Number of flagged or undetermined criteria. Must be >= 0. */
  flagCount: z.number().int().min(0),
  /** Human-readable summary of the decision (under 25 words). */
  summary: z.string(),
  /** The specific reasons that contributed to a FLAG or REVIEW status. Empty for PASS. */
  reasons: z.array(DecisionReasonSchema),
});

export type Decision = z.infer<typeof DecisionSchema>;
