# Stage 2 Feasibility — Measure 10 (payment-bin-giftcard) — v1

**Limitation acknowledged.** Mapping file reports zero relevant attacker stories. Per the mapping file's own note, the relevance gate cannot be applied in the usual way; I treat it as vacuously satisfied for ideas that name a real BIN-level prepaid/gift-card signal, since that is exactly what the measure as written checks. I flag below where an idea drifts even from the measure-as-written.

## Verdicts

### Idea 1 — binlist.net public BIN lookup
**PASS.** Concrete (named endpoint, named fields). Directly implements the measure.

### Idea 2 — BinDB downloadable BIN database
**PASS.** Named commercial product with documented PREPAID/GIFT category fields.

### Idea 3 — Neutrino API BIN Lookup
**PASS.** Named vendor endpoint with documented `is-prepaid` field.

### Idea 4 — IINAPI.com BIN lookup
**PASS.** Named vendor; serves as a third corroborating source. Concreteness met.

### Idea 5 — Stripe Radar / PaymentMethod card metadata
**PASS.** Stripe `PaymentMethod.card.funding == 'prepaid'` is a real, documented field. Strong because it requires no extra API call.

### Idea 6 — Adyen `additionalData.fundingSource` + RevenueProtect
**PASS.** Real Adyen field name; documented values include PREPAID. Direct implementation.

### Idea 7 — Visa/Mastercard prepaid BIN range files
**PASS (with caveat).** `[best guess]` on filenames is plausible — Visa ARDEF and Mastercard's BIN tables exist; stage 4 verifies exact filenames and licensing. Authoritative source, worth keeping.

### Idea 8 — Issuer-MCC heuristic via curated issuer blocklist
**PASS.** Issuer names listed (Pathward, Sutton Bank, Bancorp, Green Dot, MetaBank, Stride) are real prepaid program managers. Concrete SOP.

### Idea 9 — PSP checkout config: disable prepaid funding for SOC SKUs
**PASS.** Configuration recipe on top of Idea 5/6, but distinct (preventive vs detective). Worth its own slug.

### Idea 10 — FinCEN prepaid access registrants
**REVISE.** `[best guess]` is borderline. The FinCEN prepaid-access rule is real, but it is not clear a public machine-readable registrant list exists; it may only surface as MSB registration data on FinCEN's MSB Registrant Search. Stage 1 should either (a) point at the FinCEN MSB Registrant Search specifically and explain the filter that yields prepaid-access providers, or (b) drop in favor of a documented issuer list (e.g., Mercator Advisory Group prepaid issuer reports, or Nilson Report's prepaid issuer ranking). If neither is reachable, drop.

## Gaps

The mapping file lists zero attacker stories. The mapping file itself notes that **if measure 10 is widened from "gift card BIN" to "any prepaid / obscured-identity BIN,"** then `inbox-compromise` (Method 5.2 prepaid virtual card) and `foreign-institution` (Method 3 prepaid debit card) become marginally relevant. All current ideas already cover the broader "prepaid" reading (every BIN source flags `prepaid`, not just `gift`), so the gap is closed at the idea level even though the mapping file is empty. No new ideas needed to close attacker gaps.

One real gap worth noting for stage 1: **none of the ideas address virtual single-use card numbers issued by Privacy.com / Capital One Eno / Citi virtual numbers**, which are BIN-stable to the issuer (real bank) and would not flag as `prepaid` but still obscure identity. Stage 1 v2 could add an idea for "issuer-virtual-card detection" if the measure's intent (obscured identity) is to be honored.

## STOP

`STOP: no` — one REVISE (Idea 10) and one identified additive idea (virtual single-use card detection).
