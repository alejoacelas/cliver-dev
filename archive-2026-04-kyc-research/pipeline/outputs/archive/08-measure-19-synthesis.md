# Measure 19 — Individual legitimacy (SOC): Per-measure synthesis

## 1. Side-by-side comparison table

| Idea | Data source | Marginal cost | Manual review burden | Attacker stories addressed (of 10) | Headline coverage gap | Headline uncovered bypass |
|---|---|---|---|---|---|---|
| m19-orcid-employments | ORCID Public API v3.0 (free, OAuth) | $0 | Reviewer needed for 98% of cases (self-asserted only); institution-verified signal fires for ~2% | Partial on visiting-researcher, it-persona (orcid_recent); miss on most others | ~98% of records are self-asserted (strong check covers ~2%); 20–40% of order-placers lack ORCID entirely | Self-asserted ORCID + institutional email clears flags for attackers with real access; patient ORCID creation evades orcid_recent |
| m19-openalex-author | OpenAlex API (114M authors, CC0, free key) | ~$0 (free tier) | Reviewer handles disambiguation for common names (~5–15% of lookups); absence is non-denial | Partial on visiting-researcher, unrelated-dept-student, it-persona; miss on most others | Non-publishing staff (~15–25%); industry researchers (~40–60%); early-career (~10–20%); non-OECD under-indexed (~15–30%) | Single seeded preprint ($0–$240) creates valid record; real insiders pass; authentication-layer attacks invisible |
| m19-pubmed-scopus | PubMed (free) + Scopus (vendor-gated, ~$10K–$50K/yr) | $0 (PubMed); Scopus license cost | Near-zero — cross-source corroboration of OpenAlex; PubMed null is non-denial | Weak on it-persona only; miss on all others | Non-biomedical researchers (~10–20%); industry (~40–60%); non-publishing staff (~15–25%); PubMed lacks author IDs | Same as OpenAlex; adds near-zero incremental bypass detection over free sources |
| m19-nih-nsf-pi | NIH RePORTER + NSF + Wellcome + CORDIS + UKRI (all free) | $0 | Reviewer escalates only when customer claims PI status and check is null; otherwise expected negative | Weak on it-persona (if PI claimed); miss on most others | Non-PI researchers (~60–75% of order-placers); industry (>90%); non-US/UK/EU researchers (~40–60%) | Name-collision inheriting former PI's grants; real insiders pass; authentication-layer attacks invisible |
| m19-clinicaltrials-investigator | ClinicalTrials.gov v2 + FDA BMIS (free) | $0 | Near-zero — null result expected for ~70–85% of customers; OAI flag routes to review | Weak on it-persona (if clinical role claimed); miss on all others | Basic-science researchers (~70–85%); non-US researchers (~30–50%); trainees (~30–50%); industry (>90%) | All non-clinical populations structurally invisible; real insiders pass |
| m19-faculty-page | Google PSE ($0.01/check) + Wayback (free) | ~$0.01–0.015 | Reviewer distinguishes "page absent" from "institution doesn't publish pages"; handles PSE limitations | Partial on it-persona (directory vs lab page); partial on dormant-domain (recent-only flag); miss on most | Industry researchers (~30–50%); institutions with weak web presence (~10–20%); non-faculty staff (~15–25%); PSE sunset Jan 2027 | Pre-aged lab page via Wayback "Save Page Now"; real insiders have genuine web presence; foreign institution weak indexing |
| m19-role-vs-scope | Internal SOP (human judgment, no external API) | $50–300/flagged order (~5% trigger rate) | The SOP IS the manual review (30 min–3 hr per flagged order) | Directly targets role-scope mismatch and junior-as-front; partial on unrelated-dept-student | Industry customers (~40–55% — titles uninterpretable); international (~30–40% — role norms differ); ~90–95% of orders not flagged by sequence screening | Role-authentic insiders (lab managers, recruited insiders) pass because their role claims are true |

## 2. Coverage gap cross-cut

### Shared gaps (structural)

- **Non-publishing populations (lab managers, technicians, core-facility staff):** Every bibliometric check (ORCID, OpenAlex, PubMed/Scopus, NIH/NSF PI, ClinicalTrials) is structurally silent on the ~15–25% of academic order-placers who never publish. The faculty-page check partially covers those with web presence, but many non-faculty staff lack profile pages. The role-vs-scope SOP evaluates the claim but cannot independently verify it for non-publishing roles. This population includes the lab-manager-voucher attacker story, which is structurally invisible to every M19 idea.

- **Industry/commercial researchers:** An estimated 40–60% of industry R&D staff are invisible to OpenAlex, PubMed, ORCID, PI lookups, clinical-trial databases, and faculty-page searches. The role-vs-scope SOP cannot interpret non-academic titles. This represents ~40–55% of customers by revenue. No M19 idea provides meaningful signal for this population.

- **Authentication-layer attacks (account-hijack, dormant-account-takeover):** Every M19 idea validates the registered identity, not the current operator. These attacks are structural M14/M16 responsibilities. All seven ideas miss both stories.

- **Real insiders with legitimate roles (insider-recruitment, bulk-order-noise-cover):** Every M19 idea passes the insider because their individual legitimacy is genuine. The check validates that a person could order, not that they should. This is a structural boundary of individual-legitimacy measures.

### Complementary gaps

- **Early-career researchers (thin footprints):** OpenAlex and PubMed show 0–3 publications (population-normal for first 2–3 years). But **faculty-page** can verify institutional presence, and **ORCID** may show institution-verified employment (for the ~2% with that signal). The combination provides weak but non-zero coverage.

- **IT-persona-manufacturing:** ORCID catches the impatient variant (orcid_recent <60 days). OpenAlex catches the no-preprint variant (no author found). **Faculty-page** catches the directory-only variant (lab page absent despite directory entry). The **role-vs-scope SOP** catches fabricated PI claims when the PI cannot be independently verified. Together, multiple independent signals can converge to deny a manufactured persona that lacks depth across all dimensions — though a patient attacker who seeds ORCID, posts a preprint, and gets a lab page built can evade all four.

- **Foreign institutions:** ORCID has low adoption outside OECD. OpenAlex has 55–64% coverage for non-English venues. PI lookups cover only US/UK/EU funders. **Faculty-page** search works for institutions with English-language web presence. The coverage is weakest for non-English, non-OECD institutions — a compounding gap across all ideas.

### Net coverage estimate

If a provider implemented all seven ideas: **many** legitimate customers would still fall in coverage gaps. The combined stack works best for mid-career and senior academic researchers at OECD institutions who publish in English — probably 30–40% of the customer base. For the remaining 60–70% (industry, early-career, non-publishing staff, non-OECD), the stack produces at best weak corroborative signals and at worst complete silence. The structural constraint is that individual-legitimacy verification is fundamentally a positive-evidence exercise: it can confirm legitimacy for those with visible footprints but cannot deny it for those without.

## 3. Bypass cross-cut

### Universally uncovered bypasses

- **Lab-manager-voucher (all variants):** The attacker is a real person with real institutional credentials, a legitimate role that includes ordering, and an expected-thin publication footprint. Every M19 idea either passes them or produces an expected-null result.

- **Account-hijack / dormant-account-takeover:** Every idea validates the registered identity. The hijacker inherits the legitimate individual's full footprint.

- **Insider-recruitment / bulk-order-noise-cover:** The attacker is a genuinely legitimate individual acting with malicious intent. No individual-legitimacy check can detect intent.

### Bypass methods caught by at least one idea

| Bypass | Catching idea(s) |
|---|---|
| IT-persona with no preprint, no ORCID, no faculty page | openalex (no_author), orcid (orcid_recent), faculty-page (no_faculty_page) — converging nulls |
| IT-persona claiming PI status with no grants | nih-nsf-pi (no_pi_record contradicts claimed PI status) |
| Unrelated-dept-student with visible department mismatch | role-vs-scope (department incongruent with order), openalex (topic_mismatch) |
| Visiting-researcher with thin footprint | orcid (orcid_self_asserted_only — flag fires but clears easily), faculty-page (recent-only flag) |
| Dormant-domain with attacker's own name | nih-nsf-pi (no_pi_record fires correctly), openalex (no_author if no publications seeded) |
| Foreign institution fabricated | ror/orcid/openalex convergence of nulls across multiple checks |

### Attacker stories where every idea fails

- **lab-manager-voucher** (real person, real role, expected-thin footprint)
- **account-hijack** (inherited legitimate individual's full record)
- **dormant-account-takeover** (inherited legitimate individual's full record)
- **insider-recruitment** (genuinely legitimate individual)
- **bulk-order-noise-cover** (genuinely legitimate individual)

Five of ten mapped stories are universally uncovered.

## 4. Bundling recommendations

**Core bundle: orcid-employments + openalex-author + faculty-page + role-vs-scope.** These four provide complementary signals across different verification dimensions: ORCID verifies institutional affiliation (strongest for the ~2% with institution-verified records, weak corroboration for the rest), OpenAlex verifies publication footprint (strongest for mid-career academics), faculty-page verifies institutional web presence (catches IT-manufactured personas and provides a non-bibliometric signal), and role-vs-scope applies human judgment to role plausibility on SOC-flagged orders. Per-check cost: ~$0.01. The role-vs-scope SOP is the only check that fires on flagged orders specifically and applies human judgment — include it despite its subjectivity.

**Supplement: nih-nsf-pi.** The PI lookup is free, fast, and provides the strongest individual-level positive signal available (funded PI status is nearly impossible to fabricate). Its value is concentrated in the claim-verification mode: a customer claiming PI status with no funder record across five databases is a substantive negative. Include as part of the multi-check fusion model.

**Conditional additions:** PubMed/Scopus adds near-zero incremental bypass detection over OpenAlex and should be evaluated as a secondary confirmation within the OpenAlex flow, not a separate implementation. Scopus's commercial license (~$10K–$50K/year) is hard to justify given near-zero incremental value. ClinicalTrials/BMIS has extremely narrow coverage (~15–30% of customers with clinical roles) and should exist only within a signal-fusion model for customers claiming clinical/translational research roles.

**Critical design principle: no check should be a standalone denial gate.** Every M19 idea produces expected-null results for large legitimate populations. The bundle must operate as a fusion model where converging nulls across multiple checks escalate to denial, but any single null is informational only. This is the dominant operational constraint.

**Residual uncovered threats:** Five of ten attacker stories (lab-manager, account-hijack, dormant-account, insider-recruitment, bulk-order-noise-cover) are structurally unaddressable by individual-legitimacy checks. The lab-manager and insider stories require M20 (voucher legitimacy) and behavioral analytics. The account-hijack and dormant-account stories require M14 (identity re-binding) and M16 (MFA/step-up). No M19 bundling strategy can close these gaps.
