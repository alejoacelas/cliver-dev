# 06F form-check v1 — m14-nfc-epassport

| Field | Verdict | Note |
|---|---|---|
| Gap 1 (no ePassport) | PASS | Cites Signicat 180-country figure. Size estimate reasonable. |
| Gap 2 (no NFC device) | PASS | Cites 94% NFC smartphone figure from ElectroIQ. Desktop-user consideration is good. |
| Gap 3 (non-PKD countries) | PASS | Cites Wikipedia/ICAO 107/193 participation figure. |
| Gap 4 (PA-only, no AA/CA) | PASS-with-caveat | Size is `[unknown ...]` with 3-query search list. The 30–50% best-guess is plausible but unsourced for the specific proportion. |
| Gap 5 (NFC UX failures) | PASS | `[best guess]` with reasoning about tap failure rates. |
| Gap 6 (non-chipped IDs) | PASS | Category precise; correctly notes US DL exclusion. |
| false_positive_qualitative | PASS | Limited FP profile correctly reflects that NFC is a signal-enhancer, not standalone. |
| Notes for stage 7 | PASS | Key insight that NFC is a layer within vendor IDV clearly stated. |

## Issues

1. **Gap 4 proportion:** The 30–50% PA-only estimate is the weakest-sourced figure. Acceptable as `[best guess]` but would benefit from vendor data on AA/CA support rates in future iterations.

## Verdict

PASS — proceed to 6C.
