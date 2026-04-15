# Form check: m18-cross-shell-graph / 06-coverage-v1

## Checklist

| Field | Status | Notes |
|---|---|---|
| Coverage gaps present | PASS | 6 gaps identified |
| Each gap has precise category | PASS | |
| Each gap has estimated size | PASS | All have citations or `[best guess]` with reasoning |
| Each gap has behavior classification | PASS | |
| Each gap has reasoning | PASS | |
| Citations or `[unknown]`/`[best guess]` on every number | PASS | |
| Refined false-positive qualitative | PASS | |
| Notes for stage 7 | PASS | |

## Flags

1. **Gap 1 cold-start threshold ("500 screened customers") is a bare best guess.** No proxy is cited for what graph density is needed for cross-shell detection to become effective. Consider citing literature on entity-resolution graph density thresholds or FinCEN beneficial-ownership graph analogs.

2. **Gap 6 mentions "Cloudflare proxies ~20% of all websites" without a citation.** This is a widely known figure but should be sourced (e.g., W3Techs or Cloudflare's own reporting).

## Verdict

**PASS with minor flags.** The analysis correctly identifies that this idea's coverage is structurally different from the other m18 ideas — it's a second-order check whose effectiveness depends on history depth and fingerprint richness rather than on a specific registry's population.
