# Form check: m20-voucher-idv / 06-coverage-v1

## Schema field: `coverage_gaps`

| Gap | Category described? | Size estimated? | Citation/marker? | Behavior classified? | Issues |
|-----|-------------------|----------------|-------------------|---------------------|--------|
| Gap 1 (abandonment/friction) | Yes — precise | Yes — 20-40% senior academics | Cited (Jumio, Entrust) + [best guess] | false-positive | General IDV abandonment stats may not transfer directly to the voucher population |
| Gap 2 (unsupported documents) | Yes — precise | Yes — 10-20% non-US | Cited (Jumio global coverage) + [best guess] | false-positive | "2-5x higher false-reject" is a best guess without direct vendor data |
| Gap 3 (demographic bias) | Yes — precise | Yes — 3-10% | Cited (NIST FRVT) | false-positive | OK — strong citation |
| Gap 4 (privacy refusal) | Yes — precise | Marked [unknown] + [best guess] | [unknown] properly marked | no-signal | OK |
| Gap 5 (real ID attackers) | Yes — precise | Marked [unknown] | [unknown] properly marked | no-signal | OK |

## Schema field: `false_positive_qualitative`

Populated: yes. Cross-references all gaps. Provides cumulative friction estimate segmented by population.

## Completeness check

- All gaps have category, estimated size, behavior, and reasoning: **PASS**
- All estimates have either a citation or a `[best guess]`/`[unknown]` marker: **PASS**
- No bare numbers: **PASS**
- `false_positive_qualitative` refined: **PASS**
- Notes for stage 7 synthesis present: **PASS**

## Flags

1. **Gap 1 extrapolation** from general IDV abandonment rates (40-68%) to senior-academic vouchers (20-40%) is reasonable but explicitly speculative. The lower bound is generous; the actual refusal rate could be higher.
2. **Gap 2 false-reject differential** ("2-5x") is not cited. Vendor-specific FRVT data or vendor-published accuracy reports could substantiate this.

## Verdict: PASS with minor flags
