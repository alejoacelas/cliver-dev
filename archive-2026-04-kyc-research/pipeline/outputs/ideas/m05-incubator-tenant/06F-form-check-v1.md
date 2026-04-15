# Form check: m05-incubator-tenant — 06-coverage-v1

## Schema field: `coverage_gaps`

| Gap | Category described? | Estimated size cited? | Behavior labeled? | Issues |
|-----|--------------------|-----------------------|-------------------|--------|
| Gap 1: Non-incubator addresses | Yes | Yes — references denylist size (~30–50 buildings from 04-impl); <1% trigger rate is [best guess] | no-signal | Acceptable — the narrow scope is by design. |
| Gap 2: Poor/no directory (JLABS) | Yes | Yes — cites JLABS website (13 locations, ~40 residents each); 5–10 incubators without usable directories is [best guess] | weak-signal | Acceptable. |
| Gap 3: Brand-new tenants | Yes | [unknown] with search terms; 60–300 companies is [best guess] with derivation | false-positive | Derivation is transparent. Acceptable. |
| Gap 4: Stealth-mode startups | Yes | [unknown] with search terms; 5–15% stealth rate is [best guess] | false-positive | Acceptable. |
| Gap 5: Unlisted incubators | Yes | Partially — cites Excedr list of 16 notable incubators; total 50–100+ is [best guess] | no-signal | The 50–100+ total is plausible but uncited beyond the one list. Flag: **thin proxy for total incubator count**. |

## Schema field: `false_positive_qualitative`

Populated with four categories. The 10–30% false-positive rate among triggered cases is a strong operational insight. Adequate.

## Overall

- **PASS with minor flag.** One flag:
  1. Gap 5's total biotech incubator count (50–100+) relies on a single list of 16 and extrapolation.
- The analysis correctly identifies the structural limitation (real tenants pass the check) and the narrow trigger scope (<1% of orders).
