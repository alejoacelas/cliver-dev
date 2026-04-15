# m19-role-vs-scope — Per-idea synthesis

## Section 1: Filled-in schema

| Field | Value |
|---|---|
| **name** | Role-vs-scope / seniority alignment SOP |
| **measure** | M19 — Individual-legitimacy (SOC) |
| **attacker_stories_addressed** | `role-scope-mismatch` (directly targeted), `junior-as-front` (directly targeted), `unrelated-dept-student` (partially — catches visible department mismatch but not plausible rotations). Does **not** catch: `lab-manager-voucher`, `insider-recruitment`, `visiting-researcher`, `bulk-order-noise-cover`, `account-hijack`, `dormant-account-takeover`. |
| **summary** | Reviewer SOP triggered when sequence screening flags an order containing sequences of concern (SOC). A senior reviewer evaluates whether the customer's stated role and seniority are plausible for the order's scope — e.g., a first-year grad student ordering BSL-3 select-agent reagents with no verified PI on file is escalated. The SOP layers human judgment on top of upstream data signals (OpenAlex, ORCID, PubMed) and the sequence-screening flag. |
| **external_dependencies** | Internal: customer record (claimed role, seniority, institution, PI/supervisor), sequence screening output (SOC categorization). Reference data at reviewer discretion: Federal Select Agent Program registered-entity list, 2024 OSTP Framework for Nucleic Acid Synthesis Screening, IGSC Harmonized Screening Protocol v3.0. |
| **endpoint_details** | No external API. This is a manual SOP; the "endpoint" is the reviewer's case-management queue. Reviewer credentials: PhD-trained staff per IGSC v3.0 and OSTP framework expectations. Review time: 1–2 hours for yellow flags, several hours for red flags (CSR 2024). No ToS, no auth model — internal only. |
| **fields_returned** | `role_claim` (customer's stated role), `seniority_band` (junior/mid/senior), `pi_supervisor_name` (with independent-verification status), `order_soc_category` (from sequence screening), `role_scope_assessment` (reviewer's plain-language judgment), `decision` (PROCEED / FOLLOWUP / DENY). |
| **marginal_cost_per_check** | [best guess: $50–$300 per flagged order (30 min to 3 hr at ~$100/hr fully loaded PhD reviewer). Only ~5% of orders trigger sequence screening, so amortized per-customer cost is ~$0.50–$15.] **Setup cost:** ~$5k–$15k (1–2 weeks senior staff time for playbook authoring + reviewer training). |
| **manual_review_handoff** | The SOP *is* the manual review. Five-step escalation: (1) triage pulls customer record + upstream signals; (2) senior reviewer evaluates role-vs-scope plausibility; (3) escalate-to-deny triggers: junior + Tier-1 SOC + no PI, department incongruent with order, no domain footprint; (4) followup triggers: junior + SOC + named PI → contact PI directly via independently verified contact; thin footprint → request institutional letter or BSO sign-off; (5) document reasoning in customer record. |
| **flags_thrown** | `role_scope_implausible_high` (junior + Tier-1/select-agent + no verified PI), `role_scope_implausible_medium` (role plausible but department/footprint mismatch), `role_scope_pi_unverifiable` (claimed PI cannot be independently confirmed), `role_scope_borderline` (reviewer uncertain, flagged for second opinion). |
| **failure_modes_requiring_review** | Subjective judgment (two reviewers can disagree on "plausible"); insider attackers invisible (role is legitimate); visiting researchers with genuine appointments pass; cross-cultural role-title ambiguity; reviewer fatigue during high-volume periods; adversarial customers learn to adjust stated role. |
| **false_positive_qualitative** | (1) Industry researchers (~40–55% of customers by revenue proxy) whose titles don't map onto academic seniority bands — largest false-positive category by volume. (2) International customers (~30–40% globally) with role titles that differ from US norms (e.g., UK "Lecturer" = tenured faculty). (3) Core-facility/shared-service staff (~300–500 in US) who order on behalf of many labs — high per-person flag rate. (4) Legitimately precocious junior researchers ordering for their advisor. (5) Cross-departmental collaborators. (6) Small biotech founders who look like "junior + no PI." |
| **coverage_gaps** | **Gap 1 — Industry customers (weak-signal):** ~40–55% of customers; non-academic titles uninterpretable by the SOP. **Gap 2 — International customers (weak-signal / false-positive):** ~30–40% globally; role norms differ from US-academic model. **Gap 3 — Independent/community-bio researchers (no-signal):** <500/year in US; no institutional context for the SOP to evaluate. **Gap 4 — Core-facility staff (false-positive):** ~300–500 US staff; legitimate role looks misaligned to reviewer. **Gap 5 — Non-flagged orders (no-signal):** ~90–95% of orders; SOP only triggers on sequence-screening flags, so fragment-assembly attacks are invisible. |
| **record_left** | Structured `role_scope_assessment` in customer record, reviewer's free-text reasoning, all independently verified items (PI confirmation, institutional letter, BSO sign-off), SOC categorization that triggered review, decision with reviewer signature/timestamp. Internal artifact, auditable for biosecurity audit or law-enforcement subpoena. |
| **bypass_methods_known** | Department mismatch visible (CAUGHT partially — `unrelated-dept-student`); cite rotation host PI where PI denies (CAUGHT partially); vague research self-declaration (CAUGHT partially). |
| **bypass_methods_uncovered** | Role-authentic insiders (lab managers, recruited insiders, established individuals); visiting researchers with verified PIs; manufactured personas where sponsoring PI is complicit; foreign role-title misinterpretation; dormant-account role staleness; account hijack of legitimate PI. |

---

## Section 2: Narrative

### What this check is and how it works

The role-vs-scope SOP is a human-judgment review triggered when automated sequence screening flags an order as containing sequences of concern (SOC) — toxins, select agents, dual-use enhancement sequences. A senior reviewer (PhD-trained biosecurity or bioinformatics staff) pulls the customer's record, examines the customer's stated role and seniority, and evaluates whether the role is plausible for the order's scope. The reviewer draws on upstream data signals from OpenAlex, ORCID, and PubMed checks, plus reference data from the Federal Select Agent Program registered-entity list, the IGSC Harmonized Screening Protocol v3.0, and the 2024 OSTP Framework. The SOP produces a structured assessment — role claim, seniority band, PI verification status, and a plain-language judgment — ending in a PROCEED, FOLLOWUP, or DENY decision documented in the customer record.

### What it catches

The SOP directly targets two attacker patterns: role-scope mismatch (where a customer's claimed role is implausible for the order) and junior-as-front (where a junior researcher without an independently verifiable PI orders high-risk material). It partially catches unrelated-department students when the department mismatch is visible to the reviewer, and when vague self-declarations trigger reviewer skepticism. The load-bearing step — contacting the PI directly via independently verified contact information — provides real friction for fabricated supervisory relationships.

### What it misses

The SOP is structurally unable to catch attackers whose roles genuinely include ordering SOC reagents: lab managers, recruited insiders, and established individuals acting with malicious intent all pass because their role claims are true. Visiting researchers with genuine appointments and verified host PIs pass on every trigger. Manufactured personas pass if the sponsoring PI is complicit. Foreign role titles may be misinterpreted by US-trained reviewers, and dormant-account takeovers exploit the staleness of a once-legitimate role assessment. The single largest coverage gap by customer volume is not any exotic attacker pattern but the everyday reality that ~40–55% of customers are industry researchers whose titles are uninterpretable by an SOP calibrated for US academic norms. Another ~30–40% are international customers where role conventions differ. The SOP also gives no signal on the ~90–95% of orders that sequence screening does not flag.

### What it costs

Marginal cost per flagged order is $50–$300 in reviewer time (30 minutes to 3 hours at ~$100/hour fully loaded). Since only ~5% of orders trigger sequence screening, the amortized per-customer cost is ~$0.50–$15. Setup cost is ~$5k–$15k for playbook authoring with worked examples and reviewer training. The main ongoing cost is reviewer capacity: during high-volume periods, reviewer fatigue risks defaulting to PROCEED.

### Operational realism

Because this SOP *is* the manual review (not a data check that feeds into one), its operational realism depends entirely on reviewer quality and institutional commitment. The escalation pathway is concrete: triage pulls the record, senior reviewer evaluates plausibility, and specific triggers (junior + Tier-1 + no PI; department mismatch; thin footprint) drive the decision tree. The critical implementation detail — flagged as Moderate by the hardening stage — is that the "contact the PI directly" step must use independently sourced contact information (institutional faculty directory, not customer-provided), or the check collapses against fabricated supervisory claims. The record left (structured assessment, free-text reasoning, verification artifacts, decision with timestamp) is sufficient for external audit.

### Open questions

The hardening stage flagged that the PI-verification method is not fully specified: the SOP says "independently verified contact" but does not pin down whether this means faculty directory lookup, institutional directory phone call, or DKIM-verified email. This is the single most consequential implementation gap. Reviewer calibration (how often, with what worked examples) is noted but not specified. The coverage research flagged that Gap 4 (core-facility staff size estimate of ~300–500) lacks a citation — it relies on general knowledge of Carnegie R1 university counts. Gap 2 (international customer share of ~30–40%) is derived from revenue data, not customer counts, and should be marked more clearly as approximate.

---

## Section 3: Open issues for human review

- **Moderate hardening finding M2 (surviving):** The "contact the PI directly" step is the load-bearing mechanism for catching fabricated supervisory claims, but the SOP does not specify how the reviewer independently verifies PI contact information. Recommend specifying: (a) look up PI on institutional faculty directory; (b) use directory-listed email or phone only; (c) consider cross-linking to DKIM-verified institutional email (m20-dkim-institutional-email).
- **Moderate hardening finding M1 (structural):** Role-authentic insiders (lab managers, recruited insiders, visiting researchers with real appointments) are invisible to this SOP. This is a structural boundary of individual-legitimacy checks — they verify that a person *could* order, not that they *should*. No fix within the SOP; complementary checks (behavioral analytics, order-pattern anomaly detection) would be needed.
- **Moderate hardening finding M3:** Reviewer subjectivity and calibration frequency are noted as risks but not specified in the implementation. Recommend specifying calibration cadence and worked-example content as part of setup cost.
- **Coverage Gap 4 size estimate:** ~300–500 core-facility staff figure lacks citation. Needs survey data or Carnegie R1 core-facility prevalence study.
- **Coverage Gap 2 size estimate:** ~30–40% international customer share is derived from revenue, not customer count — a weak proxy. Needs provider-reported international customer share if available.
- **No 06C (claim check on coverage) was run.** Coverage citations (Grand View Research, PLOS ONE, CSR) were not independently verified in a 06C pass.
