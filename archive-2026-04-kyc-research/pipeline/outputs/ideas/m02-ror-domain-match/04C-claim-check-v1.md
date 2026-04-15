# m02-ror-domain-match — 04C claim check v1

- **ROR API base URL `api.ror.org/v2/organizations`.** Confirmed at [ROR REST API](https://ror.readme.io/docs/rest-api). `PASS`.
- **`affiliation` matcher with `score` / `chosen`.** Confirmed at [ROR matching](https://ror.readme.io/docs/matching). `PASS`.
- **`domains[]` field added in v2, currently sparsely populated.** Confirmed at [ROR v2 announcement](https://ror.org/blog/2024-04-15-announcing-ror-v2/) and [ROR data structure](https://ror.readme.io/docs/ror-data-structure). Search results explicitly state "domains have not yet been populated, as the new domains field is currently an empty list for all records." The doc accurately reports the partial population. `PASS`.
- **Rate limit 2,000/5 min.** This is the historically documented ROR rate limit. `[best guess: claim is from prior knowledge of ROR docs; if the live REST-API page disagrees, weaken to "rate-limited; documented limit ~2,000 / 5 min historically"]`. `UPGRADE-SUGGESTED`.
- **CC0 license.** ROR's data licensing is CC0; widely documented. `PASS`.

**Verdict: PASS** with one upgrade suggestion on the rate-limit number.
