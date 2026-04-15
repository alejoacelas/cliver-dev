# Form check: m17-predecessor-reidv / 06-coverage-v1.md

## Schema field: `coverage_gaps`

| # | Gap name | Category precise? | Estimated size sourced? | Behavior labeled? | Reasoning present? | Verdict |
|---|---|---|---|---|---|---|
| 1 | IDV friction / abandonment | Yes | Cited Bynn, Jumio, Veratad (38–80% ranges); [best guess] 10–25% | Yes (false-positive) | Yes | PASS |
| 2 | Non-OECD document support | Yes | Cited Veriff, Didit (195–230 countries); [best guess] 5–10% | Yes (weak-signal / false-positive) | Yes | PASS |
| 3 | Legitimate handoff volume | Yes | Cited PNAS (3% tenure rate); [best guess] 10–20% per year | Yes (false-positive) | Yes | PASS |
| 4 | Shared core-facility accounts | Yes | [best guess] 5–15% | Yes (weak-signal) | Yes | PASS |
| 5 | Sophisticated attackers with documents | Yes | [unknown] for deepfake bypass rate | Yes (weak-signal) | Yes | PASS |
| 6 | Privacy / biometric law constraints | Yes | [best guess] 30–50% in covered jurisdictions | Yes (false-positive / no-signal) | Yes | PASS |

## Schema field: `false_positive_qualitative`

Refined list present? **Yes.** Six items. Cross-references gaps and stage 4. Adequate.

## Overall structure

- Six gaps, all following required format. **PASS.**
- Citations present where available. **PASS.**
- "Notes for stage 7 synthesis" section present with insightful framing. **PASS.**

## Flags

- **Flag 1 (minor):** Gap 1 cites retail banking abandonment data (38–80%) then estimates 10–25% for synthesis context. The downward adjustment is reasonable but the justification ("scientists are more motivated") could be more rigorous — a citation to B2B SaaS or enterprise-onboarding friction data would be closer than retail banking.
- **Flag 2 (minor):** Gap 5 has [unknown] for deepfake bypass rate with no search-list provided. Should include what was searched for.

## Verdict: **PASS with minor flags.**
