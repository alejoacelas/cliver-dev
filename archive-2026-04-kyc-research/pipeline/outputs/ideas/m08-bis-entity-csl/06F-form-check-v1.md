# 06F Form check — m08-bis-entity-csl v1

| Field | Verdict |
|---|---|
| coverage_gaps | PASS — 6 gaps identified with precise categories and behavioral classifications. |
| Gap 1 estimated size | PASS — OpenSanctions ~40,000 entity figure cited; US vs non-US overlap marked [best guess]. |
| Gap 2 estimated size | PASS — OFAC 50% rule referenced; subsidiary count marked [best guess]. |
| Gap 3 estimated size | PASS — [best guess] with transliteration examples. |
| Gap 4 estimated size | PASS — daily refresh cadence cited from trade.gov. |
| Gap 5 estimated size | PASS — explicit [unknown] with 2 search queries. |
| Gap 6 estimated size | PASS — 95% false-positive rate cited from industry source; institution-specific estimate marked [best guess]. |
| false_positive_qualitative (refined) | PASS — separates true false positives from false negatives. |
| Notes for stage 7 | PASS — actionable recommendations for pairing with commercial vendor and ownership-graph sources. |

## For 6C to verify
- OpenSanctions ~40,000 entity count across jurisdictions — verify against opensanctions.org
- CSL daily 05:00 EST refresh — verify against trade.gov source
- Up to 95% false-positive rate in sanctions screening — verify Visual Compliance source
- OFAC 50% rule — verify against OFAC FAQ

## Verdict
**PASS**
