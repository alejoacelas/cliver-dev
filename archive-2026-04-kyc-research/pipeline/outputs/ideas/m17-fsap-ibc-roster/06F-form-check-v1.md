# Form check: m17-fsap-ibc-roster / 06-coverage-v1.md

## Schema field: `coverage_gaps`

| # | Gap name | Category precise? | Estimated size sourced? | Behavior labeled? | Reasoning present? | Verdict |
|---|---|---|---|---|---|---|
| 1 | Commercial biotech without IBC/FSAP | Yes | Cited Credence Research + FSAP annual report; [best guess] 30–40% | Yes (no-signal) | Yes | PASS |
| 2 | Foreign institutions | Yes | Cited GM Insights; [best guess] 40–50% | Yes (no-signal) | Yes | PASS |
| 3 | US academic without NIH-funded rDNA work | Yes | [unknown] for IBC count + [best guess] with NCES anchor | Yes (no-signal) | Yes | PASS |
| 4 | Out-of-scope researchers at IBC institutions | Yes | [unknown] + [best guess] 30–50% | Yes (false-positive) | Yes | PASS |
| 5 | BSO responsiveness / data freshness | Yes | [unknown] + [best guess] 10–20% stale | Yes (weak-signal) | Yes | PASS |
| 6 | FSAP not public (structural) | Yes | Cited FSAP annual report (230 entities); cost estimate | Yes (weak-signal) | Yes | PASS |

## Schema field: `false_positive_qualitative`

Refined list present? **Yes.** Four items. Cross-references gaps and stage 4. Adequate.

## Overall structure

- Six gaps, all following required format. **PASS.**
- The stage 7 notes make a strong point about the combined coverage gap. **PASS.**
- Citations present. **PASS.**

## Flags

- **Flag 1 (minor):** Gap 3's estimate that IBC-RMS covers "50–70% of US academic synthesis customers" would benefit from a more explicit derivation — the jump from "400–600 institutions" to "50–70% of US academic customers" assumes synthesis-ordering correlates with R1/R2 status, which is plausible but unstated.
- **Flag 2 (minor):** Gap 4's 30–50% out-of-scope fraction is a wide range with no supporting data. The [unknown] marker is appropriate, but the best-guess could note whether this is the fraction of researchers or the fraction of orders.

## Verdict: **PASS with minor flags.**
