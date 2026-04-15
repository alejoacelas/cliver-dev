# Form check: m16-order-time-stepup / 06-coverage-v1.md

## Schema field: `coverage_gaps`

| # | Gap name | Category precise? | Estimated size sourced? | Behavior labeled? | Reasoning present? | Verdict |
|---|---|---|---|---|---|---|
| 1 | Programmatic / API orders | Yes | [unknown] + [best guess] — search list provided but thin (2 queries, neither specifically about synthesis API ordering volume) | Yes (no-signal) | Yes | PASS — the [unknown] is honest; the best-guess range (10–30%) is plausible but unsupported |
| 2 | IdPs that don't honor max_age=0 | Yes | [best guess] with derivation from Okta Businesses at Work | Yes (weak-signal) | Yes | PASS |
| 3 | Shared / group accounts | Yes | [unknown] + [best guess] with Carnegie R1 count as anchor | Yes (weak-signal) | Yes | PASS |
| 4 | International federated SSO | Yes | Cited market share (Grand View, GM Insights) + [best guess] for federation fraction + [unknown] for upstream compliance | Yes (weak-signal to no-signal) | Yes | PASS |
| 5 | Mobile app / embedded WebView | Yes | [unknown] + [best guess] (<5%) | Yes (false-positive) | Yes | PASS — minor gap, honestly sized |

## Schema field: `false_positive_qualitative`

Refined list present? **Yes.** Cross-references gaps 1, 3, 4, 5. Carries forward stage 4 items. Adequate.

## Overall structure

- All five gaps follow the required format (category, estimated size, behavior, reasoning). **PASS.**
- Citations present where data exists; `[unknown]` and `[best guess]` markers used correctly. **PASS.**
- "Notes for stage 7 synthesis" section present. **PASS.**

## Flags

- **Flag 1 (minor):** Gap 1's search list could be broader — no query specifically targeted synthesis-provider API ordering statistics (e.g., "Twist Bioscience API order percentage", "IDT programmatic ordering volume"). The [unknown] is honest but the search effort is thin.
- **Flag 2 (minor):** Gap 4 cites market-share reports but the URLs are to landing pages, not to specific data points. The 55% North America figure should be attributed to a specific report edition/year.

## Verdict: **PASS with minor flags.**
