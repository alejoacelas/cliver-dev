# m19-clinicaltrials-investigator — implementation v1

- **measure:** M19 — individual-legitimacy-soc
- **name:** ClinicalTrials.gov + FDA BIMO investigator
- **modes:** A
- **summary:** Cross-check the customer's name against (a) ClinicalTrials.gov as a study official / overall official / responsible party, and (b) the FDA's Bioresearch Monitoring Information System (BMIS) clinical-investigator list for anyone who has served on an FDA-regulated trial since Oct 2008. A hit is strong positive evidence of a regulated-research role; an inspection adverse classification is a strong negative.

## external_dependencies

- **ClinicalTrials.gov API v2** ([source](https://clinicaltrials.gov/data-api/api)). Free, no auth.
- **FDA BMIS (BIMO Clinical Investigator list)** ([source](https://www.fda.gov/drugs/drug-approvals-and-databases/bioresearch-monitoring-information-system-bmis)). Quarterly-refreshed downloadable file.
- **FDA BIMO Clinical Investigator Inspection List (CLIIL)** — separate dataset of inspection results and classifications ([source](https://www.fda.gov/science-research/clinical-trials-and-human-subject-protection/bimo-inspection-metrics)).
- **Internal name-normalization** for transliteration / honorific stripping.
- **Human reviewer.**

## endpoint_details

### ClinicalTrials.gov v2 API
- **Base URL:** `https://clinicaltrials.gov/api/v2/studies` ([source](https://clinicaltrials.gov/data-api/api)).
- **Search by official name:** `?query.term=AREA[OverallOfficialName]"<Last, First>"` and similar field-targeted Essie expressions; also `query.locn`, `query.spons`.
- **Fields parameter** lets clients select which response fields to return.
- **Auth:** none.
- **Rate limit:** 10 req/s ([source](https://clinicaltrials.gov/data-api/api)).
- **Pricing:** free.
- **Format:** JSON, CSV, or fields-list.
- **License:** US government public-domain ([source](https://clinicaltrials.gov/about-site/terms-conditions)).

### FDA BMIS
- **URL:** `https://www.fda.gov/drugs/drug-approvals-and-databases/bioresearch-monitoring-information-system-bmis` — landing page links to the downloadable file.
- **Auth:** none; bulk download.
- **Update cadence:** quarterly ([source](https://www.fda.gov/drugs/drug-approvals-and-databases/bioresearch-monitoring-information-system-bmis)).
- **Format:** Excel/CSV [unknown — searched for: "BMIS download format CSV", "FDA BMIS download file type"] — landing page references a downloadable file but the format depends on FDA's current publication.
- **Coverage:** clinical investigators / CROs / IRBs listed on Form FDA 1572 or 1571 submitted to CDER since Oct 1, 2008 ([source](https://www.fda.gov/drugs/drug-approvals-and-databases/bioresearch-monitoring-information-system-bmis)).
- **Pricing:** free.

### FDA BIMO Clinical Investigator Inspection List
- **URL:** `https://www.fda.gov/science-research/clinical-trials-and-human-subject-protection/bimo-inspection-metrics` — links to inspection-list datasets by fiscal year.
- **Format:** Excel files per FY.
- **Auth:** none; free.

## fields_returned

### ClinicalTrials.gov study record (v2, [source](https://clinicaltrials.gov/data-api/api)):
Relevant subset:
- `protocolSection.identificationModule`: `nctId`, `briefTitle`, `officialTitle`
- `protocolSection.statusModule`: `overallStatus`, `startDateStruct`, `completionDateStruct`
- `protocolSection.sponsorCollaboratorsModule`: `responsibleParty` (`type`, `investigatorFullName`, `investigatorTitle`, `investigatorAffiliation`), `leadSponsor`, `collaborators[]`
- `protocolSection.contactsLocationsModule.overallOfficials[]`: `name`, `affiliation`, `role` (`STUDY_DIRECTOR`, `PRINCIPAL_INVESTIGATOR`, `STUDY_CHAIR`)
- `protocolSection.contactsLocationsModule.locations[]`: per-site PI, facility, city, country
- `protocolSection.designModule.phases`, `studyType`
- `protocolSection.conditionsModule.conditions`

### BMIS record (per FDA BMIS page):
- Investigator name
- Address (city, state, country)
- IND number(s) on which the investigator was listed
- Sponsor
- Date listed

### BIMO Inspection List record:
- Investigator name + address
- Inspection date
- Sponsor / IND
- Center (CDER, CBER, CDRH)
- Final classification: `NAI` (No Action Indicated), `VAI` (Voluntary Action Indicated), `OAI` (Official Action Indicated)
- Subject area (drugs, biologics, devices)

## marginal_cost_per_check

- ClinicalTrials.gov call: $0; ~200–500ms [best guess: based on the API's reported 10 r/s capacity and modern serverless backing].
- BMIS / inspection list lookup: $0 (in-memory index of pre-loaded quarterly file).
- **Total marginal cost:** $0; sub-second.
- **setup_cost:** ~0.5 engineer-day for API client + quarterly BMIS ingest + name normalization.

## manual_review_handoff

When `no_ctgov_record` AND `no_fda_bimo_record` both fire, the reviewer:

1. Try transliteration variants and known prior-name aliases (researchers change names; women researchers commonly change surnames after marriage).
2. Try the customer's listed institution as a `query.locn` filter to surface site-PI roles that the name search missed.
3. Recognize the population that *will* fail this check: basic-science researchers (no FDA-regulated trials), early-career trainees, non-US researchers without US trial sites, biology/biochem/structural-bio PIs whose work doesn't go through INDs. A miss alone is weak signal for those categories.
4. If both null AND the customer claims clinical/translational work AND has no NIH funding history (cross-check m19-nih-nsf-pi), escalate.

When `bimo_oai_inspection` fires, the reviewer:
1. Pull the inspection record. Note the date, sponsor, classification, and findings if available.
2. OAI ≈ FDA found significant deviations; this is a substantive integrity flag but not necessarily a SOC blocker. Forward to the legitimacy-review queue with a recommendation, not an auto-deny.

## flags_thrown

- `no_ctgov_record` — name not found as study official, responsible party, or site PI.
- `ctgov_role_match` — name found; positive signal, no action.
- `no_fda_bimo_record` — name not in BMIS list since 2008.
- `bimo_record_present` — listed on Form 1572/1571; positive signal.
- `bimo_oai_inspection` — appears in inspection list with OAI classification. Action: review, do not auto-deny.
- `bimo_vai_inspection` — VAI classification. Action: note in case file, weight slightly negative.
- `ctgov_status_anomaly` — listed but only as Study Director on a single industry-sponsored trial, no PI roles. Combine with other signals.

## failure_modes_requiring_review

- ClinicalTrials.gov API timeouts / 429s — backoff and retry.
- BMIS file format changes between quarterly releases — schema validation needed at ingest time.
- Common-name collisions (e.g., "John Smith") — use middle-name initial + affiliation as disambiguators.
- Name transliterations across alphabets (Chinese, Arabic, Cyrillic).
- Researchers active before 2008 with no recent trials — won't appear in BMIS.
- Site investigators may not be in `overallOfficials`; need per-location traversal.

## false_positive_qualitative

This is positive-evidence-shaped, so dominant errors are **false negatives**. The check is null for:

- Basic researchers (most molecular biology, microbiology, biochem) — they don't run FDA trials.
- Researchers outside the US in non-FDA-regulated jurisdictions.
- Trainees, students, postdocs — too junior to be on a 1572.
- Industry researchers in pharma/biotech who *contribute* to trials but are not listed officials.
- New PIs whose first trials haven't yet been registered.
- Veterinary, agricultural, and non-human researchers.

False positives in the "wrong person matched" sense:
- Common surnames + missing affiliation disambiguator.

## record_left

A "ClinicalTrials/BMIS lookup report" record per check, persisted in case management:
- Input: customer name + variants tried + claimed institution.
- ClinicalTrials.gov: top 10 matched studies with NCT IDs, role, sponsor, status.
- BMIS: matched investigator entries (name, IND, address, date listed).
- BIMO inspection list: matched inspection records with classification.
- BMIS file release date used for the lookup (audit reproducibility).
- Final flag set + reviewer disposition.
