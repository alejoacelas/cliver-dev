# P2 pipeline orchestrator audit

Audited: 2026-03-05
Baseline: 57 tests passing, `tsc --noEmit` clean.

---

## Findings

### 1. Duplicate field events are not deduplicated

**Severity: Medium**

Calling `onFieldCompleted("email", ...)` twice pushes `"email"` into `completedFields` twice. The `completedFields` array is used for dependency resolution (converted to a Set each time, so eligibility is unaffected), but the pipeline state returned by `getState()` will contain duplicates, and two `field_completed` audit events are emitted for the same field. More critically, if a check requires field `["email"]` and has already run, the second `onFieldCompleted` call re-enters `evaluateAndSchedule`, rebuilds the Set each time, and wastes work. No guard prevents this.

**File:** `/Users/alejo/code/cliver/dev/p2-pipeline/src/check-scheduler.ts`, line 90
**Test gap:** No test calls `onFieldCompleted` with the same field ID twice.
**Recommendation:** Either deduplicate on insert (`if (!this.completedFields.includes(fieldId))`) or use a `Set<string>` for `completedFields` internally.

---

### 2. `CheckDependencyResolver` is instantiated but not used for scheduling

**Severity: Low**

The `CheckScheduler` constructs a `CheckDependencyResolver` at line 39, but `evaluateAndSchedule()` (lines 213-283) implements its own inline dependency resolution logic instead of calling `resolver.resolveEligible()`. The two implementations diverge: the resolver checks consent via a `consentedChecks` Set parameter, while the scheduler splits logic into a two-pass approach (fields-met first, then consent gating). This means:

- The `CheckDependencyResolver` class is dead code within the orchestrator.
- If the resolver's logic is ever updated, the scheduler won't benefit.
- The contract-check file (line 46-55) exercises the resolver, giving a false sense that it's integrated.

**File:** `/Users/alejo/code/cliver/dev/p2-pipeline/src/check-scheduler.ts`, line 39 and lines 213-283
**Recommendation:** Either use the resolver in the scheduler (the two-pass split could still work by calling `resolveEligible` with no consented checks to find fields-met candidates, then filtering), or remove the resolver field from the scheduler and document it as a standalone utility.

---

### 3. `propose()` followed by `proposeAt()` creates a double-write for consent records

**Severity: Medium**

In `evaluateAndSchedule()` (lines 255-265), for checks needing consent with a timeout configured, the code calls `this.consentManager.propose(...)` first (which internally calls `proposeAt` with `Date.now()`), then immediately calls `this.consentManager.proposeAt(...)` with the injected `this.now()` timestamp. This means:

1. The first call records the consent with `Date.now()` as the timestamp.
2. The second call overwrites it with `this.now()` as the timestamp.

If `this.now` is a fake clock (as in tests), the first `propose()` still uses the real `Date.now()` internally (consent-manager.ts line 32: `this.proposeAt(screeningId, checkId, description, Date.now())`). The second `proposeAt` then overwrites with the fake time. This works by accident because the overwrite happens, but it's fragile:

- Without `consentTimeoutMs`, only `propose()` is called, always using `Date.now()` regardless of the injected clock.
- The double-write is unnecessary overhead and confusing.

**File:** `/Users/alejo/code/cliver/dev/p2-pipeline/src/check-scheduler.ts`, lines 255-265; `/Users/alejo/code/cliver/dev/p2-pipeline/src/consent-manager.ts`, line 32
**Recommendation:** Either pass `this.now()` to `propose()` (change the `IConsentManager` interface or add an overload), or skip the first `propose()` call when `consentTimeoutMs` is set and call `proposeAt()` directly.

---

### 4. Consent granted/denied before fields are met is silently accepted

**Severity: Medium**

`onConsent(checkId)` and `onConsentDenied(checkId)` can be called at any time, even before the check's required fields are met or before a consent proposal exists. The `ConsentManager.consent()` method (line 54-58) handles a missing record gracefully (the `if (record)` guard means it's a no-op), but the `CheckScheduler` unconditionally sets `this.consentState[checkId] = "granted"` (line 113) and deletes from `consentWaitingChecks` (line 123), then calls `evaluateAndSchedule()`. This means:

- Pre-consenting a check before its fields are met will mark it as "granted" in state, and when fields are later met, the check will run immediately without a `consent_requested` event ever being emitted.
- The audit trail will show `consent_received` before `consent_requested`, which is incoherent.

**File:** `/Users/alejo/code/cliver/dev/p2-pipeline/src/check-scheduler.ts`, lines 111-125
**Test gap:** No test exercises pre-consent (consent before fields are met).
**Recommendation:** Either reject consent events for checks that haven't been proposed (throw or return early), or document this as intentional "pre-authorization" behavior and ensure the audit trail notes it.

---

### 5. Spec requires `actor` field in audit entries, but it's absent

**Severity: Medium**

The prototypes.md spec (line 212) states: "Audit entries include sessionId, timestamp, **actor**, payload." The P0 `PipelineEvent` schema does not include an `actor` field, and the implementation doesn't provide one. This is a spec-vs-contract inconsistency. Since P2 is supposed to implement the spec, and the spec explicitly calls out `actor` as a required audit field, this is a gap.

**File:** `/Users/alejo/code/cliver/dev/prototypes.md`, line 212; `/Users/alejo/code/cliver/dev/p0-contracts/src/pipeline.ts`, lines 103-158
**Recommendation:** Either add `actor` to the `PipelineEvent` schema in P0 contracts, or update the spec to remove the `actor` requirement and document why it was dropped. For a KYC system, knowing *who* triggered each event (customer, system, provider) is important for compliance.

---

### 6. `"failed"` pipeline status is never used

**Severity: Low**

The `PipelineState` schema in P0 contracts defines status as `z.enum(["pending", "running", "completed", "failed"])`, but the `CheckScheduler` only ever sets status to `"pending"`, `"running"`, or `"completed"`. There is no code path that sets status to `"failed"`. If all checks error out, the pipeline still completes normally with a `"REVIEW"` decision.

**File:** `/Users/alejo/code/cliver/dev/p2-pipeline/src/check-scheduler.ts` (no `"failed"` assignment anywhere)
**Recommendation:** Either implement a `"failed"` status for catastrophic pipeline errors (e.g., all executors throw, or a programming error in the scheduler itself), or document that `"failed"` is reserved for future use by P3+ integrations.

---

### 7. `onConsentDenied` does not remove the check from `pendingChecks` before `markCheckSkipped` is called

**Severity: Low**

This is actually fine because `markCheckSkipped` (line 373) filters `pendingChecks` itself. But there's a subtlety: `evaluateAndSchedule()` (called from `onConsent`) also includes `consentWaitingChecks` in `runningOrCompleted` (line 218), which prevents the check from being re-proposed. After `onConsentDenied`, the check is removed from `consentWaitingChecks` (line 143) and then `markCheckSkipped` moves it to `completedChecks`. If a timing issue caused `evaluateAndSchedule` to run between line 143 and line 144, the check could be re-proposed. In practice this can't happen because JavaScript is single-threaded and `await` points are explicit, but the design is fragile.

**File:** `/Users/alejo/code/cliver/dev/p2-pipeline/src/check-scheduler.ts`, lines 131-146
**Recommendation:** Move `this.consentWaitingChecks.delete(checkId)` after `markCheckSkipped` to keep the check protected until it's in `completedChecks`, or add the check to `completedChecks` before deleting from `consentWaitingChecks`.

---

### 8. Decision aggregation uses hard-coded `"sanctions"` check ID

**Severity: High**

The `DecisionAggregator` (line 3) hard-codes `const SANCTIONS_CHECK_ID = "sanctions"` and uses it to determine whether a flag should produce `"FLAG"` vs `"REVIEW"`. This means:

- If the sanctions check is registered with any other ID (e.g., `"sanctions-screening"`, `"ofac-check"`, `"screening-list"`), a sanctions hit will produce `"REVIEW"` instead of `"FLAG"`.
- The existing codebase (`pipeline.ts` line 26) uses `"Sanctions and Export Control Screening"` as the criterion name, which is completely different.
- There's no validation or documentation that the sanctions check *must* use the ID `"sanctions"`.

The orchestration test (line 387-402) works only because it manually creates a check with `id: "sanctions"`. In production, the check ID will likely differ.

**File:** `/Users/alejo/code/cliver/dev/p2-pipeline/src/decision-aggregator.ts`, lines 3, 27-29
**File:** `/Users/alejo/code/cliver/tool/server/pipeline.ts`, line 26
**Recommendation:** Either make the sanctions check ID configurable (pass it to the aggregator constructor), or derive FLAG status from the check's outcome metadata rather than its ID. The existing codebase matches on the *criterion name*, not the check ID—this is a regression in approach.

---

### 9. `checkCompletion` requires exact count match, which breaks with unmet dependencies

**Severity: High**

The completion condition (line 418) is:
```typescript
this.completedChecks.length === this.declarations.length
```

This means the pipeline will **never complete** if any check's required fields are never provided. For example, if the pipeline declares checks for `["email"]` and `["name", "institution"]`, but only `email` is ever submitted, the domain check completes but the affiliation check stays in `pendingChecks` forever. The pipeline hangs in `"running"` status indefinitely.

There is no mechanism to:
- Mark the pipeline as complete after all *possible* fields have been submitted.
- Time out the overall pipeline.
- Signal that no more fields will arrive.

This is arguably by design (the pipeline waits for all fields), but it means a partial form submission will leave the pipeline in a zombie state. The spec says "when all checks are accounted for" (EXPLANATION.md line 6 of lifecycle), but "accounted for" and "completed" are conflated.

**File:** `/Users/alejo/code/cliver/dev/p2-pipeline/src/check-scheduler.ts`, lines 415-418
**Test gap:** No test exercises a pipeline where not all fields are ever provided.
**Recommendation:** Add a `finalize()` or `close()` method that marks remaining pending checks as `"undetermined"` and triggers decision aggregation. Alternatively, allow partial completion after a configurable idle timeout.

---

### 10. Audit logger `query()` does not validate filter keys

**Severity: Low**

The `AuditLogger.query()` method accepts `Record<string, unknown>` and only handles `screeningId` and `type` keys. Any other filter key (e.g., `{ checkId: "domain" }`, `{ since: "2026-01-01" }`) is silently ignored. The `IAuditLogger` interface in P0 also uses `Record<string, unknown>`, so this is contract-compliant, but it could mislead callers into thinking their filters are being applied.

**File:** `/Users/alejo/code/cliver/dev/p2-pipeline/src/audit-logger.ts`, lines 14-28
**Recommendation:** Either document which filter keys are supported, or extend the filter to support `checkId` and time-range filtering (the `IStorageLayer` interface in P0 already defines `queryAuditEvents` with `{ screeningId?, type?, since? }`).

---

### 11. No test for zero-check pipeline

**Severity: Low**

The spec mentions "Empty checks -> REVIEW" as a decision aggregation test case, and the `DecisionAggregator` handles it (returns REVIEW with "No checks were completed"). However, there is no orchestration-level test that creates a `CheckScheduler` with an empty `declarations` array. It's unclear what `getState()` would return (status `"pending"` forever? immediately `"completed"`?). The `checkCompletion` method would evaluate `this.completedChecks.length === 0 === this.declarations.length === 0`, which is `true`, so it would complete immediately—but only after `evaluateAndSchedule` is called, which requires a field completion event.

**File:** `/Users/alejo/code/cliver/dev/p2-pipeline/tests/orchestration.test.ts` (missing test)
**Recommendation:** Add a test that creates a scheduler with zero declarations and verifies it either completes immediately or has a clear way to trigger completion.

---

### 12. EXPLANATION.md claims "57 automated tests" but doesn't specify composition

**Severity: Low**

The EXPLANATION.md (line 48) states "The 57 automated tests cover..." and lists categories. The actual test counts are:
- dependency-resolver: 9
- consent-manager: 13
- audit-logger: 7
- decision-aggregator: 10
- orchestration: 18

Total: 57. This matches. However, the EXPLANATION.md doesn't mention `evaluateTimeouts()` as a public method, and the explanation of consent timeout says "a configurable time window" without mentioning that timeout evaluation is triggered externally (it's not automatic). This could mislead readers into thinking timeouts fire automatically.

**File:** `/Users/alejo/code/cliver/dev/p2-pipeline/EXPLANATION.md`, paragraph on consent manager
**Recommendation:** Clarify in the explanation that consent timeout is evaluated on-demand via `evaluateTimeouts()` and is not timer-driven.

---

### 13. `consentWaitingChecks` leaks into `runningOrCompleted` exclusion, preventing re-evaluation

**Severity: Low**

In `evaluateAndSchedule()` line 215-219, `consentWaitingChecks` are included in the `runningOrCompleted` set. This is correct for preventing double-proposals, but the variable name `runningOrCompleted` is misleading—it also includes "waiting for consent" checks. This isn't a bug, but it makes the code harder to reason about.

**File:** `/Users/alejo/code/cliver/dev/p2-pipeline/src/check-scheduler.ts`, lines 215-219
**Recommendation:** Rename to `excludedChecks` or `nonEligibleChecks` for clarity.

---

### 14. Spec mentions `check_error` event type, but implementation uses `error`

**Severity: Medium**

The prototypes.md spec (line 206) says: "Check failure emits `check_error`, pipeline continues with remaining checks." The implementation emits a generic `error` event type (check-scheduler.ts line 329), which matches the P0 `PipelineEventSchema` (which defines `"error"` as a valid type, not `"check_error"`). The spec is inconsistent with the contracts.

**File:** `/Users/alejo/code/cliver/dev/prototypes.md`, line 206
**File:** `/Users/alejo/code/cliver/dev/p0-contracts/src/pipeline.ts`, lines 150-155
**File:** `/Users/alejo/code/cliver/dev/p2-pipeline/src/check-scheduler.ts`, lines 329-335
**Recommendation:** The implementation correctly follows the P0 contract (`"error"` type). Update the spec in prototypes.md to say `error` instead of `check_error`.

---

### 15. No executor for a declared check produces `error` outcome but no `check_started` event

**Severity: Medium**

When `executeOneCheck` is called with a `checkId` that has no registered executor (line 304-313), it records an error outcome directly via `recordOutcome` without first emitting a `check_started` event. This creates an inconsistent audit trail: a `check_completed` event appears without a preceding `check_started`. The `check_started` event is only emitted after the executor lookup succeeds (line 316-321).

**File:** `/Users/alejo/code/cliver/dev/p2-pipeline/src/check-scheduler.ts`, lines 303-314
**Test gap:** No test exercises the "missing executor" code path.
**Recommendation:** Either emit `check_started` before the executor lookup, or emit a distinct error event that doesn't use `recordOutcome` (since the check never truly "started").

---

### 16. `DecisionReason.criterion` is set to `checkId`, not the actual verification criterion

**Severity: Medium**

The `DecisionAggregator` (line 33) maps each non-pass outcome to a `DecisionReason` with `criterion: o.checkId`. The P0 `DecisionReasonSchema` defines `criterion` as "The verification criterion this reason relates to." In the existing codebase, criteria are domain-specific strings like `"Sanctions and Export Control Screening"` or `"Email Domain Validity"`. Using the check ID as the criterion conflates two concepts and will produce UI-unfriendly output like `criterion: "domain-validation"` instead of `"Email Domain Validity"`.

**File:** `/Users/alejo/code/cliver/dev/p2-pipeline/src/decision-aggregator.ts`, line 33
**Recommendation:** Either add a `criterion` field to `CheckOutcome` or `CheckDeclaration` and use it here, or map check IDs to criterion names. The current approach loses information.

---

### 17. Race condition: `evaluateAndSchedule` called concurrently from `onFieldCompleted` and `onConsent`

**Severity: Medium**

If `onFieldCompleted` and `onConsent` are called in rapid succession (or if `onFieldCompleted` is called while a previous `onFieldCompleted` is still awaiting `evaluateAndSchedule`), the method can be entered concurrently. JavaScript is single-threaded, but `await` points yield control. Consider:

1. `onFieldCompleted("name", ...)` is called, enters `evaluateAndSchedule`.
2. During `await this.emitAndLog(...)` inside `evaluateAndSchedule`, control yields.
3. `onFieldCompleted("institution", ...)` is called, enters `evaluateAndSchedule` again.

Both invocations read the same `runningChecks`, `completedChecks`, `consentWaitingChecks` state, and both may decide the same check is eligible. This could lead to a check being launched twice. The `runningOrCompleted` guard uses the check lists, but if the first invocation hasn't yet updated `runningChecks` when the second invocation reads them, duplication occurs.

In practice, the `emitAndLog` calls are fast (in-memory), so the window is tiny. But with a real async audit logger (database writes), this becomes a real race.

**File:** `/Users/alejo/code/cliver/dev/p2-pipeline/src/check-scheduler.ts`, lines 89-106, 111-125, 213-283
**Recommendation:** Add a mutex or queue to serialize calls to `evaluateAndSchedule`. A simple approach: `private scheduling: Promise<void> = Promise.resolve()` with chaining.

---

### 18. `zod` dependency declared but never imported

**Severity: Low**

The `package.json` lists `"zod": "^3.24.0"` as a dependency, but no source file in `src/` imports from `zod`. The P0 contracts package uses Zod heavily, but P2 only imports types from `@cliver/contracts`. This is dead weight.

**File:** `/Users/alejo/code/cliver/dev/p2-pipeline/package.json`, line 12
**Recommendation:** Remove `zod` from `dependencies` since it's not directly used. It's still available transitively through `@cliver/contracts` if needed.

---

### 19. Test for consent timeout uses `vi.getMockedSystemTime()` which may return `undefined`

**Severity: Low**

The consent timeout test (orchestration.test.ts line 269) uses:
```typescript
now: () => vi.getMockedSystemTime()?.getTime() ?? Date.now()
```

The `vi.useFakeTimers()` call on line 262 should ensure `getMockedSystemTime()` returns a valid Date, so the `?? Date.now()` fallback should never trigger. However, this is defensive in a way that could mask a test configuration bug—if fake timers aren't properly initialized, the test would silently use real time and potentially still pass (or fail mysteriously).

**File:** `/Users/alejo/code/cliver/dev/p2-pipeline/tests/orchestration.test.ts`, lines 262-269
**Recommendation:** Use an explicit counter instead of `vi.getMockedSystemTime()` for deterministic control, or assert that `getMockedSystemTime()` is not null before proceeding.

---

### 20. Spec mentions `ICompletionProvider` mocking but P2 doesn't mock or reference it

**Severity: Low**

The prototypes.md spec (line 170) says P2 mocks "AI layer (`ICompletionProvider` returning canned extractions)." The implementation doesn't reference `ICompletionProvider` at all. Check executors are mocked as `ICheckExecutor` stubs, but there's no AI extraction mocking. This is actually fine—the spec may have been written before the scope was refined—but it's a spec/implementation inconsistency.

**File:** `/Users/alejo/code/cliver/dev/prototypes.md`, line 170
**Recommendation:** Update the spec to reflect that P2 mocks only `ICheckExecutor`, not `ICompletionProvider`. The AI layer is P3's responsibility.

---

## Summary table

| # | Finding | Severity | Category |
|---|---------|----------|----------|
| 1 | Duplicate field events not deduplicated | Medium | Edge case |
| 2 | `CheckDependencyResolver` instantiated but unused in scheduler | Low | Dead code |
| 3 | Double-write for consent proposals (propose + proposeAt) | Medium | Logic error |
| 4 | Consent before fields are met is silently accepted | Medium | Edge case |
| 5 | Spec requires `actor` in audit entries, not implemented | Medium | Spec compliance |
| 6 | `"failed"` pipeline status never used | Low | Omission |
| 7 | `consentWaitingChecks` deletion ordering in `onConsentDenied` | Low | Fragility |
| 8 | Hard-coded `"sanctions"` check ID in decision aggregator | High | Logic error |
| 9 | Pipeline never completes if some fields are never provided | High | Logic error |
| 10 | Audit logger ignores unknown filter keys silently | Low | Omission |
| 11 | No test for zero-check pipeline | Low | Test gap |
| 12 | EXPLANATION.md doesn't clarify timeout is on-demand | Low | Documentation |
| 13 | Misleading variable name `runningOrCompleted` | Low | Clarity |
| 14 | Spec says `check_error`, implementation uses `error` | Medium | Spec compliance |
| 15 | Missing executor produces `check_completed` without `check_started` | Medium | Logic error |
| 16 | `DecisionReason.criterion` set to check ID, not criterion name | Medium | Contract compliance |
| 17 | Potential concurrent `evaluateAndSchedule` re-entry | Medium | Race condition |
| 18 | Unused `zod` dependency | Low | Cleanup |
| 19 | Consent timeout test uses potentially-undefined mock time | Low | Test quality |
| 20 | Spec mentions `ICompletionProvider` mocking but P2 doesn't use it | Low | Spec compliance |

**High severity:** 2 (findings 8, 9)
**Medium severity:** 8 (findings 1, 3, 4, 5, 14, 15, 16, 17)
**Low severity:** 10 (findings 2, 6, 7, 10, 11, 12, 13, 18, 19, 20)
