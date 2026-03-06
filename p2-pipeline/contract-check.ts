/**
 * Contract check: verifies that P2 exports satisfy P0 interfaces.
 * Must compile with: npx tsc --noEmit --project tsconfig.json
 */

import type {
  CheckDeclaration,
  CheckOutcome,
  PipelineState,
  PipelineEvent,
  Decision,
  ICheckExecutor,
  IConsentManager,
  IAuditLogger,
} from "@cliver/contracts";

import {
  CheckScheduler,
  CheckDependencyResolver,
  ConsentManager,
  AuditLogger,
  DecisionAggregator,
} from "./src/index.js";

// --- Verify ConsentManager implements IConsentManager ---
const cm: IConsentManager = new ConsentManager();
void cm.propose("scr-1", "check-1", "description");
void cm.consent("scr-1", "check-1");
void cm.deny("scr-1", "check-1");
void cm.isAuthorized("scr-1", "check-1");
void cm.getPending("scr-1");

// --- Verify AuditLogger implements IAuditLogger ---
const al: IAuditLogger = new AuditLogger();
const sampleEvent: PipelineEvent = {
  type: "field_completed",
  screeningId: "scr-1",
  timestamp: new Date().toISOString(),
  fieldId: "email",
  fieldValue: "test@example.com",
};
void al.log(sampleEvent);
void al.query({ screeningId: "scr-1" });

// --- Verify CheckDependencyResolver signature ---
const resolver = new CheckDependencyResolver();
const declarations: CheckDeclaration[] = [
  { id: "check-1", name: "Check 1", requiredFields: ["email"], needsConsent: false },
];
const eligible: string[] = resolver.resolveEligible(
  declarations,
  ["email"],
  new Set<string>(),
  new Set<string>(),
);

// --- Verify DecisionAggregator signature ---
const agg = new DecisionAggregator();
const outcomes: CheckOutcome[] = [
  { checkId: "check-1", status: "pass", evidence: "ok", sources: [] },
];
const decision: Decision = agg.computeDecision(outcomes);

// --- Verify CheckScheduler signature ---
const executor: ICheckExecutor = {
  checkId: "check-1",
  execute: async () => ({ checkId: "check-1", status: "pass", evidence: "ok", sources: [] }),
};
const scheduler = new CheckScheduler({
  screeningId: "scr-1",
  declarations,
  executors: [executor],
});
const state: PipelineState = scheduler.getState();
const unsub: () => void = scheduler.subscribe((_event: PipelineEvent) => {});
void scheduler.onFieldCompleted("email", "test@example.com");
void scheduler.onConsent("check-1");

// --- Verify PipelineState shape ---
const _status: PipelineState["status"] = state.status;
const _fields: string[] = state.completedFields;
const _pending: string[] = state.pendingChecks;
const _running: string[] = state.runningChecks;
const _completed: string[] = state.completedChecks;
const _outcomes: CheckOutcome[] = state.outcomes;
const _decision: Decision | null = state.decision;
