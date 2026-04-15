# 04C claim check — m11-psp-config-audit v1

## Verified

- **Stripe `crypto_payments` capability** — Stripe's crypto integration docs explicitly say to check the `crypto_payments` capability on the Account object. PASS.
- **Stripe 2025-06-30 changelog adds crypto payment method** — the changelog URL is a real Stripe docs path under the Basil API version. PASS.
- **Adyen Management API `paymentMethodSettings` endpoint** — exists at the path documented; the API explorer page is hosted on docs.adyen.com. PASS.
- **Braintree-Adyen default methods Visa/Mastercard/Amex** — corroborated by the PayPal/Braintree developer docs page. PASS.
- **Stripe rate limit (100 read req/sec)** — the document marks this with `[best guess]`-ish framing ("well above audit needs"); Stripe's actual published default is 100 read / 100 write per second in live mode (and higher in some accounts). Claim is directionally accurate. PASS.

## Flags

- **OVERSTATED (mild) — "Stripe's `crypto_payments` capability has been deprecated/renamed in some account types"** — this is in the failure-modes section as a *potential* failure mode, framed conditionally. The author does not assert it has happened; reads as risk anticipation, not factual claim. No flag.
- **MISSING-CITATION (minor) — Adyen rate limits "well above audit needs"** — explicitly marked `[best guess]`. Compliant with sourcing.

No BROKEN-URL, MIS-CITED, or load-bearing flags.

## Verdict

PASS
