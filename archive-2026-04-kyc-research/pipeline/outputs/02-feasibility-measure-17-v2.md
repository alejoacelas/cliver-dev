# Stage 2 Feasibility Check — Measure 17 (pre-approval-list) — v2

Reviewing `01-ideation-measure-17-v2.md`. Verdicts on each idea; checking that v1 REVISE/DROP feedback was addressed and that the three new ideas (19, 20, 21) actually close the gaps.

---

## Verdicts

- **Idea 1 (FSAP).** Concreteness PASS. Relevance PASS — `attacker_stories_addressed` now lists the three manufactured-tenure branches with the FBI SRA load-bearing rationale, which is correct: an FBI/CJIS Security Risk Assessment is the binding constraint, not paperwork. **PASS.**

- **Idea 2 (NIH IBC).** Unchanged from v1. **PASS.**

- **Idea 3 (IGSC shared rejected-customer list).** Concreteness PASS-ish — narrowed honestly to "if such a list exists, ingest it; otherwise this is a research-question for stage 4." The honest admission is the right move; stage 4 can determine whether IGSC has any such mechanism. Relevance PASS — the shared-attribute-match rationale (named individual, registered agent, shipping address) is exactly the operative thing for catching a returning operator. **PASS.**

- **Idea 6 (MSA signatory list).** Unchanged. **PASS.**

- **Idea 7 (CRM historical-buyer scoring).** Unchanged. **PASS.**

- **Idea 8 (NIH RePORTER).** Unchanged but with dormant-account-takeover added to the addressed list (the >5y expired-funding signal). **PASS.**

- **Idea 9 (NSF Award Search).** Unchanged. **PASS.**

- **Idea 10 (positive verification event SOP).** Unchanged. **PASS.**

- **Idea 11 (event-driven re-verification).** Unchanged. **PASS.**

- **Idea 12 (calendar-driven re-IAL2 for shared accounts).** Unchanged. **PASS.**

- **Idea 13 (do-not-fast-lane internal blacklist).** Unchanged. **PASS.**

- **Idea 14 (USAspending.gov federal-award lookup).** Concreteness PASS — names the API endpoint family and the relevant NAICS codes. Relevance PASS — the SBIR/STTR competitive-review timescale is genuinely incompatible with the 6–12 month window the manufactured-tenure branches operate on. The narrowing from "mere SAM.gov registration" was the right call. **PASS.**

- **Idea 16 (ORCID + ROR + OpenAlex).** Unchanged. **PASS.**

- **Idea 17 (Sift / Sardine / Alloy fraud network).** Unchanged. **PASS.**

- **Idea 18 (incubator-address fast-lane exclusion).** Unchanged. **PASS.**

- **Idea 19 (breach-data / infostealer subscription).** Concreteness PASS — names four specific vendors (SpyCloud, Have I Been Pwned Enterprise, Constella, Recorded Future Identity Intelligence). Relevance PASS — the credential-compromise branch explicitly cites infostealer-log marketplaces as its sourcing method, so this is the most direct possible counter. The SOP-level detail (force password+MFA reset, out-of-band contact via institutional phone) is appropriate for stage 1. **PASS.**

- **Idea 20 (institutional directory / InCommon cross-check).** Concreteness PASS — names InCommon Federation metadata, SCIM, eduPersonAffiliation, Grouper as the underlying mechanisms. Relevance PASS — the dormant-account-takeover mapping file says verbatim that this is "the single defensive enhancement that catches the branch cleanly," so this idea is maximally relevant. The extension to account-hijack and credential-compromise (a hijacked account whose registered PI has since left) is correct. **PASS.**

- **Idea 21 (entity-ownership-change monitoring via OpenCorporates).** Concreteness PASS — names OpenCorporates API, FinCEN BOI registry (with the honest flag that BOI access is restricted post-rulings), and state SoS APIs as fallback. Relevance PASS — directly addresses the going-concern-acquisition sub-variant of shell-company that v1 missed entirely. The quarterly-refresh cadence is appropriate. **PASS.**

---

## Gaps

No new uncovered attacker classes. All seven mapped branches now have multiple addressing ideas:
- Manufactured-tenure cluster (gradual-legitimacy-accumulation, shell-company, biotech-incubator-tenant): covered by ideas 1, 2, 7, 8, 9, 10, 13, 14, 16, 17, 18, 21.
- Inherited-tenure cluster (bulk-order-noise-cover, account-hijack, credential-compromise, dormant-account-takeover): covered by ideas 6, 7, 11, 12, 17, 19, 20.

The three v1 gaps (breach-data signal, institutional-directory check, ownership-change monitoring) are all closed by ideas 19, 20, 21 respectively.

---

STOP: yes
