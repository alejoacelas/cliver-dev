# Step (b): Payment to Institution — Field Assessment

**Measure:** M12 (+M10) — Billing address not associated with the institution; gift card BIN
**Endpoint groups assessed:** payment-bin, docs-only, llm-exa

---

## The critical insight: billing != institution is the normal case

The most important finding for step (b) is not about any specific endpoint. It is that **most legitimate researchers pay with personal cards billed to their home address.** A graduate student at MIT buying reagents uses their personal Visa debit card billed to their Somerville apartment. This is the default case, not the adversarial one.

Any KYC system for payment-to-institution verification must tolerate billing-institution mismatch as a soft signal and only escalate when multiple independent signals coincide: prepaid funding type + fintech BIN + billing mismatch = investigate. Billing mismatch alone = normal.

---

## Signal ranking (from strongest to weakest)

### 1. Stripe card.funding — the single strongest signal

`card.funding` returns credit, debit, or prepaid from the card network via Stripe. It works globally, is available before the charge is processed, and provides a binary decision: **prepaid = flag.** This is the single highest-value field across all endpoints for step (b).

In test mode, all 6 test tokens returned deterministic funding types confirming the field's reliability: tok_mastercard_prepaid correctly returned `funding=prepaid`. In production, this field comes directly from the card network -- more trustworthy than any BIN lookup.

**Open question:** Corporate virtual cards (Ramp, Brex, Divvy) may report `card.funding=prepaid` despite being legitimate institutional purchases. This cannot be confirmed without production data.

### 2. Fintech BIN denylist — essential backstop

The local denylist of 9 known fintech BIN prefixes (Mercury, Brex, Relay, Ramp, Wise, Divvy) passed 17/17 tests: 9 positive matches, 6 negative matches, 2 off-by-one edge cases correctly rejected. It is deterministic with zero false positives/negatives for known BINs.

The denylist is critical because **binlist.net is unreliable:** 40% of tested BINs returned HTTP 200 with null/empty fields (no way to distinguish "not found" from "found with no data"), and rate limiting kicked in after just 5 calls. The fintech denylist catches the BINs that binlist.net misses.

**Must be a soft flag, not a hard reject:** Legitimate companies use Mercury and Brex cards for business purchases. A Mercury BIN + verified institution = pass after quick review.

**Maintenance required:** Fintech BIN ranges change as issuers get new ranges from partner banks. Quarterly review needed.

### 3. Billing-shipping-institution consistency — universal but noisy

Three-way address comparison works for 7/8 test scenarios. The one failure: a Mercury PMB address ("548 Market St PMB 82560") broke the naive regex parser. Production implementation needs Smarty address normalization, not regex.

The consistency check has three tiers: **pass** (exact match), **soft_flag** (same city/state, different street), **hard_flag** (different state/country). Most legitimate orders produce soft_flag because the researcher lives in the same metro area as their institution but at a different address.

### 4. Stripe AVS — supplementary, US/UK/CA only

AVS confirms the billing address matches the card issuer's records. It does NOT confirm institutional affiliation -- a researcher's personal card passes AVS against their home address. Coverage is US/UK/CA strong, partial for AU/NZ/IE, and null for continental Europe, Asia, Africa, and Latin America (40-60% of payments for a global provider return "unavailable").

P-cards create false positives: university procurement cards have the finance department's address on file, so AVS line1 fails on legitimate institutional purchases. Rate unknown without production data.

### 5. Plaid Identity Match — strongest identity signal, narrowest coverage

Plaid's `legal_name.score` directly answers "is the payer who they claim to be?" -- the ideal signal for third-party payment detection. But coverage is ~30% of US ACH payers (bank coverage limitation), and the UX friction of Plaid Link (bank selection + credentials + MFA during checkout) may cause legitimate customers to abandon.

Cannot calibrate thresholds: sandbox returns binary 0/100 scores only. The continuous distribution for edge cases (nicknames, middle names, apartment number differences) exists only in production.

---

## Profile groups and resolution time

| Group | Time tier | Est. time | Fraction | Key signals |
|---|---|---|---|---|
| Institutional card, billing matches institution | Auto | 0 min | ~20% | funding=credit, consistency=pass, no BIN flags |
| Personal card, researcher home address | Auto | 0 min | ~40% | funding=credit/debit, consistency=soft_flag (same region), no BIN flags |
| International card, non-AVS country | Auto | 0 min | ~25% | funding=credit/debit, AVS=unavailable, card.country match |
| Fintech neobank card | Quick review | 1-2 min | ~5% | BIN denylist match, check if company is legitimate |
| Prepaid / gift card | Investigation | 5-10 min | ~5% | funding=prepaid, check if corporate virtual card or gift card |
| Wire transfer | Quick review | 2-5 min | ~5% | No card signals, only SWIFT/BIC originating bank |

---

## Recommended architecture

1. **card.funding check** on every card payment (global, reliable, binary)
2. **Fintech BIN denylist** on every card payment (deterministic, catches Mercury/Brex/etc.)
3. **Billing-shipping-institution consistency** on every order (no issuer dependency)
4. **AVS** as supplementary confirmation when available (US/UK/CA cards)
5. **Plaid Identity Match** as supplementary confirmation when available (~30% of US ACH)
6. **BIN/card country** as weak tiebreaker

**Drop:** binlist.net as a production data source (unreliable coverage, aggressive rate limits). Use for opportunistic enrichment only, and evaluate paid BIN databases (Maxmind minFraud, Binbase) for production.

---

## Unresolved issues

1. **binlist.net fintech BIN coverage untestable** due to rate limiting. 11 BINs could not be evaluated.
2. **International card behavior untested** -- test mode always returns country=US.
3. **Corporate virtual card false positive rate** for card.funding=prepaid unknown without production data.
4. **P-card false positive rate** for AVS unknown without production data.
5. **Plaid score calibration** impossible without production data (sandbox is binary).
6. **Wire transfer screening** has zero automated coverage.
