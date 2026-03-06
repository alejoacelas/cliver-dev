# Linear walkthrough of p6-ui

This document walks through every source file in `p6-ui` in a logical reading order, so you can understand the full codebase without opening any files.

p6-ui is a React UI package for the cliver screening system. It provides two views: a **customer portal** (form + consent dialogs + opaque status messages) and a **provider dashboard** (full evidence, decisions, audit trails). The customer never sees internal details; the provider sees everything.

---

## 1. Project configuration

### `package.json`

Declares the package as `@cliver/p6-ui`. It depends on three sibling workspace packages (`@cliver/contracts`, `@cliver/form-engine`, `@cliver/p5-events`) via `link:` references, plus React 19 and Zod. Dev tooling is Vite, Vitest, Tailwind CSS, and Testing Library.

```json
"exports": {
  ".": "./src/index.ts"
},
"scripts": {
  "dev": "vite",
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "tsc --noEmit"
}
```

### `tsconfig.json`

Targets ES2022 with `react-jsx` transform and `bundler` module resolution. Maps the three sibling packages to their source entry points so TypeScript resolves types directly from source, not built artifacts:

```json
"paths": {
  "@cliver/contracts": ["../p0-contracts/src/index.ts"],
  "@cliver/form-engine": ["../p1-form-engine/src/index.ts"],
  "@cliver/p5-events": ["../p5-events/src/index.ts"]
}
```

### `vite.config.ts`

Mirrors the same aliases for Vite's resolver and pins React to this package's `node_modules` copy (preventing duplicate React instances when sibling packages also depend on React). Dev server runs on port 3060.

```ts
resolve: {
  alias: {
    "@cliver/contracts": path.resolve(__dirname, "../p0-contracts/src/index.ts"),
    "@cliver/form-engine": path.resolve(__dirname, "../p1-form-engine/src/index.ts"),
    "@cliver/p5-events": path.resolve(__dirname, "../p5-events/src/index.ts"),
    "react": path.resolve(__dirname, "node_modules/react"),
    "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
  },
},
```

### `vitest.config.ts`

Same aliases as Vite, plus jsdom environment, global test APIs, CSS disabled, and a setup file:

```ts
test: {
  globals: true,
  environment: "jsdom",
  setupFiles: ["./src/test-setup.ts"],
  css: false,
},
```

### `tailwind.config.js` and `postcss.config.js`

Minimal Tailwind v3 config scanning `./index.html` and `./src/**/*.{ts,tsx}`. PostCSS chains `tailwindcss` then `autoprefixer`.

---

## 2. Test infrastructure

### `src/test-setup.ts`

One line—imports jest-dom matchers for Vitest so every test file can use `.toBeInTheDocument()`, `.toHaveAttribute()`, etc. without explicit imports:

```ts
import "@testing-library/jest-dom/vitest";
```

### `src/test-fixtures.ts`

The shared data factory for all tests. Imports contract types (`FormSchema`, `PipelineState`, `PipelineEvent`, `SSEEvent`, `Decision`, `CheckOutcome`, `CompleteData`) and exports canned instances.

**Form schema** — a four-field screening intake form (name, email, institution, order details) with validation rules:

```ts
export const testFormSchema: FormSchema = {
  id: "screening-intake",
  version: "1.0",
  title: "Customer screening",
  fields: [
    { id: "name", label: "Full name", type: "text", ... },
    { id: "email", label: "Business email", type: "email", ... },
    { id: "institution", label: "Institution", type: "text", ... },
    { id: "orderDetails", label: "Sequence order details", type: "textarea", ... },
  ],
};
```

**Decisions** — three variants covering the decision space:

```ts
export const passDecision: Decision = { status: "PASS", flagCount: 0, ... };
export const flagDecision: Decision = { status: "FLAG", flagCount: 2, ... };
export const reviewDecision: Decision = { status: "REVIEW", flagCount: 1, ... };
```

**Check outcomes** — `passOutcome` (affiliation confirmed via ORCID), `flagOutcome` (sanctions list match), `undeterminedOutcome` (email domain unknown).

**Pipeline states** — three stages: `pendingPipelineState` (nothing started, four checks pending), `runningPipelineState` (two checks running, consent granted for sanctions), `completedPipelineState` (all four checks done, `flagDecision` rendered).

**Pipeline events** — a chronological sequence of nine events (`field_completed` x2, `check_started`, `consent_requested`, `consent_received`, `check_started`, `check_completed` x2, `pipeline_complete`) that represent a full screening session lifecycle.

**SSE events** — two arrays: `customerSSEEvents` (generic status messages, a consent request, and a completion event—no internal details) and `providerSSEEvents` (tool calls, tool results, status messages—full visibility).

**Complete data** — `sampleCompleteData` with four check results (three NO FLAG, one FLAG), background work entries, and an audit section with tool call durations.

**Session generator** — `generateSessions(count)` creates `count` pipeline states cycling through `pending/running/completed/failed` statuses:

```ts
export function generateSessions(count: number): PipelineState[] {
  const statuses: PipelineState["status"][] = ["pending", "running", "completed", "failed"];
  return Array.from({ length: count }, (_, i) => ({ ... }));
}
```

This file is the foundation everything else builds on. The components consume contract types; the tests use these fixtures to exercise them.

---

## 3. Styles

### `src/styles.css`

Three Tailwind directives—nothing custom:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

All styling is done via Tailwind utility classes inline in the components.

---

## 4. Atomic components

### `src/DecisionBadge.tsx`

A presentational component that renders a screening decision as a color-coded badge. Takes a single `Decision` prop and maps its `status` field to Tailwind color classes:

```ts
const STATUS_STYLES: Record<string, string> = {
  PASS: "bg-green-100 text-green-800 border-green-300",
  FLAG: "bg-red-100 text-red-800 border-red-300",
  REVIEW: "bg-yellow-100 text-yellow-800 border-yellow-300",
};
```

The component renders the status text, an optional flag count (`"2 flags"`), and the decision summary paragraph. It's purely visual—no state, no callbacks.

### `src/DecisionBadge.test.tsx`

Six tests covering: correct color class per status (green/red/yellow), flag count shown only when > 0, and summary text displayed. Uses `passDecision`, `flagDecision`, and `reviewDecision` from fixtures.

---

### `src/ConsentDialog.tsx`

A modal dialog for customer consent requests. Props:

```ts
export interface ConsentDialogProps {
  action: string;
  onConsent: () => void;
  onDeny: () => void;
}
```

The component implements full accessibility: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`. It manages focus trapping in a `useEffect`—on mount it saves `document.activeElement`, focuses the first button, intercepts Tab/Shift+Tab to wrap focus between the two buttons, and handles Escape to deny. On unmount it restores the previously focused element.

The dialog body shows the heading "Consent required", an explanation, the `action` text in a gray box, and two buttons (Deny and Approve):

```tsx
<button onClick={handleDeny} ...>Deny</button>
<button onClick={handleApprove} ...>Approve</button>
```

### `src/ConsentDialog.test.tsx`

Ten tests covering: rendering the action description, showing both buttons, callback correctness for approve/deny clicks, `role="dialog"` present, heading text, Escape key triggers deny, auto-focus on first button, and focus trapping on Tab and Shift+Tab.

---

### `src/AuditTrail.tsx`

A chronological list of `PipelineEvent[]` entries for compliance and debugging. Each entry shows a formatted timestamp (HH:MM:SS), the event type as a mono-font label, the screening ID, and event-specific details.

The `formatDetails` function is a discriminated-union switch over all event types:

```ts
function formatDetails(event: PipelineEvent): string {
  switch (event.type) {
    case "field_completed":
      return `Field: ${event.fieldId}`;
    case "check_completed":
      return `Check: ${event.checkId} — ${event.outcome.status} — ${event.outcome.evidence}`;
    case "consent_requested":
      return `Check: ${event.checkId} — ${event.description}`;
    case "pipeline_complete":
      return `Decision: ${event.decision.status} — ${event.decision.summary}`;
    // ... other cases
    default: {
      const _exhaustive: never = event;
      return "";
    }
  }
}
```

The `default` branch uses the `never` type to enforce exhaustive handling at compile time. Empty state renders "No audit entries".

### `src/AuditTrail.test.tsx`

Six tests: correct list item count, event type labels present, timestamps in order, screening ID shown, empty state message, and event details for check events.

---

### `src/ScreeningTimeline.tsx`

Similar to AuditTrail but with a different visual treatment—a vertical timeline with a left border. Takes the same `PipelineEvent[]` prop and renders each event with a timestamp and a human-readable description.

The `describeEvent` function uses the same exhaustive switch pattern but produces more natural descriptions:

```ts
case "field_completed":
  return `Field "${event.fieldId}" completed`;
case "check_started":
  return `Check "${event.checkId}" started`;
case "consent_received":
  return event.granted ? "Consent granted" : "Consent denied";
case "pipeline_complete":
  return `Pipeline complete — ${event.decision.status}`;
```

Where AuditTrail shows raw event data for compliance, ScreeningTimeline presents a readable narrative for the provider.

### `src/ScreeningTimeline.test.tsx`

Eight tests covering each event type's rendering, timestamp display, chronological ordering, and empty state.

---

## 5. Page-level components

### `src/CustomerPortal.tsx`

The customer-facing view. This is where the information asymmetry is enforced—customers see forms and generic messages but never internal details. Props:

```ts
export interface CustomerPortalProps {
  schema: FormSchema;
  screeningId: string;
  onFieldComplete: (event: FieldEvent) => void;
  onConsentResponse: (checkId: string, granted: boolean) => void;
  events?: SSEEvent[];
}
```

State is derived from SSE events via `useMemo`. The event loop processes each event by type, deliberately ignoring `tool_call`, `tool_result`, `delta`, and `field_event` events that would leak internal information:

```ts
const { statusMessage, consentRequests, isComplete, hasError } = useMemo(() => {
  for (const event of events) {
    switch (event.type) {
      case "status":
        statusMessage = event.message;
        break;
      case "consent_request":
        consentRequests.push({ checkId: event.checkId, description: event.description });
        break;
      case "action_proposed":
        if (event.requiresConsent) {
          consentRequests.push({ checkId: event.actionId, description: event.description });
        }
        break;
      case "complete":
        isComplete = true;
        break;
      case "error":
        hasError = true;
        break;
      // Ignore events that customers shouldn't see
      case "tool_call":
      case "tool_result":
      case "delta":
      case "field_event":
        break;
    }
  }
}, [events]);
```

The render has four sections:
1. **Form** — renders `<DynamicForm>` (from `@cliver/form-engine`) driven by the schema, hidden after completion.
2. **Status area** — an `aria-live="polite"` region showing a spinner and status message, or a generic error ("Something went wrong. Please try again or contact support.") that hides the raw error.
3. **Completion message** — "Your screening is complete. A representative will contact you with next steps." No decision status shown.
4. **Consent dialog** — overlays `<ConsentDialog>` when there's an undismissed consent request. Dismissed requests are tracked in a `Set<string>` state.

### `src/CustomerPortal.test.tsx`

Fourteen tests covering: form rendering from schema, generic status display (no tool calls or check names leaked), consent request showing modal dialog, approve/deny callbacks with correct arguments, completion message without decision details, tool_call events not shown, action_proposed consent handling, error state rendering (raw technical error hidden), aria-live attribute, and dialog dismissal after response.

---

### `src/ProviderDashboard.tsx`

The provider-facing view—full visibility into everything. Props:

```ts
export interface ProviderDashboardProps {
  sessions: PipelineState[];
  auditEvents: Record<string, PipelineEvent[]>;
  completeDataMap: Record<string, CompleteData>;
  initialSelectedId?: string;
}
```

The component has two modes, toggled by `selectedId` state:

**Session list view** — renders all sessions as a clickable `<ol>`. Each row shows the screening ID, a color-coded status badge (`pending`/`running`/`completed`/`failed`), and a formatted timestamp:

```ts
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  running: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};
```

**Detail view** — when a session is selected, renders:
1. A back button and screening ID heading.
2. `<DecisionBadge>` if a decision exists.
3. **Check progress** — a three-column grid showing pending, running (with animated pulse dots), and completed checks.
4. **Evidence table** — from `CompleteData.checks`, a `<table>` with columns for criterion, status (color-coded via `checkStatusStyle`), evidence text, and source citations in mono font.
5. **Background work** — organism entries with relevance scores and summaries.
6. **Timeline** — `<ScreeningTimeline>` for the selected session's events.
7. **Audit trail** — `<AuditTrail>` for the same events.

This is where all four atomic components come together. The provider sees the decision badge, timeline, and audit trail that the customer never sees.

### `src/ProviderDashboard.test.tsx`

Ten tests split into two `describe` blocks. Session list tests: listing sessions, showing status and timestamps, clicking to open detail, handling 55 sessions. Detail view tests: check progress sections visible, decision badge for completed sessions, evidence text and source citations, audit trail section, and back navigation.

---

## 6. Integration tests

### `src/consent-flow.test.tsx`

Four end-to-end tests that verify the consent flow across both views:

1. Customer approves consent -> `onConsentResponse` fires with `granted=true`, dialog dismissed.
2. Customer denies -> `onConsentResponse` fires with `granted=false`, dialog dismissed.
3. Provider sees `consent_received` event ("Consent granted") in audit trail after customer responds.
4. Provider sees `consent_requested` event in timeline.

These tests don't test network communication—they verify that the UI components correctly handle the consent lifecycle that would be mediated by SSE events in production.

---

## 7. App shell and entry point

### `src/App.tsx`

The dev shell that ties everything together. A top nav bar lets you switch between "Customer portal" and "Provider dashboard" views.

**CustomerView** — runs a simulated event sequence. A "Start simulated screening" button drip-feeds `customerSSEEvents` with 2-second delays via `setTimeout`, so you can watch the form, status message, consent dialog, and completion state unfold in real time:

```ts
customerSSEEvents.forEach((event, i) => {
  const t = setTimeout(() => {
    setEvents((prev) => [...prev, event]);
  }, (i + 1) * 2000);
  timeoutRef.current.push(t);
});
```

**ProviderView** — instantiates `<ProviderDashboard>` with pre-populated data: three named sessions (`completedPipelineState`, `runningPipelineState`, a pending one) plus 10 generated sessions, with audit events and complete data for `scr-001`.

### `src/main.tsx`

The Vite entry point. Mounts `<App>` inside `<StrictMode>` on the `#root` element:

```tsx
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

### `index.html`

Minimal HTML shell with a `<div id="root">` and a module script tag pointing to `/src/main.tsx`. Title is "Cliver P6 — Dual-view UI".

---

## 8. Public API

### `src/index.ts`

The package's public surface. Re-exports all six components and their prop types:

```ts
export { CustomerPortal, type CustomerPortalProps } from "./CustomerPortal.js";
export { ProviderDashboard, type ProviderDashboardProps } from "./ProviderDashboard.js";
export { ConsentDialog, type ConsentDialogProps } from "./ConsentDialog.js";
export { ScreeningTimeline, type ScreeningTimelineProps } from "./ScreeningTimeline.js";
export { DecisionBadge, type DecisionBadgeProps } from "./DecisionBadge.js";
export { AuditTrail, type AuditTrailProps } from "./AuditTrail.js";
```

Note that `App`, `main`, test fixtures, and styles are not exported—they're internal to the dev shell. Consumers of this package import the components and compose them with their own data sources and event streams.

---

## Architecture summary

The dependency graph flows upward:

```
test-fixtures (data) ──────────────────────────┐
                                                │
DecisionBadge ──────────────────┐               │
ConsentDialog ──────────────────┤               │
AuditTrail ─────────────────────┤               │
ScreeningTimeline ──────────────┤               │
                                ▼               │
CustomerPortal (uses ConsentDialog, DynamicForm)│
ProviderDashboard (uses DecisionBadge,          │
  ScreeningTimeline, AuditTrail)                │
                                ▼               │
App (uses CustomerPortal, ProviderDashboard) ◄──┘
                                ▼
main (mounts App)
                                ▼
index.ts (re-exports components)
```

The key design decision is **information asymmetry**: `CustomerPortal` processes the same SSE event stream but filters out provider-only events, while `ProviderDashboard` shows everything. Both views are driven by the same contract types from `@cliver/contracts`.
