# Form check: m19-role-vs-scope / 06-coverage-v1

## Schema field: `coverage_gaps`

| Gap | Category described? | Size estimated? | Citation/marker? | Behavior classified? | Issues |
|-----|-------------------|----------------|-------------------|---------------------|--------|
| Gap 1 (industry roles) | Yes — precise | Yes — revenue proxy ~50% | Cited (Grand View Research) + [best guess] | weak-signal | Revenue-to-order-count conversion is a known weak proxy; acknowledged via [best guess] |
| Gap 2 (international norms) | Yes — precise | Yes — ~30-40% | Cited (Grand View Research) + [best guess] | weak-signal / false-positive | Size estimate is coarse; no direct data on international customer fraction of synthesis orders |
| Gap 3 (independent/community bio) | Yes — precise | Yes — <500 | Cited (PLOS ONE) + [best guess] | no-signal | OK |
| Gap 4 (core-facility staff) | Yes — precise | Partial — ~300-500 staff | [best guess] only | false-positive | No citation for R1 count or core-facility staffing; relies on general knowledge of Carnegie classification |
| Gap 5 (non-flagged orders) | Yes — precise | Yes — ~90-95% | Cited (Council on Strategic Risks) | no-signal | OK |

## Schema field: `false_positive_qualitative`

Populated: yes. Cross-references gaps. Adds one new item (international title mismatches) not in stage-4 list.

## Completeness check

- All gaps have category, estimated size, behavior, and reasoning: **PASS**
- All estimates have either a citation or a `[best guess]` marker: **PASS**
- No bare numbers: **PASS**
- `false_positive_qualitative` refined: **PASS**
- Notes for stage 7 synthesis present: **PASS**

## Flags

1. **Gap 4 size estimate lacks a citation** for R1 university count or core-facility prevalence. Suggest searching for Carnegie R1 count or a survey of university core facilities to back the ~300-500 figure.
2. **Gap 2 size estimate is coarse** — the 30-40% figure is derived from market revenue, not customer count. Mark more clearly as [best guess] or find a provider-reported international customer share.

## Verdict: PASS with minor flags
