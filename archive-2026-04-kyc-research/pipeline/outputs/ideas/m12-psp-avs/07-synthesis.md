# Per-idea synthesis: m12-psp-avs

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | PSP AVS (Stripe / Adyen / Braintree) + Plaid Identity Match |
| **measure** | M12 — billing-institution-association |
| **attacker_stories_addressed** | dormant-account-takeover Bypass D (substituted personal card — CAUGHT via AVS mismatch), dormant-domain Bypass A (personal card — CAUGHT at manual review zip comparison), inbox-compromise prepaid card (CAUGHT — AVS unavailable/mismatch), shell-nonprofit fintech account (AMBIGUOUS — possible Plaid BIN-sponsor name mismatch). All inherited-payment paths, invoice paths, and properly constructed shell entities are MISSED. |
| **summary** | At payment time, capture billing street and ZIP and run the issuer Address Verification Service (AVS) check via the existing PSP (Stripe, Adyen, or Braintree). Use the AVS response code to confirm the billing address on the card matches the issuer record. For ACH-paid orders, call Plaid's `/identity/match` endpoint to score how closely the customer-provided name matches the bank-account holder name. Together, these are the cheapest mass-deployable M12 check — they fire on every card order, return structured codes, and are already wired into most providers' PSP integration. |
| **external_dependencies** | Stripe AVS (built into every Stripe charge); Adyen AVS (built into /payments API); Braintree AVS (equivalent); Plaid Identity Match API (`/identity/match` endpoint). Provider must already accept card payments through one of these PSPs. Plaid requires separate integration including frontend Plaid Link SDK. |
| **endpoint_details** | **Stripe AVS:** Implicit during `POST /v1/payment_intents` or `/v1/charges`. Fields on Charge object: `payment_method_details.card.checks`. Auth: Stripe secret key. Rate limits: ~100 rps. Pricing: bundled into card processing (no separate AVS fee). **Adyen AVS:** Response field `additionalData.avsResult` on `/payments`. Effective only for US, CA, UK, and Visa-EU issuers. Pricing: bundled. **Plaid Identity Match:** `POST https://production.plaid.com/identity/match`. Auth: client_id + secret + Item access_token from Plaid Link. Pricing: per-request flat fee [vendor-gated — exact price requires Plaid sales contact; best guess $0.20–$1.00 per call]. Rate limits: [unknown — searched for Plaid rate limits]. |
| **fields_returned** | **Stripe AVS:** `address_line1_check`, `address_postal_code_check`, `cvc_check` (each: pass/fail/unavailable/unchecked). **Adyen AVS:** Raw letter code (Y/A/Z/N/U) plus description. **Plaid `/identity/match`:** Per-field `match_score` (0–100) for name, address, email, phone, plus boolean detail flags (`is_first_name_or_last_name_match`, `is_business_name_detected`, `is_postal_code_match`). |
| **marginal_cost_per_check** | AVS: $0 incremental (bundled into existing card processing). Plaid Identity Match: ~$0.20–$1.00 per call (ACH orders only). Typical card order: ~$0. Typical ACH order: ~$0.50. **Setup cost:** Engineering to extend PSP integration to require billing address at checkout, read AVS codes, and gate on outcome. Plaid Link integration: ~1–2 weeks engineering. |
| **manual_review_handoff** | **Card path:** (1) Compute AVS verdict (pass/partial/fail/unavailable). (2) Pass: no action, record code. (3) Partial/fail on non-SOC: reviewer compares billing ZIP to institution's known ZIP; allow if within commuting distance, else escalate. (4) Partial/fail on SOC: hold; require address correction or switch to invoice/PO. (5) Unavailable on non-US issuer: expected, do not flag on AVS alone. **ACH path:** (1) Run `/identity/match`. (2) High match (>=80): no action. (3) Name mismatch: reviewer compares bank-on-file name to customer/institution; if bank name is institution itself, pass; if unrelated third party, hold and escalate. |
| **flags_thrown** | `avs_zip_mismatch`, `avs_address_mismatch`, `avs_full_mismatch`, `avs_unavailable_us`, `plaid_name_mismatch`, `plaid_third_party_payer`, `plaid_low_match_overall`. |
| **failure_modes_requiring_review** | AVS unavailable for non-US/CA/UK issuers. Customer address typos or recent moves causing false AVS fail. Plaid Link abandonment (no Identity Match data). Plaid coverage gaps for small/regional banks. Stale issuer AVS data (cardholder moved, issuer not updated). |
| **false_positive_qualitative** | (1) Address errors/moves: ~5–8% of US card orders produce partial/fail AVS, vast majority legitimate. (2) Corporate/institutional P-card with HQ billing address: ~15–30% of institutional card orders; billing ZIP is centralized AP office, not lab shipping address — systematic and recurring false positive. (3) Personal ACH with expense-later: `plaid_name_mismatch` fires on legitimate researcher paying personally. (4) International orders: AVS unavailable is the norm, not a flag — but produces no screening signal. |
| **coverage_gaps** | **Gap 1 — International cardholders:** AVS effective only for US/CA/UK/Visa-EU; ~30–50% of card-paid orders may be international with no signal. **Gap 2 — Address errors/moves:** ~5–8% of US card orders produce false AVS mismatch. **Gap 3 — P-card HQ billing address:** ~15–30% of institutional card orders; structural false-positive source. **Gap 4 — Plaid Link abandonment:** ~20–40% of ACH users may not complete OAuth flow; no Identity Match. **Gap 5 — Personal ACH (expense-later):** ~5–15% of ACH orders; `plaid_name_mismatch` on legitimate orders. **Gap 6 — Invoice/PO/wire orders:** ~30–50% of B2B order volume; completely invisible to this check. |
| **record_left** | `{psp, charge_id, avs_line1, avs_zip, avs_cvc, avs_raw_code, avs_verdict, plaid_name_score, plaid_address_score, plaid_phone_score, plaid_email_score, plaid_match_id, checked_at}`. Auditable; satisfies M12 auditability. |
| **bypass_methods_known** | dormant-account-takeover Bypass D (personal card) — CAUGHT. dormant-domain Bypass A (personal card) — CAUGHT at manual review. inbox-compromise prepaid card — CAUGHT. |
| **bypass_methods_uncovered** | (1) Inherited institutional payment instruments — account takeover, account hijack, credential compromise all use legitimate billing that AVS validates. (2) Properly constructed shell entities with aligned billing — all LLC-cluster branches pass AVS by construction. (3) Invoice/PO billing — no card, no AVS. (4) Driving-distance target selection — inbox-compromise attacker defeats geographic-proximity heuristic by selecting nearby targets. (5) Cloned cards carrying original billing address. (6) Billing-vs-shipping consistency — not implemented in this check (delegated to separate idea). |

---

## Section 2: Narrative

### What this check is and how it works

This idea uses the Address Verification Service (AVS) built into payment processors (Stripe, Adyen, Braintree) to confirm that the billing address a customer enters at checkout matches the address the card issuer has on file. AVS is triggered automatically on every card charge and returns structured response codes indicating whether the street address and ZIP code match. For ACH payments, the idea adds Plaid's Identity Match API, which scores how closely the customer-provided name, address, email, and phone match the bank-account-holder information. The provider reads the AVS response codes from the existing PSP integration and routes orders with mismatches to manual review.

### What it catches

The check is most effective against attackers who substitute a personal payment instrument for an institutional one. When an attacker takes over a dormant institutional account and uses their own credit card (dormant-account-takeover Bypass D), the personal card's billing address mismatches the institutional address, producing an AVS fail. Similarly, prepaid virtual cards used in inbox-compromise scenarios often lack a billing address entirely, producing an AVS "unavailable" result on a US issuer. For dormant-domain attackers using a personal card, the manual review step — which compares the billing ZIP to the claimed institution's geographic location — can surface the discrepancy.

### What it misses

AVS has broad structural blind spots. It verifies billing-address-vs-issuer consistency, not entity legitimacy or user authorization. All inherited institutional payment paths (account takeover, account hijack, credential compromise) produce AVS "pass" because the billing address is genuinely correct. All properly constructed shell entities (shell company, shell nonprofit, CROs, incubator tenants, community bio-lab networks) align their billing address with their registered address by construction, so AVS passes. Invoice and PO billing — which may account for 30–50% of B2B synthesis order volume — bypasses card payment entirely, producing no AVS signal. The inbox-compromise branch's explicit tradecraft of selecting targets within driving distance defeats the geographic-proximity heuristic in the manual review SOP. Stage 5 also noted that a billing-vs-shipping consistency check is absent from this implementation.

### What it costs

AVS is the cheapest M12 check available: $0 incremental cost, since AVS is bundled into existing card-processing fees. The provider only needs to read the AVS response codes already present on the charge object. Plaid Identity Match adds a per-call fee (estimated $0.20–$1.00, vendor-gated) but applies only to ACH orders. Setup cost is primarily engineering: extending the PSP integration to require billing address at checkout and gate on AVS outcome, plus ~1–2 weeks for Plaid Link frontend integration if ACH coverage is desired.

### Operational realism

For card-paid orders, AVS runs automatically with no manual intervention on "pass" results. The manual review burden comes from partial matches, fails, and unavailable results. The P-card false-positive problem (Gap 3) is particularly operationally significant: an estimated 15–30% of institutional card orders use P-cards with centralized billing addresses, producing systematic recurring false matches. The implementation correctly recommends pairing AVS with the procurement-network check (m12-procurement-network) to absorb these cases — if the institution has an active supplier registration, the P-card AVS mismatch can be overridden. For international orders (~30–50% of card volume), AVS returns "unavailable" and the SOP treats this as expected, meaning those orders get no M12 signal from this check.

### Open questions

The claim check flagged two minor items: the Stripe "2.9% + $0.30" pricing figure should cite stripe.com/pricing directly (STALE-RISK), and the "12,000 US institutions" Plaid coverage figure should be softened. The coverage research noted that the 30–50% estimate for invoice/PO order share — a critical figure since it represents the fraction of orders completely invisible to this check — rests on a best guess with no cited source. Plaid Identity Match pricing is vendor-gated and the rate limit is unknown.

---

## Section 3: Open issues for human review

- **No surviving Critical findings.** All three Moderate findings from stage 5 are structural scope limitations of AVS (geographic-proximity defeat, no signal on shell entities, no billing-vs-shipping check).
- **[vendor-gated] Plaid Identity Match pricing:** Exact per-call cost requires Plaid sales contact. Best guess $0.20–$1.00. This affects the cost-benefit calculation for ACH coverage.
- **[unknown] Plaid API rate limits:** Not documented publicly. Relevant if the provider processes high ACH volume.
- **[unknown] Plaid Link completion rate:** Estimated 20–40% abandonment based on general OAuth-flow data. No Plaid-specific data found. This directly affects the fraction of ACH orders that get Identity Match coverage.
- **[unknown] P-card billing-address mismatch rate:** No public proxy for what fraction of institutional card orders use centralized billing addresses. Estimated 15–30%. This is the largest systematic false-positive source.
- **[unknown] Invoice/PO share of B2B synthesis orders:** Estimated 30–50% but unsourced. This figure determines what fraction of orders is completely invisible to the check.
- **Moderate-3 (billing-vs-shipping consistency):** Stage 5 noted the implementation does not include a billing-vs-shipping address comparison, which the account-hijack attacker story explicitly exploits. This is presumably handled by a separate idea but should be cross-referenced.
- **Stripe pricing STALE-RISK:** The "2.9% + $0.30" figure may change. Not structurally important (AVS cost is $0 regardless) but should cite stripe.com/pricing.
