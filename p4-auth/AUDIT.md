# P4 auth + sessions audit

Adversarial security and compliance audit of the P4 auth prototype.

**Scope:** All source files in `/Users/alejo/code/cliver/dev/p4-auth/src/`, the contract-check file, and all test files.

**Reference documents:**
- NIST SP 800-63B-4 (via `cybersec-requirements.md` sections 2.2--2.9)
- P0 contracts (`auth.ts`, `interfaces.ts`)
- Design doc sections 2.1 and 2.6
- Prototype spec (P4 section of `prototypes.md`)

---

## Findings

### 1. TOTP codes are not replay-protected

**Severity:** High

**Files:** `/Users/alejo/code/cliver/dev/p4-auth/src/provider-auth-service.ts`, lines 77--92

**Description:** The `verifyTOTP` method uses `otpauth`'s `validate()` with `window: 1`, which accepts a code within +/-1 time step. However, there is no mechanism to track which TOTP codes have already been used. An attacker who intercepts a valid TOTP code can replay it within the validity window (up to 90 seconds: current period + one step before + one step after).

SP 800-63B-4 Sec. 2.2.2 requires that at least one authenticator be replay-resistant. TOTP is inherently somewhat replay-resistant because codes expire, but within the window of acceptance, a captured code can be reused. The spec's intent is that each code should be usable at most once.

**Recommendation:** Store the last-used TOTP timestamp (or code) per user in the token store. Reject any code whose time step is <= the last accepted time step. This is a common pattern: `if (delta !== null && (lastUsedStep === undefined || currentStep > lastUsedStep))`.

---

### 2. CSRF token comparison is vulnerable to timing attacks

**Severity:** High

**Files:** `/Users/alejo/code/cliver/dev/p4-auth/src/auth-middleware.ts`, line 58

**Description:** The CSRF token comparison uses JavaScript's `!==` operator:
```typescript
if (!csrfHeader || csrfHeader !== storedCsrf) {
```
String equality in JavaScript is not constant-time. An attacker can measure response time differences to deduce the CSRF token byte-by-byte. The CSRF token is 256 bits (64 hex chars), so this is a practical attack vector given enough requests.

**Recommendation:** Use `crypto.timingSafeEqual(Buffer.from(csrfHeader), Buffer.from(storedCsrf))` for the comparison. Guard the length check first to avoid the `timingSafeEqual` requirement that buffers be equal length.

---

### 3. Confirmation code comparison is vulnerable to timing attacks

**Severity:** Medium

**Files:** `/Users/alejo/code/cliver/dev/p4-auth/src/customer-auth-service.ts`, line 104

**Description:** The email confirmation code comparison uses `!==`:
```typescript
if (storedCode !== code) {
```
The confirmation code is only 6 digits (roughly 20 bits of entropy), which is already low. A timing side-channel on the comparison further reduces the effective entropy, potentially allowing an attacker to brute-force the code more efficiently. The 6-digit code space (1,000,000 values) combined with no rate limiting on confirmation attempts makes this particularly concerning (see finding 4).

**Recommendation:** Use `crypto.timingSafeEqual` for the comparison. Also implement rate limiting on confirmation attempts (see finding 4).

---

### 4. No rate limiting on email confirmation code attempts

**Severity:** High

**Files:** `/Users/alejo/code/cliver/dev/p4-auth/src/customer-auth-service.ts`, lines 95--120

**Description:** The `confirmEmail` method has no rate limiting. An attacker who knows a registered email address can brute-force the 6-digit confirmation code. With 1,000,000 possible values and no throttling, this is computationally trivial---even over a network, modern tooling can attempt thousands of requests per second.

SP 800-63B-4 Sec. 3.1.3.2 (applicable to secrets under 64 bits) states: "If the authentication secret has less than 64 bits of entropy, the verifier SHALL implement rate limiting."

**Recommendation:** Track failed confirmation attempts per email. After a threshold (e.g., 5--10 attempts), either lock the confirmation flow or introduce progressive delays. Alternatively, invalidate the code after N failed attempts and require a new one.

---

### 5. Confirmation code is not invalidated after successful use---race condition

**Severity:** Low

**Files:** `/Users/alejo/code/cliver/dev/p4-auth/src/customer-auth-service.ts`, lines 95--120

**Description:** The `confirmEmail` method reads the stored code, compares it, marks the user as confirmed, and then deletes the code---in separate, non-atomic steps. Between the comparison (line 104) and the deletion (line 117), a concurrent request with the same code could also pass the comparison. This is a TOCTOU (time-of-check-time-of-use) race. In this specific case, the impact is low because confirming an already-confirmed email is idempotent, but the pattern is fragile.

**Recommendation:** Delete the code before marking the user as confirmed. If the delete operation returns a "not found" (i.e., another request already consumed it), reject the second attempt.

---

### 6. `requireProvider` does not enforce CSRF or timeouts

**Severity:** High

**Files:** `/Users/alejo/code/cliver/dev/p4-auth/src/auth-middleware.ts`, lines 80--111

**Description:** The `requireProvider` middleware validates the session and checks the role/AAL, but it does not:
1. Enforce AAL2 inactivity/overall timeouts via `enforceTimeouts()`
2. Validate the CSRF token for state-changing requests
3. Touch the session to update `lastActivity`

The comment on line 74 says "Must be used after requireAuth, or standalone," but if used standalone (as the code supports), all of these protections are bypassed. Provider endpoints are the most sensitive endpoints in the system---they access screening results and compliance decisions.

**Recommendation:** Either (a) enforce that `requireProvider` is always used after `requireAuth` (by checking `req.session` at the start), or (b) replicate the timeout enforcement, CSRF check, and session touch in `requireProvider`. Option (a) is cleaner.

---

### 7. Provider login does not check `emailConfirmed`

**Severity:** Medium

**Files:** `/Users/alejo/code/cliver/dev/p4-auth/src/provider-auth-service.ts`, lines 98--159

**Description:** The `ProviderAuthService.login` method does not check whether the provider's email has been confirmed before allowing login. The `CustomerAuthService.login` method (line 143) checks `user.emailConfirmed`, but the provider flow skips this. A provider could authenticate with an unverified email address.

While providers are presumably set up through a different onboarding flow, the check should still be present for defense in depth. The `InMemoryUserStore` initializes `emailConfirmed` to `false` by default.

**Recommendation:** Add an `emailConfirmed` check to `ProviderAuthService.login`, consistent with the customer flow.

---

### 8. Provider login does not store session role

**Severity:** Medium

**Files:** `/Users/alejo/code/cliver/dev/p4-auth/src/provider-auth-service.ts`, lines 152--158, versus `/Users/alejo/code/cliver/dev/p4-auth/src/customer-auth-service.ts`, lines 164--168

**Description:** After a successful customer login, the role is stored alongside the session:
```typescript
await this.tokenStore.set(`session-role:${session.id}`, "customer");
```
But the provider login does not store the role at all. The `requireProvider` middleware (auth-middleware.ts, line 96) checks `session-role:${sessionId}` for the value `"provider"`. Since the provider login never sets this, `requireProvider` will always reject provider sessions with "Provider access required."

This is a logic bug: provider authentication succeeds but the session is unusable for provider-only endpoints.

**Recommendation:** Add `await this.tokenStore.set(\`session-role:${session.id}\`, "provider")` to the provider login method. The `ProviderAuthService` needs access to the token store (which it currently does not have in its constructor).

---

### 9. `session-role` has no TTL and no cleanup

**Severity:** Medium

**Files:** `/Users/alejo/code/cliver/dev/p4-auth/src/customer-auth-service.ts`, line 167

**Description:** The `session-role:${session.id}` entry is stored without a TTL:
```typescript
await this.tokenStore.set(`session-role:${session.id}`, "customer");
```
When the session is destroyed (`destroySession`), the `session-role:` key is not deleted. This creates orphaned entries in the token store. Over time, this is a memory leak (in the in-memory store) or storage waste (in a production store).

More importantly, the lack of a TTL means role information persists indefinitely even after session expiry, which is inconsistent with the session lifecycle.

**Recommendation:** Pass the session TTL when storing the role. Also delete the role key in `destroySession`.

---

### 10. No account recovery mechanism

**Severity:** High

**Files:** All auth service files

**Description:** SP 800-63B-4 Sec. 4.2 (referenced in cybersec-requirements.md as REQ-63-9) specifies mandatory account recovery requirements:
- **Customers (without identity proofing):** SHALL require a saved recovery code, issued recovery code, or recovery contact.
- **Providers (AAL2):** SHALL require either two recovery codes from different methods, one recovery code plus a single-factor authenticator, or repeated identity proofing.

The prototype has no account recovery flow at all. The EXPLANATION.md acknowledges this: "Account recovery---if a user forgets their password, there is currently no reset flow."

While acceptable for a prototype, this is a SHALL-level NIST requirement and must be addressed before production.

**Recommendation:** Implement at minimum: (a) customer password reset via issued recovery code (email, 24h TTL per Sec. 4.2.1.2), (b) provider recovery via saved recovery codes (64+ bits entropy) generated at enrollment. Document this as a known gap for now.

---

### 11. No phishing-resistant authenticator option for AAL2

**Severity:** Medium

**Files:** `/Users/alejo/code/cliver/dev/p4-auth/src/provider-auth-service.ts`

**Description:** SP 800-63B-4 Sec. 2.2.2 states: "Verifiers SHALL offer at least one phishing-resistant option; SHOULD encourage its use." The prototype only implements TOTP, which is not phishing-resistant (a phishing site can relay TOTP codes in real time).

The EXPLANATION.md acknowledges this: "TOTP was chosen as the initial implementation; passkeys can be added later." The design doc (section 2.6) also calls this out: "at least one phishing-resistant option (e.g., passkeys/WebAuthn) must be offered."

This is a SHALL requirement and is listed as a known omission.

**Recommendation:** Acceptable for a prototype, but track as a required addition. When implementing WebAuthn, ensure it is offered as an alternative second factor alongside TOTP, not as a replacement.

---

### 12. Password length uses `string.length`, not Unicode code point count

**Severity:** Medium

**Files:** `/Users/alejo/code/cliver/dev/p4-auth/src/password-service.ts`, line 43

**Description:** The spec says "each code point = one character" and the test verifies Unicode passwords are accepted. However, `password.length` in JavaScript counts UTF-16 code units, not Unicode code points. For characters outside the Basic Multilingual Plane (emoji, some CJK characters), a single code point may be counted as 2 by `.length`. For example, the emoji `U+1F600` has `.length === 2`.

This means a password of 8 emoji characters would have `.length === 16` and pass the AAL1 15-character check, even though it's only 8 code points. Conversely, a user who enters 15 characters including supplementary plane characters might find their password rejected.

SP 800-63B-4 Sec. 3.1.1.2 says verifiers SHOULD accept Unicode and count each code point as one character.

**Recommendation:** Use `[...password].length` or `Array.from(password).length` to count code points instead of UTF-16 code units.

---

### 13. Blocklist check fails open

**Severity:** Medium

**Files:** `/Users/alejo/code/cliver/dev/p4-auth/src/password-service.ts`, lines 92--132

**Description:** When the HIBP API is unreachable or returns an error, `checkBlocklist` returns `{ breached: false }`, allowing the password to be used. This is a deliberate design choice (documented in the code), but it means a network outage or DNS manipulation could bypass the blocklist entirely.

SP 800-63B-4 Sec. 3.1.1.2 uses SHALL language for blocklist checking. Failing open means the SHALL requirement is not met during API outages.

**Recommendation:** Consider a hybrid approach: fail open for transient errors but require the check to have succeeded at least once within a recent window. Alternatively, cache a subset of the most common breached passwords locally (e.g., the top 100,000) as a fallback. At minimum, log the failure prominently so it can be monitored.

---

### 14. Progressive delays not implemented in rate limiting

**Severity:** Medium

**Files:** `/Users/alejo/code/cliver/dev/p4-auth/src/customer-auth-service.ts`, lines 128--170; `/Users/alejo/code/cliver/dev/p4-auth/src/provider-auth-service.ts`, lines 98--159

**Description:** The prototype spec (prototypes.md, line 374) lists "Progressive delays on repeated failures" as a key test scenario. SP 800-63B-4 Sec. 3.2.2 suggests "progressive delays (30s up to 1 hour)" as an additional technique.

The implementation only checks a hard cutoff at 100 failed attempts. There are no progressive delays (e.g., increasing wait times after 5, 10, 20 failures). This means an attacker can make 100 rapid-fire attempts before being locked out.

**Recommendation:** Add progressive delays: after N failed attempts (e.g., 5), introduce increasing delays before responding. The `InMemoryUserStore` already has a `lockedUntil` field that is never used---repurpose it for progressive lockout.

---

### 15. `lockedUntil` field is defined but never used

**Severity:** Low

**Files:** `/Users/alejo/code/cliver/dev/p4-auth/src/in-memory-user-store.ts`, line 12

**Description:** The `StoredUser` interface defines `lockedUntil?: string` but it is never set or checked anywhere in the codebase. After 100 failed attempts, the account is permanently locked (only resettable by directly modifying the user record). There is no time-based unlock, no admin unlock flow, and no "rebinding" process as specified by SP 800-63B-4 Sec. 3.2.2 ("require rebinding per Sec. 4.1").

**Recommendation:** Either implement time-based unlock using `lockedUntil`, or document the admin rebinding flow. Remove the field if it's not going to be used to avoid confusion.

---

### 16. Verification records have no TTL

**Severity:** Medium

**Files:** `/Users/alejo/code/cliver/dev/p4-auth/src/email-verification-service.ts`, lines 59--66

**Description:** The prototype spec (prototypes.md, line 382) lists "Unactioned verification expires after TTL" as a key test scenario. However, the verification record is stored without a TTL:
```typescript
await this.tokenStore.set(
  `${VERIFICATION_PREFIX}${verificationId}`,
  JSON.stringify(record),
);
```
The token-to-verificationId mapping also has no TTL. A verification request will remain pending forever unless explicitly responded to.

**Recommendation:** Pass a TTL (e.g., 7 days or 30 days, depending on business requirements) to both `tokenStore.set` calls. Add a test for expiry.

---

### 17. Duplicate verification requests are not deduplicated

**Severity:** Low

**Files:** `/Users/alejo/code/cliver/dev/p4-auth/src/email-verification-service.ts`, lines 41--91

**Description:** The prototype spec (prototypes.md, line 383) lists "Duplicate requests for same contact reuse pending verification" as a key test scenario. The implementation does not check for existing pending verifications for the same contact email---each call to `requestVerification` creates a new verification record and sends a new email.

**Recommendation:** Before creating a new verification, check if a pending verification already exists for the same `contactEmail` + `customerName` + `institution` combination. If so, return the existing `verificationId` and optionally resend the email.

---

### 18. No test for provider rate limiting

**Severity:** Low

**Files:** `/Users/alejo/code/cliver/dev/p4-auth/src/__tests__/provider-auth-service.test.ts`

**Description:** The customer auth tests include a thorough rate limiting test (100 failed attempts then lockout, reset on success). The provider auth tests do not test rate limiting at all, even though `ProviderAuthService.login` implements the same 100-attempt logic. The provider flow has more attack surface (two factors to guess) and deserves the same test coverage.

**Recommendation:** Add rate limiting tests to the provider auth test suite, including: lockout after 100 failures, counter increment on wrong password, counter increment on wrong TOTP, and counter reset on success.

---

### 19. User enumeration via registration and confirmation

**Severity:** Medium

**Files:** `/Users/alejo/code/cliver/dev/p4-auth/src/customer-auth-service.ts`, lines 60--63, 100--101

**Description:** The registration endpoint returns a distinct error for duplicate emails ("An account with this email already exists"). The confirmation endpoint returns "Confirmation code has expired or was not found" for unknown emails versus "Invalid confirmation code" for wrong codes. These different responses allow an attacker to enumerate which email addresses are registered.

The login endpoint correctly returns a generic "Invalid email or password" for both unknown users and wrong passwords (line 131, 157), which is good. But the registration and confirmation flows leak the information.

**Recommendation:** For registration: accept the request and "send" the confirmation email even if the account already exists (send a "you already have an account" email instead). For confirmation: return the same generic error regardless of whether the email is unknown or the code is wrong.

---

### 20. `TokenPayload` / JWT contract type is unused

**Severity:** Low

**Files:** `/Users/alejo/code/cliver/dev/p0-contracts/src/auth.ts`, lines 27--42; `/Users/alejo/code/cliver/dev/p4-auth/contract-check.ts`

**Description:** The P0 contracts define a `TokenPayload` schema for JWT-based authentication (with `iat`, `exp`, `email`, `role`, `aal` fields). The contract-check file imports `TokenPayload` but never asserts anything about it. The prototype uses server-side sessions instead of JWTs, which is a better security choice (JWTs are hard to revoke). However, the `TokenPayload` contract exists without a corresponding implementation.

This is not necessarily a problem---the prototype correctly chose server-side sessions over JWTs---but the contract type should either be updated to reflect the session-based approach or documented as intentionally unused.

**Recommendation:** Update the P0 contracts to either remove `TokenPayload` or add a note that the session-based approach replaces it. The `Session` schema in P0 contracts is correctly used.

---

### 21. `ProviderCredentials` contract type is unused

**Severity:** Low

**Files:** `/Users/alejo/code/cliver/dev/p0-contracts/src/auth.ts`, lines 77--85; `/Users/alejo/code/cliver/dev/p4-auth/contract-check.ts`

**Description:** The P0 contracts define `ProviderCredentials` (with `email`, `passwordHash`, `totpSecret`). The contract-check file imports the type but never uses it. The prototype stores provider credentials in the `StoredUser` type in `InMemoryUserStore`, which has the same fields but is not structurally verified against `ProviderCredentials`.

**Recommendation:** Add an assertion in contract-check.ts that `StoredUser` (when role is "provider") satisfies `ProviderCredentials`. Or verify the shapes are compatible at type level.

---

### 22. `IStorageLayer` user methods are not implemented

**Severity:** Low

**Files:** `/Users/alejo/code/cliver/dev/p0-contracts/src/interfaces.ts`, lines 238--245; `/Users/alejo/code/cliver/dev/p4-auth/src/in-memory-user-store.ts`

**Description:** The P0 contracts define user-related methods on `IStorageLayer`: `createUser`, `getUserByEmail`, `updateUser`. The prototype's `InMemoryUserStore` has compatible methods but does not implement the `IStorageLayer` interface (it's a standalone class). This is acceptable for a prototype, but the contract-check file does not verify this compatibility.

Additionally, `InMemoryUserStore.getUserById` is a method that exists in the prototype but not in the `IStorageLayer` interface, which only has `getUserByEmail`.

**Recommendation:** Either verify the compatible subset in contract-check.ts, or note that `IStorageLayer` will be the production implementation and `InMemoryUserStore` is a simplified substitute.

---

### 23. Session does not encode user role

**Severity:** Medium

**Files:** `/Users/alejo/code/cliver/dev/p0-contracts/src/auth.ts` (Session schema); `/Users/alejo/code/cliver/dev/p4-auth/src/session-service.ts`

**Description:** The `Session` contract type contains `id`, `userId`, `aal`, `createdAt`, `expiresAt`, `lastActivity`---but not `role`. The role is stored separately in the token store as `session-role:${sessionId}`. This creates a split-brain problem: the session and its role are independent keys with independent lifecycles (the role key has no TTL and is not cleaned up on session destruction).

The session's AAL already implies a role (`AAL1` = customer, `AAL2` = provider), but the middleware checks both independently. If the role mapping gets out of sync with the session, authorization decisions become unreliable.

**Recommendation:** Either embed the role in the session data itself (extending the Session schema), or ensure the role key has the same TTL and cleanup lifecycle as the session. The former is cleaner and avoids an extra store lookup on every request.

---

### 24. Missing test: verification token expiry

**Severity:** Low

**Files:** `/Users/alejo/code/cliver/dev/p4-auth/src/__tests__/email-verification-service.test.ts`

**Description:** There is no test for verification token/record expiry, which is a listed test scenario in prototypes.md. This is directly related to finding 16 (no TTL on verification records).

**Recommendation:** Add TTL to verification records, then add a test using fake timers to verify that expired verification records are rejected.

---

### 25. No logout test

**Severity:** Low

**Files:** `/Users/alejo/code/cliver/dev/p4-auth/src/__tests__/session-service.test.ts`

**Description:** The session service test verifies that `destroySession` makes a session unvalidatable, which is effectively a logout test. However, there is no integration-level test verifying that:
1. After logout, the session cookie is cleared
2. After logout, subsequent requests with the old session ID are rejected by the middleware
3. The CSRF token is also invalidated on logout

The prototypes.md spec lists "Session destroyed on logout" as a key test scenario.

**Recommendation:** Add middleware-level tests for the full logout flow.

---

### 26. SameSite uses `strict` but spec says `Lax` or `Strict`

**Severity:** Low (informational)

**Files:** `/Users/alejo/code/cliver/dev/p4-auth/src/session-service.ts`, line 160

**Description:** The cookie options specify `sameSite: "strict"`. SP 800-63B-4 Sec. 5.1.1 says cookies SHOULD set `SameSite=Lax` or `SameSite=Strict`. Both are compliant. However, `SameSite=Strict` prevents the cookie from being sent on any cross-site navigation, including top-level GET requests (e.g., clicking a link to Cliver from an email). This may cause UX issues where users clicking email links are not recognized as logged in.

**Recommendation:** Consider whether `Lax` would be more appropriate for the user experience while still providing CSRF protection. `Lax` allows cookies on top-level navigations (GET) but blocks cross-site POST/PUT/DELETE, which is the main CSRF vector. The CSRF token already protects state-changing requests.

---

### 27. No cookie `maxAge` or `expires` set

**Severity:** Low

**Files:** `/Users/alejo/code/cliver/dev/p4-auth/src/session-service.ts`, lines 155--163

**Description:** SP 800-63B-4 Sec. 5.1.1 states cookies "SHOULD expire at or soon after session validity period." The `getSessionCookieOptions` method returns `httpOnly`, `secure`, `sameSite`, `name`, and `path`, but no `maxAge` or `expires`. Without these, the cookie becomes a session cookie (deleted when the browser closes), which is actually more restrictive than necessary and inconsistent with AAL1's 30-day session lifetime.

**Recommendation:** Include `maxAge` in the cookie options, computed from the session's TTL. For AAL1: 30 days. For AAL2: 24 hours. This requires `getSessionCookieOptions` to accept the AAL as a parameter.

---

### 28. Password service does not check context-specific blocklist

**Severity:** Low

**Files:** `/Users/alejo/code/cliver/dev/p4-auth/src/password-service.ts`

**Description:** SP 800-63B-4 Sec. 3.1.1.2 says the blocklist SHALL include "context-specific words, such as the name of the service, the username." The implementation checks HIBP (breached passwords) but does not check whether the password contains the user's email, the service name ("cliver"), or other context-specific terms.

**Recommendation:** Add a context-aware check: reject passwords that contain the user's email local part or the service name. This is a low-effort addition to `validateStrength`.

---

---

## Summary table

| # | Finding | Severity | Category |
|---|---------|----------|----------|
| 1 | TOTP codes not replay-protected | High | Security vulnerability |
| 2 | CSRF token timing attack | High | Security vulnerability |
| 3 | Confirmation code timing attack | Medium | Security vulnerability |
| 4 | No rate limiting on confirmation codes | High | NIST non-compliance |
| 5 | Confirmation code TOCTOU race | Low | Logic error |
| 6 | `requireProvider` skips CSRF/timeouts | High | Security vulnerability |
| 7 | Provider login skips `emailConfirmed` | Medium | Logic error |
| 8 | Provider login does not store session role | Medium | Logic bug (broken flow) |
| 9 | `session-role` has no TTL / cleanup | Medium | Logic error |
| 10 | No account recovery | High | NIST non-compliance (SHALL) |
| 11 | No phishing-resistant authenticator | Medium | NIST non-compliance (SHALL) |
| 12 | Password length counts UTF-16, not code points | Medium | Spec non-compliance |
| 13 | Blocklist fails open on API error | Medium | Security trade-off |
| 14 | No progressive delays in rate limiting | Medium | Spec gap |
| 15 | `lockedUntil` defined but unused | Low | Dead code |
| 16 | Verification records have no TTL | Medium | Spec gap |
| 17 | Duplicate verifications not deduplicated | Low | Missing spec scenario |
| 18 | No provider rate-limiting tests | Low | Test coverage gap |
| 19 | User enumeration via registration | Medium | Security vulnerability |
| 20 | `TokenPayload` contract unused | Low | Contract mismatch |
| 21 | `ProviderCredentials` contract unused | Low | Contract mismatch |
| 22 | `IStorageLayer` user methods not verified | Low | Contract gap |
| 23 | Session does not encode role | Medium | Architectural fragility |
| 24 | Missing verification expiry test | Low | Test coverage gap |
| 25 | No logout integration test | Low | Test coverage gap |
| 26 | `SameSite=Strict` may hurt UX | Low | Design consideration |
| 27 | No cookie `maxAge` set | Low | Spec gap |
| 28 | No context-specific password blocklist | Low | Spec gap |

**High findings:** 5 (findings 1, 2, 4, 6, 10)
**Medium findings:** 11 (findings 3, 7, 8, 9, 11, 12, 13, 14, 16, 19, 23)
**Low findings:** 12 (findings 5, 15, 17, 18, 20, 21, 22, 24, 25, 26, 27, 28)

---

## Overall assessment

The prototype demonstrates solid understanding of NIST SP 800-63B-4 fundamentals: correct AAL assignments, argon2id hashing with proper parameters, 256-bit session tokens, `__Host-` cookies, CSRF protection, and the crucial distinction between email confirmation (permitted) and email authentication (prohibited). The code is well-structured and the test suite covers the main happy and sad paths.

However, there are five high-severity findings that need attention before this moves toward production:

1. **Finding 8 is a show-stopper for the prototype itself**---provider sessions are created but immediately unusable because the role is never stored.
2. **Finding 6 means provider endpoints lack CSRF and timeout protection** when `requireProvider` is used standalone.
3. **Findings 1 and 2 are exploitable security vulnerabilities** (TOTP replay, CSRF timing attack) that undermine the security properties the code is designed to provide.
4. **Finding 4 makes the 6-digit confirmation code brute-forceable**, which combined with finding 3 (timing attack) further weakens the email confirmation flow.

Finding 10 (no account recovery) and finding 11 (no phishing-resistant option) are known omissions acknowledged in the EXPLANATION.md. They are SHALL requirements and must be tracked for production.
