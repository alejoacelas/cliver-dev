import { describe, it, expect } from "vitest";
import type { SSEEvent } from "@cliver/contracts";
import { filterForView } from "../src/event-router.js";

// --- Test fixtures ---

const statusEvent: SSEEvent = {
  type: "status",
  screeningId: "s1",
  message: "Running identity check...",
};

const toolCallEvent: SSEEvent = {
  type: "tool_call",
  screeningId: "s1",
  tool: "web_search",
  args: { query: "John Doe institution" },
};

const toolResultEvent: SSEEvent = {
  type: "tool_result",
  screeningId: "s1",
  tool: "web_search",
  id: "web1",
  count: 5,
};

const deltaEvent: SSEEvent = {
  type: "delta",
  screeningId: "s1",
  content: "Based on the evidence...",
};

const completeEvent: SSEEvent = {
  type: "complete",
  screeningId: "s1",
  data: {
    decision: { status: "PASS", flagCount: 0, summary: "All checks passed", reasons: [] },
    checks: [
      {
        criterion: "Customer Institutional Affiliation",
        status: "NO FLAG",
        evidence: "Affiliated with MIT",
        sources: ["web1"],
      },
    ],
    backgroundWork: [
      {
        relevance: 5,
        organism: "E. coli",
        summary: "Published work on E. coli metabolic engineering",
        sources: ["web2"],
      },
    ],
    audit: {
      toolCalls: [{ tool: "web_search", args: { q: "test" }, duration: 1200 }],
      raw: { verification: "raw text here", work: "raw work text" },
    },
  },
};

const errorEvent: SSEEvent = {
  type: "error",
  screeningId: "s1",
  message: "Pipeline failed: timeout",
};

const consentRequestEvent: SSEEvent = {
  type: "consent_request",
  screeningId: "s1",
  checkId: "sanctions_check",
  description: "We need to run a sanctions screening. Do you consent?",
};

const actionProposedEvent: SSEEvent = {
  type: "action_proposed",
  screeningId: "s1",
  actionId: "follow_up_email",
  description: "Send a follow-up verification email",
  requiresConsent: true,
};

const fieldEvent: SSEEvent = {
  type: "field_event",
  screeningId: "s1",
  fieldId: "email",
  status: "received",
};

const allEvents: SSEEvent[] = [
  statusEvent,
  toolCallEvent,
  toolResultEvent,
  deltaEvent,
  completeEvent,
  errorEvent,
  consentRequestEvent,
  actionProposedEvent,
  fieldEvent,
];

// --- Tests ---

describe("EventRouter — filterForView", () => {
  describe("customer view", () => {
    it("passes consent_request events", () => {
      expect(filterForView(consentRequestEvent, "customer")).toEqual(
        consentRequestEvent,
      );
    });

    it("passes action_proposed events", () => {
      expect(filterForView(actionProposedEvent, "customer")).toEqual(
        actionProposedEvent,
      );
    });

    it("passes status events", () => {
      expect(filterForView(statusEvent, "customer")).toEqual(statusEvent);
    });

    it("passes field_event events", () => {
      expect(filterForView(fieldEvent, "customer")).toEqual(fieldEvent);
    });

    it("passes complete events with redacted data (decision only)", () => {
      const result = filterForView(completeEvent, "customer");
      expect(result).not.toBeNull();
      expect(result!.type).toBe("complete");
      if (result!.type === "complete") {
        // Decision is preserved.
        expect(result!.data.decision).toEqual({ status: "PASS", flagCount: 0, summary: "All checks passed", reasons: [] });
        // Evidence details are stripped.
        expect(result!.data.checks).toEqual([]);
        expect(result!.data.backgroundWork).toBeNull();
        expect(result!.data.audit.toolCalls).toEqual([]);
        expect(result!.data.audit.raw.verification).toBe("");
        expect(result!.data.audit.raw.work).toBeNull();
      }
    });

    it("blocks tool_call events", () => {
      expect(filterForView(toolCallEvent, "customer")).toBeNull();
    });

    it("blocks tool_result events", () => {
      expect(filterForView(toolResultEvent, "customer")).toBeNull();
    });

    it("blocks delta events", () => {
      expect(filterForView(deltaEvent, "customer")).toBeNull();
    });

    it("blocks error events", () => {
      expect(filterForView(errorEvent, "customer")).toBeNull();
    });
  });

  describe("provider view", () => {
    it("passes all event types", () => {
      for (const event of allEvents) {
        const result = filterForView(event, "provider");
        expect(result).not.toBeNull();
        // Provider gets unredacted events.
        expect(result).toEqual(event);
      }
    });

    it("passes complete events with full data", () => {
      const result = filterForView(completeEvent, "provider");
      expect(result).not.toBeNull();
      if (result!.type === "complete") {
        expect(result!.data.checks).toHaveLength(1);
        expect(result!.data.backgroundWork).toHaveLength(1);
        expect(result!.data.audit.toolCalls).toHaveLength(1);
      }
    });
  });

  describe("debug view", () => {
    it("passes all event types unfiltered", () => {
      for (const event of allEvents) {
        const result = filterForView(event, "debug");
        expect(result).toEqual(event);
      }
    });
  });
});
