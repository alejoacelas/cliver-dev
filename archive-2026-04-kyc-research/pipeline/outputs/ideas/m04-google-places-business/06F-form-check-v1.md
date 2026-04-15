# Form check: m04-google-places-business — 06-coverage-v1

## Schema field: `coverage_gaps`

| Gap | Category described? | Estimated size cited? | Behavior labeled? | Issues |
|-----|--------------------|-----------------------|-------------------|--------|
| Gap 1: International sparse coverage | Yes | Partially — cites Google Maps stats (220+ countries, 2B users); gene synthesis regional revenue splits cited; coverage-thin fraction is [best guess: 10–20%] | no-signal | Best guess is reasonable but lacks a direct proxy for Places listing density by country. |
| Gap 2: New / stealth-mode labs | Yes | Partially — cites Google Business Profile listing timeline (1–2 weeks); 30–50% of sub-12-month startups is [best guess] | false-positive | The 30–50% estimate has no external citation. Flag: **thin proxy** — no data on what fraction of labs create a Google Business Profile. |
| Gap 3: Multi-tenant building mismatch | Yes | No — [unknown] properly admitted | weak-signal | Acceptable. |
| Gap 4: Security-conscious orgs | Yes | No — [unknown] properly admitted | false-positive | Acceptable. |
| Gap 5: Ambiguous international types | Yes | No — [unknown] properly admitted | weak-signal | Acceptable. |

## Schema field: `false_positive_qualitative`

Populated and cross-referenced to gaps. Adequate.

## Overall

- **PASS with minor flag.** One flag:
  1. Gap 2's estimate (30–50% of new startups lack a listing) is an ungrounded best guess. The direction is correct (many labs don't create Google Business Profiles) but the magnitude is speculative.
- Three gaps are [unknown] with search terms — this is honest and acceptable.
