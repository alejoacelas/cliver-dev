# Form check: m17-igsc-shared-list / 06-coverage-v1.md

## Schema field: `coverage_gaps`

| # | Gap name | Category precise? | Estimated size sourced? | Behavior labeled? | Reasoning present? | Verdict |
|---|---|---|---|---|---|---|
| 1 | Net-new customers (null result) | Yes | Cited RAND, PMC, PMC Practical Questions (5% flag rate); [best guess] >99% | Yes (no-signal) | Yes | PASS |
| 2 | Non-IGSC-member providers | Yes | Cited IGSC website (~80% capacity); [best guess] 10–20% | Yes (no-signal) | Yes | PASS |
| 3 | Channel under-utilization | Yes | Cited RAND + PMC "rarely used"; [best guess] >80% alert loss | Yes (no-signal) | Yes | PASS |
| 4 | Identity drift | Yes | [unknown] + [best guess] 30–50% of deliberate evaders | Yes (no-signal) | Yes | PASS |
| 5 | Antitrust / GDPR constraints | Yes | Cited GM Insights + RAND; [best guess] 40–60% of customers | Yes (weak-signal) | Yes | PASS |
| 6 | CRM staleness | Yes | [unknown] + [best guess] 10–20% | Yes (weak-signal) | Yes | PASS |

## Schema field: `false_positive_qualitative`

Refined list present? **Yes.** Five items. Cross-references stage 4 + new fuzzy-match FPs. Adequate.

## Overall structure

- Six gaps, all following required format. **PASS.**
- Citations present and correctly attributed. **PASS.**
- "Notes for stage 7 synthesis" section present with clear assessment. **PASS.**

## Flags

- **Flag 1 (minor):** Gap 3 estimates >80% alert loss rate, which is a strong claim. The "rarely used" characterization from RAND/PMC supports the direction but not the specific >80% figure. Mark as [best guess] more explicitly.
- **Flag 2 (minor):** Gap 5 overlaps significantly with Gap 3 — antitrust/GDPR is a cause of under-utilization. The document acknowledges this but the two gaps could be consolidated or cross-referenced more cleanly.

## Verdict: **PASS with minor flags.**
