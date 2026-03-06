import { z } from "zod";
import { DecisionStatusSchema, DecisionSchema } from "./decision.js";

// NOTE: These schemas use camelCase field names. The existing extraction APIs
// (OpenRouter structured outputs) return snake_case. P3 (check executors + AI layer)
// is responsible for converting snake_case API responses to these camelCase shapes.

// --- VerificationCriterion ---

/**
 * The 4 verification criteria used in KYC screening.
 * These are the specific checks the AI evaluates for each customer.
 */
export const VERIFICATION_CRITERIA = [
  "Customer Institutional Affiliation",
  "Institution Type and Biomedical Focus",
  "Email Domain Verification",
  "Sanctions and Export Control Screening",
] as const;

export const VerificationCriterionSchema = z.enum(VERIFICATION_CRITERIA);

export type VerificationCriterion = z.infer<typeof VerificationCriterionSchema>;

// --- FlagStatus ---

export const FlagStatusSchema = z.enum(["FLAG", "NO FLAG", "UNDETERMINED"]);

export type FlagStatus = z.infer<typeof FlagStatusSchema>;

// --- Evidence ---

/**
 * A single row of verification evidence. Each row links a criterion
 * to the sources and summary that support the determination.
 *
 * Maps to the existing VERIFICATION_EVIDENCE_SCHEMA JSON Schema.
 * Field names use camelCase (the JSON Schema version uses snake_case;
 * conversion happens at the boundary).
 */
export const EvidenceRowSchema = z.object({
  criterion: VerificationCriterionSchema,
  /** Tool citation IDs (e.g., "web1", "screen1"). */
  sources: z.array(z.string()),
  /** Factual description of what the sources state. */
  evidenceSummary: z.string(),
});

export type EvidenceRow = z.infer<typeof EvidenceRowSchema>;

export const EvidenceSchema = z.object({
  rows: z.array(EvidenceRowSchema),
});

export type Evidence = z.infer<typeof EvidenceSchema>;

// --- Determination ---

/**
 * A single determination row. Links a criterion to its flag status.
 *
 * Maps to the existing VERIFICATION_DETERMINATION_SCHEMA JSON Schema.
 */
export const DeterminationRowSchema = z.object({
  criterion: VerificationCriterionSchema,
  flag: FlagStatusSchema,
});

export type DeterminationRow = z.infer<typeof DeterminationRowSchema>;

export const DeterminationSchema = z.object({
  rows: z.array(DeterminationRowSchema),
});

export type Determination = z.infer<typeof DeterminationSchema>;

// --- BackgroundWork ---

/**
 * A single background work row. Describes a piece of relevant
 * laboratory work found for the customer or their institution.
 *
 * Maps to the existing BACKGROUND_WORK_SCHEMA JSON Schema.
 */
export const BackgroundWorkRowSchema = z.object({
  /**
   * 5 = customer/same organism, 4 = customer/related organism,
   * 3 = customer/any, 2 = institution/same organism,
   * 1 = institution/related organism.
   */
  relevanceLevel: z.number().int().min(1).max(5),
  /** The organism as named in the source. */
  organism: z.string(),
  /** Tool citation IDs. */
  sources: z.array(z.string()),
  /** One-sentence factual description of the work. */
  workSummary: z.string(),
});

export type BackgroundWorkRow = z.infer<typeof BackgroundWorkRowSchema>;

export const BackgroundWorkSchema = z.object({
  rows: z.array(BackgroundWorkRowSchema),
});

export type BackgroundWork = z.infer<typeof BackgroundWorkSchema>;

// --- CompleteData ---

/**
 * The full structured output of a completed screening.
 *
 * This refines the existing CompleteData interface from the tool codebase:
 * - decision.status is now the "PASS"|"FLAG"|"REVIEW" union (was `string`)
 * - checks[].status is now the "FLAG"|"NO FLAG"|"UNDETERMINED" union (was `string`)
 * - checks[].criterion is now the VerificationCriterion union (was `string`)
 * - backgroundWork items have typed fields
 * - audit.toolCalls items have typed fields
 */
// This is the DISPLAY shape (criterion-oriented, what the UI renders).
// CheckOutcome in pipeline.ts is the PIPELINE shape (check-oriented, what the orchestrator produces).
// P2's decision aggregator maps CheckOutcomes to CompleteDataChecks.
export const CompleteDataCheckSchema = z.object({
  criterion: VerificationCriterionSchema,
  status: FlagStatusSchema,
  evidence: z.string(),
  sources: z.array(z.string()),
});

export type CompleteDataCheck = z.infer<typeof CompleteDataCheckSchema>;

export const AuditToolCallSchema = z.object({
  tool: z.string(),
  args: z.record(z.string(), z.unknown()).optional(),
  duration: z.number().optional(),
});

export type AuditToolCall = z.infer<typeof AuditToolCallSchema>;

export const CompleteDataBackgroundWorkItemSchema = z.object({
  relevance: z.number().int().min(1).max(5),
  organism: z.string(),
  summary: z.string(),
  sources: z.array(z.string()),
});

export type CompleteDataBackgroundWorkItem = z.infer<typeof CompleteDataBackgroundWorkItemSchema>;

export const CompleteDataSchema = z.object({
  decision: DecisionSchema,
  checks: z.array(CompleteDataCheckSchema),
  backgroundWork: z.array(CompleteDataBackgroundWorkItemSchema).nullable(),
  audit: z.object({
    toolCalls: z.array(AuditToolCallSchema),
    raw: z.object({
      verification: z.string(),
      work: z.string().nullable(),
    }),
  }),
});

export type CompleteData = z.infer<typeof CompleteDataSchema>;

// --- ToolResult ---

/**
 * Normalized output from any tool execution. This is the shape
 * that all tool implementations return, regardless of the underlying API.
 *
 * Refines the existing ToolOutput interface (was { items: Record<string, any>[]; metadata: Record<string, any> })
 * by adding `tool` and `query` fields for traceability.
 */
export const ToolResultSchema = z.object({
  /** Which tool produced this result. */
  tool: z.string(),
  /** The query or input that was sent to the tool. */
  query: z.unknown(),
  /** The result items. Shape varies by tool. */
  items: z.array(z.record(z.string(), z.unknown())),
  /** Tool-specific metadata (timing, errors, pagination, etc.). */
  metadata: z.record(z.string(), z.unknown()),
});

export type ToolResult = z.infer<typeof ToolResultSchema>;
