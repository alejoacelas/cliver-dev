# Stage 2 Feasibility — Measure 09 — v1

Adversarial review against concreteness + relevance gates.

| # | Idea | Concreteness | Relevance | Verdict | Notes |
|---|---|---|---|---|---|
| 1 | Companies House UK API | PASS (named API, fields, SIC codes) | PASS (UK shells, foreign-institution UK variant) | **PASS** | |
| 2 | SEC EDGAR | PASS | PASS (positive signal) | **PASS** | |
| 3 | DE Division of Corporations | PASS | PASS (DE shells central to shell-company, cro-framing) | **PASS** | |
| 4 | OpenCorporates (state SOS aggregation) | PASS | PASS (WY/NM LLCs explicitly used in cro-identity-rotation, community-bio) | **PASS** | |
| 5 | GLEIF LEI | PASS | PASS (positive signal; lapsed-LEI flag for revived dormant) | **PASS** | |
| 6 | D&B DUNS | PASS | PASS (attackers explicitly acquire DUNS in shell-company) | **PASS** | |
| 7 | ROR | PASS | PASS (research-org curated index) | **PASS** | |
| 8 | Ringgold | PASS | PASS | **PASS** | borderline-redundant w/ ROR but distinct dataset |
| 9 | OpenAlex / PubMed affiliation count | PASS | PASS (publication-thinness is the central life-sci signal) | **PASS** | |
| 10 | NIH RePORTER + NSF | PASS | PASS | **PASS** | |
| 11 | ClinicalTrials.gov | PASS | PASS | **PASS** | |
| 12 | FDA FURLS / openFDA establishment | PASS | PASS | **PASS** | |
| 13 | Crunchbase biotech tag + funding | PASS | PASS (named investor signal defeats self-listing tactic) | **PASS** | |
| 14 | RDAP WHOIS + passive DNS | PASS | PASS (dormant-domain branch directly) | **PASS** | |
| 15 | Mass-formation-agent blocklist | PASS (named agents) | PASS (the canonical shell pattern) | **PASS** | |
| 16 | Virtual-office + USPS CMRA blocklist | PASS | PASS | **PASS** | |
| 17 | Biotech-incubator tenant directory cross-check | PASS (LabCentral/BioLabs/JLABS named) | PASS (biotech-incubator-tenant branch) | **PASS** | |
| 18 | Wayback CDX | PASS | PASS (catches pre-aging burst + dormant discontinuity) | **PASS** | |
| 19 | ORCID employment-history | PASS | PASS (recently-added affiliation flag) | **PASS** | |
| 20 | IRS TEOS / ProPublica 990 | PASS | PASS (shell-nonprofit) | **PASS** | |
| 21 | Foreign government registries (UGC/MEXT/CAPES/MOE/VAK) | PASS (named registries) | PASS (closes foreign-institution coverage gap) | **PASS** | |
| 22 | SciELO/J-STAGE/CNKI publication index | PASS | PASS (foreign-institution Method 2) | **PASS** | |
| 23 | OpenAlex/ORCID name disambiguation | PASS | PASS (foreign-institution Method 1, shell-nonprofit name collision) | **PASS** | |
| 24 | DIYbio.org / DIYbiosphere directory | PASS | PASS (only idea engaging community-bio class directly) | **PASS** | |
| 25 | MX/SPF/DKIM/DMARC + SMTP probe | PASS | PASS (operational liveness for dormant-domain) | **PASS** | |

## Gaps
- All 9 attacker stories have at least 2 covering ideas.
- shell-company: 1, 3, 4, 6, 9, 10, 13, 14, 15, 16, 18 — strong coverage.
- shell-nonprofit: 1, 9, 18, 20, 23 — covered.
- cro-framing: 3, 4, 6, 9, 12, 13, 15, 16 — covered.
- cro-identity-rotation: 4, 6, 12, 15, 16, 25 — covered.
- biotech-incubator-tenant: 13, 17 — covered, though only 17 directly verifies the tenancy claim.
- gradual-legitimacy-accumulation: 1, 6, 9, 10, 13, 14, 18, 19 — covered.
- community-bio-lab-network: 20, 24 — thinnest coverage; structurally hard.
- dormant-domain: 7, 9, 10, 14, 18, 19, 25 — covered.
- foreign-institution: 7, 9, 21, 22, 23 — covered.

No uncovered attacker class. Zero REVISE/DROP verdicts.

## STOP: yes
