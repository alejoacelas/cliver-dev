# m19-openalex-author — Implementation v1

- **measure:** M19
- **name:** OpenAlex author + affiliation history lookup
- **modes:** A
- **summary:** Resolve the customer (claimed researcher) to an OpenAlex Author ID via name + claimed institution + (optionally) ORCID. Pull `affiliations` (year-by-year institutional history), `last_known_institutions`, `works_count`, `cited_by_count`, `summary_stats.h_index`, and `orcid`. Verify the claimed institution appears in the author's recent affiliation history and that the publication footprint is consistent with the customer's claimed seniority and research area.

## external_dependencies

- **OpenAlex REST API** (operated by OurResearch, a US 501(c)(3)). Free tier sufficient at the volume of customer screening, with optional paid Premium tier for SLAs and higher throughput. [source](https://docs.openalex.org/how-to-use-the-api/rate-limits-and-authentication)
- No other vendor required for the core lookup. ROR IDs are embedded in OpenAlex institution records, so an institution-name claim can be normalized via OpenAlex itself.

## endpoint_details

- **Base URL:** `https://api.openalex.org/authors` and `https://api.openalex.org/authors/{id}`. [source](https://docs.openalex.org/api-entities/authors)
- **Search by name:** `GET /authors?search=<name>&filter=last_known_institutions.id:<openalex_inst_id>` or `?filter=affiliations.institution.ror:<ror_id>`. [source](https://docs.openalex.org/api-entities/authors/search-authors)
- **Single author:** `GET /authors/A1234567` or `GET /authors/orcid:0000-0001-2345-6789`. [source](https://docs.openalex.org/api-entities/authors/get-a-single-author)
- **Auth model:** as of 2025, OpenAlex requires a free API key obtained by creating an account at openalex.org and retrieving the key from settings; key is passed as a request parameter. The previous anonymous + `mailto=` "polite pool" was discontinued. [source](https://developers.openalex.org/how-to-use-the-api/rate-limits-and-authentication) [source](https://groups.google.com/g/openalex-users/c/rI1GIAySpVQ)
- **Rate limits / freemium tier:** "$1 free every day" usage credit. Free-tier daily allowances: unlimited single-entity lookups (i.e. `GET /authors/{id}`), 10,000 list/filter calls returning up to 1M results, 1,000 full-text search calls. Beyond the free credit, usage is billed. [source](https://developers.openalex.org/how-to-use-the-api/rate-limits-and-authentication)
- **Pricing:** freemium with $1/day free; per-call/per-result pricing beyond that. Bulk-data snapshot remains free. [vendor-gated — exact per-call rates beyond the $1/day free credit are described in the API Reference but specific $/unit not extracted here](https://developers.openalex.org/how-to-use-the-api/rate-limits-and-authentication)
- **ToS constraints:** OpenAlex data is CC0 (public domain). No restriction on commercial KYC use. [source](https://docs.openalex.org/)

## fields_returned

Per the Author object schema [source](https://docs.openalex.org/api-entities/authors/author-object):

- `id` (OpenAlex Author ID, e.g. `A5012345678`)
- `orcid` (if linked)
- `display_name`, `display_name_alternatives`
- `works_count`, `cited_by_count`
- `summary_stats.h_index`, `summary_stats.i10_index`, `summary_stats.2yr_mean_citedness`
- `affiliations[]`: each entry contains `institution` (id, ror, display_name, country_code, type) and `years[]` (years observed at that institution)
- `last_known_institutions[]` (the most recent inferred affiliation set)
- `topics[]`, `x_concepts[]` (research-area tags with scores) — usable for the role-vs-scope check
- `counts_by_year[]` (works/citations by year — usable for "recent activity" signal)
- `works_api_url` (for fetching the author's works)
- `updated_date`, `created_date`

## marginal_cost_per_check

- **Direct API cost:** effectively $0 for typical screening volumes. One customer screen = 1 search call (counts against the 10k/day list-filter limit) + 1 single-entity author fetch (unlimited free). A provider doing <10,000 customer-checks/day stays inside the free tier; higher volumes consume the $1/day credit and then incur usage billing. [source](https://developers.openalex.org/how-to-use-the-api/rate-limits-and-authentication)
- **Compute/eng cost:** the disambiguation logic (name match + institution match + ORCID confirmation) is the real cost driver. [best guess: ~$0.01–$0.05/customer in engineer-amortized infra cost for a production reviewer pipeline that retains the response and annotates a confidence score]
- **setup_cost:** building the disambiguation/normalization layer and a reviewer UI: [best guess: 2–4 engineer-weeks, plus integration into the order workflow]

## manual_review_handoff

When a flag fires, the reviewer receives a packet containing:

1. The customer's claimed name, institution, and stated research area.
2. The top 3 candidate OpenAlex Author records (display_name, ORCID, last_known_institutions, works_count, h_index, top topics, link to OpenAlex profile).
3. The match-score for each candidate against the claim.
4. Up to 5 most-recent works for the top candidate (title, year, venue, coauthors, institution).

**Reviewer playbook:**

1. If a high-confidence match exists with affiliation history covering the claimed institution within the last 2 years and topics overlapping the order's domain → mark `verified-research-footprint`, proceed.
2. If candidates exist but none match the claimed institution: contact customer requesting (a) a publication URL or DOI, or (b) institutional email confirmation.
3. If zero candidates: this alone is not a denial — early-career and industry researchers may have no footprint. Route to `m19-orcid-employments` and `m18` institution checks; require a positive signal from at least one of those.
4. If the candidate's topic distribution is implausible for the order (e.g., a pure social-scientist ordering BSL-3 SOC reagents): escalate to `m19-role-vs-scope` reviewer.
5. Document the reviewer's selected candidate (Author ID) in the customer record.

## flags_thrown

- `openalex_no_author_found` — name + institution returns zero candidates → reviewer enrichment required (not denial).
- `openalex_affiliation_mismatch` — top candidate's `affiliations[]` does not contain the claimed institution within the last 24 months → reviewer adjudication.
- `openalex_topic_mismatch` — top candidate's `x_concepts` do not overlap the order's life-sciences area → escalate to role-vs-scope.
- `openalex_ambiguous_match` — multiple candidates with similar match scores and no ORCID tiebreaker → reviewer disambiguation.

## failure_modes_requiring_review

- Common-name disambiguation collisions (e.g., "Wei Zhang", "Maria Garcia") — OpenAlex's algorithm uses ORCID + co-citation patterns but is imperfect [source](https://docs.openalex.org/api-entities/authors/author-disambiguation).
- Author profile merging/splitting — OpenAlex periodically re-runs disambiguation, and an author's works may be split across multiple Author IDs.
- Recently-changed institution: customer just moved, OpenAlex `last_known_institutions` lag by 6–18 months. [best guess: based on the typical indexing lag of Crossref/PubMed pipelines feeding OpenAlex, a job change is reflected only after the first publication from the new institution is indexed]
- Non-publishing roles (lab manager, technician, BSO, clinician, industry scientist): the entire population is invisible to OpenAlex.
- Non-English / non-Latin scripts: name normalization may fail.
- API errors / 429 throttling: queue and retry; do not block ordering on a transient API error.

## false_positive_qualitative

Legitimate customers this check would incorrectly trip:

- **Early-career researchers** (first/second year PhD, postdocs in their first lab) — population-normal to have 0–3 publications.
- **Lab managers, technicians, BSOs, core-facility staff** — placing the order is their job, but they often do not appear as authors.
- **Industry / biotech R&D staff** — corporate publications are often suppressed; many never appear in OpenAlex.
- **Clinicians ordering for translational work** — publication record often clinical, not bench.
- **Researchers who recently moved institutions** (lag).
- **Non-Western researchers** publishing in venues that are under-indexed by OpenAlex.
- **Authors with name collisions** producing the wrong candidate.

[best guess: based on attacker mapping `unrelated-dept-student` note "Estimated 15–30% of legitimate customers have individual footprints thin enough to flag on strict review", a strict OpenAlex-affiliation-mismatch flag would have false-positive rate of similar order of magnitude on academic populations and substantially higher on industry/clinical populations]

## record_left

For each check, persist:

- The full OpenAlex Author JSON for the selected candidate (or the top-N candidate set if no selection).
- The query string used.
- The timestamp and OpenAlex `updated_date`.
- The reviewer's selected Author ID, decision, and free-text note.
- A snapshot URL: `https://api.openalex.org/authors/A...` for re-fetching.

This is a strong audit artifact: OpenAlex IDs and the underlying data are stable, CC0, and re-fetchable.

## attacker_stories_addressed (refined)

- `it-persona-manufacturing` — partial: catches the persona only if the manufactured identity has *no* publication record matching the institution; an attacker who additionally seeds a preprint at the host institution will pass.
- `ghost-author` — partial: same as above; OpenAlex indexes preprints from arXiv, bioRxiv, etc., so a single seeded preprint will register.
- `paper-shell-research-org` — partial: a shell org with no ROR ID or no indexed works will fail OpenAlex matching; one with an established but lightly-vetted ROR (see `gradual-legitimacy-accumulation`) will pass.

[best guess: this check is most useful as a *positive signal* (the customer demonstrably has a real publication track at the claimed institution) than as a *negative signal* (absence proves nothing)]
