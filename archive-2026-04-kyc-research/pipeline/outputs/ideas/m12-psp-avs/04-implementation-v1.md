# m12-psp-avs — Implementation v1

- **measure:** M12 — billing-institution-association
- **name:** PSP AVS (Stripe / Adyen / Braintree) + Plaid Identity Match
- **modes:** D (defensive — corroborates payer ↔ billing-address ↔ name)
- **summary:** At payment time, capture billing street + ZIP and run the issuer Address Verification Service (AVS) check via the existing PSP (Stripe / Adyen / Braintree). Use the AVS response code to confirm the billing address on the card matches what the customer entered. For ACH-paid orders, additionally call Plaid's `/identity/match` endpoint to score how closely the customer-provided name matches the bank-account holder name. Together, these are the cheapest mass-deployable M12 check available — they fire on every order, return a structured code, and are already wired into most providers' PSP integration.
- **attacker_stories_addressed:** dormant-account-takeover Bypass D (substituted personal card — name mismatch surfaces); inbox-compromise (own real card with non-institutional billing zip); credential-compromise (cloned card may pass AVS, fraudulent new-card application may not); shell-nonprofit (fintech BIN sponsor name mismatch surfaces in Plaid Identity Match); third-party-billing generally (someone else's card on the order).

## external_dependencies

- **Stripe** AVS — built into every Stripe charge; AVS response is part of `charge.payment_method_details.card.checks`. [source](https://docs.stripe.com/disputes/prevention/verification)
- **Adyen** AVS — documented at docs.adyen.com/risk-management/avs-checks. [source](https://docs.adyen.com/risk-management/avs-checks)
- **Braintree** AVS — same model, response codes on the Transaction object. `[best guess: equivalent to Stripe/Adyen since AVS is an issuer-side response, not PSP-specific]`
- **Plaid Identity / Identity Match** — `/identity/match` endpoint scores customer-provided name/address/email/phone against bank-on-file values. [source](https://plaid.com/docs/api/products/identity/) [source](https://plaid.com/products/identity/)
- The provider must already accept card payments through one of these PSPs. No additional vendor onboarding for AVS.

## endpoint_details

### Stripe AVS

- URL: AVS happens implicitly during `POST /v1/payment_intents` / `POST /v1/charges`. Response is on the Charge object: `payment_method_details.card.checks.address_line1_check` and `address_postal_code_check`.
- Auth: Stripe secret key (existing PSP integration).
- Rate limits: standard Stripe API limits (~100 read / 100 write per second per account, with bursting). [best guess: Stripe public docs say ~100 rps; AVS is just a field on a charge so no separate limit]
- Pricing: bundled into Stripe's per-transaction processing fee (2.9% + $0.30 for US cards). No separate AVS line item. [source](https://stripe.com/resources/more/what-is-address-verification-service)
- ToS: standard Stripe ToS; AVS data may be used for fraud prevention.

### Adyen AVS

- URL: response field on the `/payments` API call; AVS detail in `additionalData.avsResult`. [source](https://docs.adyen.com/risk-management/avs-checks)
- Auth: Adyen API key (existing integration).
- Coverage: AVS is only effective for **US, Canada, UK, and Visa issuers in some EU countries**. [source](https://docs.adyen.com/risk-management/avs-checks)
- Pricing: bundled in Adyen processing fees. `[unknown — searched for: "Adyen AVS surcharge", "Adyen risk module pricing"]`
- ToS: standard Adyen merchant agreement.

### Plaid Identity Match

- URL: `POST https://production.plaid.com/identity/match` (also sandbox/development). [source](https://plaid.com/docs/api/products/identity/)
- Auth: Plaid client_id + secret, plus an Item access_token created when the user links their bank account via Plaid Link.
- Pricing: per-request flat fee, listed by Plaid as a Pay-As-You-Go SKU. Plaid's docs explicitly state Identity Match is per-call billed. [source](https://plaid.com/docs/account/billing/) [vendor-gated — exact unit price not on public pricing page; would require Plaid sales contact](https://plaid.com/pricing/) `[best guess: ~$0.20–$1.00 per /identity/match call, based on common Plaid SKU pricing tiers and Plaid's positioning of Identity Match as a higher-value KYC product]`
- Rate limits: standard Plaid API limits (per-Item and per-client). `[unknown — searched for: "Plaid identity match rate limit", "Plaid API throughput limits"]`
- ToS: Plaid permits use for KYC and fraud-prevention; user must be in Plaid Link flow.

## fields_returned

### Stripe / Adyen AVS

The issuer returns a single-letter AVS code interpreted by the PSP. Stripe surfaces:

- `address_line1_check`: `pass | fail | unavailable | unchecked`
- `address_postal_code_check`: `pass | fail | unavailable | unchecked`
- `cvc_check`: `pass | fail | unavailable | unchecked`

[source](https://docs.stripe.com/disputes/prevention/verification)

Adyen surfaces the raw AVS letter code (e.g., `Y`, `A`, `Z`, `N`, `U`) plus a description in `additionalData.avsResult`. [source](https://docs.adyen.com/risk-management/avs-checks)

### Plaid `/identity/match`

For each of name, address, email, phone: a `match_score` (0–100) plus boolean detail flags (e.g., `is_first_name_or_last_name_match`, `is_business_name_detected`, `is_postal_code_match`). [source](https://plaid.com/docs/api/products/identity/)

## marginal_cost_per_check

- AVS via PSP: **$0 incremental** — bundled into existing card-processing fees the provider already pays. The provider just needs to *read* the AVS response.
- Plaid `/identity/match`: per-call flat fee. `[best guess: $0.20–$1.00; would need Plaid sales quote]`. Only applies to ACH-paid orders.
- Across a typical card-paid order: ~$0; across a typical ACH-paid order: ~$0.50.
- **setup_cost:** Engineering work to extend the existing PSP integration to (a) require billing street and ZIP at checkout, (b) read AVS response codes from the charge, (c) gate the order on AVS outcome. Plaid Link integration requires a frontend SDK and ~1–2 weeks of engineering. `[best guess]`

## manual_review_handoff

For card payments:

1. Compute the AVS verdict: pass (`Y`/`pass+pass`), partial (`A` line1 only or `Z` zip only), fail (`N`), or unavailable.
2. **Pass** → no action; record AVS code on order.
3. **Partial / fail / unavailable on a non-SOC order** → soft flag; reviewer compares billing ZIP to claimed institution's known city/ZIP; if ZIP is plausibly within commuting distance of the institution, allow with note; else escalate.
4. **Partial / fail on a SOC order** → hold; require customer to either correct the billing address or switch to invoice/PO billing; route to onboarding analyst.
5. **Unavailable on a non-US issuer** → expected; do not flag based on AVS alone; rely on other M12 signals.

For ACH payments via Plaid:

1. Run `/identity/match` with customer-provided name, address, email, phone.
2. **High match (≥80 on name + address)** → no action; record scores.
3. **Name mismatch** → escalate to reviewer who compares the bank-on-file name to the claimed customer / institution; if the bank-on-file name is the institution itself, treat as pass; if it is a third party unrelated to the customer or institution, hold and escalate to "third-party billing" review.

## flags_thrown

- `avs_zip_mismatch`
- `avs_address_mismatch`
- `avs_full_mismatch`
- `avs_unavailable_us` (US issuer that should support AVS but didn't return)
- `plaid_name_mismatch`
- `plaid_third_party_payer` (bank holder name unrelated to customer or institution)
- `plaid_low_match_overall`

## failure_modes_requiring_review

- AVS unavailable for non-US issuers (effective only for US/CA/UK/Visa-EU per Adyen docs). [source](https://docs.adyen.com/risk-management/avs-checks)
- Customer mistypes their address → false fail. Stripe explicitly notes legitimate payments can fail AVS due to typing or recent moves. [source](https://stripe.com/resources/more/what-is-address-verification-service)
- Plaid Link not completed (user abandons OAuth flow) → no Identity Match available; fall back to AVS or invoice path.
- Plaid coverage gaps for small/regional banks: not all US banks are connected to Plaid. `[best guess: Plaid claims ~12,000 US institutions but coverage of small credit unions is patchy]`
- Issuer AVS data is itself stale (cardholder moved, issuer hasn't updated).

## false_positive_qualitative

- Recently moved customers; international students whose card billing address is still their home country; customers using a corporate card whose billing address is HQ rather than the lab. The corporate-card case is especially relevant: a legitimate institutional P-card may have HQ billing address that differs from the lab's shipping address — this generates a false `avs_zip_mismatch` even though the card is genuinely institutional. M12 should pair AVS with the procurement-network check to absorb this case.
- ACH from a personal account where the customer expenses the order later — `plaid_name_mismatch` will fire even though the order is legitimate.
- International orders generally — AVS unavailable is the rule, not the exception.

## record_left

For each order: `{psp, charge_id, avs_line1, avs_zip, avs_cvc, avs_raw_code, avs_verdict, plaid_name_score, plaid_address_score, plaid_phone_score, plaid_email_score, plaid_match_id, checked_at}`. Auditable; satisfies M12's "Y" auditability requirement.

## sources

- [Stripe — What is AVS](https://stripe.com/resources/more/what-is-address-verification-service)
- [Stripe Card verification checks docs](https://docs.stripe.com/disputes/prevention/verification)
- [Adyen AVS docs](https://docs.adyen.com/risk-management/avs-checks)
- [Adyen AVS responses for POS](https://docs.adyen.com/point-of-sale/mail-and-telephone-order-moto/avs-responses-pos)
- [Plaid Identity product page](https://plaid.com/products/identity/)
- [Plaid Identity API docs](https://plaid.com/docs/api/products/identity/)
- [Plaid Account billing docs](https://plaid.com/docs/account/billing/)
- [Plaid pricing](https://plaid.com/pricing/)
- [AVS Wikipedia](https://en.wikipedia.org/wiki/Address_verification_service)
