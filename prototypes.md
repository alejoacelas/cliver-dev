# Consolidated prototypes

8 prototypes + 1 shared contracts package. Each prototype lives in its own directory under the project root (e.g., `p0-contracts/`, `p1-form-engine/`, etc.) and is independently buildable with red/green TDD. Integration at the end means swapping implementations behind shared interfaces defined in P0.

Prototypes use **real APIs**—no HTTP mocks. If a prototype needs API credentials that aren't available, the implementing agent should request them directly from the user using the question/ask tool before proceeding.

---

## Delegation protocol

Each prototype is designed to be delegated to a subagent. The implementing agent must follow this protocol:

### Phase 1: Design questions

Before writing any code, the agent must use `AskUserQuestion` (or equivalent) to prompt the user for key design and dependency decisions specific to that prototype. Examples:

- "Which password hashing library should I use: argon2 or bcrypt?"
- "Should the form schema format be JSON Schema or a custom Zod-based format?"
- "The Tavily API requires a key. Do you have one, or should I use a different search provider?"
- "Should the SSE client use EventSource or fetch with a ReadableStream?"

The agent should identify 2--5 blocking decisions and ask them upfront rather than guessing.

### Phase 2: Implementation

Build the prototype with red/green TDD using real APIs and real dependencies. Each prototype directory should be a self-contained package with its own `package.json`, tests, and a README.

### Phase 3: Plain-language explanation

After implementation is complete, the agent must dispatch a subagent whose sole job is to read the implementation and write a plain-language explanation of what was built. The explanation should:

- Be understandable by someone who doesn't know TypeScript, React, or the specific libraries used
- Use proper nouns for technologies but explain them on first use (e.g., "SSE (Server-Sent Events, a way for the server to push updates to the browser in real time)")
- Describe what the code does, not how the code is structured
- Cover: what problem this prototype solves, how it works at a high level, what external services it talks to, and what its boundaries are

The explanation goes in `<prototype-dir>/EXPLANATION.md`.

---

## P0. Shared contracts

**Directory:** `p0-contracts/`

**What it owns:** Types, interfaces, and Zod schemas shared by all prototypes. No logic, no implementations.

**Exports:**

```typescript
// --- Form types ---
FormSchema, FormField, FieldType, VisibilityCondition, ValidationRule

// --- Pipeline types ---
CheckDeclaration        // { id, requiredFields, needsConsent }
CheckOutcome            // { checkId, status: "pass"|"flag"|"undetermined"|"error", evidence }
PipelineState           // running/completed/pending checks, consent state, decision
PipelineEvent           // field_completed, check_started, check_completed, consent_requested,
                        //   consent_received, action_proposed, pipeline_complete, error

// --- Decision types ---
Decision                // { status: "PASS"|"FLAG"|"REVIEW", flagCount, summary, reasons }

// --- SSE types ---
SSEEvent                // Discriminated union: status, tool_call, tool_result, delta, complete,
                        //   error, consent_request, action_proposed, field_event
ViewFilter              // "customer" | "provider" | "debug"

// --- Auth types ---
TokenPayload, Session, ProviderCredentials, PasswordRequirements

// --- Data types ---
CompleteData            // decision + checks + backgroundWork + audit
Evidence, Determination, BackgroundWork
ToolResult              // normalized tool output { tool, query, items, metadata }

// --- External integration types ---
SalesforceCredentials, SalesforceRecord
EmailMessage, EmailTransport

// --- Interfaces (no implementations) ---
ICheckExecutor          // { execute(args): Promise<CheckOutcome> }
ICompletionProvider     // { completeWithTools(...), extractStructured(...), generateText(...) }
IConsentManager         // { propose, consent, deny, isAuthorized, getPending }
IAuditLogger            // { log(event), query(filter) }
ITokenStore             // { set, get, delete }
IEventEmitter           // { emit(event), subscribe(filter, listener) }
IStorageLayer           // CRUD for all entities
```

**Zod schemas:** Every type above has a corresponding Zod schema for runtime validation at system boundaries.

**Existing code to reuse:**
- `~/code/cliver/tool/shared/schema.ts` → `SSEEvent`, `CompleteData` types (extend, don't replace)
- `~/code/cliver/tool/server/prompts.ts` → extraction JSON schemas (`VERIFICATION_EVIDENCE_SCHEMA`, `VERIFICATION_DETERMINATION_SCHEMA`, `BACKGROUND_WORK_SCHEMA`) move here

**Test cases:**
- Every Zod schema validates a conforming object
- Every Zod schema rejects a malformed object (missing required field, wrong type)
- Type exports compile without circular dependencies

---

## P1. Dynamic form engine

**Directory:** `p1-form-engine/`

**What it owns:** Schema parsing, conditional field visibility, field validation, React renderer, and field event emission to the pipeline.

**What it mocks:** Pipeline callback (receives field events but does nothing). This is the one acceptable mock—the pipeline doesn't exist yet during P1 development, and the callback is a simple function signature.

**Design questions to ask first:**
- Should the form schema format be JSON Schema, a custom Zod-based DSL, or plain JSON with Zod validation?
- Which React form library (if any): React Hook Form, Formik, or plain controlled components?
- Should file upload fields be supported in the first iteration?

**Interface contracts exposed:**
- `parseFormSchema(raw): FormSchema`
- `evaluateVisibility(schema, values): Set<string>`
- `validateField(field, value): ValidationResult`
- `<DynamicForm schema={} onFieldComplete={} />` — React component
- Field events: `{ type: "field_completed", fieldId, value, timestamp }`

**Key test scenarios:**

*Schema parsing:*
- Parses minimal schema (one text field)
- Parses all field types: text, email, select, multi-select, file, textarea, date
- Rejects duplicate field IDs
- Rejects `visibleWhen` referencing nonexistent field
- Missing `id` or `type` throws parse error
- `required` defaults to `false` when omitted

*Conditional visibility:*
- Field with no `visibleWhen` is always visible
- `visibleWhen: { field: "type", equals: "academic" }` toggles correctly
- Chained conditions: B depends on A, C depends on B—hiding A hides both B and C
- Supports `equals`, `notEquals`, `in`, `filled` operators
- Circular dependency detection throws at parse time

*Field validation:*
- Required field with empty value fails
- Email field validates format
- Select field rejects value not in options
- Custom regex pattern validation

*React renderer:*
- Renders visible fields only
- Hidden fields don't appear in DOM
- Changing a value that controls visibility shows/hides dependent fields
- Tab order follows visible field order

*Field event emission (the critical interaction):*
- Completing a field (blur + valid value) emits `field_completed` event
- Editing an already-completed field emits a new event with updated value
- Hidden fields do not emit events even if they have values
- Events include field ID, value, and timestamp
- Rapid edits debounce: only the settled value emits

**Existing code to reuse:**
- `~/code/cliver/tool/client/src/pages/home.tsx` → form structure, field layout (currently hardcoded 5 fields—generalize to schema-driven)

---

## P2. Pipeline orchestrator

**Directory:** `p2-pipeline/`

**What it owns:** The core state machine that drives the screening pipeline. Check dependency resolution, parallel scheduling, consent gating, audit logging, decision aggregation, and the full lifecycle: form field → check trigger → consent pause → consent received → check resumes → decision.

**What it mocks:** Check executors (`ICheckExecutor` stubs returning canned results) and AI layer (`ICompletionProvider` returning canned extractions). These are mocked because the orchestrator's job is coordination logic, not external API calls—and running real AI/API calls would make orchestration tests slow and nondeterministic.

**Design questions to ask first:**
- Should the state machine use a library (XState, Robot) or be hand-rolled?
- How should parallel check execution work: Promise.all, a task queue, or an event loop?
- Should audit log entries be written synchronously (blocking) or asynchronously (fire-and-forget)?

**Interface contracts exposed:**
- `CheckScheduler` — `onFieldCompleted(fieldId, value)`, `onConsent(actionId)`, `getState(): PipelineState`, `subscribe(listener)`
- `CheckDependencyResolver` — `resolveEligible(declarations, completedFields, consentedChecks, runningOrCompleted): string[]`
- `ConsentManager` — implements `IConsentManager`
- `AuditLogger` — implements `IAuditLogger`
- `DecisionAggregator` — `computeDecision(outcomes: CheckOutcome[]): Decision`

**Key test scenarios:**

*Dependency resolution:*
- Check with all required fields completed and no consent → eligible
- Check missing one required field → not eligible
- Check requiring consent but not yet consented → not eligible
- Check already running → not eligible (no double-runs)
- Multiple checks become eligible simultaneously → all returned
- Check with empty `requiredFields` → eligible immediately

*Consent gating:*
- Pre-approved action (`needsConsent: false`) executes immediately
- Action needing consent emits `consent_requested`, pauses
- After `consent()`, check resumes and completes
- After `deny()`, check is marked skipped, pipeline continues
- Consent timeout (configurable) marks action as expired

*Orchestration (the end-to-end flow):*
- Completing email field triggers domain validation check (single dependency)
- Completing name + institution triggers sanctions check (multi-field dependency)
- Two independent checks run in parallel (verify non-blocking)
- Check that needs consent: field completed → check starts → proposes consent action → pauses → consent received → check resumes → completes
- Check failure emits `check_error`, pipeline continues with remaining checks
- All checks completed → `computeDecision()` → emits `pipeline_complete` with decision
- Late field completion (after some checks already done) triggers only newly eligible checks

*Audit logging:*
- Every state transition is logged: field completed, check started, consent requested, consent received, check completed, decision made
- Audit entries include sessionId, timestamp, actor, payload
- Query by sessionId returns full timeline
- Query by event type filters correctly

*Decision aggregation:*
- All checks pass → `PASS`
- Sanctions flag → `FLAG`
- Non-sanctions flag → `REVIEW`
- Any check errored → `REVIEW`
- Any check undetermined → `REVIEW`
- Empty checks → `REVIEW`
- Multiple flags: sanctions takes priority over others

**Existing code to reuse:**
- `~/code/cliver/tool/server/pipeline.ts` → `computeDecision()` logic (extract and generalize), `mergeChecks()` pattern
- The `runPipeline()` async generator pattern informs the event emission design, but the new orchestrator is event-driven rather than sequential

---

## P3. Check executors + AI layer

**Directory:** `p3-executors/`

**What it owns:** All external API wrappers (Tavily, screening list, EPMC, ORCID, SecureDNA), AI completion wrapper (OpenRouter), structured extraction, and the AI action proposer (the tool-calling loop where the model decides which tools to invoke).

**Uses real APIs.** Tests hit real Tavily, ORCID, EPMC, US Screening List, and OpenRouter endpoints. If API keys are missing, the agent must ask the user for them before proceeding.

**Design questions to ask first:**
- Which API keys are available? (OpenRouter, Tavily, and any others)
- Should SecureDNA use the client library or their HTTP API?
- Which OpenRouter model should be the default for structured extraction?
- Should there be a caching layer to avoid redundant API calls during development/testing?

**Interface contracts exposed:**
- `ICheckExecutor` implementations: `WebSearchExecutor`, `ScreeningListExecutor`, `EpmcExecutor`, `OrcidExecutor`, `SecureDnaExecutor`
- `ICompletionProvider` implementation: `OpenRouterProvider`
- `extractStructured<T>(text, prompt, schema, model): Promise<T>`
- `completeWithTools(prompt, model, toolNames?, callbacks?): Promise<CompletionResult>`
- `proposeActions(context, provider): Promise<ProposedAction[]>` — AI decides what follow-up actions to take

**Key test scenarios:**

*Check executors (per adapter):*

Web search (Tavily):
- Returns normalized items with title, url, snippet
- Handles empty results, API errors, rate limits
- Truncates excessively long snippets

Screening list (US Consolidated Screening List—no API key required):
- Exact match returns hit with list name, entity, match score
- Fuzzy matching returns partial matches with lower scores
- Parallel query execution for multiple names
- Deduplication by entity name
- No match returns empty items

EPMC (Europe PubMed Central—no API key required):
- Returns publications with title, authors, DOI, abstract
- Lite mode (25 results) vs full mode (5 results with abstracts)
- Author name variant matching
- Empty results for unknown author

ORCID (public API—no API key required):
- Profile found: name, affiliation, works count
- Profile not found: empty result (not error)
- Works search with keyword filtering

SecureDNA:
- Clean sequence returns `{ flagged: false }`
- Flagged sequence returns hits with organism, risk level
- Invalid sequence format throws validation error
- Empty sequence throws

*AI completion wrapper:*
- Streaming: yields text chunks in order, ends with done
- Tool calling: yields tool_call events with correct name and parsed args
- Agentic loop: model calls tool → result fed back → model calls another tool → ... → final text
- Max iteration limit (20) prevents runaway loops
- Handles model API errors (rate limit, context too long, auth)

*Structured extraction:*
- Well-formatted markdown → correct Zod-validated output
- Partially formatted output → extracts what it can
- Schema validation failure → throws typed error
- Evidence extraction: criterion, sources, summary
- Determination extraction: criterion, flag status
- Background work: relevance, organism, summary, sources

*AI action proposer:*
- Given check results with flags, proposes verification email action
- Given insufficient evidence, proposes document request action
- Pre-approved actions marked `needsConsent: false`
- Customer-consent actions marked `needsConsent: true`
- Returns empty list when no follow-up needed

**Existing code to reuse:**
- `~/code/cliver/tool/server/openrouter.ts` → `completeWithTools()`, `extractStructured()`, `generateText()`, `normalizeToolCalls()` (refactor with injectable HTTP client)
- `~/code/cliver/tool/server/tools/registry.ts` → `getToolDefinitions()`, `executeTool()` dispatch pattern
- `~/code/cliver/tool/server/tools/web-search.ts` → `searchWeb()`
- `~/code/cliver/tool/server/tools/screening-list.ts` → `searchScreeningList()`
- `~/code/cliver/tool/server/tools/epmc.ts` → `searchEpmc()`
- `~/code/cliver/tool/server/tools/orcid.ts` → `getOrcidProfile()`, `searchOrcidWorks()`
- `~/code/cliver/tool/server/prompts.ts` → `VERIFICATION_PROMPT`, `WORK_PROMPT`, extraction prompts (templates stay here; schemas move to P0)

---

## P4. Auth + sessions

**Directory:** `p4-auth/`

**What it owns:** Password-based authentication for customers (AAL1) and providers (AAL2 with second factor), email confirmation codes, session management, third-party email verification flow. Compliant with NIST SP 800-63B-4 (see `cybersec/cybersec-requirements.md`).

**Uses real APIs** for email delivery. If SendGrid/SES credentials aren't available, the agent must ask the user.

**Design questions to ask first:**
- Which email provider: SendGrid or AWS SES? Are credentials available?
- For provider MFA (AAL2 second factor): TOTP only, or also support passkeys/WebAuthn?
- Which password hashing: argon2id or bcrypt? (argon2id is the SP 800-63B recommendation)
- Should the breached-password blocklist use the Have I Been Pwned k-anonymity API or a local dataset?
- Where should session secrets be stored: signed cookies, or server-side with a cookie reference?

**Note on magic links:** Email-based magic links are **prohibited** as a primary authentication mechanism by SP 800-63B-4 Sec. 3.1.3.1. Email confirmation codes (for verifying ownership of an email address) are exempt from this prohibition because they are not authentication—they are identity verification. The distinction matters: a confirmation code proves you own the email, but you still authenticate with your password.

**Interface contracts exposed:**
- `PasswordService` — `hash(password)`, `verify(password, hash)`, `checkBlocklist(password)`, `validateStrength(password)`
- `CustomerAuthService` — `register(email, password)`, `login(email, password)`, `confirmEmail(email, code)`
- `ProviderAuthService` — `login(email, password, secondFactor)`, `enrollTOTP(userId)`, `verifyTOTP(userId, code)`
- `SessionService` — `createSession(userId, aal)`, `validateSession(sessionId)`, `destroySession(sessionId)`, `enforceTimeouts(session)`
- `EmailVerificationService` — `requestVerification(contactEmail, customerName, institution)`, `checkStatus(verificationId)`, `handleResponse(token, decision)`
- Auth middleware: `requireAuth(req, res, next)`, `requireProvider(req, res, next)`

**Key test scenarios:**

*Password handling (SP 800-63B-4 Sec. 3.1.1.2):*
- Minimum 15 characters for single-factor passwords, 8 for MFA passwords
- Passwords up to 64+ characters accepted
- No composition rules enforced (no "must contain uppercase" etc.)
- Blocklist rejects known-breached passwords
- Unicode characters accepted, each code point counts as one character
- Entire password verified (no truncation)
- Hashed with salt (at least 32 bits), cost factor stored alongside

*Customer registration + login (AAL1):*
- Register with email + password → confirmation code sent to email
- Confirm email with correct code → account activated
- Confirmation code expires after 24 hours
- Login with correct credentials → session created
- Login with wrong password → rejected
- Login before email confirmation → rejected
- Session timeout: maximum 30 days

*Provider login (AAL2):*
- Login requires password + TOTP code (two distinct factors)
- TOTP enrollment generates secret + QR code
- Correct TOTP code + correct password → session created
- Correct password + wrong TOTP → rejected (both factors required)
- Session timeout: maximum 24 hours, 1-hour inactivity timeout
- At least one phishing-resistant option offered (passkeys, if implemented)

*Rate limiting (SP 800-63B-4 Sec. 3.2.2):*
- Max 100 consecutive failed attempts per account
- After limit, account locked until rebinding
- Progressive delays on repeated failures
- Successful login resets counter

*Email verification (third-party):*
- Creates verification record and sends email to institutional contact
- Email contains confirm/deny links with verification token
- Confirm link sets status to `confirmed`
- Deny link sets status to `denied`
- Unactioned verification expires after TTL
- Duplicate requests for same contact reuse pending verification

*Session management (SP 800-63B-4 Sec. 5.1):*
- Session tokens: at least 64 bits of entropy, cryptographically random
- Cookies: `HttpOnly`, `Secure`, `SameSite=Lax` or `Strict`, `__Host-` prefix
- Session destroyed on logout
- CSRF protection on state-changing requests
- No session data in localStorage (XSS risk)

*Auth middleware:*
- Request with valid session proceeds
- Request without session returns 401
- Provider-only endpoint rejects customer session

---

## P5. Event routing + SSE

**Directory:** `p5-events/`

**What it owns:** Server-side SSE (Server-Sent Events—a way for the server to push real-time updates to the browser over a single HTTP connection) emitter, client-side SSE consumer, event filtering for the three views (customer, provider, debug), and reconnection logic.

**Uses real HTTP connections** for SSE tests (local server spun up in test setup).

**Design questions to ask first:**
- Should the SSE implementation use the native `EventSource` browser API or a `fetch`-based reader?
- Should the event bus be in-memory (single-process) or support pub/sub across processes (e.g., Redis)?
- Should heartbeat interval be configurable?

**Interface contracts exposed:**
- `SSEEmitter` — `streamEvents(res, eventSource: AsyncGenerator<SSEEvent>)`
- `SSEClient` — `connect(url, onEvent, options?): { close() }`
- `EventRouter` — `filterForView(event: SSEEvent, view: ViewFilter): SSEEvent | null`
- `EventBus` — `emit(sessionId, event)`, `subscribe(sessionId, view, listener)`

**Key test scenarios:**

*Server emitter:*
- Each yielded event written as `data: JSON\n\n`
- Sets correct headers (Content-Type, Cache-Control, Connection)
- Generator error emits error event before closing stream
- Client disconnect stops consuming the generator
- Heartbeat keeps connection alive during idle periods

*Client consumer:*
- Receives and parses each SSE event correctly
- Calls onEvent with typed events
- Reconnects on connection drop (with backoff)
- `close()` terminates cleanly, no further events
- Handles malformed event data gracefully (skips, logs)

*Event filtering (the key interaction):*
- Customer view: receives `consent_request`, `action_proposed`, `status` (generic), `complete` (decision only, no details) — does NOT receive `tool_call`, `tool_result`, `delta`, evidence details
- Provider view: receives everything except raw debug data — `status`, `tool_call`, `tool_result`, `check_completed` with evidence, `complete` with full details
- Debug view: receives raw unfiltered events including timing, model tokens, internal state

*Event bus:*
- Multiple subscribers on same session receive same events
- Subscriber with customer filter receives filtered subset
- Unsubscribe stops delivery
- Events for different sessions are isolated

**Existing code to reuse:**
- `~/code/cliver/tool/server/routes.ts` → SSE header setup and `data: JSON\n\n` writing pattern
- `~/code/cliver/tool/client/src/pages/home.tsx` → SSE reader with line-based JSON parsing

---

## P6. Dual-view UI

**Directory:** `p6-ui/`

**What it owns:** Customer portal (dynamic form + consent UI + status display) and provider dashboard (session list + real-time screening view + audit trail). Two complete UIs that consume events and render state.

**What it mocks:** Pipeline orchestrator (canned event sequences) and auth (hardcoded sessions). These are mocked because the UI prototype focuses on rendering and interaction—wiring to real backend services happens during integration. The SSE connection uses a local test server.

**Design questions to ask first:**
- Should this be a Vite SPA with client-side routing, or Next.js with server components?
- Which component library: continue with shadcn/ui, or switch?
- Should customer and provider views be separate apps or routes within one app?
- What port should the dev server use?

**Interface contracts exposed:**
- `<CustomerPortal />` — form + consent + status
- `<ProviderDashboard />` — session list + screening detail + audit
- `<ConsentDialog action={} onConsent={} onDeny={} />`
- `<ScreeningTimeline events={} />`
- `<DecisionBadge decision={} />`
- `<AuditTrail entries={} />`

**Key test scenarios:**

*Customer portal:*
- Renders dynamic form from schema (delegates to P1's `<DynamicForm>`)
- Shows consent requests as modal dialogs when pipeline emits `consent_requested`
- Consent approve/deny sends response back (via callback)
- Status area shows generic progress ("Checking your information...") without revealing details
- On completion, shows decision status only ("Your screening is complete. A representative will contact you.")
- Does NOT show evidence, tool calls, or detailed check results

*Provider dashboard:*
- Lists active screening sessions with customer name, status, timestamp
- Clicking a session opens real-time screening view
- Screening view shows live check progress: which checks are running, completed, pending
- Check results display evidence table, determination, and sources as they arrive
- Decision badge renders with correct color/status (FLAG=red, REVIEW=yellow, PASS=green)
- Audit trail shows chronological log of all events for the session

*Consent interaction (end-to-end in UI):*
- Pipeline proposes consent action → customer portal shows dialog → customer approves → pipeline resumes → provider sees check continue
- Customer denies → pipeline marks check skipped → provider sees skip reason

*Responsive/layout:*
- Both views render on mobile and desktop
- Provider dashboard handles 50+ sessions in the list without performance issues

**Existing code to reuse:**
- `~/code/cliver/tool/client/src/components/ResponseCard.tsx` → decision badge, checks grid, background work display, source citations (adapt for provider view)
- `~/code/cliver/tool/client/src/pages/home.tsx` → streaming state management pattern, tool event display

---

## P7. Salesforce + email delivery

**Directory:** `p7-integrations/`

**What it owns:** Salesforce OAuth + record push + contact lookup, and email service abstraction (SendGrid/SES) for transactional emails (confirmation codes, verification requests, notifications).

**Uses real APIs.** If Salesforce sandbox credentials or SendGrid/SES keys aren't available, the agent must ask the user.

**Design questions to ask first:**
- Are Salesforce sandbox credentials available? If not, should this prototype be deferred?
- Which email provider: SendGrid or AWS SES?
- Should the Salesforce adapter use jsforce or raw REST calls?
- What Salesforce object type should screening results map to?

**Interface contracts exposed:**
- `SalesforceAdapter` — `authenticate(credentials)`, `pushResult(session, screeningResult)`, `findContact(session, email)`, `refreshSession(session)`
- `EmailService` — `send(message: EmailMessage): Promise<{ messageId }>` (implements `IEmailTransport`)
- `SendGridTransport`, `SESTransport` — concrete implementations behind `IEmailTransport`

**Key test scenarios:**

*Salesforce:*
- `authenticate` returns session with access token on valid credentials
- `authenticate` throws on invalid credentials
- `pushResult` creates record and returns its ID
- `pushResult` with existing contact links result to that contact
- Decision fields map correctly (status, flags, summary, evidence count)
- `findContact` returns null when no match
- Handles SF API errors (expired session, rate limit, field validation)
- Expired session triggers re-auth automatically

*Email service:*
- Composes confirmation code email with correct recipient, subject, code
- Composes verification request email with confirm/deny links
- Returns message ID from provider response
- Throws typed error on API failure (rate limit, invalid email, network)
- Pre-validates email format before sending
- SendGrid and SES transports produce equivalent behavior

---

## P8. Data persistence + API

**Directory:** `p8-persistence/`

**What it owns:** Drizzle schema for all entities (sessions, customers, checks, decisions, audit events, consent records, form submissions), storage layer with typed queries, REST API endpoints, and auth middleware integration.

**Uses a real database.** Tests run against a real PostgreSQL instance (local or Neon). The agent should ask the user for a `DATABASE_URL` if one isn't available.

**Design questions to ask first:**
- Should tests use a local PostgreSQL instance or a Neon dev branch?
- Should the API framework be Express, Hono, or Fastify?
- Should database migrations be managed by Drizzle Kit or a separate tool?
- Should the API validate request bodies with Zod middleware (e.g., zod-express) or manually?

**Interface contracts exposed:**
- `IStorageLayer` implementation with methods for all entities
- REST endpoints:
  - `POST /api/sessions` — create screening session
  - `GET /api/sessions/:id` — session state + checks + decision
  - `POST /api/sessions/:id/fields` — submit field value (triggers pipeline)
  - `POST /api/sessions/:id/consent` — submit consent decision
  - `GET /api/sessions/:id/events` — SSE stream for session
  - `GET /api/provider/sessions` — list sessions (provider view)
  - `GET /api/provider/sessions/:id/audit` — audit trail
  - `POST /api/auth/register` — customer registration (email + password)
  - `POST /api/auth/confirm` — confirm email with code
  - `POST /api/auth/login` — customer login
  - `POST /api/auth/provider/login` — provider login (password + TOTP)
  - `GET /health` — health check

**Drizzle schema (new entities beyond current):**

```
sessions        -- id, customerEmail, status, formSchemaVersion, createdAt, updatedAt
field_values    -- id, sessionId, fieldId, value, completedAt
checks          -- id, sessionId, checkType, status, result (jsonb), startedAt, completedAt
decisions       -- id, sessionId, status, flagCount, summary, reasons (jsonb), decidedAt
consent_records -- id, sessionId, actionType, status, requestedAt, respondedAt
audit_events    -- id, sessionId, eventType, actor, payload (jsonb), timestamp
form_schemas    -- id, version, schema (jsonb), createdAt
provider_users  -- id, email, passwordHash, totpSecret, role, createdAt
customers       -- id, email, passwordHash, emailConfirmed, createdAt
```

**Key test scenarios:**

*Storage layer:*
- Create session → retrieve with all fields populated
- Submit field value → persisted and retrievable by session
- Create check → update status → retrieve with updated status
- Create decision → linked to session
- Audit events ordered chronologically
- Concurrent field submissions don't corrupt state

*API endpoints:*
- `POST /api/sessions` creates session and returns ID
- `POST /api/sessions/:id/fields` persists value and returns acknowledgment
- `GET /api/sessions/:id` returns full state (fields, checks, decision)
- `POST /api/sessions/:id/consent` records consent and returns updated state
- `GET /api/sessions/:id/events` returns SSE stream with correct headers
- Provider endpoints require provider auth (return 401 without it)
- Customer endpoints require customer session (return 401 without it)
- Invalid session ID returns 404
- Malformed request body returns 400 with Zod validation errors

*Auth middleware:*
- Valid customer token grants access to customer endpoints
- Valid provider session grants access to provider endpoints
- Cross-access denied (customer can't hit provider endpoints)

**Existing code to reuse:**
- `~/code/cliver/tool/server/storage.ts` → Drizzle query patterns, async method structure
- `~/code/cliver/tool/shared/schema.ts` → existing table definitions (conversations, messages, responses—adapt for new entities)
- `~/code/cliver/tool/server/routes.ts` → Express route structure, SSE setup pattern, error handling

---

## Dependency graph

```
P0  Shared contracts         (standalone -- all prototypes depend on this)
 |
 +-- P1  Dynamic form engine    (depends on P0)
 +-- P2  Pipeline orchestrator  (depends on P0)
 +-- P3  Check executors + AI   (depends on P0)
 +-- P4  Auth + sessions        (depends on P0)
 +-- P5  Event routing + SSE    (depends on P0)
 +-- P6  Dual-view UI           (depends on P0, mocks P1/P2/P4/P5)
 +-- P7  Salesforce + email     (depends on P0)
 +-- P8  Data persistence + API (depends on P0, mocks P2/P4)
```

Every prototype depends only on P0 for types and interfaces. Within each prototype, anything outside its boundary that must be mocked is mocked behind a P0 interface. Integration means: remove the mock, wire in the real implementation from another prototype.

## Build order

**Wave 1** — Contracts + pure logic:
P0 (types/schemas), then in parallel: P1, P2 (these have the most pure logic)

**Wave 2** — External services:
P3 (real API wrappers + AI), P4 (real auth + email), P5 (real SSE transport), P7 (real Salesforce + email) — all hit real APIs

**Wave 3** — Integration surfaces:
P6 (UI composing P1's form + P5's events), P8 (persistence + API wiring P2/P4/P5 against real database)

**Wave 4** — Full integration:
Swap mocks for real implementations. Each integration point is a single interface substitution defined in P0.

---

## Coverage check

Every section of design.md is covered:

| Design.md section | Covered by |
|---|---|
| 2.1 Customer-facing dynamic form | P1 (engine), P6 (UI) |
| 2.1 Schema-driven fields | P0 (types), P1 (parser + renderer) |
| 2.1 Conditional fields | P1 (visibility evaluator) |
| 2.1 Progressive triggers | P1 (event emission) → P2 (scheduling) |
| 2.1 Email + password auth (AAL1) | P4 (auth) |
| 2.2 Progressive parallel pipeline | P2 (orchestrator) |
| 2.2 Field dependencies | P2 (dependency resolver) |
| 2.2 Parallel check execution | P2 (scheduler) |
| 2.2 Pre-approved vs consent checks | P2 (consent manager) |
| 2.2 Customer sees actions only | P5 (event filter) + P6 (customer portal) |
| 2.2 Provider sees full results | P5 (event filter) + P6 (provider dashboard) |
| 2.2 Dev debug view | P5 (event filter, debug mode) |
| 2.3 AI-driven follow-up actions | P3 (action proposer) |
| 2.3 Tiered consent model | P2 (consent gating) + P3 (action classification) |
| 2.3 Transactional email | P7 (email service) |
| 2.3 Audit trail | P2 (audit logger) + P8 (persistence) |
| 2.4 SecureDNA sequence screening | P3 (SecureDNA executor) |
| 2.5 Salesforce integration | P7 (Salesforce adapter) |
| 2.6 Provider authentication (AAL2) | P4 (provider auth + MFA) |
| Architecture: form engine | P1 |
| Architecture: check scheduler | P2 |
| Architecture: check executors | P3 |
| Architecture: consent manager | P2 |
| Architecture: aggregator | P2 (decision aggregator) |
| Architecture: audit log | P2 + P8 |
| Architecture: Salesforce adapter | P7 |
| Architecture: email service | P7 |
| Current: SSE streaming | P5 |
| Current: structured output | P3 (extraction) |
| Current: tool integrations | P3 (executors) |
| Current: report display | P6 (ResponseCard adaptation) |
| Data persistence | P8 |
| API layer | P8 |
