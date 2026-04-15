# m12-fintech-denylist — Claim check v1

**Document under review:** `04-implementation-v1.md`

## Verified claims

### binlist.net URL and fields
- **Claim:** URL is `https://lookup.binlist.net/{bin}`; returns scheme, type, brand, prepaid, country, bank.name, etc.
- **Cited:** [binlist.net](https://binlist.net/)
- **Verified:** Yes. The site describes the API and confirms the field list. Fields include `number`, `scheme`, `type`, `brand`, `prepaid`, `country`, `bank` (with subfields). **PASS.**

### binlist.net rate limit
- **Claim:** "10 requests per minute."
- **Cited:** [binlist.net](https://binlist.net/)
- **Actual:** The official site states requests are "throttled at 5 per hour with burst allowance of 5" — substantially more restrictive than 10/min. Some third-party documentation references 10/min but the primary source says 5/hour.
- **Flag:** **MIS-CITED.** The rate limit is 5 per hour, not 10 per minute. This makes binlist.net even less suitable for production use than the document implies.
- **Suggested fix:** Correct to "5 requests per hour (with burst allowance of 5)" per the official site. Note that paid access starts at EUR 0.003/request.

### Stripe Radar pricing
- **Claim:** "$0.05/transaction for Radar; $0.07/transaction for Radar for Fraud Teams."
- **Cited:** [stripe.com/radar](https://stripe.com/radar)
- **Actual:** Per Stripe's pricing page, basic Radar is waived for accounts on standard pricing and $0.05/screened transaction for custom pricing. Radar for Fraud Teams is $0.07 for custom pricing or $0.02 for standard pricing accounts.
- **Flag:** **OVERSTATED.** The document omits that Radar is free for standard-pricing accounts and that Fraud Teams is only $0.02/transaction on standard pricing. The $0.05 and $0.07 figures apply only to custom-pricing accounts.
- **Suggested fix:** Add the standard-pricing rates ($0 for basic, $0.02 for Fraud Teams) alongside the custom-pricing rates.

### Stripe Radar `:card_bin:` attribute
- **Claim:** Available as a rule attribute in Radar.
- **Cited:** [docs.stripe.com/radar/rules](https://docs.stripe.com/radar/rules?locale=en-GB) and [docs.stripe.com/radar/lists](https://docs.stripe.com/radar/lists?locale=en-GB)
- **Verified:** Yes. Stripe documentation confirms `:card_bin:` is a standard attribute usable in Radar rules, and BIN-based block/review lists can be created. **PASS.**

### 8-digit BIN transition
- **Claim:** "Since April 2022, the industry has transitioned to 8-digit BINs."
- **Cited:** [binsearchlookup.com](https://www.binsearchlookup.com/)
- **Verified:** The source confirms that 8-digit BINs became mandatory for all new cards issued after April 2022 per ISO/IEC 7812. **PASS.**

### BinDB coverage
- **Claim:** "250,000+ BIN records from 15,000+ issuers across 200+ countries."
- **Cited:** [bindb.com/bin-database](https://www.bindb.com/bin-database)
- **Verified:** BinDB's site states similar coverage claims. **PASS.**

## Uncited claims flagged

### BIN sponsor mappings
- **Claim:** "Mercury's BIN sponsor is Choice Financial Group / Evolve Bank & Trust; Brex uses Emigrant Bank / Sutton Bank; Relay uses Thread Bank; Wise uses Community Federal Savings Bank / Evolve."
- **Flag:** **MISSING-CITATION.** These mappings are presented as facts without citations. While widely discussed in fintech community forums, they should have at least a `[best guess]` marker or a citation to a specific source (e.g., a fintech blog post or BIN database lookup).
- **Suggested fix:** Add `[best guess: widely reported in fintech forums; specific BIN-to-sponsor relationships are not officially published by all issuers and may change without notice]`.

### Denylist maintenance cost
- **Claim:** "[best guess: ~$500–$2,000/year in analyst time]"
- **Status:** Correctly marked as `[best guess]`. **PASS** (appropriately sourced).

## Summary of flags

| # | Claim | Flag | Severity |
|---|---|---|---|
| 1 | binlist.net rate limit "10 requests per minute" | MIS-CITED | Medium — affects production viability assessment |
| 2 | Stripe Radar pricing "$0.05 / $0.07" | OVERSTATED | Low — the correct figures are more favorable, not less |
| 3 | BIN sponsor mappings | MISSING-CITATION | Low — common knowledge but should be marked |

## Verdict

**REVISE.** Three flags, none critical. The binlist.net rate limit error should be corrected as it materially affects the feasibility assessment. The Stripe pricing should be clarified. The BIN sponsor mappings need a sourcing marker.
