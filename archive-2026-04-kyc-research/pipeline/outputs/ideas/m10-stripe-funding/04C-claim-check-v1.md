# 04C claim check — m10-stripe-funding v1

## Verified

- **Stripe Radar pricing (7¢ / 2¢ Fraud Teams; 5¢ ML, waived on standard payments)** — https://stripe.com/radar/pricing publishes exactly these figures. PASS.
- **Stripe `card.funding` enum** — https://docs.stripe.com/api/payment_methods/object documents `funding` as one of `credit | debit | prepaid | unknown`. PASS.
- **Custom rules require Radar for Fraud Teams** — Stripe's Radar product page distinguishes the ML-only tier (no custom rules) from Fraud Teams (custom rules). PASS.
- **`:card_funding:` Radar attribute** — https://docs.stripe.com/radar/rules/supported-attributes lists `:card_funding:` among the supported predicate attributes. PASS.
- **Adyen `fundingSource` with `prepaid` value** — Adyen's `additionalData` and PaymentMethodVariant pages corroborate that prepaid is a recognized variant; the exact `fundingSource` enum is documented in Adyen's API explorer schemas. PASS (with mild caveat that the document hedges Adyen Risk's rule syntax as best-guess, which is appropriate).

## Flags

- **OVERSTATED (mild) — "Stripe still returns the underlying funding type [for Apple Pay/Google Pay tokens]"** — directionally true but Stripe's documentation around tokenized wallets and underlying funding type is not perfectly explicit. Suggested fix: weaken to "Stripe generally exposes the underlying card's funding type on tokenized PaymentMethods" or cite the specific Apple Pay PaymentMethod doc.

No BROKEN-URL, MIS-CITED, or load-bearing OVERSTATED claims.

## Verdict

PASS
