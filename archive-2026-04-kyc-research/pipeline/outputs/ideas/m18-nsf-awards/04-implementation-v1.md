# m18-nsf-awards — implementation v1

- **measure:** M18 — institution-legitimacy-soc
- **name:** NSF + UKRI + ERC/CORDIS funded-institution signal
- **modes:** A
- **summary:** Same logic as m18-nih-reporter but for non-NIH funders. Query NSF Award Search Web API by awardee institution; query UKRI Gateway to Research API by `organisation`; query the EU CORDIS open data dump (Horizon 2020 + Horizon Europe) for ERC and other EU-funded projects naming the institution. The disjunction of "any of these funders has awarded the institution in the past 5 years" is positive evidence; absence across all of them combined with absence in NIH is a substantive M18 negative.

## external_dependencies

- **NSF Award Search Web API** ([source](https://resources.research.gov/common/webapi/awardapisearch-v1.htm)). Free, no auth.
- **UKRI Gateway to Research (GtR-2) API** ([source](https://gtr.ukri.org/resources/gtrapi2.html)). Free, Open Government License.
- **CORDIS open data** (EU Open Data Portal CSV/XML dumps for Horizon 2020 and Horizon Europe) ([source](https://cordis.europa.eu/projects)). Bulk download, free.
- **Internal name-normalization table** for institutions across funder naming conventions.
- **Human reviewer.**

## endpoint_details

### NSF
- **URL:** `https://api.nsf.gov/services/v1/awards.json` (Research.gov Award Search Web API v1) ([source](https://resources.research.gov/common/webapi/awardapisearch-v1.htm)).
- **Auth:** none.
- **Rate limit:** not formally published. Default page size 25, max 25; results pagination capped — accuracy degraded past first 3000 results ([source](https://resources.research.gov/common/webapi/awardapisearch-v1.htm)). [unknown — searched for: "NSF Award Search API rate limit", "research.gov api throttling"] — no published per-second limit found; treat as ≤1 req/s by analogy to NIH.
- **Pricing:** free.
- **Coverage:** awards from 2007 onward.

### UKRI GtR-2
- **Base URL:** `https://gtr.ukri.org/api/` ([source](https://gtr.ukri.org/resources/gtrapi2.html)).
- **Key endpoint:** `GET /api/organisations?q=<name>` returns matching organisation records; `GET /api/organisations/{id}/projects` returns associated projects.
- **Auth:** none.
- **Rate limit:** [unknown — searched for: "UKRI gateway to research API rate limit", "GtR API throttle"] — not published; treat as polite (~1 req/s).
- **Pricing:** free.
- **License:** Open Government License v3 ([source](https://gtr.ukri.org/resources/about.html)).
- **Format:** JSON or XML via `Accept` header.

### CORDIS
- **URL:** EU Open Data Portal CORDIS dataset pages: `https://data.europa.eu/data/datasets/cordis-eu-research-projects-under-horizon-europe-2021-2027` and the H2020 sibling.
- **Auth:** none.
- **Format:** CSV / XML / JSON-LD bulk dumps. Includes per-project participating organisations, PIs (for ERC projects), legal basis, topic ([source](https://cordis.europa.eu/projects)).
- **Pricing:** free, CC BY 4.0.
- **Update cadence:** [unknown — searched for: "CORDIS open data update frequency", "EU open data portal CORDIS refresh"] — community sources suggest monthly to quarterly.
- **No live REST search endpoint** for CORDIS itself — implementations build a local index from the dump.

## fields_returned

### NSF (per [source](https://resources.research.gov/common/webapi/awardapisearch-v1.htm)):
- `id` (award ID), `title`, `agency`, `awardeeName`, `awardeeAddress`, `awardeeCity`, `awardeeStateCode`, `awardeeZipCode`, `awardeeCountryCode`
- `awardeeDuns`, `awardeeDunsName`
- `pdPIName`, `coPDPI`
- `date` (award date), `startDate`, `expDate`
- `estimatedTotalAmt`, `fundsObligatedAmt`
- `abstractText`, `publicationResearch`, `publicationConference`
- `fundProgramName`, `primaryProgram`, `transType`
- `perfLocation`, `perfCity`, `perfStateCode`, `perfCountryCode`

### UKRI GtR-2 (per [source](https://gtr.ukri.org/resources/GtR-2-API-v1.7.5.pdf)):
Organisation record:
- `id`, `name`, `addresses`, `url`
Project record:
- `id`, `title`, `grantCategory`, `leadFunder`, `leadOrganisationDepartment`, `abstractText`, `techAbstractText`
- `start`, `end`, `status`
- `fund.valuePounds`, `fund.start`, `fund.end`, `fund.funder.name`
- `links` to PI persons, organisations, publications, outcomes

### CORDIS (per [source](https://cordis.europa.eu/projects)):
- `rcn`, `id` (project ID), `acronym`, `title`
- `startDate`, `endDate`, `totalCost`, `ecMaxContribution`
- `frameworkProgramme`, `topics`, `legalBasis`
- `participants` (semicolon-delimited list of organisation legal names + countries + roles + costs)
- For ERC projects: `principalInvestigator` block with name, role, host institution

## marginal_cost_per_check

- NSF call: $0; ~1s [best guess: federal API typical latency].
- UKRI call: $0; ~1–2s [best guess: based on GtR's UK government infrastructure].
- CORDIS lookup: $0; <100ms (in-memory index of pre-loaded dump).
- **Total marginal cost:** $0; ~3–5s wall time per check assuming sequential calls.
- **setup_cost:** ~1 engineer-day for the three clients + CORDIS dump ingest + cross-funder name normalization.

## manual_review_handoff

When `no_funder_record_5yr` fires across all three funders (and NIH), the reviewer:

1. Confirm the institution's *expected funder profile*: a UK university should be in UKRI; a German research institute in CORDIS; a US engineering school in NSF; etc. Mismatched-jurisdiction null results are weak signal.
2. Re-run with alias variants from ROR and from each funder's own organisation index where available (UKRI's organisation endpoint, NSF's awardeeDunsName).
3. If the institution claims to do funded research and none of the major public funders has any record over 5 years, escalate to fraud queue. This is a strong negative for SOC orders.
4. Document: which funders were queried, which aliases tried, expected vs. found, final disposition.

## flags_thrown

- `no_funder_record_5yr` — zero hits across NSF + UKRI + CORDIS in past 5 years. Action per playbook above.
- `funder_record_present` — at least one funder shows the institution as awardee. Positive signal, no action.
- `funder_jurisdiction_mismatch` — institution claims country X but only appears in funder records of country Y. Soft anomaly, combine with M02/M05 signals.
- `funder_pi_mismatch` — institution shows funding but the customer's named individual is not among PIs. Used in conjunction with m19-nih-nsf-pi.

## failure_modes_requiring_review

- NSF API timeouts / 5xx — retry with backoff.
- UKRI organisation name fuzzy-match misses — fall back to UKRI's `search/organisation` UI scrape.
- CORDIS dump staleness — institution joined a project after the last dump refresh.
- ERC PI is recorded but the *host institution at time of grant* may differ from the customer's current claim — needs careful temporal handling.
- CORDIS `participants` field is a delimited string, not normalized; simple substring match produces false positives across institutions whose names share a token (e.g., "Institute of Technology").
- Coverage gaps in non-Anglophone, non-EU countries (Asia, LatAm, Africa) — none of the three funders helps there.

## false_positive_qualitative

As with m18-nih-reporter, the check is positive-evidence-shaped, so the dominant failure is **false negatives**:

- Institutions in countries outside US/UK/EU (no equivalent funder coverage here).
- Industrial / corporate research (low NSF/UKRI uptake; some CORDIS coverage via Horizon).
- Brand-new labs without award history.
- Subdivisions/departments listed at parent-institution level in funder records.
- Translated institution names (German `Universität` vs. English `University of`).
- Pure-teaching colleges with real life-sciences instruction but no research grants.

False positives in the "we matched the wrong institution" sense come from substring matches in CORDIS `participants` strings — mitigated by exact + alias lookup rather than substring.

## record_left

A "multi-funder funding report" record per check, persisted in the case management system, containing:
- Input: institution name + alias list + claimed country.
- For each of NSF / UKRI / CORDIS: hit count past 5y, sample award IDs (top 5), total funding amount, funder names.
- Cross-funder summary: any-funder presence Y/N; expected-funder hit Y/N.
- Final flag set + reviewer disposition.
- API/dump version timestamps (for audit reproducibility).
