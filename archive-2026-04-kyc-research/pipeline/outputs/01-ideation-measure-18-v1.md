# Stage 1 Ideation — Measure 18 (institution-legitimacy-soc) — v1

Measure: For each SOC order, document evidence that (a) the customer is affiliated with the claimed institution and (b) the institution is itself legitimate (legally registered, has government approvals, has a clear life-sciences connection). Flag triggers: cannot confirm affiliation and/or institutional legitimacy. The mapping file lists 12 attacker stories whose load-bearing element is institution-level legitimacy: shell-nonprofit, shell-company, biotech-incubator-tenant, cro-framing, cro-identity-rotation, community-bio-lab-network, gradual-legitimacy-accumulation, dormant-domain, foreign-institution, inbox-compromise, credential-compromise, it-persona-manufacturing.

Modes used per idea: D = Direct, A = Attacker-driven.

---

## 1. ROR (Research Organization Registry) lookup with self-listing red flags

- **Modes:** D, A (shell-nonprofit, shell-company, gradual-legitimacy-accumulation, foreign-institution)
- **Summary:** Query ROR's public API by institution name and by the customer email domain. Confirm the institution exists in ROR, fetch its `types` (Education, Facility, Healthcare, Nonprofit, Company, Government, Archive, Other), `established` year, country, parent/child relations, and listed domains. Flag: (i) no ROR record; (ii) ROR record exists but `established` year is recent (< 3 years); (iii) ROR record was added recently (use ROR data dump diffs to detect freshly self-listed orgs — shell-nonprofit Method 3 explicitly relies on ROR self-listing); (iv) `types` does not include Education / Facility / Healthcare / Nonprofit with a life-sci connection; (v) email domain ≠ any domain in the ROR record.
- **attacker_stories_addressed:** shell-nonprofit, shell-company, gradual-legitimacy-accumulation, foreign-institution, dormant-domain
- **external_dependencies:** ROR public API (`api.ror.org/organizations`), ROR Zenodo data dumps for diffing recently added records.
- **manual_review_handoff:** Reviewer gets the ROR record (or absence thereof), domain match status, and `established`/added-on dates. Playbook: if no ROR record OR record < 12 months old, escalate to individual-legitimacy (M19) or voucher (M20). If `types` lacks life-sci, require voucher.
- **flags_thrown:** `ror_no_match` → review; `ror_record_recent_self_listing` → review; `ror_domain_mismatch` → review; `ror_type_not_lifesci` → review.
- **failure_modes_requiring_review:** API down; multiple ROR matches for ambiguous name; non-Latin script name; foreign institution missing from ROR coverage.
- **record_left:** ROR id, full record JSON, ROR added-on timestamp from data dump, domain-match boolean, retained per audit policy.
- Other fields: # stage 4

---

## 2. GLEIF LEI lookup for legal-entity verification

- **Modes:** D, A (shell-company, cro-framing, cro-identity-rotation, shell-nonprofit)
- **Summary:** Query the GLEIF public API for an LEI matching the institution's legal name. Returns legal form, registration authority (e.g., Delaware Division of Corporations), entity status (ACTIVE/INACTIVE), creation date, headquarters address, and parent relationships. Flag: no LEI; LEI created within last 12 months; HQ is a known virtual-office / registered-agent address; LEI status LAPSED; ultimate parent is a shell holding company. Counters shell-company Method 1 (Delaware LLC + virtual office) and Method 2(a) (dormant micro-CRO acquisition — entity creation date will predate the new bio activity, but LEI ownership/control changes are flagged in GLEIF Level 2 data).
- **attacker_stories_addressed:** shell-company, shell-nonprofit, cro-framing, cro-identity-rotation
- **external_dependencies:** GLEIF API (`api.gleif.org/api/v1/lei-records`).
- **manual_review_handoff:** Reviewer gets LEI record, registration date, registered address, parent chain. Playbook: if entity < 12 months old or registered address matches a known virtual-office provider list, escalate to M19/M20.
- **flags_thrown:** `lei_no_match`; `lei_recent_registration`; `lei_address_is_virtual_office`; `lei_status_lapsed`.
- **failure_modes_requiring_review:** Many small US LLCs do not register an LEI at all (LEI is not mandatory in the US for non-financial entities), so absence of LEI is weak signal — escalate, don't block.
- **record_left:** LEI record JSON + timestamp.

---

## 3. Ringgold Identify lookup (institutional identifier used by publishers)

- **Modes:** D, A (shell-nonprofit, gradual-legitimacy-accumulation, foreign-institution)
- **Summary:** Ringgold maintains a curated registry of academic and research institutions used by Wiley, Elsevier, OUP, etc. Query Ringgold Identify (subscription) by institution name + country to obtain a Ringgold ID, parent hierarchy, and "consortia" memberships. Ringgold curation is editorial — recently fabricated nonprofits and shell companies will have no Ringgold ID. Complements ROR (which is self-service-listable) with a curated counterpart.
- **attacker_stories_addressed:** shell-nonprofit, gradual-legitimacy-accumulation, foreign-institution, shell-company
- **external_dependencies:** Ringgold Identify subscription (vendor-gated).
- **manual_review_handoff:** Reviewer escalates any institution without a Ringgold ID to M19/M20.
- **flags_thrown:** `ringgold_no_match` → review; `ringgold_id_assigned_recent` → review.
- **failure_modes_requiring_review:** Ringgold coverage is editorial — small but legitimate community labs or new institutes may not be in it.
- **record_left:** Ringgold ID + record snapshot.

---

## 4. UK Companies House and Charity Commission cross-check

- **Modes:** D, A (shell-company, shell-nonprofit, foreign-institution)
- **Summary:** For UK-claimed institutions, query Companies House public API (`api.company-information.service.gov.uk`) by company name / number, fetch incorporation date, registered office, SIC codes (life-sci SICs: 72110 R&D biotech, 72190 R&D nat-sci, 21100/21200 pharma manufacturing), and officer list. For nonprofits, query the Charity Commission for England & Wales register API for charity number, registered objects, and trustees. Flag: incorporation < 12 months; registered office at a mass-registered-agent address; SIC codes inconsistent with life sci; or charity object lacks any health/research mention.
- **attacker_stories_addressed:** shell-company, shell-nonprofit, foreign-institution
- **external_dependencies:** Companies House API (free, register required); Charity Commission for England & Wales register API; equivalent registers in Scotland (OSCR) and NI (CCNI).
- **manual_review_handoff:** Reviewer gets entity record with incorporation date, address, SIC, officers. Playbook: if address matches a known formation-agent list, require M19/M20.
- **flags_thrown:** `ch_recent_incorporation`; `ch_sic_not_lifesci`; `ch_address_formation_agent`; `cc_no_health_research_object`.
- **failure_modes_requiring_review:** Non-UK institutions; foreign subsidiaries with UK registration only.
- **record_left:** Companies House / Charity Commission record JSON + timestamp.

---

## 5. US state Secretary of State + IRS Tax Exempt Organization Search (Pub 78 / BMF) cross-check

- **Modes:** D, A (shell-nonprofit, shell-company)
- **Summary:** For US-claimed entities: (a) Query the relevant state Secretary of State business filings (Delaware, California, Massachusetts, etc.) for entity status, formation date, registered agent, and entity type. (b) Query IRS Tax Exempt Organization Search API (`apps.irs.gov/app/eos/`) for 501(c)(3) status, NTEE code (life-sci NTEE codes: H — Medical Research, U — Science & Technology Research, E — Health Care). Flag: formation < 12 months; registered agent is a mass-formation provider (CT Corporation, Harvard Business Services, Northwest Registered Agent for thousands); no IRS exemption; NTEE code unrelated to research. Catches shell-nonprofit fiscal-sponsor variant: the fiscal sponsor's EIN appears on filings, not the shell's.
- **attacker_stories_addressed:** shell-nonprofit, shell-company, gradual-legitimacy-accumulation
- **external_dependencies:** State SOS APIs (vary widely; Delaware is paywalled, California is free), IRS TEOS API/bulk data (Pub 78, BMF, Form 990 e-file).
- **manual_review_handoff:** Reviewer ties entity name → EIN → 990 filings → revenue → activity description.
- **flags_thrown:** `state_recent_formation`; `state_agent_mass_formation`; `irs_no_501c3`; `ntee_not_research`; `990_revenue_zero_or_missing`.
- **failure_modes_requiring_review:** State APIs are heterogeneous; many states lack a public API.
- **record_left:** State filing snapshot + IRS TEOS record + linked 990s URL list.

---

## 6. NIH RePORTER grant signal

- **Modes:** D, A (shell-nonprofit, shell-company, gradual-legitimacy-accumulation, foreign-institution, biotech-incubator-tenant)
- **Summary:** Query NIH RePORTER API (`api.reporter.nih.gov/v2/projects/search`) by organization name and by PI name. RePORTER returns awarded grants, project numbers, organization DUNS/UEI, fiscal year totals. Flag: institution has zero NIH-funded projects in the last 5 years AND zero PIs in the customer's role at the institution. Counters gradual-legitimacy-accumulation (small grants are listed in RePORTER; absence of even small SBIR/STTR is a signal). Catches shell-company because Delaware LLCs with no NIH track record have zero RePORTER hits.
- **attacker_stories_addressed:** shell-nonprofit, shell-company, gradual-legitimacy-accumulation, foreign-institution, biotech-incubator-tenant, cro-framing
- **external_dependencies:** NIH RePORTER API (free, no auth).
- **manual_review_handoff:** Reviewer gets grant count, total $, last-active fiscal year, PI list. Playbook: zero hits → escalate to M19/M20; non-zero but PI mismatch → reviewer searches for the customer in the PI list.
- **flags_thrown:** `reporter_no_grants`; `reporter_pi_mismatch`; `reporter_org_inactive_5y`.
- **failure_modes_requiring_review:** Non-US institutions and pure-industry CROs legitimately have no NIH grants.
- **record_left:** RePORTER query + JSON results.

---

## 7. NSF Award Search grant signal

- **Modes:** D, A (shell-nonprofit, shell-company, gradual-legitimacy-accumulation, foreign-institution)
- **Summary:** Same idea as RePORTER but for NSF awards via NSF Award Search API (`api.nsf.gov/services/v1/awards.json`). Query by `awardeeName`. Returns active and historical awards, PI names, BIO directorate flag. Flag: zero NSF BIO awards historical AND zero NIH RePORTER grants → strong "no public funding footprint" signal.
- **attacker_stories_addressed:** shell-nonprofit, shell-company, gradual-legitimacy-accumulation
- **external_dependencies:** NSF Award Search API (free).
- **manual_review_handoff:** Same playbook as RePORTER idea.
- **flags_thrown:** `nsf_no_bio_awards`.
- **failure_modes_requiring_review:** Non-US institutions; pure clinical research orgs.
- **record_left:** NSF API response.

---

## 8. Wellcome Trust + UKRI Gateway to Research grant signal (UK / EU coverage)

- **Modes:** D, A (foreign-institution, gradual-legitimacy-accumulation, shell-nonprofit)
- **Summary:** Query UKRI Gateway to Research API (`gtr.ukri.org/gtr/api`) and Wellcome Trust grants register (downloadable CSV / 360Giving) for the institution. Returns awards from BBSRC, MRC, Wellcome, etc. Provides UK/Commonwealth analog of RePORTER for the foreign-institution attacker class.
- **attacker_stories_addressed:** foreign-institution, shell-nonprofit, gradual-legitimacy-accumulation
- **external_dependencies:** UKRI GtR API (free); Wellcome Open Funding data; 360Giving aggregated UK funder data.
- **manual_review_handoff:** Same as RePORTER playbook, scoped to UK.
- **flags_thrown:** `gtr_no_awards`.
- **failure_modes_requiring_review:** Non-UK foreign institutions need a different funder.
- **record_left:** GtR API response.

---

## 9. ERC (European Research Council) + CORDIS funded-project lookup

- **Modes:** D, A (foreign-institution, gradual-legitimacy-accumulation)
- **Summary:** Query EU CORDIS API (`cordis.europa.eu/api`) for Horizon 2020 / Horizon Europe / FP7 awards by participant organisation name and PIC code (Participant Identification Code). PIC codes are EC-validated identifiers issued only after a documents-based legal-entity check by the Research Executive Agency — possessing a validated PIC is itself a legitimacy signal. Flag: no PIC; PIC issued < 12 months ago; zero CORDIS participations.
- **attacker_stories_addressed:** foreign-institution, shell-nonprofit, gradual-legitimacy-accumulation
- **external_dependencies:** CORDIS open data API; EC Funding & Tenders Portal participant register.
- **manual_review_handoff:** Reviewer fetches PIC validation status. Playbook: validated PIC + ≥1 award = strong legitimacy; no PIC = escalate to M19/M20.
- **flags_thrown:** `no_pic`; `pic_unvalidated`; `cordis_no_participation`.
- **failure_modes_requiring_review:** Non-European institutions.
- **record_left:** PIC + CORDIS record list.

---

## 10. OpenAlex institution-level publication signal

- **Modes:** D, A (shell-nonprofit, gradual-legitimacy-accumulation, dormant-domain, shell-company, foreign-institution)
- **Summary:** Query OpenAlex `/institutions` endpoint by ROR id (or by name/country) to obtain `works_count`, `cited_by_count`, `concepts` (life-sci concept share — concept ids C86803240 Biology, C54355233 Genetics, C70721500 Microbiology, C104317684 Gene). Then query `/works?filter=institutions.ror:<id>` filtered to last 24 months. Flag: zero life-sci works; works exist but all are bioRxiv/preprint with no journal version (matches shell-company Method 1 pattern of "post one or two bioRxiv preprints"); works exist but author affiliations were added in the last 90 days (OpenAlex tracks `updated_date`); concepts are not life-sci.
- **attacker_stories_addressed:** shell-nonprofit, shell-company, gradual-legitimacy-accumulation, dormant-domain, foreign-institution
- **external_dependencies:** OpenAlex API (free, no auth).
- **manual_review_handoff:** Reviewer gets pub count, recent-pub list, top concepts, preprint-vs-journal ratio.
- **flags_thrown:** `openalex_no_lifesci_works`; `openalex_only_preprints`; `openalex_recent_affiliation_attachment`.
- **failure_modes_requiring_review:** Legitimate brand-new groups have no publications yet.
- **record_left:** OpenAlex institution record + works list.

---

## 11. CrossRef + bioRxiv affiliation back-check

- **Modes:** D, A (shell-nonprofit, gradual-legitimacy-accumulation, shell-company)
- **Summary:** Query CrossRef API (`api.crossref.org/works?query.affiliation=<institution>`) and bioRxiv API (`api.biorxiv.org`) directly to count works claiming the institution as affiliation. Critical because shell-nonprofit and shell-company explicitly seed bioRxiv preprints. Cross-check authors named in those preprints against the customer name; flag if the customer is the only author and the only paper is < 6 months old.
- **attacker_stories_addressed:** shell-nonprofit, shell-company, gradual-legitimacy-accumulation
- **external_dependencies:** CrossRef REST API (free); bioRxiv API (free).
- **manual_review_handoff:** Reviewer reads the actual preprints; playbook: single-author single-preprint < 6 months → escalate.
- **flags_thrown:** `crossref_only_recent_preprint`; `crossref_single_author_solo`; `crossref_no_works_at_affiliation`.
- **failure_modes_requiring_review:** Affiliation strings vary; fuzzy match required.
- **record_left:** CrossRef response + DOI list.

---

## 12. InCommon Federation metadata + eduGAIN check (institutional SSO is real)

- **Modes:** D, A (it-persona-manufacturing, credential-compromise, foreign-institution, shell-nonprofit)
- **Summary:** Parse the InCommon Federation metadata aggregate (`mdq.incommon.org`) and the eduGAIN federation metadata aggregate to confirm the institution operates a federated SAML Identity Provider. Match the customer's email domain against `<md:Scope>` elements in the IdP entity descriptors. Real research universities and federal labs have IdPs in InCommon/eduGAIN; shell nonprofits and Delaware LLCs do not. Optionally require the customer to complete a federated login at order time as a step-up. Counters it-persona-manufacturing partially: federated login binds the order to a real institutional account, raising the bar from "got an alumni email" to "got a live IdP-recognized account."
- **attacker_stories_addressed:** it-persona-manufacturing, credential-compromise, shell-nonprofit, foreign-institution, shell-company
- **external_dependencies:** InCommon metadata aggregate (free); eduGAIN metadata aggregate (free); optionally a SAML SP for step-up auth (e.g., Auth0, Cirrus Bridge, or in-house Shibboleth SP).
- **manual_review_handoff:** Reviewer sees `idp_in_incommon: yes/no`, `domain_in_idp_scope: yes/no`. Playbook: domain not in any federation IdP → escalate to M19/M20.
- **flags_thrown:** `domain_no_federation_idp`; `idp_scope_mismatch`.
- **failure_modes_requiring_review:** Many legitimate small biotechs and foreign institutions are not in InCommon/eduGAIN — soft signal, not block.
- **record_left:** Metadata snapshot + matched entityID.

---

## 13. GA4GH Passports / RAS / ELIXIR AAI federated identity check

- **Modes:** D, A (it-persona-manufacturing, credential-compromise, foreign-institution)
- **Summary:** Require the customer to authenticate via a GA4GH Passport-issuing broker (NIH RAS, ELIXIR AAI, EGA, CRG) for SOC orders. The Passport visa includes `AffiliationAndRole` (researcher@institution.org), `AcceptedTermsAndPolicies`, and `ControlledAccessGrants` claims signed by the issuer. Catches it-persona-manufacturing only weakly (a manufactured account at a real institution would still pass), but raises the assurance that the affiliation claim is signed by a recognized broker rather than self-asserted.
- **attacker_stories_addressed:** it-persona-manufacturing, credential-compromise, foreign-institution
- **external_dependencies:** GA4GH Passport client; broker OIDC client registration with NIH RAS / ELIXIR AAI.
- **manual_review_handoff:** If passport visa absent or `AffiliationAndRole` blank, escalate.
- **flags_thrown:** `no_passport`; `affiliation_visa_missing`.
- **failure_modes_requiring_review:** Most research customers do not yet have Passports — coverage is narrow.
- **record_left:** Signed visa JWT (or hash) retained.

---

## 14. Email-domain verification: customer email is on a domain ROR/Companies House lists for the institution (and is not free / disposable)

- **Modes:** D, A (shell-nonprofit, shell-company, dormant-domain, inbox-compromise, foreign-institution)
- **Summary:** Step 1: reject `@gmail.com`, `@outlook.com`, `@protonmail.com`, etc. via a hard-coded free-mail list (Mailcheck / disposable-email-domains list on GitHub). Step 2: reject domains on a disposable/temporary mail list (e.g., `disposable-email-domains` GitHub list, Kickbox). Step 3: cross-check the domain against the ROR record's listed domains AND the institution's website TLS-cert SAN list. Flag: free mail; disposable; institutional domain not in ROR; domain WHOIS registrant is a privacy proxy or registered < 6 months ago.
- **attacker_stories_addressed:** shell-nonprofit, shell-company, inbox-compromise, dormant-domain, foreign-institution
- **external_dependencies:** Public free-mail/disposable-mail lists; WHOIS (RDAP `rdap.org`); TLS via Certificate Transparency (crt.sh) for SAN list.
- **manual_review_handoff:** Reviewer sees domain age, registrant, ROR-domain match.
- **flags_thrown:** `free_mail`; `disposable_mail`; `domain_recent_registration`; `domain_not_in_ror`.
- **failure_modes_requiring_review:** WHOIS privacy proxies are common and legitimate.
- **record_left:** RDAP record + crt.sh CT log entry list.

---

## 15. WHOIS / RDAP domain age + Certificate Transparency history (catches dormant-domain and aged-shell)

- **Modes:** D, A (dormant-domain, shell-company, gradual-legitimacy-accumulation, shell-nonprofit)
- **Summary:** Pull the institutional domain's RDAP record (creation date, last-changed date, registrar, registrant if not redacted), and Certificate Transparency log via crt.sh for first-seen date of any TLS cert on the apex domain. Specifically tuned to detect: (a) dormant-domain — creation date is old but CT log first-seen is recent (the domain was re-activated); (b) gradual-legitimacy-accumulation — CT first-seen is 6–24 months before order, matching the "pre-aging" timeline; (c) shell-company — domain creation < 12 months. Compare against Wayback Machine first/last snapshots — dormant-domain attackers exploit Wayback residue from the defunct entity, so a discontinuity (Wayback gap of years between defunct entity's last snapshot and the new content) is a strong signal.
- **attacker_stories_addressed:** dormant-domain, shell-company, gradual-legitimacy-accumulation, shell-nonprofit
- **external_dependencies:** RDAP (`rdap.org`); crt.sh; Wayback Machine CDX API.
- **manual_review_handoff:** Reviewer sees a timeline: WHOIS create, WHOIS last-changed, CT first-seen, Wayback first/last. Playbook: discontinuity > 1 yr → escalate.
- **flags_thrown:** `wayback_discontinuity`; `ct_first_seen_recent`; `whois_recent_creation`.
- **failure_modes_requiring_review:** Legitimate institutions sometimes change domains.
- **record_left:** RDAP + crt.sh + Wayback snapshot list.

---

## 16. Virtual-office / mass-registered-agent address blocklist

- **Modes:** D, A (shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, biotech-incubator-tenant)
- **Summary:** Maintain (and update quarterly) a list of known virtual-office providers (Regus, WeWork, Davinci, Alliance Virtual Offices, Opus Virtual Offices, iPostal1), commercial mail-receiving agencies (USPS CMRA flag via Smarty / Lob / Melissa), and mass-registered-agent street addresses (CT Corporation, Harvard Business Services, Northwest Registered Agent, Incorporating Services Ltd). Match the institution's claimed address against the list. Catches shell-company Method 1 directly (named in the bypass excerpt). Note biotech-incubator-tenant should be a soft signal because LabCentral / BioLabs / JLABS shared addresses are themselves legitimate but high-risk for borrowed legitimacy.
- **attacker_stories_addressed:** shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, biotech-incubator-tenant
- **external_dependencies:** In-house list; USPS CMRA flag via Smarty `cmra` field.
- **manual_review_handoff:** Address match → escalate. Incubator match → require incubator confirmation that the tenant has IBC umbrella coverage for SOC work (separate verification step).
- **flags_thrown:** `address_virtual_office`; `address_mass_agent`; `address_incubator` (soft).
- **failure_modes_requiring_review:** Geocoding ambiguity.
- **record_left:** Address normalization + matched list entry.

---

## 17. CAP (College of American Pathologists) accreditation directory lookup

- **Modes:** D, A (shell-company, cro-framing, biotech-incubator-tenant)
- **Summary:** Query the CAP Laboratory Accreditation directory (`webapps.cap.org/laboratorysearch`) for the customer's lab. CAP accreditation is an editorial, on-site-inspected credential — shell labs cannot fake it. Flag: lab claims clinical / pathology work but is not in CAP directory.
- **attacker_stories_addressed:** shell-company, cro-framing, biotech-incubator-tenant
- **external_dependencies:** CAP directory (web, scrape; no public API documented [best guess]).
- **manual_review_handoff:** Reviewer copies CAP accreditation number into record.
- **flags_thrown:** `cap_no_accreditation_for_clinical_claim`.
- **failure_modes_requiring_review:** Many legitimate research labs do not need CAP — only clinical labs do.
- **record_left:** CAP directory snapshot.

---

## 18. CLIA (Clinical Laboratory Improvement Amendments) certificate lookup via CMS

- **Modes:** D, A (shell-company, cro-framing)
- **Summary:** Query CMS QCOR (`qcor.cms.gov`) or the CLIA database export for the lab's CLIA certificate. CLIA certificate types: Waiver, PPM, Compliance, Accreditation. The certificate ties an entity to a physical address inspected by CMS. Flag: lab claims clinical-diagnostic work but no CLIA certificate; CLIA exists but address differs from claimed address.
- **attacker_stories_addressed:** shell-company, cro-framing
- **external_dependencies:** CMS QCOR / CLIA public file (free).
- **manual_review_handoff:** Reviewer ties CLIA number to address.
- **flags_thrown:** `clia_missing_for_clinical`; `clia_address_mismatch`.
- **failure_modes_requiring_review:** Pure-research labs are not CLIA-required.
- **record_left:** CLIA record snapshot.

---

## 19. AAALAC accreditation directory (animal-research institution legitimacy)

- **Modes:** D, A (shell-nonprofit, shell-company, cro-framing, foreign-institution)
- **Summary:** Query AAALAC International's accredited-units directory for institutions claiming animal research. AAALAC accreditation is editorial, on-site, and renewed every 3 years. Flag: institution claims animal research SOC use but is not AAALAC-accredited.
- **attacker_stories_addressed:** shell-nonprofit, shell-company, cro-framing, foreign-institution
- **external_dependencies:** AAALAC directory (web, no public API documented [best guess]).
- **manual_review_handoff:** Reviewer records accreditation status.
- **flags_thrown:** `aaalac_missing_for_animal_research`.
- **failure_modes_requiring_review:** Not all legitimate animal-research orgs are AAALAC-accredited (especially small foreign).
- **record_left:** Directory snapshot.

---

## 20. NIH OLAW assured-institution lookup

- **Modes:** D, A (shell-nonprofit, shell-company, foreign-institution, cro-framing)
- **Summary:** NIH Office of Laboratory Animal Welfare (OLAW) maintains a public list of institutions with an Animal Welfare Assurance (PHS Assurance number). Required for any institution that uses PHS funds for animal work. Query OLAW's assured-institution list (`olaw.nih.gov`) by name. Flag: institution claims animal-research SOC use AND claims NIH funding but is not on OLAW's list.
- **attacker_stories_addressed:** shell-nonprofit, shell-company, foreign-institution, cro-framing
- **external_dependencies:** OLAW assured-institution list (web; downloadable).
- **manual_review_handoff:** Reviewer ties Assurance number to institution.
- **flags_thrown:** `olaw_no_assurance_for_animal_research_claim`.
- **failure_modes_requiring_review:** Industry-only / non-PHS-funded animal research is exempt.
- **record_left:** OLAW list snapshot.

---

## 21. IBC (Institutional Biosafety Committee) registration check via NIH OSP

- **Modes:** D, A (shell-nonprofit, shell-company, biotech-incubator-tenant, community-bio-lab-network, cro-framing, gradual-legitimacy-accumulation)
- **Summary:** NIH Office of Science Policy (OSP) maintains a list of registered Institutional Biosafety Committees (IBCs) for institutions performing recombinant or synthetic nucleic acid research subject to the NIH Guidelines. Submit a FOIA / use the OSP-published IBC registration list to confirm the institution has a registered IBC and the IBC chair's name. Flag: institution claims rDNA / synthetic biology work but no IBC registration on file. Specifically catches biotech-incubator-tenant: the question becomes whether the incubator's IBC umbrella actually covers this tenant (incubator IBCs typically only cover housekeeping, not tenant-specific protocols), and shell-company Method 9 ("self-constituted IBC") which OSP would not recognize.
- **attacker_stories_addressed:** shell-nonprofit, shell-company, biotech-incubator-tenant, community-bio-lab-network, cro-framing, gradual-legitimacy-accumulation
- **external_dependencies:** NIH OSP IBC registration list (`osp.od.nih.gov`); FOIA fallback.
- **manual_review_handoff:** Reviewer logs IBC registration number and chair contact; for incubator tenants, requires letter from incubator IBC confirming protocol-level coverage.
- **flags_thrown:** `no_ibc_registration`; `self_constituted_ibc`; `incubator_ibc_umbrella_unverified`.
- **failure_modes_requiring_review:** Non-NIH-funded private labs are not required to register IBCs (but still subject to the Guidelines if they receive any NIH funds).
- **record_left:** OSP IBC list snapshot + chair email confirmation.

---

## 22. IACUC registration check (animal protocol oversight)

- **Modes:** D, A (shell-nonprofit, shell-company, foreign-institution, cro-framing)
- **Summary:** USDA APHIS maintains a public list of registered research facilities under the Animal Welfare Act with registration number, registrant, and inspection reports (Animal Care Information System / ACIS). Confirm the institution's registration. Pair with OLAW + AAALAC for triangulation.
- **attacker_stories_addressed:** shell-nonprofit, shell-company, foreign-institution, cro-framing
- **external_dependencies:** USDA APHIS ACIS public search.
- **manual_review_handoff:** Reviewer pulls inspection reports.
- **flags_thrown:** `no_aphis_registration`; `recent_noncompliance_in_aphis_inspection`.
- **failure_modes_requiring_review:** Non-vertebrate / non-covered species exempt.
- **record_left:** APHIS record snapshot.

---

## 23. OECD GLP compliance monitoring authority lookup

- **Modes:** D, A (cro-framing, shell-company, foreign-institution, cro-identity-rotation)
- **Summary:** OECD maintains a directory of national GLP (Good Laboratory Practice) compliance monitoring authorities (e.g., FDA ORA Bioresearch Monitoring, UK MHRA GLP Monitoring Authority, EPA OCSPP). Each national authority publishes a list of GLP-compliant test facilities. Query the relevant national list (e.g., FDA's Bioresearch Monitoring Program inspection database; MHRA's GLP-compliant facilities list) for CRO claims. Flag: entity claims to be a GLP CRO but is not on any national authority's list. Strong counter to cro-framing because GLP compliance is on-site-inspected.
- **attacker_stories_addressed:** cro-framing, shell-company, foreign-institution, cro-identity-rotation
- **external_dependencies:** FDA BIMO / MHRA GLP / EPA GLP / equivalent national lists (web).
- **manual_review_handoff:** Reviewer logs GLP compliance status + last inspection date.
- **flags_thrown:** `claims_glp_not_listed`.
- **failure_modes_requiring_review:** Non-GLP research CROs are legitimate but cannot use this signal.
- **record_left:** Listing snapshot + inspection date.

---

## 24. ISO/IEC 17025 accreditation registry lookup

- **Modes:** D, A (cro-framing, shell-company, foreign-institution)
- **Summary:** ISO/IEC 17025 is the testing-and-calibration laboratory accreditation standard. Each ILAC-recognized national accreditation body publishes an accredited-lab register (ANAB in the US, UKAS in the UK, A2LA in the US, DAkkS in Germany, NABL in India, CNAS in China). Query the ILAC member accreditation body for the lab name. Flag: entity claims ISO 17025 accreditation but is not in any ILAC member's register.
- **attacker_stories_addressed:** cro-framing, shell-company, foreign-institution, cro-identity-rotation
- **external_dependencies:** ANAB / A2LA / UKAS / DAkkS / NABL / CNAS public registers; ILAC member directory.
- **manual_review_handoff:** Reviewer logs accreditation cert number + scope (must list the relevant biological testing scope).
- **flags_thrown:** `iso17025_claim_not_in_register`; `iso17025_scope_mismatch`.
- **failure_modes_requiring_review:** Many legitimate research labs do not pursue ISO 17025.
- **record_left:** Register snapshot.

---

## 25. WHO BSL-3 / BSL-4 laboratory directory + UNESCO open-science lab directory

- **Modes:** D, A (foreign-institution, shell-nonprofit, community-bio-lab-network)
- **Summary:** [best guess] WHO maintains lists of BSL-3 / BSL-4 laboratories (e.g., the Global BSL-4 inventory published in WHO biosafety reports) and UNESCO publishes some country-level research-institution directories. Use as a corroborating signal for high-containment claims. If a customer claims to operate a BSL-3 facility for SOC work but the institution is not on any published BSL-3 inventory, escalate.
- **attacker_stories_addressed:** foreign-institution, shell-nonprofit, community-bio-lab-network, shell-company
- **external_dependencies:** WHO biosafety publications [best guess — these may be in PDF reports rather than an API]; UNESCO Institute for Statistics R&D database; national BSL inventories (e.g., US Federal Select Agent Program registered entities list).
- **manual_review_handoff:** Reviewer logs containment level + source.
- **flags_thrown:** `claims_high_containment_not_listed`.
- **failure_modes_requiring_review:** WHO inventories are partial; many legitimate BSL-3 labs are not publicly listed for security reasons.
- **record_left:** Source snapshot.

---

## 26. CDC/APHIS Federal Select Agent Program registered-entity check

- **Modes:** D, A (shell-company, shell-nonprofit, cro-framing, gradual-legitimacy-accumulation)
- **Summary:** The Federal Select Agent Program (CDC + USDA APHIS) maintains a list of entities registered to possess Select Agents and Toxins. While the full registration list is not public, the FSAP publishes statistics and the program will confirm registration on inquiry. For SOC orders that are select-agent-adjacent, require FSAP registration confirmation. Flag: entity claims work with select-agent-adjacent organisms but cannot produce a Form 1/Form 3 from FSAP.
- **attacker_stories_addressed:** shell-company, shell-nonprofit, cro-framing, gradual-legitimacy-accumulation
- **external_dependencies:** FSAP (`selectagents.gov`); manual confirmation flow.
- **manual_review_handoff:** Reviewer requires FSAP registration number from customer; verifies via direct email to FSAP program officer.
- **flags_thrown:** `no_fsap_for_select_agent_adjacent_order`.
- **failure_modes_requiring_review:** Most SOC orders are not select-agent.
- **record_left:** FSAP correspondence + registration number.

---

## 27. GuideStar / Candid Nonprofit Profile lookup (US 501(c)(3) deep profile)

- **Modes:** D, A (shell-nonprofit, gradual-legitimacy-accumulation)
- **Summary:** Query Candid (formerly GuideStar) for the nonprofit's profile: 990 history, programs, board members, revenue, expenses, fiscal-sponsor relationships. Counters shell-nonprofit fiscal-sponsor variant — Candid surfaces fiscal-sponsorship arrangements in 990 narratives and the sponsor's own filings. Flag: nonprofit has no 990s; revenue all comes from a fiscal sponsor; board has < 3 unrelated members.
- **attacker_stories_addressed:** shell-nonprofit, gradual-legitimacy-accumulation
- **external_dependencies:** Candid API / GuideStar Pro (vendor-gated, paid); ProPublica Nonprofit Explorer as a free fallback.
- **manual_review_handoff:** Reviewer reads 990 narrative.
- **flags_thrown:** `nonprofit_no_990`; `nonprofit_fiscal_sponsor_only_revenue`; `nonprofit_thin_board`.
- **failure_modes_requiring_review:** New nonprofits (< 1 fiscal year) legitimately have no 990.
- **record_left:** Candid / ProPublica record snapshot.

---

## 28. LinkedIn Company Page + employee-count cross-check via PDL / Apollo / SignalHire

- **Modes:** D, A (shell-company, shell-nonprofit, cro-framing, gradual-legitimacy-accumulation)
- **Summary:** Query a B2B data vendor (People Data Labs, Apollo.io, SignalHire, ZoomInfo) for the company's employee-count timeline and the named employees' job histories. Flag: company exists on LinkedIn but employee count = 1–2 with all profiles created in last 6 months; "employees" have suspiciously thin histories; CRO claims dozens of clients but has only 2 employees. Counters shell-company Method 1 ("LinkedIn profiles" called out as a construction step).
- **attacker_stories_addressed:** shell-company, shell-nonprofit, cro-framing, gradual-legitimacy-accumulation
- **external_dependencies:** Apollo / PDL / SignalHire / ZoomInfo (vendor-gated).
- **manual_review_handoff:** Reviewer scans employee histories.
- **flags_thrown:** `linkedin_thin_employee_base`; `employees_recent_only`.
- **failure_modes_requiring_review:** Legitimate small biotechs have thin LinkedIn presence.
- **record_left:** Vendor record snapshot.

---

## 29. Incubator-tenant confirmation via incubator-direct contact (LabCentral / BioLabs / JLABS roster)

- **Modes:** A (biotech-incubator-tenant)
- **Summary:** Maintain a list of known biotech incubators (LabCentral, BioLabs, JLABS, IndieBio, Cambridge Innovation Center, Mission Bay Capital, Alexandria LaunchLabs). For any customer claiming residency, contact the incubator's tenant-services email directly to confirm (a) the entity is a current resident, (b) the entity is covered under the incubator's IBC for the specific protocol class, (c) the entity has space/equipment for the claimed work. Counters biotech-incubator-tenant directly: borrowed legitimacy collapses if the incubator doesn't actually vouch for protocol-level coverage.
- **attacker_stories_addressed:** biotech-incubator-tenant, shell-company
- **external_dependencies:** Manual SOP; tenant-services email contacts maintained in-house.
- **manual_review_handoff:** Reviewer sends standard email template; if no reply in 5 business days, escalate.
- **flags_thrown:** `incubator_unconfirmed`; `incubator_ibc_does_not_cover_protocol`.
- **failure_modes_requiring_review:** Incubator-side response latency.
- **record_left:** Email thread retained.

---

## 30. Community-bio-lab known-roster check (DIYbio.org / Genspace / Counter Culture Labs / BioCurious / The Open Wetlab)

- **Modes:** A (community-bio-lab-network)
- **Summary:** Maintain a roster of known community biology labs (Genspace NYC, Counter Culture Labs Oakland, BioCurious Sunnyvale, BUGSS Baltimore, The Open Wetlab Amsterdam, Hackuarium Lausanne) and their declared SOC policies. For any customer claiming such a lab, check the roster, then contact the lab's listed safety officer to confirm the customer is a member in good standing AND that the lab's SOP permits SOC work of the type ordered (most community labs explicitly prohibit BSL-2+ and select-agent-adjacent work).
- **attacker_stories_addressed:** community-bio-lab-network
- **external_dependencies:** In-house roster + DIYbio.org member list (web).
- **manual_review_handoff:** Reviewer contacts lab safety officer.
- **flags_thrown:** `community_lab_unknown`; `community_lab_does_not_permit_soc_class`.
- **failure_modes_requiring_review:** Community labs change leadership.
- **record_left:** Email thread.

---

## 31. Email-channel binding: out-of-band confirmation to a directory-listed institutional address (anti-inbox-compromise)

- **Modes:** A (inbox-compromise, credential-compromise, it-persona-manufacturing)
- **Summary:** When a customer places an SOC order, do not accept the order-form email as proof. Instead, look up the institution's public directory page (most universities have a `directory.<institution>.edu` lookup) for the customer's name and send the confirmation to the directory-listed email, plus call the directory-listed phone number. Counters inbox-compromise (the lookalike inbox is not in the directory) and credential-compromise (the compromised account may not be the legitimate user, and the directory phone number routes to the real person). Pair with a federation-IdP step-up (idea 12).
- **attacker_stories_addressed:** inbox-compromise, credential-compromise, it-persona-manufacturing
- **external_dependencies:** Per-institution directory URL convention; manual SOP.
- **manual_review_handoff:** Reviewer performs the directory lookup and OOB confirmation; logs both.
- **flags_thrown:** `directory_email_mismatch`; `directory_phone_unreachable`; `directory_no_record`.
- **failure_modes_requiring_review:** Some institutions do not publish directories; some redact for privacy.
- **record_left:** Screenshot of directory page + call log.

---

## 32. ORCID employment record cross-check

- **Modes:** A (it-persona-manufacturing, gradual-legitimacy-accumulation, foreign-institution, shell-nonprofit)
- **Summary:** Query ORCID API by the customer name and email to fetch the public ORCID record. Check the `employments` section: is the claimed institution listed? When was the record added? Is it asserted by the institution itself (source = institution ROR/Ringgold) or only self-asserted by the user? Institution-asserted employment is much stronger because it requires the institution's ORCID member integration to push the record. Flag: no ORCID; ORCID exists but no employment at claimed institution; employment record self-asserted only.
- **attacker_stories_addressed:** it-persona-manufacturing, gradual-legitimacy-accumulation, foreign-institution, shell-nonprofit, shell-company
- **external_dependencies:** ORCID Public API (free, OAuth required for non-public fields).
- **manual_review_handoff:** Reviewer reviews record source.
- **flags_thrown:** `no_orcid`; `orcid_no_employment_at_claimed_institution`; `orcid_employment_self_asserted_only`; `orcid_recent_record_creation`.
- **failure_modes_requiring_review:** ORCID is widespread but not universal in industry.
- **record_left:** ORCID JSON snapshot.

---

## 33. Wikidata + Wikipedia institution presence (low-cost coarse check)

- **Modes:** D, A (shell-nonprofit, foreign-institution, gradual-legitimacy-accumulation)
- **Summary:** Query Wikidata SPARQL (`query.wikidata.org`) for an entity with the institution's name and instance-of `research institute` / `university` / `nonprofit organization`. Check existence and creation/edit history of the corresponding Wikipedia article. Flag: no Wikidata entity; Wikidata entity created < 6 months ago; Wikipedia article either absent or created by an SPA. Cheap coarse filter; should not be load-bearing alone.
- **attacker_stories_addressed:** shell-nonprofit, foreign-institution, gradual-legitimacy-accumulation
- **external_dependencies:** Wikidata SPARQL endpoint (free); Wikipedia API (free).
- **manual_review_handoff:** Reviewer pulls article history.
- **flags_thrown:** `wikidata_no_entity`; `wikidata_recent_creation`; `wikipedia_spa_creation`.
- **failure_modes_requiring_review:** Many legitimate small institutes are not on Wikipedia.
- **record_left:** Wikidata QID + Wikipedia revision history.

---

## 34. Composite "institution dossier" SOP — score across N signals before approval

- **Modes:** D, A (gradual-legitimacy-accumulation, shell-nonprofit, shell-company, cro-framing)
- **Summary:** SOP that bundles ROR (idea 1), GLEIF (2), grant signal (6/7/8/9), publication signal (10/11), domain history (15), federation IdP (12), and OFAC into a single dossier. Each signal scored present/absent/mixed, threshold (e.g., must have ≥4 strong-positive signals) decides approve / escalate / deny. Counters gradual-legitimacy-accumulation specifically because that attacker only invests in 2–3 signals (preprints + domain + ROR) — bumping the threshold above their effort budget forces them to either invest much more or fail.
- **attacker_stories_addressed:** gradual-legitimacy-accumulation, shell-nonprofit, shell-company, cro-framing, dormant-domain
- **external_dependencies:** All sub-checks above; in-house scoring rule.
- **manual_review_handoff:** Reviewer sees the dossier with each signal's status; playbook routes by composite score.
- **flags_thrown:** `composite_score_below_threshold`.
- **failure_modes_requiring_review:** Edge cases where legitimate small/foreign institutions score low.
- **record_left:** Dossier JSON + score + decision.

---

## 35. OFAC SDN + EU + UK + UN consolidated sanctions list against institution name and address

- **Modes:** D, A (foreign-institution, shell-company, shell-nonprofit)
- **Summary:** Screen the institution legal name, DBA, address, and any disclosed officers against OFAC SDN, EU consolidated, UK OFSI, UN, and BIS Entity List using Treasury's free OFAC API or a vendor (Refinitiv World-Check, Dow Jones Risk Center, ComplyAdvantage). While sanctions are not strictly an institution-legitimacy check, a hit instantly resolves the legitimacy question.
- **attacker_stories_addressed:** foreign-institution, shell-nonprofit, shell-company
- **external_dependencies:** OFAC SDN feed (free); BIS Entity List; vendor screening (paid).
- **manual_review_handoff:** Standard sanctions playbook.
- **flags_thrown:** `sanctions_hit`.
- **failure_modes_requiring_review:** False positives on common names.
- **record_left:** Screening hit record.

---

## Dropped

(none — first iteration)
