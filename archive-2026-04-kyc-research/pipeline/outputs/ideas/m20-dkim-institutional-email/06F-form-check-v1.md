# Form check: m20-dkim-institutional-email / 06-coverage-v1

## Schema field: `coverage_gaps`

| Gap | Category described? | Size estimated? | Citation/marker? | Behavior classified? | Issues |
|-----|-------------------|----------------|-------------------|---------------------|--------|
| Gap 1 (misconfigured DKIM) | Yes — precise | Yes — 5-15% | Cited (dmarcchecker, Valimail) + [best guess] | false-positive | OK |
| Gap 2 (non-OECD infrastructure) | Yes — precise | Yes — 10-15% | Cited (AFNIC .fr data) + [best guess] | false-positive | .fr data used as proxy for non-OECD; acknowledged as best guess |
| Gap 3 (forwarding/mailing-list) | Yes — precise | Yes — 5-10% | Cited (DMARCReport) + [best guess] | false-positive | OK |
| Gap 4 (real institutional access) | Yes — precise | Marked [unknown] | [unknown] properly marked | no-signal | OK |
| Gap 5 (cloud-hosted DKIM) | Yes — precise | Yes — 5-10% | [best guess] | false-positive | No direct citation for misconfiguration rate |

## Schema field: `false_positive_qualitative`

Populated: yes. Cross-references gaps. Provides cumulative estimate. No bare numbers.

## Completeness check

- All gaps have category, estimated size, behavior, and reasoning: **PASS**
- All estimates have either a citation or a `[best guess]`/`[unknown]` marker: **PASS**
- No bare numbers: **PASS**
- `false_positive_qualitative` refined: **PASS**
- Notes for stage 7 synthesis present: **PASS**

## Flags

1. **Gap 5 size estimate** (5-10% of institutional mail domains with cloud-hosted DKIM misconfiguration) has no direct citation. A search for Google Workspace custom DKIM configuration adoption rates among universities could strengthen this.
2. **Cumulative false-positive estimate** (15-25% globally) could be more carefully derived from the individual gap estimates, accounting for overlap between gaps.

## Verdict: PASS with minor flags
