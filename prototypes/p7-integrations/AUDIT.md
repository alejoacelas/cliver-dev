# P7 integrations audit

Audited: 2026-03-05
Auditor: adversarial review (Claude)
Scope: all source files in `/Users/alejo/code/cliver/dev/p7-integrations/src/`, `contract-check.ts`, and `EXPLANATION.md`
Reference documents: `prototypes.md` (P7 section), `p0-contracts/src/integrations.ts`, `p0-contracts/src/interfaces.ts`, `design.md` sections 2.3 and 2.5

---

## Findings

### 1. SOQL injection in `findContact` — single-quote escape is insufficient

**Severity: High**
**File:** `/Users/alejo/code/cliver/dev/p7-integrations/src/salesforce-adapter.ts`, line 141

```ts
const query = `SELECT Id FROM Contact WHERE Email = '${email.replace(/'/g, "\\'")}'`;
```

The escape replaces `'` with `\'`. In SOQL, the correct escape for a single quote inside a string literal is `\'` — so the escape character itself is correct. However, the implementation is vulnerable to a **backslash injection**. An attacker can supply an email like:

```
\' OR Name LIKE '%25
```

The `replace` only targets `'`, not `\`. The input `\'` contains a literal single quote which gets replaced to `\\'`, producing `\\'` in the SOQL string—which ends the string literal (the first `\` escapes the second `\`, leaving the `'` unescaped). This allows arbitrary SOQL after the closing quote.

Additionally, no length limit or character-class restriction is applied to the email input before it enters the SOQL query. The `isValidEmail` check is not called here—`findContact` accepts any string.

**Recommendation:** Validate the email with `isValidEmail()` before constructing the SOQL query, AND escape both `\` and `'` (in that order). Better yet, use a parameterized approach if available, or at minimum apply a strict allowlist regex for the email value used in SOQL.

---

### 2. Missing `client_id` and `client_secret` in OAuth token request

**Severity: High**
**File:** `/Users/alejo/code/cliver/dev/p7-integrations/src/salesforce-adapter.ts`, lines 31–41

The `authenticate` method sends only `grant_type` and `refresh_token` to the Salesforce token endpoint. A real Salesforce OAuth 2.0 refresh token exchange requires `client_id` and `client_secret` parameters. Without them, the request will be rejected by Salesforce with an `invalid_client` error.

The `SalesforceCredentials` type from P0 contracts (`integrations.ts`) does not include `clientId` or `clientSecret` fields, which means the P0 contract itself is incomplete for OAuth—but the prototype should either (a) document this gap explicitly, or (b) extend the credentials type with the required fields.

**Recommendation:** Add `clientId` and `clientSecret` to the authenticate request parameters. File an issue against P0 contracts to add these fields to `SalesforceCredentialsSchema`.

---

### 3. "Expired session triggers re-auth automatically" is not implemented

**Severity: Medium**
**File:** `/Users/alejo/code/cliver/dev/p7-integrations/src/salesforce-adapter.ts`, lines 208–213
**File:** `/Users/alejo/code/cliver/dev/p7-integrations/src/salesforce-adapter.test.ts`, lines 350–370

The spec (`prototypes.md`, line 534) says: "Expired session triggers re-auth automatically." The implementation does not do this. When `sfFetch` receives a 401, it throws `SESSION_EXPIRED` and the caller must handle retry manually.

The test named "expired session triggers re-auth and returns new session" (line 351) only tests that `refreshSession()` works as a standalone method call—it does not test automatic retry after a 401 during `pushResult` or `findContact`. The test name is misleading.

**Recommendation:** Either implement automatic 401-retry in `sfFetch` (call `refreshSession`, then retry the original request once), or rename the test and document in EXPLANATION.md that automatic retry is intentionally deferred to the caller.

---

### 4. `SalesforceRecord` type from P0 contracts is imported but unused

**Severity: Medium**
**File:** `/Users/alejo/code/cliver/dev/p7-integrations/contract-check.ts`, line 12
**File:** `/Users/alejo/code/cliver/dev/p7-integrations/src/salesforce-adapter.ts`, lines 114–131

P0 defines a `SalesforceRecord` type with `objectType`, `externalId`, and `fields` properties. The adapter's `pushResult` builds a raw `Record<string, unknown>` and passes `objectType` as a string literal to `createRecord`. It never constructs or uses a `SalesforceRecord` object.

`contract-check.ts` imports `SalesforceRecord` but does nothing with it—there is no assertion that the adapter produces or consumes this type.

The `externalId` field on `SalesforceRecord` (which would enable upsert semantics to avoid duplicate records) is completely unused. The adapter always creates new records. If a push is retried after a transient failure, this could produce duplicate `Screening__c` records in Salesforce.

**Recommendation:** Refactor `pushResult` or `createRecord` to accept/produce a `SalesforceRecord`. Use `externalId` (set to `meta.screeningId`) to enable upsert via the Salesforce composite/sobjects endpoint, preventing duplicates on retry.

---

### 5. SES transport sends secret access key in plaintext HTTP header

**Severity: High**
**File:** `/Users/alejo/code/cliver/dev/p7-integrations/src/ses-transport.ts`, lines 62–64

```ts
"X-Amz-AccessKeyId": this.accessKeyId,
"X-Amz-SecretKey": this.secretAccessKey,
```

The secret access key is sent as a raw HTTP header value. This is not how AWS authentication works—AWS uses Signature Version 4, which derives a signing key and produces an `Authorization` header containing only the signature, never the raw secret key. The EXPLANATION.md acknowledges this is simplified, but:

1. The header name `X-Amz-SecretKey` does not exist in any AWS API.
2. If this code were accidentally pointed at a real SES endpoint (or any intermediate proxy), the secret key would be transmitted in cleartext headers.
3. The test (`ses-transport.test.ts`, line 68) **asserts** that the secret key is present in the header, normalizing this anti-pattern.

**Recommendation:** At minimum, replace the plaintext secret key header with a simulated `Authorization: AWS4-HMAC-SHA256 ...` header. Or use the `@aws-sdk/client-ses` package (or `@smithy/signature-v4`) for real signing. If keeping the stub approach, add prominent code comments and a runtime guard that prevents this transport from being used with a non-localhost `baseUrl`.

---

### 6. Stub server routes silently overwrite each other

**Severity: Medium**
**File:** `/Users/alejo/code/cliver/dev/p7-integrations/src/test-helpers.ts`, line 69
**File:** `/Users/alejo/code/cliver/dev/p7-integrations/src/salesforce-adapter.test.ts`, various

`addRoute` uses a `Map` keyed by `"METHOD /path"`. When multiple tests in the same describe block add routes for the same method+path (e.g., multiple tests register `GET /services/data/v59.0/query`), the last one wins globally. Combined with the fact that `beforeEach` only clears `requests` (line 23) but never clears routes, route handlers from earlier tests leak into later tests.

This means test order matters. If tests run in a different order, or if a new test is added that doesn't re-register a route, it will silently use a stale handler from a previous test. Currently all tests pass because each test re-registers the routes it needs, but this is fragile.

**Recommendation:** Add a `clearRoutes()` method to `StubServer` and call it in `beforeEach` alongside the requests reset.

---

### 7. Spec says `EmailService` implements `IEmailTransport`—it does not

**Severity: Low**
**File:** `prototypes.md`, line 521
**File:** `/Users/alejo/code/cliver/dev/p7-integrations/src/email-service.ts`, line 11

The spec says: "`EmailService` — `send(message: EmailMessage): Promise<{ messageId }>` (implements `IEmailTransport`)". The actual `EmailService` class does not declare `implements IEmailTransport`. While it has a `send` method with a compatible signature, this is a structural match, not an explicit contract. More importantly, `EmailService.send()` only validates the `to` field (not `from`), so it's not a drop-in replacement for `IEmailTransport` implementations that validate both.

**Recommendation:** Either add `implements IEmailTransport` to `EmailService` and ensure `send()` validates both `to` and `from`, or update the spec to clarify that `EmailService` is not an `IEmailTransport` but rather a higher-level service that delegates to one.

---

### 8. Email service `send()` validates `to` but not `from`

**Severity: Medium**
**File:** `/Users/alejo/code/cliver/dev/p7-integrations/src/email-service.ts`, lines 21–26

`EmailService.send()` calls `isValidEmail(message.to)` but does not validate `message.from`. In contrast, both `SendGridTransport.send()` and `SESTransport.send()` validate both `to` and `from`. If a caller constructs an `EmailMessage` with an invalid `from` address and passes it to `EmailService.send()`, the invalid `from` will only be caught by the transport layer—the error message will say "Invalid sender email" rather than being caught at the service layer.

This inconsistency means the pre-validation promise ("Pre-validates email format before sending" per the spec) is only half-fulfilled at the service level.

**Recommendation:** Add `isValidEmail(message.from)` validation to `EmailService.send()`.

---

### 9. HTML injection in email composition methods

**Severity: Medium**
**File:** `/Users/alejo/code/cliver/dev/p7-integrations/src/email-service.ts`, lines 41, 72–76

`sendConfirmationCode` interpolates the `code` parameter directly into HTML:
```ts
htmlBody: `<p>Your confirmation code is: <strong>${code}</strong></p>...`
```

`sendVerificationRequest` interpolates `customerName`, `institution`, `confirmUrl`, and `denyUrl` directly into HTML:
```ts
`<p>We are conducting a background screening for <strong>${customerName}</strong>...`
`<a href="${confirmUrl}">Confirm</a>`
```

None of these values are HTML-escaped. If `customerName` contains `<script>alert(1)</script>`, it goes straight into the HTML body. If `confirmUrl` contains `" onclick="...`, it breaks out of the href attribute.

While email clients typically sanitize scripts, HTML injection can still be used for phishing (e.g., injecting a fake login form into the email body) or breaking email layout.

**Recommendation:** HTML-escape all interpolated values in `htmlBody` strings. For URLs in `href` attributes, also validate that they start with `https://`.

---

### 10. Tests do not verify SOQL query content in `findContact`

**Severity: Medium**
**File:** `/Users/alejo/code/cliver/dev/p7-integrations/src/salesforce-adapter.test.ts`, lines 243–269

The `findContact` tests register a route for `GET /services/data/v59.0/query` that returns canned results, but never inspect the query string parameter (`q=...`) to verify the SOQL query is well-formed or contains the expected email address. The stub server strips query params for routing (matching on `pathname` only), and the route handler ignores the `req` argument.

This means:
- A broken SOQL template would not be caught by tests.
- The SOQL injection vulnerability (finding 1) is untested.
- Encoding issues in `encodeURIComponent` would not be detected.

**Recommendation:** Have the test route handler parse `req.url`, extract the `q` parameter, and assert it matches the expected SOQL query. Add a dedicated test for SOQL-injection-resistant behavior with malicious email input.

---

### 11. `pushResult` signature differs from spec

**Severity: Low**
**File:** `prototypes.md`, line 520
**File:** `/Users/alejo/code/cliver/dev/p7-integrations/src/salesforce-adapter.ts`, lines 101–105

The spec says `pushResult(session, screeningResult)` (two arguments). The implementation takes three arguments: `pushResult(session, decision, meta)`. This means callers must construct and pass a separate `ScreeningResultMeta` object rather than a unified screening result.

This is arguably a better API design, but it's a deviation from the spec.

**Recommendation:** Document the deviation, or update the spec if this signature is preferred.

---

### 12. `createRecord` does not check response status before parsing JSON

**Severity: Low**
**File:** `/Users/alejo/code/cliver/dev/p7-integrations/src/salesforce-adapter.ts`, lines 156–184

`createRecord` calls `sfFetch` which already checks for 400, 401, 429, and generic non-ok responses. For a 201 (success), it then checks `data.success` in the JSON body. However, Salesforce returns `HTTP 201` with `{ "success": true }` on success, and `HTTP 400` with error details on field validation failure. Since `sfFetch` already catches 400, the `!data.success` check at line 175 would only trigger on an unusual case where Salesforce returns `HTTP 200/201` but `success: false`—which is not a documented Salesforce behavior.

This is not a bug, but the `!data.success` branch is effectively dead code that cannot be reached through normal Salesforce API behavior. The error path for field validation is handled in `sfFetch` (line 224–231), not here.

**Recommendation:** Either remove the dead `!data.success` check, or add a test that exercises it to confirm the behavior.

---

### 13. Design doc says "creates or updates" but adapter only creates

**Severity: Medium**
**File:** `design.md`, line 90
**File:** `/Users/alejo/code/cliver/dev/p7-integrations/src/salesforce-adapter.ts`, line 161

Design doc section 2.5 says: "the app creates or updates a record in Salesforce." The adapter only supports `POST` to create new records via `createRecord`. There is no `PATCH`/update path, and no upsert capability using `externalId`.

This means if a screening result needs to be updated (e.g., after an appeal or correction), there is no mechanism to update the existing Salesforce record—only create a new one.

**Recommendation:** Add an `updateRecord` or upsert method, or document this as a known limitation.

---

### 14. `SalesforceSession` is a local type, not from P0 contracts

**Severity: Low**
**File:** `/Users/alejo/code/cliver/dev/p7-integrations/src/types.ts`, lines 36–42

P7 defines its own `SalesforceSession` type locally. P0 contracts define `SalesforceCredentials` (which has `instanceUrl`, `accessToken`, `refreshToken`) but no session type. `SalesforceSession` adds `issuedAt` beyond what `SalesforceCredentials` provides. This is reasonable, but the contract-check file doesn't verify that `SalesforceSession` is a proper superset of `SalesforceCredentials`—it only checks that `authenticate` accepts `SalesforceCredentials` and returns `SalesforceSession`.

**Recommendation:** Either add `SalesforceSession` to P0 contracts, or add a type assertion in contract-check that `SalesforceSession extends SalesforceCredentials` (it doesn't currently, since `SalesforceSession` has `issuedAt` which `SalesforceCredentials` lacks, but `SalesforceCredentials` has all fields of `SalesforceSession` minus `issuedAt`—the relationship is that `SalesforceSession` is a superset).

---

### 15. `refreshSession` passes `accessToken` from the old session as credentials

**Severity: Low**
**File:** `/Users/alejo/code/cliver/dev/p7-integrations/src/salesforce-adapter.ts`, lines 76–82

`refreshSession` calls `this.authenticate({ instanceUrl, accessToken, refreshToken })` where `accessToken` is the old (expired) token. This value is included in the `SalesforceCredentials` object but is never used by `authenticate`—it only sends `grant_type` and `refresh_token` to the OAuth endpoint. The stale `accessToken` is noise.

Not a bug, but it's confusing. The `SalesforceCredentials` type requires `accessToken` even though it's not needed for refresh.

**Recommendation:** Consider whether `authenticate` should accept a narrower type for the refresh flow, or document that `accessToken` is ignored during refresh.

---

## Summary table

| # | Finding | Severity | File(s) |
|---|---------|----------|---------|
| 1 | SOQL injection via backslash bypass in `findContact` | High | `salesforce-adapter.ts:141` |
| 2 | Missing `client_id`/`client_secret` in OAuth token request | High | `salesforce-adapter.ts:31-41` |
| 3 | Automatic re-auth on 401 not implemented (spec mismatch) | Medium | `salesforce-adapter.ts:208-213` |
| 4 | `SalesforceRecord` from P0 imported but unused; no upsert | Medium | `contract-check.ts:12`, `salesforce-adapter.ts` |
| 5 | SES transport sends secret key in plaintext header | High | `ses-transport.ts:62-64` |
| 6 | Stub server routes leak between tests | Medium | `test-helpers.ts:69` |
| 7 | `EmailService` does not explicitly implement `IEmailTransport` (spec says it does) | Low | `email-service.ts:11` |
| 8 | `EmailService.send()` validates `to` but not `from` | Medium | `email-service.ts:21-26` |
| 9 | HTML injection in email composition methods | Medium | `email-service.ts:41, 72-76` |
| 10 | Tests don't verify SOQL query content | Medium | `salesforce-adapter.test.ts:243-269` |
| 11 | `pushResult` signature differs from spec (3 args vs 2) | Low | `salesforce-adapter.ts:101-105` |
| 12 | Dead `!data.success` branch in `createRecord` | Low | `salesforce-adapter.ts:175` |
| 13 | Design doc says "creates or updates" but only create is implemented | Medium | `salesforce-adapter.ts:161` |
| 14 | `SalesforceSession` not in P0 contracts | Low | `types.ts:36-42` |
| 15 | `refreshSession` passes stale `accessToken` as credential noise | Low | `salesforce-adapter.ts:76-82` |

**Totals:** 3 High, 6 Medium, 6 Low
