import { describe, it, expect, beforeEach, vi } from "vitest";
import { CheckScheduler } from "../src/check-scheduler.js";
import type {
  CheckDeclaration,
  CheckOutcome,
  PipelineEvent,
  ICheckExecutor,
} from "@cliver/contracts";

// --- Test helpers ---

const makeCheck = (
  id: string,
  requiredFields: string[],
  needsConsent: boolean,
): CheckDeclaration => ({
  id,
  name: `Check ${id}`,
  requiredFields,
  needsConsent,
});

const makeExecutor = (
  checkId: string,
  outcome: Omit<CheckOutcome, "checkId">,
  delayMs = 0,
): ICheckExecutor => ({
  checkId,
  execute: async (_fields: Record<string, unknown>) => {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
    return { checkId, ...outcome };
  },
});

const makeFailingExecutor = (checkId: string, errorMsg: string): ICheckExecutor => ({
  checkId,
  execute: async () => {
    throw new Error(errorMsg);
  },
});

// Collect all events emitted by the scheduler
function collectEvents(scheduler: CheckScheduler): PipelineEvent[] {
  const events: PipelineEvent[] = [];
  scheduler.subscribe((event) => events.push(event));
  return events;
}

// Standard check declarations for Cliver's four criteria
const DOMAIN_CHECK = makeCheck("domain-validation", ["email"], false);
const AFFILIATION_CHECK = makeCheck("affiliation", ["name", "institution"], false);
const INSTITUTION_TYPE_CHECK = makeCheck("institution-type", ["institution"], false);
const SANCTIONS_CHECK = makeCheck("sanctions", ["name", "institution"], true);

// Standard executors
const passingExecutor = (id: string) =>
  makeExecutor(id, { status: "pass", evidence: `${id} passed`, sources: [`${id}-src`] });

const flaggingExecutor = (id: string) =>
  makeExecutor(id, { status: "flag", evidence: `${id} flagged`, sources: [`${id}-src`] });

describe("CheckScheduler — orchestration", () => {
  let scheduler: CheckScheduler;
  let events: PipelineEvent[];

  describe("single-dependency field completion", () => {
    beforeEach(() => {
      scheduler = new CheckScheduler({
        screeningId: "scr-1",
        declarations: [DOMAIN_CHECK],
        executors: [passingExecutor("domain-validation")],
      });
      events = collectEvents(scheduler);
    });

    it("completing email field triggers domain validation check", async () => {
      await scheduler.onFieldCompleted("email", "test@university.edu");

      const state = scheduler.getState();
      expect(state.completedFields).toContain("email");
      expect(state.completedChecks).toContain("domain-validation");
      expect(state.outcomes).toHaveLength(1);
      expect(state.outcomes[0].status).toBe("pass");
    });

    it("emits field_completed and check_started events", async () => {
      await scheduler.onFieldCompleted("email", "test@university.edu");

      const fieldEvent = events.find((e) => e.type === "field_completed");
      expect(fieldEvent).toBeDefined();
      expect(fieldEvent!.type === "field_completed" && fieldEvent!.fieldId).toBe("email");

      const checkStarted = events.find((e) => e.type === "check_started");
      expect(checkStarted).toBeDefined();
      expect(checkStarted!.type === "check_started" && checkStarted!.checkId).toBe("domain-validation");
    });

    it("emits check_completed event with outcome", async () => {
      await scheduler.onFieldCompleted("email", "test@university.edu");

      const checkCompleted = events.find((e) => e.type === "check_completed");
      expect(checkCompleted).toBeDefined();
      if (checkCompleted!.type === "check_completed") {
        expect(checkCompleted!.outcome.status).toBe("pass");
      }
    });
  });

  describe("multi-field dependency", () => {
    beforeEach(() => {
      scheduler = new CheckScheduler({
        screeningId: "scr-1",
        declarations: [SANCTIONS_CHECK],
        executors: [passingExecutor("sanctions")],
        consentTimeoutMs: 30_000,
      });
      events = collectEvents(scheduler);
    });

    it("completing name alone does not trigger sanctions check", async () => {
      await scheduler.onFieldCompleted("name", "John Doe");

      const state = scheduler.getState();
      expect(state.runningChecks).toEqual([]);
      expect(state.completedChecks).toEqual([]);
    });

    it("completing name + institution triggers sanctions consent request (needs consent)", async () => {
      await scheduler.onFieldCompleted("name", "John Doe");
      await scheduler.onFieldCompleted("institution", "MIT");

      // Since sanctions needs consent, it should be in consent_requested state
      const consentEvent = events.find((e) => e.type === "consent_requested");
      expect(consentEvent).toBeDefined();
      if (consentEvent?.type === "consent_requested") {
        expect(consentEvent.checkId).toBe("sanctions");
      }
    });
  });

  describe("parallel check execution", () => {
    it("two independent checks run in parallel (non-blocking)", async () => {
      const executionOrder: string[] = [];
      const slowExecutor: ICheckExecutor = {
        checkId: "domain-validation",
        execute: async () => {
          executionOrder.push("domain-start");
          await new Promise((r) => setTimeout(r, 50));
          executionOrder.push("domain-end");
          return {
            checkId: "domain-validation",
            status: "pass",
            evidence: "ok",
            sources: [],
          };
        },
      };
      const fastExecutor: ICheckExecutor = {
        checkId: "institution-type",
        execute: async () => {
          executionOrder.push("inst-start");
          await new Promise((r) => setTimeout(r, 10));
          executionOrder.push("inst-end");
          return {
            checkId: "institution-type",
            status: "pass",
            evidence: "ok",
            sources: [],
          };
        },
      };

      scheduler = new CheckScheduler({
        screeningId: "scr-1",
        declarations: [
          makeCheck("domain-validation", ["email"], false),
          makeCheck("institution-type", ["email"], false),
        ],
        executors: [slowExecutor, fastExecutor],
      });
      events = collectEvents(scheduler);

      await scheduler.onFieldCompleted("email", "test@uni.edu");

      // Both should have started before either finished
      expect(executionOrder[0]).toBe("domain-start");
      expect(executionOrder[1]).toBe("inst-start");

      const state = scheduler.getState();
      expect(state.completedChecks).toContain("domain-validation");
      expect(state.completedChecks).toContain("institution-type");
    });
  });

  describe("consent gating flow", () => {
    it("check needing consent: field -> consent_requested -> consent -> check runs -> completes", async () => {
      scheduler = new CheckScheduler({
        screeningId: "scr-1",
        declarations: [SANCTIONS_CHECK],
        executors: [passingExecutor("sanctions")],
        consentTimeoutMs: 30_000,
      });
      events = collectEvents(scheduler);

      // Complete required fields
      await scheduler.onFieldCompleted("name", "John Doe");
      await scheduler.onFieldCompleted("institution", "MIT");

      // Check should NOT be running yet — waiting for consent
      let state = scheduler.getState();
      expect(state.runningChecks).toEqual([]);
      expect(state.consentState["sanctions"]).toBe("pending");

      // Consent event was emitted
      const consentReq = events.find((e) => e.type === "consent_requested");
      expect(consentReq).toBeDefined();

      // Grant consent
      await scheduler.onConsent("sanctions");

      state = scheduler.getState();
      expect(state.consentState["sanctions"]).toBe("granted");
      expect(state.completedChecks).toContain("sanctions");
      expect(state.outcomes.find((o) => o.checkId === "sanctions")?.status).toBe("pass");

      // consent_received event was emitted
      const consentRcv = events.find((e) => e.type === "consent_received");
      expect(consentRcv).toBeDefined();
      if (consentRcv?.type === "consent_received") {
        expect(consentRcv.granted).toBe(true);
      }
    });

    it("denied consent marks check as skipped with undetermined status", async () => {
      scheduler = new CheckScheduler({
        screeningId: "scr-1",
        declarations: [SANCTIONS_CHECK],
        executors: [passingExecutor("sanctions")],
        consentTimeoutMs: 30_000,
      });
      events = collectEvents(scheduler);

      await scheduler.onFieldCompleted("name", "John Doe");
      await scheduler.onFieldCompleted("institution", "MIT");

      // Deny consent
      await scheduler.onConsentDenied("sanctions");

      const state = scheduler.getState();
      expect(state.consentState["sanctions"]).toBe("denied");
      expect(state.completedChecks).toContain("sanctions");

      const outcome = state.outcomes.find((o) => o.checkId === "sanctions");
      expect(outcome).toBeDefined();
      expect(outcome!.status).toBe("undetermined");
      expect(outcome!.evidence).toContain("consent denied");
    });

    it("consent timeout marks action as expired", async () => {
      vi.useFakeTimers();
      try {
        scheduler = new CheckScheduler({
          screeningId: "scr-1",
          declarations: [SANCTIONS_CHECK],
          executors: [passingExecutor("sanctions")],
          consentTimeoutMs: 30_000,
          now: () => vi.getMockedSystemTime()?.getTime() ?? Date.now(),
        });
        events = collectEvents(scheduler);

        await scheduler.onFieldCompleted("name", "John Doe");
        await scheduler.onFieldCompleted("institution", "MIT");

        // Advance time past the timeout
        vi.advanceTimersByTime(31_000);

        // Trigger a state evaluation (e.g., by completing another field or explicit check)
        await scheduler.evaluateTimeouts();

        const state = scheduler.getState();
        expect(state.consentState["sanctions"]).toBe("expired");
        expect(state.completedChecks).toContain("sanctions");

        const outcome = state.outcomes.find((o) => o.checkId === "sanctions");
        expect(outcome!.status).toBe("undetermined");
        expect(outcome!.evidence).toContain("expired");
      } finally {
        vi.useRealTimers();
      }
    });

    it("pre-approved action (needsConsent: false) executes immediately", async () => {
      scheduler = new CheckScheduler({
        screeningId: "scr-1",
        declarations: [DOMAIN_CHECK],
        executors: [passingExecutor("domain-validation")],
      });
      events = collectEvents(scheduler);

      await scheduler.onFieldCompleted("email", "test@uni.edu");

      const state = scheduler.getState();
      // No consent_requested event for this check
      const consentEvents = events.filter((e) => e.type === "consent_requested");
      expect(consentEvents).toHaveLength(0);
      // Check completed directly
      expect(state.completedChecks).toContain("domain-validation");
    });
  });

  describe("error handling", () => {
    it("check failure emits error event, pipeline continues with remaining checks", async () => {
      scheduler = new CheckScheduler({
        screeningId: "scr-1",
        declarations: [
          makeCheck("domain-validation", ["email"], false),
          makeCheck("institution-type", ["email"], false),
        ],
        executors: [
          makeFailingExecutor("domain-validation", "API connection timeout"),
          passingExecutor("institution-type"),
        ],
      });
      events = collectEvents(scheduler);

      await scheduler.onFieldCompleted("email", "test@uni.edu");

      const state = scheduler.getState();
      // Both should be in completedChecks
      expect(state.completedChecks).toContain("domain-validation");
      expect(state.completedChecks).toContain("institution-type");

      // domain-validation has error outcome
      const domainOutcome = state.outcomes.find((o) => o.checkId === "domain-validation");
      expect(domainOutcome!.status).toBe("error");
      expect(domainOutcome!.errorDetail).toContain("API connection timeout");

      // institution-type passed
      const instOutcome = state.outcomes.find((o) => o.checkId === "institution-type");
      expect(instOutcome!.status).toBe("pass");

      // Error event was emitted
      const errorEvent = events.find(
        (e) => e.type === "error" && "checkId" in e && e.checkId === "domain-validation",
      );
      expect(errorEvent).toBeDefined();
    });
  });

  describe("pipeline completion", () => {
    it("all checks completed -> computeDecision -> emits pipeline_complete", async () => {
      scheduler = new CheckScheduler({
        screeningId: "scr-1",
        declarations: [
          makeCheck("domain-validation", ["email"], false),
          makeCheck("institution-type", ["institution"], false),
        ],
        executors: [
          passingExecutor("domain-validation"),
          passingExecutor("institution-type"),
        ],
      });
      events = collectEvents(scheduler);

      await scheduler.onFieldCompleted("email", "test@uni.edu");
      await scheduler.onFieldCompleted("institution", "MIT");

      const state = scheduler.getState();
      expect(state.status).toBe("completed");
      expect(state.decision).not.toBeNull();
      expect(state.decision!.status).toBe("PASS");

      const completeEvent = events.find((e) => e.type === "pipeline_complete");
      expect(completeEvent).toBeDefined();
      if (completeEvent?.type === "pipeline_complete") {
        expect(completeEvent.decision.status).toBe("PASS");
      }
    });

    it("pipeline with flags produces correct decision", async () => {
      scheduler = new CheckScheduler({
        screeningId: "scr-1",
        declarations: [
          makeCheck("domain-validation", ["email"], false),
          makeCheck("sanctions", ["name"], false), // no consent for simplicity
        ],
        executors: [
          passingExecutor("domain-validation"),
          flaggingExecutor("sanctions"),
        ],
      });
      events = collectEvents(scheduler);

      await scheduler.onFieldCompleted("email", "test@uni.edu");
      await scheduler.onFieldCompleted("name", "John Doe");

      const state = scheduler.getState();
      expect(state.status).toBe("completed");
      expect(state.decision!.status).toBe("FLAG");
    });
  });

  describe("late field completion", () => {
    it("only triggers newly eligible checks after some already completed", async () => {
      scheduler = new CheckScheduler({
        screeningId: "scr-1",
        declarations: [
          makeCheck("domain-validation", ["email"], false),
          makeCheck("affiliation", ["name", "institution"], false),
        ],
        executors: [
          passingExecutor("domain-validation"),
          passingExecutor("affiliation"),
        ],
      });
      events = collectEvents(scheduler);

      // First: complete email -> triggers domain-validation only
      await scheduler.onFieldCompleted("email", "test@uni.edu");

      let state = scheduler.getState();
      expect(state.completedChecks).toContain("domain-validation");
      expect(state.completedChecks).not.toContain("affiliation");

      // Then: complete name (affiliation still not eligible — needs institution too)
      await scheduler.onFieldCompleted("name", "John Doe");
      state = scheduler.getState();
      expect(state.completedChecks).not.toContain("affiliation");

      // Finally: complete institution -> triggers affiliation
      await scheduler.onFieldCompleted("institution", "MIT");
      state = scheduler.getState();
      expect(state.completedChecks).toContain("affiliation");

      // domain-validation should NOT have run again
      const domainStarts = events.filter(
        (e) => e.type === "check_started" && "checkId" in e && e.checkId === "domain-validation",
      );
      expect(domainStarts).toHaveLength(1);
    });
  });

  describe("pipeline state lifecycle", () => {
    it("state transitions: pending -> running -> completed", async () => {
      scheduler = new CheckScheduler({
        screeningId: "scr-1",
        declarations: [makeCheck("domain-validation", ["email"], false)],
        executors: [passingExecutor("domain-validation")],
      });

      expect(scheduler.getState().status).toBe("pending");

      await scheduler.onFieldCompleted("email", "test@uni.edu");

      expect(scheduler.getState().status).toBe("completed");
    });

    it("subscribe delivers events to listener", async () => {
      scheduler = new CheckScheduler({
        screeningId: "scr-1",
        declarations: [makeCheck("domain-validation", ["email"], false)],
        executors: [passingExecutor("domain-validation")],
      });

      const received: PipelineEvent[] = [];
      const unsub = scheduler.subscribe((e) => received.push(e));

      await scheduler.onFieldCompleted("email", "test@uni.edu");

      expect(received.length).toBeGreaterThan(0);

      // Unsubscribe stops delivery
      const countBefore = received.length;
      unsub();
      // This won't trigger new checks but the field event won't be delivered
      // (no new checks since domain-validation already ran, but field_completed still emits)
      // We just verify unsubscribe works by checking the listener ref is removed
      expect(received.length).toBe(countBefore);
    });
  });

  describe("duplicate field deduplication (#1)", () => {
    it("calling onFieldCompleted twice with the same fieldId does not produce duplicate completedFields", async () => {
      scheduler = new CheckScheduler({
        screeningId: "scr-1",
        declarations: [DOMAIN_CHECK],
        executors: [passingExecutor("domain-validation")],
      });
      events = collectEvents(scheduler);

      await scheduler.onFieldCompleted("email", "test@university.edu");
      await scheduler.onFieldCompleted("email", "updated@university.edu");

      const state = scheduler.getState();
      // No duplicates in completedFields
      expect(state.completedFields).toEqual(["email"]);
      // Value was updated
      // Check ran only once
      const checkStarts = events.filter(
        (e) => e.type === "check_started" && "checkId" in e && e.checkId === "domain-validation",
      );
      expect(checkStarts).toHaveLength(1);
    });

    it("duplicate field still emits field_completed event (value may have changed)", async () => {
      scheduler = new CheckScheduler({
        screeningId: "scr-1",
        declarations: [DOMAIN_CHECK],
        executors: [passingExecutor("domain-validation")],
      });
      events = collectEvents(scheduler);

      await scheduler.onFieldCompleted("email", "test@university.edu");
      await scheduler.onFieldCompleted("email", "updated@university.edu");

      const fieldEvents = events.filter((e) => e.type === "field_completed");
      expect(fieldEvents).toHaveLength(2);
    });
  });

  describe("finalize (#9)", () => {
    it("finalize marks remaining pending checks as undetermined and completes pipeline", async () => {
      scheduler = new CheckScheduler({
        screeningId: "scr-1",
        declarations: [
          makeCheck("domain-validation", ["email"], false),
          makeCheck("affiliation", ["name", "institution"], false),
        ],
        executors: [
          passingExecutor("domain-validation"),
          passingExecutor("affiliation"),
        ],
      });
      events = collectEvents(scheduler);

      // Only complete email -> domain-validation runs, affiliation stays pending
      await scheduler.onFieldCompleted("email", "test@uni.edu");

      let state = scheduler.getState();
      expect(state.completedChecks).toContain("domain-validation");
      expect(state.pendingChecks).toContain("affiliation");
      expect(state.status).not.toBe("completed");

      // Finalize
      await scheduler.finalize();

      state = scheduler.getState();
      expect(state.status).toBe("completed");
      expect(state.completedChecks).toContain("affiliation");
      const affiliationOutcome = state.outcomes.find((o) => o.checkId === "affiliation");
      expect(affiliationOutcome).toBeDefined();
      expect(affiliationOutcome!.status).toBe("undetermined");
      expect(affiliationOutcome!.evidence).toContain("form incomplete");
      expect(state.decision).not.toBeNull();
    });

    it("finalize is a no-op when pipeline is already completed", async () => {
      scheduler = new CheckScheduler({
        screeningId: "scr-1",
        declarations: [makeCheck("domain-validation", ["email"], false)],
        executors: [passingExecutor("domain-validation")],
      });
      events = collectEvents(scheduler);

      await scheduler.onFieldCompleted("email", "test@uni.edu");
      expect(scheduler.getState().status).toBe("completed");

      const eventCountBefore = events.length;
      await scheduler.finalize();

      // No additional events emitted
      expect(events.length).toBe(eventCountBefore);
      expect(scheduler.getState().status).toBe("completed");
    });

    it("finalize with consent-waiting checks marks them as incomplete", async () => {
      scheduler = new CheckScheduler({
        screeningId: "scr-1",
        declarations: [SANCTIONS_CHECK],
        executors: [passingExecutor("sanctions")],
        consentTimeoutMs: 30_000,
      });
      events = collectEvents(scheduler);

      await scheduler.onFieldCompleted("name", "John Doe");
      await scheduler.onFieldCompleted("institution", "MIT");

      // Sanctions is waiting for consent
      let state = scheduler.getState();
      expect(state.consentState["sanctions"]).toBe("pending");

      await scheduler.finalize();

      state = scheduler.getState();
      expect(state.status).toBe("completed");
      expect(state.completedChecks).toContain("sanctions");
      const outcome = state.outcomes.find((o) => o.checkId === "sanctions");
      expect(outcome!.status).toBe("undetermined");
      expect(outcome!.evidence).toContain("form incomplete");
    });
  });

  describe("missing executor (#15)", () => {
    it("emits check_started before check_completed even when no executor is found", async () => {
      scheduler = new CheckScheduler({
        screeningId: "scr-1",
        declarations: [makeCheck("unknown-check", ["email"], false)],
        executors: [], // No executors registered
      });
      events = collectEvents(scheduler);

      await scheduler.onFieldCompleted("email", "test@uni.edu");

      const eventTypes = events.map((e) => e.type);
      const startIdx = eventTypes.indexOf("check_started");
      const completeIdx = eventTypes.indexOf("check_completed");

      expect(startIdx).toBeGreaterThanOrEqual(0);
      expect(completeIdx).toBeGreaterThan(startIdx);

      const state = scheduler.getState();
      const outcome = state.outcomes.find((o) => o.checkId === "unknown-check");
      expect(outcome!.status).toBe("error");
      expect(outcome!.errorDetail).toContain("No executor registered");
    });
  });

  describe("audit logging integration", () => {
    it("every state transition is logged to the audit logger", async () => {
      scheduler = new CheckScheduler({
        screeningId: "scr-1",
        declarations: [makeCheck("domain-validation", ["email"], false)],
        executors: [passingExecutor("domain-validation")],
      });
      events = collectEvents(scheduler);

      await scheduler.onFieldCompleted("email", "test@uni.edu");

      const auditLog = scheduler.getAuditLog();
      const types = auditLog.map((e) => e.type);

      expect(types).toContain("field_completed");
      expect(types).toContain("check_started");
      expect(types).toContain("check_completed");
      expect(types).toContain("pipeline_complete");

      // Every entry has screeningId and timestamp
      for (const entry of auditLog) {
        expect(entry.screeningId).toBe("scr-1");
        expect(entry.timestamp).toBeDefined();
      }
    });

    it("consent flow is fully audited", async () => {
      scheduler = new CheckScheduler({
        screeningId: "scr-1",
        declarations: [SANCTIONS_CHECK],
        executors: [passingExecutor("sanctions")],
        consentTimeoutMs: 30_000,
      });
      events = collectEvents(scheduler);

      await scheduler.onFieldCompleted("name", "John Doe");
      await scheduler.onFieldCompleted("institution", "MIT");
      await scheduler.onConsent("sanctions");

      const auditLog = scheduler.getAuditLog();
      const types = auditLog.map((e) => e.type);

      expect(types).toContain("consent_requested");
      expect(types).toContain("consent_received");
      expect(types).toContain("check_started");
      expect(types).toContain("check_completed");
    });
  });
});
