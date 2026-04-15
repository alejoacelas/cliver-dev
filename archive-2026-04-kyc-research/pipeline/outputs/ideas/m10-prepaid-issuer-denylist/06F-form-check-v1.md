# 06F Form check: m10-prepaid-issuer-denylist — coverage v1

## Field-by-field verdicts

### coverage_gaps
**PASS** — Five gaps identified with precise categories. The sponsor-bank ambiguity analysis (Gap 2) with the Sutton Bank 140+ programs figure is the most technically important finding. The government procurement card gap (Gap 1) and international fintech gap (Gap 3) are well-quantified with citations.

### false_positive_qualitative (refined)
**PASS** — The critical observation that the hard-block design amplifies all FPs (vs. the binlist-stack's reviewer-adjudication approach) is well-articulated and directly actionable for stage 7.

### Notes for stage 7 synthesis
**PASS** — Correctly identifies the overlap with sibling ideas (binlist-stack, stripe-funding) and questions marginal value. The international customer impact framing is appropriate.

## Flags

### CITATION-MISSING: Gap 5 purchase order payment percentage
The claim "20–40% of institutional synthesis orders are paid via purchase order or wire" is a best guess with no derivation or source. This is plausible but unsupported.

### VAGUE: Gap 2 BIN-to-program mapping
The `[unknown]` marker for the BIN-to-program mapping is correctly flagged, but the search list is only two queries. More specific searches (e.g., "Visa BIN to program mapping API", "Mastercard ICA to BIN range lookup") would strengthen the admission.

## For 4C to verify

1. Sutton Bank >140 active card programs — verify from suttonpayments.com or another primary source.
2. Government Purchase Card program ~3 million cards / $30 billion annual spend — verify from the acquisition.gov source.
3. Revolut 70+ million customers — verify the recency of this figure.

## Verdict: PASS

One CITATION-MISSING flag and one minor VAGUE flag. The coverage analysis is substantive and the key finding (hard-block design + sponsor-bank ambiguity = high FP risk) is well-supported. No revision needed.
