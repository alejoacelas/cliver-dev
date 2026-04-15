# m19-role-vs-scope — Implementation v1

- **measure:** M19
- **name:** Role-vs-scope / seniority alignment SOP
- **modes:** A
- **summary:** Reviewer SOP. When a customer's stated role and seniority are implausible for the order's scope (e.g., a first-year grad student ordering BSL-3 select-agent reagents under no listed PI; an undergraduate intern ordering Tier-1 select-agent fragments; a "research associate" with no PI on file ordering a known toxin coding sequence), the order is escalated for senior reviewer adjudication. This is not an automated check — it is a human-judgment SOP layered on top of the data signals from the OpenAlex / ORCID / PubMed checks and the order's sequence-screening flag.

## external_dependencies

- **Internal:** the customer record (claimed role, seniority, institution, PI/supervisor name).
- **Internal:** the sequence screening output (the SOC categorization of the order — e.g., toxin, select agent, dual-use enhancement).
- **Reference data, used at reviewer discretion:**
  - Federal Select Agent Program (FSAP) registered-entity list — to confirm whether the institution has the BSL/registration to legitimately use the requested SOC. [source](https://www.selectagents.gov/)
  - 2024 OSTP Framework for Nucleic Acid Synthesis Screening — defines categories and reviewer expectations. [source](https://aspr.hhs.gov/S3/Documents/OSTP-Nucleic-Acid-Synthesis-Screening-Framework-Sep2024.pdf)
  - IGSC Harmonized Screening Protocol v3.0 — sets the consortium baseline for reviewer escalation. [source](https://genesynthesisconsortium.org/wp-content/uploads/IGSC-Harmonized-Screening-Protocol-v3.0-1.pdf)

## endpoint_details

- **No external API.** This is a manual SOP. The "endpoint" is the reviewer's case-management queue.
- **Reviewer credentials:** the IGSC v3.0 protocol and 2024 OSTP framework call for follow-up review by qualified personnel; in practice "a staff member with a PhD in bioinformatics or similar training" handles flagged orders. [source](https://councilonstrategicrisks.org/2024/05/07/supporting-follow-up-screening-for-flagged-nucleic-acid-synthesis-orders/)
- **Cost of review time:** "yellow" flag hits 1–2 hours; "red" flags can run several hours. [source](https://councilonstrategicrisks.org/2024/05/07/supporting-follow-up-screening-for-flagged-nucleic-acid-synthesis-orders/)
- **No ToS / no auth model.** Internal-only.

## fields_returned

The SOP produces a structured reviewer assessment, written into the customer record:
- `role_claim`: customer's stated role (PhD student / postdoc / staff scientist / PI / lab manager / undergraduate / industry R&D / clinician / other).
- `seniority_band`: junior / mid / senior, derived from claim + footprint (years of publication / appointment).
- `pi_supervisor_name` and whether the PI is independently verifiable (e.g., on the institution faculty page; has NIH/NSF grants).
- `order_soc_category`: the SOC class flagged by sequence screening (toxin / select agent / dual-use of concern / etc.).
- `role_scope_assessment`: reviewer's plain-language judgment.
- `decision`: PROCEED / FOLLOWUP / DENY.

## marginal_cost_per_check

- **Reviewer time:** [best guess: 30 minutes for a clear-cut case (the role is plainly aligned or plainly misaligned), up to 2–3 hours for an ambiguous case requiring outreach to the customer's PI or institution. At a fully-loaded reviewer cost of ~$100/hr (PhD-trained staff), that's $50–$300 per flagged order]
- **Only triggered when sequence-screening already flagged an order**, so the per-customer marginal cost is much lower than $50: only the small fraction of orders with SOC content incur it. [best guess: ~1–5% of orders are flagged by sequence screening; the SOP applies only to those, so amortized per-customer cost is ~$0.50–$15]
- **setup_cost:** ~1–2 weeks of senior biosecurity / compliance staff time to write the actual playbook with worked examples, and to train reviewers. [best guess: $5k–$15k]

## manual_review_handoff

The SOP itself *is* the manual review. The escalation pathway:

1. **Triage (junior reviewer / automated):** when sequence screening flags an order, pull the customer record and the OpenAlex / ORCID / PubMed signals.
2. **Role-vs-scope check (senior reviewer):**
   - Is the stated role one that *can* legitimately use this SOC? (e.g., a clinical lab can order BSL-2 toxin standards; a high-school intern cannot order Tier-1 select-agent fragments.)
   - Is the customer's seniority consistent with independent ordering authority? Junior staff ordering high-risk material should be ordering *under* a named PI whose record bears the responsibility.
   - Is the stated PI independently confirmable, with a research program plausibly using the requested SOC?
3. **Triggers for escalate-to-deny:**
   - Junior role + Tier-1 SOC + no PI listed.
   - Role/department incongruent with order (e.g., social-sciences department ordering virulence factor sequences).
   - Customer footprint shows no work in the order's domain.
4. **Triggers for direct-customer-followup:**
   - Junior role + SOC + named PI → contact the PI directly (independently verified contact, not the customer's claimed contact info).
   - Role plausible but footprint thin → ask for institutional letter or BSO sign-off.
5. **Document reasoning** in the customer record. The reasoning must be specific enough that a re-reviewer in 12 months can understand the decision.

## flags_thrown

- `role_scope_implausible_high` — junior role + Tier-1/select-agent SOC, no verified PI.
- `role_scope_implausible_medium` — role plausible but department/footprint mismatch with order.
- `role_scope_pi_unverifiable` — claimed supervising PI cannot be independently confirmed.
- `role_scope_borderline` — reviewer uncertain; flagged for second opinion.

## failure_modes_requiring_review

- **Subjective judgment.** Two reviewers can disagree on "plausible." The SOP must include calibration rounds and worked examples to converge reviewers.
- **Insider attackers** (`lab-manager-voucher`, `insider-recruitment`): the role *is* legitimately what they claim, and the role legitimately includes oligo ordering. SOP cannot bind.
- **Visiting researcher** with a real but lightweight appointment: role and seniority claims are technically true.
- **Cross-cultural / cross-institutional norms:** seniority titles and ordering authority vary by country and lab structure.
- **Reviewer fatigue / volume:** during high-volume periods, reviewers default to PROCEED.
- **Adversarial customers learn the SOP** and adjust their stated role.

## false_positive_qualitative

- **Legitimately precocious junior researchers** (early-PhD students in well-funded labs ordering for their advisor) — the SOP would catch them; the cure is the "verified PI on file" carve-out.
- **Cross-departmental collaborations** where the ordering scientist is in a different department than the work's focus.
- **Industry researchers** whose roles (e.g., "scientist II") don't map cleanly onto academic seniority bands.
- **Small biotech founders** who legitimately wear many hats and order for their own work.
- **Core-facility / shared-instrument staff** who place orders on behalf of many labs.

## record_left

- The structured `role_scope_assessment` written to the customer record.
- The reviewer's free-text reasoning.
- All independently-verified items (PI confirmation, institutional letter, BSO sign-off).
- The SOC categorization that triggered the review.
- The decision and the reviewer's signature/timestamp.

This is an internal artifact, not externally citable, but it is auditable: the structured fields + free-text reasoning support an external biosecurity audit or law-enforcement subpoena.

## attacker_stories_addressed (refined)

- `role-scope-mismatch` — directly targeted: this is the SOP designed to catch exactly this attacker pattern.
- `junior-as-front` — directly targeted: the "junior + no verified PI" trigger is the load-bearing rule.
- `unrelated-dept-student` — partial: catches the student only if the *department* mismatch is visible to the reviewer; an "unrelated dept" student in biology rather than chemistry may pass since both are nominally life-sciences.
- `lab-manager-voucher`, `insider-recruitment` — does not catch: the role is legitimately what they claim.
- `visiting-researcher` — does not catch: the visiting role and host PI are real.

[best guess: this SOP is most valuable as a *backstop* for the cases the data-source checks (OpenAlex / ORCID / PubMed) flag but cannot adjudicate; its independent value beyond those is moderate, and it is structurally unable to catch the insider/visiting-researcher pattern that the attacker mapping highlights as the dominant unaddressed bypass]
