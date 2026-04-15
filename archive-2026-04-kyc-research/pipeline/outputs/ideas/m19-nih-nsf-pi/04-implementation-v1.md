# m19-nih-nsf-pi — implementation v1

- **measure:** M19 — individual-legitimacy-soc
- **name:** NIH / NSF / Wellcome / ERC PI lookup
- **modes:** A
- **summary:** Search the major public research-funder databases for grants where the customer is named as PI or co-PI: NIH RePORTER (`pi_names` parameter), NSF Award Search (`pdPIName`), Wellcome Trust Grants Awarded spreadsheet, ERC PI sub-dataset in CORDIS, UKRI Gateway to Research (`person` endpoint). PI status is strong individual-level positive evidence; null result is weak signal because most legitimate researchers are never grant PIs.

## external_dependencies

- **NIH RePORTER API v2** (`pi_names` filter) ([source](https://api.reporter.nih.gov/)).
- **NSF Award Search Web API** (`pdPIName` field) ([source](https://resources.research.gov/common/webapi/awardapisearch-v1.htm)).
- **Wellcome Trust Grants Awarded spreadsheet** (CC BY 4.0, 360Giving format) ([source](https://wellcome.org/research-funding/funding-portfolio/funded-grants)).
- **CORDIS ERC PI sub-dataset** (Horizon 2020 + Horizon Europe) ([source](https://cordis.europa.eu/projects)).
- **UKRI Gateway to Research API** — `persons` endpoint ([source](https://gtr.ukri.org/resources/gtrapi2.html)).
- **World RePORT** (NIH-hosted aggregator covering Wellcome and others) — fallback ([source](https://wellcome.org/research-funding/funding-portfolio/funded-grants)).
- **Internal name-normalization** for transliteration, hyphenation, accent stripping.
- **Human reviewer.**

## endpoint_details

### NIH RePORTER (PI search)
- `POST https://api.reporter.nih.gov/v2/projects/search` with `criteria.pi_names = [{any_name: "<name>"}]` and optional wildcard ([source](https://cran.r-project.org/web/packages/repoRter.nih/refman/repoRter.nih.html)).
- Auth: none. Rate: 1 req/s. Pricing: free.

### NSF Award Search
- `https://api.nsf.gov/services/v1/awards.json?pdPIName=<name>` ([source](https://resources.research.gov/common/webapi/awardapisearch-v1.htm)).
- Auth: none. Rate: not published, treat ≤1 req/s. Pricing: free.

### Wellcome Trust
- Bulk file download: spreadsheet of grants since 2000 (XLSX). License CC BY 4.0 ([source](https://wellcome.org/research-funding/funding-portfolio/funded-grants)).
- No live API. Implementation loads the file into a local index keyed by PI name + co-applicant names.
- Update cadence: appears to be ~quarterly [best guess: based on the published "as of 27 January 2026" snapshot date in the search result; not formally documented].

### CORDIS ERC PI sub-dataset
- Bulk CSV/XML download from EU Open Data Portal: `https://data.europa.eu/data/datasets/cordis-eu-research-projects-under-horizon-europe-2021-2027` and the H2020 sibling. Contains a `principalInvestigator` table for ERC projects ([source](https://cordis.europa.eu/projects)).
- License: CC BY 4.0.
- Auth: none.

### UKRI GtR-2 (persons)
- `GET https://gtr.ukri.org/api/persons?q=<name>` returns matching person records linked to projects ([source](https://gtr.ukri.org/resources/gtrapi2.html)).
- Auth: none. License: Open Government License v3.

## fields_returned

### NIH RePORTER `principal_investigators` array (per [source](https://api.reporter.nih.gov/documents/Data%20Elements%20for%20RePORTER%20Project%20API_V2.pdf)):
- `profile_id`, `first_name`, `middle_name`, `last_name`, `full_name`, `is_contact_pi`, `title`
- Plus parent project fields: `project_num`, `org_name`, `fiscal_year`, `award_amount`.

### NSF
- `pdPIName`, `coPDPI`, `awardeeName`, `id`, `title`, `startDate`, `expDate`, `fundsObligatedAmt`.

### Wellcome (per the 360Giving CSV schema, [source](https://standard.threesixtygiving.org/en/latest/)):
- `Identifier`, `Title`, `Description`
- `Recipient Org:Name`, `Recipient Org:Identifier`
- `Beneficiary Location:Name`
- `Funding Org:Name`
- `Award Date`, `Planned Dates:Start Date`, `Planned Dates:End Date`
- `Amount Awarded`, `Currency`
- Wellcome-specific extras: `Lead Applicant`, `Other Applicants`, `Grant Programme:Title`

### CORDIS ERC PI table:
- `projectID`, `projectAcronym`
- `lastName`, `firstName`, `title`
- `hostInstitutionName`, `hostInstitutionCountry`
- `eccountry`, `panel`

### UKRI GtR-2 person record:
- `id`, `firstName`, `surname`, `otherNames`, `orcidId`
- `links` (to projects, organisations, publications)

## marginal_cost_per_check

- 5 lookups (NIH + NSF + Wellcome local + CORDIS local + UKRI). Total monetary $0.
- Wall time: ~3–6s sequential, ~1.5s parallel [best guess: dominated by NIH + NSF API latency].
- **Total marginal cost:** $0.
- **setup_cost:** ~1–2 engineer-days for the multi-funder client + Wellcome/CORDIS dump ingest + cross-funder name normalization + ORCID-based disambiguator if available.

## manual_review_handoff

When `no_pi_record` fires (no funder shows the customer as PI/co-PI):
1. This is **expected** for the majority of legitimate researchers (postdocs, grad students, lab technicians, industry scientists). The check is **positive-evidence**: presence is strong; absence is weak.
2. Only escalate if the customer **claims** PI status (in their application or affiliation field) and the check is null. Then it becomes substantive.
3. Try alias variants (transliteration, married name, hyphenation).
4. Cross-check ORCID employments and m19-pubmed-scopus authorship.
5. Document: funders queried, alias list, claim-vs-reality flag.

When `pi_at_different_institution` fires:
1. Common case for early-career PIs who recently moved. Verify against m19-faculty-page and m07-directory-scrape at the *current* institution.
2. If the customer is genuinely PI at institution A but ordering through institution B, confirm legitimate cross-institution work (collaboration, joint appointment) — common in biotech.
3. Document.

## flags_thrown

- `pi_record_present` — at least one funder shows the customer as PI or co-PI in past 10 years. Strong positive.
- `no_pi_record` — null across all funders. Weak signal alone; combine with claimed-PI status check.
- `pi_at_different_institution` — found as PI but the institution on the grant differs from the customer's claimed institution.
- `pi_inactive_5yr` — found historically but no PI grant in past 5 years (could indicate retirement, role change, or pause).
- `pi_name_collision_unresolved` — multiple distinct PIs with the same normalized name and no ORCID/affiliation disambiguator.

## failure_modes_requiring_review

- API timeouts on NIH/NSF/UKRI — retry with backoff.
- Wellcome/CORDIS dump staleness (3–6 months for new grants).
- Common-name collisions across funders that don't all use ORCID.
- Co-PI fields are inconsistently populated across NSF historical records.
- Foreign PI names that funders romanize differently in different records (e.g., 王 → Wang/Wong).
- Joint-PI grants where only the contact PI is in the simple field.

## false_positive_qualitative

False *negatives* dominate:
- Postdocs, grad students, technicians (not PI on anything yet).
- Industry researchers (rare PIs on public grants).
- Researchers whose funding is private (HHMI, Chan Zuckerberg, philanthropy without 360Giving publication).
- Asian, African, LatAm-funded researchers (none of these databases cover those funders).
- New investigators in their first grant cycle.

False *positives* (wrong-person match):
- Common names without disambiguator. Mitigate by requiring institution agreement OR ORCID.

## record_left

A "PI lookup report" record per check, persisted in case management:
- Input: customer name + variants + claimed institution + claimed-PI flag.
- Per funder: hit count, top 5 grant IDs, role (PI / co-PI), institution at time of grant, fiscal years.
- Cross-funder summary: any-PI-presence Y/N, current-PI Y/N, institution-match Y/N.
- Disambiguator data used (ORCID if available, institution match score).
- Final flag set + reviewer disposition.
- Source-version timestamps (NIH/NSF API call time; Wellcome/CORDIS dump release date).
