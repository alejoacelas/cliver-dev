# Form check: m18-gleif / 06-coverage-v1

## Checklist

| Field | Status | Notes |
|---|---|---|
| Coverage gaps present | PASS | 5 gaps identified |
| Each gap has precise category | PASS | |
| Each gap has estimated size | PASS (3/5 cited, 2 `[unknown]` with search terms) | |
| Each gap has behavior classification | PASS | |
| Each gap has reasoning | PASS | |
| Citations or `[unknown]`/`[best guess]` on every number | PASS | |
| Refined false-positive qualitative | PASS | Cross-referenced to gaps |
| Notes for stage 7 | PASS | Clear articulation of the financial-sector vs research-sector mismatch |

## Flags

1. **Gap 4 size estimate ("20–40% of LEI records") is a best guess with no cited proxy.** The analysis searched for aggregate reporting-exception counts and correctly marked the result as `[unknown]`. However, a rough proxy could be derived from the GLEIF bulk download — the Level-2 file is "smaller" than the Level-1 file (per the implementation), which is consistent with many entities not reporting parents.

2. **Gap 5 ("10–20% of lookups fail name matching") is a best guess without a derivation.** Consider citing entity-resolution literature on name-matching recall rates for corporate registries.

## Verdict

**PASS with minor flags.** The central insight — that GLEIF is a financial-sector tool with near-zero coverage of the academic majority of synthesis customers — is well-supported and clearly stated.
