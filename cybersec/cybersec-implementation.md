# Cybersecurity implementation plan for Cliver

Engineering tasks derived from `cybersec-requirements.md`, organized by priority tier. Each task traces to requirements from SP 800-63, SP 800-161, or the OSTP record retention obligation.

See `cybersec-requirements.md` section 0 for important context on the Provider-vs-vendor distinction and how to interpret priorities.

---

## Tier 1: must-have

### TASK-1: Resolve the magic link prohibition

**Requirements:** REQ-63-2

**Problem:** SP 800-63B-4 Sec. 3.1.3.1 explicitly prohibits email for out-of-band authentication. Cliver's email magic link---currently the primary customer authentication mechanism---does not conform to any recognized authenticator type at any AAL.

**Options (choose one):**

1. **Switch customers to password-based authentication.** Simplest path to AAL1. Customers create a password at first order, then log in with email + password for subsequent interactions. This also satisfies AAL1's authenticator requirements directly. Downside: friction for one-time customers.

2. **Reclassify the magic link as a "look-up secret" with a DIRM risk acceptance.** SP 800-63-4 Sec. 3.4.2 allows organizations to tailor assurance levels through a documented Digital Identity Risk Management process. If customer accounts are truly low-risk (no access to screening results, no ability to modify screening decisions), document the risk analysis and accept the residual risk. This requires a formal write-up, not just a code change.

3. **Use email only for account creation/verification, then issue a compliant authenticator.** For example: customer receives an email link to set a password (email is used for identity verification, not authentication). Subsequent sessions use the password. This separates the email step from the authentication step, staying within the standard's exemption.

**Recommendation:** Option 3. It preserves a low-friction onboarding flow while achieving technical compliance. The email link becomes a one-time enrollment step, not a recurring authentication mechanism.

**Affected components:** Customer auth routes, customer login UI, database schema (add password support for customers), email templates.

---

### TASK-2: Provider MFA

**Requirements:** REQ-63-1, REQ-63-5

**Description:** Add multi-factor authentication for provider accounts to achieve AAL2. Providers currently authenticate via email/password or magic link (both single-factor).

**Implementation:**
- Add `provider_mfa` table: `provider_id`, `type` (TOTP | WebAuthn), `secret`/`credential_id`, `created_at`, `last_used_at`.
- **TOTP:** Use `otpauth` npm package. Generate 160-bit secrets, 6-digit codes, 30-second step. This satisfies the "something you have" requirement (the TOTP app/device) combined with the password ("something you know").
- **WebAuthn (phishing-resistant option):** Use `@simplewebauthn/server` + `@simplewebauthn/browser`. SP 800-63B Sec. 2.2.2 requires offering at least one phishing-resistant option---WebAuthn satisfies this.
- Enforce MFA enrollment on first provider login. Block access to screening results until MFA is configured.
- MFA verification step after password, before session creation.

**Affected components:** Provider auth routes, provider login UI, database schema, session creation logic.

---

### TASK-3: Password implementation

**Requirements:** REQ-63-3, REQ-63-4

**Description:** Implement password storage and validation for providers (and customers if option 3 from TASK-1 is chosen).

**Password validation (Sec. 3.1.1.2):**
- Minimum length: 8 characters for providers (since passwords are always used with MFA at AAL2, the 8-character minimum is permissible). If customers use single-factor password (TASK-1 option 1 or 3), minimum 15 characters.
- Max length: at least 64 characters.
- Accept all printing ASCII, space, and Unicode.
- No composition rules. No periodic change requirements.
- Compare against a blocklist: call HaveIBeenPwned k-anonymity API (`GET https://api.pwnedpasswords.com/range/{first5SHA1}`) at registration and password change. Block passwords found in known breaches.
- Allow paste in password fields. Offer show/hide toggle.
- Provide guidance text (e.g., "Use a passphrase of 4+ unrelated words").

**Credential storage (Sec. 3.1.1.2):**
- Use `argon2` npm package (Node.js bindings for the reference C implementation).
- Parameters: Argon2id, memory 64 MiB, time cost 3, parallelism 4.
- Salt: auto-generated per hash by the library (128-bit minimum).
- Additionally (SHOULD, not SHALL): apply HMAC-SHA256 with a server-side pepper (environment variable `PASSWORD_PEPPER`) before hashing. Store the pepper separately from the database (Fly.io secret, not in Neon). **Known deviation:** the standard recommends hardware-protected storage (HSM/TEE/TPM) for this key; Fly.io secrets (environment variables) do not meet that recommendation. Document this as an accepted risk.
- Store the full Argon2id output string in the `password_hash` column.

**Affected components:** Auth routes (registration, login, password change), database schema, UI (password fields with paste/show support, guidance text).

---

### TASK-4: Session management

**Requirements:** REQ-63-6, REQ-63-7

**Description:** Implement server-side session management with proper binding, timeouts, and security attributes.

**Implementation:**
- Use signed, HttpOnly, Secure, SameSite=Strict cookies with `__Host-` prefix.
- Store sessions server-side in a `sessions` table: `id`, `token_hash` (SHA-256 of token), `user_id`, `user_type` (customer/provider), `created_at`, `last_active_at`, `expires_at`, `ip_address`, `user_agent`.
- Generate tokens with `crypto.randomBytes(32)` (256 bits, exceeding the 64-bit minimum).
- Session lifetimes per SP 800-63B:
  - Customer (AAL1): 30-day overall timeout. No mandatory inactivity timeout.
  - Provider (AAL2): 24-hour overall timeout, 1-hour inactivity timeout.
- When provider inactivity timeout fires but overall timeout hasn't expired: allow reauthentication with password only plus the existing session secret (per Sec. 2.2.3). The session secret serves as the second factor, so this remains multi-factor---the 8-character password minimum is preserved.
- Session revocation: logout endpoint erases session; revoke all sessions on password change.
- Regenerate session token after MFA verification (step-up).
- CSRF: SameSite=Strict cookies handle this for browser requests. For API endpoints, verify the session token in the request body or a custom header.
- Cookies SHALL NOT contain cleartext personal information---store only an opaque session ID.

**Affected components:** All authenticated routes (middleware), session management routes, database schema, frontend cookie handling.

---

### TASK-5: Rate limiting

**Requirements:** REQ-63-8

**Description:** Implement authentication rate limiting per SP 800-63B Sec. 3.2.2.

**Implementation:**
- Track consecutive failed authentication attempts per account in the database.
- Limit: 100 consecutive failures (standard's upper bound). After exceeding, lock the authenticator and require account recovery per Sec. 4.1.
- Progressive delays: after 5 failures, add 30-second delay; after 10, 5-minute delay; after 25, 30-minute delay.
- Reset count on successful authentication.
- Additional rate limiting on public endpoints using `express-rate-limit`:
  - Magic link / enrollment email requests: 5/hour per email address
  - Login attempts: 20/minute per IP
  - Form submission: 10/minute per session

**Affected components:** Auth routes, rate limiting middleware, database schema (failed attempt counters).

---

### TASK-6: Data minimization in API calls

**Requirements:** REQ-161-3

**Description:** Audit and restrict what data is sent to each external API.

**Implementation:**
- **OpenRouter:** Review all prompt templates. Remove customer email, full name, and PII not required for the specific check. Document what each check type sends.
- **Tavily:** Audit search queries; ensure they don't include raw customer PII.
- **US Screening List:** Only send entity name being screened.
- **ORCID / Europe PMC:** Only send researcher identifier or name needed for lookup.
- **SecureDNA:** Only sequence data (protocol already minimizes exposure---verify this).
- **SendGrid/SES:** Only recipient email and templated content. No screening results in emails.
- **Salesforce:** Only defined screening result fields, not raw form data beyond what's needed.
- Create a data-flow document listing exactly what fields each API receives.
- **Testing/development:** Use synthetic data, not production PII, in test environments (PM-25).

**Affected components:** All check executor modules, AI prompt templates, Salesforce adapter, email service.

---

### TASK-7: Supplier inventory

**Requirements:** REQ-161-1

**Description:** Create and maintain the supplier inventory required by SP 800-161 SR-13.

**Implementation:**
- Create `/docs/supplier-inventory.md` with a table for each of the 10 suppliers listed in section 3.1 of the requirements doc.
- For each supplier document: unique identifier (e.g., API base URL), description of service, what Cliver systems use it, criticality level, data exchanged, authentication method, security certifications (SOC 2, ISO 27001), SLA, data retention policy, geographic locations, notification/incident contact.
- Update whenever a supplier is added, removed, or materially changes.
- This document also supports Cliver's role as a vendor: Providers assessing Cliver's supply chain will ask about these dependencies.

**Affected components:** Documentation only.

---

### TASK-8: Record retention

**Requirements:** REQ-RET-1, REQ-RET-2

**Description:** Ensure screening records are retained for at least 3 years per OSTP item 5, and that the data model supports capturing decision rationale.

**Implementation:**
- Add a `completed_at` timestamp to screening records if not already present.
- Implement a retention policy: records cannot be deleted or archived before `completed_at + 3 years`.
- If implementing any data cleanup/GDPR-style deletion: screening records are exempt from deletion during the retention period. Document this in the privacy policy.
- For database backups (Neon): ensure backup retention covers at least 3 years, or implement a separate long-term archive (e.g., export completed screenings to cold storage monthly).
- Add a privacy notice informing customers that screening records are retained for 3 years per OSTP requirements (satisfies SP 800-63B Sec. 2.4.2 transparency requirement).
- **Audit trail:** Ensure the data model can capture the rationale for screening decisions and documentation of further actions taken on flagged orders, as required by OSTP item 5. The specifics of what this looks like will be defined in application design.

**Affected components:** Database schema (retention timestamps), data deletion logic, privacy policy, backup configuration.

---

### TASK-9: Multi-tenancy and Provider data isolation

**Requirements:** REQ-MT-1

**Description:** Ensure one Provider cannot access another Provider's data.

**Implementation options** (choose one):
- **Row-level tenancy:** Single database with `provider_id` on all tenant-scoped tables. Enforce via PostgreSQL Row-Level Security (RLS) policies or application-layer middleware. Simplest to implement; relies on correct policy enforcement.
- **Schema-level tenancy:** Separate PostgreSQL schemas per Provider with connection routing. Moderate isolation; schema-level `search_path` prevents accidental cross-access.
- **Database-level tenancy:** Separate Neon databases per Provider. Strongest isolation but highest operational overhead.

**Regardless of approach:**
- Verify isolation in tests: a Provider session must never return another Provider's records.
- Log and control administrative access to cross-Provider data.
- Define data handling for Provider offboarding: export, deletion, or continued retention per OSTP's 3-year requirement. Document in contracts (REQ-161-6).

**Affected components:** Database schema, query layer/middleware, admin access controls, Provider onboarding/offboarding process.

---

### TASK-10: Account notifications

**Requirements:** REQ-63-10

**Description:** Implement account event notifications per SP 800-63B Sec. 4.6.

**Implementation:**
- Support at least two notification addresses per account (e.g., primary email + secondary email or phone).
- Send notifications for: authenticator binding, authenticator removal, account recovery, password change, MFA enrollment/removal.
- Notifications SHALL provide clear instructions including contact information in case the subscriber repudiates the event (e.g., "If you didn't do this, contact us at...").

**Affected components:** Notification system, account settings UI, database schema (notification addresses).

---

### TASK-11: Privacy controls

**Requirements:** REQ-63-11

**Description:** Implement privacy controls required by SP 800-63B Sec. 2.4.

**Implementation:**
- Draft and publish a privacy notice covering: what PII is collected, purposes (identity verification, screening, OSTP compliance), 3-year retention period and its basis, third parties receiving data (list suppliers), subscriber rights.
- Conduct a lightweight privacy risk assessment for session monitoring data (IP addresses, user agents logged in TASK-4).
- Ensure consent for data processing is separate from service access---customers can't be required to consent to non-essential processing as a condition of placing an order.
- Assess unintended privacy consequences of selected assurance levels (SP 800-63-4 Sec. 3.4.1).

**Affected components:** Privacy policy page, consent flow in customer onboarding, documentation.

---

### TASK-12: Breach notification process

**Requirements:** REQ-161-7

**Description:** Define and document how Cliver notifies Providers if Cliver is breached.

**Implementation:**
- Document a breach notification procedure: detection, assessment, notification to affected Providers, follow-up.
- Notifications must include enough detail for Providers to assess impact and meet their own reporting obligations (OSTP: contact FBI Field Office; potentially CIRCIA).
- Include breach notification terms in agreements with Providers.
- Maintain an up-to-date contact list for each Provider's security/compliance point of contact.

**Affected components:** Documentation, Provider onboarding (collect security contact), agreements.

---

## Tier 2: should-have

### TASK-13: Account recovery

**Requirements:** REQ-63-9

**Description:** Implement account recovery flows per SP 800-63B Sec. 4.2.

**Implementation:**
- **Customers (without identity proofing):** Generate and store recovery codes at account creation. Codes must have at least 64 bits of entropy (e.g., a 13-character alphanumeric code, or a 20-digit numeric code). Store as hashed values. Provide a set of codes; each is single-use. Display once at enrollment, instruct user to save them.
- **Providers (AAL2):** Require two recovery methods. Options: (a) saved recovery codes + issued recovery code via email (valid 24 hours), or (b) recovery code + authentication via a bound authenticator (e.g., TOTP device).
- All recovery events trigger a notification to all registered notification addresses (TASK-10).

**Affected components:** Account creation flow, recovery routes, notification system, database schema.

---

### TASK-14: Redress mechanism

**Requirements:** REQ-63-12

**Description:** Provide a mechanism for subscriber complaints about authentication processes. SP 800-63B Sec. 2.4.4 uses SHALL language for this requirement.

**Implementation:**
- Add a "Report a problem" link accessible from login/auth screens.
- Route to a support email or form. Ensure human support is available.
- Document the process and expected response time.
- Periodically assess mechanism efficacy (Sec. 2.4.4).

**Affected components:** Auth UI (add link), support routing, documentation.

---

### TASK-15: Third-party risk register and assessment

**Requirements:** REQ-161-2, REQ-161-6

**Description:** Conduct risk assessments for each supplier and document contractual requirements.

**Implementation:**
- Extend the supplier inventory (TASK-7) into a risk register. For each supplier, assess:
  - Security posture (certifications, public incident history)
  - Data sensitivity of information exchanged
  - Availability impact if the service goes down
  - Market alternatives
  - Foreign ownership, control, or influence
  - Financial stability
- Review contractual terms for each supplier against SP 800-161 Sec. 3.1.2 requirements: incident notification, data handling, termination provisions.
- For critical suppliers (Neon, Fly.io, SecureDNA): verify data processing locations and document acceptable regions.
- Schedule annual reassessment.

**Affected components:** Documentation only.

---

### TASK-16: Continuity/fallback planning

**Requirements:** REQ-161-4

**Description:** Plan for failure or compromise of third-party services.

**Implementation:**
- **Critical (no fallback = Cliver stops):**
  - Neon: Ensure automated backups; document restore procedure. Consider Neon's branching for read replicas.
  - Fly.io: Document redeployment to alternative hosting. Keep Dockerfiles portable.
  - SecureDNA: If unavailable, queue screening requests and surface "screening pending" status to providers. Cannot proceed without screening---this is the compliance-critical path.
- **High (degraded operation):**
  - OpenRouter: Queue AI checks for retry (exponential backoff, max 3 attempts). If all fail, mark as "AI check unavailable." Consider direct Anthropic/Google API as fallback provider.
  - US Screening List: Cache the published CSV locally; fall back to local lookup if API is down.
  - Salesforce: Queue pushes for retry; screening can proceed without CRM sync.
- **Medium/Low (graceful degradation):**
  - Tavily: Fall back to marking web search checks as incomplete.
  - ORCID / Europe PMC: Mark identity/publication checks as incomplete.
  - SendGrid/SES: Queue emails for retry. If both providers are configured, fail over between them.
- Implement circuit breaker pattern using `opossum` npm package for all external API calls.

**Affected components:** All check executor modules, email service, new circuit breaker utility, queue/retry logic.

---

### TASK-17: Supply chain incident response plan

**Requirements:** REQ-161-5

**Description:** Document how to handle incidents originating from or affecting suppliers.

**Implementation:**
- Create `/docs/incident-response-plan.md` covering:
  1. **Classification:** Severity levels (S1: data breach at a supplier holding Cliver data; S2: supplier service compromise affecting screening integrity; S3: supplier outage; S4: supplier vulnerability disclosure).
  2. **Detection sources:** Supplier notifications (SR-8), monitoring dashboards, Cliver application logs, external reports.
  3. **Response per scenario:**
     - Supplier API key compromised: rotate immediately, audit logs for unauthorized use.
     - Supplier data breach: assess what Cliver data was exposed, notify affected Providers (TASK-12).
     - Supplier service compromise: disable integration, switch to fallback (TASK-16), investigate integrity of data received during compromise window.
  4. **Communication:** Contact information for each supplier's security team. Internal escalation path.
  5. **CIRCIA note:** If the incident meets CIRCIA's "covered cyber incident" threshold, affected Providers may need to report to CISA within 72 hours. Cliver's role is to notify Providers promptly so they can assess their own reporting obligations.
  6. **Post-incident:** Coordinate with supplier for root cause analysis. Update risk register. Review and update agreements as needed.

**Affected components:** Documentation. Minor code for credential rotation procedures.

---

## Good practices (not OSTP-required)

These are not separate tasks but practices to adopt during normal development. They overlap with standards assigned to SOC database operators (CSF 2.0, CISA SbD, EO 14028) and are included here for awareness, not compliance.

- **Audit logging:** Log authentication events, screening events, and API call outcomes. 6+ months retention. This naturally emerges from TASK-4 (session management) and TASK-8 (record retention).
- **Dependency scanning:** Run `npm audit` or equivalent in CI. Fix critical/high vulnerabilities promptly.
- **Security headers:** Use `helmet` middleware (HSTS, X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy).
- **Input validation:** Use Drizzle ORM's parameterized queries (prevents SQLi). React's JSX escaping (prevents XSS). Allowlist outbound API destinations (prevents SSRF).
- **Secrets management:** Use Fly.io secrets for all credentials. No hardcoded keys. Add `.env.example` listing required variables.
- **SBOM:** Generate with `@cyclonedx/cyclonedx-npm` in CI for supply chain transparency.
- **Vulnerability disclosure:** Publish `/.well-known/security.txt` (RFC 9116) with contact info.
- **TLS everywhere:** Fly.io handles inbound TLS. Verify `sslmode=require` for Neon. Verify HTTPS for all outbound API calls.

---

## Task-to-requirement traceability

| Requirement | Task(s) |
|-------------|---------|
| REQ-63-1 | TASK-2 |
| REQ-63-2 | TASK-1 |
| REQ-63-3 | TASK-3 |
| REQ-63-4 | TASK-3 |
| REQ-63-5 | TASK-2 |
| REQ-63-6 | TASK-4 |
| REQ-63-7 | TASK-4 |
| REQ-63-8 | TASK-5 |
| REQ-63-9 | TASK-13 |
| REQ-63-10 | TASK-10 |
| REQ-63-11 | TASK-11 |
| REQ-63-12 | TASK-14 |
| REQ-161-1 | TASK-7 |
| REQ-161-2 | TASK-15 |
| REQ-161-3 | TASK-6 |
| REQ-161-4 | TASK-16 |
| REQ-161-5 | TASK-17 |
| REQ-161-6 | TASK-15 |
| REQ-161-7 | TASK-12 |
| REQ-MT-1 | TASK-9 |
| REQ-RET-1 | TASK-8 |
| REQ-RET-2 | TASK-8 |

---

## Implementation order (suggested)

Within Tier 1, recommended sequence:

1. **TASK-1** -- Resolve magic link prohibition (architectural decision needed first)
2. **TASK-3** -- Password implementation (prerequisite for TASK-1 option 3 and TASK-2)
3. **TASK-4** -- Session management (prerequisite for MFA)
4. **TASK-2** -- Provider MFA
5. **TASK-5** -- Rate limiting
6. **TASK-9** -- Multi-tenancy (architectural decision, can parallel with auth work)
7. **TASK-6** -- Data minimization audit
8. **TASK-10** -- Account notifications
9. **TASK-11** -- Privacy controls
10. **TASK-12** -- Breach notification process (documentation)
11. **TASK-7** -- Supplier inventory (documentation, can parallel)
12. **TASK-8** -- Record retention (data architecture, can parallel)

Tier 2 tasks (13--17) can proceed once Tier 1 is complete. TASK-13 (account recovery) and TASK-14 (redress) depend on TASK-10 (notifications).
