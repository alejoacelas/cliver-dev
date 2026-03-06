# Integration plan: stitching P0--P8 into a working app

## What exists

Eight independently-built prototypes with 448 passing tests:

| Prototype | What it does | Runtime deps |
|-----------|-------------|--------------|
| **P0** | Zod schemas, TypeScript interfaces | None (types only) |
| **P1** | Schema-driven form renderer + field event emission | React |
| **P2** | Pipeline orchestrator (scheduling, consent, decision) | In-memory state |
| **P3** | Check executors (Tavily, sanctions, EPMC, ORCID, SecureDNA) + AI completion via OpenRouter | HTTP APIs |
| **P4** | Auth services (password, TOTP, sessions, CSRF) | argon2, otpauth, ITokenStore |
| **P5** | Event bus + SSE emitter/client + view filtering | Hono (for WritableForSSE) |
| **P6** | Customer portal + provider dashboard React components | React, Tailwind |
| **P7** | Salesforce OAuth/push + email service (SendGrid/SES) | HTTP APIs |
| **P8** | Drizzle schema + IStorageLayer + REST routes + auth middleware | PostgreSQL, Hono |

Every prototype mocks the pieces it depends on. Integration means replacing those mocks with real implementations and building the connective tissue between them.

---

## What is missing

### 1. Composition layer (the actual application)

**This is the biggest gap.** There is no `main.ts` that instantiates services, wires dependencies, and starts a server. Each prototype is a library, not an application.

What this needs to do:

```
startup:
  1. Connect to PostgreSQL (P8)
  2. Create IStorageLayer (P8)
  3. Create ITokenStore (need: production impl, not InMemory)
  4. Create SessionService, CustomerAuthService, ProviderAuthService (P4)
  5. Create EmailService with real transport (P7)
  6. Create EventBus + EventBusAdapter (P5)
  7. Register check executors (P3) with API keys from env
  8. Load check declarations from config
  9. Mount Hono routes (P8 routes + new SSE/pipeline routes)
  10. Serve built React app (P6)
  11. Start listening
```

This is roughly 200--400 lines of wiring code, plus a config module.

### 2. Pipeline lifecycle manager

P2's `CheckScheduler` is a per-screening in-memory state machine. Nothing currently:

- **Creates** a CheckScheduler when a screening session starts
- **Routes** field events from the API to the right scheduler instance
- **Routes** consent responses to the right scheduler instance
- **Persists** state changes to the database (P8)
- **Recovers** pipeline state after a server restart
- **Cleans up** completed schedulers to free memory
- **Bridges** pipeline events to the EventBus (P5)

This is the hardest integration piece. The scheduler needs a host that:

```typescript
class PipelineManager {
  private schedulers: Map<string, CheckScheduler>;

  // Called when POST /sessions/:id/fields arrives
  async onFieldSubmitted(screeningId: string, fieldId: string, value: unknown) {
    const scheduler = this.getOrRestore(screeningId);
    await scheduler.onFieldCompleted(fieldId, value);
    await this.persist(screeningId, scheduler.getState());
  }

  // Called when POST /sessions/:id/consent arrives
  async onConsentResponse(screeningId: string, checkId: string, granted: boolean) {
    const scheduler = this.getOrRestore(screeningId);
    if (granted) await scheduler.onConsent(checkId);
    else await scheduler.onConsentDenied(checkId);
    await this.persist(screeningId, scheduler.getState());
  }

  // Restore from DB if not in memory
  private async getOrRestore(screeningId: string): CheckScheduler { ... }
}
```

**Pipeline restoration is the trickiest part.** CheckScheduler holds in-memory state (completed fields, running checks, outcomes). If the server restarts mid-screening, this state is lost. Options:

- **Option A (simplest):** Treat server restart as fatal for in-progress screenings. Mark them as errored. Acceptable for MVP.
- **Option B (proper):** Reconstruct CheckScheduler state from the database on first access. P8 stores field values, outcomes, and consent records, so reconstruction is possible. But CheckScheduler doesn't have a "restore from state" constructor—it only has `onFieldCompleted()`. Would need to either replay events or add a hydration path.

Recommendation: start with Option A, add a `CheckScheduler.hydrate(state: PipelineState)` method later.

### 3. Pipeline-to-SSE bridge

P2's CheckScheduler emits events to local `listener` callbacks. P5's EventBusAdapter implements `IEventEmitter`. Nobody wires them together.

Needed:

```typescript
const eventBus = new EventBus();
const eventAdapter = new EventBusAdapter(eventBus);

// For each screening's CheckScheduler:
scheduler.subscribe(async (event: PipelineEvent) => {
  await eventAdapter.emit(event);           // P5: broadcast to SSE subscribers
  await storage.storeAuditEvent(event);     // P8: persist to audit trail
});
```

### 4. SSE HTTP endpoint

P8 has a placeholder SSE endpoint that dumps historical events and closes. P5 has real streaming infrastructure (`streamEvents`, `EventBus`). These need to be combined into a route that:

1. Authenticates the request (P4/P8 auth middleware)
2. Determines the ViewFilter based on user role (customer/provider)
3. Sends historical events from the database
4. Subscribes to the EventBus for live events
5. Streams events via `streamEvents()` until the client disconnects

This route doesn't exist in any prototype. It needs to be written.

### 5. Two incompatible auth systems

P4 and P8 each implement authentication independently:

| Aspect | P4 | P8 |
|--------|----|----|
| Session storage | ITokenStore (in-memory Map) | PostgreSQL auth_sessions table |
| Password hashing | argon2id | Plaintext (placeholder) |
| TOTP verification | Real (otpauth library) | Accepts any non-empty string |
| Session validation | SessionService.validateSession() | Direct DB query in middleware |
| Middleware style | Express-like (req, res, next) | Hono createMiddleware |
| Cookie handling | __Host-session cookie | Authorization: Bearer header |
| CSRF | Generated per-session, constant-time comparison | Not implemented |

**Resolution:** Use P4's auth services (they're correct and NIST-compliant) backed by P8's database. Specifically:

- Replace P4's `InMemoryTokenStore` with a PostgreSQL-backed implementation using P8's `auth_sessions` table
- Replace P4's `InMemoryUserStore` with P8's `IStorageLayer` user methods (getUserByEmail, createUser, updateUser)
- Rewrite P8's auth middleware to delegate to P4's `SessionService.validateSession()` + `enforceTimeouts()` + `touchSession()`
- Use P4's password hashing (argon2id) in the registration/login routes
- Add CSRF token handling from P4 to the Hono middleware

### 6. Two email transport interfaces

P4 defines `IEmailSender` (its own interface). P7 implements `IEmailTransport` (from P0 contracts). P4's magic links, confirmation codes need to use P7's actual transports.

```
P4's IEmailSender: send(to, subject, body) → Promise<void>
P0's IEmailTransport: send(message: EmailMessage) → Promise<{ messageId: string }>
```

**Resolution:** Write a thin adapter that wraps P7's IEmailTransport to satisfy P4's IEmailSender interface. Or refactor P4 to use P0's IEmailTransport directly—it's a small change.

### 7. Check declarations configuration

P2's CheckScheduler expects `CheckDeclaration[]`—a list of checks with their field dependencies and consent requirements. These aren't defined anywhere as application config.

Need a config file or module that declares:

```typescript
const CHECK_DECLARATIONS: CheckDeclaration[] = [
  {
    id: "web_search",
    name: "Web search",
    requiredFields: ["name", "institution"],
    needsConsent: false,
  },
  {
    id: "sanctions",
    name: "Sanctions screening",
    requiredFields: ["name", "institution"],
    needsConsent: false,
  },
  {
    id: "epmc",
    name: "Publication search",
    requiredFields: ["name"],
    needsConsent: false,
  },
  {
    id: "orcid",
    name: "ORCID lookup",
    requiredFields: ["name"],
    needsConsent: false,
  },
  {
    id: "email_verification",
    name: "Institutional email verification",
    requiredFields: ["email", "institution"],
    needsConsent: true,
    description: "Send a verification email to your institution to confirm your affiliation.",
  },
  // ...
];
```

Also need the default form schema that drives P1's DynamicForm.

### 8. Form schema delivery

P6's CustomerPortal accepts a `FormSchema` as a prop. P8 can store and retrieve form schemas. But there's no route that serves a form schema to the browser, and no logic that associates a form schema with a screening session type.

Need: `GET /api/form-schemas/:id` route in P8 (or the composition layer).

### 9. React application shell

P6 has a dev shell (`App.tsx`) with a component-level view switcher. Production needs:

- **React Router** — `/` for customer portal, `/provider` for dashboard
- **Auth-gated routes** — customer routes require AAL1 session, provider routes require AAL2
- **SSE connection** — use P5's `connect()` client to subscribe to events for the active screening
- **API client** — HTTP calls to the REST API for field submission, consent, session creation
- **Login/register pages** — for both customer and provider flows
- **Build configuration** — Vite production build, served by the Hono server

### 10. ITokenStore production implementation

P4's auth services depend on `ITokenStore` for session data, CSRF tokens, rate limiting counters, and TOTP replay protection. The in-memory implementation loses everything on restart.

Options:
- **Redis** — ideal for TTL-based KV storage, but adds an infrastructure dependency
- **PostgreSQL** — use P8's `auth_sessions` table + a generic `kv_store` table. Slightly slower than Redis but no new dependency.

For MVP, PostgreSQL-backed ITokenStore is the pragmatic choice.

### 11. Salesforce trigger

When the pipeline completes, P7's `SalesforceAdapter.pushResult()` should be called. Nothing currently listens for `pipeline_complete` events and triggers this.

Needed: a listener in the composition layer that calls `salesforceAdapter.pushResult(session, decision, meta)` when a screening finishes.

### 12. Database migrations

P8 tests use `CREATE TABLE IF NOT EXISTS` raw SQL. Production needs Drizzle Kit migrations (`drizzle-kit generate` + `drizzle-kit migrate`). The Drizzle schema in `src/schema.ts` is the source of truth, but no migration files exist yet.

---

## P0 contract gaps to resolve before integration

These are issues where the shared type definitions don't quite match what the prototypes need.

### PipelineState lacks customer identity

`PipelineState` has no `customerEmail` or `customerName` field. P8 worked around this by adding `customerEmail` as a separate parameter to `createScreening`. P6 can't show customer names in the session list because the type doesn't have one.

**Fix:** Add `customerEmail` and `customerName` as optional fields to `PipelineStateSchema` in P0.

### IStorageLayer.createScreening signature

P0 defines `createScreening(data: Partial<PipelineState>): Promise<string>`. P8's implementation added a second `customerEmail` parameter via type cast. This is brittle.

**Fix:** Once `customerEmail` is on `PipelineState`, the signature works naturally.

### EventBusAdapter unsafe cast

P5's `EventBusAdapter.subscribe()` casts `SSEEvent as unknown as PipelineEvent` (line 100 of `event-bus-adapter.ts`). This is a type-safety hole.

**Fix:** The adapter should either:
- Keep a reverse map and reconstruct PipelineEvent from SSEEvent, or
- Accept that subscribe listeners at the adapter boundary receive SSEEvent (not PipelineEvent) and adjust the types accordingly.

### SSE event types missing for pipeline events

P5's `EventBusAdapter.mapPipelineToSSE()` drops most pipeline events (field_completed, check_started, check_completed, consent_received, pipeline_complete) because they have no SSE equivalent. This means:
- The provider dashboard gets no real-time updates for check progress
- The customer portal gets no completion notification via SSE

**Fix:** Add SSE event types for `check_started`, `check_completed`, `pipeline_complete` (at minimum) to `SSEEventSchema` in P0. The `status` SSE event type could also be synthesized from pipeline events (e.g., "Running sanctions check..." from check_started).

---

## Things to be careful about

### 1. Single React instance

P6 already handles React deduplication (aliases in vite.config.ts and vitest.config.ts). But when P1 (form-engine) is bundled into the production build, both P1 and P6 must resolve to the same React instance. Vite's alias configuration handles this in dev, but the production build needs the same treatment. Verify with `npm ls react` that there's exactly one copy.

### 2. CheckScheduler is not thread-safe across processes

CheckScheduler holds state in memory. If you run multiple server instances (horizontal scaling), two requests for the same screening could hit different instances with divergent state. For MVP (single process), this is fine. For production, you'd need either:
- Sticky sessions (route all requests for a screening to the same instance)
- External state (Redis or DB-based scheduler state with optimistic locking)

### 3. Pipeline events are fire-and-forget

CheckScheduler emits events synchronously to listeners. If the EventBus or database write fails, the pipeline doesn't know. Events could be lost. For MVP this is acceptable. For production, consider a transactional outbox pattern.

### 4. Long-running checks block the event loop

P3's check executors make HTTP calls that can take seconds (Tavily search, OpenRouter completion). These run in the same Node.js process as the API server. Under load, multiple concurrent screenings with parallel checks could starve the event loop.

Mitigations:
- Set HTTP timeouts on all executor fetch calls (P3 should already do this)
- Consider moving pipeline execution to a worker thread or separate process
- For MVP with low concurrency, this is a non-issue

### 5. Secrets management

P3 needs OPENROUTER_API_KEY, TAVILY_API_KEY. P7 needs SENDGRID_API_KEY (or AWS credentials), SF_CLIENT_ID, SF_CLIENT_SECRET. P4 needs a HIBP API key (optional). These are currently scattered across `.env` files or hardcoded in tests.

Consolidate into a single `.env` at the app root. Never commit it. Provide a `.env.example` with all required keys listed.

### 6. Auth middleware must use constant-time comparison

P4 uses `crypto.timingSafeEqual` for session tokens and CSRF tokens. P8's auth middleware does a direct `===` comparison for session IDs (it queries by ID, so the DB handles the comparison). Make sure the unified middleware uses P4's approach for any token comparisons done in application code.

### 7. CORS configuration

During development, the Vite dev server (port 3060) and the API server will be on different ports. Need CORS headers on the API server, or proxy API requests through Vite's dev server proxy.

For production (single-origin), CORS is unnecessary—the API and static files are served from the same origin.

### 8. Error propagation from pipeline to UI

Currently, if a check executor throws, CheckScheduler catches it and emits an `error` PipelineEvent. But the EventBusAdapter *drops* this mapping for `check_completed` events (they have no SSE equivalent). The customer might see a generic error (via the `error` SSE event), but the provider dashboard won't get the check_completed event showing the error outcome.

This needs the SSE schema expansion mentioned in the P0 gaps section.

### 9. Race condition: field submission during pipeline completion

A customer could submit a field at the exact moment the pipeline is completing. CheckScheduler has a scheduling mutex, but the API layer (P8 routes) doesn't coordinate with the pipeline manager. The field could be written to the DB but never reach the scheduler if it already finalized.

Mitigation: The pipeline manager should check scheduler status before forwarding field events. If the pipeline is already `completed`, return an error to the client.

### 10. Test database vs production database

P8 tests run against `cliver_p8_test`. The production database needs its own connection string, and the test database should be wiped/recreated per test run (which it already does). Make sure the composition layer's tests use a separate test database, not the same one as P8's unit tests, to avoid interference.

---

## Suggested integration order

### Phase 1: Foundation (do first)

1. **Resolve P0 contract gaps** — add customerEmail/customerName to PipelineState, add missing SSE event types, fix IStorageLayer.createScreening signature.

2. **PostgreSQL-backed ITokenStore** — implement ITokenStore interface using P8's database (new table: `kv_store` with key, value, expires_at columns). This replaces P4's InMemoryTokenStore.

3. **Unified auth middleware** — rewrite P8's auth middleware to use P4's SessionService (backed by the new ITokenStore). Add CSRF handling. Keep Hono-style middleware signature.

### Phase 2: Server wiring

4. **Composition layer** — new package (`app/` or `server/`) that imports from all prototypes. Single `main.ts` that creates services and starts the Hono server.

5. **Pipeline manager** — creates/manages CheckScheduler instances per screening. Wires field events and consent responses from API routes to schedulers.

6. **Pipeline-to-SSE bridge** — subscribes to each scheduler's events, forwards to EventBus, persists to audit trail.

7. **SSE HTTP endpoint** — real streaming route using P5's streamEvents, backed by EventBus subscriptions.

### Phase 3: Frontend wiring

8. **React Router + auth gates** — add routing, login pages, registration flow.

9. **API client module** — HTTP calls for field submission, consent, session creation, SSE connection.

10. **SSE integration** — use P5's `connect()` in the React app to receive live events.

### Phase 4: External services

11. **Salesforce trigger** — listener on pipeline_complete that calls P7's pushResult.

12. **Email integration** — wire P7's email service into P4's confirmation code and magic link flows.

13. **Environment config** — consolidated .env, config validation on startup.

14. **Database migrations** — generate Drizzle migrations from P8's schema.

### Phase 5: Hardening

15. **Pipeline recovery** — add CheckScheduler.hydrate() for server restart resilience.

16. **Error boundaries** — React error boundaries, global Hono error handler.

17. **Rate limiting** — API-level rate limiting (separate from P4's auth rate limiting).

18. **Logging** — structured logging across all services.

---

## Estimated scope

The integration work is roughly comparable in size to 2--3 of the original prototypes. The composition layer, pipeline manager, and auth unification are the heaviest pieces. The frontend wiring is straightforward but tedious (login forms, API client, routing).

The prototypes were designed for this moment—interfaces are well-defined, contracts are checked, and mocks document exactly what needs to be swapped. The main risk is the gaps identified above (especially the SSE event type coverage and auth system unification), which should be resolved before writing integration code.
