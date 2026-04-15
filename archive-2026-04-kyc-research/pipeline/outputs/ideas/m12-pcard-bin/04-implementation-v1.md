# m12-pcard-bin — Implementation v1

- **measure:** M12 — billing-institution-association
- **name:** P-Card / commercial-card BIN positive signal
- **modes:** D (corroborative)
- **summary:** When a customer claims an institutional affiliation, run the payment card's BIN through a BIN-attribute service that returns the card's product platform (consumer vs commercial) and product subtype (e.g., Visa Purchasing Card, Visa Corporate, MC Corporate Purchasing). A commercial/purchasing card on a claimed-institutional order is positive corroboration; a consumer card is a soft negative that should pair with other M12 checks (billing-zip vs institution geography).
- **attacker_stories_addressed:** dormant-account-takeover (Bypass D — substituted personal card), inbox-compromise (own real card path), credential-compromise (personal card fallback), dormant-domain (Bypass A — personal card at permissive providers).

## external_dependencies

- A BIN-attribute lookup. Concrete options:
  - **Visa BIN Attribute Sharing Service (VBASS)** — Visa's official program for sharing BIN attributes including Product Platform (consumer vs commercial) and product names. [source](https://usa.visa.com/products/visa-bin-attribute-sharing-service.html)
  - **Mastercard BIN Lookup API** — official Mastercard developer API. [source](https://www.postman.com/mastercard/mastercard-developers/collection/f598u8e/mastercard-bin-lookup-api)
  - **Third-party aggregators** that combine networks: BinDB, bincodes.com, neutrinoapi, binlookupapi. BinDB explicitly advertises card category (personal vs commercial). [source](https://www.bindb.com/bin-database)
- Acquirer/PSP-side: most PSPs (Stripe, Adyen, Braintree) already expose card-brand product info on the charge object; if the provider already takes cards through one of these, no separate BIN service is needed. `[best guess: Stripe's PaymentMethod.card.funding distinguishes credit/debit/prepaid but not consumer/commercial; Adyen's additionalData returns "fundingSource" and "cardBin" but commercial-flag exposure varies]`.

## endpoint_details

- **VBASS:** product page only; access requires Visa client relationship and contractual opt-in. [vendor-gated — public page describes Product Platform (consumer/commercial), Funding Source, Issuer Country, Issuer Name as attributes; would require Visa sales/issuer-acquirer contact for endpoint, auth, rate limits, pricing](https://usa.visa.com/products/visa-bin-attribute-sharing-service.html)
- **Mastercard BIN Lookup API:** developer portal documents the collection on Postman; full production access via Mastercard Developers. [source](https://www.postman.com/mastercard/mastercard-developers/collection/f598u8e/mastercard-bin-lookup-api). Auth: OAuth1 client cert (Mastercard standard). `[unknown — searched for: "Mastercard BIN Lookup API pricing", "Mastercard developers BIN lookup rate limit"]`.
- **BinDB:** sells a downloadable database (one-time / annual). Pricing public on order page; API also offered. [source](https://www.bindb.com/) `[best guess: ~$300–$2000/year for the commercial database tier based on typical BIN database vendor pricing; would need to confirm via order page snapshot]`.
- **bincheck.io / binlist.net:** free BIN lookup web services; binlist.net is a free public JSON endpoint (`https://lookup.binlist.net/{bin}`) but is heavily rate limited and ToS forbids commercial dependence. [source](https://binlist.net/)
- **Auth model summary:** VBASS = contractual; Mastercard = OAuth1 + cert; BinDB / commercial APIs = API key; binlist.net = none but unsuitable for production.
- **Rate limits:** binlist.net advertises 5 req/sec then throttling. [source](https://binlist.net/) Others `[unknown — searched for: "BinDB API rate limit", "neutrinoapi BIN lookup rate limit"]`.
- **ToS for KYC use:** binlist.net free tier is best-effort and forbidden for use as a sole compliance signal `[best guess: standard for free BIN endpoints]`. Commercial vendors typically permit fraud/KYC use; VBASS has explicit "allowed use cases" language. [source](https://usa.visa.com/products/visa-bin-attribute-sharing-service.html)

## fields_returned

Per VBASS public description: Product Platform (consumer vs commercial), Account Funding Source (credit / debit / prepaid), Issuer country, Issuer name, Product name. [vendor-described, not technically documented](https://usa.visa.com/products/visa-bin-attribute-sharing-service.html)

Per Mastercard / aggregator typical fields: BIN, scheme (Visa/MC/Amex), card type (credit/debit/prepaid), card category (consumer/business/corporate/purchasing/fleet), issuer name, issuer country, issuer phone, issuer URL. [source](https://www.bindb.com/bin-database)

The key field for this check is the **product/category** (Visa product names include "Visa Purchasing", "Visa Corporate T&E", "Visa Business"; Mastercard includes "Corporate Purchasing", "Corporate Executive", "Business Card", "Purchasing"). [source](https://docs.pagos.ai/payments-basics/card-brand-services/bin-product-code-guide)

## marginal_cost_per_check

- VBASS: `[vendor-gated — bundled with issuer/acquirer Visa relationship; would require Visa sales for per-call pricing]`
- Mastercard BIN Lookup API: `[unknown — searched for: "Mastercard BIN Lookup API pricing", "Mastercard developers commercial card BIN cost"]`
- Commercial aggregator API: `[best guess: $0.001–$0.01 per lookup at typical commercial BIN API tiers, based on neutrinoapi/binlookupapi published rates]`
- BinDB downloadable database: amortized to ~$0 per check after the annual subscription. `[best guess]`
- **setup_cost:** Negligible if using PSP fields the provider already receives; ~$300–$2000/year if licensing a database; opportunity cost of Visa/MC enterprise integration if going direct to network.

## manual_review_handoff

When the BIN check fires (or fails to fire as expected), reviewer:

1. Confirms the card product name from the BIN response (e.g., "Visa Purchasing").
2. If product = commercial/purchasing AND issuer = a commercial bank known to run institutional P-card programs (US Bank, JPM Chase, Citi, PNC, Bank of America Merrill) → mark as **positive corroboration** for the claimed institutional affiliation; record the BIN+issuer+product on the order audit log.
3. If product = consumer credit/debit AND the customer claimed institutional affiliation → flag for the M12 billing-vs-institution check (separate idea); reviewer asks the customer to either pay via the institution's PO/AP or upload an institutional invoice.
4. If product = prepaid → escalate (handled by m10 BIN giftcard check; this idea defers).
5. Document the result in a one-line note on the order: `pcard_check: <product>/<issuer>/<positive|neutral|negative>`.

## flags_thrown

- `pcard_positive` — commercial/purchasing card from a recognized institutional issuer; reviewer treats as a corroborating signal in favor of the claimed affiliation.
- `pcard_consumer_on_institutional_claim` — consumer credit/debit on an order claiming institutional affiliation; reviewer escalates to billing-address vs institution check.
- `pcard_unknown_bin` — BIN not found in the provider's data source; reviewer falls back to other M12 signals.

## failure_modes_requiring_review

- BIN-API outage / timeout → fall through to other M12 checks; do not block order.
- BIN present but product field missing or "unknown" → treat as `pcard_unknown_bin`.
- Some institutional P-card programs use white-label BIN sponsors (e.g., a fintech BIN ranges in payment metadata) — the issuer name will be the sponsor, not the institution. The shell-nonprofit attacker file explicitly cites this friction. Reviewer must check product code, not just issuer name.
- Virtual card numbers (VCN) issued by P-card platforms (e.g., JPM Single-Use Account, US Bank PaymentNet ePayables) — the BIN may not look like the parent P-card BIN. `[best guess: VCN BINs are documented internally to issuer, not in public databases]`
- Non-US institutional cards: the issuer-bank lookup is biased to US issuers; international institutional cards may resolve to "commercial" but with unfamiliar issuer names.

## false_positive_qualitative

- Small businesses (non-research) using a commercial credit card for personal-curiosity DNA orders look identical to a P-card on an institutional order at the BIN layer. The BIN check alone does not establish that the cardholder is at the claimed institution — it only establishes that the card is a business/commercial product.
- Some legitimate institutional users use their personal card and expense it later — this generates a false `pcard_consumer_on_institutional_claim` flag for a perfectly legitimate customer. This is the main FP class and is the reason this idea is **corroborative only**, never blocking.
- Academic visitors using their home institution's commercial card while affiliated with a host institution will produce a "commercial card from issuer A, claimed institution B" pattern that is not necessarily fraud.

## record_left

A short payment-screening record attached to the order: `{bin_first8, scheme, product_name, issuer_name, issuer_country, category (consumer|commercial|purchasing|fleet|prepaid), source (vbass|mc-api|aggregator|psp-passthrough), timestamp, classification (positive|neutral|negative)}`. This is auditable and supports the measure-12 audit-trail requirement.

## sources

- [Visa BIN Attribute Sharing Service product page](https://usa.visa.com/products/visa-bin-attribute-sharing-service.html)
- [Mastercard BIN Lookup API on Postman](https://www.postman.com/mastercard/mastercard-developers/collection/f598u8e/mastercard-bin-lookup-api)
- [BinDB BIN database](https://www.bindb.com/bin-database)
- [binlist.net free BIN lookup](https://binlist.net/)
- [Pagos BIN Product Code Guide — Visa/MC product code reference](https://docs.pagos.ai/payments-basics/card-brand-services/bin-product-code-guide)
- [JPM Commercial Card / PaymentNet](https://www.jpmorgan.com/payments/solutions/commercial-cards/program-management)
- [JPM Purchasing Card](https://www.jpmorgan.com/payments/solutions/commercial-cards/ts-purchasing-card)
- [US Bank Purchasing Card](https://www.usbank.com/corporate-and-commercial-banking/treasury-payment-solutions/corporate-payment-services/corporate-credit-cards/purchasing-card.html)
- [Citi P-Cards whitepaper](https://www.citibank.com/tts/solutions/commercial-cards/assets/docs/whitepaper/p-cards_090415.pdf)
