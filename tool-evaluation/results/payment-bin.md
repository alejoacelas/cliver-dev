# Payment BIN Group — Endpoint Test Results

**Tested:** 2026-04-14
**KYC step:** (b) Payment -> institution: flag "Billing address not associated with institution; gift card BIN"
**API calls:** 6 Stripe, 5 binlist.net (rate limited), 25 local logic

## Stripe Test Mode

**Endpoint:** `POST https://api.stripe.com/v1/payment_methods`

All 6 test tokens return deterministic, fixed metadata. The key KYC field is `card.funding`.

| Token | Brand | Funding | Country | Last4 |
|-------|-------|---------|---------|-------|
| tok_visa | visa | **credit** | US | 4242 |
| tok_visa_debit | visa | **debit** | US | 5556 |
| tok_mastercard_prepaid | mastercard | **prepaid** | US | 5100 |
| tok_amex | amex | **credit** | US | 8431 |
| tok_mastercard | mastercard | **credit** | US | 4444 |
| tok_discover | discover | **credit** | US | 9424 |

**Key findings:**

- `card.funding` reliably distinguishes credit/debit/prepaid — the primary KYC signal for gift card detection.
- `card.brand` vs `card.display_brand`: brand="amex" but display_brand="american_express". Use `brand` for logic.
- `billing_details` is always empty for token-created payment methods. Billing address must come from a separate source (customer form input).
- Test mode always returns `country=US` — cannot test international card detection.

**Verdict:** Stripe's `card.funding` field is the most reliable data source for prepaid/gift card detection. It comes directly from the card network via the payment processor. **funding=prepaid is the single strongest BIN-level signal.**


## binlist.net

**Endpoint:** `GET https://lookup.binlist.net/{bin}`

Rate limited after 5 calls (~35 seconds). HTTP 429 persisted for 5+ minutes with no Retry-After header.

| BIN | Status | Scheme | Type | Brand | Country | Bank |
|-----|--------|--------|------|-------|---------|------|
| 411111 | 200 | visa | debit | Visa Classic | **PL** (Poland) | Conotoxia Sp. Z O.O |
| 424242 | 200 | visa | credit | Visa Classic | GB | Stripe Payments Uk Limited |
| 520082 | 200 | *null* | *null* | *null* | *empty* | *empty* |
| 378282 | 200 | american express | credit | — | US | *empty* |
| 555555 | 200 | *null* | *null* | *null* | *empty* | *empty* |

11 additional BINs (fintech + prepaid) were not testable due to rate limiting: 533248, 556150, 531993, 535332, 531329, 400000, 556272, 547302, 535522, 552742, 541735.

**Key findings:**

- **40% of tested BINs returned no useful data** (200 with null/empty fields). Coverage is spotty.
- **BIN reassignment is real:** 411111 is widely cited as a US Visa test BIN but binlist.net maps it to a Polish fintech (Conotoxia). Static BIN databases go stale.
- **Stripe Issuing is identifiable:** BIN 424242 correctly maps to "Stripe Payments Uk Limited."
- **No way to distinguish "not found" from "found with no data"** — both return HTTP 200.
- **Rate limiting is aggressive:** The free tier is unsuitable for production. Even batch processing ~15 BINs in a session is not feasible.

**Verdict:** binlist.net is insufficient as a sole BIN data source. It has coverage gaps, aggressive rate limits, and no SLA. The fintech BIN denylist is essential as a backstop. A paid BIN database (Maxmind minFraud, Binbase) should be evaluated for production.


## Fintech BIN Denylist (Local Logic)

**Logic:** Exact 6-digit prefix match against a local lookup table.

**Denylist:**
| BIN Prefix | Issuer |
|------------|--------|
| 533248 | Mercury |
| 535332 | Mercury |
| 556150 | Brex |
| 531993 | Brex |
| 556272 | Relay |
| 547302 | Ramp |
| 535522 | Wise |
| 552742 | Wise |
| 541735 | Divvy |

**17/17 tests passed:** 9 positive matches (all known fintech BINs), 6 negative matches (standard bank BINs), 2 edge cases (off-by-one BINs correctly not matched).

**Key findings:**

- Deterministic with zero false positives/negatives for known BINs.
- Exact 6-digit prefix match is the right granularity.
- **Main risk is maintenance:** Fintech BIN ranges change as issuers get new ranges from partner banks. Requires quarterly review.
- Should be a **soft flag, not a hard reject:** Legitimate companies use Mercury/Brex/Relay cards for business purchases.

**Verdict:** The denylist is the critical backstop for binlist.net's coverage gaps. It is the only reliable way to detect fintech/neobank cards from the BIN prefix alone.


## Billing-Shipping-Institution Consistency (Local Logic)

**Logic:** Normalize addresses and compare billing vs institution (and optionally shipping). Three tiers:
- **pass:** exact match
- **soft_flag:** same city/state but different street
- **hard_flag:** different state or country

**7/8 scenarios passed.** One failure: PMB (private mailbox) designator in address confuses naive regex parser.

| Scenario | Billing | Institution | Result | Expected |
|----------|---------|-------------|--------|----------|
| Exact match (MIT) | 77 Massachusetts Ave, Cambridge, MA | Same | pass | pass |
| Researcher home billing | 1247 Elm St, Somerville, MA | 77 Massachusetts Ave, Cambridge, MA | soft_flag | soft_flag |
| Satellite campus (JPL) | 4800 Oak Grove Dr, Pasadena, CA | 1200 E California Blvd, Pasadena, CA | soft_flag | soft_flag |
| Cross-state mismatch | Springfield, IL | Springfield, MA | hard_flag | hard_flag |
| International (Singapore) | 11 Biopolis Way, Singapore | 11 Biopolis Way, Singapore | soft_flag | soft_flag |
| Unknown institution | 350 Fifth Ave, NY | unknown | soft_flag | soft_flag |
| Three-way mismatch | Springfield, IL + Chicago, IL | Springfield, IL | soft_flag | soft_flag |
| **Mercury PMB** | **548 Market St PMB 82560, SF** | **548 Market St, SF** | **hard_flag** | **soft_flag** |

**Key findings:**

- **Most legitimate researchers trigger soft flags.** Personal debit cards billed to home addresses are the norm for academic purchases. billing != institution is the *default* case, not the adversarial one.
- **PMB/suite/unit designators break naive parsing.** A real implementation must use address normalization (Smarty) to handle these.
- **International addresses cannot be parsed** with US-format regex. Falls back to unreliable string comparison.
- **Smarty integration is essential for US addresses:** provides normalized address components + RDI (residential/commercial) + CMRA (mailbox service detection).
- **This check must be a soft signal** that combines with other signals, not a standalone reject.


## Seed Case Verdicts

| ID | Name | Difficulty | Hypothesis Confirmed |
|----|------|-----------|---------------------|
| 1 | Standard Visa credit — MIT | easy | Yes |
| 2 | Corporate Amex — Pfizer | easy | Yes |
| 3 | Mastercard credit — Oxford | easy | Partial (binlist coverage gap confirmed) |
| 4 | Debit card — researcher home billing | medium | Yes |
| 5 | International card — Singapore biotech | medium | Yes |
| 6 | Satellite campus — JPL vs Caltech | medium | Yes |
| 7 | Prepaid Mastercard | hard | Yes |
| 8 | Mercury fintech BIN — startup | hard | Partial (binlist untestable; PMB parsing bug) |
| 9 | Brex fintech BIN — virtual card | hard | Partial (binlist untestable) |
| 10 | Virtual card — gift card pattern | hard | Yes |


## Cross-Cutting Findings

### 1. Three-layer defense works
Stripe funding type, fintech BIN denylist, and billing-institution consistency are complementary. A prepaid card from a fintech BIN with a mismatched billing address stacks three independent signals. Any one check missing still leaves two others.

### 2. binlist.net is unreliable as a sole BIN data source
40% of tested BINs returned no useful data. Rate limiting is aggressive. BIN reassignment means static data goes stale. The fintech denylist is essential, and a paid BIN database should be evaluated for production.

### 3. Stripe is the most reliable data source for funding type
`card.funding` returns credit/debit/prepaid from the payment processor itself. This is more trustworthy than any BIN lookup because Stripe has actual card network data. **funding=prepaid is the single strongest signal.**

### 4. Address consistency needs Smarty, not regex
Simple string comparison breaks on PMB/suite designators, abbreviations (St vs Street), and international formats. Smarty provides normalized components, RDI, and CMRA. For non-US addresses, a geocoding service could provide lat/long proximity comparison.

### 5. Most legitimate researchers will trigger soft flags
Personal debit cards billed to home addresses are the norm. The system must tolerate billing != institution and only escalate when combined with other flags (prepaid + CMRA + fintech BIN).

### 6. Fintech BIN denylist requires ongoing maintenance
The denylist is static. New fintech issuers and BIN ranges appear regularly. A quarterly review process is necessary.
