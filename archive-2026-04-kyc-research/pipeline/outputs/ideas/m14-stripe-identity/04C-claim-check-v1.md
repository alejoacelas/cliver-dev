# 4C claim check — m14-stripe-identity v1

## Verified claims

- **"Pricing for Stripe Identity starts at $1.50 per verification"** — Cited URL: https://support.stripe.com/questions/billing-for-stripe-identity. Stripe support article and Identity product page advertise $1.50 per document+selfie verification. **PASS.**
- **`verified_outputs` fields (first_name, last_name, dob, address, id_number, id_number_type)** — Cited URL: https://docs.stripe.com/api/identity/verification_sessions/object and https://docs.stripe.com/identity/access-verification-results. The object reference confirms these fields. **PASS.**
- **NIST IAL2 requires biometric binding + PAD** — https://pages.nist.gov/800-63-4/sp800-63a/ial/ and the IAL2-remote implementation page substantively describe these requirements. **PASS.**

## Flags

- **OVERSTATED / MISSING-CITATION:** "Stripe Identity ToS limits use to verifying end users of the Stripe customer's own service" — marked as best-guess in the doc; no MSA citation attached. **Suggested fix:** weaken to "Stripe Services Agreement governs Identity use; review the current MSA before deploying as a third-party screening bureau" or fetch the MSA URL.
- **UPGRADE-SUGGESTED:** "Stripe markets it as iBeta-tested" — author marked unknown but Stripe's product page does describe its anti-fraud features; an explicit iBeta level is not published. The unknown stands.
- **THIN-SEARCH (minor):** Retention period — only 2 queries. Adding "Stripe privacy policy identity verification data" would strengthen.

## Verdict

`REVISE` — fix the ToS overstatement; other claims hold.
