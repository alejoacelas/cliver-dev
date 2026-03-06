/**
 * Integration prototype: wires P1 (form events) → P2 (pipeline orchestrator)
 * → P3 (check executors) → P5 (event bus + SSE adapter) together.
 *
 * Goal: verify that the packages compose correctly at the type and runtime
 * level. Uses stub executors for most tests to avoid hitting real APIs,
 * but validates that real executor classes from P3 satisfy ICheckExecutor.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// P0 — contracts (types + interfaces)
import type {
  CheckDeclaration,
  CheckOutcome,
  PipelineEvent,
  PipelineState,
  ICheckExecutor,
  IEventEmitter,
  SSEEvent,
} from "@cliver/contracts";

// P1 — form engine (field event emission)
import { createFieldEventEmitter } from "@cliver/form-engine";

// P2 — pipeline orchestrator
import {
  CheckScheduler,
  DecisionAggregator,
  ConsentManager,
  AuditLogger,
} from "@cliver/p2-pipeline";

// P3 — real executor classes (type compatibility check)
import {
  ScreeningListExecutor,
  WebSearchExecutor,
  EpmcExecutor,
  OrcidExecutor,
  SecureDnaExecutor,
} from "@cliver/executors";

// P5 — event routing
import { EventBus, EventBusAdapter } from "@cliver/p5-events";


// ---------------------------------------------------------------------------
// Stub executors that implement ICheckExecutor without hitting real APIs
// ---------------------------------------------------------------------------

class StubDomainCheck implements ICheckExecutor {
  readonly checkId = "domain_validation";
  async execute(fields: Record<string, unknown>): Promise<CheckOutcome> {
    const email = fields.email as string;
    const isAcademic = email?.endsWith(".edu") || email?.endsWith(".ac.uk");
    return {
      checkId: this.checkId,
      status: isAcademic ? "pass" : "flag",
      evidence: isAcademic
        ? `Email domain ${email} is an academic institution`
        : `Email domain ${email} is not a recognized academic domain`,
      sources: [],
    };
  }
}

class StubSanctionsCheck implements ICheckExecutor {
  readonly checkId = "sanctions";
  async execute(fields: Record<string, unknown>): Promise<CheckOutcome> {
    const name = fields.name as string;
    if (name?.toLowerCase().includes("sanctioned")) {
      return {
        checkId: this.checkId,
        status: "flag",
        evidence: `Name "${name}" matches sanctions list`,
        sources: ["screen1"],
      };
    }
    return {
      checkId: this.checkId,
      status: "pass",
      evidence: `No sanctions match for "${name}"`,
      sources: [],
    };
  }
}

class StubConsentCheck implements ICheckExecutor {
  readonly checkId = "third_party_verification";
  async execute(fields: Record<string, unknown>): Promise<CheckOutcome> {
    return {
      checkId: this.checkId,
      status: "pass",
      evidence: `Third-party verification completed for ${fields.name}`,
      sources: ["verify1"],
    };
  }
}

class StubSlowCheck implements ICheckExecutor {
  readonly checkId = "slow_check";
  async execute(_fields: Record<string, unknown>): Promise<CheckOutcome> {
    await new Promise((r) => setTimeout(r, 50));
    return {
      checkId: this.checkId,
      status: "pass",
      evidence: "Slow check completed",
      sources: [],
    };
  }
}

class StubFailingCheck implements ICheckExecutor {
  readonly checkId = "failing_check";
  async execute(_fields: Record<string, unknown>): Promise<CheckOutcome> {
    throw new Error("External API unavailable");
  }
}


// ---------------------------------------------------------------------------
// Test declarations
// ---------------------------------------------------------------------------

const DECLARATIONS: CheckDeclaration[] = [
  {
    id: "domain_validation",
    name: "Domain Validation",
    requiredFields: ["email"],
    needsConsent: false,
  },
  {
    id: "sanctions",
    name: "Sanctions Check",
    requiredFields: ["name", "institution"],
    needsConsent: false,
  },
  {
    id: "third_party_verification",
    name: "Third Party Verification",
    requiredFields: ["name", "email"],
    needsConsent: true,
    description: "Contact your institution to verify your affiliation",
  },
];


// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("P2 pipeline integration", () => {
  // -----------------------------------------------------------------------
  // 1. Type compatibility: P3 executors satisfy ICheckExecutor
  // -----------------------------------------------------------------------
  describe("P3 executor type compatibility", () => {
    it("real P3 executors implement ICheckExecutor", () => {
      // This is a compile-time check—if these don't satisfy the interface,
      // TypeScript will fail before the test runs.
      const executors: ICheckExecutor[] = [
        new ScreeningListExecutor(),
        new WebSearchExecutor(),
        new EpmcExecutor(),
        new OrcidExecutor(),
        new SecureDnaExecutor(),
      ];

      // Each has a checkId and execute method
      for (const ex of executors) {
        expect(typeof ex.checkId).toBe("string");
        expect(typeof ex.execute).toBe("function");
      }
    });
  });

  // -----------------------------------------------------------------------
  // 2. P1 field events → P2 CheckScheduler
  // -----------------------------------------------------------------------
  describe("P1 form events → P2 pipeline", () => {
    it("field events from P1 emitter drive the pipeline", async () => {
      const events: PipelineEvent[] = [];

      const scheduler = new CheckScheduler({
        screeningId: "test-001",
        declarations: DECLARATIONS,
        executors: [
          new StubDomainCheck(),
          new StubSanctionsCheck(),
          new StubConsentCheck(),
        ],
        flagCheckIds: new Set(["sanctions"]),
      });

      scheduler.subscribe((e) => events.push(e));

      // Simulate P1 field emitter (with 0ms debounce for tests)
      const emitter = createFieldEventEmitter(
        (fieldEvent) => {
          scheduler.onFieldCompleted(fieldEvent.fieldId, fieldEvent.fieldValue);
        },
        { debounceMs: 0 },
      );

      // Customer fills in email → triggers domain_validation
      emitter.fieldCompleted("email", "researcher@mit.edu");
      // Wait for debounce + async execution
      await new Promise((r) => setTimeout(r, 50));

      // domain_validation should have started and completed
      const state1 = scheduler.getState();
      expect(state1.completedFields).toContain("email");
      expect(state1.completedChecks).toContain("domain_validation");

      // The domain check should pass (academic domain)
      const domainOutcome = state1.outcomes.find(
        (o) => o.checkId === "domain_validation",
      );
      expect(domainOutcome?.status).toBe("pass");

      // third_party_verification needs consent → should be pending
      // (it also needs "name" so it's not eligible yet)

      // Customer fills in name
      emitter.fieldCompleted("name", "Alice Researcher");
      await new Promise((r) => setTimeout(r, 50));

      // Now third_party_verification has all fields but needs consent
      const state2 = scheduler.getState();
      expect(state2.consentState["third_party_verification"]).toBe("pending");

      // sanctions still needs "institution"
      expect(state2.completedChecks).not.toContain("sanctions");

      // Customer fills in institution → sanctions check fires
      emitter.fieldCompleted("institution", "MIT");
      await new Promise((r) => setTimeout(r, 50));

      const state3 = scheduler.getState();
      expect(state3.completedChecks).toContain("sanctions");
      expect(state3.outcomes.find((o) => o.checkId === "sanctions")?.status).toBe("pass");

      // Grant consent for third_party_verification
      await scheduler.onConsent("third_party_verification");
      await new Promise((r) => setTimeout(r, 50));

      // Pipeline should now be complete
      const finalState = scheduler.getState();
      expect(finalState.status).toBe("completed");
      expect(finalState.decision).not.toBeNull();
      expect(finalState.decision?.status).toBe("PASS");
      expect(finalState.completedChecks).toHaveLength(3);

      emitter.cleanup();

      // Verify audit trail captured everything
      const audit = scheduler.getAuditLog();
      const types = audit.map((e) => e.type);
      expect(types).toContain("field_completed");
      expect(types).toContain("check_started");
      expect(types).toContain("check_completed");
      expect(types).toContain("consent_requested");
      expect(types).toContain("consent_received");
      expect(types).toContain("pipeline_complete");
    });
  });

  // -----------------------------------------------------------------------
  // 3. P2 → P5 event routing
  // -----------------------------------------------------------------------
  describe("P2 events → P5 event bus", () => {
    it("pipeline events are bridged to SSE event bus via adapter", async () => {
      const sseEvents: SSEEvent[] = [];

      // Set up P5 event bus + adapter
      const eventBus = new EventBus();
      const adapter = new EventBusAdapter(eventBus);

      // Subscribe to customer view
      eventBus.subscribe("test-002", "customer", (event) => {
        sseEvents.push(event);
      });

      // Set up P2 scheduler with P5 adapter as listener
      const scheduler = new CheckScheduler({
        screeningId: "test-002",
        declarations: [
          {
            id: "simple_check",
            name: "Simple Check",
            requiredFields: ["email"],
            needsConsent: false,
          },
          {
            id: "consent_check",
            name: "Consent Check",
            requiredFields: ["email"],
            needsConsent: true,
            description: "We need to verify your identity",
          },
        ],
        executors: [
          {
            checkId: "simple_check",
            async execute() {
              return {
                checkId: "simple_check",
                status: "pass" as const,
                evidence: "All good",
                sources: [],
              };
            },
          },
          {
            checkId: "consent_check",
            async execute() {
              return {
                checkId: "consent_check",
                status: "pass" as const,
                evidence: "Verified",
                sources: [],
              };
            },
          },
        ],
      });

      // Wire P2 events → P5 adapter
      scheduler.subscribe((event) => {
        adapter.emit(event);
      });

      // Trigger the pipeline
      await scheduler.onFieldCompleted("email", "test@uni.edu");
      await new Promise((r) => setTimeout(r, 50));

      // Customer view should receive consent_request (the only mapped event
      // visible to customers from this flow)
      const consentRequests = sseEvents.filter(
        (e) => e.type === "consent_request",
      );
      expect(consentRequests).toHaveLength(1);
      expect(consentRequests[0]).toMatchObject({
        type: "consent_request",
        screeningId: "test-002",
        checkId: "consent_check",
        description: "We need to verify your identity",
      });

      // field_completed, check_started, check_completed are NOT forwarded
      // to SSE (by design—EventBusAdapter drops them)
      const nonMapped = sseEvents.filter(
        (e) =>
          e.type !== "consent_request" &&
          e.type !== "error" &&
          e.type !== "action_proposed",
      );
      expect(nonMapped).toHaveLength(0);
    });

    it("provider view receives all SSE events", async () => {
      const providerEvents: SSEEvent[] = [];

      const eventBus = new EventBus();
      const adapter = new EventBusAdapter(eventBus);

      eventBus.subscribe("test-003", "provider", (event) => {
        providerEvents.push(event);
      });

      const scheduler = new CheckScheduler({
        screeningId: "test-003",
        declarations: [
          {
            id: "consent_check",
            name: "Consent Check",
            requiredFields: ["email"],
            needsConsent: true,
            description: "Verify identity",
          },
        ],
        executors: [
          {
            checkId: "consent_check",
            async execute() {
              return {
                checkId: "consent_check",
                status: "pass" as const,
                evidence: "OK",
                sources: [],
              };
            },
          },
        ],
      });

      scheduler.subscribe((event) => {
        adapter.emit(event);
      });

      await scheduler.onFieldCompleted("email", "test@example.com");
      await new Promise((r) => setTimeout(r, 50));

      // Provider gets consent_request
      expect(providerEvents.some((e) => e.type === "consent_request")).toBe(
        true,
      );
    });
  });

  // -----------------------------------------------------------------------
  // 4. Parallel check execution
  // -----------------------------------------------------------------------
  describe("parallel check execution", () => {
    it("independent checks run in parallel", async () => {
      const startTimes: Record<string, number> = {};
      const endTimes: Record<string, number> = {};

      const scheduler = new CheckScheduler({
        screeningId: "test-parallel",
        declarations: [
          {
            id: "check_a",
            name: "Check A",
            requiredFields: ["email"],
            needsConsent: false,
          },
          {
            id: "check_b",
            name: "Check B",
            requiredFields: ["email"],
            needsConsent: false,
          },
        ],
        executors: [
          {
            checkId: "check_a",
            async execute() {
              startTimes["check_a"] = Date.now();
              await new Promise((r) => setTimeout(r, 50));
              endTimes["check_a"] = Date.now();
              return {
                checkId: "check_a",
                status: "pass" as const,
                evidence: "A done",
                sources: [],
              };
            },
          },
          {
            checkId: "check_b",
            async execute() {
              startTimes["check_b"] = Date.now();
              await new Promise((r) => setTimeout(r, 50));
              endTimes["check_b"] = Date.now();
              return {
                checkId: "check_b",
                status: "pass" as const,
                evidence: "B done",
                sources: [],
              };
            },
          },
        ],
      });

      await scheduler.onFieldCompleted("email", "test@test.com");

      const state = scheduler.getState();
      expect(state.status).toBe("completed");
      expect(state.completedChecks).toHaveLength(2);

      // If parallel, both should have started at roughly the same time
      const startDelta = Math.abs(
        startTimes["check_a"] - startTimes["check_b"],
      );
      expect(startDelta).toBeLessThan(20); // started within 20ms of each other
    });
  });

  // -----------------------------------------------------------------------
  // 5. Error handling
  // -----------------------------------------------------------------------
  describe("executor error handling", () => {
    it("failing executor produces error outcome without crashing pipeline", async () => {
      const scheduler = new CheckScheduler({
        screeningId: "test-error",
        declarations: [
          {
            id: "good_check",
            name: "Good Check",
            requiredFields: ["email"],
            needsConsent: false,
          },
          {
            id: "failing_check",
            name: "Failing Check",
            requiredFields: ["email"],
            needsConsent: false,
          },
        ],
        executors: [
          {
            checkId: "good_check",
            async execute() {
              return {
                checkId: "good_check",
                status: "pass" as const,
                evidence: "OK",
                sources: [],
              };
            },
          },
          new StubFailingCheck(),
        ],
      });

      await scheduler.onFieldCompleted("email", "test@test.com");

      const state = scheduler.getState();
      expect(state.status).toBe("completed");
      expect(state.completedChecks).toContain("good_check");
      expect(state.completedChecks).toContain("failing_check");

      const failOutcome = state.outcomes.find(
        (o) => o.checkId === "failing_check",
      );
      expect(failOutcome?.status).toBe("error");
      expect(failOutcome?.errorDetail).toContain("External API unavailable");

      // Decision should be REVIEW because of the error
      expect(state.decision?.status).toBe("REVIEW");
    });
  });

  // -----------------------------------------------------------------------
  // 6. Consent denied flow
  // -----------------------------------------------------------------------
  describe("consent denied", () => {
    it("denied consent skips the check and allows pipeline to complete", async () => {
      const scheduler = new CheckScheduler({
        screeningId: "test-deny",
        declarations: [
          {
            id: "auto_check",
            name: "Auto Check",
            requiredFields: ["email"],
            needsConsent: false,
          },
          {
            id: "gated_check",
            name: "Gated Check",
            requiredFields: ["email"],
            needsConsent: true,
            description: "We need your consent",
          },
        ],
        executors: [
          {
            checkId: "auto_check",
            async execute() {
              return {
                checkId: "auto_check",
                status: "pass" as const,
                evidence: "OK",
                sources: [],
              };
            },
          },
          {
            checkId: "gated_check",
            async execute() {
              return {
                checkId: "gated_check",
                status: "pass" as const,
                evidence: "OK",
                sources: [],
              };
            },
          },
        ],
      });

      await scheduler.onFieldCompleted("email", "test@test.com");

      // gated_check should be waiting for consent
      expect(scheduler.getState().consentState["gated_check"]).toBe("pending");

      // Deny consent
      await scheduler.onConsentDenied("gated_check");

      const state = scheduler.getState();
      expect(state.status).toBe("completed");
      expect(state.consentState["gated_check"]).toBe("denied");

      const gatedOutcome = state.outcomes.find(
        (o) => o.checkId === "gated_check",
      );
      expect(gatedOutcome?.status).toBe("undetermined");
      expect(gatedOutcome?.evidence).toContain("consent denied");

      // REVIEW because of undetermined check
      expect(state.decision?.status).toBe("REVIEW");
    });
  });

  // -----------------------------------------------------------------------
  // 7. Consent timeout
  // -----------------------------------------------------------------------
  describe("consent timeout", () => {
    it("expired consent skips the check", async () => {
      let fakeTime = 1000;

      const scheduler = new CheckScheduler({
        screeningId: "test-timeout",
        declarations: [
          {
            id: "auto_check",
            name: "Auto Check",
            requiredFields: ["email"],
            needsConsent: false,
          },
          {
            id: "gated_check",
            name: "Gated Check",
            requiredFields: ["email"],
            needsConsent: true,
            description: "Consent needed",
          },
        ],
        executors: [
          {
            checkId: "auto_check",
            async execute() {
              return {
                checkId: "auto_check",
                status: "pass" as const,
                evidence: "OK",
                sources: [],
              };
            },
          },
          {
            checkId: "gated_check",
            async execute() {
              return {
                checkId: "gated_check",
                status: "pass" as const,
                evidence: "OK",
                sources: [],
              };
            },
          },
        ],
        consentTimeoutMs: 5000,
        now: () => fakeTime,
      });

      await scheduler.onFieldCompleted("email", "test@test.com");
      expect(scheduler.getState().consentState["gated_check"]).toBe("pending");

      // Advance time past timeout
      fakeTime = 7000;
      await scheduler.evaluateTimeouts();

      const state = scheduler.getState();
      expect(state.status).toBe("completed");
      expect(state.consentState["gated_check"]).toBe("expired");

      const gatedOutcome = state.outcomes.find(
        (o) => o.checkId === "gated_check",
      );
      expect(gatedOutcome?.status).toBe("undetermined");
      expect(gatedOutcome?.evidence).toContain("consent expired");
    });
  });

  // -----------------------------------------------------------------------
  // 8. Decision aggregation with sanctions flag
  // -----------------------------------------------------------------------
  describe("decision aggregation", () => {
    it("sanctions flag produces FLAG decision", async () => {
      const scheduler = new CheckScheduler({
        screeningId: "test-flag",
        declarations: [
          {
            id: "domain_validation",
            name: "Domain Validation",
            requiredFields: ["email"],
            needsConsent: false,
          },
          {
            id: "sanctions",
            name: "Sanctions",
            requiredFields: ["name"],
            needsConsent: false,
          },
        ],
        executors: [new StubDomainCheck(), new StubSanctionsCheck()],
        flagCheckIds: new Set(["sanctions"]),
        criterionNames: new Map([
          ["sanctions", "Sanctions List Match"],
          ["domain_validation", "Email Domain"],
        ]),
      });

      await scheduler.onFieldCompleted("email", "person@mit.edu");
      await scheduler.onFieldCompleted("name", "A Sanctioned Person");

      const state = scheduler.getState();
      expect(state.status).toBe("completed");
      expect(state.decision?.status).toBe("FLAG");
      expect(state.decision?.flagCount).toBeGreaterThanOrEqual(1);
      expect(state.decision?.reasons.some((r) => r.criterion === "Sanctions List Match")).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 9. Full end-to-end: P1 → P2 → P5 (with customer/provider views)
  // -----------------------------------------------------------------------
  describe("full end-to-end: form → pipeline → event bus", () => {
    it("complete screening flow with dual views", async () => {
      const customerEvents: SSEEvent[] = [];
      const providerEvents: SSEEvent[] = [];

      // P5: event bus
      const eventBus = new EventBus();
      const adapter = new EventBusAdapter(eventBus);

      eventBus.subscribe("e2e-001", "customer", (e) => customerEvents.push(e));
      eventBus.subscribe("e2e-001", "provider", (e) => providerEvents.push(e));

      // P2: pipeline
      const scheduler = new CheckScheduler({
        screeningId: "e2e-001",
        declarations: DECLARATIONS,
        executors: [
          new StubDomainCheck(),
          new StubSanctionsCheck(),
          new StubConsentCheck(),
        ],
        flagCheckIds: new Set(["sanctions"]),
      });

      // Wire P2 → P5
      scheduler.subscribe((event) => {
        adapter.emit(event);
      });

      // P1: form engine field emitter
      const emitter = createFieldEventEmitter(
        (fieldEvent) => {
          scheduler.onFieldCompleted(fieldEvent.fieldId, fieldEvent.fieldValue);
        },
        { debounceMs: 0 },
      );

      // Simulate customer filling the form
      emitter.fieldCompleted("email", "alice@oxford.ac.uk");
      await new Promise((r) => setTimeout(r, 50));

      emitter.fieldCompleted("name", "Alice Research");
      await new Promise((r) => setTimeout(r, 50));

      // At this point: domain_validation done, third_party needs consent
      expect(customerEvents.some((e) => e.type === "consent_request")).toBe(true);

      emitter.fieldCompleted("institution", "University of Oxford");
      await new Promise((r) => setTimeout(r, 50));

      // sanctions check completed (pass)

      // Grant consent
      await scheduler.onConsent("third_party_verification");
      await new Promise((r) => setTimeout(r, 50));

      // Pipeline complete
      const finalState = scheduler.getState();
      expect(finalState.status).toBe("completed");
      expect(finalState.decision?.status).toBe("PASS");

      // Customer only got consent_request events (not check details)
      for (const e of customerEvents) {
        expect(["consent_request", "error", "action_proposed", "status", "complete", "field_event"]).toContain(e.type);
      }

      emitter.cleanup();
    });
  });

  // -----------------------------------------------------------------------
  // 10. Finalize with incomplete fields
  // -----------------------------------------------------------------------
  describe("finalize with incomplete fields", () => {
    it("finalizing skips checks whose fields were never completed", async () => {
      const scheduler = new CheckScheduler({
        screeningId: "test-finalize",
        declarations: DECLARATIONS,
        executors: [
          new StubDomainCheck(),
          new StubSanctionsCheck(),
          new StubConsentCheck(),
        ],
      });

      // Only fill email — sanctions needs name+institution, consent needs name+email
      await scheduler.onFieldCompleted("email", "test@mit.edu");

      // domain_validation ran, but others are still pending
      expect(scheduler.getState().completedChecks).toContain("domain_validation");
      expect(scheduler.getState().pendingChecks).toContain("sanctions");

      // Finalize
      await scheduler.finalize();

      const state = scheduler.getState();
      expect(state.status).toBe("completed");
      expect(state.completedChecks).toHaveLength(3);

      // Skipped checks have undetermined status
      const sanctionsOutcome = state.outcomes.find((o) => o.checkId === "sanctions");
      expect(sanctionsOutcome?.status).toBe("undetermined");
      expect(sanctionsOutcome?.evidence).toContain("form incomplete");

      // Decision is REVIEW (undetermined checks)
      expect(state.decision?.status).toBe("REVIEW");
    });
  });

  // -----------------------------------------------------------------------
  // 11. DecisionAggregator standalone
  // -----------------------------------------------------------------------
  describe("DecisionAggregator standalone", () => {
    it("aggregates outcomes correctly", () => {
      const agg = new DecisionAggregator({
        flagCheckIds: new Set(["sanctions"]),
        criterionNames: new Map([["sanctions", "Sanctions Match"]]),
      });

      const outcomes: CheckOutcome[] = [
        { checkId: "domain_check", status: "pass", evidence: "OK", sources: [] },
        { checkId: "sanctions", status: "flag", evidence: "Match found", sources: ["s1"] },
      ];

      const decision = agg.computeDecision(outcomes);
      expect(decision.status).toBe("FLAG");
      expect(decision.flagCount).toBe(1);
      expect(decision.reasons).toHaveLength(1);
      expect(decision.reasons[0].criterion).toBe("Sanctions Match");
    });

    it("all pass → PASS", () => {
      const agg = new DecisionAggregator();
      const outcomes: CheckOutcome[] = [
        { checkId: "a", status: "pass", evidence: "OK", sources: [] },
        { checkId: "b", status: "pass", evidence: "OK", sources: [] },
      ];
      expect(agg.computeDecision(outcomes).status).toBe("PASS");
    });

    it("empty outcomes → REVIEW", () => {
      const agg = new DecisionAggregator();
      expect(agg.computeDecision([]).status).toBe("REVIEW");
    });
  });

  // -----------------------------------------------------------------------
  // 12. AuditLogger standalone
  // -----------------------------------------------------------------------
  describe("AuditLogger standalone", () => {
    it("logs and queries events", async () => {
      const logger = new AuditLogger();

      const event1: PipelineEvent = {
        type: "field_completed",
        screeningId: "s1",
        timestamp: "2026-01-01T00:00:00Z",
        fieldId: "email",
        fieldValue: "test@test.com",
      };

      const event2: PipelineEvent = {
        type: "check_started",
        screeningId: "s1",
        timestamp: "2026-01-01T00:00:01Z",
        checkId: "sanctions",
      };

      await logger.log(event1);
      await logger.log(event2);

      const all = await logger.query({});
      expect(all).toHaveLength(2);

      const byType = await logger.query({ type: "check_started" });
      expect(byType).toHaveLength(1);
      expect(byType[0].type).toBe("check_started");

      const byScreening = await logger.query({ screeningId: "s1" });
      expect(byScreening).toHaveLength(2);
    });
  });

  // -----------------------------------------------------------------------
  // 13. ConsentManager standalone
  // -----------------------------------------------------------------------
  describe("ConsentManager standalone", () => {
    it("manages consent lifecycle", async () => {
      const cm = new ConsentManager();

      await cm.propose("s1", "check_a", "Do you approve?");
      expect(await cm.isAuthorized("s1", "check_a")).toBe(false);

      const pending = await cm.getPending("s1");
      expect(pending).toHaveLength(1);
      expect(pending[0].checkId).toBe("check_a");

      await cm.consent("s1", "check_a");
      expect(await cm.isAuthorized("s1", "check_a")).toBe(true);
      expect(await cm.getPending("s1")).toHaveLength(0);
    });
  });
});
