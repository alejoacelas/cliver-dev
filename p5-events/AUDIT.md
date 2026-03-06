# P5 event routing + SSE: audit

**Auditor:** Claude Opus 4.6
**Date:** 2026-03-05
**Scope:** All source files in `src/`, all test files in `test/`, `contract-check.ts`, `EXPLANATION.md`
**References:** P5 spec from `prototypes.md` (lines 399-448), P0 contracts (`sse.ts`, `interfaces.ts`, `pipeline.ts`), design doc section 2.2

---

## Findings

### 1. EventBus does not implement IEventEmitter

**Severity:** High

The P0 contract defines `IEventEmitter` in `/Users/alejo/code/cliver/dev/p0-contracts/src/interfaces.ts` (lines 167-181):

```ts
export interface IEventEmitter {
  emit(event: PipelineEvent): Promise<void>;
  subscribe(
    filter: { screeningId?: string; viewFilter?: ViewFilter },
    listener: (event: PipelineEvent) => void,
  ): () => void;
}
```

The P5 `EventBus` has a fundamentally different signature:
- `emit(screeningId: string, event: SSEEvent): void` (sync, two args, SSEEvent not PipelineEvent)
- `subscribe(screeningId: string, view: ViewFilter, listener: EventListener): () => void` (positional args, not a filter object)

The `contract-check.ts` file (lines 65-76) acknowledges this mismatch explicitly and calls it "intentional." However, this means nothing in P5 actually implements or is type-compatible with `IEventEmitter`. The contract check only verifies that `Parameters<EventBus["emit"]>` extends `[string, SSEEvent]`—which is a tautology, not a contract check.

**Impact:** When P8 or the integration layer needs an `IEventEmitter`, the EventBus cannot be used without an adapter. There is no adapter in P5, and none is mentioned in the spec or EXPLANATION.md.

**Recommendation:** Either (a) write an adapter that wraps EventBus and implements `IEventEmitter` by mapping `PipelineEvent` to `SSEEvent`, or (b) update the P0 contract to reflect that the event bus works at the SSE layer, not the pipeline layer. Either way, the contract-check.ts should verify real compatibility, not hand-wave it.

---

### 2. SSE emitter error event is missing `screeningId`

**Severity:** High

In `/Users/alejo/code/cliver/dev/p5-events/src/sse-emitter.ts` (lines 62-65):

```ts
const errorEvent = JSON.stringify({ type: "error", message });
```

The `SSEEventSchema` in P0 contracts requires `screeningId` on every event type including `error` (see `/Users/alejo/code/cliver/dev/p0-contracts/src/sse.ts` lines 71-75). The emitter constructs an error event without `screeningId`, which means:
1. The error event will fail Zod validation on the client side (the SSE client validates against `SSEEventSchema`).
2. It violates the contract's discriminated union—clients receiving this event through `connect()` will see it reported as a parse error, not as an error event.

The test at `/Users/alejo/code/cliver/dev/p5-events/test/sse-emitter.test.ts` (lines 71-101) checks `errorLine.message` but does not validate the error event against `SSEEventSchema`, so this bug is masked.

**Recommendation:** Either pass the `screeningId` into `streamEvents` (or derive it from the event source), or use a separate error frame format that is not part of `SSEEvent`. If using the latter, the client must be updated to handle it.

---

### 3. SSE emitter test server does not exercise `streamEvents()`

**Severity:** High

The spec says P5 owns `SSEEmitter — streamEvents(res, eventSource: AsyncGenerator<SSEEvent>)`. However, the test server in `/Users/alejo/code/cliver/dev/p5-events/test/helpers.ts` (lines 100-138) implements SSE streaming with a hand-rolled `ReadableStream`, completely bypassing the `streamEvents()` function from `src/sse-emitter.ts`.

This means:
- The `streamEvents()` function is **never tested through HTTP**. The emitter tests claim "via real HTTP" but use the helper's independent implementation.
- Any bugs in `streamEvents()` (e.g., its `WritableForSSE` interface usage, its heartbeat timer, its close handling) are not exercised.
- The spec scenario "Client disconnect stops consuming the generator" is not tested at all.

**Recommendation:** Rewrite the test server helper to use `streamEvents()` with a `WritableForSSE` adapter wrapping the Node.js response. This is the whole point of the prototype—proving the emitter works over real HTTP.

---

### 4. Missing spec test scenario: client disconnect stops consuming the generator

**Severity:** Medium

The spec in `prototypes.md` line 424 requires: "Client disconnect stops consuming the generator." There is no test for this scenario. The emitter code handles it (line 56: `if (closed) break`), but the behavior is unverified.

**Recommendation:** Add a test that connects a client, starts receiving events, disconnects (aborts the fetch), and then verifies the generator is no longer consumed (e.g., by checking that a side-effect callback in the generator stops being called).

---

### 5. Provider view does not differentiate from debug view

**Severity:** Medium

The spec (lines 436-437) distinguishes provider and debug views:
- **Provider:** "receives everything except raw debug data"
- **Debug:** "receives raw unfiltered events including timing, model tokens, internal state"

The event router at `/Users/alejo/code/cliver/dev/p5-events/src/event-router.ts` (lines 18-21) treats them identically:

```ts
if (view === "provider") {
  return event;
}
```

Both views return every event unmodified. The comment says "For now, all SSE event types are visible to providers," but the spec explicitly calls for different behavior. The current `SSEEventSchema` does not include debug-specific event types (timing, model tokens, internal state), so there is nothing to filter yet—but this is a spec gap, not a valid "for now" deferral.

**Impact:** When debug-specific events are added, the provider filter will need to be updated. If that doesn't happen, providers will see raw pipeline internals.

**Recommendation:** At minimum, add a comment or TODO acknowledging this is a known gap. Ideally, define a `debug_info` event type in the SSE schema and implement provider-view filtering that blocks it.

---

### 6. `complete` event redaction uses hardcoded structure that may drift from schema

**Severity:** Medium

In `/Users/alejo/code/cliver/dev/p5-events/src/event-router.ts` (lines 38-51), the customer-view redaction constructs a new `complete` event with hardcoded field values:

```ts
return {
  type: "complete",
  screeningId: event.screeningId,
  data: {
    decision: event.data.decision,
    checks: [],
    backgroundWork: null,
    audit: {
      toolCalls: [],
      raw: { verification: "", work: null },
    },
  },
};
```

This is tightly coupled to the shape of `CompleteDataSchema`. If the schema gains new fields, the redacted version will silently omit them (no compile error because the object literal satisfies the current type). If existing fields are renamed, the compiler will catch it, but new optional fields will be silently missing.

**Recommendation:** Use a spread-then-override pattern: `{ ...event, data: { ...event.data, checks: [], backgroundWork: null, audit: { toolCalls: [], raw: { verification: "", work: null } } } }`. This way, new fields added to `CompleteData` will pass through by default rather than being silently dropped.

---

### 7. EventBus `emit` is synchronous; `IEventEmitter.emit` is async

**Severity:** Medium

`IEventEmitter.emit` returns `Promise<void>` (`/Users/alejo/code/cliver/dev/p0-contracts/src/interfaces.ts` line 169). `EventBus.emit` returns `void` (`/Users/alejo/code/cliver/dev/p5-events/src/event-bus.ts` line 26).

Even if a future adapter wraps the EventBus, the synchronous nature means listener errors will throw synchronously into the emitter, potentially killing the pipeline's event emission loop. An async emit would let errors be caught and handled separately.

**Recommendation:** Make `EventBus.emit` async, or wrap listener calls in try-catch to prevent one failing listener from blocking others.

---

### 8. No listener error isolation in EventBus

**Severity:** Medium

In `/Users/alejo/code/cliver/dev/p5-events/src/event-bus.ts` (lines 30-35):

```ts
for (const sub of subs) {
  const filtered = filterForView(event, sub.view);
  if (filtered !== null) {
    sub.listener(filtered);
  }
}
```

If `sub.listener` throws, all subsequent subscribers for that `screeningId` will miss the event. There is no try-catch around listener invocation.

**Impact:** In production, a bug in one SSE connection handler would silently kill event delivery to all other connections for the same screening session.

**Recommendation:** Wrap each `sub.listener(filtered)` call in a try-catch.

---

### 9. Potential memory leak: unsubscribe does not clear subscription Set from Map

**Severity:** Low

In `/Users/alejo/code/cliver/dev/p5-events/src/event-bus.ts` (lines 56-61), the unsubscribe function deletes the subscription from the Set and removes the Set from the Map when empty. However, the `subs!` non-null assertion (line 57) relies on the closure capturing `subs` correctly. If `subscribe` is called for the same `screeningId` again between the original subscribe and unsubscribe, `subs` in the closure might be stale.

On inspection, this is actually safe because the closure captures the `subs` variable which was the Set obtained from `this.subscriptions.get(screeningId)`, and the `delete` call on the Map entry only happens when the Set is empty. But the pattern is fragile: if someone later refactors to create a new Set on re-subscribe, the closure's `subs` reference would be stale.

**Recommendation:** In the unsubscribe function, re-fetch `this.subscriptions.get(screeningId)` instead of relying on the closure's `subs` reference.

---

### 10. EXPLANATION.md claims SSE emitter "sends an error event to the client before closing"—test does not validate client receives valid error

**Severity:** Low

EXPLANATION.md (paragraph under "SSE emitter") says: "If the event generator encounters an error, the emitter sends an error event to the client before closing the connection."

The test validates this by checking the raw JSON has `type: "error"` and a `message` field. But per Finding #2, this error event is not a valid `SSEEvent` (missing `screeningId`). The EXPLANATION's description is accurate for what the code does, but misleading because it implies the error event conforms to the event schema.

**Recommendation:** Fix Finding #2 and update the EXPLANATION to clarify error event structure.

---

### 11. `check_completed` event type mentioned in spec but no SSE equivalent exists

**Severity:** Low

The spec at `prototypes.md` line 436 says providers should receive "`check_completed` with evidence." The P0 contract defines `check_completed` as a `PipelineEvent` type (`/Users/alejo/code/cliver/dev/p0-contracts/src/pipeline.ts` lines 121-125), but there is no `check_completed` type in `SSEEventSchema`. There is no mapping layer between `PipelineEvent` and `SSEEvent` in P5.

The EXPLANATION.md correctly states that P5 "does not map pipeline events to SSE events" (Boundaries section), but the spec appears to expect `check_completed` events to flow through the SSE layer.

**Recommendation:** Either add a `check_completed` SSE event type to the P0 contracts, or document explicitly that the spec's mention of `check_completed` refers to a future mapping layer outside P5's scope.

---

### 12. SSE client `retryCount <= maxRetries` is off-by-one

**Severity:** Low

In `/Users/alejo/code/cliver/dev/p5-events/src/sse-client.ts` line 55:

```ts
while (!closed && retryCount <= maxRetries) {
```

Combined with `retryCount++` on natural stream end (line 127) and error (line 146), this allows `maxRetries + 1` total retry attempts (0, 1, ..., maxRetries). With `maxRetries: 2`, the client will attempt the initial connection plus up to 3 reconnections (retryCount goes 0 -> 1 -> 2, and the loop condition allows entry at retryCount=2).

Wait—on closer inspection: the initial connection has `retryCount = 0`. If it fails, `retryCount` becomes 1. If the second attempt fails, `retryCount` becomes 2. If `maxRetries = 2`, the loop allows `retryCount <= 2`, so it enters the loop, makes a third attempt, and if that fails, `retryCount` becomes 3, and `retryCount > maxRetries` breaks at line 147. So with `maxRetries: 2`, there are 3 total connection attempts (initial + 2 retries), which is correct.

Actually, there is an issue: `retryCount` is reset to 0 on successful connection (line 72). If a connection succeeds and then the stream ends naturally, `retryCount` goes from 0 to 1, and the backoff uses `attempt = 1`. This is correct. No off-by-one after all.

**Severity revised:** Not a bug. Removing this finding.

---

### 12. (Replacing previous) Test assertion weakness: event-bus customer filter test doesn't verify redaction deeply enough

**Severity:** Low

In `/Users/alejo/code/cliver/dev/p5-events/test/event-bus.test.ts` (lines 88-91), the customer subscriber test checks that `checks` is empty but does not verify other redacted fields (`backgroundWork`, `audit`). The event-router test covers this more thoroughly, but the event-bus test only partially validates that the bus applies filtering correctly end-to-end.

**Recommendation:** Add assertions for `backgroundWork` and `audit` in the event-bus customer filter test, or add a comment noting that thorough redaction testing is delegated to the event-router tests.

---

### 13. `collectEvents` helper is exported but never used

**Severity:** Low

`/Users/alejo/code/cliver/dev/p5-events/test/helpers.ts` (lines 168-181) exports `collectEvents()`. It is not used in any test file. This is dead code.

**Recommendation:** Remove it or use it.

---

### 14. Spec calls for `SSEEmitter.streamEvents(res, eventSource)` but actual signature includes `options`

**Severity:** Low

The spec (`prototypes.md` line 413) says:
> `SSEEmitter — streamEvents(res, eventSource: AsyncGenerator<SSEEvent>)`

The implementation has a third parameter: `options?: { heartbeatMs?: number }`. This is a reasonable addition for testability, but the spec is not updated to reflect it.

**Recommendation:** Non-issue for functionality, but the spec should be updated to reflect optional configuration.

---

### 15. Spec calls for `EventBus.emit(sessionId, event)` but implementation uses `screeningId`

**Severity:** Low

The spec uses `sessionId` (`prototypes.md` line 416), while the implementation uses `screeningId`. This naming inconsistency exists throughout the codebase (design doc uses "session" in some places, P0 contracts use `screeningId`).

**Recommendation:** Align terminology. The P0 contracts use `screeningId`, so the implementation is correct. Update the spec.

---

## Summary table

| # | Finding | Severity | File | Line(s) |
|---|---------|----------|------|---------|
| 1 | EventBus does not implement IEventEmitter | High | `src/event-bus.ts`, `contract-check.ts` | 26, 42, 65-76 |
| 2 | Emitter error event missing `screeningId` | High | `src/sse-emitter.ts` | 62-65 |
| 3 | Test server bypasses `streamEvents()` entirely | High | `test/helpers.ts` | 100-138 |
| 4 | Missing test: client disconnect stops generator | Medium | (absent) | - |
| 5 | Provider and debug views are identical | Medium | `src/event-router.ts` | 18-21 |
| 6 | Redaction uses hardcoded structure, may drift | Medium | `src/event-router.ts` | 38-51 |
| 7 | EventBus.emit is sync; IEventEmitter.emit is async | Medium | `src/event-bus.ts` | 26 |
| 8 | No listener error isolation in EventBus | Medium | `src/event-bus.ts` | 30-35 |
| 9 | Unsubscribe closure captures potentially stale ref | Low | `src/event-bus.ts` | 56-61 |
| 10 | EXPLANATION implies error event is schema-valid | Low | `EXPLANATION.md`, `src/sse-emitter.ts` | - |
| 11 | `check_completed` spec scenario has no SSE type | Low | `src/sse-emitter.ts` | - |
| 12 | Event-bus test shallow on redaction assertions | Low | `test/event-bus.test.ts` | 88-91 |
| 13 | `collectEvents` helper is dead code | Low | `test/helpers.ts` | 168-181 |
| 14 | `streamEvents` signature differs from spec | Low | `src/sse-emitter.ts` | 19 |
| 15 | `sessionId` vs `screeningId` naming | Low | spec vs implementation | - |

**High findings: 3 | Medium findings: 5 | Low findings: 7**

The three high-severity findings are the most actionable: the emitter's malformed error event (#2) is a runtime bug that will cause client-side parse failures; the test server bypassing `streamEvents()` (#3) means the core emitter function has no integration test coverage; and the IEventEmitter mismatch (#1) will create integration friction when assembling the full system.
