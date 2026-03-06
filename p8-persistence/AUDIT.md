# P8 data persistence + API audit

**Auditor:** Claude Opus 4.6 (adversarial review)
**Date:** 2026-03-05
**Scope:** All source files in `/Users/alejo/code/cliver/dev/p8-persistence/`, compared against P0 contracts, prototypes.md P8 spec, and design.md sections 2--3.

---

## Findings

### 1. form_schemas table has no primary key

**Severity:** High

The `form_schemas` table in `/Users/alejo/code/cliver/dev/p8-persistence/src/schema.ts` (lines 162--175) defines `id` and `version` as regular columns but never declares a primary key. Every other table uses `.primaryKey()` on its `id` column. The test setup SQL at `/Users/alejo/code/cliver/dev/p8-persistence/test/setup.ts` (lines 94--99) also omits a primary key.

This means:
- Duplicate `(id, version)` pairs can be inserted without error.
- There is no way to uniquely address a row for updates or deletes.
- `storeFormSchema` does a blind insert with no upsert logic, so calling it twice with the same id+version silently creates duplicates.

**Recommendation:** Add a composite primary key on `(id, version)` using Drizzle's `primaryKey` helper, or add a synthetic `id` column as PK with a unique constraint on `(id, version)`. Add a `ON CONFLICT` clause to `storeFormSchema`.

---

### 2. createScreening uses screeningId as customerEmail

**Severity:** High

In `/Users/alejo/code/cliver/dev/p8-persistence/src/storage.ts` (lines 20--29):

```ts
customerEmail: data.screeningId ?? "unknown@example.com",
```

`PipelineState.screeningId` is the screening's UUID, not an email address. This stores a UUID (or empty string, or a fallback literal) in the `customer_email` column. The routes layer (`routes.ts` lines 51--70) works around this by immediately updating the email after creation, but:
- The storage layer is independently callable and the method is semantically wrong.
- If `createScreening` is called without the route's post-hoc fixup, the database contains garbage in `customer_email`.
- Tests pass only because they never assert on `customerEmail`.

**Recommendation:** `createScreening` should accept `customerEmail` as an explicit parameter (or extract it from `data` via a dedicated field that `PipelineState` doesn't have). The current misuse of `screeningId` as an email is a data integrity bug.

---

### 3. Concurrent field upsert is not atomic (race condition)

**Severity:** High

`storeFieldValue` in `/Users/alejo/code/cliver/dev/p8-persistence/src/storage.ts` (lines 209--236) implements upsert as a SELECT + conditional INSERT/UPDATE. Between the SELECT and the INSERT, another concurrent request for the same `(sessionId, fieldId)` can also see no existing row and attempt its own INSERT. Since there is no unique constraint on `(session_id, field_id)` in the schema, both INSERTs succeed, creating duplicate rows.

The spec explicitly requires: *"Concurrent field submissions don't corrupt state."*

The test at `/Users/alejo/code/cliver/dev/p8-persistence/test/storage.test.ts` (lines 126--141) submits 10 *different* field IDs concurrently, so it does not exercise the actual race condition (concurrent writes to the *same* field).

The same pattern affects `storeOutcome` (lines 160--194) and `storeConsentRecord` (lines 256--288).

**Recommendation:** Either:
- Add a unique constraint on `(session_id, field_id)` and use Drizzle's `onConflictDoUpdate`, or
- Use PostgreSQL's `INSERT ... ON CONFLICT` via `sql` tagged template.
- Also add unique constraints on `(session_id, check_type)` for checks and `(session_id, action_type)` for consent_records.

---

### 4. Auth middleware returns 401 instead of 403 for wrong role

**Severity:** Medium

In `/Users/alejo/code/cliver/dev/p8-persistence/src/auth-middleware.ts` (lines 59--61):

```ts
if (requiredRole && session.role !== requiredRole) {
  return c.json({ error: "Insufficient permissions" }, 401);
}
```

The user *is* authenticated but lacks the right role. HTTP 401 means "not authenticated"; HTTP 403 means "not authorized." Returning 401 here conflates authentication failure with authorization failure, which can mislead clients (e.g., a client might retry with fresh credentials when the real issue is role mismatch).

The test suite at `/Users/alejo/code/cliver/dev/p8-persistence/test/api.test.ts` (lines 126--139, 372--379) asserts `status === 401` for role mismatches, so this is baked into the test expectations.

**Recommendation:** Return 403 for role mismatches. Update test assertions accordingly.

---

### 5. Password stored in plaintext

**Severity:** Medium

In `/Users/alejo/code/cliver/dev/p8-persistence/src/routes.ts` (lines 258--266), the `/api/auth/register` endpoint stores the raw password as the `passwordHash`:

```ts
passwordHash: parseResult.data.password, // P4 would hash this
```

And `/api/auth/login` (line 314) compares raw passwords:

```ts
if (!user || user.passwordHash !== parseResult.data.password) {
```

The comment says "P4 would hash this," which is fair for a prototype, but:
- The column is named `password_hash`, creating a false assurance that hashing occurs.
- If this prototype is ever deployed or its database is leaked, all passwords are exposed.
- The design doc (section 2.1) specifies Argon2id hashing.

**Recommendation:** Add a prominent `// SECURITY: PROTOTYPE ONLY` warning. Consider using a simple hash (e.g., `crypto.createHash('sha256')`) as a stopgap so the password column never contains reversible plaintext, even in dev.

---

### 6. Email confirmation code is not actually verified

**Severity:** Medium

In `/Users/alejo/code/cliver/dev/p8-persistence/src/routes.ts` (lines 269--295), `/api/auth/confirm` accepts *any* non-empty code and marks the email as confirmed. The comment says P4 would handle this, but:
- There is no indication in the test that this is intentionally mocked behavior.
- Any attacker can confirm any email by submitting any code.

**Recommendation:** Document this as a deliberate P4 mock. Consider at minimum logging a warning when the stub code path is hit.

---

### 7. SSE endpoint closes immediately (not a real stream)

**Severity:** Medium

In `/Users/alejo/code/cliver/dev/p8-persistence/src/routes.ts` (lines 167--204), `GET /api/sessions/:id/events` sends all existing audit events and then closes the stream. The spec says: *"GET /api/sessions/:id/events -- SSE stream for session."*

This is not an SSE stream in any meaningful sense. It is a one-shot dump of historical events with SSE formatting. The comment on line 199 acknowledges this: *"A real implementation would keep the stream open."*

However:
- The test at `/Users/alejo/code/cliver/dev/p8-persistence/test/api.test.ts` (lines 298--333) reads `res.text()`, which only works because the stream closes. If the stream were kept open, this test would hang.
- There is no test for streaming behavior (new events arriving after subscription).

**Recommendation:** Either implement a basic polling/keep-alive mechanism using `IEventEmitter.subscribe`, or rename the endpoint to clarify it returns historical events only. Add a test that verifies the heartbeat comment is present.

---

### 8. No inactivity timeout enforcement for AAL2 sessions

**Severity:** Medium

The design doc (section 2.6) and P0 contracts (`auth.ts` lines 50--57) specify:
- AAL2: 1-hour inactivity timeout, 24-hour overall timeout.

The auth middleware at `/Users/alejo/code/cliver/dev/p8-persistence/src/auth-middleware.ts` (lines 53--56) checks `expiresAt` (overall timeout) but never checks `lastActivity` against an inactivity window. It updates `lastActivity` (lines 63--67) but never reads it for enforcement.

A provider session created at midnight with a 24-hour expiry will remain valid until midnight the next day even if the user is inactive for 23 hours.

**Recommendation:** Add inactivity timeout check: for AAL2 sessions, if `now - lastActivity > 1 hour`, return 401. The `lastActivity` column and update logic already exist; only the check is missing.

---

### 9. updateScreening only updates status, ignores other PipelineState fields

**Severity:** Medium

In `/Users/alejo/code/cliver/dev/p8-persistence/src/storage.ts` (lines 110--122), `updateScreening` only updates `status` and `updatedAt`:

```ts
if (data.status) updates.status = data.status;
updates.updatedAt = new Date();
```

The P0 interface signature is `updateScreening(id: string, data: Partial<PipelineState>): Promise<void>`. A caller passing `{ completedFields: [...], outcomes: [...] }` would expect those to be persisted, but they are silently dropped.

The underlying data model stores completedFields, outcomes, etc. in separate tables (field_values, checks), so a direct column update isn't possible. But the method's contract promises to accept any `Partial<PipelineState>` and the current implementation silently ignores most of it.

**Recommendation:** Either:
- Expand `updateScreening` to delegate to the appropriate sub-tables when relevant fields are present in `data`, or
- Document in a JSDoc comment which fields are supported and throw for unsupported ones.

---

### 10. listScreenings performs N+1 queries

**Severity:** Medium

In `/Users/alejo/code/cliver/dev/p8-persistence/src/storage.ts` (lines 124--156), `listScreenings` first queries all sessions, then calls `this.getScreening(row.id)` for each one. `getScreening` itself runs 4 additional queries (field_values, checks, consent_records, decisions). For N sessions, this is 1 + 4N queries.

With 100 sessions, that is 401 database round-trips.

**Recommendation:** Either batch the related data queries (single query per related table for all session IDs) or use Drizzle's relational query builder with `with` clauses.

---

### 11. No TOTP verification for provider login

**Severity:** Medium

In `/Users/alejo/code/cliver/dev/p8-persistence/src/routes.ts` (lines 369--370):

```ts
// In a real system, P4 would verify the TOTP code.
// Here we accept any non-empty code for testing.
```

Any non-empty string is accepted as a valid TOTP code. This is documented but means the AAL2 guarantee is entirely theatrical. Combined with plaintext passwords (finding 5), the auth system provides no real security.

**Recommendation:** Acceptable for prototype scope, but the test should explicitly note it is testing the *flow* not the *security*. Consider adding a test that verifies a missing `totpCode` field returns 400.

---

### 12. Unused import in auth-middleware.ts

**Severity:** Low

In `/Users/alejo/code/cliver/dev/p8-persistence/src/auth-middleware.ts` (line 2):

```ts
import { eq, gte } from "drizzle-orm";
```

`gte` is imported but never used. This is a dead import.

**Recommendation:** Remove the `gte` import.

---

### 13. audit_events.session_id has no foreign key constraint

**Severity:** Medium

In `/Users/alejo/code/cliver/dev/p8-persistence/src/schema.ts` (line 146), `audit_events.session_id` is declared as `varchar("session_id").notNull()` but has no `.references(() => sessions.id)`. Every other table with a `session_id` column has a foreign key with `ON DELETE CASCADE`.

This means:
- Audit events can reference sessions that don't exist.
- Deleting a session leaves orphaned audit events.

**Recommendation:** Add `.references(() => sessions.id, { onDelete: "cascade" })` to `audit_events.sessionId`, or document why audit events intentionally survive session deletion (regulatory retention).

---

### 14. auth_sessions.user_id has no foreign key constraint

**Severity:** Medium

In `/Users/alejo/code/cliver/dev/p8-persistence/src/schema.ts` (line 224), `auth_sessions.user_id` is `varchar("user_id").notNull()` with no foreign key. Since users are split across two tables (`provider_users` and `customers`), a single FK isn't possible. But this means:
- Auth sessions can reference deleted users.
- No cascade cleanup when a user is deleted.

**Recommendation:** Either add a unified `users` table that both provider_users and customers reference, or add application-level cleanup logic for user deletion.

---

### 15. No test for concurrent writes to the same field

**Severity:** Medium

The spec requires: *"Concurrent field submissions don't corrupt state."*

The test at `/Users/alejo/code/cliver/dev/p8-persistence/test/storage.test.ts` (lines 126--141) submits 10 *different* fields concurrently. This tests parallelism but not contention. The actual race condition (two concurrent writes to the same `fieldId` on the same `sessionId`) is not tested.

**Recommendation:** Add a test that submits the same `(sessionId, fieldId)` pair concurrently from multiple promises and asserts that exactly one row exists afterward with one of the submitted values. This test will likely fail given finding 3.

---

### 16. No test for malformed JSON body (non-JSON content)

**Severity:** Low

The API tests cover missing fields (Zod validation) but never send syntactically invalid JSON (e.g., plain text, truncated JSON). The routes use `.json().catch(() => null)` which handles this gracefully, but when `body` is null, `safeParse(body)` may behave unexpectedly for endpoints that `safeParse(body ?? {})` (like POST /api/sessions, which treats null as `{}` and succeeds).

**Recommendation:** Add a test sending a non-JSON body (e.g., `Content-Type: application/json` with body `"not json"`) to verify the 400 response.

---

### 17. Provider can read any customer's session (no ownership check)

**Severity:** Medium

`GET /api/sessions/:id` uses `anyAuth` middleware (line 75), meaning any authenticated user (customer or provider) can read any session by ID. There is no check that a customer can only read their own sessions.

Similarly, a customer who knows another customer's session ID can read their screening data.

**Recommendation:** For customer-role access, verify that the session's `customerEmail` matches the authenticated user's email. Provider access can remain unrestricted (they need to see all sessions).

---

### 18. No database connection error handling

**Severity:** Low

None of the route handlers have try/catch blocks for database errors. If the database connection drops mid-request, the error will propagate as an unhandled exception. Hono will return a 500, but:
- The error message may leak internal details (connection strings, SQL errors).
- There is no structured error response.

The existing codebase at `/Users/alejo/code/cliver/tool/server/routes.ts` wraps every handler in try/catch and returns `{ message: "Failed to ..." }`.

**Recommendation:** Add a global error handler via `app.onError()` that catches database errors and returns a sanitized 500 response.

---

### 19. createScreening ignores the `customerEmail` from PipelineState

**Severity:** Low

`PipelineState` does not have a `customerEmail` field (it has `screeningId`, `status`, `completedFields`, etc.). But the `sessions` table requires `customer_email`. The storage layer has no clean way to set this field through the `IStorageLayer` interface.

This is a design gap between the P0 contract and the database schema. The route layer works around it by doing a direct DB update after `createScreening` (lines 67--70 of routes.ts).

**Recommendation:** Either add a `customerEmail` property to `PipelineState` in the P0 contracts, or change `createScreening` to accept additional metadata beyond `Partial<PipelineState>`.

---

### 20. Session expiry uses 30-day window for customers

**Severity:** Low

In `/Users/alejo/code/cliver/dev/p8-persistence/src/routes.ts` (line 323):

```ts
const thirtyDays = 30 * 24 * 60 * 60 * 1000;
```

The P0 auth contract (`auth.ts` lines 53--57) says AAL1 sessions get a 30-day overall timeout, which matches. However, the design doc section 2.6 says *"maximum 24-hour overall timeout"* for sessions generally, then specifies AAL1 separately. The 30-day value is correct per NIST SP 800-63B-4 for AAL1 but should be verified against the project's cybersecurity requirements doc.

**Recommendation:** Confirm with the cybersec requirements doc that 30 days is the intended AAL1 session lifetime.

---

### 21. Missing spec test scenarios

**Severity:** Low

The spec in prototypes.md lists these test scenarios that are not covered by the test suite:

- **"Create check -> update status -> retrieve with updated status"** -- Tests store outcomes and verify completed status, but there is no test that creates a check in "pending" status, transitions it to "running", then to "completed" via the storage layer. The `IStorageLayer` interface doesn't expose a `createCheck` or `updateCheckStatus` method, so this scenario may be out of scope, but the spec lists it.

**Recommendation:** Either add a `createCheck`/`updateCheckStatus` method to the storage layer, or document that check lifecycle management is handled by the pipeline orchestrator (P2) and P8 only stores outcomes.

---

## Summary table

| # | Finding | Severity | File | Lines |
|---|---------|----------|------|-------|
| 1 | form_schemas has no primary key | High | `src/schema.ts` | 162--175 |
| 2 | screeningId used as customerEmail | High | `src/storage.ts` | 24 |
| 3 | Non-atomic upsert (race condition) | High | `src/storage.ts` | 209--236 |
| 4 | 401 returned instead of 403 for wrong role | Medium | `src/auth-middleware.ts` | 59--61 |
| 5 | Passwords stored in plaintext | Medium | `src/routes.ts` | 262 |
| 6 | Email confirmation code not verified | Medium | `src/routes.ts` | 269--295 |
| 7 | SSE endpoint is not a real stream | Medium | `src/routes.ts` | 167--204 |
| 8 | No inactivity timeout for AAL2 | Medium | `src/auth-middleware.ts` | 53--67 |
| 9 | updateScreening ignores most fields | Medium | `src/storage.ts` | 110--122 |
| 10 | N+1 query in listScreenings | Medium | `src/storage.ts` | 124--156 |
| 11 | No TOTP verification | Medium | `src/routes.ts` | 369--370 |
| 12 | Unused `gte` import | Low | `src/auth-middleware.ts` | 2 |
| 13 | audit_events.session_id has no FK | Medium | `src/schema.ts` | 146 |
| 14 | auth_sessions.user_id has no FK | Medium | `src/schema.ts` | 224 |
| 15 | No test for same-field concurrent writes | Medium | `test/storage.test.ts` | 126--141 |
| 16 | No test for malformed JSON body | Low | `test/api.test.ts` | -- |
| 17 | No session ownership check for customers | Medium | `src/routes.ts` | 75 |
| 18 | No database error handling | Low | `src/routes.ts` | -- |
| 19 | PipelineState lacks customerEmail | Low | `src/storage.ts` | 20--29 |
| 20 | 30-day AAL1 session needs verification | Low | `src/routes.ts` | 323 |
| 21 | Missing spec test scenario (check lifecycle) | Low | `test/storage.test.ts` | -- |

**Totals:** 3 High, 11 Medium, 7 Low
