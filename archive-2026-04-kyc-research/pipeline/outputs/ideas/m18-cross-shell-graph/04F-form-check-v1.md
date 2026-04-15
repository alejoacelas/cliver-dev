# m18-cross-shell-graph — Form check v1

**Document under review:** `04-implementation-v1.md`

## Field verdicts

### name
**PASS.** "Cross-shell rotation graph" — descriptive.

### measure
**PASS.** M18 (institution-legitimacy-soc).

### attacker_stories_addressed
**PASS** — inherited from `00-spec.md` and refined. However, stage 4 should have produced an explicit per-branch attacker analysis as the other ideas do. The existing analysis is adequate but less structured than peers.

### summary
**PASS.** Clear description of fingerprint-node graph and ≥2-fingerprint collision threshold.

### external_dependencies
**PASS.** Eight external sources named (internal graph store, Companies House, OpenCorporates, GLEIF Level 2, Censys, crt.sh/SSLMate, WHOIS/RDAP, NIH RePORTER, internal screening history). Each linked to documentation or sibling ideas.

### endpoint_details
**PASS.** Companies House officers and PSC endpoints documented with API paths, auth (free API key), rate limit (600/5min), and bulk PSC snapshot URL. OpenCorporates deferred to sibling idea. GLEIF API and bulk download documented with URLs. Censys documented with URL, auth (API key), pricing marked `[vendor-gated]`. crt.sh documented with JSON URL and PostgreSQL access, rate limits marked `[best guess]`. SSLMate pricing documented ($1,000/month).

### fields_returned
**PASS.** Twelve fingerprint types listed with sources. Edge types documented. This is a design specification more than a raw API field list, but it is appropriate for a graph-construction idea.

### marginal_cost_per_check
**PASS.** Per-source breakdown ($0 for CH/GLEIF/crt.sh/NIH; OpenCorporates `[best guess: $0.05–$0.50]`; Censys `[best guess: $0.01–$0.10]`). Composite `[best guess: $0.10–$1]`. Setup cost `[best guess: $80K–$300K]` and storage cost `[best guess: <$500/month]`.

### manual_review_handoff
**PASS.** Seven-step playbook with per-fingerprint-type signal weighting (mass-formation discount, shared-officer medium-to-high, shared CT cert very high, etc.). "Two or more independent fingerprint matches" escalation rule documented.

### flags_thrown
**PASS.** Seven distinct flags, each mapped to a fingerprint type. Mass-formation discount noted.

### failure_modes_requiring_review
**PASS.** Eight modes: mass-formation noise, shared-PI false positives, common-name collisions, CH PSC redaction, OpenCorporates staleness, hosting noise, cold-start, fuzzy-matching tuning.

### false_positive_qualitative
**PASS.** Five categories: incubator co-tenants, spinouts, consortium members, common names, acquired companies.

### record_left
**PASS.** Graph query result, matched edges, reviewer memo, mass-formation-discount list version, append-only history for audit reconstruction.

## Borderline observations

1. **Setup cost range is very wide** ($80K–$300K). This is honest but may signal that the engineering scope is poorly defined. The document would benefit from separating the cost into components (graph schema: $X, ingestion pipelines: $Y, fuzzy matching: $Z).

2. **OpenCorporates is deferred to a sibling idea** ("see m18-companies-house-charity idea") but the sibling idea is not linked with a file path. If the sibling doesn't exist, this is a dangling reference.

3. The document lacks an explicit `attacker_stories_addressed` section in the same structured format as other stage 4 outputs. The summary mentions cro-identity-rotation, shell-company rotation, and CRO-framing, but does not walk through each branch with direct/partial/NOT verdicts.

## For 4C to verify

- Companies House officers API endpoint path and reference URL.
- Companies House PSC API endpoint path and reference URL.
- Bulk PSC snapshot download URL (download.companieshouse.gov.uk).
- GLEIF Level 2 page URL and concatenated file download URL.
- GLEIF API URL (api.gleif.org/api/v1/).
- Censys pricing page URL.
- crt.sh JSON output URL format.
- SSLMate CT search API pricing ($1,000/month, $100/month provisioned).
- Companies House rate limit (600 requests / 5 min).

## Verdict

**PASS.** All required fields are populated with substantive content. The borderline observations are structural refinements. The wide setup cost range and the missing structured attacker-story analysis are the weakest points but do not rise to REVISE.
