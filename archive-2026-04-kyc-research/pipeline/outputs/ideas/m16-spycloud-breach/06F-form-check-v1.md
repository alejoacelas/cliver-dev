# Form check: m16-spycloud-breach / 06-coverage-v1.md

## Schema field: `coverage_gaps`

| # | Gap name | Category precise? | Estimated size sourced? | Behavior labeled? | Reasoning present? | Verdict |
|---|---|---|---|---|---|---|
| 1 | Zero-day / real-time phishing | Yes | [best guess] with SpyCloud 61% stat | Yes (no-signal) | Yes | PASS |
| 2 | Breaches not ingested by vendor | Yes | Cited HIBP FAQ + SpyCloud data page; [best guess] 40–70% | Yes (no-signal) | Yes | PASS |
| 3 | Unique high-entropy passwords | Yes | [best guess] with Bitwarden survey cite | Yes (no-signal, correct) | Yes — noted as non-gap | PASS — borderline inclusion but justified |
| 4 | Non-Western regional coverage | Yes | Cited GM Insights + KELA + Twilight Cyber; [unknown] for tail regions | Yes (weak-signal) | Yes | PASS |
| 5 | Already-rotated passwords (email-only) | Yes | Cited Verizon DBIR + Sentinelone; [best guess] 30–50% | Yes (false-positive, mild) | Yes | PASS |
| 6 | Institutional service accounts | Yes | [unknown] + [best guess] 5–10% | Yes (weak-signal) | Yes | PASS |

## Schema field: `false_positive_qualitative`

Refined list present? **Yes.** Five items, cross-references gaps. Adequate.

## Overall structure

- Six gaps, all following required format. **PASS.**
- Citations present and correctly attributed. **PASS.**
- "Notes for stage 7 synthesis" section present. **PASS.**

## Flags

- **Flag 1 (minor):** Gap 3 (unique high-entropy passwords) is not really a coverage gap — the check is working as intended for these customers. Including it "for completeness" dilutes the list. Consider removing or moving to a "non-gap clarification" section.
- **Flag 2 (minor):** The [best guess] of 40–70% vendor corpus coverage in Gap 2 is a wide range with no supporting derivation beyond "any single vendor." Could be tightened with a comparison of HIBP's known breach count vs. estimated total breaches.

## Verdict: **PASS with minor flags.**
