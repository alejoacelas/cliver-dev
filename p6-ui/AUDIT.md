# P6 dual-view UI prototype audit

Audited: 2026-03-05
Auditor: adversarial review against P6 spec (prototypes.md), P0 contracts, and design doc (sections 2.1--2.3)

---

## Findings

### 1. Session list does not show customer name [High]

**Spec requirement:** "Lists active screening sessions with customer name, status, timestamp" (prototypes.md line 484)

**Actual:** The session list at `/Users/alejo/code/cliver/dev/p6-ui/src/ProviderDashboard.tsx:218-219` renders `session.screeningId` as the primary identifier. No customer name is shown.

**Root cause:** `PipelineState` (from P0's `pipeline.ts`) has no `customerName` field. The prototype can't display what doesn't exist in the contract.

**Recommendation:** Either add a `customerName` field to `PipelineState` in P0, or introduce a separate `SessionSummary` type that P6 consumes for the list view. Until then, document the gap as a known integration issue.

---

### 2. `action_proposed` events with `requiresConsent: true` are silently ignored [High]

**Spec requirement:** The design doc (section 2.3) defines actions requiring customer consent. The SSE contract defines `action_proposed` with `requiresConsent: boolean`.

**Actual:** `CustomerPortal.tsx:71` discards `action_proposed` events entirely. If the pipeline proposes an action that requires consent via this event type (rather than `consent_request`), the customer never sees a consent dialog.

**Recommendation:** When `action_proposed` events arrive with `requiresConsent: true`, they should surface a consent dialog. Alternatively, clarify in the spec that all consent flows must come through `consent_request` SSE events and that `action_proposed` is provider-only.

---

### 3. No error state shown to customers [Medium]

**Spec requirement:** The spec mentions completion state and generic status but doesn't explicitly require error handling. However, the SSE contract includes an `error` event type.

**Actual:** `CustomerPortal.tsx:70` silently swallows `error` events. If the pipeline fails, the customer sees either the last status message forever or nothing at all. There's no error or failure state in the UI.

**Recommendation:** Add a generic error state (e.g., "Something went wrong. Please try again or contact support.") that triggers on `error` events, without revealing the technical error message.

---

### 4. ConsentDialog lacks focus trapping and keyboard dismissal [Medium]

**Spec requirement:** The spec lists ConsentDialog as a modal. WAI-ARIA modal dialog pattern requires focus trapping and Escape key dismissal.

**Actual:** `ConsentDialog.tsx` sets `role="dialog"` and `aria-modal="true"` but:
- No focus trap: tab can escape the dialog to elements behind the backdrop (`ConsentDialog.tsx:27-65`)
- No Escape key handler to deny/dismiss
- Backdrop click does nothing (appropriate for consent, but focus leak is not)

**Recommendation:** Add a focus trap (e.g., using a `useEffect` to manage focus on mount/unmount) and Escape key handler. Consider a lightweight approach rather than pulling in a library.

---

### 5. `ViewFilter` is imported but never used functionally [Medium]

**Spec requirement:** P0's `sse.ts` defines `ViewFilter` ("customer" | "provider" | "debug") to control which SSE events a client receives. P5 is supposed to filter events by view.

**Actual:** `ViewFilter` is imported in `contract-check.ts:38` but never referenced in any variable or type assertion. No component or hook uses `ViewFilter` to filter events. The CustomerPortal receives pre-filtered `SSEEvent[]` via props, but there's no mechanism to enforce or verify the filter.

**Recommendation:** Either implement a `useViewFilter` hook that filters SSEEvent arrays by ViewFilter, or add a contract-check assertion that demonstrates the relationship. Currently, correct filtering is entirely the caller's responsibility with no guardrails.

---

### 6. `contract-check.ts` does not actually verify `ViewFilter` or `action_proposed` handling [Medium]

**Actual:** `contract-check.ts` imports `ViewFilter` (line 38) and `ConsentStatus` (line 37) but never assigns them to variables or uses them in type checks. The file only verifies that component prop types are structurally compatible with P0 types, which is a useful but incomplete check.

Specifically:
- `ViewFilter` is imported but never used (`contract-check.ts:38`)
- `ConsentStatus` is imported but never used (`contract-check.ts:37`)
- `CheckOutcome` is imported but never used in any assertion (`contract-check.ts:36`)

**Recommendation:** Add `satisfies` assertions for all imported P0 types, or remove the unused imports to avoid giving a false sense of completeness.

---

### 7. No responsive testing; mobile claims are aspirational [Medium]

**Spec requirement:** "Both views render on mobile and desktop" (prototypes.md line 496)

**Actual:** The components use Tailwind responsive prefixes sparingly:
- `ProviderDashboard.tsx:77` uses `sm:grid-cols-3` for check progress
- `ConsentDialog.tsx:38` uses `mx-4` for dialog margins
- `CustomerPortal.tsx:94` uses `max-w-2xl mx-auto`

These are reasonable but there is no viewport-based testing. None of the 50 tests set a viewport size or test at mobile breakpoints. The test environment is jsdom, which has no concept of viewport width.

**Recommendation:** Add at least one Playwright or Cypress integration test per view that runs at mobile viewport widths (e.g., 375px). For unit tests, consider testing that responsive CSS classes are present in the rendered output.

---

### 8. Performance test for 50+ sessions is shallow [Low]

**Spec requirement:** "Provider dashboard handles 50+ sessions in the list without performance issues" (prototypes.md line 497)

**Actual:** `ProviderDashboard.test.tsx:65-77` renders 55 sessions and asserts all 55 list items exist. This proves the component doesn't crash, but doesn't measure:
- Render time
- Memory usage
- Scroll performance
- Re-render cost when sessions update

No virtualization library is used. All 55+ sessions are rendered as DOM nodes simultaneously.

**Recommendation:** For a prototype, this is acceptable. For production, add list virtualization (e.g., `@tanstack/react-virtual`) and a benchmark test. Document the current approach as "55 sessions verified, no virtualization."

---

### 9. `@cliver/p5-events` is a declared dependency but never imported [Low]

**Actual:** `package.json:18` lists `"@cliver/p5-events": "link:../p5-events"` as a dependency. The Vite config and vitest config both set up an alias for it. However, no source file in `src/` imports from `@cliver/p5-events`.

**Recommendation:** Remove the dependency if it's not needed, or document why it's there (e.g., planned for SSE connection logic not yet implemented).

---

### 10. Consent flow E2E tests are not truly end-to-end [Low]

**Spec requirement:** "Pipeline proposes consent action -> customer portal shows dialog -> customer approves -> pipeline resumes -> provider sees check continue" (prototypes.md line 492)

**Actual:** `consent-flow.test.tsx` tests two separate components in two separate renders:
- Tests 1-2: Render CustomerPortal, click approve/deny, verify callback fires
- Tests 3-4: Render ProviderDashboard with pre-baked audit events that include consent data

The tests never verify the actual flow: customer action -> callback -> state change -> provider update. The connection between the two views is not tested. The "provider sees check continue" scenario (line 492) and "provider sees skip reason" scenario (line 493) are not tested.

**Recommendation:** Add a test that renders both components sharing state, simulates the customer approving/denying, and verifies the provider view updates accordingly. Even with mocked state management, this would catch integration issues.

---

### 11. `ScreeningTimeline` and `AuditTrail` are functionally identical [Low]

**Actual:** Both components:
- Accept `PipelineEvent[]`
- Render a chronological list with timestamps
- Format event details with a `switch` statement
- Have identical `formatTime` functions (copy-pasted at `ScreeningTimeline.tsx:36-43` and `AuditTrail.tsx:42-48`)

The only differences are visual: timeline uses a left border, audit trail uses dividers and shows the screening ID.

**Recommendation:** Consider extracting a shared `formatTime` utility and a shared `describeEvent`/`formatDetails` function. Alternatively, make `AuditTrail` a variant of `ScreeningTimeline` via a `variant` prop. This is a style concern, not a bug.

---

### 12. `field_event` SSE type is silently ignored everywhere [Low]

**Actual:** The `field_event` SSE event type (`sse.ts:95-99`) is listed in the switch statement at `CustomerPortal.tsx:72` as a no-op. It's not used in any component, test, or fixture.

Per the P0 contract, `field_event` carries `fieldId` and `status` ("received" | "completed" | "error"). This could be used to show field-level acknowledgment in the customer portal (e.g., checkmark next to a submitted field).

**Recommendation:** Either implement field acknowledgment in the CustomerPortal status area or document this as deferred to integration.

---

### 13. `providerSSEEvents` fixture is defined but never used in tests [Low]

**Actual:** `test-fixtures.ts:235-242` defines `providerSSEEvents` (tool_call, tool_result events). This fixture is never imported by any test file. The provider dashboard tests use `PipelineEvent[]` and `CompleteData` instead of `SSEEvent[]`.

**Recommendation:** Either write tests that verify provider SSE event processing, or remove the unused fixture. Its presence suggests planned but unimplemented test coverage.

---

### 14. No `aria-live` region for streaming status updates [Low]

**Actual:** The status message area in `CustomerPortal.tsx:103-108` updates as new SSE events arrive, but has no `aria-live` attribute. Screen reader users won't be notified of status changes.

**Recommendation:** Add `aria-live="polite"` to the status message container.

---

### 15. DecisionBadge lacks `aria-label` or semantic role [Low]

**Actual:** `DecisionBadge.tsx:26-43` renders a `<div>` with `<span>` children. There's no ARIA label or landmark role. The decision status is conveyed only through color and text.

**Recommendation:** Add `role="status"` and an `aria-label` (e.g., `aria-label="Decision: FLAG, 2 flags"`) to the outer container so assistive technology users get the full context.

---

## Summary table

| # | Finding | Severity | File(s) |
|---|---------|----------|---------|
| 1 | Session list missing customer name | High | `ProviderDashboard.tsx:218`, `pipeline.ts` (P0) |
| 2 | `action_proposed` with consent ignored | High | `CustomerPortal.tsx:71` |
| 3 | No error state for customers | Medium | `CustomerPortal.tsx:70` |
| 4 | ConsentDialog lacks focus trap / Escape | Medium | `ConsentDialog.tsx:27-65` |
| 5 | `ViewFilter` imported but unused | Medium | `contract-check.ts:38` |
| 6 | contract-check has unused P0 imports | Medium | `contract-check.ts:36-38` |
| 7 | No responsive/mobile testing | Medium | All test files |
| 8 | Shallow 50+ session performance test | Low | `ProviderDashboard.test.tsx:65-77` |
| 9 | `@cliver/p5-events` dep unused | Low | `package.json:18` |
| 10 | Consent E2E tests not truly E2E | Low | `consent-flow.test.tsx` |
| 11 | Timeline and AuditTrail duplicated | Low | `ScreeningTimeline.tsx`, `AuditTrail.tsx` |
| 12 | `field_event` SSE type ignored | Low | `CustomerPortal.tsx:72` |
| 13 | `providerSSEEvents` fixture unused | Low | `test-fixtures.ts:235-242` |
| 14 | No `aria-live` on status updates | Low | `CustomerPortal.tsx:103-108` |
| 15 | DecisionBadge lacks semantic role | Low | `DecisionBadge.tsx:26-43` |

**Totals:** 2 High, 5 Medium, 8 Low

**Overall assessment:** The prototype successfully implements the core dual-view architecture with correct information boundary separation (customer vs. provider). The P1 DynamicForm integration is correct. All 50 tests pass and cover the main scenarios. The most important gaps are the missing customer name in the session list (a P0 contract gap), and the silent ignoring of `action_proposed` events that require consent. The a11y issues (focus trap, aria-live, semantic roles) should be addressed before any user-facing deployment.
