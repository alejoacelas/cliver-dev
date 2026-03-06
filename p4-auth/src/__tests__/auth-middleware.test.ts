import { describe, it, expect, beforeEach, vi } from "vitest";
import { requireAuth, requireProvider } from "../auth-middleware.js";
import { SessionService } from "../session-service.js";
import { InMemoryTokenStore } from "../in-memory-token-store.js";
import type { Session } from "@cliver/contracts";

// Minimal Express-like request/response mocks
function createMockReq(cookies: Record<string, string> = {}, headers: Record<string, string> = {}) {
  return {
    cookies,
    headers,
    method: "GET",
    session: undefined as Session | undefined,
  };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: unknown) {
      res.body = data;
      return res;
    },
  };
  return res;
}

describe("Auth Middleware", () => {
  let sessionService: SessionService;
  let store: InMemoryTokenStore;

  beforeEach(() => {
    store = new InMemoryTokenStore();
    sessionService = new SessionService(store);
  });

  describe("requireAuth", () => {
    it("proceeds with valid session", async () => {
      const session = await sessionService.createSession("user-1", "AAL1");

      const middleware = requireAuth(sessionService);
      const req = createMockReq({ "__Host-session": session.id });
      const res = createMockRes();
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.session).toBeDefined();
      expect(req.session!.userId).toBe("user-1");
    });

    it("returns 401 with no session cookie", async () => {
      const middleware = requireAuth(sessionService);
      const req = createMockReq();
      const res = createMockRes();
      const next = vi.fn();

      await middleware(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 401 with invalid session ID", async () => {
      const middleware = requireAuth(sessionService);
      const req = createMockReq({ "__Host-session": "bogus-session-id" });
      const res = createMockRes();
      const next = vi.fn();

      await middleware(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("requireProvider", () => {
    it("proceeds with AAL2 provider session when requireAuth has run", async () => {
      const session = await sessionService.createSession("provider-1", "AAL2");

      // Store the role alongside the session for the middleware to check
      await store.set(`session-role:${session.id}`, "provider");

      const middleware = requireProvider(sessionService, store);
      const req = createMockReq({ "__Host-session": session.id });
      // Simulate that requireAuth has already run and set req.session
      req.session = session;
      const res = createMockRes();
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("rejects customer session on provider-only endpoint", async () => {
      const session = await sessionService.createSession("customer-1", "AAL1");
      await store.set(`session-role:${session.id}`, "customer");

      const middleware = requireProvider(sessionService, store);
      const req = createMockReq({ "__Host-session": session.id });
      // Simulate that requireAuth has already run
      req.session = session;
      const res = createMockRes();
      const next = vi.fn();

      await middleware(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 401 when requireAuth has not run (no req.session)", async () => {
      const middleware = requireProvider(sessionService, store);
      const req = createMockReq();
      const res = createMockRes();
      const next = vi.fn();

      await middleware(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 401 when used standalone without requireAuth (#6)", async () => {
      // Even with a valid session cookie, requireProvider should reject
      // if requireAuth hasn't set req.session
      const session = await sessionService.createSession("provider-1", "AAL2");
      await store.set(`session-role:${session.id}`, "provider");

      const middleware = requireProvider(sessionService, store);
      const req = createMockReq({ "__Host-session": session.id });
      // Deliberately NOT setting req.session to simulate standalone use
      const res = createMockRes();
      const next = vi.fn();

      await middleware(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  // --- CSRF protection ---

  describe("CSRF protection", () => {
    it("rejects state-changing request without CSRF token", async () => {
      const session = await sessionService.createSession("user-1", "AAL1");

      const middleware = requireAuth(sessionService);
      const req = createMockReq(
        { "__Host-session": session.id },
        {},
      );
      req.method = "POST";
      const res = createMockRes();
      const next = vi.fn();

      await middleware(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(next).not.toHaveBeenCalled();
    });

    it("accepts state-changing request with valid CSRF token", async () => {
      const session = await sessionService.createSession("user-1", "AAL1");

      // The CSRF token should be stored with the session
      const csrfToken = await sessionService.getCsrfToken(session.id);

      const middleware = requireAuth(sessionService);
      const req = createMockReq(
        { "__Host-session": session.id },
        { "x-csrf-token": csrfToken! },
      );
      req.method = "POST";
      const res = createMockRes();
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("allows GET requests without CSRF token", async () => {
      const session = await sessionService.createSession("user-1", "AAL1");

      const middleware = requireAuth(sessionService);
      const req = createMockReq({ "__Host-session": session.id });
      req.method = "GET";
      const res = createMockRes();
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
