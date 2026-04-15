# Form check: m12-billing-shipping-consistency / 06-coverage-v1

## Schema field coverage

- **coverage_gaps:** Populated. Six gaps identified with category, size, behavior, reasoning. PASS.
- **false_positive_qualitative (refined):** Populated. Five items with cross-references. PASS.

## Per-gap assessment

| Gap | Category precise? | Size cited or marked? | Behavior classified? | Verdict |
|-----|---|---|---|---|
| 1: Multi-campus universities | Yes — names UC, SUNY, national labs | Derived from market share + system enrollment; [best guess: ~20%] | Yes — false-positive | PASS |
| 2: Visiting researchers | Yes — specifies sabbatical, visiting appointment | Cites 300k visiting scholars; derives 2–5% of academic base | Yes — false-positive | PASS |
| 3: Distributed pharma/biotech | Yes — names large pharma companies | Cites 5,500 pharma companies; [best guess: ~14% of orders] | Yes — false-positive | PASS |
| 4: Driving-distance attacker | Yes — specifies inbox-compromise Method 1 | No demographic size (adversarial, not demographic); acknowledged | Yes — no-signal | PASS |
| 5: Missing billing address | Yes — specifies Apple Pay, ACH | [unknown — searched for]; [best guess: 5–15%] | Yes — weak-signal | PASS |
| 6: International normalization | Yes — specifies non-OECD countries | Derived from market share; [best guess: 5–7%] | Yes — weak-signal | PASS |

## Flags

- **No bare numbers.** All estimates cited, derived, or marked. PASS.
- **Gap 1 estimate chain** (54% academic × 40% multi-campus = ~20%) is plausible but the 40% multi-campus figure is a [best guess] without direct citation. The reasoning is sound but the number is not sourced. MINOR flag.
- **Gap 4** is an adversarial bypass rather than a demographic coverage gap. Including it is defensible (the implementation doc flags it) but it is more of a stage-5 finding than a stage-6 finding. MINOR flag.

## Overall verdict

PASS with 2 MINOR flags.
