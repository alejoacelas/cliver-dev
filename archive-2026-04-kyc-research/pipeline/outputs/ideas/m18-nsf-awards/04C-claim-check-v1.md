# 04C claim check v1 — m18-nsf-awards

## Verified

- **NSF Award Search Web API URL** — confirmed; the canonical doc page is `resources.research.gov/common/webapi/awardapisearch-v1.htm` and the base API path is the `api.nsf.gov` host. PASS.
- **NSF coverage from 2007** — explicit on the NSF Award Search overview page. PASS.
- **NSF page cap of 25 / accuracy degraded past 3000** — explicit on the v1 docs. PASS.
- **UKRI GtR-2 docs URL** — `gtr.ukri.org/resources/gtrapi2.html` confirmed live. PASS.
- **UKRI Open Government License** — confirmed on `gtr.ukri.org/resources/about.html`. PASS.
- **CORDIS open data, CC BY** — confirmed on `cordis.europa.eu` and EU Open Data Portal. PASS.
- **CORDIS includes ERC PI sub-dataset** — confirmed in CORDIS Horizon 2020 / Horizon Europe dataset descriptions. PASS.

## Flags

- **MINOR / OVERSTATED** — UKRI `gtr.ukri.org/api/organisations` route is approximate; the docs use the `/gtr-api/organisations` style with content negotiation. **Suggested fix:** verify by re-fetching the GtR-2 PDF before publishing the v2 implementation; the route family is correct but the exact path may need adjustment.
- **UPGRADE-SUGGESTED** — `[unknown]` on NSF rate limit. The Research.gov API does not publish a number, but the GSA/NSF hackathon doc (linked in search results) and community CLI tools (`nsfsearch`) consistently use 1 req/s patterns. Could upgrade `[unknown]` to `[best guess: 1 req/s, by analogy to NIH and consistent with existing community CLI tools]`.

## Verdict

REVISE (minor). One route-name detail to verify in v2; one upgrade. No broken URLs.
