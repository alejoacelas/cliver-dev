# Linear walkthrough: @cliver/p7-integrations

This document walks through the `p7-integrations` package file by file, in a logical reading order. It covers the full codebase—types, email validation, email transports (SendGrid, SES), the email service, the Salesforce adapter, test helpers, tests, and the public API surface.

---

## 1. `package.json` — project identity and dependencies

This is an ESM package (`"type": "module"`) that depends on `@cliver/contracts` (linked from the sibling `p0-contracts` package) and `zod`. Dev tooling is TypeScript + Vitest.

```json
{
  "name": "@cliver/p7-integrations",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "dependencies": {
    "@cliver/contracts": "link:../p0-contracts",
    "zod": "^3.24.0"
  }
}
```

The `contract-check` script is an alias for `tsc --noEmit`—it verifies this package still compiles against the shared contract types without producing output files.

---

## 2. `tsconfig.json` — compiler configuration

Targets ES2022 with bundler module resolution. `verbatimModuleSyntax` is enabled, which forces explicit `import type` for type-only imports—you'll see this pattern throughout the codebase. `noEmit: true` means this package is consumed as source (or bundled externally), not compiled to `dist/` directly.

---

## 3. `vitest.config.ts` — test runner

Minimal config: Node environment, no global test APIs (each test file imports `describe`, `it`, `expect` explicitly from vitest).

---

## 4. `src/types.ts` — local interfaces and typed errors

Defines the package's own interfaces that sit on top of the shared `@cliver/contracts` types. The key distinction called out in comments: P0's `EmailTransport` is a *config* shape, while `IEmailTransport` here is a *behavioral* interface that transports implement.

```ts
export interface IEmailTransport {
  send(message: EmailMessage): Promise<{ messageId: string }>;
}
```

Both transports (SendGrid, SES) implement this single method. The return type is deliberately minimal—just a `messageId` string—so callers don't couple to provider-specific response shapes.

The file also defines metadata for Salesforce integration:

```ts
export interface ScreeningResultMeta {
  screeningId: string;
  customerEmail: string;
  evidenceCount: number;
  checkCount: number;
  timestamp: string;
}

export interface SalesforceSession {
  instanceUrl: string;
  accessToken: string;
  refreshToken: string;
  issuedAt: string;
}
```

And two typed error classes with discriminated `code` fields:

```ts
export type EmailErrorCode = "RATE_LIMIT" | "INVALID_EMAIL" | "NETWORK_ERROR" | "PROVIDER_ERROR";

export class EmailSendError extends Error {
  constructor(
    public readonly code: EmailErrorCode,
    message: string,
    public readonly statusCode?: number,
  ) { ... }
}

export type SalesforceErrorCode =
  | "INVALID_CREDENTIALS" | "SESSION_EXPIRED" | "RATE_LIMIT"
  | "FIELD_VALIDATION" | "NOT_FOUND" | "API_ERROR";

export class SalesforceApiError extends Error {
  constructor(
    public readonly code: SalesforceErrorCode,
    message: string,
    public readonly statusCode?: number,
  ) { ... }
}
```

These typed errors let callers match on `.code` rather than parsing error messages—both email and Salesforce integrations follow the same pattern.

---

## 5. `src/email-validation.ts` — email format pre-check

A small utility used by every module that handles email addresses. Intentionally strict but not RFC 5322 compliant—it catches typos, not edge cases.

```ts
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  if (email.length > 254) return false;
  return EMAIL_REGEX.test(email);
}
```

The 254-character limit matches the RFC 5321 maximum for an email address. Both transports, the email service, and the Salesforce adapter call this before touching any external API—it's the first line of defense.

---

## 6. `src/sendgrid-transport.ts` — SendGrid v3 transport

The first of two `IEmailTransport` implementations. Sends email via `POST https://api.sendgrid.com/v3/mail/send` with Bearer token auth.

The constructor accepts an optional `baseUrl` override—used in tests to point at a stub server instead of the real SendGrid API:

```ts
constructor(apiKey: string, baseUrl?: string) {
  this.apiKey = apiKey;
  this.baseUrl = baseUrl ?? "https://api.sendgrid.com";
}
```

The `send` method validates both `to` and `from` addresses, builds the SendGrid-specific JSON payload, then makes the HTTP call:

```ts
const body = {
  personalizations: [{ to: [{ email: message.to }] }],
  from: { email: message.from },
  subject: message.subject,
  content,
};
```

Error handling maps HTTP status codes to typed error codes: 429 becomes `RATE_LIMIT`, any other non-2xx becomes `PROVIDER_ERROR`, and a failed `fetch` (network down) becomes `NETWORK_ERROR`. On success, the message ID comes from the `X-Message-Id` response header, falling back to a random UUID.

---

## 7. `src/ses-transport.ts` — AWS SES transport

The second `IEmailTransport` implementation. Sends email via the SES Query API (`POST https://email.<region>.amazonaws.com/`) using form-encoded parameters and a simplified AWS Signature Version 4 auth header.

```ts
const params = new URLSearchParams();
params.set("Action", "SendEmail");
params.set("Source", message.from);
params.set("Destination.ToAddresses.member.1", message.to);
params.set("Message.Subject.Data", message.subject);
params.set("Message.Body.Text.Data", message.textBody);
```

The signing is deliberately simplified for prototype purposes:

```ts
const signature = createHmac("sha256", this.secretAccessKey)
  .update(requestBody)
  .digest("hex");
const authHeader = `AWS4-HMAC-SHA256 Credential=${credential}, SignedHeaders=content-type;host, Signature=${signature}`;
```

A comment notes that production should use `@aws-sdk/client-ses` for full SigV4. The secret key is never sent in any header—only a derived HMAC signature.

The response handling parses the message ID out of the XML response body with a regex:

```ts
const match = text.match(/<MessageId>([^<]+)<\/MessageId>/);
const messageId = match?.[1] ?? crypto.randomUUID();
```

The error mapping is identical in structure to SendGrid: 429 → `RATE_LIMIT`, non-ok → `PROVIDER_ERROR`, network failure → `NETWORK_ERROR`. This symmetry is what makes both transports interchangeable behind `IEmailTransport`.

---

## 8. `src/email-service.ts` — high-level email composition

`EmailService` sits above the transports. It takes an `IEmailTransport` and a `defaultFrom` address, then provides domain-specific methods for composing and sending emails.

```ts
export class EmailService {
  constructor(
    private readonly transport: IEmailTransport,
    private readonly defaultFrom: string,
  ) {}
```

Three composition methods build `EmailMessage` objects for specific use cases:

**`sendConfirmationCode(to, code)`** — authentication codes with a 10-minute expiry notice. Generates both plain text and HTML bodies.

**`sendVerificationRequest(to, customerName, institution, confirmUrl, denyUrl)`** — third-party verification emails with confirm/deny links. Enforces `https://` on both URLs to prevent `javascript:` or `data:` injection:

```ts
if (!confirmUrl.startsWith("https://")) {
  throw new EmailSendError("INVALID_EMAIL", `Invalid confirm URL: must start with https://`);
}
```

All user-supplied values interpolated into HTML are escaped through `escapeHtml`:

```ts
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
```

**`sendNotification(to, subject, body)`** — plain text notifications (e.g., "screening complete"). No HTML body.

All three methods delegate to the base `send` method, which validates both addresses before calling `this.transport.send(message)`.

---

## 9. `src/salesforce-adapter.ts` — Salesforce REST API client

Handles OAuth authentication, token refresh, SOQL queries, and record creation against the Salesforce REST API. All HTTP goes through plain `fetch`.

**Authentication** uses the OAuth refresh_token grant:

```ts
async authenticate(credentials: SalesforceCredentials): Promise<SalesforceSession> {
  const params = new URLSearchParams();
  params.set("grant_type", "refresh_token");
  params.set("refresh_token", credentials.refreshToken);
  params.set("client_id", this.oauthClient.clientId);
  params.set("client_secret", this.oauthClient.clientSecret);
  // POST to tokenEndpoint ...
}
```

**`pushResult`** maps a `Decision` (from `@cliver/contracts`) and `ScreeningResultMeta` to Salesforce custom object fields on `Screening__c`:

```ts
const fields: Record<string, unknown> = {
  Status__c: decision.status,
  Flag_Count__c: decision.flagCount,
  Flags__c: decision.reasons.length > 0 ? JSON.stringify(decision.reasons) : null,
  Summary__c: decision.summary,
  Evidence_Count__c: meta.evidenceCount,
  Check_Count__c: meta.checkCount,
  Customer_Email__c: meta.customerEmail,
  Screening_Id__c: meta.screeningId,
  Completed_At__c: meta.timestamp,
};
```

Before creating the record, it tries to find an existing Contact by email and link it via `Contact__c`. The contact lookup fails gracefully—if it errors, the record is created without the link.

**`findContact`** runs a SOQL query with injection protection:

```ts
const safeEmail = email.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
const query = `SELECT Id FROM Contact WHERE Email = '${safeEmail}'`;
```

The `isValidEmail` check runs first, which rejects most injection payloads before they reach the query builder.

**`sfFetch`** is the private HTTP wrapper that adds the `Authorization: Bearer` header and handles Salesforce-specific status codes. The most interesting behavior is automatic re-auth on 401:

```ts
if (response.status === 401) {
  if (retried) {
    throw new SalesforceApiError("SESSION_EXPIRED", "...", 401);
  }
  const newSession = await this.refreshSession(session);
  session.accessToken = newSession.accessToken;
  session.issuedAt = newSession.issuedAt;
  return this.sfFetch(session, url, init, true);
}
```

It refreshes the session and retries the original request exactly once. If the retry also returns 401, it throws `SESSION_EXPIRED`. The session object is mutated in place so callers see the refreshed token.

---

## 10. `src/test-helpers.ts` — stub HTTP server

A lightweight HTTP server factory used by all test files. Routes are registered as `"METHOD /path"` keys and matched against incoming requests.

```ts
export async function createStubServer(): Promise<StubServer> {
  const routes = new Map<string, RouteHandler>();
  const requests: StubServer["requests"] = [];

  const server = createServer((req, res) => {
    // ... collect body, match route, respond
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      // port 0 = OS-assigned ephemeral port
      const addr = server.address() as { port: number };
      resolve({ url: `http://127.0.0.1:${addr.port}`, server, requests, addRoute, clearRoutes, close });
    });
  });
}
```

The `requests` array captures every incoming request (method, path, headers, body) for assertion. `clearRoutes()` is called in `beforeEach` to prevent test leakage. This is how every transport and adapter test avoids hitting real APIs—they point their `baseUrl` at the stub and register route handlers that return canned responses.

---

## 11. Test files

Each source module has a corresponding `.test.ts` file. They all follow the same structure:

- **`email-validation.test.ts`** — unit tests for `isValidEmail`. Covers standard addresses, subdomains, plus addressing, empty strings, missing `@`, missing domain/TLD, spaces, and the 254-character limit.

- **`sendgrid-transport.test.ts`** — starts a stub server, registers a `POST /v3/mail/send` handler, verifies the request format (JSON body, Bearer auth header, content array), and tests error mapping (429 → `RATE_LIMIT`, 500 → `PROVIDER_ERROR`, unreachable → `NETWORK_ERROR`).

- **`ses-transport.test.ts`** — same structure as SendGrid tests but verifies form-encoded request body, AWS4-HMAC-SHA256 auth header, `X-Amz-Date` header, and XML message ID extraction. Explicitly asserts the secret key does not appear in any header.

- **`email-service.test.ts`** — tests the composition methods (`sendConfirmationCode`, `sendVerificationRequest`, `sendNotification`), HTML injection prevention (XSS payloads get escaped, `javascript:` URLs are rejected), and transport equivalence (both SendGrid and SES produce the same `{ messageId }` shape on success and throw `EmailSendError` on failure).

- **`salesforce-adapter.test.ts`** — uses two separate stub servers (one for OAuth, one for the API). Tests authentication, `pushResult` field mapping, contact linking, SOQL query format, SOQL injection rejection, auto re-auth on 401, and error code mapping for 429, 400, and network failures.

---

## 12. `src/index.ts` — public API surface

The barrel file exports everything consumers need—classes, interfaces, error types, and the validation utility:

```ts
export { SalesforceAdapter, type OAuthClientCredentials } from "./salesforce-adapter.js";
export { EmailService } from "./email-service.js";
export { SendGridTransport } from "./sendgrid-transport.js";
export { SESTransport } from "./ses-transport.js";
export { isValidEmail } from "./email-validation.js";

export type {
  IEmailTransport,
  SalesforceSession,
  ScreeningResultMeta,
  EmailErrorCode,
  SalesforceErrorCode,
} from "./types.js";

export { EmailSendError, SalesforceApiError } from "./types.js";
```

Note that `test-helpers.ts` is not exported—it's internal to the test suite.

---

## Architecture summary

The package has two independent integration surfaces:

1. **Email**: `IEmailTransport` defines the behavioral contract. `SendGridTransport` and `SESTransport` are interchangeable implementations. `EmailService` sits on top, composing domain-specific emails and delegating delivery. `isValidEmail` gates every path before any HTTP call.

2. **Salesforce**: `SalesforceAdapter` handles the full lifecycle—OAuth auth, token refresh, contact lookup, and screening result push. `sfFetch` encapsulates auth headers and automatic 401 retry.

Both surfaces use typed error classes (`EmailSendError`, `SalesforceApiError`) with discriminated `code` fields, and both are tested against local HTTP stub servers rather than mocked `fetch` calls.
