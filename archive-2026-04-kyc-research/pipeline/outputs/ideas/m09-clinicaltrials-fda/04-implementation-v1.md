# m09-clinicaltrials-fda — implementation v1

- **measure:** M09 — institution-real-life-sciences
- **name:** ClinicalTrials.gov + FDA establishment registration cross-check
- **modes:** A (automated)
- **summary:** Cross-check the institution name against (a) ClinicalTrials.gov v2 API as a sponsor/collaborator/site, and (b) the FDA Establishment Registration & Device Listing database (devices) plus the openFDA drug registration listing endpoints. Either presence is positive evidence the institution is a real, regulated life-sciences entity.

## external_dependencies

- ClinicalTrials.gov REST API v2 ([source](https://clinicaltrials.gov/data-api/api))
- openFDA device registration & listing endpoint ([source](https://open.fda.gov/apis/device/registrationlisting/))
- FDA CDRH establishment registration text search (web UI fallback for drug/device sites not yet in openFDA) ([source](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfrl/textsearch.cfm))

## endpoint_details

- **ClinicalTrials.gov v2:** `https://clinicaltrials.gov/api/v2/studies` — REST + JSON, OpenAPI 3.0 described, no auth required, free, public dataset. Sponsor name lives at `protocolSection.sponsorCollaboratorsModule.leadSponsor.name` ([source](https://clinicaltrials.gov/data-api/api)). Rate limits: not officially published; the v2 API documentation does not state a hard rate limit [unknown — searched for: "ClinicalTrials.gov API v2 rate limit", "clinicaltrials.gov api throttle requests per second"].
- **openFDA device registration:** `https://api.fda.gov/device/registrationlisting.json` — REST + JSON, no key required for ≤240 req/min and ≤1,000 req/day per IP; with a free API key, 240 req/min and 120,000 req/day [best guess: standard openFDA quotas documented at the openFDA APIs landing page]([source](https://open.fda.gov/apis/)). Updated weekly ([source](https://www.fda.gov/medical-devices/device-registration-and-listing/search-registration-and-listing)).
- **FDA CDRH text search:** HTML form at `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfrl/textsearch.cfm`; no API. Used as a manual fallback when the openFDA endpoint returns no match (it covers devices but not drug-establishment registrations comprehensively) ([source](https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfrl/textsearch.cfm)).
- **Auth:** none (CT.gov), free API key (openFDA).
- **Pricing:** $0 marginal. No setup cost.
- **ToS:** both are US federal public datasets; no commercial restriction relevant to customer screening [best guess: openFDA terms permit any use, including commercial, with attribution; CT.gov data is public domain].

## fields_returned

- **CT.gov v2 study record:** NCT ID, brief title, official title, lead sponsor name and class (INDUSTRY/NIH/OTHER_GOV/OTHER), collaborators, study type, phase, status, start date, primary completion date, locations (facility name + city + country), study contact info, conditions, interventions ([source](https://clinicaltrials.gov/data-api/api)).
- **openFDA device registration:** `firm_name`, `owner_operator_number`, registration number, FEI number, address (line_1/line_2/city/state/zip/country), establishment_type, products (k_number, product_code, device class) ([source](https://open.fda.gov/apis/device/registrationlisting/)).

## marginal_cost_per_check

- $0 per check (both APIs free). Setup cost: ~1–2 engineering days to wire both APIs and write a name-normalization layer (lowercased, stopwords stripped, "Inc/LLC/Ltd/University of" suffix-tolerant). [best guess: engineering effort comparable to other government-API integrations]

## manual_review_handoff

- Reviewer receives: (a) the searched institution name plus normalized variants, (b) candidate matches from both sources with their full record fields, (c) the flag(s) thrown.
- Playbook:
  1. If ≥1 CT.gov sponsor/collaborator hit AND/OR ≥1 openFDA establishment hit at the same registered address: pass on M09 (positive evidence); record IDs in case file.
  2. If 0 hits: do not auto-deny — many legitimate basic-research labs (university single-PI, early-stage biotech, CROs not running registered trials, non-device research) have neither. Reviewer reads the institution's website/registry and asks: does the org's stated work require an FDA establishment registration or sponsor a clinical trial? If no, this check is non-binding and reviewer falls through to other M09 ideas (corp-registry-stack, pubmed-affiliation, irs-990).
  3. If a fuzzy/partial match returns several candidates: reviewer disambiguates by registered address and incorporation year against the corp registry record from the parallel check.

## flags_thrown

- `no_ctgov_no_fda_registration` — neither source returns a hit for the institution name or any normalized variant. Action: route to reviewer; non-blocking on its own.
- `ctgov_match_but_role_unclear` — institution appears as a CT.gov *site* (location facility) but not as sponsor/collaborator. Reviewer notes this as weaker positive evidence (sites can be hospitals hosting trials, which is still real life-sciences activity).
- `fda_registration_address_mismatch` — openFDA returns a registration but the registered address differs materially from the customer-supplied address. Reviewer escalates: possible name collision or stale registration.

## failure_modes_requiring_review

- Name normalization ambiguity (the institution has a common 2–3-word name that collides with several CT.gov sponsors). Reviewer disambiguates.
- API outage / 5xx from either endpoint. Reviewer retries; if still down after 1 hr, the check is recorded as "deferred" and other M09 checks must carry the load.
- openFDA staleness (weekly refresh) ([source](https://www.fda.gov/medical-devices/device-registration-and-listing/search-registration-and-listing)) — a brand-new establishment registered in the last 7 days won't appear yet.
- CT.gov sponsor name vs registered legal name mismatch (e.g., "Stanford" vs "Stanford University vs "Leland Stanford Junior University"). Reviewer reconciles.

## false_positive_qualitative

This check produces *positive evidence*; the failure mode is false negatives, not false positives. Legitimate-customer cases incorrectly flagged as `no_ctgov_no_fda_registration`:

- Basic-research labs (single-PI molecular biology, structural biology, computational biology) at real universities — they typically run no clinical trials and require no FDA registration. **High false-negative population.**
- Small CROs that do contract research but not trial sponsorship and not GMP manufacturing — also legitimately absent.
- DIY / community bio labs (per attacker mapping community-bio-lab-network) — legitimately absent.
- Foreign academic institutions whose trials/devices are not registered in the US system — legitimately absent.

The check is most useful as *positive corroboration* when it fires, and weakly useful as a flag when it doesn't. The companion ideas (pubmed-affiliation for academics, corp-registry-stack for legal existence) carry the burden in the absence-case.

## record_left

- JSON snapshot of the CT.gov query response and openFDA query response, stored in the customer file with the query timestamp. Provides paper trail of "we checked these public registries on date X and got these results."

## bypass_methods_known

[deferred to stage 5]

## bypass_methods_uncovered

[deferred to stage 5]

---

**Sources cited above:**
- ClinicalTrials.gov API v2: https://clinicaltrials.gov/data-api/api
- openFDA device registration & listing: https://open.fda.gov/apis/device/registrationlisting/
- openFDA APIs landing: https://open.fda.gov/apis/
- FDA Search Registration and Listing: https://www.fda.gov/medical-devices/device-registration-and-listing/search-registration-and-listing
- FDA CDRH text search: https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfrl/textsearch.cfm
