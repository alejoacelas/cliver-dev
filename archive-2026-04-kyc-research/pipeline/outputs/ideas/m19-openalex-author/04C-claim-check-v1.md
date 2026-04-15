# 04C claim check — m19-openalex-author v1

## Claims verified

### STALE — rate limits and authentication

**Claim:** "standard tier 100,000 calls/day, max 10 requests/second"; "anonymous + optional `mailto=` polite pool"

**Cited URL:** https://docs.openalex.org/how-to-use-the-api/rate-limits-and-authentication (redirects to developers.openalex.org)

**What the URL actually says (April 2026):** OpenAlex now requires a free API key obtained from openalex.org account settings. Pricing is "freemium" with "$1 free every day." Free tier daily allowances:
- Single entity lookups: unlimited
- List + filter: 10,000 calls / 1M results
- Full-text search: 1,000 calls / 100k results
- Content downloads: 100 calls / 100 PDFs

The "100k calls/day, 10/sec, polite pool" model is the *old* model. The Google Group post cited as evidence of the change is real and the change has fully taken effect.

**Suggested fix:** Rewrite `endpoint_details` to reflect the current model: free API key required; per-customer screening uses single-entity lookups (unlimited free) plus optionally one filter/search call per customer (well within 10,000/day free).

### PASS — CC0 license

OpenAlex data is CC0 — confirmed broadly across openalex.org and the FAQ. No mis-citation.

### PASS — author object fields

Field list (id, orcid, display_name, affiliations, last_known_institutions, summary_stats.h_index, etc.) matches https://docs.openalex.org/api-entities/authors/author-object — verified through the developers.openalex.org docs.

### PASS — author disambiguation behavior

The disambiguation page exists and confirms the algorithm uses name + publication record + citation pattern + ORCID.

## Verdict

REVISE — one STALE claim (rate limits / auth model). The rest holds. Rewrite endpoint_details to reflect the current API key + freemium model.
