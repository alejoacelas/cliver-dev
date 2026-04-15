# m07-visiting-scholar-sop — Implementation v1

- **measure:** M07 — institution-affiliation-low-scrutiny
- **name:** Visiting-scholar new-hire corroboration SOP
- **modes:** A
- **summary:** Pure-SOP check (no live API): when a customer claims a non-tenured affiliation (visiting scholar, postdoc, new-hire researcher, lab tech) that is plausibly too new or too lightweight to leave a strong web footprint, require at least one positive corroborator from one of: (a) institution news / department events search hit, (b) sponsoring-PI email confirmation from a verified institutional address, or (c) confirmation from the institution's research-visitors office. The SOP is the deliverable; "external dependencies" are mostly human-process artifacts at the host institution.

## external_dependencies

- **Web search** (any of the engines from `m07-google-site-search`) for institution news / department events.
- **Email contact with sponsoring PI** at a domain that passes M02 (institutional email check).
- **Research-visitors / academic-affairs office** at the host institution. Almost every R1 university operates a centralized "Research Visitors" or "Visiting Scholars" office that issues appointments. ([Northwestern Research HR Administration](https://researchhradmin.northwestern.edu/research-visitors/), [Stanford Visiting Scholars policy](https://doresearch.stanford.edu/policies/research-policy-handbook/non-faculty-research-appointments/visiting-scholars), [Syracuse Visiting Scholars FAQ](https://academicaffairs.syracuse.edu/faculty-affairs/information-for/visiting-scholars-faq/))
- **Internal CRM** to log SOP outcomes for the audit trail.
- Human KYC analyst to execute the SOP.

## endpoint_details

This is a process; "endpoints" are institutional email contacts and human workflows.

- **Sponsor-PI email exchange:** standard inbound/outbound mail server, no API.
- **Research-visitors office contact:** publicly listed email/phone on each university's research office page. Examples: Northwestern's `researchvisitors@northwestern.edu` ([source](https://researchhradmin.northwestern.edu/research-visitors/)), Syracuse's `facultyaffairs@syr.edu` ([source](https://academicaffairs.syracuse.edu/faculty-affairs/information-for/visiting-scholars-faq/)). 
- **Auth model:** none beyond standard email-thread continuity.
- **Pricing:** $0 marginal API cost. Cost is analyst time.
- **ToS / privacy:** institutions are constrained by **FERPA** (for student records — visiting students at universities are FERPA-covered) and by HR privacy practices (for employees). Institutions will typically confirm directory-information facts ("yes, person X is a current visiting scholar in dept Y") without a release, but will not disclose grades, dates of birth, or non-directory data. ([source for FERPA directory-information rules](https://registrar.illinois.edu/faculty-staff/ferpa-fs/phone-verification-process/), [source](https://www.albany.edu/registrar/faculty-staff/ferpa)) Some institutions decline to confirm even directory information without a written release.
- **Rate limits:** human; ~10–30 minutes per case; ~5–20 cases/analyst-day.

## fields_returned

The SOP yields a structured outcome record per customer:

- `corroborator_type` — one of `news_hit`, `department_events_hit`, `sponsor_pi_email`, `research_office_confirmation`, `none`
- `corroborator_url_or_message_id`
- `sponsor_pi_name`, `sponsor_pi_email`, `sponsor_pi_email_domain_passed_m02`
- `research_office_contact_used`
- `appointment_start_date_claimed`
- `confirmation_response_text` (verbatim)
- `analyst_id`, `timestamp`, `decision`

## marginal_cost_per_check

- Web search component: as in `m07-google-site-search`, ~$0.005–$0.045 / customer.
- Analyst time: typical institutional-callback workflows take 10–30 minutes when the institution responds promptly, and up to several days of wall-clock when the response is slow. At a loaded analyst cost of ~$60/hour, that's **$10–$30 per customer flagged**, plus opportunity cost from order delay. [best guess: rates from typical KYC-analyst loaded cost benchmarks; not a vendor figure.]
- **setup_cost:** Building and maintaining a directory of research-visitors-office contacts at the top ~500 R&E institutions: ~$10–25k initial scrape + ~$5k/yr maintenance. [best guess: 1–2 weeks of analyst time to compile.]

## manual_review_handoff

The SOP itself **is** the manual review. Step-by-step:

1. **Trigger:** customer's M02/M07 automated checks pass (real institutional email) but the customer's web footprint at the institution is sparse, *and* the order is SOC-eligible OR is the customer's first-ever order.
2. **Step 1 — Web corroboration.** Analyst runs site:`<institution.edu>` "<name>" plus searches for `"<name>" "<institution>" news`, `"<name>" department seminar`, `"<name>" arrived joined hired`. Any one substantive hit on the institution's own domain or in institutional news closes the case as PASS.
3. **Step 2 — Sponsor-PI confirmation.** If step 1 fails, send a templated email to the sponsoring PI at the PI's institutional address (PI is named by the customer). Email asks the PI to confirm: (a) the customer is currently affiliated with their lab as a visiting scholar / postdoc / staff, (b) the appointment start date, (c) the rough scope of the customer's research. Require reply *from* the PI's `@institution.edu` address (no forwarding from a personal domain).
4. **Step 3 — Research-visitors office.** If step 2 yields no response within 5 business days, OR the PI's identity itself cannot be confirmed via the institution's faculty page, contact the institution's research-visitors / academic-affairs office (per the directory built above). Ask only for *directory information*: "Can you confirm that <name> is currently appointed as a visiting researcher/scholar/postdoc in <department>?" Do not request non-directory data. Document the response.
5. **Decision:** PASS = at least one corroborator from steps 1–3. FAIL = none. FAIL routes to "fake-affiliation candidate; deny order or escalate to compliance lead."

## flags_thrown

- `new_hire_zero_corroborators` — primary flag; raised at the start of the SOP. **Action:** execute SOP above.
- `sponsor_pi_unreachable` — PI does not respond to the templated email within 5 business days. **Action:** escalate to step 3.
- `sponsor_pi_denies_affiliation` — PI replies that they do not know the customer. **Action:** deny order; flag for fraud review.
- `research_office_unable_to_confirm` — research office responds that no such visiting appointment exists. **Action:** deny.
- `institution_refuses_under_ferpa` — institution declines to release any information. **Action:** soft fallback — require additional KYC (M19, M20).

## failure_modes_requiring_review

- Institutions vary widely in willingness and speed of response. Some R1s respond within hours; some never respond.
- Sponsor-PI is on sabbatical / out of country / dead.
- Customer claims an institution that has no centralized research-visitors office (smaller colleges, foreign institutions).
- Email-thread phishing risk: an attacker who controls the customer's mailbox could also control a fake "PI" address on the same compromised domain. SOP should require the PI's address to be independently verified against the institution's faculty directory before trusting the reply.
- FERPA / GDPR: at non-US institutions, GDPR is the binding constraint and institutions may be even less willing to confirm.
- Time-pressure orders: the SOP adds 1–10 days of wall-clock latency to the customer's order.

## false_positive_qualitative

- New hires at small or foreign institutions where neither the news search nor the research-visitors office channel works.
- Researchers at institutions whose research-visitors office is genuinely uncooperative (some private institutions categorically refuse).
- Sponsor-PIs who are slow / unresponsive email correspondents.
- Visiting scholars at corporate research labs (Google Research, Microsoft Research, pharma) where there is no "visiting scholar office" analog.

## record_left

- The full SOP outcome record (fields above).
- All emails archived.
- The analyst's signed-off decision.
- Any web corroborator URLs.

This artifact is strong for an audit (it shows a documented attempted human verification trail) but its evidentiary weight depends on the quality of the responses, which the SOP cannot itself enforce.

## Open issues for v2

- Concrete baseline of how many R1 institutions actually publish a research-visitors-office email contact (used the Northwestern + Stanford + Syracuse examples; full census deferred).
- Fraction of cases where the institution responds at all (deferred to stage 6 BOTEC).
- FERPA-equivalent regimes outside the US (GDPR, UK DPA): not enumerated in v1.
