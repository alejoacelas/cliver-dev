# Per-idea synthesis: m07-visiting-scholar-sop

## Section 1: Filled-in schema

**name**

Visiting-scholar new-hire corroboration SOP

**measure**

M07 — institution-affiliation-low-scrutiny

**attacker_stories_addressed**

visiting-researcher, it-persona-manufacturing (sub-paths A solo and C), inbox-compromise (adjunct, alumni, self-issued variants), dormant-account-takeover (fabricated persona), dormant-domain, shell-company/shell-nonprofit/cro-framing/cro-identity-rotation/gradual-legitimacy-accumulation/community-bio-lab-network (via escalation to M19/M20). Note: the SOP provides zero resistance against genuine visiting-scholar appointments and genuine insiders.

**summary**

Pure-SOP check: when a customer claims a non-tenured affiliation (visiting scholar, postdoc, new-hire researcher, lab tech) with a sparse web footprint, require at least one positive corroborator from: (a) institution news or department events search hit, (b) sponsoring-PI email confirmation from a verified institutional address, or (c) confirmation from the institution's research-visitors office. The SOP is the deliverable; external dependencies are human-process artifacts at the host institution.

**external_dependencies**

Web search (for institution news / department events); email contact with sponsoring PI at an M02-verified institutional domain; research-visitors / academic-affairs office at the host institution; internal CRM for audit trail; human KYC analyst to execute the SOP.

**endpoint_details**

This is a human process, not an API.

**Sponsor-PI email:** standard mail server, no API.

**Research-visitors office:** publicly listed email/phone on university research office pages (e.g., Northwestern `researchvisitors@northwestern.edu`, Syracuse `facultyaffairs@syr.edu`).

**Auth model:** standard email-thread continuity.

**Pricing:** $0 marginal API cost; cost is analyst time.

**ToS/privacy:** FERPA constrains student-record disclosure but generally permits confirmation of directory information (name, department, appointment status). Some institutions decline even directory information without a written release. GDPR at EU institutions may further restrict.

**Rate limits:** human — ~10-30 minutes per case; ~5-20 cases/analyst-day.

**fields_returned**

Structured SOP outcome record: `corroborator_type` (news_hit, department_events_hit, sponsor_pi_email, research_office_confirmation, none); `corroborator_url_or_message_id`; `sponsor_pi_name`, `sponsor_pi_email`, `sponsor_pi_email_domain_passed_m02`; `research_office_contact_used`; `appointment_start_date_claimed`; `confirmation_response_text` (verbatim); `analyst_id`, `timestamp`, `decision`.

**marginal_cost_per_check**

Web search component: ~$0.005-$0.045/customer. Analyst time: **$10-$30 per customer flagged** (10-30 min at ~$60/hr loaded cost), plus 1-10 days wall-clock latency. **Setup cost:** ~$10-25k initial compilation of research-visitors-office contacts at top ~500 R&E institutions + ~$5k/yr maintenance.

**manual_review_handoff**

The SOP itself IS the manual review. 5-step process: (1) Trigger when automated M07 checks pass but web footprint is sparse and order is SOC-eligible or first-ever. (2) Web corroboration: `site:<institution.edu> "<name>"` + institutional news search. Any substantive hit on the institution's own domain closes as PASS. (3) If step 2 fails: sponsor-PI confirmation via templated email from PI's institutional address, confirming affiliation, start date, and research scope. Require reply from `@institution.edu`. (4) If step 3 yields no response within 5 business days: contact research-visitors office for directory-information confirmation only. (5) PASS = at least one corroborator; FAIL = none → deny order or escalate to compliance lead.

**flags_thrown**


- `new_hire_zero_corroborators` — primary flag; triggers SOP execution.

- `sponsor_pi_unreachable` — PI does not respond within 5 business days; escalate to step 3.

- `sponsor_pi_denies_affiliation` — PI says they do not know the customer; deny order.

- `research_office_unable_to_confirm` — no appointment on record; deny.

- `institution_refuses_under_ferpa` — institution declines; soft fallback to additional KYC (M19, M20).

**failure_modes_requiring_review**

Institutions vary widely in willingness/speed of response; sponsor-PI on sabbatical / unreachable / dead; institution lacks centralized research-visitors office (smaller colleges, foreign institutions); email-thread phishing risk (attacker controlling customer mailbox could control a fake PI address — SOP requires independent faculty-directory verification); GDPR at non-US institutions; wall-clock latency (1-10+ days) causing order delays.

**false_positive_qualitative**

The SOP has a low false-positive rate (does not wrongly accuse) but a high **false-negative/false-denial** rate: legitimate new hires who fail all corroboration steps. Categories: (1) non-US institutions without visitors offices (~40-60% of non-US institutions); (2) institutions that refuse to confirm (~10-20% US, ~30-50% EU); (3) unresponsive PIs (~50-70% non-response rate expected for unsolicited requests from unfamiliar commercial entities); (4) corporate lab visitors (~5-10% of visiting-type customers); (5) zero web footprint in first 1-3 months (~20-40% of new hires).

**coverage_gaps**


- **Gap 1 — Non-US institutions without visitors offices:** ~40-60% of non-US institutions lack centralized office; SOP step 3 cannot execute.

- **Gap 2 — Institutions refusing to confirm:** ~10-20% US, ~30-50% EU under FERPA/GDPR; some route through Equifax "The Work Number" requiring employee consent.

- **Gap 3 — Sponsor-PI unresponsiveness:** ~50-70% expected non-response rate for unsolicited requests; 5-day timeout.

- **Gap 4 — Corporate lab visitors:** ~5-10% of visiting-type customers; corporate HR is more restrictive.

- **Gap 5 — New hires with zero web footprint:** ~20-40% in first 1-3 months; step 1 fails, escalates to step 2/3 which also have high failure rates.

- **Gap 6 — Wall-clock latency:** SOP adds 3-5+ business days median; roughly doubles order-to-delivery time; risk of order abandonment.

**record_left**

Full SOP outcome record (fields above); all emails archived; analyst's signed-off decision; web corroborator URLs. Strong audit artifact showing documented human verification trail; evidentiary weight depends on quality of responses.

**bypass_methods_known**

**CAUGHT:** it-persona-manufacturing sub-path A (IT admin alone, no PI complicity); it-persona-manufacturing sub-path C (departed member); inbox-compromise adjunct/alumni/self-issued variants (when visitors-office records are clean); dormant-account-takeover bypass C (fabricated persona); dormant-domain (no live contacts). **CAUGHT (partial — escalation):** shell-company, shell-nonprofit, cro-framing, cro-identity-rotation, gradual-legitimacy-accumulation, community-bio-lab-network (SOP escalates to M19/M20 when no visitors office exists).

**bypass_methods_uncovered**

**Structural — genuine visiting appointments:** visiting-researcher, it-persona-manufacturing sub-path B (real appointment, PI confirms, visitors office confirms — all corroborators return positive). **Structural — genuine insiders:** lab-manager-voucher, bulk-order-noise-cover, insider-recruitment, account-hijack, credential-compromise. **Implementation-specific:** non-Anglophone institution cooperation gap (foreign-institution); account-hijack self-confirmation loophole (attacker responds from hijacked PI mailbox).


## Section 2: Narrative


### What this check is and how it works

This is a human-executed Standard Operating Procedure, not an automated API check. When a customer claims a visiting-scholar, postdoc, or new-hire role at an institution and their web footprint is too sparse for automated checks to confirm, the SOP triggers a three-step corroboration process. First, the analyst searches the institution's own website and news feeds for mentions of the customer. If that fails, the analyst sends a templated email to the customer's named sponsoring PI at their verified institutional address, asking the PI to confirm the appointment, start date, and research scope. If the PI is unresponsive after 5 business days, the analyst contacts the institution's research-visitors or academic-affairs office to confirm directory information. At least one positive corroborator is required to pass; zero corroborators results in order denial or compliance escalation.


### What it catches

The SOP catches manufactured personas created by IT admins acting alone (sub-path A) because the named PI will deny knowledge of the fake person. It catches departed-member impersonation (sub-path C) because the visitors office confirms no current appointment. It catches inbox-compromise variants (adjunct recovery, alumni forwarders, self-issued accounts) because these individuals lack current appointment records. It catches dormant-domain attacks because a defunct entity has no live contacts to confirm. For purpose-built organizations (shell companies, CROs, community labs), the SOP correctly identifies the absence of institutional infrastructure and escalates to M19/M20 — the real barrier is the escalation target, not this SOP itself.


### What it misses

The SOP's central weakness is that genuine visiting-scholar appointments defeat it completely. The visiting-researcher attacker story is specifically designed to exploit this: once the attacker obtains a real appointment from a real PI, every corroboration step returns positive. The SOP verifies that an appointment exists but cannot assess the appointee's intent. Similarly, all genuine-insider stories (lab-manager-voucher, insider-recruitment, account-hijack, credential-compromise) pass because these attackers have real institutional affiliation. The account-hijack case has an additional loophole: the attacker controlling the PI's mailbox can self-confirm by responding to the step-2 email. Coverage gaps further limit effectiveness: ~50-70% expected PI non-response rate for unsolicited requests, ~40-60% of non-US institutions lack a visitors office, and ~10-20% of US institutions refuse to confirm even directory information.


### What it costs

This is the most expensive M07 check by far. Analyst time runs $10-$30 per flagged customer (10-30 minutes at ~$60/hr loaded cost), plus 1-10 days of wall-clock latency that roughly doubles the order-to-delivery time. Setup requires ~$10-25k to compile a directory of research-visitors-office contacts at the top ~500 institutions, plus ~$5k/yr maintenance. The high cost and latency mean the SOP is viable only as a last-resort escalation for high-risk orders, not as a routine check.


### Operational realism

The SOP's dependence on institutional cooperation is its operational bottleneck. PI response rates for unsolicited emails from unknown commercial entities are likely ~30-50%, and research-visitors offices may take days to respond or may decline entirely. The 5-business-day timeout for each step means the full SOP can take 2-3 weeks wall-clock for a case that escalates through all three steps. For time-sensitive orders, this delay may cause customer churn. The SOP works best at US R1 universities with well-staffed visitors offices and responsive PIs; coverage degrades sharply outside this population. Stage 6 recommends framing this as a last-resort escalation path used only when automated M07 checks (federation, site-search) all return no-signal and the customer is ordering sequences of concern.


### Open questions

No full census exists of how many R1 institutions publish a research-visitors-office email contact; the v1 document cites only three examples (Northwestern, Stanford, Syracuse). The expected PI response rate (~30-50%) is a best guess with no direct empirical source. FERPA-equivalent regimes outside the US (GDPR, UK DPA) are not enumerated, and it is unclear what fraction of EU institutions would cooperate. The SOP does not address the account-hijack self-confirmation loophole beyond noting that the PI's address should be independently verified against the faculty directory — verification confirms the PI is real but not that the person controlling the mailbox is the PI.

## Section 3: Open issues for human review


- **Surviving Critical finding (Finding 1 from Stage 5):** Genuine visiting-scholar appointments defeat the SOP completely. The sponsoring PI confirms, the visitors office confirms, and all corroborators return positive. The SOP verifies that an appointment exists but cannot assess the appointee's intent. This is structural and not addressable within M07 — would require purpose-verification (M15/M19 territory).


- **Surviving Critical finding (Finding 2 from Stage 5):** Genuine insiders (lab-manager-voucher, bulk-order-noise-cover, insider-recruitment, account-hijack, credential-compromise) pass with zero resistance. Structural to M07.


- **High false-denial rate for legitimate customers:** The SOP's dependence on institutional cooperation (~50-70% PI non-response, ~40-60% of non-US institutions lacking visitors offices, ~10-20% US institutions refusing to confirm) means many legitimate new hires will reach the "FAIL = deny" terminal state. This is a significant operational cost that limits the SOP to a small subset of flagged customers.


- **Account-hijack self-confirmation loophole:** Attacker controlling a PI's mailbox can respond to step-2 confirmation email. Faculty-directory verification confirms the PI is real but not that the respondent is the PI. Not resolvable within M07 alone; requires M16 (MFA step-up).


- **Non-Anglophone institution cooperation gap:** No fallback defined for institutions that do not respond within 10+ business days. Stage 5 suggests allowing a signed letter on institutional letterhead or accepting a confirmation from a known federation-verified email as alternatives.


- **SOP assumes university-like institutional structure:** No pre-check to classify institutions as university vs. company/nonprofit/incubator before running the 3-step process. Stage 5 suggests adding an institution-type classifier to skip steps 2-3 for non-university entities and route directly to M19/M20 escalation.


- **Wall-clock latency:** SOP adds 3-5+ business days median. For time-sensitive orders, the delay may cause customer churn. Providers may choose not to apply the SOP broadly, reducing effective coverage.
