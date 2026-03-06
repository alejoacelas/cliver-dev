import { createMiddleware } from "hono/factory";
import { eq, gte } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { UserRole, AAL } from "@cliver/contracts";
import * as schema from "./schema.js";

/**
 * Session info attached to the Hono context by auth middleware.
 */
export interface AuthContext {
  userId: string;
  email: string;
  role: UserRole;
  aal: AAL;
  sessionId: string;
}

/**
 * Creates auth middleware that checks for a valid session.
 *
 * Looks for session ID in:
 * 1. Authorization: Bearer <sessionId> header
 * 2. session_id cookie
 *
 * Validates the session exists, hasn't expired, and updates lastActivity.
 */
export function createAuthMiddleware(
  db: PostgresJsDatabase<typeof schema>,
  requiredRole?: UserRole,
) {
  return createMiddleware<{ Variables: { auth: AuthContext } }>(
    async (c, next) => {
      // Extract session ID
      const authHeader = c.req.header("Authorization");
      const sessionId = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : undefined;

      if (!sessionId) {
        return c.json({ error: "Authentication required" }, 401);
      }

      // Look up session
      const [session] = await db
        .select()
        .from(schema.authSessions)
        .where(eq(schema.authSessions.id, sessionId));

      if (!session) {
        return c.json({ error: "Invalid session" }, 401);
      }

      // Check expiry
      if (session.expiresAt < new Date()) {
        return c.json({ error: "Session expired" }, 401);
      }

      // Check inactivity timeout for provider (AAL2) sessions
      const ONE_HOUR_MS = 60 * 60 * 1000;
      if (
        session.role === "provider" &&
        Date.now() - session.lastActivity.getTime() > ONE_HOUR_MS
      ) {
        return c.json({ error: "Session inactive" }, 401);
      }

      // Check role if required
      if (requiredRole && session.role !== requiredRole) {
        return c.json({ error: "Insufficient permissions" }, 403);
      }

      // Update last activity
      await db
        .update(schema.authSessions)
        .set({ lastActivity: new Date() })
        .where(eq(schema.authSessions.id, sessionId));

      // Attach auth context
      c.set("auth", {
        userId: session.userId,
        email: session.email,
        role: session.role as UserRole,
        aal: session.aal as AAL,
        sessionId: session.id,
      });

      await next();
    },
  );
}
