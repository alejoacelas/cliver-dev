# Stage 1 Ideation — Measure 18 (institution-legitimacy-soc) — v2

Iteration 2. v1 had 34 PASS / 1 REVISE / 0 DROP, plus two gap classes flagged by stage 2 (cro-identity-rotation cross-shell signals; lookalike-domain detector for inbox-compromise). Ideas 1–24 and 26–35 are copied forward unchanged. Idea 25 is revised. Two new ideas (36, 37) close the gaps.

For brevity, ideas with verdict PASS in v1 are referenced by name and number; the full schema for each is in `01-ideation-measure-18-v1.md`. Only revised and new ideas are reproduced in full here.

---

## Copied forward unchanged (PASS in v1)

1. ROR (Research Organization Registry) lookup with self-listing red flags
2. GLEIF LEI lookup
3. Ringgold Identify
4. UK Companies House + Charity Commission
5. US state SOS + IRS Tax Exempt Organization Search
6. NIH RePORTER
7. NSF Award Search
8. UKRI Gateway to Research + Wellcome
9. ERC / CORDIS / PIC
10. OpenAlex institution publication signal
11. CrossRef + bioRxiv affiliation back-check
12. InCommon Federation + eduGAIN
13. GA4GH Passports / RAS / ELIXIR AAI
14. Email-domain verification (free/disposable + ROR + WHOIS)
15. WHOIS / RDAP + CT + Wayback
16. Virtual-office / mass-registered-agent blocklist
17. CAP accreditation directory
18. CLIA / CMS QCOR
19. AAALAC accreditation directory
20. NIH OLAW assured-institution list
21. NIH OSP IBC registration list
22. USDA APHIS / IACUC ACIS
23. OECD GLP / FDA BIMO / MHRA GLP
24. ISO/IEC 17025 accreditation registries (A2LA, ANAB, UKAS, DAkkS, NABL, CNAS)
26. CDC/APHIS Federal Select Agent Program
27. Candid + ProPublica Nonprofit Explorer
28. LinkedIn / PDL / Apollo employee count
29. Incubator-direct confirmation SOP
30. Community-bio-lab roster
31. OOB confirmation to directory-listed institutional address
32. ORCID employment record
33. Wikidata + Wikipedia presence
34. Composite institution dossier SOP
35. OFAC SDN + EU/UK/UN sanctions

---

## 25. Global BioLabs map + WHO/national high-containment registries (REVISED)

- **Modes:** D, A (foreign-institution, shell-nonprofit, community-bio-lab-network, shell-company)
- **Summary:** Use the Global BioLabs project (`globalbiolabs.org`, King's College London + George Mason, Filippa Lentzos et al.) which publishes an interactive map and a downloadable dataset of all known BSL-4 and large BSL-3+ facilities worldwide with country, operator, and accreditation status. Pair with: (a) US Federal Select Agent Program registered-entities references (idea 26 covers FSAP directly); (b) the WHO biosafety report inventories where they exist; (c) national high-containment registries published by some health ministries (UK Health and Safety Executive's published list of containment level 3/4 facilities; Public Health Agency of Canada's licensed-facilities register under the HPTA). Flag: customer claims operation of a BSL-3 / BSL-4 facility for SOC use but the operator/site does not appear in Global BioLabs and is not on any national licensed-facilities register.
- **attacker_stories_addressed:** foreign-institution, shell-nonprofit, community-bio-lab-network, shell-company
- **external_dependencies:** globalbiolabs.org dataset; UK HSE published list; Canada PHAC HPTA licence holder list; equivalent national lists where they exist.
- **manual_review_handoff:** Reviewer logs containment level, operator, source list, and accreditation status. Playbook: claimed high-containment + not in any list → escalate to M19/M20 + require photographs / inspection report.
- **flags_thrown:** `claims_high_containment_not_in_global_biolabs`; `claims_high_containment_not_in_national_register`.
- **failure_modes_requiring_review:** Some legitimate high-containment labs (especially defense / classified) are intentionally not in public maps.
- **record_left:** Global BioLabs entry snapshot + national register snapshot.

---

## 36. Cross-shell rotation detector — shared registered-agent / officer / cert-issuer fingerprinting (NEW)

- **Modes:** A (cro-identity-rotation, shell-company, shell-nonprofit, cro-framing)
- **Summary:** Maintain an internal graph of every previously-screened institution's (a) registered-agent name and address (from GLEIF, Companies House, state SOS), (b) officer / director names (from GLEIF Level 2 parent records, Companies House officers endpoint, state SOS filings, IRS Form 990 board), (c) WHOIS registrant where not redacted, (d) Certificate Transparency issuer + cert serial reuse on the institutional domain (via crt.sh), (e) shared NIH RePORTER PI names across multiple "client" CROs, (f) IP / hosting fingerprint (Censys / Shodan A-record clusters). On each new SOC order, query the graph: does this customer's institution share ≥2 of these fingerprints with a previously-screened entity that was either flagged or operates under a different name? Targets cro-identity-rotation directly: rotated shells almost always share at least one of registered agent, officer, or hosting provider because the operator reuses tooling.
- **attacker_stories_addressed:** cro-identity-rotation, shell-company, shell-nonprofit, cro-framing
- **external_dependencies:** Internal Neo4j / Postgres entity graph; Companies House officers API; GLEIF Level 2 relationships; Censys / Shodan; crt.sh; ProPublica Nonprofit Explorer for 990 boards.
- **manual_review_handoff:** Reviewer sees a "linked entities" panel listing the prior screened entities sharing each fingerprint with edge labels (`shared_registered_agent`, `shared_officer`, `shared_hosting`). Playbook: ≥2 shared fingerprints with any entity ever flagged → escalate; ≥3 shared fingerprints with any entity (flagged or not) → escalate as possible rotation cluster.
- **flags_thrown:** `cross_shell_shared_agent`; `cross_shell_shared_officer`; `cross_shell_shared_hosting`; `cross_shell_shared_pi`; `cross_shell_shared_cert_issuer_serial`.
- **failure_modes_requiring_review:** Mass-formation registered agents legitimately serve thousands of distinct entities (overlap on registered agent alone is weak signal; require ≥2 dimensions); same PI legitimately consults for multiple CROs.
- **record_left:** Graph query + matched edges + entity ids retained.

---

## 37. Lookalike / homoglyph institutional-domain detector (NEW)

- **Modes:** A (inbox-compromise, shell-nonprofit, it-persona-manufacturing)
- **Summary:** For every SOC order, normalize the customer's email domain and the claimed institution's official domain (looked up via ROR / Companies House / OpenAlex). Run: (a) IDN-to-ASCII / Punycode conversion + Unicode confusable normalization (use Unicode UTS #39 confusables.txt or the `confusable_homoglyphs` Python lib); (b) Levenshtein distance ≤ 2 against a corpus of legitimate research-institution domains (ROR's domain list seeded); (c) typosquat patterns (transposition, doubled-letter, dropped-letter, alternate TLD `.org` ↔ `.edu` ↔ `.ac.uk`); (d) crt.sh first-seen-on-cert age of the customer domain (paired with idea 15); (e) `dnstwist` permutation generation against the real institution's domain to see if the customer's domain falls in the permutation set. Targets inbox-compromise (lookalike domain variant explicitly named in the attacker file) and shell-nonprofit's name-collision tactic when collisions extend to domains. Also catches it-persona-manufacturing when the attacker registers `university-edu.org` rather than compromising the real `university.edu`.
- **attacker_stories_addressed:** inbox-compromise, shell-nonprofit, it-persona-manufacturing
- **external_dependencies:** UTS #39 confusables list; `dnstwist` (open source); Levenshtein library; ROR domain corpus; crt.sh.
- **manual_review_handoff:** Reviewer sees the suspected target domain, the customer's domain, the distance metric, the dnstwist permutation that matched, and the CT first-seen date. Playbook: lookalike + recent CT first-seen → escalate, contact the real institution's directory (idea 31) for confirmation.
- **flags_thrown:** `domain_homoglyph_match`; `domain_levenshtein_le_2_to_real_institution`; `domain_dnstwist_permutation_match`; `domain_typosquat_alt_tld`.
- **failure_modes_requiring_review:** Legitimate university spinouts and foundations sometimes register domains visually adjacent to the parent (`harvard-medical.org`); reviewer must distinguish.
- **record_left:** Permutation report + crt.sh entry.

---

## Dropped

(none — v1 had no DROPs and the v1 REVISE was successfully revised)
