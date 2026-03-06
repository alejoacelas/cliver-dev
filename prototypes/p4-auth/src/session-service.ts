import { randomBytes } from "node:crypto";
import type { AAL, Session } from "@cliver/contracts";
import type { ITokenStore } from "@cliver/contracts";

const SESSION_PREFIX = "session:";
const CSRF_PREFIX = "csrf:";

// SP 800-63B-4 timeout constants
const AAL1_MAX_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const AAL2_MAX_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 hours
const AAL2_INACTIVITY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Server-side session management per NIST SP 800-63B-4 Sec. 5.1.
 *
 * Sessions are stored in a token store with opaque, cryptographically
 * random session IDs (256 bits of entropy). Timeout enforcement follows
 * AAL-specific rules.
 */
export class SessionService {
  private store: ITokenStore;

  constructor(store: ITokenStore) {
    this.store = store;
  }

  /**
   * Create a new session. Generates a cryptographically random session ID
   * with 256 bits of entropy (well above the 64-bit minimum).
   */
  async createSession(userId: string, aal: AAL): Promise<Session> {
    const id = randomBytes(32).toString("hex"); // 256 bits
    const now = new Date();
    const lifetimeMs =
      aal === "AAL1" ? AAL1_MAX_LIFETIME_MS : AAL2_MAX_LIFETIME_MS;
    const expiresAt = new Date(now.getTime() + lifetimeMs);
    const ttlSeconds = Math.floor(lifetimeMs / 1000);

    const session: Session = {
      id,
      userId,
      aal,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      lastActivity: now.toISOString(),
    };

    await this.store.set(
      `${SESSION_PREFIX}${id}`,
      JSON.stringify(session),
      ttlSeconds,
    );

    // Generate and store a CSRF token for this session
    const csrfToken = randomBytes(32).toString("hex");
    await this.store.set(`${CSRF_PREFIX}${id}`, csrfToken, ttlSeconds);

    return session;
  }

  /**
   * Validate a session by ID. Returns null if the session doesn't exist,
   * has expired, or has exceeded its overall timeout.
   */
  async validateSession(sessionId: string): Promise<Session | null> {
    const data = await this.store.get(`${SESSION_PREFIX}${sessionId}`);
    if (!data) return null;

    const session: Session = JSON.parse(data);

    // Check overall expiry
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      await this.destroySession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Destroy a session, making it immediately invalid.
   */
  async destroySession(sessionId: string): Promise<void> {
    await this.store.delete(`${SESSION_PREFIX}${sessionId}`);
    await this.store.delete(`${CSRF_PREFIX}${sessionId}`);
    await this.store.delete(`session-role:${sessionId}`);
  }

  /**
   * Enforce AAL-specific timeout rules on a session.
   *
   * - AAL1: No inactivity timeout (only overall 30-day max, handled by TTL).
   * - AAL2: 1-hour inactivity timeout, 24-hour overall timeout.
   *
   * Returns the session if still valid, or null if timed out.
   */
  async enforceTimeouts(session: Session): Promise<Session | null> {
    // Check overall expiry
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      await this.destroySession(session.id);
      return null;
    }

    // Check inactivity timeout for AAL2
    if (session.aal === "AAL2") {
      const lastActivity = new Date(session.lastActivity).getTime();
      if (Date.now() - lastActivity > AAL2_INACTIVITY_MS) {
        await this.destroySession(session.id);
        return null;
      }
    }

    return session;
  }

  /**
   * Update last activity timestamp for a session (to prevent inactivity timeout).
   */
  async touchSession(sessionId: string): Promise<void> {
    const data = await this.store.get(`${SESSION_PREFIX}${sessionId}`);
    if (!data) return;

    const session: Session = JSON.parse(data);

    // Check if overall expiry has passed
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      await this.destroySession(sessionId);
      return;
    }

    session.lastActivity = new Date().toISOString();

    // Recompute remaining TTL
    const remainingMs =
      new Date(session.expiresAt).getTime() - Date.now();
    const remainingSeconds = Math.max(1, Math.floor(remainingMs / 1000));

    await this.store.set(
      `${SESSION_PREFIX}${sessionId}`,
      JSON.stringify(session),
      remainingSeconds,
    );
  }

  /**
   * Get the CSRF token associated with a session.
   */
  async getCsrfToken(sessionId: string): Promise<string | null> {
    return this.store.get(`${CSRF_PREFIX}${sessionId}`);
  }

  /**
   * Cookie options for the session cookie per SP 800-63B-4 Sec. 5.1.
   * Uses __Host- prefix which enforces Secure, no Domain, Path=/.
   */
  getSessionCookieOptions() {
    return {
      name: "__Host-session",
      httpOnly: true,
      secure: true,
      sameSite: "strict" as const,
      path: "/",
    };
  }
}
