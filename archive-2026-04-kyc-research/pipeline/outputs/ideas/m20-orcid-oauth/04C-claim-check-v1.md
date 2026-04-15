# 4C claim check — m20-orcid-oauth v1

## Per-claim findings

- **ORCID OAuth scopes FAQ URL** — resolves; supports the scope list and the JSON token example verbatim. **No flag.**
- **ORCID Custom Integration Guide** — resolves; supports authorization URL pattern and OIDC support. **No flag.**
- **ORCID-Source orcid-api-web README** — resolves; documents v3.0 endpoints. **No flag.**
- **ORCID Membership benefits page** — resolves; confirms Public API is free and Member API requires paid membership. **No flag.**
- **ORCID-CA pricing page** — resolves; references CRKN-administered Canadian consortium fees. The doc's "≈ $3,500 CAD/year" is approximate; actual fee depends on institution tier. → `OVERSTATED` (mild) — recommend the doc weaken to "consortium fees in the low-thousands CAD/year, exact tier varies."
- **UK ORCID Consortium pricing FAQ 2024 (PDF)** — resolves; confirms UK tiered pricing exists. **No flag.**
- **Toulouse adoption study** — resolves; the 41.8% number is from this article. **No flag.**
- **Frontiers 2022 ORCID coverage paper** — resolves; supports the institution-coverage variability claim. **No flag.**

## Direct US ORCID membership pricing

The doc states "$1,250–$5,500/year for direct US membership" without a US-specific citation. This is not directly substantiated by the cited UK and Canadian sources. → `MISSING-CITATION` (recommend either find the ORCID US Community public page that lists tiers, or weaken to "low-thousands USD/year per direct ORCID Member ID, varies by org size; consortium pricing typically lower" with [vendor-gated]).

## Rate-limit unknown

The doc lists "24/sec / 60-burst" inside the [unknown] admission, which is somewhat self-contradictory (an [unknown] should not contain unsourced numerics). Suggest: either remove the numerics from inside the [unknown] block, or move them out and cite ORCID's public rate-limit page if findable. → `MIS-CITED` (mild — the numerics live in the wrong field).

## Suggested fixes (low priority)

1. Weaken or cite the direct-US membership price band.
2. Clean up the rate-limit [unknown] block — either source the numerics or remove them.

**Verdict:** REVISE (cosmetic — both fixes one-liners)
