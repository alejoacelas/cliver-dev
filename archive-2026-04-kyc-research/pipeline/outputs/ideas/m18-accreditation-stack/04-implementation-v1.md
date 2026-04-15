# m18-accreditation-stack — implementation v1

- **measure:** M18 (institution-legitimacy-soc)
- **name:** Accreditation registry stack (CAP/CLIA/AAALAC/OLAW/ISO 17025/GLP/Global BioLabs)
- **modes:** D, A
- **summary:** When a customer claims an institutional accreditation that is relevant to their stated research (clinical pathology, animal use, calibration, GLP toxicology, high-containment pathogen work), cross-reference the claim against the relevant accreditation registry. Each registry below has a domain, a public lookup interface, and a different coverage profile. Combined, they catch most "fake-accreditation," "paper-shell-research-org," and "fake-BSL" attacker stories. None individually covers everything; the value is the union.

## external_dependencies

- **CMS QCOR / CLIA Laboratory Lookup** — clinical labs, including CAP-accredited subset.
- **CAP** (College of American Pathologists) — clinical pathology accreditation; verified via CMS QCOR or directly via CAP's own member directory.
- **AAALAC International** — animal-care accreditation; ~1,140+ accredited orgs in 52 countries ([AAALAC directory](https://www.aaalac.org/accreditation-program/directory/directory-of-accredited-organizations/)).
- **NIH OLAW Animal Welfare Assurance** — assured PHS-funded institutions.
- **A2LA** — largest US ISO/IEC 17025 accreditor; public directory.
- **ANAB** — second major US ISO/IEC 17025 accreditor; public directory.
- **UKAS** — UK ISO/IEC 17025; public directory.
- **OECD GLP MAD network** — national GLP monitoring authorities; FDA BIMO GLP inspection list for US.
- **FDA BIMO GLP** — FDA's Bioresearch Monitoring program GLP-compliant facility tracking.
- **Global BioLabs map** — King's College London hosted directory of BSL-4 and BSL-3+ labs ([globalbiolabs.org/map](https://www.globalbiolabs.org/map)).
- Internal manual-review function to handle gated registries and judgment calls.

## endpoint_details

### CMS QCOR / CLIA Laboratory Lookup
- **URL:** [https://qcor.cms.gov/CLIA_Lab_Lookup](https://qcor.cms.gov/CLIA_Lab_Lookup) ([CMS Laboratory Demographics page](https://www.cms.gov/medicare/quality/clinical-laboratory-improvement-amendments/laboratory-registry)).
- **Auth:** anonymous public web tool.
- **Update cadence:** weekly per [CMS](https://www.cms.gov/medicare/quality/clinical-laboratory-improvement-amendments/laboratory-registry).
- **Public API:** `[unknown — searched for: "CMS QCOR API", "CLIA laboratory lookup REST API", "CMS QCOR programmatic access", "CLIA lab data download bulk"]`. `[best guess: QCOR is a JSP-driven web tool with no documented public API; integration is via screen-scrape or via the bulk Laboratory Demographics file CMS publishes for download.]`
- **Pricing:** free.
- **ToS:** standard CMS open-data terms.

### CAP
- **URL:** [https://www.cap.org/](https://www.cap.org/) — CAP publishes a "Find an Accredited Laboratory" tool. `[unknown — searched for: "CAP find accredited laboratory directory URL", "CAP accreditation lookup tool"]` for the exact directory URL. CAP-accredited labs are also flagged in the QCOR record under accrediting organization, so the QCOR lookup is a sufficient secondary path.
- **Auth:** anonymous web.
- **Pricing:** free.

### AAALAC
- **URL:** [https://www.aaalac.org/accreditation-program/directory/directory-of-accredited-organizations/](https://www.aaalac.org/accreditation-program/directory/directory-of-accredited-organizations/).
- **Auth:** anonymous web; search by organization name and country.
- **Coverage:** 1,140+ orgs in 52 countries ([AAALAC directory page](https://www.aaalac.org/accreditation-program/directory/directory-of-accredited-organizations/)).
- **Public API:** `[unknown — searched for: "AAALAC directory API", "AAALAC accredited organizations data download"]`. `[best guess: web-only; integration via scrape.]`
- **Pricing:** free.

### NIH OLAW Animal Welfare Assurance
- **URL:** OLAW maintains the Assured Institutions list at olaw.nih.gov; cross-walks to AAALAC are documented at [olaw.nih.gov AAALAC Program Description page](https://olaw.nih.gov/policies-laws/21st-century-cures-act/AAALAC-Program-Description).
- **Auth:** anonymous public.
- **API:** `[unknown — searched for: "OLAW assured institutions list download", "NIH OLAW API"]`.
- **Pricing:** free.

### A2LA
- **URL:** [https://customer.a2la.org/index.cfm?event=directory.index](https://customer.a2la.org/index.cfm?event=directory.index) ([A2LA directory linked from ISOBudgets guide](https://www.isobudgets.com/how-to-find-an-iso-17025-accredited-laboratory/)).
- **Auth:** anonymous web.
- **Coverage:** "largest accreditor of calibration laboratories in the United States" per [A2LA](https://a2la.org/).
- **API:** `[unknown — searched for: "A2LA directory API", "A2LA accredited labs JSON"]`.
- **Pricing:** free.

### ANAB
- **URL:** [https://search.anab.org/](https://search.anab.org/) ([linked from ISOBudgets guide](https://www.isobudgets.com/how-to-find-an-iso-17025-accredited-laboratory/)).
- **Auth:** anonymous web.
- **API:** `[unknown — searched for: "ANAB directory API", "ANAB accredited organizations data feed"]`.
- **Pricing:** free.

### UKAS
- **URL:** ukas.com — public lookup. `[unknown — searched for: "UKAS accredited laboratory search URL", "UKAS directory ISO 17025"]` for the exact tool path.
- **Auth:** anonymous.
- **Pricing:** free.

### OECD GLP / FDA BIMO
- **URL:** [FDA GLP page](https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/bioresearch-monitoring/good-laboratory-practices-glp). FDA's BIMO program inspects GLP facilities; an FDA active GLP lab list of "hundreds of facilities worldwide, on the order of 300-500 labs" is referenced in industry summaries (e.g., [IntuitionLabs 21 CFR Part 58 guide](https://intuitionlabs.ai/articles/21-cfr-part-58-glp-guide)).
- OECD MAD: each member country runs its own GLP monitoring program (480+ such programs globally per industry summary). No single global list.
- **API:** `[unknown — searched for: "FDA BIMO GLP facility list download", "OECD GLP MAD compliance status list", "FDA GLP active facility list"]`. `[best guess: FOIA-able PDF list, no API; this registry is the weakest of the stack for automated lookup.]`
- **Pricing:** free for FDA-published material.

### Global BioLabs map
- **URL:** [https://www.globalbiolabs.org/map](https://www.globalbiolabs.org/map). Project hosted at King's College London with George Mason University and Bulletin of the Atomic Scientists.
- **Auth:** anonymous public.
- **Coverage:** as of [Global BioLabs Report 2023](https://www.kcl.ac.uk/warstudies/assets/global-biolabs-report-2023.pdf), 69 BSL-4 labs across 27 countries plus 57 BSL-3+ labs.
- **API:** `[unknown — searched for: "Global BioLabs map API", "globalbiolabs.org data download", "Global BioLabs CSV"]`. `[best guess: research project hosts the data as an interactive map; data is small enough to maintain a manual mirror on the consuming side.]`
- **Pricing:** free.

## fields_returned

Per registry, the consuming side gets at minimum: organization name, address, accreditation status (active/lapsed/withdrawn), accreditation scope (which standards / which species / which test methods), accreditation start and expiry dates, and accrediting body identifier.

- **CMS QCOR:** CLIA number, facility name, address, certificate type, certificate expiry, accrediting organization (CAP / Joint Commission / etc.), suspended/limited/revoked status ([CMS Laboratory Registry page](https://www.cms.gov/medicare/quality/clinical-laboratory-improvement-amendments/laboratory-registry)).
- **AAALAC:** org name, country, accreditation status, original accreditation date `[vendor-described, not technically documented — based on public directory page]`.
- **A2LA / ANAB:** org name, accreditation number, scope of accreditation document (PDF) listing tested methods and standards.
- **Global BioLabs:** lab name, country, BSL level (3+ / 4), operating status (operating / under construction / planned), institutional host, public-policy disclosure flags ([Global BioLabs Report 2023](https://www.kcl.ac.uk/warstudies/assets/global-biolabs-report-2023.pdf)).

## marginal_cost_per_check

- **All registries are free** for public lookup.
- **Engineering cost:** dominated by integration and maintenance of 7+ different scrape/lookup paths. `[best guess: $0.05–$0.20 per customer for the human-attention cost of having a screening analyst run the relevant subset of registries when an accreditation is claimed; ~5 minutes per customer at $50/hr fully loaded only when an accreditation claim is being verified.]`
- **Setup cost:** building/maintaining scrapers for each registry, mirroring small datasets, mapping institution-name normalization across registries (a hard problem). `[best guess: $30K–$100K initial; $20K/year ongoing.]`

## manual_review_handoff

When `claimed_accreditation_not_in_registry` fires:

1. Reviewer identifies which accreditation the customer claimed and which registry should hold it (a small lookup table maps domain → registry).
2. Reviewer queries the relevant registry directly (web or local mirror) to confirm the negative result wasn't a name-normalization miss; tries common-name variants.
3. **No record found:** reviewer asks the customer to provide the accreditation certificate number and accrediting body. Reviewer queries the registry by certificate number.
4. **Still no record:** reviewer contacts the accrediting body's office directly (most have a verification email/phone).
5. **Confirmed false claim:** escalate to biosecurity officer; deny the order; flag the customer for elevated scrutiny on future orders.
6. **Confirmed lapsed accreditation:** treat as soft negative; ask customer about re-accreditation timeline; case-by-case decision.
7. **Registry gated or absent for the relevant scope** (e.g., classified labs, foreign equivalents): document the gap; escalate; consider voucher path (m20).

## flags_thrown

- `claimed_accreditation_not_in_registry` — no match found.
- `claimed_accreditation_lapsed` — match found but expired or withdrawn.
- `accreditation_scope_mismatch` — institution is accredited but the scope (e.g., CAP for hematology only) does not cover the customer's claimed work (e.g., select-agent virology).
- `accreditation_name_collision` — close-but-not-exact match in the registry; possible name-collision attack (per the m18 shell-nonprofit attacker story).
- `bsl_claim_not_in_global_biolabs_map` — customer claims BSL-3+/BSL-4 work but the institution is not in the Global BioLabs registry.

## failure_modes_requiring_review

- **Registry coverage gaps.** Classified DoD/IC labs, many foreign labs, and small private clinical labs are absent from one or more registries.
- **Name normalization errors.** "MIT" vs "Massachusetts Institute of Technology" vs "M.I.T."; common in registry lookups.
- **Lapsed-but-renewing.** Institution between accreditation cycles is technically not in the registry; needs human judgment.
- **Voluntary vs. mandatory accreditations.** AAALAC is voluntary ([OLAW webinar](https://olaw.nih.gov/sites/default/files/09_09_2021%20What%20Every%20IACUC%20Should%20Know%20About%20AAALAC%20International%20Transcript.pdf)); a real animal-research institution may legitimately not be AAALAC-accredited and still hold an OLAW assurance, or vice versa.
- **Scope-vs-claim mismatches** require domain expertise to adjudicate.
- **Global BioLabs map is curated, not comprehensive** — research project, not a regulatory registry; absences are not authoritative.
- **GLP registry is the weakest** — no consolidated public list exists; FDA BIMO inspection results are not a clean feed.

## false_positive_qualitative

- Small new labs that legitimately do not yet hold accreditation but conduct life-sciences research.
- Foreign institutions whose national-equivalent accreditation does not appear in any of the US/UK-centric registries here.
- Independent researchers and citizen-science labs (community bio).
- Government / national lab researchers whose institutional accreditation is administered through agency-internal systems not reflected in the public registries above.
- Recently-renamed or merged institutions whose registry record has not yet been updated.
- Researchers at institutions accredited under one scope (e.g., calibration via A2LA) who are doing work not in scope (which is fine for the customer but reads as a "scope mismatch" against the registry).

## record_left

- Per registry queried: query terms, response payload (or absence), timestamp.
- Snapshot of the matched registry record (or the negative result) saved to the customer file.
- For Global BioLabs: snapshot of the report-level coverage caveat.
- Reviewer's adjudication memo.
- Audit trail showing which registries were queried and which weren't (with reason — "claim is for animal care, queried AAALAC and OLAW only").
- Sufficient artifact set to demonstrate the negative was investigated, not just absent.

## Sourcing notes

- All registry URLs are direct from the publishing organization. Where I couldn't find a documented API, the field is marked `[unknown]` with a plausible search list — the consistent finding is that these registries are anonymous public web tools without published APIs, so integration is via scraping or bulk download where one exists. This is real friction but not fatal.
- The voluntary-vs-mandatory caveat for AAALAC vs OLAW is from [OLAW's own training material](https://olaw.nih.gov/sites/default/files/09_09_2021%20What%20Every%20IACUC%20Should%20Know%20About%20AAALAC%20International%20Transcript.pdf).
- Global BioLabs counts (69 BSL-4, 57 BSL-3+) are from the [Global BioLabs Report 2023](https://www.kcl.ac.uk/warstudies/assets/global-biolabs-report-2023.pdf) hosted by King's College London.
