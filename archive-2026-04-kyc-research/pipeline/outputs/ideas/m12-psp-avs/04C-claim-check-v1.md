# 04C claim check — m12-psp-avs v1

## Claim-by-claim

1. **Stripe AVS surfaces address_line1_check / address_postal_code_check / cvc_check on the Charge object.**
   - URL: https://docs.stripe.com/disputes/prevention/verification
   - Verdict: SUPPORTED. These are the canonical Stripe field names; broadly known across the Stripe API community.

2. **Stripe AVS is bundled into card processing — no per-call surcharge — at 2.9% + $0.30 for US cards.**
   - URL: https://stripe.com/resources/more/what-is-address-verification-service
   - Verdict: SUPPORTED for "no separate AVS fee." The "2.9% + $0.30" specific number is from stripe.com/pricing — a separate page not directly cited; mark as STALE-RISK because Stripe pricing changes. Suggested fix: cite stripe.com/pricing alongside the AVS resource page.

3. **Adyen AVS effective only for US, Canada, UK issuers (and Visa in some EU countries).**
   - URL: https://docs.adyen.com/risk-management/avs-checks
   - Snippet observed: "the AVS check is only applicable to US, CA and UK issued cards."
   - Verdict: SUPPORTED.

4. **Plaid `/identity/match` returns per-field match scores including name, address, email, phone.**
   - URL: https://plaid.com/docs/api/products/identity/
   - Snippet: "match names, addresses, email addresses, and phone numbers… a separate score is returned for each field."
   - Verdict: SUPPORTED.

5. **Plaid Identity Match is a per-request flat-fee product.**
   - URL: https://plaid.com/docs/account/billing/
   - Snippet: "Identity Match is a per-request flat fee product."
   - Verdict: SUPPORTED.

6. **Plaid claims ~12,000 US institutions** (used as best-guess about coverage gaps).
   - Verdict: UPGRADE-SUGGESTED. The "12,000" figure is widely reported in Plaid marketing but not in any cited URL. Either drop the number or cite plaid.com directly. Suggested fix: weaken to `[best guess: ≥10,000 US institutions per Plaid marketing copy]`.

## Flags

- One STALE-RISK on the Stripe pricing number (recommend adding stripe.com/pricing).
- One UPGRADE-SUGGESTED on the "12,000 institutions" Plaid figure.
- No BROKEN-URL.
- No MIS-CITED.

## Verdict

PASS (two minor weakenings recommended; not blocking).
