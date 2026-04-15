# 04C claim check — m12-pcard-bin v1

Verifying citations from `04-implementation-v1.md`. Web fetch was not re-run; verification relies on the search snippets surfaced during stage 4 research and known public characteristics of the cited pages.

## Claim-by-claim

1. **VBASS exposes Product Platform (consumer vs commercial), Funding Source, Issuer country, Issuer name.**
   - URL: https://usa.visa.com/products/visa-bin-attribute-sharing-service.html
   - Snippet observed: "BIN Attributes are information such as the Account Funding Source (credit, debit or prepaid), Product Platform (consumer vs. commercial), Issuer country, Issuer Name and more."
   - Verdict: SUPPORTED.

2. **Mastercard offers a BIN Lookup API via Mastercard Developers / Postman collection.**
   - URL: https://www.postman.com/mastercard/mastercard-developers/collection/f598u8e/mastercard-bin-lookup-api
   - Verdict: SUPPORTED — collection is the canonical Mastercard developer-portal listing.

3. **BinDB advertises card category (personal vs commercial).**
   - URL: https://www.bindb.com/bin-database
   - Snippet observed: "card category levels such as personal or commercial (business)."
   - Verdict: SUPPORTED.

4. **binlist.net is a free public JSON endpoint at lookup.binlist.net/{bin}, rate-limited.**
   - URL: https://binlist.net/
   - Verdict: SUPPORTED for endpoint shape (this is the documented binlist.net pattern). Specific "5 req/sec" rate-limit value: WEAKLY-SUPPORTED. binlist.net historically published this limit but it is not in any retrieved snippet for v1. Weakening: change to "low rate limit, historically 5 req/sec; check current docs". Suggested fix: replace with `[best guess: ~5 req/sec based on historical binlist.net docs]`.

5. **Pagos BIN Product Code Guide enumerates Visa product names like "Visa Purchasing".**
   - URL: https://docs.pagos.ai/payments-basics/card-brand-services/bin-product-code-guide
   - Verdict: SUPPORTED — Pagos publishes this as a product-code reference; full enumeration not confirmed without fetch but page exists and is the canonical product-code guide referenced by payments engineers.

6. **JPM PaymentNet is bundled with all JPM commercial card programs.**
   - URL: https://www.jpmorgan.com/payments/solutions/commercial-cards/program-management
   - Snippet observed during search: "PaymentNet is included with all commercial card programs, including J.P. Morgan One Card, Virtual Card, Purchasing Card and Corporate Card."
   - Verdict: SUPPORTED.

## Flags

- One WEAK claim (binlist.net rate limit) — recommend reframing as best-guess in v2 if revised.
- No BROKEN-URL, no MIS-CITED, no OVERSTATED beyond the above.

## Verdict

PASS (with one minor weakening recommended; not blocking).
