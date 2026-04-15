# m16-dormancy-reidv — Implementation v1

- **measure:** M16 (mfa-stepup) — leveraged for re-IAL2 step-up on dormant accounts
- **name:** Dormancy re-IDV trigger
- **modes:** A
- **summary:** When a customer account has been dormant > 6 months (no successful login), the next login attempt forces a hard step-up: re-run IAL2 identity verification (selfie + document via the m14 IDV vendor) AND re-bind the authenticator (new WebAuthn enrollment or new TOTP seed). Closes the dormant-account-takeover branch where an institutional IT admin assumes a departed researcher's idle provider account.

## external_dependencies

- **Internal dormancy timer / lifecycle workflow.** Implementable on Okta via Okta Workflows ([Suspend Inactive Users template](https://www.okta.com/resources/webinar-okta-workflows-template-suspend-inactive-users/)) or via the Okta Automations engine that "looks for active users who haven't signed in to Okta for a set number of days" ([Okta Automations docs](https://help.okta.com/en-us/content/topics/automation-hooks/automations-main.htm)). On Auth0, the equivalent is an Action triggered on the post-login flow that checks `last_login` against `now()`.
- **m14 IDV vendor** (Persona, Onfido, or equivalent). Persona's Accounts product explicitly supports "reverification at any trigger point in a user's lifecycle, including during account recovery, before a high-value transaction, during privilege escalation, or on a periodic schedule" ([Persona — What is Reverification](https://withpersona.com/blog/what-is-reverification-and-why-does-it-matter)).
- **Authenticator re-binding** through the existing IdP enrollment flow (WebAuthn registration ceremony or TOTP seed regeneration).

## endpoint_details

- **Architecture:** No single SaaS endpoint. This is a policy + orchestration check implemented inside the provider's IdP.
- **Okta path:** Okta Workflows "Suspend Inactive Users" flow or a custom Automation. Pricing is bundled into Okta Workforce Identity / Customer Identity (CIC/Auth0) tiers; Workflows is included with most enterprise SKUs [vendor-gated — public pricing only on Okta CIC starter tiers; per-feature pricing requires sales contact].
- **Persona reverification API:** `POST /api/v1/inquiries` to start a new inquiry referencing an existing Account ID; reverification flows reuse stored IDs ([Persona Perpetual KYC](https://withpersona.com/blog/perpetual-kyc-ongoing-customer-due-diligence)). Auth model: API key (Bearer token). Pricing: [vendor-gated — Persona does not publish list pricing; commonly cited public range $1–$3 per IDV inquiry, sales contact required for volume tiers].
- **Rate limits:** Persona inquiries are rate-limited per workspace [unknown — searched for: "Persona API rate limits inquiries", "withpersona.com developer rate limit"].
- **NIST anchor for the 6-month threshold:** NIST 800-63B/4 sets reauthentication and inactivity timeouts for AAL2 (12-hour reauthentication, 30-minute inactivity) but does NOT mandate a long-period dormancy re-proofing interval; the 6-month figure is a provider design choice ([NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html)). [best guess: 6 months is a common KYC perpetual-review cadence and is short enough to catch the academic-year personnel turnover that drives the dormant-account-takeover branch.]

## fields_returned

From the dormancy check itself (internal):

- `user_id`
- `last_successful_login_at`
- `days_since_last_login`
- `dormancy_threshold_days` (configured = 180)
- `dormancy_status`: `active | warning | dormant`

From the Persona reverification inquiry on completion:

- `inquiry-id`, `status` (`completed | failed | needs_review`)
- `reference-id` (links to existing Account)
- `name-first`, `name-last`, `birthdate`, `address-*`
- `government-id` document classification + extracted fields
- `selfie` match score against the document portrait
- `selfie` match score against the **previously stored** Account selfie (this is the load-bearing field for catching the dormant-account-takeover branch — it asks "is this the same human as the original holder?") [vendor-described in the [Persona Perpetual KYC](https://withpersona.com/blog/perpetual-kyc-ongoing-customer-due-diligence) post: "allow them to reverify their identity simply by having them take a new selfie and ensuring it matches the one on record"]

## marginal_cost_per_check

- **Per-dormant-account re-IDV event:** approximately **$1.50–$3.00** [best guess: based on commonly cited Persona / Onfido per-inquiry pricing in industry comparisons; vendor-gated for exact contracted rate].
- **Cost across the customer base:** the marginal cost only fires on dormant-then-returning accounts. [best guess: <5% of the customer base in any given 6-month window, so amortized cost is well under $0.20 per active customer per year.]
- **Setup cost:** Engineering time to wire the dormancy timer into the IdP login flow and to plumb the reverification callback. [best guess: 1–3 engineer-weeks for a team that already runs Okta or Auth0.]

## manual_review_handoff

Standard SOP when a returning-from-dormancy login triggers re-IDV:

1. **Block the order session.** No SOC orders may be placed until the re-IDV inquiry resolves.
2. **Customer is shown an in-product modal:** "Welcome back. Because your account has been inactive for more than 6 months, we need to re-verify your identity before processing any sequence orders. This takes about 3 minutes."
3. **Selfie + ID re-capture** through the IDV vendor SDK.
4. **Automatic adjudication** if (a) document passes liveness + tamper checks, (b) name and DOB match the stored Account record, AND (c) the new selfie matches the stored selfie above the vendor's threshold.
5. **Human reviewer involvement** when any of (a)–(c) fails:
   - Reviewer pulls the original onboarding inquiry and the new inquiry side by side.
   - Reviewer compares the two selfies manually for "obviously different person" (the dormant-account-takeover catch).
   - Reviewer checks the institutional directory: does this researcher still have an active appointment? (This is the tightening recommended in the dormant-account-takeover bypass excerpt.)
   - Reviewer either (i) approves and unlocks the account, (ii) requests a live video call, or (iii) terminates the account and contacts the institution.
6. **Authenticator re-bind.** On approval, the user is forced through a WebAuthn re-enrollment ceremony — the old TOTP seed and old passkey are revoked. This catches Bypass A (email-channel MFA recovery) from the dormant-account-takeover attacker mapping.

## flags_thrown

- `dormancy_reidv_required` — account crossed the 180-day threshold; next login forces step-up.
- `dormancy_reidv_selfie_mismatch` — new selfie does not match the stored selfie. **Action:** human review, hold all SOC orders, contact institution.
- `dormancy_reidv_document_fail` — document liveness or tamper check failed. **Action:** human review.
- `dormancy_reidv_name_change` — name on new document differs from stored name (legitimate cause: marriage, legal change). **Action:** reviewer collects supporting documentation.
- `dormancy_reidv_skipped` — user closed the modal without completing. **Action:** account remains locked for ordering.

## failure_modes_requiring_review

- IDV vendor outage during reverification → fall back to a manual reviewer-mediated video call.
- User has legitimately moved institutions and the institutional directory check fails even though the same human is operating the account → reviewer adjudicates with new affiliation evidence.
- Selfie ages out (the stored selfie is years old; the new one shows visible aging) → vendor's selfie-match score drops below threshold even for the legitimate user. [best guess: Persona/Onfido selfie matching is reasonably robust to a few years of aging but degrades at 5+ years; no public benchmark located. Searched for: "Persona selfie match aging accuracy", "Onfido facial similarity score temporal drift".]
- User no longer holds their original ID document (passport expired, license replaced) → match on the document number fails but the human is the same. Reviewer manual override.
- Account legitimately transferred between researchers in the same lab without re-onboarding → this is exactly the case the check is designed to BLOCK, even though it's a "legitimate" institutional behavior.

## false_positive_qualitative

- **Sabbatical / parental leave returnees.** Faculty taking 6–12 month leaves are exactly the population the threshold catches. They are legitimate customers, but the friction is bounded (one selfie + document, ~3 minutes).
- **Seasonal-only labs.** Some teaching labs only order in certain semesters; the September order may be 8+ months after the May order. Friction-cost only.
- **Researchers who legitimately changed institutions** but want to keep using the same provider account. The institutional directory check fails; the human is the same. Reviewer can approve.
- **Users whose appearance has changed substantially** (weight loss, gender transition, age) — legitimate selfie mismatch.

## record_left

- **Dormancy event log row** in the IdP audit trail: `user_id`, `last_login_at`, `dormancy_flagged_at`, `reidv_inquiry_id`, `reidv_outcome`, `reviewer_id` (if escalated).
- **Persona Inquiry record** retained in the IDV vendor (per Persona's data retention; persists per their retention SLA [vendor-gated]).
- **Authenticator change event** in the IdP (old factor revoked, new factor enrolled, with timestamps).
- **Side-by-side selfie comparison artifact** in the manual-review queue if escalated. This is the load-bearing audit artifact for the dormant-account-takeover catch — it lets a later auditor confirm the provider actually checked "same human as original."

## attacker stories addressed (cross-ref)

- **dormant-account-takeover** (the central target): the check directly addresses Bypass A (email-channel MFA recovery) by forcing a fresh selfie+ID match against the stored original holder, and the "passively constrain order profile" / "gradual volume ramp" persistence variants by gating ordering on the new IDV pass.
- **account-hijack** and **credential-compromise**: partially addressed when the hijacked account had been dormant; not addressed for active accounts (m16-order-time-stepup and m16-webauthn-yubikey are the controls there).
