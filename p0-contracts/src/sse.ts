import { z } from "zod";
import { CompleteDataSchema } from "./data.js";

// --- ViewFilter ---

/**
 * Controls which SSE events a client receives.
 *
 * - "customer": Only consent requests, field acknowledgments, and final status.
 * - "provider": Full evidence, determinations, audit trail, and decision details.
 * - "debug": Everything including raw pipeline internals, timing, and tool I/O.
 */
export const ViewFilterSchema = z.enum(["customer", "provider", "debug"]);

export type ViewFilter = z.infer<typeof ViewFilterSchema>;

// --- SSEEvent ---

/**
 * Server-Sent Events emitted during a screening session.
 *
 * This is a proper discriminated union on `type`, replacing the
 * existing `SSEEvent` interface that used `[key: string]: any`.
 *
 * Original event types (status, tool_call, tool_result, delta, complete, error)
 * are preserved with typed fields. New types added:
 * - consent_request: Sent to customers when a check needs their permission.
 * - action_proposed: Sent when the AI proposes a follow-up action.
 * - field_event: Sent when a form field is acknowledged by the backend.
 */
// Relationship to PipelineEvent (pipeline.ts):
// P5 (event routing) maps PipelineEvents to SSEEvents, filtering by ViewFilter.
// Not all pipeline events have SSE equivalents; some SSE events (delta, tool_call)
// are emitted directly by the AI layer and have no pipeline event counterpart.
export const SSEEventSchema = z.discriminatedUnion("type", [
  // --- Existing event types, now with typed fields ---

  z.object({
    type: z.literal("status"),
    screeningId: z.string(),
    message: z.string(),
  }),

  z.object({
    type: z.literal("tool_call"),
    screeningId: z.string(),
    tool: z.string(),
    args: z.record(z.string(), z.unknown()),
  }),

  z.object({
    type: z.literal("tool_result"),
    screeningId: z.string(),
    tool: z.string(),
    id: z.string(),
    count: z.number().int(),
  }),

  z.object({
    type: z.literal("delta"),
    screeningId: z.string(),
    content: z.string(),
  }),

  z.object({
    type: z.literal("complete"),
    screeningId: z.string(),
    data: CompleteDataSchema,
  }),

  z.object({
    type: z.literal("error"),
    screeningId: z.string(),
    message: z.string(),
  }),

  // --- New event types for the extended platform ---

  z.object({
    type: z.literal("consent_request"),
    screeningId: z.string(),
    checkId: z.string(),
    description: z.string(),
  }),

  z.object({
    type: z.literal("action_proposed"),
    screeningId: z.string(),
    actionId: z.string(),
    description: z.string(),
    requiresConsent: z.boolean(),
  }),

  z.object({
    type: z.literal("field_event"),
    screeningId: z.string(),
    fieldId: z.string(),
    status: z.enum(["received", "completed", "error"]),
  }),
]);

export type SSEEvent = z.infer<typeof SSEEventSchema>;
