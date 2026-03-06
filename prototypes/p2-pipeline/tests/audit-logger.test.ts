import { describe, it, expect, beforeEach } from "vitest";
import { AuditLogger } from "../src/audit-logger.js";
import type { PipelineEvent } from "@cliver/contracts";

const makeEvent = (
  type: PipelineEvent["type"],
  screeningId: string,
  extra: Record<string, unknown> = {},
): PipelineEvent =>
  ({
    type,
    screeningId,
    timestamp: new Date().toISOString(),
    ...extra,
  }) as PipelineEvent;

describe("AuditLogger", () => {
  let logger: AuditLogger;

  beforeEach(() => {
    logger = new AuditLogger();
  });

  it("logs a field_completed event", async () => {
    const event = makeEvent("field_completed", "scr-1", {
      fieldId: "email",
      fieldValue: "test@example.com",
    });
    await logger.log(event);
    const results = await logger.query({ screeningId: "scr-1" });
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(event);
  });

  it("logs multiple events in order", async () => {
    const e1 = makeEvent("field_completed", "scr-1", {
      fieldId: "email",
      fieldValue: "a@b.com",
    });
    const e2 = makeEvent("check_started", "scr-1", { checkId: "domain" });
    const e3 = makeEvent("check_completed", "scr-1", {
      checkId: "domain",
      outcome: {
        checkId: "domain",
        status: "pass",
        evidence: "Valid domain",
        sources: ["web1"],
      },
    });
    await logger.log(e1);
    await logger.log(e2);
    await logger.log(e3);
    const results = await logger.query({ screeningId: "scr-1" });
    expect(results).toHaveLength(3);
    expect(results[0].type).toBe("field_completed");
    expect(results[1].type).toBe("check_started");
    expect(results[2].type).toBe("check_completed");
  });

  it("query by screeningId returns full timeline", async () => {
    await logger.log(makeEvent("field_completed", "scr-1", { fieldId: "email", fieldValue: "x" }));
    await logger.log(makeEvent("field_completed", "scr-2", { fieldId: "name", fieldValue: "y" }));
    await logger.log(makeEvent("check_started", "scr-1", { checkId: "domain" }));

    const scr1 = await logger.query({ screeningId: "scr-1" });
    expect(scr1).toHaveLength(2);
    expect(scr1.every((e) => e.screeningId === "scr-1")).toBe(true);

    const scr2 = await logger.query({ screeningId: "scr-2" });
    expect(scr2).toHaveLength(1);
  });

  it("query by event type filters correctly", async () => {
    await logger.log(makeEvent("field_completed", "scr-1", { fieldId: "email", fieldValue: "x" }));
    await logger.log(makeEvent("check_started", "scr-1", { checkId: "domain" }));
    await logger.log(makeEvent("consent_requested", "scr-1", { checkId: "sanctions", description: "Need consent" }));

    const checkEvents = await logger.query({ type: "check_started" });
    expect(checkEvents).toHaveLength(1);
    expect(checkEvents[0].type).toBe("check_started");
  });

  it("query by screeningId AND type", async () => {
    await logger.log(makeEvent("check_started", "scr-1", { checkId: "domain" }));
    await logger.log(makeEvent("check_started", "scr-2", { checkId: "domain" }));
    await logger.log(makeEvent("field_completed", "scr-1", { fieldId: "email", fieldValue: "x" }));

    const results = await logger.query({ screeningId: "scr-1", type: "check_started" });
    expect(results).toHaveLength(1);
    expect(results[0].screeningId).toBe("scr-1");
    expect(results[0].type).toBe("check_started");
  });

  it("query with no filter returns all events", async () => {
    await logger.log(makeEvent("field_completed", "scr-1", { fieldId: "email", fieldValue: "x" }));
    await logger.log(makeEvent("check_started", "scr-2", { checkId: "domain" }));
    const all = await logger.query({});
    expect(all).toHaveLength(2);
  });

  it("every pipeline event type can be logged", async () => {
    const types: Array<{ type: PipelineEvent["type"]; extra: Record<string, unknown> }> = [
      { type: "field_completed", extra: { fieldId: "email", fieldValue: "x" } },
      { type: "check_started", extra: { checkId: "domain" } },
      {
        type: "check_completed",
        extra: {
          checkId: "domain",
          outcome: { checkId: "domain", status: "pass", evidence: "ok", sources: [] },
        },
      },
      { type: "consent_requested", extra: { checkId: "sanctions", description: "desc" } },
      { type: "consent_received", extra: { checkId: "sanctions", granted: true } },
      { type: "action_proposed", extra: { actionId: "act-1", description: "desc", requiresConsent: true } },
      {
        type: "pipeline_complete",
        extra: {
          decision: { status: "PASS", flagCount: 0, summary: "All good", reasons: [] },
        },
      },
      { type: "error", extra: { message: "Something failed", checkId: "domain" } },
    ];

    for (const { type, extra } of types) {
      await logger.log(makeEvent(type, "scr-1", extra));
    }

    const all = await logger.query({ screeningId: "scr-1" });
    expect(all).toHaveLength(types.length);
  });
});
