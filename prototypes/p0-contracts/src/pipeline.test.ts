import { describe, it, expect } from "vitest";
import {
  CheckDeclarationSchema,
  CheckOutcomeSchema,
  PipelineStateSchema,
  PipelineEventSchema,
} from "./pipeline.js";

// --- CheckDeclaration ---

describe("CheckDeclaration", () => {
  it("accepts a valid check declaration", () => {
    const decl = {
      id: "sanctions-screening",
      name: "Sanctions and Export Control Screening",
      requiredFields: ["name", "institution"],
      needsConsent: false,
      description: "Checks US Consolidated Screening List",
    };
    const parsed = CheckDeclarationSchema.parse(decl);
    expect(parsed.id).toBe("sanctions-screening");
    expect(parsed.requiredFields).toEqual(["name", "institution"]);
    expect(parsed.needsConsent).toBe(false);
  });

  it("accepts a check that needs consent", () => {
    const decl = {
      id: "pi-contact",
      name: "PI Contact Verification",
      requiredFields: ["name", "email", "institution"],
      needsConsent: true,
      description: "Contacts the customer's PI to verify affiliation",
    };
    expect(CheckDeclarationSchema.parse(decl).needsConsent).toBe(true);
  });

  it("rejects missing id", () => {
    expect(() =>
      CheckDeclarationSchema.parse({
        name: "Test",
        requiredFields: [],
        needsConsent: false,
      })
    ).toThrow();
  });

  it("rejects missing requiredFields", () => {
    expect(() =>
      CheckDeclarationSchema.parse({ id: "x", name: "X", needsConsent: false })
    ).toThrow();
  });
});

// --- CheckOutcome ---

describe("CheckOutcome", () => {
  it("accepts a passing check outcome", () => {
    const outcome = {
      checkId: "sanctions-screening",
      status: "pass" as const,
      evidence: "No matches found on US Consolidated Screening List",
      sources: ["screen1"],
    };
    const parsed = CheckOutcomeSchema.parse(outcome);
    expect(parsed.status).toBe("pass");
  });

  it("accepts a flagged outcome", () => {
    const outcome = {
      checkId: "sanctions-screening",
      status: "flag" as const,
      evidence: "Entity matched on SDN list",
      sources: ["screen1", "screen2"],
    };
    expect(CheckOutcomeSchema.parse(outcome).status).toBe("flag");
  });

  it("accepts an error outcome with errorDetail", () => {
    const outcome = {
      checkId: "web-search",
      status: "error" as const,
      evidence: "",
      sources: [],
      errorDetail: "Tavily API timeout",
    };
    const parsed = CheckOutcomeSchema.parse(outcome);
    expect(parsed.errorDetail).toBe("Tavily API timeout");
  });

  it("rejects invalid status", () => {
    expect(() =>
      CheckOutcomeSchema.parse({
        checkId: "x",
        status: "maybe",
        evidence: "",
        sources: [],
      })
    ).toThrow();
  });

  it("rejects missing checkId", () => {
    expect(() =>
      CheckOutcomeSchema.parse({ status: "pass", evidence: "ok", sources: [] })
    ).toThrow();
  });
});

// --- PipelineState ---

describe("PipelineState", () => {
  it("accepts a valid pipeline state", () => {
    const state = {
      screeningId: "scr-123",
      status: "running" as const,
      completedFields: ["name", "email"],
      pendingChecks: ["web-search"],
      runningChecks: ["sanctions-screening"],
      completedChecks: [],
      outcomes: [],
      consentState: {},
      decision: null,
      createdAt: "2026-03-05T00:00:00Z",
      updatedAt: "2026-03-05T00:01:00Z",
    };
    const parsed = PipelineStateSchema.parse(state);
    expect(parsed.status).toBe("running");
    expect(parsed.runningChecks).toEqual(["sanctions-screening"]);
  });

  it("accepts a completed pipeline state with decision", () => {
    const state = {
      screeningId: "scr-456",
      status: "completed" as const,
      completedFields: ["name", "email", "institution"],
      pendingChecks: [],
      runningChecks: [],
      completedChecks: ["sanctions-screening", "web-search"],
      outcomes: [
        {
          checkId: "sanctions-screening",
          status: "pass" as const,
          evidence: "No matches",
          sources: ["screen1"],
        },
      ],
      consentState: { "pi-contact": "granted" as const },
      decision: {
        status: "PASS" as const,
        flagCount: 0,
        summary: "All checks passed",
        reasons: [],
      },
      createdAt: "2026-03-05T00:00:00Z",
      updatedAt: "2026-03-05T00:05:00Z",
    };
    const parsed = PipelineStateSchema.parse(state);
    expect(parsed.decision?.status).toBe("PASS");
  });

  it("rejects invalid pipeline status", () => {
    expect(() =>
      PipelineStateSchema.parse({
        screeningId: "x",
        status: "paused",
        completedFields: [],
        pendingChecks: [],
        runningChecks: [],
        completedChecks: [],
        outcomes: [],
        consentState: {},
        decision: null,
        createdAt: "2026-03-05T00:00:00Z",
        updatedAt: "2026-03-05T00:00:00Z",
      })
    ).toThrow();
  });
});

// --- PipelineEvent ---

describe("PipelineEvent", () => {
  it("accepts a field_completed event", () => {
    const event = {
      type: "field_completed" as const,
      screeningId: "scr-123",
      timestamp: "2026-03-05T00:00:00Z",
      fieldId: "email",
      fieldValue: "user@example.com",
    };
    expect(PipelineEventSchema.parse(event).type).toBe("field_completed");
  });

  it("accepts a check_started event", () => {
    const event = {
      type: "check_started" as const,
      screeningId: "scr-123",
      timestamp: "2026-03-05T00:00:00Z",
      checkId: "sanctions-screening",
    };
    expect(PipelineEventSchema.parse(event).type).toBe("check_started");
  });

  it("accepts a check_completed event", () => {
    const event = {
      type: "check_completed" as const,
      screeningId: "scr-123",
      timestamp: "2026-03-05T00:00:00Z",
      checkId: "sanctions-screening",
      outcome: {
        checkId: "sanctions-screening",
        status: "pass" as const,
        evidence: "No matches",
        sources: [],
      },
    };
    expect(PipelineEventSchema.parse(event).type).toBe("check_completed");
  });

  it("accepts a consent_requested event", () => {
    const event = {
      type: "consent_requested" as const,
      screeningId: "scr-123",
      timestamp: "2026-03-05T00:00:00Z",
      checkId: "pi-contact",
      description: "Contact your PI to verify affiliation",
    };
    expect(PipelineEventSchema.parse(event).type).toBe("consent_requested");
  });

  it("accepts a consent_received event", () => {
    const event = {
      type: "consent_received" as const,
      screeningId: "scr-123",
      timestamp: "2026-03-05T00:00:00Z",
      checkId: "pi-contact",
      granted: true,
    };
    expect(PipelineEventSchema.parse(event).type).toBe("consent_received");
  });

  it("accepts an action_proposed event", () => {
    const event = {
      type: "action_proposed" as const,
      screeningId: "scr-123",
      timestamp: "2026-03-05T00:00:00Z",
      actionId: "send-verification-email",
      description: "Send verification email to institution",
      requiresConsent: true,
    };
    expect(PipelineEventSchema.parse(event).type).toBe("action_proposed");
  });

  it("accepts a pipeline_complete event", () => {
    const event = {
      type: "pipeline_complete" as const,
      screeningId: "scr-123",
      timestamp: "2026-03-05T00:00:00Z",
      decision: {
        status: "PASS" as const,
        flagCount: 0,
        summary: "All clear",
        reasons: [],
      },
    };
    expect(PipelineEventSchema.parse(event).type).toBe("pipeline_complete");
  });

  it("accepts an error event", () => {
    const event = {
      type: "error" as const,
      screeningId: "scr-123",
      timestamp: "2026-03-05T00:00:00Z",
      message: "Pipeline crashed",
      checkId: "web-search",
    };
    expect(PipelineEventSchema.parse(event).type).toBe("error");
  });

  it("rejects an event with unknown type", () => {
    expect(() =>
      PipelineEventSchema.parse({
        type: "unknown",
        screeningId: "x",
        timestamp: "2026-03-05T00:00:00Z",
      })
    ).toThrow();
  });
});
