import { Hono } from "hono";
import { z } from "zod";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { IStorageLayer } from "@cliver/contracts";
import { eq } from "drizzle-orm";
import * as schema from "./schema.js";
import {
  createAuthMiddleware,
  type AuthContext,
} from "./auth-middleware.js";

type Env = { Variables: { auth: AuthContext } };

export function createApp(
  db: PostgresJsDatabase<typeof schema>,
  storage: IStorageLayer,
) {
  const app = new Hono();

  const customerAuth = createAuthMiddleware(db, "customer");
  const providerAuth = createAuthMiddleware(db, "provider");
  const anyAuth = createAuthMiddleware(db);

  // --- Health check ---

  app.get("/health", (c) => {
    return c.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // --- Session endpoints (customer) ---

  const sessionRoutes = new Hono<Env>();

  sessionRoutes.post("/", customerAuth, async (c) => {
    const body = await c.req.json().catch(() => null);
    const parseResult = z
      .object({
        customerEmail: z.string().email().optional(),
        formSchemaVersion: z.string().optional(),
      })
      .safeParse(body ?? {});

    if (!parseResult.success) {
      return c.json(
        { error: "Validation failed", details: parseResult.error.issues },
        400,
      );
    }

    const auth = c.get("auth");
    const email = parseResult.data.customerEmail ?? auth.email;
    // Cast to access the optional second parameter added by our implementation
    const createScreening = storage.createScreening as (
      data: Parameters<typeof storage.createScreening>[0],
      customerEmail?: string,
    ) => Promise<string>;
    const id = await createScreening({
      screeningId: "",
      status: "pending",
      completedFields: [],
      pendingChecks: [],
      runningChecks: [],
      completedChecks: [],
      outcomes: [],
      consentState: {},
      decision: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, email);

    return c.json({ id }, 201);
  });

  sessionRoutes.get("/:id", anyAuth, async (c) => {
    const id = c.req.param("id");
    const state = await storage.getScreening(id);

    if (!state) {
      return c.json({ error: "Session not found" }, 404);
    }

    // Ownership check: customers can only view their own sessions
    const auth = c.get("auth");
    if (auth.role === "customer") {
      const [session] = await db
        .select({ customerEmail: schema.sessions.customerEmail })
        .from(schema.sessions)
        .where(eq(schema.sessions.id, id));
      if (session && session.customerEmail !== auth.email) {
        return c.json({ error: "Forbidden" }, 403);
      }
    }

    return c.json(state);
  });

  sessionRoutes.post("/:id/fields", customerAuth, async (c) => {
    const id = c.req.param("id");

    // Verify session exists
    const session = await storage.getScreening(id);
    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    const body = await c.req.json().catch(() => null);
    const parseResult = z
      .object({
        fieldId: z.string().min(1),
        value: z.unknown(),
      })
      .safeParse(body);

    if (!parseResult.success) {
      return c.json(
        { error: "Validation failed", details: parseResult.error.issues },
        400,
      );
    }

    await storage.storeFieldValue(
      id,
      parseResult.data.fieldId,
      parseResult.data.value,
    );

    // Store audit event
    await storage.storeAuditEvent({
      type: "field_completed",
      screeningId: id,
      timestamp: new Date().toISOString(),
      fieldId: parseResult.data.fieldId,
      fieldValue: parseResult.data.value,
    });

    return c.json({ ok: true, fieldId: parseResult.data.fieldId });
  });

  sessionRoutes.post("/:id/consent", customerAuth, async (c) => {
    const id = c.req.param("id");

    const session = await storage.getScreening(id);
    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    const body = await c.req.json().catch(() => null);
    const parseResult = z
      .object({
        checkId: z.string().min(1),
        granted: z.boolean(),
      })
      .safeParse(body);

    if (!parseResult.success) {
      return c.json(
        { error: "Validation failed", details: parseResult.error.issues },
        400,
      );
    }

    const status = parseResult.data.granted ? "granted" : "denied";
    await storage.storeConsentRecord(id, parseResult.data.checkId, status);

    // Store audit event
    await storage.storeAuditEvent({
      type: "consent_received",
      screeningId: id,
      timestamp: new Date().toISOString(),
      checkId: parseResult.data.checkId,
      granted: parseResult.data.granted,
    });

    const records = await storage.getConsentRecords(id);
    return c.json({ ok: true, consentRecords: records });
  });

  sessionRoutes.get("/:id/events", anyAuth, async (c) => {
    const id = c.req.param("id");

    const session = await storage.getScreening(id);
    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    // SSE stream headers
    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");
    c.header("X-Accel-Buffering", "no");

    // Get existing events and stream them
    const events = await storage.queryAuditEvents({ screeningId: id });

    return c.body(
      new ReadableStream({
        start(controller) {
          for (const event of events) {
            const data = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
          }

          // Send a heartbeat to indicate stream is alive
          controller.enqueue(
            new TextEncoder().encode(": heartbeat\n\n"),
          );

          // For now, close after sending existing events.
          // A real implementation would keep the stream open
          // and push new events as they arrive via IEventEmitter.
          controller.close();
        },
      }),
    );
  });

  app.route("/api/sessions", sessionRoutes);

  // --- Provider endpoints ---

  const providerRoutes = new Hono<Env>();

  providerRoutes.get("/sessions", providerAuth, async (c) => {
    const status = c.req.query("status");
    const filter = status ? { status } : undefined;
    const sessions = await storage.listScreenings(filter);
    return c.json(sessions);
  });

  providerRoutes.get("/sessions/:id/audit", providerAuth, async (c) => {
    const id = c.req.param("id");
    const session = await storage.getScreening(id);
    if (!session) {
      return c.json({ error: "Session not found" }, 404);
    }

    const events = await storage.queryAuditEvents({ screeningId: id });
    return c.json(events);
  });

  app.route("/api/provider", providerRoutes);

  // --- Auth endpoints ---

  const authRoutes = new Hono();

  authRoutes.post("/register", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parseResult = z
      .object({
        email: z.string().email(),
        password: z.string().min(15),
      })
      .safeParse(body);

    if (!parseResult.success) {
      return c.json(
        { error: "Validation failed", details: parseResult.error.issues },
        400,
      );
    }

    // Check if user already exists
    const existing = await storage.getUserByEmail(parseResult.data.email);
    if (existing) {
      return c.json({ error: "Email already registered" }, 409);
    }

    // In a real system, P4 would hash the password with Argon2id.
    // Here we store it as-is since P8 doesn't own hashing.
    const id = await storage.createUser({
      email: parseResult.data.email,
      passwordHash: parseResult.data.password, // P4 would hash this
      role: "customer",
    });

    return c.json({ id, email: parseResult.data.email }, 201);
  });

  authRoutes.post("/confirm", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parseResult = z
      .object({
        email: z.string().email(),
        code: z.string().min(1),
      })
      .safeParse(body);

    if (!parseResult.success) {
      return c.json(
        { error: "Validation failed", details: parseResult.error.issues },
        400,
      );
    }

    const user = await storage.getUserByEmail(parseResult.data.email);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // In a real system, P4 would verify the code against a token store.
    // Here we just mark as confirmed for any non-empty code.
    await storage.updateUser(user.id, { emailConfirmed: true });

    return c.json({ ok: true, email: parseResult.data.email });
  });

  authRoutes.post("/login", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parseResult = z
      .object({
        email: z.string().email(),
        password: z.string().min(1),
      })
      .safeParse(body);

    if (!parseResult.success) {
      return c.json(
        { error: "Validation failed", details: parseResult.error.issues },
        400,
      );
    }

    const user = await storage.getUserByEmail(parseResult.data.email);
    if (!user || user.passwordHash !== parseResult.data.password) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    if (user.role === "customer" && !user.emailConfirmed) {
      return c.json({ error: "Email not confirmed" }, 403);
    }

    // Create server-side session
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const [session] = await db
      .insert(schema.authSessions)
      .values({
        userId: user.id,
        role: user.role,
        aal: "AAL1",
        email: user.email,
        expiresAt: new Date(Date.now() + thirtyDays),
      })
      .returning();

    return c.json({
      sessionId: session.id,
      userId: user.id,
      email: user.email,
      role: user.role,
    });
  });

  authRoutes.post("/provider/login", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parseResult = z
      .object({
        email: z.string().email(),
        password: z.string().min(1),
        totpCode: z.string().min(1),
      })
      .safeParse(body);

    if (!parseResult.success) {
      return c.json(
        { error: "Validation failed", details: parseResult.error.issues },
        400,
      );
    }

    const user = await storage.getUserByEmail(parseResult.data.email);
    if (!user || user.role !== "provider") {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    if (user.passwordHash !== parseResult.data.password) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    // In a real system, P4 would verify the TOTP code.
    // Here we accept any non-empty code for testing.

    // Create AAL2 session (24-hour expiry for providers)
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

    return c.json({
      sessionId: session.id,
      userId: user.id,
      email: user.email,
      role: "provider",
      aal: "AAL2",
    });
  });

  app.route("/api/auth", authRoutes);

  return app;
}
