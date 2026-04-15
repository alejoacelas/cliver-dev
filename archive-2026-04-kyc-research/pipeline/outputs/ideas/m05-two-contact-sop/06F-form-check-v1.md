# Form check: m05-two-contact-sop — 06-coverage-v1

## Schema field: `coverage_gaps`

| Gap | Category described? | Estimated size cited? | Behavior labeled? | Issues |
|-----|--------------------|-----------------------|-------------------|--------|
| Gap 1: Industry customers | Yes | Partially — cites GM Insights for industry revenue share (46–52%); 50–70% refusal rate is [best guess] | false-positive | The 50–70% refusal rate for corporate switchboards is a reasonable but uncited estimate. Flag: **key best-guess without derivation**. |
| Gap 2: Privacy-suppressed directories | Yes | Partially — cites Precedence Research for EU market share (22%); 30–50% GDPR suppression rate is [best guess] | false-positive | The GDPR directory suppression fraction (30–50%) is ungrounded. Flag: **key best-guess without derivation**. |
| Gap 3: Language barriers | Yes | Partially — cites revenue splits; 40–60% language barrier rate is [best guess] | weak-signal | Acceptable as best guess with reasoning. |
| Gap 4: Single-PI labs | Yes | [unknown] with search terms; 10–20% is [best guess] | false-positive | Acceptable. |
| Gap 5: Institutions refusing verification | Yes | [unknown] with search terms; 5–15% is [best guess] | false-positive | FERPA reference is relevant but not directly applicable to faculty. Acceptable. |
| Gap 6: Scalability | Yes | Yes — derives from 04-implementation's time estimates | no-signal | Well-grounded. |

## Schema field: `false_positive_qualitative`

Populated with five categories and a combined coverage estimate (40–60% of academic customers). Strong operational insight.

## Overall

- **PASS with minor flags.** Two flags:
  1. Gap 1's corporate refusal rate (50–70%) is ungrounded.
  2. Gap 2's GDPR directory suppression rate (30–50%) is ungrounded.
- Both estimates are directionally important — the SOP's academic-governance assumption is the core issue — but the specific percentages are speculative.
- The analysis correctly identifies that the SOP works well within its coverage boundary but that boundary is narrower than it appears.
