import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import type { IStorageLayer } from "@cliver/contracts";
import { createStorageLayer } from "../src/storage.js";
import { createApp } from "../src/routes.js";
import {
  getTestDb,
  getTestClient,
  createTables,
  truncateAll,
  closeTestDb,
} from "./setup.js";
import * as schema from "../src/schema.js";

let app: ReturnType<typeof createApp>;
let storage: IStorageLayer;

// Helper: create a customer user and return a session token
async function createCustomerSession(): Promise<{
  sessionId: string;
  userId: string;
}> {
  const db = getTestDb();
  const userId = await storage.createUser({
    email: "customer@test.com",
    passwordHash: "testpassword12345",
    role: "customer",
  });
  await storage.updateUser(userId, { emailConfirmed: true });

  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const [session] = await db
    .insert(schema.authSessions)
    .values({
      userId,
      role: "customer",
      aal: "AAL1",
      email: "customer@test.com",
      expiresAt: new Date(Date.now() + thirtyDays),
    })
    .returning();

  return { sessionId: session.id, userId };
}

// Helper: create a provider user and return a session token
async function createProviderSession(): Promise<{
  sessionId: string;
  userId: string;
}> {
  const db = getTestDb();
  const userId = await storage.createUser({
    email: "provider@test.com",
    passwordHash: "providerpass12345",
    role: "provider",
  });

  const twentyFourHours = 24 * 60 * 60 * 1000;
  const [session] = await db
    .insert(schema.authSessions)
    .values({
      userId,
      role: "provider",
      aal: "AAL2",
      email: "provider@test.com",
      expiresAt: new Date(Date.now() + twentyFourHours),
    })
    .returning();

  return { sessionId: session.id, userId };
}

beforeAll(async () => {
  const db = getTestDb();
  await createTables();
  storage = createStorageLayer(db);
  app = createApp(db, storage);
});

beforeEach(async () => {
  await truncateAll();
});

afterAll(async () => {
  await closeTestDb();
});

describe("GET /health", () => {
  it("returns healthy status", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("healthy");
    expect(body.timestamp).toBeDefined();
  });
});

describe("POST /api/sessions", () => {
  it("creates a session and returns ID (with customer auth)", async () => {
    const { sessionId } = await createCustomerSession();

    const res = await app.request("/api/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionId}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(typeof body.id).toBe("string");
  });

  it("returns 401 without auth", async () => {
    const res = await app.request("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(401);
  });

  it("returns 403 with provider auth (wrong role)", async () => {
    const { sessionId } = await createProviderSession();

    const res = await app.request("/api/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sessionId}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(403);
  });
});

describe("GET /api/sessions/:id", () => {
  it("returns full session state", async () => {
    const { sessionId: authToken } = await createCustomerSession();

    // Create a screening session
    const createRes = await app.request("/api/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const { id: screeningId } = await createRes.json();

    // Submit a field
    await app.request(`/api/sessions/${screeningId}/fields`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fieldId: "name", value: "Alice" }),
    });

    // Get session state
    const res = await app.request(`/api/sessions/${screeningId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(res.status).toBe(200);
    const state = await res.json();
    expect(state.screeningId).toBe(screeningId);
    expect(state.status).toBe("pending");
    expect(state.completedFields).toContain("name");
  });

  it("returns 404 for non-existent session", async () => {
    const { sessionId: authToken } = await createCustomerSession();

    const res = await app.request(
      "/api/sessions/00000000-0000-0000-0000-000000000000",
      { headers: { Authorization: `Bearer ${authToken}` } },
    );

    expect(res.status).toBe(404);
  });

  it("returns 403 when customer tries to view another customer's session", async () => {
    // Create first customer and their session
    const { sessionId: authToken1 } = await createCustomerSession();

    const createRes = await app.request("/api/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken1}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const { id: screeningId } = await createRes.json();

    // Create second customer with a different email
    const db = getTestDb();
    const userId2 = await storage.createUser({
      email: "other-customer@test.com",
      passwordHash: "testpassword12345",
      role: "customer",
    });
    await storage.updateUser(userId2, { emailConfirmed: true });

    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const [session2] = await db
      .insert(schema.authSessions)
      .values({
        userId: userId2,
        role: "customer",
        aal: "AAL1",
        email: "other-customer@test.com",
        expiresAt: new Date(Date.now() + thirtyDays),
      })
      .returning();

    // Second customer tries to access first customer's session
    const res = await app.request(`/api/sessions/${screeningId}`, {
      headers: { Authorization: `Bearer ${session2.id}` },
    });

    expect(res.status).toBe(403);
  });

  it("allows provider to view any customer's session", async () => {
    const { sessionId: custToken } = await createCustomerSession();
    const { sessionId: provToken } = await createProviderSession();

    // Create a session with customer auth
    const createRes = await app.request("/api/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${custToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const { id: screeningId } = await createRes.json();

    // Provider can view it
    const res = await app.request(`/api/sessions/${screeningId}`, {
      headers: { Authorization: `Bearer ${provToken}` },
    });

    expect(res.status).toBe(200);
  });
});

describe("POST /api/sessions/:id/fields", () => {
  it("persists field value and returns acknowledgment", async () => {
    const { sessionId: authToken } = await createCustomerSession();

    const createRes = await app.request("/api/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const { id: screeningId } = await createRes.json();

    const res = await app.request(`/api/sessions/${screeningId}/fields`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fieldId: "email", value: "alice@mit.edu" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.fieldId).toBe("email");
  });

  it("returns 400 with Zod validation errors for malformed body", async () => {
    const { sessionId: authToken } = await createCustomerSession();

    const createRes = await app.request("/api/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const { id: screeningId } = await createRes.json();

    const res = await app.request(`/api/sessions/${screeningId}/fields`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value: "missing fieldId" }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
    expect(body.details).toBeDefined();
  });

  it("returns 404 for non-existent session", async () => {
    const { sessionId: authToken } = await createCustomerSession();

    const res = await app.request(
      "/api/sessions/00000000-0000-0000-0000-000000000000/fields",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fieldId: "name", value: "test" }),
      },
    );

    expect(res.status).toBe(404);
  });
});

describe("POST /api/sessions/:id/consent", () => {
  it("records consent and returns updated state", async () => {
    const { sessionId: authToken } = await createCustomerSession();

    const createRes = await app.request("/api/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const { id: screeningId } = await createRes.json();

    const res = await app.request(`/api/sessions/${screeningId}/consent`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ checkId: "sanctions_check", granted: true }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.consentRecords.length).toBe(1);
    expect(body.consentRecords[0].status).toBe("granted");
  });
});

describe("GET /api/sessions/:id/events (SSE)", () => {
  it("returns SSE stream with correct headers", async () => {
    const { sessionId: authToken } = await createCustomerSession();

    const createRes = await app.request("/api/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const { id: screeningId } = await createRes.json();

    // Submit a field to generate an audit event
    await app.request(`/api/sessions/${screeningId}/fields`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fieldId: "name", value: "Bob" }),
    });

    const res = await app.request(`/api/sessions/${screeningId}/events`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.headers.get("Cache-Control")).toBe("no-cache");

    const text = await res.text();
    expect(text).toContain("data:");
    expect(text).toContain("field_completed");
  });

  it("returns 404 for non-existent session", async () => {
    const { sessionId: authToken } = await createCustomerSession();

    const res = await app.request(
      "/api/sessions/00000000-0000-0000-0000-000000000000/events",
      { headers: { Authorization: `Bearer ${authToken}` } },
    );

    expect(res.status).toBe(404);
  });
});

describe("Provider endpoints", () => {
  it("GET /api/provider/sessions lists sessions with provider auth", async () => {
    const { sessionId: custToken } = await createCustomerSession();
    const { sessionId: provToken } = await createProviderSession();

    // Create some sessions
    await app.request("/api/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${custToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const res = await app.request("/api/provider/sessions", {
      headers: { Authorization: `Bearer ${provToken}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(1);
  });

  it("GET /api/provider/sessions returns 403 with customer auth", async () => {
    const { sessionId: custToken } = await createCustomerSession();

    const res = await app.request("/api/provider/sessions", {
      headers: { Authorization: `Bearer ${custToken}` },
    });

    expect(res.status).toBe(403);
  });

  it("GET /api/provider/sessions/:id/audit returns audit trail", async () => {
    const { sessionId: custToken } = await createCustomerSession();
    const { sessionId: provToken } = await createProviderSession();

    // Create session and submit field
    const createRes = await app.request("/api/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${custToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const { id: screeningId } = await createRes.json();

    await app.request(`/api/sessions/${screeningId}/fields`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${custToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fieldId: "name", value: "Test" }),
    });

    const res = await app.request(
      `/api/provider/sessions/${screeningId}/audit`,
      { headers: { Authorization: `Bearer ${provToken}` } },
    );

    expect(res.status).toBe(200);
    const events = await res.json();
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].type).toBe("field_completed");
  });

  it("GET /api/provider/sessions/:id/audit returns 401 without auth", async () => {
    const res = await app.request(
      "/api/provider/sessions/some-id/audit",
    );
    expect(res.status).toBe(401);
  });
});

describe("Auth endpoints", () => {
  it("POST /api/auth/register creates a customer", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "new@example.com",
        password: "a-very-long-password-here",
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.email).toBe("new@example.com");
  });

  it("POST /api/auth/register returns 400 for short password", async () => {
    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "short@example.com",
        password: "short",
      }),
    });

    expect(res.status).toBe(400);
  });

  it("POST /api/auth/register returns 409 for duplicate email", async () => {
    await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "dupe@example.com",
        password: "a-very-long-password-here",
      }),
    });

    const res = await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "dupe@example.com",
        password: "a-very-long-password-here",
      }),
    });

    expect(res.status).toBe(409);
  });

  it("POST /api/auth/confirm confirms email", async () => {
    await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "confirm@example.com",
        password: "a-very-long-password-here",
      }),
    });

    const res = await app.request("/api/auth/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "confirm@example.com",
        code: "123456",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("POST /api/auth/login returns session for confirmed customer", async () => {
    const password = "a-very-long-password-here";

    await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "login@example.com", password }),
    });

    await app.request("/api/auth/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "login@example.com", code: "123456" }),
    });

    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "login@example.com", password }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sessionId).toBeDefined();
    expect(body.email).toBe("login@example.com");
    expect(body.role).toBe("customer");
  });

  it("POST /api/auth/login returns 403 for unconfirmed email", async () => {
    const password = "a-very-long-password-here";

    await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "unconfirmed@example.com",
        password,
      }),
    });

    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "unconfirmed@example.com",
        password,
      }),
    });

    expect(res.status).toBe(403);
  });

  it("POST /api/auth/login returns 401 for wrong password", async () => {
    const res = await app.request("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nobody@example.com",
        password: "wrongwrongwrongwrong",
      }),
    });

    expect(res.status).toBe(401);
  });

  it("POST /api/auth/provider/login creates AAL2 session", async () => {
    const db = getTestDb();
    // Create provider user directly
    await storage.createUser({
      email: "admin@provider.com",
      passwordHash: "provider-password-123",
      role: "provider",
    });

    const res = await app.request("/api/auth/provider/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@provider.com",
        password: "provider-password-123",
        totpCode: "123456",
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.sessionId).toBeDefined();
    expect(body.role).toBe("provider");
    expect(body.aal).toBe("AAL2");
  });

  it("POST /api/auth/provider/login returns 401 for customer role", async () => {
    const password = "customer-password-12345";
    await app.request("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "notprovider@example.com",
        password,
      }),
    });

    const res = await app.request("/api/auth/provider/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "notprovider@example.com",
        password,
        totpCode: "123456",
      }),
    });

    expect(res.status).toBe(401);
  });
});

describe("Auth middleware — cross-access denied", () => {
  it("customer cannot access provider endpoints", async () => {
    const { sessionId: custToken } = await createCustomerSession();

    const res = await app.request("/api/provider/sessions", {
      headers: { Authorization: `Bearer ${custToken}` },
    });

    expect(res.status).toBe(403);
  });

  it("provider can access session detail (anyAuth)", async () => {
    const { sessionId: custToken } = await createCustomerSession();
    const { sessionId: provToken } = await createProviderSession();

    // Create a session with customer auth
    const createRes = await app.request("/api/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${custToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const { id: screeningId } = await createRes.json();

    // Provider can view it
    const res = await app.request(`/api/sessions/${screeningId}`, {
      headers: { Authorization: `Bearer ${provToken}` },
    });

    expect(res.status).toBe(200);
  });

  it("expired session returns 401", async () => {
    const db = getTestDb();
    const userId = await storage.createUser({
      email: "expired@test.com",
      passwordHash: "testpassword12345",
      role: "customer",
    });

    // Create an already-expired session
    const [session] = await db
      .insert(schema.authSessions)
      .values({
        userId,
        role: "customer",
        aal: "AAL1",
        email: "expired@test.com",
        expiresAt: new Date(Date.now() - 1000), // expired 1 second ago
      })
      .returning();

    const res = await app.request("/api/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.id}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(401);
  });
});
