# m18-ror — implementation v1

- **measure:** M18 — institution-legitimacy-soc
- **name:** ROR Research Organization Registry
- **modes:** D, A
- **summary:** At onboarding, resolve the customer's claimed institution to a Research Organization Registry (ROR) ID via the ROR REST API's affiliation/match endpoints. ROR is a community-curated registry of ~120k research orgs. The check produces (a) match / no-match, (b) match confidence, (c) red-flag indicators (record younger than 6 months, single-PI / one-person-org-shaped record, suspicious metadata, no `domains` field). It is the foundational institution-identity primitive that several other M18/M19 ideas reference.

## external_dependencies

- **ROR REST API v2** ([source](https://ror.readme.io/docs/rest-api)). Free, optional client ID for higher rate limits.
- **ROR data dump** ([source](https://ror.org/about/faqs/)) — full corpus on Zenodo, CC0, used as a backstop and to compute red-flag features (record age from `established` and `created` fields, etc.).
- **Human reviewer** for ambiguous matches and curation-anomaly review.

## endpoint_details

- **Base URL:** `https://api.ror.org/v2/organizations` ([source](https://ror.readme.io/docs/rest-api)).
- **Match modes:**
  - `?affiliation=<string>` — best for full affiliation strings ("Department of X, University of Y, City"). Returns scored matches ([source](https://ror.readme.io/docs/api-affiliation)).
  - `?query=<string>` — quick keyword search of names + external_ids ([source](https://ror.readme.io/v2/docs/api-query)). Quoted strings give exact-match.
  - `?query.advanced=<elasticsearch>` — power-user Elasticsearch DSL for complex filters.
- **Auth:** none currently required. Optional `client_id` registration for higher rate limit ([source](https://ror.readme.io/docs/rest-api), [source](https://ror.readme.io/docs/client-id)).
- **Rate limits:** unauthenticated 2000 req / 5min currently; this drops to 50 req / 5min after Q3 2026 unless a client ID is presented ([source](https://ror.readme.io/docs/rest-api)). With a (free) client ID: 2000 req / 5min indefinitely.
- **Pricing:** free for both API and dump.
- **License:** CC0 ([source](https://ror.org/about/faqs/)).
- **ToS:** none beyond rate-limit politeness; commercial use permitted under CC0.
- **Data dump:** monthly Zenodo releases ([source](https://doi.org/10.5281/zenodo.6347574)).

## fields_returned

ROR v2 organisation record (per [source](https://ror.readme.io/docs/all-ror-fields-and-sub-fields)):

- `id` — ROR ID URL (`https://ror.org/0xxxxxxxx`)
- `names` — array of `{value, lang, types[]}` with types `ror_display`, `label`, `alias`, `acronym`
- `domains` — array of canonical domain strings
- `established` — year founded (nullable)
- `links` — array of `{value, type}` (e.g., `website`, `wikipedia`)
- `locations` — array with `geonames_id`, `geonames_details` (`name`, `lat`, `lng`, `country_code`, `country_name`, `country_subdivision_code`, `country_subdivision_name`)
- `relationships` — array with `{label, type, id}` for `parent`, `child`, `related`, `predecessor`, `successor`
- `external_ids` — array of `{type, all, preferred}`, types include `fundref`, `grid`, `isni`, `wikidata`
- `status` — `active`, `inactive`, `withdrawn`
- `types` — array of `Education`, `Healthcare`, `Company`, `Archive`, `Nonprofit`, `Government`, `Facility`, `Other`, `Funder`
- `admin` — `{created: {date, schema_version}, last_modified: {date, schema_version}}`
- For affiliation-match responses: each match wrapped in `{substring, score, matching_type, chosen, organization}`.

## marginal_cost_per_check

- 1–2 API calls (one affiliation match, one detail fetch on the top hit). $0 monetary; ~300–800ms wall time [best guess: API hosted on Crossref / Datacite-grade infrastructure, typical low-hundreds-of-ms latency].
- **Total marginal cost:** $0; sub-second.
- **setup_cost:** ~0.5 engineer-day for client + red-flag feature extraction; ~1 hour to register a client ID.

## manual_review_handoff

When `ror_no_match`, `ror_recent`, or `ror_self_listed` fires, the reviewer:

1. **`ror_no_match`:** try alternate names from the customer (legal name, common acronym, English/local-language). If still no match, this is a substantive negative — the institution is not in a registry that 120k+ legitimate research orgs are in. Combine with NIH/NSF/CORDIS funding null results for a strong reject signal. If the institution is foreign/unusual, document and pass to country-specific manual verification (M02 dom recognition, IRS-990-equivalent in jurisdiction).
2. **`ror_recent`:** record was created in ROR within the past 6 months. Pull the curation request from ROR's GitHub issues queue ([source](https://ror.org/blog/2025-10-08-journey-of-a-curation-request/)) to see who requested it and what evidence was given. ROR curation is community-driven and curated by humans, so a record's provenance is auditable.
3. **`ror_self_listed`:** the record's metadata pattern looks like a self-promoted shell — no parent/child relationships, no GRID/ISNI cross-IDs, single-domain, sparse `names` array. Combine with funding null results.
4. Document: ROR ID (or `null`), score, red-flag features, curation issue link if any, final disposition.

## flags_thrown

- `ror_no_match` — no record above affiliation-match score threshold (0.8 [best guess]). Action: per playbook 1.
- `ror_match_low_confidence` — top match below 0.95 but above threshold. Action: human reviewer disambiguates.
- `ror_recent` — top match's `admin.created.date` is within 6 months of check time. Action: per playbook 2.
- `ror_self_listed` — top match has zero `relationships`, zero `external_ids` other than ROR's own, ≤1 `domains`, single-name. Action: per playbook 3.
- `ror_inactive` — `status` is `inactive` or `withdrawn`. Action: hard reject for SOC orders.
- `ror_metadata_anomaly` — `types` is `Other`, no `locations`, or `established` year suspicious (future or far in the past). Action: human review.

## failure_modes_requiring_review

- API timeout / 5xx — fall back to in-memory dump. Mark `ror_unknown` only if both fail.
- Affiliation-string parser misses on heavy abbreviation — try `query` mode as fallback.
- Unicode normalization mismatches between customer input and ROR record (NFC vs NFD).
- ROR coverage gaps in non-Anglophone regions and very small institutions; absence ≠ illegitimacy in those contexts.
- Multi-record orgs (parent + many children) where the customer matches a parent but the actual lab is a child not in ROR.

## false_positive_qualitative

False *positives* (incorrectly matched institution):
- Two real institutions with very similar names in different countries (e.g., multiple "Université de X").
- Customer's department name dominates the match score over the institution name.
- Cross-language ambiguity.

False *negatives* (legitimate institution flagged as suspicious):
- Newly created legitimate research orgs (especially startups, community labs, new institutes) — these would correctly trip `ror_recent`.
- Legitimate small / single-PI labs whose ROR record looks self-listed.
- Institutions in countries underrepresented in ROR (parts of Africa, MENA, central Asia).
- Industrial R&D groups embedded in larger non-research companies.
- Nonprofits/NGOs whose research role is secondary to a primary mission.

## record_left

A "ROR resolution report" record per check, persisted in case management, containing:
- Input: claimed institution string, claimed country.
- API request URL and full JSON response (top match + relevant siblings).
- Computed red-flag features (record age days, relationship count, external_ids count, domains count).
- Final flag set + reviewer disposition.
- ROR API release version (from `admin.created.schema_version`) for audit reproducibility.
