# Stage 2 Feasibility — Measure 19 — v1

Reviewed against `01-ideation-measure-19-v1.md`. Two gates: concreteness, relevance.

| # | Idea | Concreteness | Relevance | Verdict | Note |
|---|---|---|---|---|---|
| 1 | ORCID public API | PASS — named API + specific fields (employments, source/verification, works) | PASS — addresses 5 stories incl. visiting-researcher's M4 Option 2 directly | **PASS** | |
| 2 | OpenAlex author profile | PASS — named API, named fields (last_known_institution, concepts) | PASS — addresses unrelated-dept-student concept-mismatch + visiting-researcher individual-vs-host distinction | **PASS** | |
| 3 | PubMed E-utilities author search | PASS — named API, named fields (AD, MeSH) | PASS — biomedical canonical, addresses unrelated-dept | **PASS** | |
| 4 | Scopus Author ID | PASS — named vendor API | PASS — disambiguation tiebreaker for the same stories | **PASS** | |
| 5 | Google Scholar profile | PASS (best-guess SerpAPI named, plausible) | PASS — soft signal for visiting-researcher / unrelated-dept | **PASS** | Stage 4 should note ToS friction. |
| 6 | NIH RePORTER PI | PASS — named API + URL | PASS — directly named in measure ("relevant grants awarded to customer"); catches lab-manager-voucher role mismatch | **PASS** | |
| 7 | NSF Award Search | PASS — named API + URL | PASS — non-medical bio coverage | **PASS** | |
| 8 | Wellcome Trust grants | PASS (best-guess 360Giving feed) | PASS — covers UK/foreign-institution gap | **PASS** | |
| 9 | ERC / CORDIS | PASS — named portal + URL | PASS — EU coverage for foreign-institution | **PASS** | |
| 10 | ClinicalTrials.gov v2 API | PASS — named API | PASS — strong positive signal for clinical PIs; addresses several stories | **PASS** | |
| 11 | FDA BIMO / Form 1572 | PASS (best-guess openFDA endpoint) | PASS weakly — positive-only signal, narrow population. Borderline. | **PASS** | Stage 4 likely confirms openFDA does not expose BIMO; may DROP later. |
| 12 | IBC roster / approval letter SOP | PASS — names NIH OBA registry + per-institution pages + upload SOP | PASS — strongest catch for unrelated-dept (Bypass A/B) and visiting-researcher; also distinguishes lab-manager-voucher (legit IBC role) | **PASS** | The most directly aligned idea with the measure's "biosafety committee approval" language. |
| 13 | Institutional faculty page scrape (ROR-derived domains) | PASS — names ROR + structured scraper + fields | PASS — surfaces dept mismatch (unrelated-dept), visiting title (visiting-researcher), defunct site (dormant-domain) | **PASS** | |
| 14 | ResearchGate scrape | PASS (best-guess) | PASS weakly — soft tiebreaker only | **PASS** | Borderline; stage 4 may downgrade. |
| 15 | LinkedIn via Proxycurl/PDL | PASS — named vendors | PASS — uniquely catches dormant-account-takeover + manufactured-persona thinness | **PASS** | |
| 16 | GA4GH Researcher Passport / NIH RAS / ELIXIR AAI | PASS — named brokers + named claim fields | PASS — addresses the largest set of stories of any idea, including account-hijack (live SSO) | **PASS** | |
| 17 | PubMed disambiguation via ORCID-in-AD | PASS — named query field `ORCID[au]` | PASS — uniquely targets unrelated-dept Bypass D | **PASS** | |
| 18 | Currency-of-affiliation re-verification SOP | PASS — names primitives (ORCID end-date, SMTP probe, LinkedIn vendor) and trigger (>6 months) | PASS — uniquely targets dormant-account-takeover, account-hijack, dormant-domain | **PASS** | |
| 19 | Role-vs-order-scope SOP | PASS — names role taxonomy and trigger | PASS — only idea targeting lab-manager-voucher / insider-recruitment / bulk-order-noise-cover at the M19 layer | **PASS** | |
| 20 | ORCID employment.disambiguated-organization ROR + dept cross-check | PASS — names exact ORCID field | PASS — directly targets Bypass A | **PASS** | |

## Gaps (uncovered attacker classes)
None. Every story in the mapping file is addressed by at least one PASS idea:
- visiting-researcher → 1, 2, 6, 12, 13, 16, 20
- unrelated-dept-student → 1, 2, 3, 12, 13, 17, 20
- lab-manager-voucher → 3, 6, 12, 19
- it-persona-manufacturing → 1, 2, 6, 10, 12, 13, 16
- dormant-account-takeover → 2, 15, 16, 18
- account-hijack → 16, 18
- foreign-institution → 1, 2, 4, 8, 9, 13, 15, 17
- dormant-domain → 1, 12, 13, 16, 18
- insider-recruitment → 12, 19
- bulk-order-noise-cover → 19

(Stories 6, 9, 10 are M19-structurally weak — addressed only by passport/currency/role SOPs, which is the correct answer; M19 cannot fully bind these and they should fall through to M20.)

## Stop signal
Zero REVISE, zero DROP, no uncovered classes.

**STOP: yes**
