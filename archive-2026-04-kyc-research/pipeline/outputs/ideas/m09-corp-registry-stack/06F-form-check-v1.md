# 06F Form check: m09-corp-registry-stack — coverage v1

## Field-by-field verdicts

### coverage_gaps
**PASS** — Six gaps identified, each with a precise category description, estimated size (with citations or explicit `[best guess]` markers), behavior classification (no-signal / false-positive / weak-signal), and reasoning. The gaps are case-appropriate to the data source (corporate registries) and cover the key dimensions: entity type (government, academic, sole proprietor), geography (non-OECD), age (new incorporations), and classification accuracy (SIC misclassification).

### false_positive_qualitative (refined)
**PASS** — Updated with cross-references to the specific gaps. Distinguishes between true false positives (flags firing on legitimate entities) and uninformative no-signal cases (flags firing because the entity type is outside scope).

### Notes for stage 7 synthesis
**PASS** — Provides actionable synthesis guidance about the check's structural limitation to commercial customers and the need for complementary academic-facing checks.

## Flags

### CITATION-MISSING: Gap 2 university count
The claim "roughly 26,000 universities worldwide" is marked `[best guess]` but the derivation is thin — it references "UNESCO / WHED estimates" without a URL. A direct citation to the WHED database or a UNESCO report would strengthen this.

### CITATION-MISSING: Gap 3 biotech formation rate
The claim "~1,000–1,500 new biotechs are incorporated annually in the US" cites a Fierce Biotech article about peak formation but the article's focus is on the 2021 boom, not a steady-state annual rate. The extrapolation to "10–20% of biotech companies are < 12 months old" is weakly grounded.

### VAGUE: Gap 4 percentage of global biotech activity
"~15–25% of global biotech activity outside the US/EU/UK" is a best guess with no derivation pathway. What proxy was used for "biotech activity"? Revenue? Company count? Publication count?

## For 4C to verify

1. The SCImago Government sector figure of ~4,200 government research institutions — verify the number is current and the ranking page actually shows that count.
2. The Fierce Biotech article cited for biotech formation rates — verify it contains formation-rate data (not just commentary on overcrowding).
3. The OpenCorporates blog post on coverage — verify it discusses jurisdiction-level completeness gaps (not just how to use the coverage tool).

## Verdict: PASS

The coverage research is substantive and well-structured. The two CITATION-MISSING flags and one VAGUE flag are minor and do not require a revision cycle — they are noted for the claim check and for stage 7 awareness. No MISSING or THIN-SEARCH flags.
