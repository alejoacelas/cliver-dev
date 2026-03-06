import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { SalesforceAdapter } from "./salesforce-adapter.js";
import { SalesforceApiError } from "./types.js";
import { createStubServer, type StubServer } from "./test-helpers.js";
import type { Decision } from "@cliver/contracts";
import type { ScreeningResultMeta, SalesforceSession } from "./types.js";

describe("SalesforceAdapter", () => {
  let authStub: StubServer;
  let apiStub: StubServer;

  beforeAll(async () => {
    authStub = await createStubServer();
    apiStub = await createStubServer();
  });

  afterAll(async () => {
    await authStub.close();
    await apiStub.close();
  });

  beforeEach(() => {
    authStub.requests.length = 0;
    apiStub.requests.length = 0;
    authStub.clearRoutes();
    apiStub.clearRoutes();
  });

  const oauthClient = { clientId: "test-client-id", clientSecret: "test-client-secret" };

  function makeAdapter(): SalesforceAdapter {
    return new SalesforceAdapter(oauthClient, authStub.url + "/services/oauth2/token");
  }

  function makeSession(): SalesforceSession {
    return {
      instanceUrl: apiStub.url,
      accessToken: "valid-access-token",
      refreshToken: "valid-refresh-token",
      issuedAt: new Date().toISOString(),
    };
  }

  const passDecision: Decision = {
    status: "PASS",
    flagCount: 0,
    summary: "All checks passed with no flags.",
    reasons: [],
  };

  const flagDecision: Decision = {
    status: "FLAG",
    flagCount: 2,
    summary: "Two flags found during screening.",
    reasons: [
      { checkId: "sanctions", criterion: "sanctions_match", detail: "Potential OFAC match" },
      { checkId: "web_search", criterion: "adverse_media", detail: "Negative press coverage found" },
    ],
  };

  const meta: ScreeningResultMeta = {
    screeningId: "scr-001",
    customerEmail: "jane@example.com",
    evidenceCount: 5,
    checkCount: 3,
    timestamp: "2026-03-05T12:00:00Z",
  };

  // --- Authentication ---

  describe("authenticate", () => {
    it("returns session with access token on valid credentials", async () => {
      authStub.addRoute("POST", "/services/oauth2/token", (_req, body) => {
        const params = new URLSearchParams(body);
        expect(params.get("grant_type")).toBe("refresh_token");
        expect(params.get("refresh_token")).toBe("my-refresh-token");
        expect(params.get("client_id")).toBe("test-client-id");
        expect(params.get("client_secret")).toBe("test-client-secret");

        return {
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_token: "fresh-access-token",
            instance_url: "https://myorg.salesforce.com",
            issued_at: "2026-03-05T12:00:00Z",
          }),
        };
      });

      const adapter = makeAdapter();
      const session = await adapter.authenticate({
        instanceUrl: "https://myorg.salesforce.com",
        accessToken: "old-token",
        refreshToken: "my-refresh-token",
      });

      expect(session.accessToken).toBe("fresh-access-token");
      expect(session.instanceUrl).toBe("https://myorg.salesforce.com");
      expect(session.refreshToken).toBe("my-refresh-token");
      expect(session.issuedAt).toBeTruthy();
    });

    it("throws on invalid credentials", async () => {
      authStub.addRoute("POST", "/services/oauth2/token", () => ({
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "invalid_grant", error_description: "expired refresh token" }),
      }));

      const adapter = makeAdapter();
      try {
        await adapter.authenticate({
          instanceUrl: "https://myorg.salesforce.com",
          accessToken: "old",
          refreshToken: "bad-token",
        });
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(SalesforceApiError);
        expect((err as SalesforceApiError).code).toBe("INVALID_CREDENTIALS");
      }
    });
  });

  // --- pushResult ---

  describe("pushResult", () => {
    it("creates record and returns its ID", async () => {
      // No contact match
      apiStub.addRoute("GET", "/services/data/v59.0/query", () => ({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalSize: 0, records: [] }),
      }));

      apiStub.addRoute("POST", "/services/data/v59.0/sobjects/Screening__c", (_req, body) => {
        const fields = JSON.parse(body);
        return {
          status: 201,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: "a01xx00000Record1", success: true, errors: [] }),
        };
      });

      const adapter = makeAdapter();
      const result = await adapter.pushResult(makeSession(), passDecision, meta);

      expect(result.recordId).toBe("a01xx00000Record1");
    });

    it("with existing contact, links result to that contact", async () => {
      apiStub.addRoute("GET", "/services/data/v59.0/query", () => ({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalSize: 1,
          records: [{ Id: "003xx00000Contact1" }],
        }),
      }));

      let createdFields: Record<string, unknown> = {};
      apiStub.addRoute("POST", "/services/data/v59.0/sobjects/Screening__c", (_req, body) => {
        createdFields = JSON.parse(body);
        return {
          status: 201,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: "a01xx00000Record2", success: true, errors: [] }),
        };
      });

      const adapter = makeAdapter();
      const result = await adapter.pushResult(makeSession(), flagDecision, meta);

      expect(result.recordId).toBe("a01xx00000Record2");
      expect(createdFields.Contact__c).toBe("003xx00000Contact1");
    });

    it("maps decision fields correctly", async () => {
      apiStub.addRoute("GET", "/services/data/v59.0/query", () => ({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalSize: 0, records: [] }),
      }));

      let createdFields: Record<string, unknown> = {};
      apiStub.addRoute("POST", "/services/data/v59.0/sobjects/Screening__c", (_req, body) => {
        createdFields = JSON.parse(body);
        return {
          status: 201,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: "a01xx00000Record3", success: true, errors: [] }),
        };
      });

      const adapter = makeAdapter();
      await adapter.pushResult(makeSession(), flagDecision, meta);

      // Status
      expect(createdFields.Status__c).toBe("FLAG");
      // Flag count
      expect(createdFields.Flag_Count__c).toBe(2);
      // Flags (JSON array of reasons)
      const flags = JSON.parse(createdFields.Flags__c as string);
      expect(flags).toHaveLength(2);
      expect(flags[0].checkId).toBe("sanctions");
      expect(flags[1].detail).toBe("Negative press coverage found");
      // Summary
      expect(createdFields.Summary__c).toBe("Two flags found during screening.");
      // Evidence count
      expect(createdFields.Evidence_Count__c).toBe(5);
      // Check count
      expect(createdFields.Check_Count__c).toBe(3);
      // Customer email
      expect(createdFields.Customer_Email__c).toBe("jane@example.com");
      // Screening ID
      expect(createdFields.Screening_Id__c).toBe("scr-001");
      // Timestamp
      expect(createdFields.Completed_At__c).toBe("2026-03-05T12:00:00Z");
    });

    it("sets Flags__c to null for PASS decisions with no reasons", async () => {
      apiStub.addRoute("GET", "/services/data/v59.0/query", () => ({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalSize: 0, records: [] }),
      }));

      let createdFields: Record<string, unknown> = {};
      apiStub.addRoute("POST", "/services/data/v59.0/sobjects/Screening__c", (_req, body) => {
        createdFields = JSON.parse(body);
        return {
          status: 201,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: "a01xx00000Record4", success: true, errors: [] }),
        };
      });

      const adapter = makeAdapter();
      await adapter.pushResult(makeSession(), passDecision, meta);

      expect(createdFields.Flags__c).toBeNull();
      expect(createdFields.Flag_Count__c).toBe(0);
    });
  });

  // --- findContact ---

  describe("findContact", () => {
    it("returns null when no match", async () => {
      apiStub.addRoute("GET", "/services/data/v59.0/query", () => ({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalSize: 0, records: [] }),
      }));

      const adapter = makeAdapter();
      const result = await adapter.findContact(makeSession(), "nobody@example.com");
      expect(result).toBeNull();
    });

    it("returns contact ID when match found", async () => {
      apiStub.addRoute("GET", "/services/data/v59.0/query", () => ({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalSize: 1,
          records: [{ Id: "003xx00000FoundContact" }],
        }),
      }));

      const adapter = makeAdapter();
      const result = await adapter.findContact(makeSession(), "found@example.com");
      expect(result).toBe("003xx00000FoundContact");
    });
  });

  // --- Error handling ---

  describe("error handling", () => {
    it("throws SESSION_EXPIRED on 401 when re-auth also fails with 401", async () => {
      // Both the original request and the retry return 401
      apiStub.addRoute("GET", "/services/data/v59.0/query", () => ({
        status: 401,
        body: JSON.stringify([{ message: "Session expired", errorCode: "INVALID_SESSION_ID" }]),
      }));
      // Re-auth succeeds but the retry still gets 401
      authStub.addRoute("POST", "/services/oauth2/token", () => ({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: "still-bad-token",
          instance_url: apiStub.url,
          issued_at: new Date().toISOString(),
        }),
      }));

      const adapter = makeAdapter();
      try {
        await adapter.findContact(makeSession(), "any@example.com");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(SalesforceApiError);
        expect((err as SalesforceApiError).code).toBe("SESSION_EXPIRED");
        expect((err as SalesforceApiError).statusCode).toBe(401);
      }
    });

    it("throws RATE_LIMIT on 429", async () => {
      apiStub.addRoute("GET", "/services/data/v59.0/query", () => ({
        status: 429,
        body: "Too many requests",
      }));

      const adapter = makeAdapter();
      try {
        await adapter.findContact(makeSession(), "any@example.com");
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(SalesforceApiError);
        expect((err as SalesforceApiError).code).toBe("RATE_LIMIT");
      }
    });

    it("throws FIELD_VALIDATION on 400", async () => {
      apiStub.addRoute("POST", "/services/data/v59.0/sobjects/Screening__c", () => ({
        status: 400,
        body: JSON.stringify([{ message: "Required field missing: Status__c" }]),
      }));

      // Need query route for contact lookup
      apiStub.addRoute("GET", "/services/data/v59.0/query", () => ({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalSize: 0, records: [] }),
      }));

      const adapter = makeAdapter();
      try {
        await adapter.pushResult(makeSession(), passDecision, meta);
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(SalesforceApiError);
        expect((err as SalesforceApiError).code).toBe("FIELD_VALIDATION");
        expect((err as SalesforceApiError).statusCode).toBe(400);
      }
    });

    it("throws API_ERROR on network failure", async () => {
      const adapter = new SalesforceAdapter(oauthClient, "http://127.0.0.1:1/oauth");
      try {
        await adapter.authenticate({
          instanceUrl: "https://x.salesforce.com",
          accessToken: "t",
          refreshToken: "r",
        });
        expect.fail("Should have thrown");
      } catch (err) {
        expect(err).toBeInstanceOf(SalesforceApiError);
        expect((err as SalesforceApiError).code).toBe("API_ERROR");
      }
    });
  });

  // --- Session refresh ---

  describe("refreshSession", () => {
    it("expired session triggers re-auth and returns new session", async () => {
      authStub.addRoute("POST", "/services/oauth2/token", () => ({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: "refreshed-access-token",
          instance_url: apiStub.url,
          issued_at: "2026-03-05T13:00:00Z",
        }),
      }));

      const adapter = makeAdapter();
      const oldSession = makeSession();
      const newSession = await adapter.refreshSession(oldSession);

      expect(newSession.accessToken).toBe("refreshed-access-token");
      expect(newSession.refreshToken).toBe(oldSession.refreshToken);
      expect(newSession.issuedAt).toBe("2026-03-05T13:00:00Z");
    });
  });

  // --- Auto re-auth on 401 ---

  describe("auto re-auth on 401", () => {
    it("refreshes session and retries on 401, succeeds on retry", async () => {
      let queryCallCount = 0;
      apiStub.addRoute("GET", "/services/data/v59.0/query", (req) => {
        queryCallCount++;
        if (queryCallCount === 1) {
          // First call: expired session
          return {
            status: 401,
            body: JSON.stringify([{ message: "Session expired", errorCode: "INVALID_SESSION_ID" }]),
          };
        }
        // Second call: retry succeeds with refreshed token
        return {
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            totalSize: 1,
            records: [{ Id: "003xx00000RetryContact" }],
          }),
        };
      });

      authStub.addRoute("POST", "/services/oauth2/token", () => ({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: "refreshed-token-after-401",
          instance_url: apiStub.url,
          issued_at: new Date().toISOString(),
        }),
      }));

      const adapter = makeAdapter();
      const result = await adapter.findContact(makeSession(), "retry@example.com");

      expect(result).toBe("003xx00000RetryContact");
      expect(queryCallCount).toBe(2);
    });
  });

  // --- findContact SOQL verification ---

  describe("findContact SOQL query", () => {
    it("sends correctly formatted SOQL query", async () => {
      let capturedQuery = "";
      apiStub.addRoute("GET", "/services/data/v59.0/query", (req) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        capturedQuery = url.searchParams.get("q") ?? "";
        return {
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ totalSize: 0, records: [] }),
        };
      });

      const adapter = makeAdapter();
      await adapter.findContact(makeSession(), "test@example.com");

      expect(capturedQuery).toBe("SELECT Id FROM Contact WHERE Email = 'test@example.com'");
    });

    it("rejects SOQL injection via malicious email input", async () => {
      const adapter = makeAdapter();
      // This input would break SOQL if not properly validated/escaped.
      // isValidEmail rejects it before it ever reaches the query.
      await expect(
        adapter.findContact(makeSession(), "\\' OR Name LIKE '%25"),
      ).rejects.toThrow(SalesforceApiError);

      try {
        await adapter.findContact(makeSession(), "\\' OR Name LIKE '%25");
      } catch (err) {
        expect((err as SalesforceApiError).code).toBe("FIELD_VALIDATION");
      }
    });

    it("rejects email with no domain (invalid format)", async () => {
      const adapter = makeAdapter();
      await expect(
        adapter.findContact(makeSession(), "noatsign"),
      ).rejects.toThrow(SalesforceApiError);
    });
  });
});
