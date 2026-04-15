# m19-nih-nsf-pi — Per-idea synthesis

## Section 1: Filled-in schema

### **name**

NIH / NSF / Wellcome / ERC PI lookup

### **measure**

M19 — individual-legitimacy-soc

### **attacker_stories_addressed**

visiting-researcher, unrelated-dept-student, lab-manager-voucher, it-persona-manufacturing, dormant-account-takeover, account-hijack, foreign-institution, dormant-domain, insider-recruitment, bulk-order-noise-cover

### **summary**

Search five major public research-funder databases for grants where the customer is named as PI or co-PI: NIH RePORTER, NSF Award Search, Wellcome Trust Grants Awarded, CORDIS ERC PI sub-dataset, and UKRI Gateway to Research. PI status is strong individual-level positive evidence; null result is structurally weak signal because most legitimate researchers are never grant PIs. The check's highest-value negative use is when a customer claims PI status and the claim is contradicted by null results across all funders.

### **external_dependencies**

NIH RePORTER API v2 (free, no auth, 1 req/s); NSF Award Search Web API (free, no auth); Wellcome Trust Grants Awarded spreadsheet (CC BY 4.0, bulk download, ~quarterly); CORDIS ERC PI sub-dataset (CC BY 4.0, bulk CSV/XML); UKRI Gateway to Research API persons endpoint (Open Government License v3); World RePORT (fallback); internal name-normalization; human reviewer.

### **endpoint_details**

- **NIH RePORTER:** `POST https://api.reporter.nih.gov/v2/projects/search` with `criteria.pi_names`; no auth; 1 req/s; free
- **NSF:** `https://api.nsf.gov/services/v1/awards.json?pdPIName=<name>`; no auth; treat ≤1 req/s; free
- **Wellcome:** bulk XLSX download (~quarterly) in 360Giving format; CC BY 4.0; loaded into local index
- **CORDIS ERC:** bulk CSV/XML from EU Open Data Portal; contains `principalInvestigator` table; CC BY 4.0
- **UKRI GtR-2:** `GET https://gtr.ukri.org/api/persons?q=<name>`; no auth; Open Government License v3

### **fields_returned**

**NIH:** `profile_id`, `first_name`, `middle_name`, `last_name`, `full_name`, `is_contact_pi`, `title`, parent project fields (`project_num`, `org_name`, `fiscal_year`, `award_amount`). **NSF:** `pdPIName`, `coPDPI`, `awardeeName`, `id`, `title`, `startDate`, `expDate`, `fundsObligatedAmt`. **Wellcome:** 360Giving schema — `Identifier`, `Title`, `Recipient Org:Name`, `Lead Applicant`, `Other Applicants`, `Award Date`, `Amount Awarded`. **CORDIS ERC:** `projectID`, `projectAcronym`, `lastName`, `firstName`, `title`, `hostInstitutionName`, `hostInstitutionCountry`. **UKRI GtR-2:** `id`, `firstName`, `surname`, `otherNames`, `orcidId`, links to projects/organisations/publications.

### **marginal_cost_per_check**

$0 across all five sources. Wall time ~3–6s sequential, ~1.5s parallel [best guess]. **Setup cost:** ~1–2 engineer-days for multi-funder client + Wellcome/CORDIS dump ingest + cross-funder name normalization + optional ORCID-based disambiguator.

### **manual_review_handoff**

**`no_pi_record`:** expected for most researchers (postdocs, students, technicians, industry); only escalate if customer claims PI status and check is null; try alias variants; cross-check ORCID and m19-pubmed-scopus; document funders queried and alias list. **`pi_at_different_institution`:** common for early-career PIs who moved; verify against m19-faculty-page and m07-directory-scrape at current institution; confirm legitimate cross-institution work if applicable; document.

### **flags_thrown**

- `pi_record_present` (PI/co-PI found in past 10 years — strong positive)
- `no_pi_record` (null across all funders — weak signal, combine with claimed-PI status)
- `pi_at_different_institution` (PI but institution differs from claimed)
- `pi_inactive_5yr` (historical PI but no grant in past 5 years)
- `pi_name_collision_unresolved` (multiple distinct PIs with same name, no disambiguator)

### **failure_modes_requiring_review**

- API timeouts on NIH/NSF/UKRI (retry with backoff)
- Wellcome/CORDIS dump staleness (3–6 months for new grants)
- common-name collisions across funders without universal ORCID
- co-PI fields inconsistently populated in historical NSF records
- foreign PI names romanized differently across funder records
- joint-PI grants where only contact PI appears in simple field

### **false_positive_qualitative**

- Overwhelmingly positive-evidence-shaped — dominant errors are false negatives: non-PI researchers (~60–75% of order-placers)
- industry researchers (>90% invisible)
- non-US/UK/EU researchers (~40–60% of global researchers funded by uncovered agencies)
- privately funded researchers (2–5%)
- new investigators (1–3% transient lag)
- name collisions (5–10% of lookups ambiguous, 1–2% unresolvable). Only true false-positive risk: common-name collision matching the wrong person's PI record

### **coverage_gaps**

1. Non-PI researchers (postdocs, students, technicians) — ~60–75% of order-placers
2. Industry/commercial researchers — >90% invisible
3. Researchers funded by non-covered agencies (Asia, Africa, Latin America, Middle East) — ~40–60% of global researchers
4. Privately funded researchers (HHMI, CZI, Gates, Simons) — 2–5% of US/EU PIs
5. New investigators in first grant cycle — 1–3% transient
6. Common-name disambiguation failures — 5–10% of lookups ambiguous

### **record_left**

"PI lookup report": input (name + variants + claimed institution + claimed-PI flag); per funder hit count, top 5 grant IDs, role (PI/co-PI), institution, fiscal years; cross-funder summary (any-PI-presence, current-PI, institution-match); disambiguator data (ORCID if available); final flag set + reviewer disposition; source-version timestamps (API call time, dump release dates).

### **bypass_methods_known**

- Institution piggyback / non-PI visitor (visiting-researcher) — CAUGHT correctly null, weak signal
- grad-student footprint floor (unrelated-dept-student) — CAUGHT correctly null, weak
- manufactured persona (it-persona-manufacturing) — CAUGHT, moderate if PI claimed
- attacker's own name with no collision (dormant-domain) — CAUGHT
- dormant account with staleness indicators (dormant-account-takeover) — partial signal via `pi_inactive_5yr`.

### **bypass_methods_uncovered**

1. Real lab-manager credentials (lab-manager-voucher) — non-PIs expected null
2. Dormant account original PI's record (dormant-account-takeover) — check validates registered name, not current operator
3. Active session hijack (account-hijack) — check validates real PI
4. Foreign researcher at non-US/UK/EU institution (foreign-institution) — no funder coverage
5. Name-disambiguation collision (dormant-domain) — inherits former PI's grants with matching institution
6. Real insider / established researcher (insider-recruitment, bulk-order-noise-cover) — check validates genuine individuals

---

## Section 2: Narrative

### What this check is and how it works

This check queries five major public research-funder databases to determine whether a customer has served as a principal investigator or co-PI on a funded grant. NIH RePORTER and NSF Award Search are queried via live APIs; the Wellcome Trust Grants Awarded spreadsheet and CORDIS ERC PI sub-dataset are loaded from periodic bulk downloads into local indexes; UKRI Gateway to Research is queried via its persons API. All five sources are free, public, and require no authentication. The customer's name (with transliteration and alias variants) is searched across all five; results are aggregated into a cross-funder summary indicating whether any PI record exists, whether the PI is currently active, and whether the institution on the grant matches the customer's claimed institution.

### What it catches

A confirmed PI record on NIH, NSF, ERC, Wellcome, or UKRI grants is among the strongest individual-level positive evidence available. These records are created through competitive grant-award processes with institutional verification — they are extremely difficult to fabricate. The check's most valuable negative use is the claim-versus-reality mode: when a customer explicitly claims PI status but produces no funder record across all five databases, the contradiction is substantive and triggers escalation. Against the IT-persona-manufacturing story, a fabricated persona claiming PI status would be contradicted. Against the dormant-domain story (attacker's own name variant), `no_pi_record` fires correctly.

### What it misses

The check is structurally null for the majority of legitimate researchers and most attacker stories. An estimated 60–75% of synthesis order-placers are not PIs on any grant (postdocs, students, technicians, lab managers). Industry researchers (>90% invisible), researchers funded by non-covered agencies in Asia, Africa, Latin America, and the Middle East (~40–60% of global researchers), and privately funded researchers (2–5%) all produce expected null results. Attacker branches involving real individuals (insider-recruitment, bulk-order-noise-cover, account-hijack) pass because the check validates the person, not their intent. The dormant-domain name-collision variant can produce a false PI validation if the attacker's name matches a former PI at the defunct institution. Account-takeover scenarios are invisible because the check validates the registered name, though `pi_inactive_5yr` provides a weak staleness signal.

### What it costs

Marginal cost per check is $0 across all five sources. Wall time is approximately 1.5 seconds in parallel or 3–6 seconds sequential. Setup cost is 1–2 engineer-days for the multi-funder client, bulk-file ingest pipelines, cross-funder name normalization, and optional ORCID-based disambiguation.

### Operational realism

The central operational challenge is preventing the `no_pi_record` flag from flooding the review queue with expected negatives. The playbook explicitly frames the check as positive-evidence and instructs reviewers to escalate null results only when the customer claims PI status. When `pi_at_different_institution` fires, the reviewer investigates whether the mismatch reflects a recent move, a cross-institutional collaboration, or a genuine anomaly. Every lookup is logged with the funder-specific query results, the name variants attempted, any ORCID-based disambiguation, and the source-version timestamps for audit reproducibility. The Wellcome and CORDIS bulk files introduce 3–6 months of lag for newly awarded grants, meaning some legitimate new PIs will produce false negatives during their first months.

### Open questions

The Wellcome update cadence is [best guess: quarterly] based on observed snapshot dates but is not formally documented. The exact UKRI GtR-2 API route (`/persons` vs `/gtr-api/persons`) should be re-verified against the current API documentation. Coverage could be extended by adding CIHR (Canada), ARC (Australia), DFG (Germany), and NSFC (China), but each requires its own API integration and many non-Western funders do not offer name-searchable APIs. The ORCID-based disambiguator is described as optional ("if available") but is critical for the dormant-domain name-collision attack — its implementation priority should be raised.

---

## Section 3: Open issues for human review

- **No surviving Critical hardening findings.**
- **Moderate finding M1 (name-collision exploitation in dormant-domain scenario):** An attacker whose name collides with a former PI at a defunct institution could receive false PI validation with a matching institution. Suggested mitigation: require ORCID-based confirmation when PI records are found for names at institutions with other suspicious signals (e.g., `ror_inactive`). If no ORCID is available, flag as `pi_record_unverified`.
- **Moderate finding M2 (near-zero signal for most M19 stories):** The check is structurally null for 60–75% of order-placers and most attacker stories. This is inherent to PI-lookup checks and should inform stage 8 synthesis about complementary coverage needs.
- **[best guess] Wellcome Trust update cadence:** Appears quarterly based on observed snapshot dates but is not formally documented. (Stage 4C, UPGRADE-SUGGESTED.)
- **UKRI GtR-2 exact API route:** The `/persons` path should be re-verified against the current API PDF. (Stage 4C, MINOR.)
- **[best guess] coverage gap sizes for Gaps 4–6:** Privately funded researchers (2–5%), new investigators (1–3%), and name-collision ambiguity (5–10%) rely on reasoning without strong external citations. (Stage 6F, PASS but noted.)
- **ORCID disambiguator priority:** Currently described as optional but is the primary defense against the dormant-domain name-collision attack. Should be elevated to a required component.
- **Non-Western funder coverage extension:** Adding CIHR, ARC, DFG, NSFC would substantially improve geographic coverage but each requires separate integration work. This is a scoping decision for the implementation roadmap.
