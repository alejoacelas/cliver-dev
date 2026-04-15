# 04C claim check v1 — m18-lookalike-domain

Verified key empirical claims by web search/fetch (not exhaustively re-fetching every URL — focused on the form-check flagged items).

## Verified

- **dnstwist fuzzer classes** — github.com/elceef/dnstwist README does enumerate addition, bitsquatting, homoglyph, hyphenation, insertion, omission, repetition, replacement, subdomain, transposition, vowel-swap. PASS.
- **ROR data dump on Zenodo** — `doi:10.5281/zenodo.6347574` is the canonical concept DOI for the ROR data dump series. PASS. (Each release has its own DOI; the concept DOI redirects to the latest.)
- **crt.sh JSON output includes `not_before`** — confirmed by referenced DEV.to walkthrough and consistent with crt.sh's published JSON schema. PASS.
- **ROR records include `domains` field** — confirmed in ROR schema docs (`domains` array of strings, present in v2 schema). PASS.
- **UTS #39 / NFKC conflict** — the cited blog post (paultendo.github.io) is a real third-party analysis; it's a blog rather than an authoritative source, so this is OVERSTATED if used as a primary citation but FINE as a corroborating link. Document already treats it as "needs both forms checked," which matches.

## Flags

- **OVERSTATED** — Claim "ROR REST API ~2000 req/5min soft limit". The current ROR docs at `ror.readme.io` describe a rate limit but the exact "2000 req/5min" number should be re-verified — ROR has documented rate limits in the past as 2000/5min for v1, but v2 may differ. **Suggested fix:** soften to "rate-limited (low thousands of requests per 5-minute window per the public docs); exact ceiling has changed across API versions" and link to `https://ror.readme.io/docs/rest-api`.
- **UPGRADE-SUGGESTED** — `[best guess]` on "~30% of ROR records lack `domains`". A real number is computable from the dump itself (one-shot script) and probably published in ROR's blog. Suggested search: "ROR records with domain coverage statistics", "ROR dump field coverage".

## Verdict

REVISE (minor). One overstatement on rate limits and one best-guess that has a known computable answer. Document is otherwise well-sourced and salvageable.
