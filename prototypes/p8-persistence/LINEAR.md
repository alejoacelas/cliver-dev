# Linear walkthrough of p8-persistence

This document walks through the `@cliver/p8-persistence` package file by file, in an order designed to build understanding incrementally. The package provides the persistence layer for the cliver screening pipeline: a Drizzle ORM schema over PostgreSQL, a storage layer implementing the `IStorageLayer` contract, session-based auth middleware, and a Hono HTTP API.

## 1. `package.json` — project shape

The package is an ES module (`"type": "module"`) that depends on `@cliver/contracts` (linked locally from `../p0-contracts`), Drizzle ORM with the `postgres` driver, Hono for the HTTP layer, and Zod for request validation. Key scripts:

```json
"db:setup": "tsx src/db-setup.ts",
"db:migrate": "drizzle-kit push"
```

`db:setup` creates the databases; `db:migrate` pushes the Drizzle schema to Postgres. Tests run via Vitest.

## 2. `tsconfig.json` — TypeScript config

Targets ES2022 with bundler module resolution. `noEmit: true`—this package is consumed at the source level (or via `tsx`), not compiled to `dist/`. `verbatimModuleSyntax` is enabled, so all type imports must use `import type`.

## 3. `drizzle.config.ts` — Drizzle Kit config

```ts
export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://alejo@localhost:5432/cliver_p8",
  },
});
```

Points Drizzle Kit at the schema file for migration generation. The `out` directory holds generated SQL migrations.

## 4. `vitest.config.ts` — test runner config

```ts
export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
  },
});
```

Uses `singleFork: true` so all tests share one process—necessary because they share a single database connection. Generous timeouts (30 s) account for real database I/O.

---

## 5. `src/schema.ts` — Drizzle schema (the data model)

This is the foundation. It defines nine PostgreSQL tables using Drizzle's declarative API. All UUIDs are server-generated via `gen_random_uuid()`.

**`sessions`** — the central entity. A screening session tracks a customer through the verification pipeline:

```ts
export const sessions = pgTable(
  "sessions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    customerEmail: varchar("customer_email").notNull(),
    status: varchar("status", {
      enum: ["pending", "running", "completed", "failed"],
    }).notNull().default("pending"),
    formSchemaVersion: varchar("form_schema_version"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("sessions_customer_email_idx").on(table.customerEmail)],
);
```

**`fieldValues`** — form field submissions, keyed by `(session_id, field_id)` with a unique constraint so upserts work:

```ts
export const fieldValues = pgTable(
  "field_values",
  {
    sessionId: varchar("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
    fieldId: varchar("field_id").notNull(),
    value: jsonb("value"),
    // ...
  },
  (table) => [
    unique("field_values_session_field_uq").on(table.sessionId, table.fieldId),
  ],
);
```

**`checks`** — verification check records. Each `(session_id, check_type)` pair is unique, storing the check's status and JSONB result:

```ts
status: varchar("status", {
  enum: ["pending", "running", "completed", "error"],
}).notNull().default("pending"),
result: jsonb("result"),
```

**`decisions`** — the final screening verdict. Stores a `status` of `PASS`, `FLAG`, or `REVIEW`, a `flagCount`, a human-readable `summary`, and a JSONB `reasons` array.

**`consentRecords`** — tracks per-check consent (`pending`, `granted`, `denied`, `expired`), uniquely constrained on `(session_id, action_type)`.

**`auditEvents`** — append-only event log. Each event stores its type, an optional actor, and a JSONB payload. Indexed on both `session_id` and `timestamp`.

**`formSchemas`** — versioned form definitions with a composite primary key on `(id, version)`.

**`providerUsers`** and **`customers`** — two separate user tables. Providers have a `totpSecret` for MFA; customers have an `emailConfirmed` boolean. Both store a `passwordHash`.

**`authSessions`** — server-side session tokens. Tracks `userId`, `role`, `aal` (AAL1 or AAL2), and `expiresAt`/`lastActivity` for timeout enforcement.

All child tables cascade-delete on `sessions.id`, so deleting a session cleans up everything.

---

## 6. `src/db-setup.ts` — database bootstrapping

A standalone script (run via `yarn db:setup`) that connects to the default `postgres` database and creates `cliver_p8` and `cliver_p8_test` if they don't exist:

```ts
const DATABASES = ["cliver_p8", "cliver_p8_test"];

async function setup() {
  const sql = postgres("postgresql://alejo@localhost:5432/postgres");
  for (const dbName of DATABASES) {
    const existing = await sql`SELECT 1 FROM pg_database WHERE datname = ${dbName}`;
    if (existing.length === 0) {
      await sql.unsafe(`CREATE DATABASE ${dbName}`);
    }
  }
  await sql.end();
}
```

This is a one-time setup step, not part of the application runtime.

## 7. `src/db.ts` — database connection

Creates and exports the singleton Drizzle client:

```ts
const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://alejo@localhost:5432/cliver_p8";

const client = postgres(DATABASE_URL);
export const db = drizzle(client, { schema });
export { client };
```

The `schema` import gives Drizzle full type awareness of all tables, enabling the relational query API. Both the raw `client` and the typed `db` are exported so consumers can use either.

---

## 8. `src/storage.ts` — the storage layer

This is the core of the package. It implements the `IStorageLayer` interface from `@cliver/contracts` using Drizzle queries. The function takes a typed `db` instance and returns an object with all the storage methods.

```ts
export function createStorageLayer(
  db: PostgresJsDatabase<typeof schema>,
): IStorageLayer {
```

**Screening CRUD.** `createScreening` inserts into `sessions` and returns the generated UUID. `getScreening` is the most complex method—it assembles a full `PipelineState` by querying five tables:

```ts
async getScreening(id: string): Promise<PipelineState | null> {
  const [session] = await db.select().from(schema.sessions).where(eq(schema.sessions.id, id));
  if (!session) return null;

  const fieldRows = await db.select().from(schema.fieldValues).where(eq(schema.fieldValues.sessionId, id));
  const checkRows = await db.select().from(schema.checks).where(eq(schema.checks.sessionId, id));
  const consentRows = await db.select().from(schema.consentRecords).where(eq(schema.consentRecords.sessionId, id));
  const [decisionRow] = await db.select().from(schema.decisions)
    .where(eq(schema.decisions.sessionId, id))
    .orderBy(desc(schema.decisions.decidedAt))
    .limit(1);

  // ... assembles completedFields, pendingChecks, runningChecks, completedChecks,
  //     outcomes, consentState, and decision into a PipelineState object
```

It derives list properties from row status: `pendingChecks` are checks with `status === "pending"`, `completedChecks` are those with `"completed"` or `"error"`, etc.

`listScreenings` filters by `status` and/or `customerEmail`, then calls `getScreening` for each row to assemble the full state.

**Upsert patterns.** Field values, check outcomes, and consent records all use `onConflictDoUpdate` on their unique constraints, making writes idempotent:

```ts
await db.insert(schema.fieldValues)
  .values({ sessionId: screeningId, fieldId, value })
  .onConflictDoUpdate({
    target: [schema.fieldValues.sessionId, schema.fieldValues.fieldId],
    set: { value, completedAt: new Date() },
  });
```

**Audit events** are append-only (`insert` only, no upsert). The `queryAuditEvents` method supports filtering by `screeningId`, `type`, and `since`, always returning results in chronological order.

**User management.** `createUser` routes to either `providerUsers` or `customers` based on `role`. `getUserByEmail` checks providers first, then customers—so if both tables had the same email, the provider would win. `updateUser` follows the same lookup pattern.

**Form schemas** use upsert on the composite `(id, version)` key. `getFormSchema` without a version returns the latest by `createdAt`.

---

## 9. `src/auth-middleware.ts` — session authentication

Hono middleware that validates server-side sessions from the `auth_sessions` table. Extracts the session ID from `Authorization: Bearer <sessionId>`:

```ts
export function createAuthMiddleware(
  db: PostgresJsDatabase<typeof schema>,
  requiredRole?: UserRole,
) {
  return createMiddleware<{ Variables: { auth: AuthContext } }>(
    async (c, next) => {
      const authHeader = c.req.header("Authorization");
      const sessionId = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : undefined;

      if (!sessionId) return c.json({ error: "Authentication required" }, 401);
```

Three validation checks:
1. **Session existence** — looks up the ID in `auth_sessions`.
2. **Expiry** — compares `expiresAt` against the current time.
3. **Inactivity timeout** — for provider sessions, enforces a 1-hour inactivity window based on `lastActivity`.

```ts
const ONE_HOUR_MS = 60 * 60 * 1000;
if (
  session.role === "provider" &&
  Date.now() - session.lastActivity.getTime() > ONE_HOUR_MS
) {
  return c.json({ error: "Session inactive" }, 401);
}
```

If a `requiredRole` is specified, the middleware returns 403 for mismatches. On success, it updates `lastActivity` and attaches an `AuthContext` to the Hono context:

```ts
c.set("auth", {
  userId: session.userId,
  email: session.email,
  role: session.role as UserRole,
  aal: session.aal as AAL,
  sessionId: session.id,
});
```

This `auth` variable is consumed by route handlers via `c.get("auth")`.

---

## 10. `src/routes.ts` — HTTP API

Builds a Hono app with four route groups. The function receives both `db` and `storage` so routes can use either Drizzle queries directly or the storage abstraction.

```ts
export function createApp(
  db: PostgresJsDatabase<typeof schema>,
  storage: IStorageLayer,
) {
  const app = new Hono();
  const customerAuth = createAuthMiddleware(db, "customer");
  const providerAuth = createAuthMiddleware(db, "provider");
  const anyAuth = createAuthMiddleware(db);
```

Three middleware variants: `customerAuth` (role must be `"customer"`), `providerAuth` (role must be `"provider"`), and `anyAuth` (any authenticated user).

**Health check** — `GET /health`, unauthenticated.

**Session routes** (`/api/sessions`):

- `POST /` (customerAuth) — creates a screening session. Validates body with Zod, uses the authenticated user's email as the `customerEmail`.
- `GET /:id` (anyAuth) — returns full `PipelineState`. Includes an ownership check: customers can only view sessions where `customerEmail` matches their auth email. Providers can view any session.

```ts
if (auth.role === "customer") {
  const [session] = await db
    .select({ customerEmail: schema.sessions.customerEmail })
    .from(schema.sessions)
    .where(eq(schema.sessions.id, id));
  if (session && session.customerEmail !== auth.email) {
    return c.json({ error: "Forbidden" }, 403);
  }
}
```

- `POST /:id/fields` (customerAuth) — stores a field value and emits an audit event.
- `POST /:id/consent` (customerAuth) — records consent for a check, emits an audit event, returns updated consent records.
- `GET /:id/events` (anyAuth) — SSE endpoint. Streams existing audit events as `data:` frames, sends a heartbeat comment, then closes. (The comment notes a real implementation would keep the stream open and push live events.)

**Provider routes** (`/api/provider`):

- `GET /sessions` (providerAuth) — lists all sessions, optionally filtered by `?status=`.
- `GET /sessions/:id/audit` (providerAuth) — returns the full audit trail for a session.

**Auth routes** (`/api/auth`):

- `POST /register` — creates a customer with a minimum 15-character password. Returns 409 on duplicate email.
- `POST /confirm` — marks email as confirmed (accepts any non-empty code; real verification is delegated to P4).
- `POST /login` — password check, email confirmation check, then creates an AAL1 session with 30-day expiry.
- `POST /provider/login` — provider-specific login requiring `totpCode`. Creates an AAL2 session with 24-hour expiry.

```ts
const twentyFourHours = 24 * 60 * 60 * 1000;
const [session] = await db
  .insert(schema.authSessions)
  .values({
    userId: user.id,
    role: "provider",
    aal: "AAL2",
    email: user.email,
    expiresAt: new Date(Date.now() + twentyFourHours),
  })
  .returning();
```

---

## 11. `src/index.ts` — public API

Re-exports everything a consumer needs:

```ts
export { createStorageLayer } from "./storage.js";
export { createApp } from "./routes.js";
export { createAuthMiddleware, type AuthContext } from "./auth-middleware.js";
export { db, client } from "./db.js";
export * as schema from "./schema.js";
```

Other packages import from `@cliver/p8-persistence` and get the storage layer, HTTP app factory, auth middleware, database client, and schema.

---

## 12. `test/setup.ts` — test infrastructure

Connects to `cliver_p8_test` (or `$DATABASE_URL`) and provides three helpers:

```ts
export function getTestDb() {
  if (!testDb) {
    testClient = postgres(TEST_DATABASE_URL);
    testDb = drizzle(testClient, { schema });
  }
  return testDb;
}
```

`createTables()` runs raw `CREATE TABLE IF NOT EXISTS` SQL for all nine tables—a simpler alternative to running Drizzle migrations in tests. `truncateAll()` does a cascading truncate of every table between tests. `closeTestDb()` shuts down the connection pool after the suite finishes.

## 13. `test/storage.test.ts` — storage layer tests

Tests the `IStorageLayer` implementation directly against the test database. Covers all major operations:

**Screenings** — create, retrieve, update status, list with filters, and null return for nonexistent IDs.

**Field values** — store/retrieve, upsert behavior (duplicate `fieldId` overwrites), and two concurrency tests:

```ts
it("same-field concurrent writes produce exactly one row", async () => {
  const id = await storage.createScreening({ status: "pending" });
  const promises = Array.from({ length: 10 }, (_, i) =>
    storage.storeFieldValue(id, "name", `value_${i}`),
  );
  await Promise.all(promises);
  const values = await storage.getFieldValues(id);
  expect(Object.keys(values)).toEqual(["name"]);
});
```

This verifies the `onConflictDoUpdate` upsert handles concurrent writes without creating duplicate rows.

**Check outcomes** — store/retrieve, status mapping into `completedChecks`, error status handling.

**Consent records** — store/retrieve, upsert on status change, and integration with `getScreening`'s `consentState`.

**Audit events** — store/query, chronological ordering (even when inserted out of order), filtering by event type, filtering by `since` timestamp.

**Decisions** — inserts a decision directly via Drizzle (since `IStorageLayer` doesn't expose a `createDecision` method) and verifies it appears in `getScreening`'s `decision` field.

**Users** — create customer/provider, retrieve by email, null for nonexistent, and update fields.

**Form schemas** — store/retrieve, version-specific retrieval, null for nonexistent.

## 14. `test/api.test.ts` — HTTP API tests

Tests the Hono app end-to-end using `app.request()` (Hono's built-in test helper—no HTTP server needed). Two helper functions create authenticated sessions by inserting directly into the database:

```ts
async function createCustomerSession(): Promise<{ sessionId: string; userId: string }> {
  const userId = await storage.createUser({ email: "customer@test.com", ... });
  await storage.updateUser(userId, { emailConfirmed: true });
  const [session] = await db.insert(schema.authSessions).values({
    userId, role: "customer", aal: "AAL1", email: "customer@test.com",
    expiresAt: new Date(Date.now() + thirtyDays),
  }).returning();
  return { sessionId: session.id, userId };
}
```

**Coverage includes:**

- Health check returns 200.
- Session creation requires customer auth (401 without, 403 with provider auth).
- Session retrieval returns full `PipelineState` including `completedFields` after field submission.
- Ownership enforcement: customer A cannot view customer B's session (403), but a provider can view any session (200).
- Field submission validates with Zod (400 for missing `fieldId`), returns 404 for nonexistent sessions.
- Consent recording returns updated consent state.
- SSE endpoint returns `text/event-stream` content type with `data:` frames containing audit events.
- Provider endpoints require provider auth (403 for customers), return session lists and audit trails.
- Auth flow: register (201, 400 for short password, 409 for duplicate), confirm email, login (200 with session, 403 for unconfirmed, 401 for wrong password).
- Provider login creates AAL2 session, rejects customers trying the provider login endpoint.
- Expired sessions return 401.
