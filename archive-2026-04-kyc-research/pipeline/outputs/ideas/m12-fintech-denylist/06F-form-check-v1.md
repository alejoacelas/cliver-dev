# Form check: m12-fintech-denylist / 06-coverage-v1

## Schema field coverage

- **coverage_gaps:** Populated. Five gaps with category, size, behavior, reasoning. PASS.
- **false_positive_qualitative (refined):** Populated. Three items. PASS.

## Per-gap assessment

| Gap | Category precise? | Size cited or marked? | Behavior classified? | Verdict |
|-----|---|---|---|---|
| 1: Legit small biotechs | Yes — specifies 1–50 employee startups, names Mercury/Brex | Cites Mercury 300k customers, Kruze data on startup banking; [best guess: 10–25%] | Yes — false-positive | PASS |
| 2: BIN sponsor churn | Yes — names Mercury/Evolve/Choice/Column transition | Cites Banking Dive source; [best guess: 1–3 year cycles] | Yes — no-signal | PASS |
| 3: International fintechs | Yes — names Wise, Revolut, N26 | Derived from market share; [best guess: 5–10%]; partially marked [unknown] | Yes — no-signal | PASS |
| 4: VCNs from different BIN ranges | Yes — specifies virtual vs physical BIN pools | Marked [unknown — searched for] | Yes — no-signal | PASS |
| 5: P-cards from fintech-adjacent sponsors | Yes — names Evolve, Pathward | [best guess: 1–3%] | Yes — false-positive | PASS |

## Flags

- **No bare numbers.** All estimates cited, derived, or marked. PASS.
- **Gap 1 estimate (10–25%)** is the most consequential number in the document and is a [best guess]. The reasoning is plausible (Mercury/Brex penetration in startup ecosystem) but the range is wide and the overlap with DNA-synthesis-specific commercial customers is not directly sourced. MINOR flag.
- **Gap 3** acknowledges that international BIN searches were not performed ("not searched in this round"). The search list is thin. MINOR flag.

## Overall verdict

PASS with 2 MINOR flags.
