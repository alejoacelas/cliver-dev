# Form check: m12-pcard-bin / 06-coverage-v1

## Schema field coverage

- **coverage_gaps:** Populated. Five gaps with category, size, behavior, reasoning. PASS.
- **false_positive_qualitative (refined):** Populated. Three items with cross-references. PASS.

## Per-gap assessment

| Gap | Category precise? | Size cited or marked? | Behavior classified? | Verdict |
|-----|---|---|---|---|
| 1: Personal-card institutional researchers | Yes — specifies reimbursement workflow | [best guess: 15–30%]; marked [unknown — searched for] | Yes — false-positive | PASS |
| 2: BIN-attribute data accuracy | Yes — specifies third-party vs VBASS | Cites Pagos 32% accuracy stat; [best guess: 10–20% unreliable] | Yes — no-signal | PASS |
| 3: VCNs from P-card platforms | Yes — names JPM, US Bank, Citi VCN products | [best guess: 5–10%]; marked [unknown] | Yes — no-signal | PASS |
| 4: Non-US institutional cards | Yes — specifies non-US P-card model absence | Derived from market share; [best guess: 30–40% of orders] | Yes — no-signal | PASS |
| 5: Non-institutional commercial cardholders | Yes — specifies curiosity-driven small businesses | [best guess: 1–3%] | Yes — false-corroboration | PASS |

## Flags

- **No bare numbers.** All estimates cited, derived, or marked. PASS.
- **Gap 1 estimate (15–30%)** is the most consequential and is a [best guess] with thin sourcing. The search did not return aggregate data. MINOR flag.
- **Gap 2 cites a Pagos stat** (32% third-party accuracy) which is a strong data point. However, this stat compares third-party data to Visa's own data across *all* attributes — the commercial/consumer classification specifically may be more or less accurate. MINOR flag — the caveat should be noted.
- **Gap 5 uses "false-corroboration"** as a behavior classification, which is not one of the three standard categories (no-signal / false-positive / weak-signal). This is an appropriate extension for a corroborative-only check but deviates from the template. MINOR flag.

## Overall verdict

PASS with 3 MINOR flags.
