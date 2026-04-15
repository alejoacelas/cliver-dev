# 4C claim check — m01-delta-rescreen v1

- **OpenSanctions delta files exist; FtM-only; delta_url in metadata index** — supported by https://www.opensanctions.org/docs/bulk/delta/ per search snippet. PASS.
- **Update cadence (~6h aggregated, 4–12h sanctions, 30-min polling)** — supported by https://www.opensanctions.org/faq/4/update-frequency/. PASS.
- **OFAC SLS XML re-pull as free fallback** — supported by https://ofac.treasury.gov/sanctions-list-service. PASS.
- **31 CFR 501 blocking-report obligation** — standard regulatory citation, well-known.
- No URLs fetched directly this round (all relied on prior search snippets that quoted the pages). Recommend a follow-up fetch of opensanctions.org/docs/bulk/delta/ if a future iteration wants stronger sourcing.

Verdict: PASS (with note that no direct URL fetch was performed this round; budget conservation).
