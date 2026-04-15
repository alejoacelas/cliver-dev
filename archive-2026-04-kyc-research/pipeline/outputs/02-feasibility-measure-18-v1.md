# Stage 2 Feasibility Check — Measure 18 (institution-legitimacy-soc) — v1

Reviewing `01-ideation-measure-18-v1.md`. Two gates: concreteness (specific named source) and relevance (plausibly catches at least one mapped attacker story).

---

## 1. ROR lookup with self-listing red flags
- **Concreteness:** PASS — names ROR API and ROR Zenodo data dumps.
- **Relevance:** PASS — shell-nonprofit Method 3 explicitly nominates ROR self-listing; the diff-against-data-dump tactic targets that bypass directly.
- **Verdict:** PASS

## 2. GLEIF LEI lookup
- **Concreteness:** PASS — GLEIF API named.
- **Relevance:** PASS — shell-company Delaware LLC pattern surfaces in GLEIF Level 1/2 data; entity-creation date catches the freshness signal. Caveat that LEI is optional in US is acknowledged in failure modes.
- **Verdict:** PASS

## 3. Ringgold Identify
- **Concreteness:** PASS — named registry, vendor-gated noted.
- **Relevance:** PASS — editorial curation specifically counters self-listed shell entities.
- **Verdict:** PASS

## 4. Companies House + Charity Commission
- **Concreteness:** PASS — both APIs named with endpoints and SIC codes.
- **Relevance:** PASS — covers UK foreign-institution variant and UK shell-company.
- **Verdict:** PASS

## 5. State SOS + IRS TEOS
- **Concreteness:** PASS — IRS TEOS endpoint named, NTEE codes named, state SOS named even though heterogeneous.
- **Relevance:** PASS — directly engages shell-nonprofit fiscal-sponsor and shell-company Delaware LLC.
- **Verdict:** PASS

## 6. NIH RePORTER
- **Concreteness:** PASS — API endpoint named.
- **Relevance:** PASS — gradual-legitimacy-accumulation explicitly mentions "small grants" as a construction signal; absence is informative.
- **Verdict:** PASS

## 7. NSF Award Search
- **Concreteness:** PASS — API named.
- **Relevance:** PASS — same logic as RePORTER. Slight duplicate-risk with idea 6 but covers a different funder so kept distinct.
- **Verdict:** PASS

## 8. UKRI GtR + Wellcome
- **Concreteness:** PASS — API named.
- **Relevance:** PASS — covers UK foreign-institution.
- **Verdict:** PASS

## 9. ERC + CORDIS / PIC
- **Concreteness:** PASS — CORDIS API and PIC concept named.
- **Relevance:** PASS — PIC validation is a documents-based EC check; directly counters foreign-institution and gradual-legitimacy variants.
- **Verdict:** PASS

## 10. OpenAlex institution
- **Concreteness:** PASS — endpoint and concept ids named.
- **Relevance:** PASS — preprint-only / recent-affiliation-attachment heuristics map onto shell-company and shell-nonprofit explicit bypass methods.
- **Verdict:** PASS

## 11. CrossRef + bioRxiv affiliation back-check
- **Concreteness:** PASS — both APIs named.
- **Relevance:** PASS — shell-nonprofit and shell-company explicitly seed bioRxiv preprints; this idea targets that exact bypass.
- **Verdict:** PASS. Possible overlap with idea 10 but different-enough source to keep.

## 12. InCommon / eduGAIN
- **Concreteness:** PASS — InCommon mdq endpoint named.
- **Relevance:** PASS — directly raises bar for it-persona-manufacturing and credential-compromise; also signals shell-nonprofit absence from federations.
- **Verdict:** PASS

## 13. GA4GH Passports / RAS / ELIXIR AAI
- **Concreteness:** PASS — Passport, RAS, ELIXIR AAI named.
- **Relevance:** PASS, marginally — coverage is narrow today but the idea explicitly addresses it-persona-manufacturing and credential-compromise. Soft signal acknowledged in failure modes.
- **Verdict:** PASS

## 14. Email-domain verification (free/disposable + ROR + WHOIS)
- **Concreteness:** PASS — names disposable-email-domains GitHub list, RDAP, crt.sh.
- **Relevance:** PASS — engages inbox-compromise (lookalike domains caught by ROR mismatch), dormant-domain (recent re-registration), shell-company.
- **Verdict:** PASS

## 15. WHOIS / RDAP + CT + Wayback
- **Concreteness:** PASS — RDAP, crt.sh, Wayback CDX named.
- **Relevance:** PASS — Wayback discontinuity signal directly targets dormant-domain; CT first-seen targets gradual-legitimacy pre-aging.
- **Verdict:** PASS

## 16. Virtual-office / mass-agent blocklist
- **Concreteness:** PASS — names specific providers and CMRA flag via Smarty/Lob/Melissa.
- **Relevance:** PASS — shell-company bypass excerpt explicitly mentions virtual office.
- **Verdict:** PASS

## 17. CAP accreditation
- **Concreteness:** PASS — CAP directory URL named.
- **Relevance:** PASS only when entity claims clinical work — narrow but addresses cro-framing's CRO-services posture.
- **Verdict:** PASS

## 18. CLIA / CMS QCOR
- **Concreteness:** PASS — CMS QCOR named.
- **Relevance:** PASS — narrow (clinical claims only) but covers cro-framing.
- **Verdict:** PASS

## 19. AAALAC
- **Concreteness:** PASS — named.
- **Relevance:** PASS — narrow (animal-research claims).
- **Verdict:** PASS

## 20. NIH OLAW
- **Concreteness:** PASS — OLAW assured-institution list named.
- **Relevance:** PASS — counters animal-research claims by shell entities.
- **Verdict:** PASS

## 21. NIH OSP IBC registration
- **Concreteness:** PASS — NIH OSP IBC list named.
- **Relevance:** PASS — biotech-incubator-tenant and shell-company self-constituted IBC explicitly named in bypass excerpts.
- **Verdict:** PASS

## 22. USDA APHIS / IACUC
- **Concreteness:** PASS — APHIS ACIS named.
- **Relevance:** PASS — covers animal-research claims by shell entities and foreign-institution.
- **Verdict:** PASS

## 23. OECD GLP / FDA BIMO / MHRA GLP
- **Concreteness:** PASS — FDA BIMO and MHRA GLP authorities named.
- **Relevance:** PASS — directly counters cro-framing (CROs typically claim GLP).
- **Verdict:** PASS

## 24. ISO/IEC 17025 registries
- **Concreteness:** PASS — A2LA, ANAB, UKAS, DAkkS, NABL, CNAS named.
- **Relevance:** PASS — same target as 23, complementary scope (testing vs preclinical).
- **Verdict:** PASS

## 25. WHO BSL-3/4 + UNESCO directories
- **Concreteness:** REVISE — marked `[best guess]`. WHO BSL-3 inventories are mostly PDF reports without an API. UNESCO UIS R&D database is real but coarse. The Federal Select Agent Program registered-entities list is mentioned but is partly addressed in idea 26.
- **Relevance:** PASS in principle for foreign-institution claiming high-containment work.
- **Verdict:** REVISE — name a specific publication or registry (e.g., the 2011 WHO BSL-4 inventory, Global BioLabs map by King's College London / Global Biolabs.org), or fold into idea 26 if no separate concrete source exists.

## 26. CDC/APHIS Federal Select Agent Program
- **Concreteness:** PASS — selectagents.gov named, Form 1 / Form 3 named.
- **Relevance:** PASS — narrow (select-agent-adjacent SOC orders) but highly load-bearing where applicable.
- **Verdict:** PASS

## 27. Candid / GuideStar + ProPublica Nonprofit Explorer
- **Concreteness:** PASS — both named.
- **Relevance:** PASS — directly engages shell-nonprofit fiscal-sponsor variant via 990 narrative.
- **Verdict:** PASS

## 28. LinkedIn / PDL / Apollo employee count
- **Concreteness:** PASS — multiple vendors named.
- **Relevance:** PASS — shell-company explicitly mentions LinkedIn profiles as construction signal.
- **Verdict:** PASS

## 29. Incubator-direct confirmation SOP
- **Concreteness:** PASS — names LabCentral, BioLabs, JLABS, IndieBio etc. and the SOP.
- **Relevance:** PASS — biotech-incubator-tenant story explicitly turns on borrowed legitimacy.
- **Verdict:** PASS

## 30. Community-bio-lab roster
- **Concreteness:** PASS — names Genspace, Counter Culture Labs, BioCurious, BUGSS, Open Wetlab, Hackuarium, DIYbio.org list.
- **Relevance:** PASS — community-bio-lab-network is the only attacker story, and this idea targets it directly.
- **Verdict:** PASS

## 31. OOB confirmation to directory-listed institutional address
- **Concreteness:** PASS — directory.<institution>.edu convention is a real SOP; manual playbook spelled out.
- **Relevance:** PASS — inbox-compromise and credential-compromise are the only attacker stories where the order email itself is the bypass surface; this targets them.
- **Verdict:** PASS

## 32. ORCID employment record
- **Concreteness:** PASS — ORCID Public API named, employment-source distinction named.
- **Relevance:** PASS — institution-asserted employment vs self-asserted is a real ORCID feature that catches it-persona-manufacturing and shell-nonprofit fabricated personas.
- **Verdict:** PASS

## 33. Wikidata + Wikipedia presence
- **Concreteness:** PASS — Wikidata SPARQL endpoint named.
- **Relevance:** PASS as a coarse signal for shell-nonprofit / foreign-institution; the idea itself acknowledges it should not be load-bearing.
- **Verdict:** PASS

## 34. Composite institution dossier SOP
- **Concreteness:** PASS — concrete sub-checks named, scoring rule specified.
- **Relevance:** PASS — gradual-legitimacy-accumulation is best countered by raising the breadth-of-investment bar; this is the SOP that does it.
- **Verdict:** PASS

## 35. OFAC SDN + EU/UK/UN sanctions
- **Concreteness:** PASS — OFAC API, BIS Entity List, Refinitiv, Dow Jones, ComplyAdvantage all named.
- **Relevance:** PASS — foreign-institution most directly; not the dominant signal but a hard stop when triggered.
- **Verdict:** PASS

---

## Gaps (attacker stories with no current idea or weak coverage)

- **cro-identity-rotation** — covered as a side-effect of ideas 2, 16, 23, 24 (each rotated shell must independently produce LEI / GLP / ISO 17025 / non-virtual address), but no idea explicitly looks for *cross-shell* signals (same registered agent across rotated shells, same officer names across LEIs, shared crt.sh issuer fingerprints across domains, shared PI name across multiple "client" CROs). Worth adding a dedicated idea in v2.
- **inbox-compromise (lookalike domain variant)** — partially covered by ideas 14 and 31, but a dedicated lookalike-domain detector (homoglyph / IDN confusable / Levenshtein distance against the real institution's domain, plus crt.sh first-seen) would be cleaner.
- **credential-compromise inside a real institution** — once the attacker is operating from a real `@university.edu` mailbox, M18 has fundamentally limited reach; ideas 12 and 31 raise the bar but don't catch a fully compromised account. This is a structural gap M18 cannot close on its own — note for stage 8 synthesis, not an action item for stage 1.

---

## Summary

35 ideas reviewed. 34 PASS, 1 REVISE (idea 25 — name a concrete BSL inventory source or fold in). Two real gaps surface (cross-shell rotation detection; lookalike-domain detector) that should become new ideas in v2.

STOP: no
