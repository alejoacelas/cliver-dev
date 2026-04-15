# Coverage research: Visiting-scholar new-hire corroboration SOP

## Coverage gaps

### Gap 1: Visiting scholars at non-US institutions without a centralized research-visitors office
- **Category:** Visiting scholars, postdocs, and new hires at non-US universities (particularly in Asia, Latin America, Africa) where there is no centralized "research visitors office" or equivalent administrative unit that can confirm appointments on request.
- **Estimated size:** [best guess: The SOP's step 3 (contact research-visitors office) assumes a US-style administrative structure. The v1 document cites examples only from US R1 institutions (Northwestern, Stanford, Syracuse). Among non-US universities, centralized visitors offices are common in the UK, Australia, and parts of Europe, but rare in most of Asia, Africa, and Latin America. Perhaps ~40-60% of non-US institutions lack such an office. Given that non-US academic institutions represent a significant fraction of DNA synthesis customers (market is global, with ~35-40% of revenue from outside North America per market reports), this gap affects a meaningful customer segment.]
- **Behavior of the check on this category:** no-signal (SOP step 3 cannot execute; falls through to "deny or escalate")
- **Reasoning:** The SOP is architecturally dependent on institutional cooperation. If the institution has no visitors office, and the sponsor PI is unresponsive, the SOP has no fallback.

### Gap 2: Institutions that refuse to confirm directory information
- **Category:** Institutions (especially private US universities, EU institutions under GDPR) that categorically refuse to confirm whether a named person holds an appointment, citing privacy regulations.
- **Estimated size:** FERPA permits but does not require US institutions to release directory information; some institutions opt out. Under GDPR, EU institutions may treat appointment confirmation as personal data processing requiring a lawful basis. ([source](https://privacy.ufl.edu/laws-and-regulations/ferpa-/ferpa-frequently-asked-questions/)) [best guess: ~10-20% of US institutions and ~30-50% of EU institutions may decline to confirm appointments to a third-party commercial entity (DNA synthesis provider) without a signed release from the individual. The rate is higher for private institutions than public ones.] Many US universities now route all employment verification through third-party services like "The Work Number" (Equifax), which requires employee consent. ([source](https://hr.ncsu.edu/employee-resources/employment-verification/))
- **Behavior of the check on this category:** no-signal (SOP step 3 returns "we cannot confirm or deny")
- **Reasoning:** This is a structural limitation: the SOP asks institutions for information they may be legally unwilling to provide.

### Gap 3: Sponsor-PI unresponsiveness
- **Category:** Legitimate visiting scholars whose sponsoring PI does not respond to the email confirmation request within the 5-business-day window (PI on sabbatical, traveling, overwhelmed, dead).
- **Estimated size:** [best guess: PI email response rates for unsolicited requests from unknown commercial entities are likely ~30-50%. Academic PIs receive high volumes of email; a request from an unfamiliar DNA synthesis provider's KYC team may be deprioritized or spam-filtered. The SOP allows 5 business days, but many PIs would not respond within that window even for legitimate requests.]
- **Behavior of the check on this category:** escalation to step 3 (research-visitors office), which may also fail (see Gap 1/2)
- **Reasoning:** The SOP's step 2 is the strongest corroboration channel but has a high expected failure rate due to PI behavior, not customer illegitimacy.

### Gap 4: Visiting scholars at corporate research labs
- **Category:** Visiting researchers at corporate R&D labs (Google Research, Microsoft Research, pharma companies, national labs operated by private contractors like Battelle) where there is no "visiting scholar office" equivalent and HR does not confirm appointments to third parties.
- **Estimated size:** [best guess: ~5-10% of visiting-researcher-type synthesis customers may be at corporate labs. Corporate HR departments are typically more restrictive about confirming employee/visitor status than academic institutions.]
- **Behavior of the check on this category:** no-signal
- **Reasoning:** The SOP was designed for the academic context. Corporate labs do not have the same transparency norms.

### Gap 5: New hires with zero web footprint at the new institution
- **Category:** Researchers in their first 1-3 months at a new institution who have not yet appeared in any institutional news, department event, seminar series, or web page — and whose PI may not yet have updated their lab page.
- **Estimated size:** [best guess: ~20-40% of new hires at any given time have zero findable web footprint at their current institution. The web-corroboration step (step 1) relies on institution websites being timely, which they often are not. Department web pages for personnel listings are notoriously stale.]
- **Behavior of the check on this category:** step 1 fails; escalates to step 2 (PI email), which has its own failure rate (Gap 3)
- **Reasoning:** The SOP's step 1 is the cheapest path but has low yield for genuinely new arrivals — exactly the population this SOP is designed for.

### Gap 6: Wall-clock latency causing order abandonment
- **Category:** Legitimate visiting scholars whose orders are delayed 5-10+ business days by the SOP's multi-step corroboration process, leading to order cancellation or customer churn.
- **Estimated size:** [best guess: if the SOP adds a median 3-5 business days of latency (step 2 alone has a 5-day timeout), and DNA synthesis turnaround is typically 5-10 business days, the SOP roughly doubles the total order-to-delivery time. Some fraction of time-sensitive orders (e.g., for grant-deadline experiments) may be abandoned.]
- **Behavior of the check on this category:** not a coverage gap per se, but a cost that reduces the check's practical applicability
- **Reasoning:** The SOP is thorough but slow. Providers may choose not to apply it to all new-hire customers due to churn risk, reducing its effective coverage.

## Refined false-positive qualitative

This SOP's primary failure mode is **false negatives** (legitimate new hires who fail all three corroboration steps):
1. Non-US institutions without visitors offices (Gap 1)
2. Institutions that refuse to confirm (Gap 2)
3. Unresponsive PIs (Gap 3, ~50-70% non-response rate expected)
4. Corporate lab visitors (Gap 4)
5. Zero web footprint in first months (Gap 5)

The SOP has a low **false positive** rate by design (it does not flag anyone as suspicious based on positive evidence — it only fails to corroborate). But the high false-negative rate means many legitimate new hires will reach the "FAIL = deny order" terminal state, which is effectively a false denial.

## Notes for stage 7 synthesis

- The SOP's core weakness is its dependence on **institutional cooperation** (PI response + visitors-office confirmation), which is unreliable at scale.
- The ~$10-30/customer analyst cost (from stage 4) is high relative to automated alternatives, limiting the SOP to a small subset of flagged customers.
- The SOP is most effective at **US R1 universities** with well-staffed visitors offices and responsive PIs. Coverage degrades sharply outside this population.
- Consider framing this SOP as a **last-resort escalation path** rather than a routine check — used only when automated M07 checks (federation, site-search, LinkedIn) all return no-signal and the customer is ordering SOC-relevant sequences.
