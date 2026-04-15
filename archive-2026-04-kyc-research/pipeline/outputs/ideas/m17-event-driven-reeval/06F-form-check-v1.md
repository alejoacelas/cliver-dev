# Form check: m17-event-driven-reeval / 06-coverage-v1.md

## Schema field: `coverage_gaps`

| # | Gap name | Category precise? | Estimated size sourced? | Behavior labeled? | Reasoning present? | Verdict |
|---|---|---|---|---|---|---|
| 1 | Non-corporate entities | Yes | Cited OpenCorporates coverage + Credence Research market split; [best guess] 30–50% | Yes (no-signal) | Yes | PASS |
| 2 | Jurisdiction data-freshness lag | Yes | Cited OpenCorporates blog, MyCorporation; [best guess] 1–12 months | Yes (weak-signal) | Yes | PASS |
| 3 | Control changes without filing | Yes | [unknown] + [best guess] <5% | Yes (no-signal) | Yes | PASS |
| 4 | OFAC name-collision noise | Yes | [best guess] with ComplyAdvantage cite; 10–50 false demotions/year | Yes (false-positive) | Yes | PASS |
| 5 | Routine officer turnover noise | Yes | [best guess] with R1 count anchor | Yes (false-positive) | Yes | PASS |
| 6 | New entities with no baseline | Yes | [best guess] with Census cite | Yes (no-signal) | Yes | PASS |

## Schema field: `false_positive_qualitative`

Refined list present? **Yes.** Four items. Cross-references stage 4 + gaps. Adequate.

## Overall structure

- Six gaps, all following required format. **PASS.**
- Citations present where available; [unknown] markers with search lists where not. **PASS.**
- "Notes for stage 7 synthesis" section present. **PASS.**

## Flags

- **Flag 1 (minor):** Gap 1 estimates 30–50% of pre-approved entities are non-corporate, but the derivation conflates "academic institutions" (which are often incorporated as non-profit corporations and may appear in OpenCorporates) with "government labs" (which typically do not). The estimate would benefit from distinguishing these sub-populations.
- **Flag 2 (minor):** Gap 2 could benefit from a specific example of US state filing lag data. The OpenCorporates blog post on US data difficulty is cited but the specific lag figures are [best guess] rather than cited.

## Verdict: **PASS with minor flags.**
