import { z } from "zod";
import { DecisionSchema } from "./decision.js";

// --- CheckDeclaration ---

/**
 * Declares a check that can be run in the screening pipeline.
 * The pipeline scheduler uses this to determine when a check's
 * prerequisites are met and whether consent is needed.
 */
export const CheckDeclarationSchema = z.object({
  /** Unique identifier for this check type. */
  id: z.string(),
  /** Human-readable name shown in the UI. */
  name: z.string(),
  /** Form field IDs that must be completed before this check can run. */
  requiredFields: z.array(z.string()),
  /** Whether this check requires customer consent before execution. */
  needsConsent: z.boolean(),
  /** Human-readable description of what this check does. */
  description: z.string().optional(),
});

export type CheckDeclaration = z.infer<typeof CheckDeclarationSchema>;

// --- CheckOutcome ---

export const CheckOutcomeStatusSchema = z.enum([
  "pass",
  "flag",
  "undetermined",
  "error",
]);

export type CheckOutcomeStatus = z.infer<typeof CheckOutcomeStatusSchema>;

/**
 * The result of executing a single check.
 */
export const CheckOutcomeSchema = z.object({
  /** The check declaration ID that produced this outcome. */
  checkId: z.string(),
  /** The check's determination. */
  status: CheckOutcomeStatusSchema,
  /** Human-readable summary of the evidence found. */
  evidence: z.string(),
  /** Tool citation IDs (e.g., "web1", "screen2") supporting this outcome. */
  sources: z.array(z.string()),
  /** If status is "error", a description of what went wrong. */
  errorDetail: z.string().optional(),
});

export type CheckOutcome = z.infer<typeof CheckOutcomeSchema>;

// --- ConsentStatus ---

export const ConsentStatusSchema = z.enum(["pending", "granted", "denied", "expired"]);

export type ConsentStatus = z.infer<typeof ConsentStatusSchema>;

// --- PipelineState ---

/**
 * The full state of a screening pipeline at any point in time.
 * This is the central state object that the pipeline scheduler,
 * UI, and aggregator all read from.
 */
export const PipelineStateSchema = z.object({
  /** Unique identifier for this screening session. */
  screeningId: z.string(),
  /** Overall pipeline status. */
  status: z.enum(["pending", "running", "completed", "failed"]),
  /** Form field IDs that the customer has completed so far. */
  completedFields: z.array(z.string()),
  /** Check IDs whose prerequisites are not yet met. */
  pendingChecks: z.array(z.string()),
  /** Check IDs currently executing. */
  runningChecks: z.array(z.string()),
  /** Check IDs that have finished (with any outcome). */
  completedChecks: z.array(z.string()),
  /** Outcomes from completed checks. */
  outcomes: z.array(CheckOutcomeSchema),
  /** Consent state per check ID. Keys are check IDs. */
  consentState: z.record(z.string(), ConsentStatusSchema),
  /** The aggregated decision, or null if the pipeline hasn't completed. */
  decision: DecisionSchema.nullable(),
  /** ISO 8601 timestamp when this screening was created. */
  createdAt: z.string(),
  /** ISO 8601 timestamp of the most recent state change. */
  updatedAt: z.string(),
});

export type PipelineState = z.infer<typeof PipelineStateSchema>;

// --- PipelineEvent ---

/**
 * Events emitted during pipeline execution. These are stored in the
 * audit log and used for real-time UI updates.
 *
 * This is a discriminated union on the `type` field.
 */
const pipelineEventBase = {
  screeningId: z.string(),
  timestamp: z.string(),
};

export const PipelineEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("field_completed"),
    ...pipelineEventBase,
    fieldId: z.string(),
    fieldValue: z.unknown(),
  }),
  z.object({
    type: z.literal("check_started"),
    ...pipelineEventBase,
    checkId: z.string(),
  }),
  z.object({
    type: z.literal("check_completed"),
    ...pipelineEventBase,
    checkId: z.string(),
    outcome: CheckOutcomeSchema,
  }),
  z.object({
    type: z.literal("consent_requested"),
    ...pipelineEventBase,
    checkId: z.string(),
    description: z.string(),
  }),
  z.object({
    type: z.literal("consent_received"),
    ...pipelineEventBase,
    checkId: z.string(),
    granted: z.boolean(),
  }),
  z.object({
    type: z.literal("action_proposed"),
    ...pipelineEventBase,
    actionId: z.string(),
    description: z.string(),
    requiresConsent: z.boolean(),
  }),
  z.object({
    type: z.literal("pipeline_complete"),
    ...pipelineEventBase,
    decision: DecisionSchema,
  }),
  z.object({
    type: z.literal("error"),
    ...pipelineEventBase,
    message: z.string(),
    checkId: z.string().optional(),
  }),
]);

export type PipelineEvent = z.infer<typeof PipelineEventSchema>;
