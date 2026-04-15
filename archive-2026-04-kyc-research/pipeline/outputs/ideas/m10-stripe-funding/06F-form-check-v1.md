# Form check: m10-stripe-funding / 06-coverage-v1

## Schema field coverage

- **coverage_gaps:** Populated. Five gaps identified, each with category, estimated size, behavior classification, and reasoning. PASS.
- **false_positive_qualitative (refined):** Populated. Cross-references gaps 1–4. PASS.

## Per-gap assessment

| Gap | Category precise? | Size cited or marked? | Behavior classified? | Verdict |
|-----|---|---|---|---|
| 1: International `unknown` | Yes — specifies non-US issuers not reporting funding type | Derived from market-share citation + [best guess] range; `unknown` rate itself marked [unknown — searched for] | Yes — weak-signal | PASS |
| 2: Corporate prepaid procurement | Yes — names Pathward, institutional prepaid rails | [best guess: 2–5%]; underlying data marked [unknown — searched for] | Yes — false-positive | PASS |
| 3: Underbanked consumer prepaid | Yes — names Netspend, Green Dot, grad students | Derived from FDIC 5.9% prepaid-household stat + reasoning about overlap | Yes — false-positive | PASS |
| 4: Non-US payroll-on-prepaid | Yes — specifies countries and payroll mechanism | Derived from global prepaid-payroll stat + [best guess] | Yes — false-positive | PASS |
| 5: Issuer misreporting | Yes — specifies the direction (prepaid reported as credit/debit) | Marked [unknown — searched for] | Yes — no-signal | PASS |

## Flags

- **No bare numbers.** Every estimate is either cited, derived with [best guess], or marked [unknown — searched for]. PASS.
- **Gap 1 size range (4.5–13.5%)** is derived from two inputs, one cited and one [best guess]. The [best guess] range (10–30% `unknown` rate for non-US cards) is wide. Acceptable for BOTEC but would benefit from narrowing if data becomes available. MINOR flag.
- **Gap 2 size** relies on a Wikipedia citation for the 70% P-card adoption stat, which is from 2008. Stale but acknowledged. MINOR flag.

## Overall verdict

PASS with 2 MINOR flags (staleness of one citation; wide range on one estimate). No structural gaps in the coverage analysis.
