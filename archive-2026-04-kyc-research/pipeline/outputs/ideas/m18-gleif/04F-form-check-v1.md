# m18-gleif — Form check v1

**Document under review:** `04-implementation-v1.md`

## Field verdicts

### name
**PASS.** "GLEIF LEI lookup + Level-2 relationships" — specific.

### measure
**PASS.** M18 (institution-legitimacy-soc).

### attacker_stories_addressed
**PASS.** Detailed per-story analysis covering 12 attacker branches. Correctly identifies the LEI coverage gap as the structural weakness.

### summary
**PASS.** Clear description of the check mechanism and its intended signal.

### external_dependencies
**PASS.** GLEIF API, Level-2 RR-CDF, bulk download, institution name normalization, concern-jurisdiction list — all named. ROR cross-referenced for name normalization.

### endpoint_details
**PASS.** Detailed. Base URL, five key API endpoints documented with paths. Auth (anonymous), rate limit (60 req/min), pricing (free), data freshness (daily), ToS (open license), bulk download format and URL all documented with citations.

### fields_returned
**PASS.** Comprehensive. Level 1 fields (16 fields listed), Level 2 relationship fields (6 fields), and reporting exceptions (2 fields) all documented. Reporting exceptions are flagged as signal-bearing, which is a good analytical observation.

### marginal_cost_per_check
**PASS.** $0 marginal with setup cost estimated at $10K–$20K. Breakdown includes API, bulk download, and name-matching overhead.

### manual_review_handoff
**PASS.** SOP with five flag types and decision trees. Correctly notes that `no_lei` is not a standalone rejection signal. Integration with other m18 ideas noted.

### flags_thrown
**PASS.** Six distinct flags with actions and severity context.

### failure_modes_requiring_review
**PASS.** Five modes documented: LEI coverage gap for research institutions, name matching ambiguity, Level-2 coverage gaps, rate limit constraint, jurisdictional bias. The coverage gap analysis is the most important.

### false_positive_qualitative
**PASS.** Four categories. Correctly identifies no-LEI research institutions as the dominant false-positive source.

### record_left
**PASS.** GLEIF API response, parent-chain snapshot, name-match details, concern-jurisdiction match, denylist version, reviewer memo all documented.

## Borderline observations

1. The claim "fewer than 5% of US R1 universities have LEIs" is marked `[best guess]` — this is an important claim for understanding the check's coverage and should ideally be checked by 4C. It may be possible to search GLEIF directly for university names to establish an empirical figure.

2. The reporting-exceptions analysis is insightful: the document correctly notes that a `NON_CONSOLIDATING` filing by a shell company avoids parent disclosure. But the document does not discuss how frequently small commercial entities actually file reporting exceptions vs. simply not having an LEI at all. The practical import of this signal may be overstated.

3. The document does not discuss **LEI registration fraud** — could an attacker obtain a LEI for a shell entity to make it appear more legitimate? LEI issuers (LOUs) perform their own validation, but the rigor varies. This could be a failure mode worth noting.

## For 4C to verify

- GLEIF API base URL and endpoint paths (api.gleif.org/api/v1/).
- Rate limit claim (60 requests/minute).
- Active LEI population ~2.8 million as of Q2 2025.
- GLEIF data is free and open under GLEIF Data License.
- Bulk download availability at the documented URL.
- Level-2 RR-CDF v2.1 format for relationship records.
- LEI adoption growth driven by DORA and MiFID II.

## Verdict

**PASS.** All required fields are populated with substantive content and sourcing markers. The borderline observations are analytical refinements, not completeness gaps.
