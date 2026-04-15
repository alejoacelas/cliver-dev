# 04C claim check — m09-clinicaltrials-fda v1

## Claims verified

1. **CT.gov v2 is REST + OpenAPI 3.0, no auth required.** Cited URL: https://clinicaltrials.gov/data-api/api. Verified via search results — the NLM Technical Bulletin and the official API page describe v2 as a REST API using OpenAPI 3.0 ([source](https://www.nlm.nih.gov/pubs/techbull/ma24/ma24_clinicaltrials_api.html)). PASS.

2. **Lead sponsor field path `protocolSection.sponsorCollaboratorsModule.leadSponsor.name`.** Search results explicitly confirm this path. PASS.

3. **openFDA device registration endpoint exists.** Cited URL: https://open.fda.gov/apis/device/registrationlisting/. Confirmed by openFDA API directory. PASS.

4. **FDA establishment database updated weekly.** Search results confirm "The database is updated once a week" and "updated weekly, usually every Monday." PASS.

5. **openFDA quotas (240 req/min, 120k req/day with API key).** Marked `[best guess]` in the document. The openFDA APIs landing page is the canonical source; the specific numbers should be confirmed against https://open.fda.gov/apis/authentication/ — flagged as UPGRADE-SUGGESTED.

## Flags

- **UPGRADE-SUGGESTED** — openFDA rate-limit numbers are `[best guess]` but a real source exists. Suggested fix: cite openFDA's authentication / rate-limit page directly (https://open.fda.gov/apis/authentication/).
- **UPGRADE-SUGGESTED** — CT.gov rate limit marked as `[unknown]`. NLM does publish e-utility-style guidance; could try one more query like "ClinicalTrials.gov API throttle limit per IP".

No BROKEN-URL, MIS-CITED, OVERSTATED, or STALE flags.

**Verdict:** REVISE (two upgrade-suggested items). Document is salvageable as-is; v2 not strictly required.
