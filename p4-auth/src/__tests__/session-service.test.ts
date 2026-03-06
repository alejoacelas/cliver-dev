import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { SessionService } from "../session-service.js";
import { InMemoryTokenStore } from "../in-memory-token-store.js";
import type { Session } from "@cliver/contracts";

describe("SessionService", () => {
  let sessionService: SessionService;
  let store: InMemoryTokenStore;

  beforeEach(() => {
    store = new InMemoryTokenStore();
    sessionService = new SessionService(store);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // --- Session creation ---

  describe("createSession", () => {
    it("creates an AAL1 session with 30-day expiry", async () => {
      const session = await sessionService.createSession("user-1", "AAL1");

      expect(session.userId).toBe("user-1");
      expect(session.aal).toBe("AAL1");
      expect(session.id).toBeDefined();

      const created = new Date(session.createdAt).getTime();
      const expires = new Date(session.expiresAt).getTime();
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

      expect(expires - created).toBe(thirtyDaysMs);
    });

    it("creates an AAL2 session with 24-hour expiry", async () => {
      const session = await sessionService.createSession("user-2", "AAL2");

      expect(session.aal).toBe("AAL2");

      const created = new Date(session.createdAt).getTime();
      const expires = new Date(session.expiresAt).getTime();
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;

      expect(expires - created).toBe(twentyFourHoursMs);
    });

    it("generates session tokens with at least 64 bits of entropy", async () => {
      const session = await sessionService.createSession("user-1", "AAL1");
      // 64 bits = 8 bytes = 16 hex chars minimum
      // We use 32 bytes (256 bits) for safety
      expect(session.id.length).toBeGreaterThanOrEqual(16);
    });

    it("generates cryptographically random session IDs (no collisions)", async () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const session = await sessionService.createSession(`user-${i}`, "AAL1");
        ids.add(session.id);
      }
      expect(ids.size).toBe(100);
    });
  });

  // --- Session validation ---

  describe("validateSession", () => {
    it("returns session for a valid session ID", async () => {
      const session = await sessionService.createSession("user-1", "AAL1");
      const retrieved = await sessionService.validateSession(session.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.userId).toBe("user-1");
    });

    it("returns null for an unknown session ID", async () => {
      const result = await sessionService.validateSession("nonexistent-session-id");
      expect(result).toBeNull();
    });

    it("returns null for an expired session", async () => {
      vi.useFakeTimers();
      const session = await sessionService.createSession("user-1", "AAL1");

      // Advance past 30 days
      vi.advanceTimersByTime(31 * 24 * 60 * 60 * 1000);

      const result = await sessionService.validateSession(session.id);
      expect(result).toBeNull();
    });
  });

  // --- Session destruction ---

  describe("destroySession", () => {
    it("destroys a session so it can no longer be validated", async () => {
      const session = await sessionService.createSession("user-1", "AAL1");
      await sessionService.destroySession(session.id);

      const result = await sessionService.validateSession(session.id);
      expect(result).toBeNull();
    });
  });

  // --- Timeout enforcement (SP 800-63B-4 Sec. 2.2.3) ---

  describe("enforceTimeouts", () => {
    it("invalidates AAL2 session after 1 hour of inactivity", async () => {
      vi.useFakeTimers();
      const session = await sessionService.createSession("user-1", "AAL2");

      // Advance 61 minutes
      vi.advanceTimersByTime(61 * 60 * 1000);

      const result = await sessionService.enforceTimeouts(session);
      expect(result).toBeNull();
    });

    it("keeps AAL2 session alive if activity is recent", async () => {
      vi.useFakeTimers();
      const session = await sessionService.createSession("user-1", "AAL2");

      // Advance 30 minutes
      vi.advanceTimersByTime(30 * 60 * 1000);

      // Touch the session (simulate activity)
      await sessionService.touchSession(session.id);
      const updated = await sessionService.validateSession(session.id);

      // Advance another 30 minutes (total 60 from creation, 30 from last touch)
      vi.advanceTimersByTime(30 * 60 * 1000);

      const result = await sessionService.enforceTimeouts(updated!);
      expect(result).not.toBeNull();
    });

    it("does not enforce inactivity timeout on AAL1 sessions", async () => {
      vi.useFakeTimers();
      const session = await sessionService.createSession("user-1", "AAL1");

      // Advance 2 hours — no inactivity timeout for AAL1
      vi.advanceTimersByTime(2 * 60 * 60 * 1000);

      const result = await sessionService.enforceTimeouts(session);
      expect(result).not.toBeNull();
    });

    it("invalidates AAL2 session after 24 hours overall", async () => {
      vi.useFakeTimers();
      const session = await sessionService.createSession("user-1", "AAL2");

      // Keep touching every 30 minutes for 25 hours
      for (let i = 0; i < 50; i++) {
        vi.advanceTimersByTime(30 * 60 * 1000);
        await sessionService.touchSession(session.id);
      }

      const updated = await sessionService.validateSession(session.id);
      // Should be null because overall 24h limit exceeded
      expect(updated).toBeNull();
    });
  });

  // --- Cookie attributes ---

  describe("getSessionCookieOptions", () => {
    it("returns HttpOnly, Secure, SameSite=Strict, __Host- prefix options", () => {
      const options = sessionService.getSessionCookieOptions();

      expect(options.httpOnly).toBe(true);
      expect(options.secure).toBe(true);
      expect(options.sameSite).toBe("strict");
      expect(options.name).toMatch(/^__Host-/);
      expect(options.path).toBe("/");
    });
  });
});
