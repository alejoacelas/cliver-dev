# m10-stripe-funding — Per-idea synthesis

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | Stripe / Adyen funding-source |
| **measure** | M10 (payment-bin-giftcard) |
| **attacker_stories_addressed** | prepaid-gift-card, anonymous-funding (inbox-compromise method 5.2 prepaid virtual card; foreign-institution method 3 prepaid debit card in real name). Both are secondary references — no in-corpus branch routes a prepaid card to a synthesis provider as the primary path. |
| **summary** | Read the issuer-reported card funding type from the PSP at checkout (`payment_method.card.funding` on Stripe, `paymentMethod.fundingSource` on Adyen) — one of `credit`, `debit`, `prepaid`, `unknown`. Authoritative because the PSP queries the card network directly via card-scheme metadata. Block on `prepaid`; route `unknown` to manual review. |
| **external_dependencies** | Stripe Payments + Stripe Radar for Fraud Teams (or Adyen Payments + Adyen Risk). No third-party data subscription — the funding type is sourced from the card scheme via the PSP. |
| **endpoint_details** | **Stripe:** `PaymentMethod.card.funding` with enum `credit | debit | prepaid | unknown`. Custom Radar rules reference `:card_funding:` (syntax: `Block if :card_funding: = 'prepaid'`). Standard PSP API key auth; rate limits are PSP payment-processing limits. No ToS constraints on using funding type for risk decisions. **Adyen:** `paymentMethod.fundingSource` with values including `credit`, `debit`, `prepaid`. Adyen Risk rule syntax for this field is [best guess — Adyen Risk configuration is in Customer Area, not public docs]. |
| **fields_returned** | **Stripe PaymentMethod.card:** `brand`, `funding`, `country`, `last4`, `bin`/`iin`, `issuer`, `wallet`, `network`. **Adyen additionalData:** `fundingSource`, `cardBin`, `cardIssuingBank`, `cardIssuingCountry`, `paymentMethodVariant`. |
| **marginal_cost_per_check** | Stripe Radar for Fraud Teams: 2-7 cents/tx (2 cents on standard payments pricing, 7 cents otherwise). At 10,000 tx/month: $200-$700/month. Adyen: [vendor-gated — pricing is contract-based, requires sales contact]. Setup cost: ~30 min engineering + ~1 hr QA. |
| **manual_review_handoff** | **`prepaid` flag:** PSP rejects authorization; order enters "blocked — prepaid funding" queue. Reviewer checks masked PAN, issuer country, issuer name, and institutional context from other checks. Corporate prepaid exceptions allowed with documentation. Default: deny with templated message requesting non-prepaid payment. **`unknown` flag:** Softer path — reviewer asks for alternate payment method or confirmation. May approve with corroborating institutional context. SOP target: ≤5 min/case. |
| **flags_thrown** | `psp_funding_prepaid` — hard block; reviewer adjudicates corporate-prepaid exceptions. `psp_funding_unknown` — soft flag; reviewer requests confirmation or alternate payment. |
| **failure_modes_requiring_review** | (1) Issuer mis-reports funding type (prepaid reported as credit/debit — card passes undetected). (2) PSP API 5xx errors — fallback to allow with post-hoc review flag. (3) `unknown` is high-volume for some non-US geographies — reviewer load risk. (4) Tokenized wallets (Apple Pay/Google Pay) — Stripe generally exposes underlying card's funding type, but documentation is not perfectly explicit. (5) Co-branded credit/prepaid hybrids report ambiguously. |
| **false_positive_qualitative** | (1) Corporate prepaid procurement cardholders (Pathward-issued institutional prepaid, university procurement cards) — dominant FP class; hard block on every order; mitigable with exception list. (2) Non-US researchers with `unknown` funding type — soft flag, not block, but significant friction and reviewer load for international customer bases (~4.5-13.5% of transactions, [best guess]). (3) Underbanked consumer-prepaid users (grad students without credit history) — rare (<0.5% of orders) but hard block; financial-access equity concern. (4) Non-US payroll-on-prepaid cardholders — rare (<1%); hard block; concentrated in developing economies. |
| **coverage_gaps** | (1) International cards returning `unknown` — ~4.5-13.5% of all card transactions [best guess]; check provides no signal. (2) Corporate prepaid procurement — ~2-5% of institutional transactions [best guess]; false positive requiring manual override. (3) Underbanked consumer prepaid — <0.5% of orders; false positive. (4) Non-US payroll-on-prepaid — <1%; false positive. (5) Issuer misreporting (prepaid reported as credit/debit) — low single-digit percentage [best guess]; detection gap where truly prepaid cards evade the check. |
| **record_left** | PSP funding string, PSP transaction/PaymentMethod ID (links to full PSP record retained 7+ years, responsive to subpoena), issuer name + country, reviewer decision and rationale, customer-facing message sent, corroboration flag if sibling m10-prepaid-issuer-denylist also flagged. |
| **bypass_methods_known** | None. No in-corpus attacker stories stress this check as a primary path. |
| **bypass_methods_uncovered** | None. No in-corpus attacker stories stress this check. (This is a defense-in-depth control; its value is in catching secondary methods, not primary attack paths.) |

## Section 2: Narrative

### What this check is and how it works

This check reads the card funding type — `credit`, `debit`, `prepaid`, or `unknown` — directly from the payment service provider (Stripe or Adyen) at the moment of checkout. The PSP obtains this classification from the card network (Visa, Mastercard) via issuer-reported metadata, making it authoritative for the vast majority of card transactions. On Stripe, the field is `PaymentMethod.card.funding`; on Adyen, it is `paymentMethod.fundingSource`. A Stripe Radar for Fraud Teams rule of the form `Block if :card_funding: = 'prepaid'` implements the check with no external data subscriptions and minimal engineering effort (~30 minutes to configure, ~1 hour QA). The check hard-blocks `prepaid` cards and soft-flags `unknown` cards for manual review.

### What it catches

The check addresses the prepaid-gift-card and anonymous-funding attacker stories — specifically, inbox-compromise method 5.2 (prepaid virtual card) and foreign-institution method 3 (prepaid debit card in real name). Both are secondary, non-primary attack vectors in the corpus. Any card that the issuer correctly reports as `prepaid` to the card network will be caught at authorization time with zero latency. The check is complementary to the sibling m10-prepaid-issuer-denylist (BIN-list approach): the PSP funding field catches issuer-misreported BINs that the denylist misses, while the denylist catches cards whose issuers report `debit` or `unknown` instead of `prepaid`.

### What it misses

The primary detection gap is issuer misreporting: when a substantively prepaid card is reported to the card network as `credit` or `debit`, the check passes it as legitimate. No quantitative data exists on the misreporting rate, but it is believed to be a low single-digit percentage of prepaid cards in circulation. The check also provides zero signal on cards returning `unknown` funding type — estimated at 4.5-13.5% of all card transactions, concentrated among non-US issuers in Africa, Southeast Asia, and Latin America. The SOP treats `unknown` as a soft flag rather than a hard block, which is necessary to avoid unworkable false-positive rates but means the check is effectively blind to this population.

### What it costs

Stripe Radar for Fraud Teams costs 2-7 cents per transaction on top of standard Stripe processing fees (the lower rate applies to accounts on standard Stripe payments pricing). At 10,000 transactions per month, this is $200-$700/month. Adyen Risk pricing is contract-negotiated and not publicly available. Setup cost is minimal: approximately 30 minutes of engineering time to write the Radar rule, plus about an hour of QA. There is no data-curation cost because the funding field comes directly from the PSP. The manual review burden is concentrated in two populations: corporate prepaid procurement cardholders (hard block, exception-list mitigable) and international customers with `unknown` funding type (soft flag, proportional to international customer share).

### Operational realism

When a `prepaid` flag fires, the PSP rejects the authorization and the order enters a "blocked — prepaid funding" queue. The reviewer pulls the order, examines the masked PAN, issuer country, issuer name, and cross-references institutional context from other checks (m07/m18). If the customer's context suggests a legitimate corporate prepaid program, the reviewer contacts the customer to switch to ACH/invoice/credit and records the exception. Default action is denial with a templated message. For `unknown` flags, the reviewer follows a softer path: requesting an alternate payment method or confirmation. The SOP targets 5 minutes or less per case. The audit trail includes the PSP funding string, PSP transaction ID (linking to full records retained 7+ years), issuer metadata, reviewer decision and rationale, and any corroboration from sibling checks.

### Open questions

The claim-check flagged a mild overstatement regarding tokenized wallets (Apple Pay/Google Pay): while Stripe generally exposes the underlying card's funding type on tokenized PaymentMethods, the documentation is not perfectly explicit on this point. The Adyen Risk rule syntax for branching on `fundingSource` is marked as [best guess] because Adyen's risk-rule configuration is in the Customer Area, not in public documentation. The coverage research noted that the `unknown` rate for non-US cards (the key driver of reviewer load) is not publicly documented by Stripe or Mastercard, leaving the 10-30% estimate as a [best guess] with a wide range.

## Section 3: Open issues for human review

- **No surviving Critical hardening findings.** Stage 5 found no Critical, Moderate, or Minor findings — no in-corpus attacker stories stress this check as a primary path.
- **[unknown — searched for] fields affecting policy implications:**
  - Rate of `unknown` funding type returns for non-US cards (drives the reviewer-load estimate for Gap 1; searched for Stripe/Mastercard documentation on this rate without result)
  - Corporate prepaid procurement card share of institutional synthesis purchases (drives Gap 2 false-positive estimate; searched for market data without result)
  - Issuer misreporting rate for prepaid cards reported as credit/debit (drives Gap 5 detection-gap estimate; searched without result)
- **[vendor-gated] fields requiring sales conversation:**
  - Adyen Risk per-transaction pricing (contract-negotiated, not public)
  - Adyen Risk rule syntax for branching on `fundingSource` (configured in Customer Area, not in public docs)
- **Mild overstatement flagged by claim check (04C):** Tokenized wallet funding-type pass-through claim should be weakened to "generally exposes" rather than stated as definitive.
- **Stale citation (06F):** The 70% P-card program adoption statistic is from a 2008 Wikipedia source. Current figures may differ.
