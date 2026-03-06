# P6: Dual-view UI

## What problem this solves

The Cliver screening platform needs two completely different views of the same screening process. A customer being screened should see a simple form, consent prompts, and a generic "your screening is complete" message — nothing about what checks ran or what was found. A provider (the company doing the screening) needs to see everything: which checks are running, what evidence was gathered, what the decision was, and a full audit trail.

P6 builds both of these user interfaces as a single package. It enforces the information boundary between the two views: the customer portal deliberately ignores detailed events, while the provider dashboard displays them all.

## How it works at a high level

The package provides six visual components that can be composed into applications:

**CustomerPortal** is the customer-facing view. It takes a form definition (a data structure describing what fields to show) and renders it using P1's form engine — a separate component that handles field validation, conditional visibility, and event emission. When the screening pipeline needs the customer's permission for something (like running a sanctions check), the portal shows a consent dialog. It also shows a spinner with a generic status message. When the screening finishes, it says "your screening is complete" without revealing the outcome. It explicitly filters out any event types that would leak internal details.

**ProviderDashboard** is the provider-facing view. It has two modes: a session list (showing all active screenings with their status and timestamps) and a detail view. The detail view shows a color-coded decision badge (green for PASS, red for FLAG, yellow for REVIEW), a progress display of which checks are pending/running/completed, an evidence table with citations, background work findings, a chronological timeline, and a full audit trail.

**ConsentDialog** is a modal overlay with approve and deny buttons. When the customer responds, the portal fires a callback that the host application can use to send the response back to the pipeline.

**DecisionBadge** renders the screening decision with color coding and shows how many flags were raised.

**ScreeningTimeline** displays pipeline events in chronological order with human-readable descriptions (e.g., "Check 'affiliation' started", "Consent granted").

**AuditTrail** shows the same events in a more detailed, compliance-oriented format: event type labels, timestamps, screening IDs, and structured detail lines.

## What external services it talks to

None. P6 is a pure rendering layer. It receives data as properties passed into its components — form schemas, pipeline states, events, and complete screening data. In production, this data would come from the SSE event stream (built in P5) and the pipeline orchestrator (P2). For the prototype, the dev server uses canned test data with simulated delays.

The dev server (accessible at localhost:3060) provides a view switcher so you can toggle between the customer and provider experiences. The customer view runs a timed simulation that drip-feeds events every 2 seconds, showing the form, then a consent dialog, then status updates, then completion.

## What its boundaries are

P6 renders state — it does not manage it. It does not:

- Run screening checks or make API calls
- Authenticate users or manage sessions (auth is hardcoded/mocked)
- Orchestrate the pipeline or decide which checks to run
- Connect to SSE streams directly (the host application does that and passes events in)
- Store any data persistently

P6 depends on:
- **P0 contracts** for type definitions (Decision, PipelineState, PipelineEvent, SSEEvent, FormSchema, etc.)
- **P1 form engine** for the DynamicForm component that renders schema-driven forms
- **React** (a library for building user interfaces) for component rendering
- **Tailwind CSS** (a utility-first styling system) for visual styling

The package exports all six components so they can be imported and used by a host application. The test suite (50 tests across 7 files) verifies every interface contract, the consent flow end-to-end within the UI layer, the information boundary between customer and provider views, and rendering correctness for all component states.
