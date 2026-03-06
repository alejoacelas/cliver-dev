import { describe, it, expect } from "vitest";
import { SSEEventSchema, ViewFilterSchema } from "./sse.js";

describe("ViewFilter", () => {
  it("accepts customer, provider, debug", () => {
    expect(ViewFilterSchema.parse("customer")).toBe("customer");
    expect(ViewFilterSchema.parse("provider")).toBe("provider");
    expect(ViewFilterSchema.parse("debug")).toBe("debug");
  });

  it("rejects invalid filter", () => {
    expect(() => ViewFilterSchema.parse("admin")).toThrow();
  });
});

describe("SSEEvent", () => {
  it("accepts a status event", () => {
    const event = { type: "status" as const, screeningId: "scr-123", message: "Running verification checks..." };
    const parsed = SSEEventSchema.parse(event);
    expect(parsed.type).toBe("status");
    if (parsed.type === "status") {
      expect(parsed.message).toBe("Running verification checks...");
    }
  });

  it("accepts a tool_call event", () => {
    const event = {
      type: "tool_call" as const,
      screeningId: "scr-123",
      tool: "search_web",
      args: { query: "MIT biology department" },
    };
    const parsed = SSEEventSchema.parse(event);
    expect(parsed.type).toBe("tool_call");
  });

  it("accepts a tool_result event", () => {
    const event = {
      type: "tool_result" as const,
      screeningId: "scr-123",
      tool: "search_web",
      id: "web1",
      count: 5,
    };
    const parsed = SSEEventSchema.parse(event);
    if (parsed.type === "tool_result") {
      expect(parsed.count).toBe(5);
    }
  });

  it("accepts a delta event", () => {
    const event = { type: "delta" as const, screeningId: "scr-123", content: "## Verification Analysis\n\n..." };
    const parsed = SSEEventSchema.parse(event);
    if (parsed.type === "delta") {
      expect(parsed.content).toContain("Verification");
    }
  });

  it("accepts a complete event", () => {
    const event = {
      type: "complete" as const,
      screeningId: "scr-123",
      data: {
        decision: { status: "PASS" as const, flagCount: 0, summary: "All clear", reasons: [] },
        checks: [],
        backgroundWork: null,
        audit: { toolCalls: [], raw: { verification: "text", work: null } },
      },
    };
    const parsed = SSEEventSchema.parse(event);
    expect(parsed.type).toBe("complete");
  });

  it("accepts an error event", () => {
    const event = { type: "error" as const, screeningId: "scr-123", message: "Pipeline crashed" };
    expect(SSEEventSchema.parse(event).type).toBe("error");
  });

  it("accepts a consent_request event", () => {
    const event = {
      type: "consent_request" as const,
      checkId: "pi-contact",
      description: "Contact your PI",
      screeningId: "scr-123",
    };
    expect(SSEEventSchema.parse(event).type).toBe("consent_request");
  });

  it("accepts an action_proposed event", () => {
    const event = {
      type: "action_proposed" as const,
      actionId: "send-email",
      description: "Send verification email",
      requiresConsent: true,
      screeningId: "scr-123",
    };
    expect(SSEEventSchema.parse(event).type).toBe("action_proposed");
  });

  it("accepts a field_event", () => {
    const event = {
      type: "field_event" as const,
      fieldId: "email",
      status: "completed" as const,
      screeningId: "scr-123",
    };
    expect(SSEEventSchema.parse(event).type).toBe("field_event");
  });

  it("rejects an event with unknown type", () => {
    expect(() => SSEEventSchema.parse({ type: "unknown" })).toThrow();
  });

  it("rejects a status event without message", () => {
    expect(() => SSEEventSchema.parse({ type: "status" })).toThrow();
  });

  it("rejects a tool_call event without tool", () => {
    expect(() => SSEEventSchema.parse({ type: "tool_call", screeningId: "scr-123", args: {} })).toThrow();
  });
});
