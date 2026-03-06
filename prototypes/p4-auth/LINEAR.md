# P4-auth: linear walkthrough

This document walks through the `@cliver/p4-auth` package file by file, in an order that builds understanding from the ground up. The package implements NIST SP 800-63B-4 compliant authentication for the Cliver screening platform, with two tiers: AAL1 (password-only for customers) and AAL2 (password + TOTP for providers).

---

## Project configuration

### `package.json`

The package is an ESM module (`"type": "module"`) with four runtime dependencies:

- `@cliver/contracts` (linked from `../p0-contracts`)—shared types like `AAL`, `Session`, `ITokenStore`, `UserRole`
- `argon2`—password hashing
- `otpauth`—TOTP generation/verification
- `qrcode`—QR code generation for TOTP enrollment

Tests run on Vitest; TypeScript is configured but `noEmit: true`—the package is consumed as source, not compiled.

### `tsconfig.json`

Targets ES2022 with bundler module resolution and `verbatimModuleSyntax` (forces explicit `import type` for type-only imports). Includes `src/**/*.ts` and a `contract-check.ts` file for validating contract conformance.

### `vitest.config.ts`

Minimal config—enables globals and sets a 15-second test timeout (needed because argon2 hashing is intentionally slow):

```ts
export default defineConfig({
  test: {
    globals: true,
    testTimeout: 15000,
  },
});
```

---

## Foundation layer

### `src/in-memory-token-store.ts`

A `Map`-backed implementation of the `ITokenStore` interface from `@cliver/contracts`. This is the storage primitive everything else depends on—sessions, CSRF tokens, email confirmation codes, and TOTP replay markers all live here.

```ts
export class InMemoryTokenStore implements ITokenStore {
  private store = new Map<string, StoredEntry>();

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt =
      ttlSeconds != null ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }
}
```

TTL expiry is checked lazily on `get`—expired entries are deleted when accessed. In production this would be backed by Redis.

### `src/in-memory-user-store.ts`

An in-memory user database with an email-to-ID index for fast lookups. The `StoredUser` interface captures what the auth layer needs to know about a user:

```ts
export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  totpSecret?: string;
  emailConfirmed?: boolean;
  failedAttempts: number;
  lockedUntil?: string;
}
```

Key fields: `totpSecret` (populated when a provider enrolls in TOTP), `emailConfirmed` (gates login), and `failedAttempts` (rate limiting). The store enforces email uniqueness at creation time.

---

## Password service

### `src/password-service.ts`

Handles password hashing, verification, strength validation, and breached-password checking per NIST SP 800-63B-4 Sec. 3.1.1.2.

**Strength rules** are length-only—no composition rules (no mandatory uppercase/symbols). AAL levels have different minimums:

```ts
const REQUIREMENTS: Record<AAL, PasswordRequirements> = {
  AAL1: { minLength: 15, maxLength: 64, checkBlocklist: true },
  AAL2: { minLength: 8, maxLength: 64, checkBlocklist: true },
};
```

AAL1 requires 15 characters because it's password-only; AAL2 allows 8 because there's a second factor. Length is measured by Unicode code points (using spread `[...password].length`), not UTF-16 code units.

**Hashing** uses argon2id with OWASP-recommended parameters:

```ts
async hash(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456, // ~19 MiB
    timeCost: 2,
    parallelism: 1,
  });
}
```

The salt (16 bytes / 128 bits) is generated automatically by argon2 and encoded in the output hash string. No truncation—the entire password is hashed.

**Blocklist checking** uses the Have I Been Pwned k-anonymity API. Only the first 5 characters of the SHA-1 hash are sent:

```ts
async checkBlocklist(password: string): Promise<BlocklistResult> {
  const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  const response = await this.fetchFn(
    `https://api.pwnedpasswords.com/range/${prefix}`,
    { headers: { "Add-Padding": "true" } },
  );
  // ... match suffix against response lines
}
```

On API failure, the service **fails open** (allows the password) but returns an `error` field. The `fetchFn` is injected via the constructor for testability.

### `src/__tests__/password-service.test.ts`

Tests cover the three concerns: strength validation (length thresholds, Unicode code point counting, no composition rules), hash/verify round-trips (including a truncation check with 72+ character passwords), and blocklist checking with mocked HIBP responses. Notable test:

```ts
it("counts Unicode code points, not UTF-16 code units (#12)", () => {
  const emojiPassword = "😀😁😂🤣😃😄😅😆";
  expect([...emojiPassword].length).toBe(8);
  expect(emojiPassword.length).toBe(16); // UTF-16 would over-count

  const aal2Result = service.validateStrength(emojiPassword, "AAL2");
  expect(aal2Result.valid).toBe(true); // 8 code points meets AAL2 minimum
});
```

---

## Session service

### `src/session-service.ts`

Server-side session management per SP 800-63B-4 Sec. 5.1. Sessions are stored as JSON in the token store, keyed by `session:{id}`.

**Session creation** generates a 256-bit random ID and sets AAL-specific timeouts:

```ts
const AAL1_MAX_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const AAL2_MAX_LIFETIME_MS = 24 * 60 * 60 * 1000;       // 24 hours
const AAL2_INACTIVITY_MS = 60 * 60 * 1000;               // 1 hour
```

Each session gets a paired CSRF token (`csrf:{id}`), also 256 bits, stored with the same TTL.

**Timeout enforcement** has two layers:
1. Overall expiry (checked by `validateSession` and enforced by token store TTL)
2. Inactivity timeout for AAL2 only (`enforceTimeouts` checks `lastActivity`)

```ts
async enforceTimeouts(session: Session): Promise<Session | null> {
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    await this.destroySession(session.id);
    return null;
  }
  if (session.aal === "AAL2") {
    const lastActivity = new Date(session.lastActivity).getTime();
    if (Date.now() - lastActivity > AAL2_INACTIVITY_MS) {
      await this.destroySession(session.id);
      return null;
    }
  }
  return session;
}
```

AAL1 sessions have no inactivity timeout—only the 30-day overall limit.

**`touchSession`** updates `lastActivity` and recomputes the remaining TTL so the store entry doesn't outlive the session's `expiresAt`.

**Cookie options** use the `__Host-` prefix, which browsers enforce as Secure + no Domain + Path=/. Combined with `httpOnly` and `sameSite: "strict"`.

### `src/__tests__/session-service.test.ts`

Tests use `vi.useFakeTimers()` to verify timeout behavior: AAL1 sessions survive 2 hours of inactivity but expire after 31 days; AAL2 sessions expire after 61 minutes of inactivity or 24 hours total even with continuous activity. Also verifies 256-bit entropy (session IDs are at least 16 hex chars) and collision resistance across 100 sessions.

---

## Email transport

### `src/email-transport.ts`

Defines the `IEmailSender` interface and two implementations:

**`ConsoleEmailTransport`**—logs to stdout and accumulates sent emails in a `sentEmails` array. This is the transport used in all tests.

**`SendGridEmailTransport`**—hits the SendGrid v3 API with an injected `fetchFn`:

```ts
async send(message: EmailMessage): Promise<void> {
  const response = await this.fetchFn("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: message.to }] }],
      from: { email: message.from },
      subject: message.subject,
      content: [{ type: "text/plain", value: message.textBody }, ...],
    }),
  });
}
```

The `EmailMessage` type comes from `@cliver/contracts`. Both transports are used by the services that follow.

---

## Customer auth service

### `src/customer-auth-service.ts`

Orchestrates customer authentication at AAL1 (single-factor, password-only). Composes `PasswordService`, `SessionService`, `InMemoryUserStore`, `ITokenStore`, and `IEmailSender`.

**Registration** performs four steps:
1. Validate password strength (min 15 characters for AAL1)
2. Check the HIBP blocklist
3. Hash and store the password
4. Send a 6-digit email confirmation code

The confirmation code is generated with `randomInt(100000, 999999 + 1)` and stored with a 24-hour TTL.

**Email confirmation** uses constant-time comparison to prevent timing attacks on the 6-digit code:

```ts
const codeBuf = Buffer.from(code);
const storedBuf = Buffer.from(storedCode);
if (codeBuf.length !== storedBuf.length || !timingSafeEqual(codeBuf, storedBuf)) {
  // Track failed attempts — invalidate code after 5 failures
  // ...
}
```

After 5 wrong guesses, the code is invalidated entirely—the user must request a new one.

**Login** checks five things in order: user exists, account not locked (< 100 failed attempts), email confirmed, password correct. On success, it resets the failed attempt counter, creates an AAL1 session, and stores the role (`"customer"`) alongside the session in the token store for the middleware to check later.

```ts
await this.tokenStore.set(
  `session-role:${session.id}`,
  "customer",
  sessionTtlSeconds,
);
```

### `src/__tests__/customer-auth-service.test.ts`

End-to-end tests for the full registration-confirmation-login flow. Tests extract the 6-digit code from the `ConsoleEmailTransport`'s captured emails to complete confirmation. Key scenarios: breached password rejection, code expiry after 24 hours, code invalidation after 5 wrong guesses, account lockout after 100 failed logins, and counter reset after successful login.

---

## Provider auth service

### `src/provider-auth-service.ts`

Handles provider authentication at AAL2 (two-factor: password + TOTP). Same dependencies as customer auth except it doesn't need an email sender (providers are pre-enrolled).

**TOTP enrollment** generates a 160-bit secret per RFC 4226, builds a provisioning URI, and renders it as a QR code data URL:

```ts
async enrollTOTP(userId: string): Promise<TOTPEnrollment> {
  const secret = new Secret({ size: 20 }); // 160-bit
  const totp = new TOTP({
    issuer: "Cliver",
    label: user.email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });
  const uri = totp.toString();
  const qrCodeDataUrl = await QRCode.toDataURL(uri);
  await this.userStore.updateUser(userId, { totpSecret: secret.base32 });
  return { secret: secret.base32, uri, qrCodeDataUrl };
}
```

**TOTP verification** allows a window of +/- 1 time step (30 seconds) for clock drift, then enforces **replay protection**:

```ts
const currentTimeStep = Math.floor(Date.now() / 1000 / 30);
const acceptedTimeStep = currentTimeStep + delta;
const replayKey = `totp-used:${userId}:${acceptedTimeStep}`;

const alreadyUsed = await this.tokenStore.get(replayKey);
if (alreadyUsed !== null) return false;

await this.tokenStore.set(replayKey, "1", 90); // 90s TTL covers the full window
```

Each time step can only be used once per user. The 90-second TTL ensures the replay marker outlives the window.

**Login** requires both factors—no fallback to password-only. The order is: check TOTP code provided, look up user, verify email confirmed, check rate limit, verify password (first factor), verify TOTP (second factor). On success, creates an AAL2 session and stores the `"provider"` role.

### `src/__tests__/provider-auth-service.test.ts`

Tests generate real TOTP codes using the enrolled secret to verify the full flow. Covers: enrollment (secret + URI + QR), valid/invalid TOTP codes, login with both factors, rejection when either factor is wrong or missing, email confirmation requirement, session role storage, and replay protection (same code rejected on second use).

---

## Email verification service

### `src/email-verification-service.ts`

This is **not** authentication—it's third-party identity verification. When a customer claims an institutional affiliation, this service sends an email to a contact at the institution asking them to confirm or deny.

**Request flow:**
1. Generate a `verificationId` (128-bit) and a `token` (256-bit)
2. Store a verification record keyed by ID, and a reverse mapping from token to ID
3. Email the token to the institutional contact with confirm/deny links

```ts
await this.emailSender.send({
  to: contactEmail,
  from: "verification@cliver.dev",
  subject: `Email verification request for ${customerName}`,
  textBody: [
    // ...
    `https://cliver.dev/verify?token=${token}&decision=confirmed`,
    `https://cliver.dev/verify?token=${token}&decision=denied`,
    // ...
  ].join("\n"),
});
```

**Response handling** looks up the verification record via the token, rejects double responses (once a decision is made, it can't be changed), and updates the status to `"confirmed"` or `"denied"`. The token mapping is kept alive intentionally so duplicate submissions get "already responded" instead of "token not found".

### `src/__tests__/email-verification-service.test.ts`

Tests the three-phase lifecycle: request (email sent with token), check status (pending → confirmed/denied), and response handling (invalid token rejection, double-response rejection).

---

## Auth middleware

### `src/auth-middleware.ts`

Two Express-style middleware functions that protect routes.

**`requireAuth`**—validates the `__Host-session` cookie, enforces timeouts, checks CSRF for state-changing methods, and touches the session:

```ts
export function requireAuth(sessionService: SessionService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const sessionId = req.cookies?.["__Host-session"];
    if (!sessionId) { res.status(401).json({ error: "Authentication required" }); return; }

    const session = await sessionService.validateSession(sessionId);
    if (!session) { res.status(401).json({ error: "Invalid or expired session" }); return; }

    const validSession = await sessionService.enforceTimeouts(session);
    if (!validSession) { res.status(401).json({ error: "Session timed out" }); return; }

    // CSRF for POST/PUT/PATCH/DELETE
    if (CSRF_METHODS.has(req.method)) {
      const csrfHeader = req.headers["x-csrf-token"];
      const storedCsrf = await sessionService.getCsrfToken(sessionId);
      // ... constant-time comparison with timingSafeEqual
    }

    await sessionService.touchSession(sessionId);
    req.session = validSession;
    next();
  };
}
```

CSRF validation uses `timingSafeEqual` for constant-time comparison. GET requests are exempt.

**`requireProvider`**—must be chained after `requireAuth`. Checks that `req.session` is already set (returns 401 if not, preventing standalone use), then verifies the session role is `"provider"` and the AAL is `"AAL2"`:

```ts
export function requireProvider(sessionService: SessionService, store: ITokenStore) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session) { res.status(401).json({ error: "Authentication required" }); return; }

    const role = await store.get(`session-role:${session.id}`);
    if (role !== "provider") { res.status(403).json({ error: "Provider access required" }); return; }
    if (session.aal !== "AAL2") { res.status(403).json({ error: "AAL2 authentication required" }); return; }

    next();
  };
}
```

### `src/__tests__/auth-middleware.test.ts`

Tests use mock request/response objects. Covers: valid session proceeds, missing/invalid cookie returns 401, CSRF rejection for POST without token, CSRF acceptance with valid token, GET exemption from CSRF, provider middleware with AAL2 session, customer rejection on provider endpoint, and standalone `requireProvider` use returning 401.

---

## Index

### `src/index.ts`

The barrel file. Re-exports everything the consuming application needs:

```ts
export { PasswordService } from "./password-service.js";
export { SessionService } from "./session-service.js";
export { CustomerAuthService } from "./customer-auth-service.js";
export { ProviderAuthService } from "./provider-auth-service.js";
export { EmailVerificationService } from "./email-verification-service.js";
export { requireAuth, requireProvider } from "./auth-middleware.js";
export { ConsoleEmailTransport, SendGridEmailTransport } from "./email-transport.js";
export type { IEmailSender } from "./email-transport.js";
export { InMemoryTokenStore } from "./in-memory-token-store.js";
export { InMemoryUserStore } from "./in-memory-user-store.js";
```

Types (`StrengthResult`, `BlocklistResult`, `IEmailSender`) are exported alongside their implementations. The in-memory stores are exported for testing; production consumers would supply their own `ITokenStore` and user storage.

---

## Dependency graph

```
in-memory-token-store ──► ITokenStore (contract)
in-memory-user-store ──► UserRole (contract)
         │
password-service ──► argon2, HIBP API
         │
session-service ──► ITokenStore
         │
email-transport ──► EmailMessage (contract), SendGrid API
         │
         ├── customer-auth-service ──► PasswordService, SessionService, UserStore, TokenStore, EmailSender
         │
         ├── provider-auth-service ──► PasswordService, SessionService, UserStore, TokenStore, otpauth, qrcode
         │
         ├── email-verification-service ──► TokenStore, EmailSender
         │
         └── auth-middleware ──► SessionService, ITokenStore
```

Everything is wired through constructor injection—no global state, no singletons. The in-memory stores are swappable for Redis/database implementations that satisfy the same interfaces.
