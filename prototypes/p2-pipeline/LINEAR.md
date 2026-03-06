# Linear walkthrough: p2-pipeline

This document walks through the pipeline orchestrator codebase file by file, in a reading order that builds understanding from the bottom up: foundational pieces first, then the orchestrator that wires them together, then the tests that demonstrate the system's behavior.

The pipeline's job is to drive a screening lifecycle:

```
field completed -> dependency check -> consent gating -> check execution -> decision
```

Customers fill in form fields one at a time. As fields arrive, the pipeline resolves which verification checks are now eligible, gates some behind consent, executes them in parallel, and aggregates results into a PASS/FLAG/REVIEW decision.

---

## 1. Project configuration

### `package.json`

The package depends on `@cliver/contracts` (linked locally from `../p0-contracts`) for shared types and `zod` for schema validation. Dev tooling is TypeScript + Vitest.

### `tsconfig.json`

Targets ES2022 with bundler module resolution, strict mode, and `verbatimModuleSyntax`. Set to `noEmit`—this package is consumed as TypeScript source, not compiled separately.

---

## 2. `src/dependency-resolver.ts` — Determines which checks are ready to run

This is the simplest module and the right place to start. It answers one question: given the current state of the pipeline, which checks are eligible to execute?

```ts
export class CheckDependencyResolver {
  resolveEligible(
    declarations: CheckDeclaration[],
    completedFields: string[],
    consentedChecks: Set<string>,
    runningOrCompleted: Set<string>,
  ): string[] {
    const completedSet = new Set(completedFields);

    return declarations
      .filter((decl) => {
        if (runningOrCompleted.has(decl.id)) return false;
        const fieldsMet = decl.requiredFields.every((f) => completedSet.has(f));
        if (!fieldsMet) return false;
        if (decl.needsConsent && !consentedChecks.has(decl.id)) return false;
        return true;
      })
      .map((decl) => decl.id);
  }
}
```

Three conditions must all be true for a check to be eligible:

1. It is not already running or completed (prevents double-runs).
2. Every field in its `requiredFields` array has been completed.
3. If `needsConsent` is true, the check must appear in the `consentedChecks` set.

The resolver is stateless—it takes everything it needs as arguments. This makes it easy to test in isolation, which we'll see later.

**Connection to next file:** The consent manager is the component that tracks whether consent has been granted, denied, or is still pending.

---

## 3. `src/consent-manager.ts` — Tracks consent state per screening/check

An in-memory store for consent records, keyed by `(screeningId, checkId)`. Implements `IConsentManager` from the contracts package.

The internal data structure is a two-level map:

```ts
export class ConsentManager implements IConsentManager {
  private records = new Map<string, Map<string, ConsentRecord>>();
```

Each `ConsentRecord` carries a status (`"pending" | "granted" | "denied" | "expired"`) and a `proposedAt` timestamp. The lifecycle is:

- `propose()` / `proposeAt()` — creates a record with `status: "pending"`.
- `consent()` — flips status to `"granted"`.
- `deny()` — flips status to `"denied"`.
- `markExpired()` — flips status to `"expired"`.

The `proposeAt()` variant accepts an explicit timestamp, which is critical for testable timeout logic:

```ts
isExpired(
  screeningId: string,
  checkId: string,
  timeoutMs: number,
  now: number,
): boolean {
  const record = map.get(checkId);
  if (!record) return false;
  if (record.status !== "pending") return false;
  return now - record.proposedAt >= timeoutMs;
}
```

Expiration is only checked for `"pending"` records—once consent is granted or denied, it can't expire.

**Connection to next file:** Once checks execute (with or without consent), their outcomes flow into the decision aggregator.

---

## 4. `src/decision-aggregator.ts` — Aggregates check outcomes into a final decision

Takes an array of `CheckOutcome` objects and produces a single `Decision` with status `PASS`, `FLAG`, or `REVIEW`.

The rules are priority-ordered:

```ts
export class DecisionAggregator {
  private readonly flagCheckIds: Set<string>;  // defaults to new Set(["sanctions"])

  computeDecision(outcomes: CheckOutcome[]): Decision {
    if (outcomes.length === 0) {
      return { status: "REVIEW", flagCount: 0, summary: "No checks were completed.", reasons: [] };
    }

    const nonPassOutcomes = outcomes.filter((o) => o.status !== "pass");
    const sanctionsFlag = outcomes.some(
      (o) => this.flagCheckIds.has(o.checkId) && o.status === "flag",
    );

    // ... build reasons from nonPassOutcomes ...

    if (sanctionsFlag) {
      return { status: "FLAG", flagCount: nonPassOutcomes.length, summary: "Sanctions screening flagged — requires immediate review.", reasons };
    }

    if (nonPassOutcomes.length > 0) {
      // REVIEW — with summary text that varies by issue type (error, flag, undetermined)
      return { status: "REVIEW", flagCount: nonPassOutcomes.length, summary, reasons };
    }

    return { status: "PASS", flagCount: 0, summary: "All verification criteria passed.", reasons: [] };
  }
}
```

Decision logic summary:

| Condition | Result |
|---|---|
| No outcomes at all | REVIEW |
| All checks pass | PASS |
| A check in `flagCheckIds` (default: `"sanctions"`) flags | FLAG |
| Any non-pass outcome otherwise (flag, error, undetermined) | REVIEW |

Two configuration options make this flexible for different deployments:

- `flagCheckIds` — which check IDs should produce FLAG instead of REVIEW when they flag. Defaults to `new Set(["sanctions"])`.
- `criterionNames` — maps check IDs to human-readable names for the `DecisionReason.criterion` field (falls back to the raw `checkId`).

**Connection to next file:** The audit logger records every event that happens during pipeline execution—field completions, check starts/completions, consent events, and the final decision.

---

## 5. `src/audit-logger.ts` — Append-only event log

The simplest module in the codebase. Stores `PipelineEvent` objects in an array and supports filtering by `screeningId` and/or event `type`.

```ts
export class AuditLogger implements IAuditLogger {
  private events: PipelineEvent[] = [];

  async log(event: PipelineEvent): Promise<void> {
    this.events.push(event);
  }

  async query(filter: Record<string, unknown>): Promise<PipelineEvent[]> {
    let results = this.events;
    if (filter.screeningId) {
      results = results.filter((e) => e.screeningId === filter.screeningId);
    }
    if (filter.type) {
      results = results.filter((e) => e.type === filter.type);
    }
    return results;
  }
}
```

The async interface matches `IAuditLogger` from the contracts package, even though this in-memory implementation is synchronous—future implementations backed by a real database will need the async contract.

**Connection to next file:** The check scheduler is the orchestrator that owns instances of all four preceding classes and drives the full screening lifecycle.

---

## 6. `src/check-scheduler.ts` — The pipeline orchestrator

This is the core of the package. `CheckScheduler` owns the full pipeline state and exposes three entry points for external code:

- `onFieldCompleted(fieldId, value)` — a form field was filled in.
- `onConsent(checkId)` / `onConsentDenied(checkId)` — the customer responded to a consent request.
- `evaluateTimeouts()` — called on a timer to expire stale consent requests.
- `finalize()` — called when no more fields will arrive; skips all remaining checks and forces a decision.

### Internal composition

The scheduler creates its own instances of the four building blocks:

```ts
private readonly resolver = new CheckDependencyResolver();
private readonly consentManager = new ConsentManager();
private readonly auditLogger = new AuditLogger();
private readonly aggregator: DecisionAggregator;
```

Executors (the things that actually run checks) are injected via the constructor as `ICheckExecutor[]` and stored in a lookup map:

```ts
this.executorMap = new Map();
for (const executor of options.executors) {
  this.executorMap.set(executor.checkId, executor);
}
```

### State tracking

The scheduler tracks pipeline state across several fields:

```ts
private status: PipelineState["status"] = "pending";
private completedFields: Set<string> = new Set();
private pendingChecks: string[];
private runningChecks: string[] = [];
private completedChecks: string[] = [];
private outcomes: CheckOutcome[] = [];
private consentState: Record<string, "pending" | "granted" | "denied" | "expired"> = {};
private decision: Decision | null = null;
```

### Serialization lock

Because multiple `onFieldCompleted` calls can arrive concurrently, the scheduler serializes scheduling evaluations with a promise chain:

```ts
private schedulingLock: Promise<void> = Promise.resolve();

private evaluateAndSchedule(): Promise<void> {
  this.schedulingLock = this.schedulingLock.then(() => this._evaluateAndSchedule());
  return this.schedulingLock;
}
```

This prevents race conditions where two field completions evaluate eligibility at the same time and double-schedule the same check.

### The scheduling algorithm (`_evaluateAndSchedule`)

This is the heart of the orchestrator. Each time a field is completed or consent is granted, this method:

1. Builds the set of checks that should not be scheduled (running, completed, or waiting for consent).
2. Finds all declarations whose required fields are met.
3. Splits them into two groups:
   - **Needs consent proposal** — `needsConsent: true` and not yet consented. These get a consent proposal via `consentManager.proposeAt()` and a `consent_requested` event.
   - **Ready to run** — no consent needed, or consent already granted. These execute immediately.
4. Executes ready checks in parallel via `Promise.all`.
5. Checks if the pipeline is complete.

```ts
// Split into consent-needing and ready-to-run
for (const decl of allFieldsMet) {
  if (decl.needsConsent && !consentedCheckIds.has(decl.id)) {
    if (!this.consentWaitingChecks.has(decl.id)) {
      needsConsentProposal.push(decl);
    }
  } else {
    readyToRun.push(decl.id);
  }
}
```

### Check execution

Checks move through `pendingChecks -> runningChecks -> completedChecks`. Each check gets a `check_started` event, runs the executor, and gets a `check_completed` event with its outcome. Errors are caught and recorded as `status: "error"` outcomes—they don't crash the pipeline.

```ts
private async executeOneCheck(checkId: string): Promise<void> {
  await this.emitAndLog({ type: "check_started", ... });

  const executor = this.executorMap.get(checkId);
  if (!executor) {
    await this.recordOutcome({ checkId, status: "error", evidence: `No executor found for check "${checkId}"`, ... });
    return;
  }

  try {
    const outcome = await executor.execute(this.fieldValues);
    await this.recordOutcome(outcome);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    await this.emitAndLog({ type: "error", ..., message: `Check "${checkId}" failed: ${message}` });
    await this.recordOutcome({ checkId, status: "error", evidence: `Check execution failed: ${message}`, ... });
  }
}
```

### Pipeline completion

The pipeline is complete when all declarations are accounted for (no running checks, no consent-waiting checks, all completed). At that point, the decision aggregator runs and a `pipeline_complete` event fires:

```ts
const allDone =
  this.runningChecks.length === 0 &&
  this.consentWaitingChecks.size === 0 &&
  this.completedChecks.length === this.declarations.length;

if (allDone && this.status !== "completed") {
  this.decision = this.aggregator.computeDecision(this.outcomes);
  this.status = "completed";
  await this.emitAndLog({ type: "pipeline_complete", ..., decision: this.decision });
}
```

### Event system

Every state change is logged to the audit logger and broadcast to subscribers:

```ts
private async emitAndLog(event: PipelineEvent): Promise<void> {
  await this.auditLogger.log(event);
  for (const listener of this.listeners) {
    listener(event);
  }
}
```

External code subscribes via `scheduler.subscribe(listener)`, which returns an unsubscribe function.

### Consent timeout and finalization

`evaluateTimeouts()` iterates pending consent requests and marks any that have exceeded `consentTimeoutMs` as expired (skipping the associated check with `"undetermined"` status).

`finalize()` is called when no more fields will arrive. It marks all remaining pending and consent-waiting checks as skipped with `"Check skipped: form incomplete"` and forces pipeline completion.

---

## 7. `src/index.ts` — Public API barrel

Re-exports all five classes and the `CheckSchedulerOptions` type:

```ts
export { CheckScheduler } from "./check-scheduler.js";
export type { CheckSchedulerOptions } from "./check-scheduler.js";
export { CheckDependencyResolver } from "./dependency-resolver.js";
export { ConsentManager } from "./consent-manager.js";
export { AuditLogger } from "./audit-logger.js";
export { DecisionAggregator } from "./decision-aggregator.js";
```

---

## 8. Tests

### `tests/dependency-resolver.test.ts`

Unit tests for `CheckDependencyResolver.resolveEligible()`. Uses a `makeCheck` helper to build `CheckDeclaration` objects. Tests cover:

- Check with all fields met (eligible).
- Check missing a required field (not eligible).
- Check needing consent without consent granted (not eligible).
- Check needing consent with consent granted (eligible).
- Check already running or completed (not eligible).
- Multiple checks becoming eligible simultaneously.
- Check with empty `requiredFields` (always eligible).
- Mixed eligibility across several checks.

### `tests/consent-manager.test.ts`

Unit tests for `ConsentManager`. Tests the full consent lifecycle: propose -> pending -> consent/deny, plus multi-screening isolation and timeout logic. Key timeout test:

```ts
it("isExpired() returns true after consent timeout", () => {
  const now = Date.now();
  cm.proposeAt(screeningId, "sanctions", "Desc", now - 60_000);
  expect(cm.isExpired(screeningId, "sanctions", 30_000, now)).toBe(true);
});
```

### `tests/decision-aggregator.test.ts`

Unit tests for `DecisionAggregator.computeDecision()`. Covers every branch of the decision rules:

- All pass -> PASS.
- Sanctions flag -> FLAG.
- Non-sanctions flag -> REVIEW.
- Error -> REVIEW.
- Undetermined -> REVIEW.
- Empty outcomes -> REVIEW.
- Sanctions flag takes priority over other non-pass outcomes.
- Custom `flagCheckIds` configuration.
- Custom `criterionNames` for human-readable reason output.

### `tests/audit-logger.test.ts`

Unit tests for `AuditLogger`. Tests logging, ordering, and filtering by `screeningId`, `type`, and both combined. Also verifies that every `PipelineEvent` type variant can be logged.

### `tests/orchestration.test.ts`

Integration tests for `CheckScheduler`—the most important test file. Uses test helpers:

```ts
const makeExecutor = (checkId, outcome, delayMs = 0): ICheckExecutor => ({
  checkId,
  execute: async (_fields) => {
    if (delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    return { checkId, ...outcome };
  },
});

const makeFailingExecutor = (checkId, errorMsg): ICheckExecutor => ({
  checkId,
  execute: async () => { throw new Error(errorMsg); },
});
```

Test scenarios walk through the full pipeline lifecycle:

- **Single-dependency field completion** — completing `email` triggers domain validation, emits `field_completed`, `check_started`, and `check_completed` events.
- **Multi-field dependency** — completing `name` alone doesn't trigger sanctions (needs `institution` too). Completing both triggers a `consent_requested` event because sanctions has `needsConsent: true`.
- **Parallel execution** — two checks that depend on the same field start concurrently (verified by tracking execution order with string arrays).
- **Consent gating** — full flow: fields met -> consent requested -> consent granted -> check runs -> completes. Also tests consent denied (check marked `undetermined`) and consent timeout (using `vi.useFakeTimers()`).
- **Error handling** — a failing executor produces an `error` event and an `error` outcome, but the other check in the batch still passes.
- **Pipeline completion** — all checks done -> `computeDecision` runs -> `pipeline_complete` event with the decision. Also tests that a sanctions flag produces a `FLAG` decision.
- **Late field completion** — checks that become eligible later don't re-trigger already-completed checks.
- **State lifecycle** — status transitions from `pending` -> `running` -> `completed`.
- **Duplicate field deduplication** — calling `onFieldCompleted("email", ...)` twice doesn't run the check twice, but does emit two `field_completed` events (the value may have changed).
- **Finalize** — marks remaining pending checks as `undetermined` with `"form incomplete"` evidence and forces pipeline completion. No-op if already completed. Also handles consent-waiting checks.
- **Missing executor** — a check with no registered executor emits `check_started` then `check_completed` with `status: "error"`.
- **Audit logging integration** — verifies the full audit trail contains every event type, including consent flow events.
