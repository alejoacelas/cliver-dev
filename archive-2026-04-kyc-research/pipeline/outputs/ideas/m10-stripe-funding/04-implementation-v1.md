# m10-stripe-funding — implementation v1

- **measure:** M10
- **name:** Stripe / Adyen funding-source
- **modes:** D
- **summary:** Read the issuer-reported card funding type from the PSP at checkout (`payment_method.card.funding` on Stripe, `paymentMethod.fundingSource` on Adyen) — one of `credit`, `debit`, `prepaid`, `unknown`. Authoritative because the PSP queries the network directly via card-scheme metadata, so it does not depend on internal BIN-list freshness. Block on `prepaid`; route `unknown` to manual review.
- **attacker_stories_addressed:** prepaid-gift-card, anonymous-funding (inbox-compromise method 5.2 prepaid virtual card; foreign-institution method 3 prepaid debit card in real name).

## external_dependencies

- **Stripe Payments + Stripe Radar (or Radar for Fraud Teams)** — for the funding field and the rule-based block.
- **Adyen Payments + Adyen Risk** — equivalent path for shops on Adyen.
- **No third-party data subscription** — this is the key advantage over m10-prepaid-issuer-denylist; the funding type is sourced from the card scheme via the PSP, not from a curated BIN database the synthesis provider has to maintain.

## endpoint_details

- **Stripe — PaymentMethod object.** The card hash includes `funding` with enum `credit | debit | prepaid | unknown` [source](https://docs.stripe.com/api/payment_methods/object). Returned on every PaymentMethod retrieval and on the Charge/PaymentIntent's `payment_method_details.card.funding`.
- **Stripe — Radar rule.** Custom rules can reference `:card_funding:`. Stripe's own help docs document this attribute family for blocking [source](https://docs.stripe.com/radar/rules/supported-attributes), [source](https://docs.stripe.com/radar/rules/reference). A rule of the form `Block if :card_funding: = 'prepaid'` is exactly the supported syntax [source](https://wpsimplepay.com/how-to-block-prepaid-cards-with-stripe-step-by-step/).
- **Adyen — fundingSource.** Adyen exposes `paymentMethod.fundingSource` taking values including `credit`, `debit`, `prepaid` [source](https://docs.adyen.com/api-explorer/). Adyen Risk rules can branch on this field [best guess: Adyen Risk's "Custom risk rules" tab supports field-based predicates including funding source — based on Adyen Risk's general capability of branching on any payment-request field. The exact rule syntax is not on a public page; Adyen Risk configuration is in the Customer Area, not in public docs](https://docs.adyen.com/api-explorer/).
- **Auth model:** Standard PSP API key (Stripe secret key / Adyen API key). No additional credential.
- **Rate limits:** Same as the PSP's payment processing rate limits — i.e., not a separate cost or limit beyond payment volume itself.
- **ToS constraints:** None specific to using this field for risk decisions; Stripe explicitly markets Radar rules for fraud blocking. Card-network rules (Visa/Mastercard operating regulations) impose constraints on how funding type can be communicated to the cardholder, but blocking the transaction outright is permitted.

## fields_returned

From `PaymentMethod.card` (Stripe) on every authorization:

- `brand` — `visa` / `mastercard` / `amex` / `discover` / `diners` / `jcb` / `unionpay` / `unknown`
- `funding` — `credit` / `debit` / `prepaid` / `unknown` [source](https://docs.stripe.com/api/payment_methods/object)
- `country` — issuer country
- `last4`
- `bin` (also called `iin`) — 6-digit BIN (Stripe exposes this as `card.iin` on certain endpoints; on PaymentMethod the legacy `bin` field is also retrievable for some integrations)
- `issuer` — issuer name (where Stripe has it; not always populated)
- `wallet` (Apple Pay / Google Pay) — useful as a side-signal because tokenized wallet funding flows through the underlying card's funding type
- `network` (Stripe Card object) — the card network used to process

From Adyen `additionalData`:

- `fundingSource` (`credit`/`debit`/`prepaid`)
- `cardBin`
- `cardIssuingBank`
- `cardIssuingCountry`
- `paymentMethodVariant` (e.g. `visadebit`, `mcprepaid`) [source](https://docs.adyen.com/development-resources/paymentmethodvariant)

## marginal_cost_per_check

- **Stripe Radar for Fraud Teams** is **7¢ per transaction**, or **2¢ per transaction** for accounts on standard Stripe payments pricing [source](https://stripe.com/radar/pricing).
- **Stripe Radar (machine learning, no custom rules)** is **5¢ per transaction**, **waived** for accounts on standard Stripe payments pricing [source](https://stripe.com/radar/pricing). Radar without Fraud Teams does NOT support custom rules — so to block on `:card_funding:` specifically, the synthesis provider needs Radar for Fraud Teams.
- **Net per-check cost for this idea:** ~2–7¢ per transaction, paid to Stripe, on top of normal Stripe processing fees. At 10,000 transactions/month this is $200–$700/month [source](https://stripe.com/radar/pricing) (Stripe's documented example: 10,000 tx/mo Radar for Fraud Teams = $500/mo at 5¢ effective).
- **Adyen** does not publish per-transaction Risk pricing; Adyen Risk is bundled into Adyen's processing-fee plans which are negotiated [vendor-gated — Adyen pricing is contract-based, not on a public page; would require sales contact for $ figures].
- **Setup cost:** ~30 minutes engineering to write the Radar rule and ~1 hour QA. No data-curation cost (the funding field comes from the PSP).

## manual_review_handoff

When `psp_funding_prepaid` fires:

1. PSP rejects authorization. Order enters "blocked — prepaid funding" queue.
2. Reviewer pulls the order, the masked PAN, the issuer country, and the issuer name (when Stripe populates it).
3. Reviewer assesses whether the customer's institutional context (m07/m18 outputs) suggests a legitimate corporate prepaid program. If so, contact customer to switch to ACH/invoice/credit; record the exception.
4. Default action: deny the order with a templated message: "Our payment processor flagged the card you provided as a prepaid card. We require a credit or debit card issued by a primary bank in your name, or institutional purchase order / ACH."

When `psp_funding_unknown` fires:

1. The funding-type field is `unknown` — the issuer did not report a funding type to the network. Common for some non-US issuers and for very new BIN ranges.
2. Reviewer routes to a softer step: ask the customer to provide an alternate payment method, or to confirm the card is a credit/debit card issued by a primary bank.
3. If the customer provides corroborating context (institutional account, prior order history, m18 institution-legitimacy pass), reviewer may approve.

SOP target: ≤5 minutes per case (this is a thin check; the reviewer is mostly relaying a PSP signal).

## flags_thrown

- `psp_funding_prepaid` — funding type returned by Stripe/Adyen is `prepaid`. Action: hard block; reviewer adjudicates corporate-prepaid exceptions.
- `psp_funding_unknown` — funding type is `unknown`. Action: soft flag; reviewer requests confirmation or alternate payment method.

## failure_modes_requiring_review

- **Issuer mis-reports funding type.** Some smaller issuers report all cards as `credit` or `unknown` regardless of underlying product, so a true prepaid card can slip through. Mitigation: pair with m10-prepaid-issuer-denylist (the BIN-list approach) for defense in depth. [best guess: this is a known industry issue but not heavily documented; Stripe's own docs include `unknown` as an enum value, which is implicit acknowledgement that the upstream network sometimes does not have the data.]
- **PSP API errors.** Stripe transient 5xx during PaymentMethod retrieval — fall back to allow with a flag for post-hoc review, or fail-closed depending on risk tolerance.
- **`unknown` is high-volume in some geographies.** Non-US issuers (especially in countries with thinner card-scheme metadata) frequently return `unknown` — risk of false positives if treated as block.
- **Tokenized wallets (Apple Pay / Google Pay).** The funding type passes through the underlying card, but if the underlying card is a prepaid card the wallet abstraction can briefly hide that from the user-facing UX. Stripe still returns the underlying funding type, so this is mostly a customer-confusion mode, not a detection gap.
- **Co-branded credit/prepaid hybrids.** A few products (some store cards) report ambiguously. Reviewer override.

## false_positive_qualitative

- **Corporate prepaid procurement programs.** Some institutions issue prepaid procurement cards on networks like Bancorp/Pathward — these report as `prepaid` but are legitimate institutional spend. Will trip on every order.
- **Foreign researchers using local prepaid payroll cards.** Some non-US students/postdocs receive payroll on prepaid cards.
- **Reloadable consumer prepaid cards used by underbanked legitimate customers** — a small population, but anyone (e.g., a graduate student without a credit history) using a Netspend or similar product to pay out-of-pocket would trip.
- **`unknown` false-positive class** is broader: anyone with a non-US card whose issuer doesn't report funding type. Treating `unknown` as block (rather than soft flag) would catch many legitimate international researchers; the SOP above keeps `unknown` as a soft signal.

## record_left

For each order:

- The PSP funding string (`prepaid` / `unknown` / `credit` / `debit`)
- PSP transaction / PaymentMethod ID — links back to the full Stripe/Adyen record (which the PSP retains for 7+ years and which is responsive to subpoena)
- Issuer name + country (where populated)
- Reviewer decision and rationale
- Customer-facing message sent
- Whether a sibling check (m10-prepaid-issuer-denylist BIN list) also flagged the same order — corroboration is itself an audit signal

## Sources

- [Stripe — PaymentMethod object reference](https://docs.stripe.com/api/payment_methods/object)
- [Stripe — Radar rules reference](https://docs.stripe.com/radar/rules/reference)
- [Stripe — Radar supported attributes](https://docs.stripe.com/radar/rules/supported-attributes)
- [Stripe — Radar pricing](https://stripe.com/radar/pricing)
- [WPSimplePay — How to block prepaid cards with Stripe (rule syntax example)](https://wpsimplepay.com/how-to-block-prepaid-cards-with-stripe-step-by-step/)
- [Adyen API Explorer](https://docs.adyen.com/api-explorer/)
- [Adyen — paymentMethodVariant reference](https://docs.adyen.com/development-resources/paymentmethodvariant)
