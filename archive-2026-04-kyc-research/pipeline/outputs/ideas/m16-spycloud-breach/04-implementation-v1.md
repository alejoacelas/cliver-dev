# m16-spycloud-breach — Implementation v1

- **measure:** M16 (mfa-stepup) — leveraged for forced reset on breach hit
- **name:** SpyCloud / Constella breach-credential check + HIBP Pwned Passwords
- **modes:** A
- **summary:** At each customer login (and on a periodic sweep of all active customers), check the customer's email and current password against (a) SpyCloud or Constella's recaptured-darknet-credential APIs and (b) the HIBP Pwned Passwords k-anonymity API. On any hit, force a password reset and a re-MFA-enrollment before the session is allowed to place SOC orders. Closes the credential-stuffing and infostealer-credential paths that drive the credential-compromise and account-hijack branches.

## external_dependencies

- **SpyCloud Consumer ATO Prevention API** ([spycloud.com/products/spycloud-api/](https://spycloud.com/products/spycloud-api/), [Consumer ATO Prevention product page](https://spycloud.com/products/consumer-ato-prevention/)). REST API; supports lookups by email, username, phone number, IP, or partial password hash.
- **Constella Identity Intelligence API** ([constella.ai/data/intelligence-api/](https://constella.ai/data/intelligence-api/)). REST API; "real-time access to a massive lake of compromised identity data" with claimed >1 trillion records and sub-second latency.
- **HaveIBeenPwned Pwned Passwords API** ([haveibeenpwned.com/api/v3](https://haveibeenpwned.com/api/v3); range endpoint described in [Cloudflare's k-anonymity blog](https://blog.cloudflare.com/validating-leaked-passwords-with-k-anonymity/) and [Troy Hunt's k-anonymity explainer](https://www.troyhunt.com/understanding-have-i-been-pwneds-use-of-sha-1-and-k-anonymity/)). Free, no auth, k-anonymity preserves the password.
- **Internal forced-reset workflow** at the IdP.

## endpoint_details

### SpyCloud
- **Endpoint:** REST API (vendor-gated specific paths). Authentication via API key. Supports lookups by `email`, `username`, `phone`, `ip`, or partial password hash ([SpyCloud Consumer ATO docs](https://spycloud.com/products/consumer-ato-prevention/)).
- **Auth:** API key.
- **Pricing:** [vendor-gated — SpyCloud lists "Contact us for a quote" on the public pricing page ([spycloud.com/pricing/](https://spycloud.com/pricing/)); G2 indicates pricing is tiered by customer-account count ([G2 SpyCloud pricing page](https://www.g2.com/products/spycloud/pricing)). Public reports place enterprise contracts in the low-five-figure to low-six-figure annual range; sales contact required for an actual quote.]
- **Rate limits:** [vendor-gated; SpyCloud advertises "high-volume REST-based APIs" but does not publish specific limits.]
- **ToS:** Permitted use cases include consumer ATO prevention; SpyCloud's customer base explicitly includes financial-services and consumer platforms.

### Constella
- **Endpoint:** Identity Intelligence API ([datasheet](https://constella.ai/intelligence-api-datasheet/)). RESTful with Python/JS/Go SDKs.
- **Auth:** API key. SOC 2 Type II certified per the vendor.
- **Pricing:** [vendor-gated — no public pricing; G2 lists [Constella Intelligence API](https://www.g2.com/products/constella-intelligence-api/reviews) but pricing is sales-contact-only.]
- **ToS:** GDPR / CCPA-compliant; supports SOAR / SIEM / IdP integrations including triggering "password resets, session invalidations, and MFA re-enrollment" downstream.

### HaveIBeenPwned Pwned Passwords (range)
- **Endpoint:** `GET https://api.pwnedpasswords.com/range/{first 5 chars of SHA-1}`. Public, no API key required.
- **Auth:** None.
- **Pricing:** **$0**. Free service with optional Cloudflare-cached responses.
- **Rate limits:** No documented hard limit on the range endpoint; HIBP's other endpoints are rate-limited per the [HIBP API v3 docs](https://haveibeenpwned.com/api/v3).
- **k-anonymity model:** Client SHA-1s the password locally, sends only the first 5 hex chars; server returns ~478 hash suffixes on average ([Troy Hunt — Understanding HIBP k-Anonymity](https://www.troyhunt.com/understanding-have-i-been-pwneds-use-of-sha-1-and-k-anonymity/)). Client checks locally for its own suffix.

## fields_returned

### SpyCloud (per advertised features)
- `email`, `username`, `domain`, `infected_machine_id`, `password` (plaintext when recaptured), `password_hash`, `target_url`, `breach_source`, `severity`, `published_date`, `infostealer_family` [vendor-described in SpyCloud product copy; complete API schema is sales-gated].

### Constella
- `record_id`, `email`, `username`, `password` (plaintext when recovered), `phone`, `ip`, `breach_id`, `breach_name`, `breach_date`, `dataset_type` (combo / infostealer / breach), `verified` flag [vendor-described from datasheet].

### HIBP Pwned Passwords
- A list of `{hash_suffix}:{count}` lines. The count is the number of times the password appeared across all known breaches. No PII whatsoever.

## marginal_cost_per_check

- **HIBP range call:** $0. Negligible compute.
- **SpyCloud per-lookup:** [vendor-gated; best guess: enterprise contracts amortize to roughly $0.001–$0.01 per lookup at typical Consumer ATO volumes. Searched for: "SpyCloud per-query pricing", "SpyCloud Consumer ATO API cost per call".]
- **Constella per-lookup:** [vendor-gated; best guess: comparable to SpyCloud, $0.001–$0.01.]
- **Combined per-customer-per-login check:** [best guess: ~$0.01 amortized.]
- **Setup cost:** Vendor onboarding + API key procurement + integration into login pipeline. [best guess: 1–2 engineer-weeks for HIBP integration alone (trivial); 3–6 engineer-weeks plus 4–8 weeks of vendor procurement for SpyCloud or Constella.]

## manual_review_handoff

SOP on a breach-credential hit:

1. **At login time**, async-call SpyCloud / Constella with the email and a hash of the just-submitted password; in parallel, call HIBP Pwned Passwords with the SHA-1 prefix.
2. **No hit:** session continues normally.
3. **Email-only hit (the email is in a breach but not with this password):** soft warning to the user; encourage password reset; allow login.
4. **Email + password hit (the exact credential is in a known breach or infostealer log):** **block the session immediately**, trigger a forced password reset, force MFA re-enrollment from a fresh device.
5. **Password-only hit (HIBP says this password has been seen >100 times in breaches but with other emails):** allow login, mandate password change at next login.
6. **Reviewer involvement:** every email+password hit is logged to the security review queue. Reviewer cross-references with: (a) other recent activity on the account, (b) the breach source if disclosed by the vendor (was this a third-party breach the customer can't be blamed for, or was it an infostealer infection on their device — the latter implies their machine is compromised). If infostealer, reviewer contacts the customer's institutional security contact, not just the customer.
7. **For periodic sweeps (not just at-login):** weekly batch lookup of every active customer email; on any new hit since the last sweep, force a reset on next login.

## flags_thrown

- `breach_credential_hit` — exact email+password hit. **Action:** block session, force reset, contact institutional security if infostealer source.
- `breach_email_hit` — email-only in breach. **Action:** soft warning, recommend rotation.
- `pwned_password_hit` — HIBP count above threshold. **Action:** mandate change at next login.
- `infostealer_machine_hit` — SpyCloud or Constella attributes the credential to an infostealer log (i.e., the user's device itself is compromised). **Action:** escalate to institutional IT, treat as account-takeover-imminent.

## failure_modes_requiring_review

- **Vendor outage** — SpyCloud or Constella unreachable. Fall back to HIBP only; flag the gap.
- **False matches on email-only** for shared family / shared role accounts.
- **Stale breach data** — credential was breached, customer already rotated, but the breach record has not been updated. Reviewer adjudicates based on the password change timestamp.
- **Privacy / legal** — sending plaintext or hashed customer passwords to a third party may be restricted in some jurisdictions. The HIBP k-anonymity model is privacy-preserving; the SpyCloud / Constella plaintext-comparison model is more sensitive and may require a DPA / customer disclosure.
- **Customer disputes the hit** — reviewer can show the breach source name (sometimes) but cannot show the breach data itself for legal reasons.

## false_positive_qualitative

- **Shared lab passwords** that genuinely got breached on a different account but are still in active use — legitimate, but the breach was real, so this is technically a true positive against a bad practice.
- **Customers using a password manager-generated unique password that happens to collide** with a breached password — vanishingly rare with sufficient entropy, but possible.
- **Customers whose institution suffered a breach** unrelated to anything they did — the credential is real, the customer is innocent, but a forced reset is still the right action.

## record_left

- **Per-check log:** `user_id`, `timestamp`, `vendors_called`, `vendors_responded`, `hit_type`, `breach_source` (if disclosed), `action_taken`. Retained for the longer of the IdP audit retention or the security log retention policy.
- **Forced-reset event** in the IdP audit log.
- **Vendor-side record:** SpyCloud and Constella both retain query logs server-side per their privacy policies [vendor-gated].
- **Cross-link** to the order record if the hit happened during an SOC ordering session, so an investigator can trace "we blocked this order because of this breach hit."

## attacker stories addressed (cross-ref)

- **credential-compromise (infostealer-sourced credentials):** directly addressed when the credential is in a marketplace SpyCloud / Constella ingests. The branch's "infostealer log" cost floor of $5 implies the credential is by definition in such a marketplace.
- **account-hijack Method 3 (infostealer-exfiltrated TOTP seed):** the TOTP seed itself is not in HIBP, but SpyCloud often captures it alongside the credential; vendors increasingly tag these.
- **credential-compromise (AitM phishing relay):** NOT addressed — credentials harvested by Tycoon 2FA and used immediately are not yet in any breach dataset. Cross-references m16-webauthn-yubikey for that.
- **dormant-account-takeover:** weakly addressed — only catches if the dormant account's password is in a breach corpus.
