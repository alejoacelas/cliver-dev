# Stage 1 Ideation — Measure 09 (institution-real-life-sciences) — v1

Measure: verify the customer's institution is real and relevant to life sciences. Idea generation modes: Direct (D), Attacker-driven (A).

---

## 1. Companies House (UK) entity existence + filing-history check
- **Modes:** D, A
- **Summary:** Query Companies House public API by company name/number; pull incorporation date, registered office, status (active/dissolved), filing history, SIC codes, officer list. Flag if no record, dissolved, address is a known formation-agent address, age <12 months, or SIC codes don't include life-sciences-relevant codes (72.11 R&D biotech, 21.20 pharma, 86.90 health, 72.19).
- **Attacker stories addressed:** shell-company (UK variant), shell-nonprofit, cro-framing, cro-identity-rotation, gradual-legitimacy-accumulation
- **External dependencies:** Companies House public API (free, key required)
- **Manual review handoff:** Reviewer sees company record, age, SIC codes, officer list. Playbook: if age<12mo OR SIC not life-sciences OR registered office is a known mass-formation-agent address → request additional evidence (lease, IBC, PI institutional email).
- **Flags thrown:** no record / dissolved / age<12mo / SIC mismatch / formation-agent address → review.
- **Failure modes:** API outage; ambiguous name match (multiple "Genomics Ltd"); customer is non-UK so no record exists (not a flag, just routes to other registry).
- **Record left:** stored API response (JSON) with timestamp + reviewer's resolution.
- *# stage 4: endpoint, fields, pricing*

## 2. SEC EDGAR full-text + entity search
- **Modes:** D
- **Summary:** Query EDGAR for the customer's institution. Public companies and many funded biotechs file Form D (Reg D), 10-K, S-1. Presence of EDGAR filings is a strong life-sciences-real signal; absence isn't dispositive but combined with other thin-signal flags increases scrutiny.
- **Attacker stories addressed:** shell-company, gradual-legitimacy-accumulation, cro-framing
- **External dependencies:** SEC EDGAR full-text search API (free)
- **Manual review handoff:** Reviewer cross-checks any returned filing's CIK, business description, and address against customer-provided info.
- **Flags thrown:** address mismatch between EDGAR filing and customer-provided → review; total absence + other thin-signal flags → review.
- **Failure modes:** Most small private biotechs have no EDGAR presence (high false negatives — used as positive signal only).
- **Record left:** EDGAR filing IDs cited.

## 3. Delaware Division of Corporations entity lookup
- **Modes:** D, A
- **Summary:** DE Division of Corporations General Information Name Search confirms LLC/Corp exists, status (good standing), formation date, registered agent. Most attacker shells incorporate in DE; flag if formation date <12mo, registered agent is a known mass-formation provider (Harvard Business Services, Northwest Registered Agent, Delaware Registered Agent LLC) and no other corroborating signals.
- **Attacker stories addressed:** shell-company, cro-framing, cro-identity-rotation, biotech-incubator-tenant, gradual-legitimacy-accumulation
- **External dependencies:** DE Division of Corporations name-search portal (free, no API; web scrape or paid wrapper)
- **Manual review handoff:** Reviewer gets formation date + agent name + status. Playbook: age<12mo + mass-formation-agent + no incubator/lease evidence → request lease.
- **Flags thrown:** no record / age<12mo / dissolved / registered-agent on mass-formation list.
- **Failure modes:** No public officer list in DE (unlike UK); state portal flaky; manual lookup overhead.
- **Record left:** screenshot/PDF of state record.

## 4. State Secretary-of-State filings (CA, NY, MA, WY, NM, NJ) via OpenCorporates
- **Modes:** D, A
- **Summary:** OpenCorporates aggregates state SOS data across 100+ jurisdictions including WY, NM (mentioned by attackers), CA, MA. Single API call confirms entity, principal name, formation date, current status. Catches Wyoming/New Mexico LLCs that bypass DE-only checks.
- **Attacker stories addressed:** cro-framing, cro-identity-rotation, community-bio-lab-network, shell-company
- **External dependencies:** OpenCorporates API (paid, tiered)
- **Manual review handoff:** Same playbook as DE check.
- **Flags thrown:** no record / age<12mo / shell-jurisdiction (WY/NM) + no operating-state filings.
- **Failure modes:** stale data in some jurisdictions; OpenCorporates licensing for KYC use may require enterprise tier.
- **Record left:** OpenCorporates entity ID + JSON snapshot.

## 5. GLEIF LEI lookup
- **Modes:** D
- **Summary:** Query GLEIF public LEI index by legal name. An LEI requires annual renewal and validated reference data (legal address, parent, status). Real funded biotechs frequently have LEIs (required for bond/securities transactions, some EU contracts). Free API.
- **Attacker stories addressed:** shell-company, cro-framing, gradual-legitimacy-accumulation
- **External dependencies:** GLEIF public API (free)
- **Manual review handoff:** Reviewer sees LEI status, registered address, last renewal. Used as positive signal: presence of valid LEI raises trust; absence is not a flag by itself for very small entities.
- **Flags thrown:** LAPSED or RETIRED LEI on a customer claiming active operations → review.
- **Failure modes:** Most US small biotechs have no LEI (high false negative).
- **Record left:** LEI code stored.

## 6. Dun & Bradstreet DUNS + business profile
- **Modes:** D, A
- **Summary:** Lookup the DUNS number (free via D&B's iUpdate or via D&B Direct/Hoovers API). DUNS records include business start date, employee count, primary SIC/NAICS, trade payment history. Attackers explicitly mentioned acquiring DUNS as part of shell-company setup; check for self-reported vs verified status, employee count = 0/1, no trade history.
- **Attacker stories addressed:** shell-company, gradual-legitimacy-accumulation, cro-framing, cro-identity-rotation
- **External dependencies:** D&B Direct/Hoovers API (paid)
- **Manual review handoff:** Self-reported DUNS with no trade payment history + life-science NAICS → request additional evidence.
- **Flags thrown:** DUNS exists but no trade history / employee count<2 / NAICS not life-sciences.
- **Failure modes:** D&B records can be self-reported and unverified (which is itself a signal).
- **Record left:** DUNS number + D&B profile snapshot.

## 7. ROR (Research Organization Registry) lookup
- **Modes:** D, A
- **Summary:** Query ROR public API by org name. ROR is curated; presence indicates the organization is a recognized research organization with publication output. Strong positive signal; absence is normal for small/new CROs but combined with other flags increases scrutiny.
- **Attacker stories addressed:** shell-company, shell-nonprofit, cro-framing, foreign-institution, dormant-domain
- **External dependencies:** ROR public API (free)
- **Manual review handoff:** ROR ID returned → strong positive; absence + claimed academic affiliation → flag.
- **Flags thrown:** customer claims university affiliation but no ROR record / ROR record exists but address/country mismatch.
- **Failure modes:** new legit CROs absent; ROR latency for new orgs.
- **Record left:** ROR ID + JSON.

## 8. Ringgold Identify
- **Modes:** D
- **Summary:** Ringgold ID is the institutional identifier used by scholarly publishers (Wiley, Elsevier subscription auth). Curated list of ~480k institutions worldwide. Query Ringgold by name; presence indicates scholarly-publishing-recognized institution.
- **Attacker stories addressed:** shell-nonprofit, foreign-institution, dormant-domain
- **External dependencies:** Ringgold Identify API (paid)
- **Manual review handoff:** Same as ROR.
- **Flags thrown:** absence + claimed university affiliation.
- **Failure modes:** redundant with ROR for many cases.
- **Record left:** Ringgold ID.

## 9. PubMed / OpenAlex institution publication-count check
- **Modes:** D, A
- **Summary:** Query OpenAlex `/institutions` endpoint by display name + country; if matched, retrieve `works_count` and `cited_by_count`. For PubMed, use the Affiliation field search via E-utilities `esearch` against `pubmed` for `"<institution>"[Affiliation]`. Threshold: <5 papers in last 5 years on a customer claiming an established research institution → flag. For CRO/startup customers, weight more on grants/registrations than publications.
- **Attacker stories addressed:** shell-company, shell-nonprofit, cro-framing, gradual-legitimacy-accumulation, dormant-domain (catches the *recency* gap), foreign-institution
- **External dependencies:** OpenAlex API (free), NCBI E-utilities (free)
- **Manual review handoff:** Reviewer sees publication counts by year; particularly checks recency (publications in last 24 months) and whether seed preprints are bioRxiv-only.
- **Flags thrown:** zero recent (24mo) publications; only bioRxiv preprints with same single author; named institution returns publications all from a different country (name collision).
- **Failure modes:** name collisions (esp. East Asian transliterations); legitimate stealth biotechs.
- **Record left:** OpenAlex institution ID + work counts JSON.

## 10. NIH RePORTER + NSF Award Search grant lookup
- **Modes:** D, A
- **Summary:** Query NIH RePORTER API by organization name; query NSF Award Search by awardee. Returns active and historical grants. Strong life-sciences relevance signal. Catches the dormant-domain branch *partially* (legacy grants exist but no recent awards).
- **Attacker stories addressed:** shell-company, gradual-legitimacy-accumulation, dormant-domain, foreign-institution (negative — exposes coverage gap)
- **External dependencies:** NIH RePORTER API (free), NSF Award Search API (free)
- **Manual review handoff:** Recent active grant → strong positive. Only historical grants with last award >5 yrs ago → potential dormant-entity flag.
- **Flags thrown:** zero grants ever / last grant >5y ago + claimed active research / grants exist but PI name doesn't match customer.
- **Failure modes:** non-NIH-funded labs (industry CROs) legitimately have no records.
- **Record left:** RePORTER project IDs cited.

## 11. ClinicalTrials.gov sponsor/collaborator lookup
- **Modes:** D
- **Summary:** Query CT.gov API for the institution as sponsor or collaborator. Active or recent trials = strong life-sciences-real signal. Particularly useful for mid-size biotechs and CROs claiming clinical work.
- **Attacker stories addressed:** shell-company, cro-framing, gradual-legitimacy-accumulation
- **External dependencies:** ClinicalTrials.gov API v2 (free)
- **Manual review handoff:** Sponsor record + recent trial → positive. CRO claiming clinical work but no CT.gov presence → flag combined with other signals.
- **Flags thrown:** customer claims trial sponsorship but no CT.gov record.
- **Failure modes:** preclinical-only and discovery-stage shops legitimately absent.
- **Record left:** NCT IDs.

## 12. FDA establishment registration lookup (FDA FURLS / Drug Establishments / Device Registration)
- **Modes:** D
- **Summary:** FDA's Drug Establishments Current Registration Site (DECRS) and Establishment Registration & Device Listing databases are public. Real CROs handling regulated work often appear. Query by firm name; presence is a strong positive.
- **Attacker stories addressed:** shell-company, cro-framing, cro-identity-rotation
- **External dependencies:** openFDA API (free) + FDA FURLS web search
- **Manual review handoff:** Registered establishment → strong positive. CRO claim + no FDA registration is normal for non-GMP shops, so used as positive signal only.
- **Flags thrown:** None on absence; mismatch between registration address and shipping address → flag.
- **Record left:** FEI number, registration record.

## 13. Crunchbase biotech-tag + funding-history lookup
- **Modes:** D, A
- **Summary:** Query Crunchbase API for the org name; pull category tags (Biotechnology, Pharma, Life Sciences), founding date, funding rounds, and investor names. A real funded biotech has investor names that themselves resolve. Self-listed Crunchbase profile with no funding rounds and tag added by the customer themselves → weak signal, treat as neutral. Funded rounds with named-VC investors → strong positive.
- **Attacker stories addressed:** shell-company, cro-framing, cro-identity-rotation, gradual-legitimacy-accumulation, biotech-incubator-tenant
- **External dependencies:** Crunchbase Enterprise API (paid)
- **Manual review handoff:** No funding + self-listed-only profile + age<12mo → flag. Funded with named investors → pass.
- **Flags thrown:** self-listed only / no funding rounds / category tag added by uploader (when API exposes provenance).
- **Failure modes:** Crunchbase data is largely self-curated.
- **Record left:** Crunchbase org UUID + funding rows.

## 14. Domain WHOIS + creation-date + DNS-history check
- **Modes:** D, A
- **Summary:** Pull WHOIS via RDAP for the institution's primary domain. Check registration date vs claimed founding; check WHOIS contact (privacy-protected? matches officer list?); check passive-DNS history (e.g. SecurityTrails, DomainTools) to detect recently-reactivated dormant domains. Catches the dormant-domain branch directly: an old domain with a recent name-server change + recent A-record reactivation is the exact fingerprint.
- **Attacker stories addressed:** dormant-domain, shell-company, gradual-legitimacy-accumulation, cro-framing
- **External dependencies:** RDAP (free); SecurityTrails or DomainTools passive DNS (paid); ICANN
- **Manual review handoff:** Domain age<6mo / privacy-WHOIS + no other corroborating life-sci signals → flag. Domain registered years ago but DNS first resolved in last 90 days → strong dormant-revival flag.
- **Flags thrown:** age<6mo, dormant-revival fingerprint, WHOIS country mismatch with claimed institution country.
- **Failure modes:** WHOIS privacy is now near-universal under GDPR.
- **Record left:** RDAP JSON, passive-DNS timeline.

## 15. Registered-agent / mass-formation-agent blocklist
- **Modes:** D, A
- **Summary:** Maintain an internal list of high-volume formation agents (Harvard Business Services, Northwest Registered Agent, Delaware Registered Agent LLC, Incorp Services, Cogency Global, etc.) and their known address strings. If the corporate-registry record returns a registered office matching one of these and the entity is <24 months old and has no other life-sciences signals, flag. Cheap deterrent, catches the most common shell pattern.
- **Attacker stories addressed:** shell-company, cro-framing, cro-identity-rotation, community-bio-lab-network
- **External dependencies:** internal blocklist (curated quarterly)
- **Manual review handoff:** Flagged → reviewer asks for lease document or PI institutional email.
- **Flags thrown:** registered-agent address match + age<24mo + no ROR/grants.
- **Failure modes:** legitimate small biotechs use these agents too — must combine with other signals.
- **Record left:** matched agent name in case file.

## 16. Virtual-office / co-working address blocklist (Regus, IWG, Davinci, Alliance, WeWork) + USPS CMRA flag
- **Modes:** D, A
- **Summary:** Match the institution's listed business address against a curated list of virtual-office providers and USPS Commercial Mail Receiving Agency (CMRA) addresses (USPS publishes the CMRA list). Combine with measure 09 entity check: real-address + life-sciences-thin = high suspicion.
- **Attacker stories addressed:** shell-company, cro-framing, cro-identity-rotation, gradual-legitimacy-accumulation
- **External dependencies:** USPS CMRA list; commercial address-intelligence vendor (Melissa, Smarty, Loqate)
- **Manual review handoff:** Virtual office + age<24mo → request lease/incubator membership proof.
- **Flags thrown:** CMRA-classified address + thin entity signals.
- **Failure modes:** real micro-biotechs do legitimately use Regus.
- **Record left:** CMRA flag in address record.

## 17. Recognized biotech-incubator tenant-directory cross-check
- **Modes:** A
- **Summary:** Maintain links to public tenant directories of LabCentral, BioLabs, JLABS, Cambridge Innovation Center life-sciences floor, Genspace, BioCurious, Indie Bio, etc. If the customer claims incubator tenancy, verify against the public directory. Defeats the biotech-incubator-tenant branch's *false* claims; legitimate tenants pass cleanly.
- **Attacker stories addressed:** biotech-incubator-tenant, community-bio-lab-network
- **External dependencies:** scraped/HTTP fetched tenant directories (manual; ~20 sites)
- **Manual review handoff:** Claim of incubator tenancy → directory hit required; if absent, request lease.
- **Flags thrown:** claimed tenancy with no directory hit.
- **Failure modes:** directory staleness; private/stealth tenants intentionally hidden.
- **Record left:** directory URL + match status.

## 18. Wayback Machine domain-age and content-evolution check
- **Modes:** A
- **Summary:** Query Internet Archive's Wayback Machine CDX API for the institution's domain. Returns the first-snapshot date and snapshot frequency. Catches: (a) domains with no snapshots before last 6 months (fresh shell), (b) domains where snapshots show a discontinuity (defunct lab page → reanimated lab page = dormant-domain branch).
- **Attacker stories addressed:** dormant-domain, shell-company, shell-nonprofit, gradual-legitimacy-accumulation
- **External dependencies:** Wayback CDX API (free)
- **Manual review handoff:** Reviewer sees first-snapshot date and last 5 snapshots. Discontinuity → escalate.
- **Flags thrown:** first snapshot <6mo ago / discontinuity gap >2 years / pre-aged via single-day snapshot burst.
- **Failure modes:** legitimate new biotechs also have new domains.
- **Record left:** CDX timeline JSON.

## 19. ORCID + author-affiliation-history check
- **Modes:** A
- **Summary:** Query ORCID public API for the principal's ORCID iD. Pull employment / education / works. Cross-check whether the affiliation listed on ORCID matches the customer's claimed institution and *predates* the entity's formation date. ORCID affiliations are self-asserted but historical edits leave a "last modified" timestamp.
- **Attacker stories addressed:** shell-company, cro-framing, gradual-legitimacy-accumulation, dormant-domain, foreign-institution
- **External dependencies:** ORCID public API (free)
- **Manual review handoff:** ORCID exists but employment list shows the customer institution added in last 30 days → flag.
- **Flags thrown:** self-asserted affiliation only / recently-added affiliation / no employment history at all.
- **Failure modes:** real researchers don't all maintain ORCID.
- **Record left:** ORCID iD + employment JSON.

## 20. IRS Form 990 / Tax-Exempt Organization Search (for nonprofits)
- **Modes:** A
- **Summary:** For institutions claiming nonprofit/501(c)(3) status, query IRS Tax-Exempt Organization Search and ProPublica Nonprofit Explorer for Form 990 filings. A real research nonprofit has 990s with revenue/expenditure aligned to research; a shell has zero or minimal filings.
- **Attacker stories addressed:** shell-nonprofit, community-bio-lab-network
- **External dependencies:** IRS TEOS (free); ProPublica Nonprofit Explorer (free)
- **Manual review handoff:** No 990 filed / 990 shows zero program expenses / 990 shows recent founding + no research expenditures → flag.
- **Flags thrown:** missing 990, zero-research-expense 990, name collision (two near-identical EINs).
- **Record left:** EIN + 990 PDF link.

## 21. Foreign-institution registry coverage (UGC India, MEXT Japan, CAPES Brazil, Russian Ministry of Science, MOE China)
- **Modes:** A
- **Summary:** For non-Anglophone institutions, route to a regional registry: UGC list of recognized Indian universities, MEXT list of Japanese universities/national institutes, CAPES Sucupira (Brazil), Russian Ministry of Science e-library / VAK, China MOE list. Catches the foreign-institution branch's "coverage gap" exploit by *closing* the coverage gap rather than relying solely on Western registries.
- **Attacker stories addressed:** foreign-institution, dormant-domain
- **External dependencies:** regional government registry websites (free, often non-API; manual lookup or scrape)
- **Manual review handoff:** Reviewer with regional language access verifies; otherwise escalate to regional reviewer.
- **Flags thrown:** institution not on regional government recognized list.
- **Failure modes:** language barrier; site availability; legitimate small private institutes may not appear.
- **Record left:** registry URL + entry ID.

## 22. SciELO / J-STAGE / KISS regional publication-index check
- **Modes:** A
- **Summary:** Query SciELO (Latin America), J-STAGE (Japan), KISS/RISS (Korea), CNKI (China) for the institution's publication output to address the foreign-institution Method 2 (English-only blind spot). Even partial integration closes the coverage gap.
- **Attacker stories addressed:** foreign-institution
- **External dependencies:** SciELO API; J-STAGE; CNKI (paid)
- **Manual review handoff:** Reviewer pulls top 5 publications from regional index; cross-checks affiliation strings.
- **Flags thrown:** customer claims active foreign institution + zero regional-index hits.
- **Failure modes:** name romanization mismatches.
- **Record left:** regional publication IDs.

## 23. Author-name disambiguation via ORCID + OpenAlex co-author graph
- **Modes:** A
- **Summary:** When the customer's name is high-collision (esp. East Asian names) and matches multiple PubMed/OpenAlex authors, require disambiguation via ORCID iD + email-domain validation + co-author overlap with claimed institution. Defeats the foreign-institution Method 1 (transliteration collision) and shell-nonprofit name-collision tactic.
- **Attacker stories addressed:** foreign-institution, shell-nonprofit, dormant-domain
- **External dependencies:** OpenAlex authors API; ORCID
- **Manual review handoff:** Reviewer is shown the top-3 candidate authors and their affiliations + last-publication-year; required to pick one or escalate.
- **Flags thrown:** >1 plausible candidate with no disambiguator.
- **Failure modes:** legitimate ambiguous-name researchers experience friction.
- **Record left:** disambiguation decision + chosen author ID.

## 24. DIYbio.org / DIYbiosphere directory cross-check (community-bio class)
- **Modes:** A
- **Summary:** For customers self-identifying as community biology labs, cross-reference DIYbio.org's local directory and DIYbiosphere index. Also check whether the lab's "founding members" appear at multiple labs (a known sign of seed-listing). This idea explicitly *accepts* the community-bio class but requires that the listing predates the order by ≥6 months and is corroborated by at least one second-party reference (Genspace alumni list, Hackuarium roster, Open Insulin contributor list).
- **Attacker stories addressed:** community-bio-lab-network
- **External dependencies:** DIYbio.org directory; DIYbiosphere; manual scrape
- **Manual review handoff:** Listing absent or <6mo old → request additional second-party corroboration.
- **Flags thrown:** absent listing / very recent listing / single-source listing only.
- **Failure modes:** new legitimate community labs.
- **Record left:** directory entry URL + first-seen date (Wayback).

## 25. Domain MX-record + email-deliverability + SPF/DKIM/DMARC check
- **Modes:** A
- **Summary:** For the institution's claimed email domain, check live MX records, presence of SPF/DKIM/DMARC, and SMTP deliverability. Shells often use Google Workspace MX with no DMARC. Combined with measure 02; specifically here it differentiates "domain exists on paper" from "domain operationally used."
- **Attacker stories addressed:** dormant-domain, shell-company, cro-identity-rotation
- **External dependencies:** DNS / SMTP probes (free)
- **Flags thrown:** no MX / freshly added MX / no DMARC + domain age<12mo.
- **Record left:** DNS snapshot.

---

## Coverage notes
- All 9 attacker stories have at least 2 ideas addressing them.
- foreign-institution is covered by ideas 21, 22, 23 specifically.
- dormant-domain is covered by ideas 14, 18, 25 (operational liveness) plus 10 (recent grants).
- community-bio-lab-network is the hardest class — only ideas 20, 24 directly engage the legitimate-community-bio population.

