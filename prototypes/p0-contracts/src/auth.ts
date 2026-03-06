import { z } from "zod";

// --- AAL (Authenticator Assurance Level) ---

/**
 * NIST SP 800-63B-4 Authenticator Assurance Levels.
 *
 * - AAL1: Single-factor authentication (email + password). Used by customers.
 * - AAL2: Multi-factor authentication (password + TOTP or passkey). Used by providers.
 */
export const AALSchema = z.enum(["AAL1", "AAL2"]);

export type AAL = z.infer<typeof AALSchema>;

// --- UserRole ---

export const UserRoleSchema = z.enum(["customer", "provider"]);

export type UserRole = z.infer<typeof UserRoleSchema>;

// --- TokenPayload ---

/**
 * The payload embedded in a JWT (JSON Web Token) after authentication.
 * Used for stateless authorization checks on each request.
 */
export const TokenPayloadSchema = z.object({
  /** Unique user identifier. */
  userId: z.string(),
  /** The user's email address. */
  email: z.string(),
  /** The user's role in the system. */
  role: UserRoleSchema,
  /** The assurance level achieved during authentication. */
  aal: AALSchema,
  /** Issued-at timestamp (Unix epoch seconds). */
  iat: z.number(),
  /** Expiration timestamp (Unix epoch seconds). */
  exp: z.number(),
});

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;

// --- Session ---

/**
 * A server-side session record. Tracks user activity for
 * enforcing inactivity timeouts and overall session limits.
 *
 * Per NIST SP 800-63B-4:
 * - AAL1: 30-day overall timeout. Inactivity timeout is optional.
 * - AAL2: 1-hour inactivity timeout, 24-hour overall timeout.
 */
export const SessionSchema = z.object({
  /** Unique session identifier. */
  id: z.string(),
  /** The authenticated user. */
  userId: z.string(),
  /** The assurance level for this session. */
  aal: AALSchema,
  /** ISO 8601 timestamp when the session was created. */
  createdAt: z.string(),
  /** ISO 8601 timestamp when the session expires (overall timeout). */
  expiresAt: z.string(),
  /** ISO 8601 timestamp of the user's last activity (for inactivity timeout). */
  lastActivity: z.string(),
});

export type Session = z.infer<typeof SessionSchema>;

// --- ProviderCredentials ---

/**
 * Stored credentials for a provider user. The password is stored
 * as an Argon2id hash. The TOTP secret is used for the second factor.
 */
export const ProviderCredentialsSchema = z.object({
  email: z.string(),
  /** Argon2id password hash. */
  passwordHash: z.string(),
  /** Base32-encoded TOTP secret for the second authentication factor. */
  totpSecret: z.string(),
});

export type ProviderCredentials = z.infer<typeof ProviderCredentialsSchema>;

// --- PasswordRequirements ---

/**
 * Password policy configuration per NIST SP 800-63B-4 Sec. 3.1.1.2.
 *
 * - Minimum 15 characters for single-factor (AAL1).
 * - No composition rules (no mandatory uppercase/symbols/etc.).
 * - Must check against a blocklist of breached/common passwords.
 */
export const PasswordRequirementsSchema = z.object({
  /** Minimum password length. */
  minLength: z.number().int().min(1),
  /** Maximum password length. */
  maxLength: z.number().int().min(1),
  /** Whether to check the password against a breached-password blocklist. */
  checkBlocklist: z.boolean(),
});

export type PasswordRequirements = z.infer<typeof PasswordRequirementsSchema>;
