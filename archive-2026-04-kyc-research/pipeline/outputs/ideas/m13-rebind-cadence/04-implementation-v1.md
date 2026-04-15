# m13-rebind-cadence — Implementation v1

- **measure:** M13 — phone-voip-check (extended: re-verify the binding)
- **name:** Phone re-verification cadence + SIM-swap monitoring
- **modes:** D (defensive — closes the time gap between initial verification and current state)
- **summary:** A one-time phone-on-file check decays — phones get ported, swapped, returned to carriers, and reissued. This idea binds two practices together: (1) re-verify the customer's phone (one-time SMS code or call-press) on a calendar cadence (e.g., every 6–12 months) and on every high-risk event (account-recovery, MFA change, billing-address change, first SOC order). (2) couple every re-verification with a SIM-swap lookup against a carrier-network signal (Telesign PhoneID `sim_swap` attribute, or a CAMARA / GSMA Open Gateway SIM Swap API via Vonage / tru.ID / Glide). A recent SIM swap on a phone the attacker would need to receive a code defeats SMS-OTP; freezing the account until the original holder confirms is the standard mitigation.
- **attacker_stories_addressed:** account-hijack (SIM-swap variant), credential-compromise (breached PII + SIM swap path), sim-swap branch (general). Pre-empts the inbox-compromise branch's reliance on stale phone bindings.

## external_dependencies

- **Telesign PhoneID** with the `sim_swap` identity attribute. [source](https://developer.telesign.com/enterprise/docs/phone-id-identity-attributes-sim-swap)
- **Telesign SMS Verify API** to issue the re-verification one-time code. [source](https://developer.telesign.com/enterprise/docs/sms-verify-api-overview)
- **Alternative providers:**
  - Vonage Verify v2 + SIM Swap API. [source](https://developer.vonage.com/en/blog/improve-your-multifactor-auth-with-verify-and-sim-swap-apis)
  - tru.ID Active SIMCheck. [source](https://idlayr.com/blog/tru-id-launches-active-simcheck-solve-sim-swap/)
  - GSMA Open Gateway / CAMARA SIM Swap API (carrier-direct). [source](https://camaraproject.org/number-verification/)
  - Glide Identity SIM Swap. [source](https://www.glideidentity.com/api/sim-swap)
- Internal: a scheduled job (cron / queue) that runs the cadence; an event hook on high-risk actions; a state field on the customer record (`phone_last_verified_at`, `phone_last_swap_check_at`, `phone_swap_status`).

## endpoint_details

### Telesign PhoneID — SIM swap attribute

- URL: documented at developer.telesign.com (specific call: `GET /v1/phoneid/{phone_number}` with `addons=sim_swap` or via Score API). [source](https://developer.telesign.com/enterprise/docs/phone-id-identity-attributes-sim-swap)
- Auth: Telesign customer ID + API key (Basic).
- Response: a `risk_indicator` value 1–4 (1 = no recent swap, 4 = swap very recently). [source](https://developer.telesign.com/enterprise/docs/phone-id-identity-attributes-sim-swap)
- Pricing: per-query, ~$0.10 starting, ~$0.05 at 100K+/month. The SIM swap add-on is full-service-only and requires a Telesign expert to enable. [source](https://www.dropcowboy.com/blog/understanding-telesign-pricing-for-businesses/) `[best guess: dropcowboy.com is a third-party blog so the exact figures should be re-validated against a Telesign quote]`
- Rate limits: standard Telesign enterprise limits. `[unknown — searched for: "Telesign API rate limit", "Telesign PhoneID throughput"]`
- ToS: Telesign permits use for KYC, fraud, and account-takeover protection.

### Telesign SMS Verify API

- URL: developer.telesign.com SMS Verify endpoint. [source](https://developer.telesign.com/enterprise/docs/sms-verify-api-overview)
- Auth: same.
- Pricing: per-message, varies by destination country. `[best guess: ~$0.01–$0.05 per US SMS at typical Telesign volume tiers]`

### CAMARA SIM Swap (carrier-direct)

- URL: https://camaraproject.org/number-verification/ (project home); endpoint exposed via partner gateways (Vonage, Orange, etc.). [source](https://camaraproject.org/number-verification/) [source](https://developers.opengateway.telefonica.com/docs/numberverification)
- Auth: OAuth via aggregator account.
- Coverage: depends on which carriers the gateway is integrated with. `[best guess: US tier-1 carriers (Verizon, T-Mobile, AT&T) coverage is uneven via Open Gateway as of early 2026; aggregator coverage stronger in EU than US]`
- Pricing: `[unknown — searched for: "CAMARA SIM Swap pricing", "Open Gateway SIM Swap commercial cost"]`

### NIST guidance for cadence

- NIST SP 800-63B describes reauthentication cadences for AAL2/AAL3 sessions but does not prescribe a fixed cadence for phone re-binding for KYC. [source](https://pages.nist.gov/800-63-4/sp800-63b.html) The cadence is left to the organization's written policy. Recommendation here is **6–12 months for routine and on every high-risk event**, consistent with how banking KYC practices treat phone re-confirmation.

## fields_returned

### Telesign PhoneID `sim_swap`

- `risk_indicator` — integer 1–4
- `last_sim_swap_date` (when known)
- `phone_number` echoed
- Plus standard PhoneID fields (line type, carrier, country, location). [source](https://developer.telesign.com/enterprise/docs/phone-id-identity-attributes-sim-swap)

### Telesign SMS Verify

- `reference_id`
- `status.code` (delivery and verification states)
- `verify_code_received` (boolean)

### CAMARA SIM Swap

- `swapped` (boolean) for a specified maxAge window (typical: 240, 720, 2400 hours)
- Underlying carrier signal. [source](https://camaraproject.org/number-verification/)

## marginal_cost_per_check

- Telesign PhoneID + sim_swap: ~$0.10 per query. `[source](https://www.dropcowboy.com/blog/understanding-telesign-pricing-for-businesses/) — third-party, treat as best-guess`
- Telesign SMS verification message: ~$0.02 per US SMS round-trip. `[best guess]`
- Per cadence cycle per customer: ~$0.12.
- Per high-risk event re-verification: same.
- Annualized at 6-month cadence: ~$0.24/customer/year + event-driven costs.
- **setup_cost:** Engineering work to (a) add scheduled-job infrastructure, (b) add event hooks, (c) integrate Telesign or CAMARA, (d) add UI for the customer to receive and confirm the OTP, (e) add the freeze-on-swap workflow. ~2–4 person-weeks of engineering. `[best guess]`

## manual_review_handoff

1. **Cadence trigger:** scheduled job picks up customers whose `phone_last_verified_at` is older than the cadence threshold. System sends an SMS verify request and runs PhoneID `sim_swap` in parallel.
2. **Event trigger:** any of {account-recovery, MFA reset, billing-change, address-change, first SOC order} immediately enqueues the same workflow.
3. **Outcomes:**
   - SMS verified + `risk_indicator ≤ 2` → update `phone_last_verified_at`; release.
   - SMS verified + `risk_indicator ≥ 3` → freeze account; reviewer manually contacts customer via the m13-callback-sop channel and asks the customer to confirm whether they performed a recent SIM swap; if yes and consistent, release with note; if no, treat as suspected account takeover, reset all credentials, alert the customer's institution.
   - SMS not verified within N days → freeze ordering; require fresh phone enrollment or account-recovery flow.
4. **High-risk event combined with `risk_indicator ≥ 3`:** automatic block on the order regardless; senior compliance review.

## flags_thrown

- `rebind_overdue` — cadence elapsed; verification pending.
- `rebind_failed` — SMS code not entered or wrong.
- `sim_swap_recent` (`risk_indicator` 3 or 4)
- `sim_swap_with_high_risk_event` — combined trigger; auto-block.

Standard human action: see SOP above.

## failure_modes_requiring_review

- Telesign coverage gaps for some MVNOs and prepaid lines: `risk_indicator` may be `unavailable`. Mitigation: treat as soft-fail, fall back to callback SOP.
- CAMARA / Open Gateway not yet covering all US tier-1 carriers reliably as of 2026; coverage in EU is stronger. `[best guess]`
- Customer legitimately changed SIM (lost phone, upgraded device) — produces `risk_indicator ≥ 3` for the legitimate user. The reviewer-mediated path is exactly the place to absorb this; do not auto-block.
- Customer roaming internationally — short-term porting may show as a swap.
- Customer has dropped the number entirely — SMS will silently fail. The cadence loop catches this.

## false_positive_qualitative

- Recent device upgrades — common, especially after big iPhone/Pixel launches.
- Customers using eSIM — eSIM provisioning can look like a swap to some carrier signals.
- International researchers who switch SIMs when crossing borders.
- Number-portability events (carrier change) that look swap-like.
- Customers who never verify a code because they've changed their primary contact channel and forgotten their phone is on file.

## record_left

For each cycle: `{customer_id, trigger (cadence | event_<name>), sms_verify_status, sms_reference_id, sim_swap_risk_indicator, sim_swap_last_swap_date, action_taken, reviewer_id (if escalated), checked_at}`. Auditable.

## sources

- [Telesign PhoneID — sim_swap attribute](https://developer.telesign.com/enterprise/docs/phone-id-identity-attributes-sim-swap)
- [Telesign SMS Verify API — overview](https://developer.telesign.com/enterprise/docs/sms-verify-api-overview)
- [Telesign SMS Verify — SIM swap screening](https://developer.telesign.com/enterprise/docs/sms-verify-api-screen-recipients-by-sim-swap-indicator)
- [Telesign blog — SIM swap detection](https://www.telesign.com/blog/sim-swap-detection-a-key-factor-in-fraud-prevention)
- [Vonage Verify v2 + SIM Swap APIs blog post](https://developer.vonage.com/en/blog/improve-your-multifactor-auth-with-verify-and-sim-swap-apis)
- [tru.ID Active SIMCheck](https://idlayr.com/blog/tru-id-launches-active-simcheck-solve-sim-swap/)
- [CAMARA Project — Number Verification](https://camaraproject.org/number-verification/)
- [Glide Identity SIM Swap](https://www.glideidentity.com/api/sim-swap)
- [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html)
- [Drop Cowboy — Telesign pricing summary (third-party)](https://www.dropcowboy.com/blog/understanding-telesign-pricing-for-businesses/)
