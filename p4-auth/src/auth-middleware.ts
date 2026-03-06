import { timingSafeEqual } from "node:crypto";
import type { Session } from "@cliver/contracts";
import type { ITokenStore } from "@cliver/contracts";
import type { SessionService } from "./session-service.js";

// State-changing HTTP methods that require CSRF protection
const CSRF_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

interface Request {
  cookies: Record<string, string>;
  headers: Record<string, string>;
  method: string;
  session?: Session;
}

interface Response {
  status(code: number): Response;
  json(data: unknown): Response;
}

type NextFunction = () => void;

/**
 * Express-style middleware that validates the session cookie.
 *
 * For state-changing requests (POST, PUT, PATCH, DELETE), also
 * validates the CSRF token in the X-CSRF-Token header.
 *
 * On success, attaches the session to `req.session` and calls `next()`.
 * On failure, responds with 401 (no session) or 403 (invalid CSRF).
 */
export function requireAuth(sessionService: SessionService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const sessionId = req.cookies?.["__Host-session"];

    if (!sessionId) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const session = await sessionService.validateSession(sessionId);
    if (!session) {
      res.status(401).json({ error: "Invalid or expired session" });
      return;
    }

    // Enforce timeouts
    const validSession = await sessionService.enforceTimeouts(session);
    if (!validSession) {
      res.status(401).json({ error: "Session timed out" });
      return;
    }

    // CSRF protection for state-changing requests
    if (CSRF_METHODS.has(req.method)) {
      const csrfHeader = req.headers["x-csrf-token"];
      const storedCsrf = await sessionService.getCsrfToken(sessionId);

      if (!csrfHeader || !storedCsrf) {
        res.status(403).json({ error: "Invalid CSRF token" });
        return;
      }

      // Constant-time comparison to prevent timing attacks.
      // Length check first — length alone doesn't leak useful info for random tokens.
      const csrfBuf = Buffer.from(csrfHeader);
      const storedBuf = Buffer.from(storedCsrf);
      if (csrfBuf.length !== storedBuf.length || !timingSafeEqual(csrfBuf, storedBuf)) {
        res.status(403).json({ error: "Invalid CSRF token" });
        return;
      }
    }

    // Touch session to update last activity
    await sessionService.touchSession(sessionId);

    req.session = validSession;
    next();
  };
}

/**
 * Express-style middleware that requires an AAL2 provider session.
 * Must be used after requireAuth — it checks that requireAuth has already
 * run by verifying req.session is set. This ensures CSRF, timeouts, and
 * session touch are always applied before provider authorization.
 *
 * Checks:
 * 1. requireAuth has already run (req.session is set) — 401 if not
 * 2. Session belongs to a provider with AAL2 — 403 if not
 */
export function requireProvider(sessionService: SessionService, store: ITokenStore) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Require that requireAuth has already run
    if (!req.session) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const session = req.session;

    // Check role
    const role = await store.get(`session-role:${session.id}`);
    if (role !== "provider") {
      res.status(403).json({ error: "Provider access required" });
      return;
    }

    // Check AAL level
    if (session.aal !== "AAL2") {
      res.status(403).json({ error: "AAL2 authentication required" });
      return;
    }

    next();
  };
}
