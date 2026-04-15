# m17-positive-verification-sop — implementation v1

- **measure:** M17 (pre-approval-list)
- **name:** Annual positive-verification SOP
- **modes:** D
- **summary:** A documented standard operating procedure that requires every pre-approved entity in the provider's customer database to be re-verified on an annual cadence (or sooner if event-triggered). Re-verification covers institutional contact aliveness, IBC status (NIH IBC-RMS roster check for US institutions), sanctions delta against the provider's last screening date, and an active confirmation that the customer's stated PI / authorized signer is still affiliated with the institution. Pre-approval status that has not been refreshed within 12 months is auto-suspended pending re-verification.

## external_dependencies

- Internal SOP, owned by the biosecurity / compliance function.
- **NIH IBC Registration Management System (IBC-RMS)** for US-institution IBC roster checks. Effective June 1, 2025, NIH OSP publicly posts active IBC rosters via IBC-RMS ([NIH OSP IBC FAQs](https://osp.od.nih.gov/policies/biosafety-and-biosecurity-policy/faqs-on-institutional-biosafety-committee-ibc-administration-april-2024/); [CITI Program 2024 summary of new transparency requirements](https://about.citiprogram.org/blog/nih-reinforces-transparency-in-biosafety-oversight-with-new-ibc-requirements/)).
- Sanctions/denied-parties screening service (delta-rescreen against the existing m01 / m08 stack).
- Email-based positive-confirmation outreach to institutional contact.
- Ticketing / workflow system to track due dates and overdue suspensions.

## endpoint_details

- **NIH IBC-RMS roster check.** Public roster posting of active IBCs began June 1, 2025; NIH OSP publishes the roster but does not currently expose a documented public API. `[unknown — searched for: "NIH IBC-RMS API", "IBC Registration Management System public data download", "NIH OSP IBC roster JSON"]`. `[best guess: in v1, integration is a manual web lookup via IBC-RMS or a scrape; the dataset is small enough (a few thousand institutions) that periodic bulk download is feasible.]`
- **Sanctions delta:** uses whatever vendor stack the m01-* ideas already use (e.g., OFAC SDN consolidated list, BIS Entity List, EU consolidated list); no new endpoint.
- **Auth model for IBC-RMS:** anonymous public access for the roster portion as of June 2025 ([CITI Program 2024](https://about.citiprogram.org/blog/nih-reinforces-transparency-in-biosafety-oversight-with-new-ibc-requirements/)). Submission still requires institutional credentials, but the consuming side does not.
- **Pricing:** No vendor cost for the IBC-RMS roster lookup itself.
- **Outreach mechanism:** SMTP from a controlled biosecurity domain to the institutional contact on file with read-receipt or DMARC-aligned reply tracking; positive (i.e., explicit affirmative reply) confirmation required, not silent timeout.
- **Cadence:** annual is industry-standard for high-risk customers in financial KYC ([EY KYC refresh guide](https://www.ey.com/en_us/insights/financial-services/kyc-refresh-effective-risk-based-program); [NorthRow KYC review frequency](https://www.northrow.com/blog/how-often-should-you-conduct-a-kyc-data-review)). Pre-approved SOC customers are functionally high-risk under that framing.

## fields_returned

This is an internal SOP, not an endpoint, but the artifact set produced per re-verification cycle includes:

- **From IBC-RMS lookup:** institution name, IBC chair, BSO contact, IBC contact email, registration date, last update date, member roster (post-June-2025 transparency rule). Fields per [NIH OSP IBC FAQs April 2024](https://osp.od.nih.gov/policies/biosafety-and-biosecurity-policy/faqs-on-institutional-biosafety-committee-ibc-administration-april-2024/).
- **From positive-confirmation reply:** signed/dated attestation from the institutional contact that (i) the named PI / authorized signer is still affiliated, (ii) the institution still endorses the account for SOC ordering, (iii) shipping address(es) on file remain accurate, (iv) no material change in the IBC scope.
- **From sanctions delta:** any new hits on customer name, institution name, or institutional principals since the last screening date.
- **Computed:** `re_verification_due_date`, `re_verification_completed_date`, `next_due`.

## marginal_cost_per_check

- **Per re-verification cycle:** dominated by analyst labor (compose outreach, chase non-responders, read reply, log decision). `[best guess: 30-60 minutes of compliance-analyst time per pre-approved entity per year, at fully-loaded $100/hr → $50–$100 per entity per year. This is the same order of magnitude as financial-services KYC refresh costs of £10–£100 per check reported by [Plaid / Veriff industry summaries](https://plaid.com/resources/banking/what-is-kyc/).]`
- IBC-RMS lookup itself: $0 marginal.
- **Setup cost:** SOP authoring (~1 week of compliance-officer time), workflow tool configuration, initial baseline of all existing pre-approved entities (~5–20 minutes each for the first cycle to establish the institutional contact). `[best guess: $10K–$30K one-time setup for a provider with a few hundred pre-approved entities.]`

## manual_review_handoff

The SOP itself *is* the human workflow. Per cycle, for each pre-approved entity:

1. **30 days before due date:** workflow tool opens a re-verification ticket and sends positive-confirmation request to the institutional contact on file.
2. **At due date:** if no reply, send second reminder; escalate to backup contact (e.g., institution's biosafety officer obtained via IBC-RMS).
3. **Due date + 30 days:** if still no positive confirmation, **auto-suspend pre-approval status**. Subsequent SOC orders from this entity are routed through the full new-customer screening path (m18-19-20) until re-verification is completed.
4. **On reply received:** analyst reviews; runs sanctions delta; runs IBC-RMS check; records artifacts in the customer record. If anything has changed (new PI, shipping address, IBC scope, sanctions hit), escalates to biosecurity officer.
5. **Event-triggered re-verification.** Independent of the annual cycle, re-verification fires immediately on: a hit in any monitoring channel (m01 delta-rescreen), a change in institutional contact email domain (m02), a known org-renaming or M&A event picked up via news/registry change, or a flag from another idea in the m18 stack.

## flags_thrown

- `annual_reverification_overdue` — pre-approval status auto-suspended; customer routed to full screening on next order.
- `reverification_failed_silent` — institutional contact did not respond; backup contact also unreachable. Action: suspend; biosecurity officer escalation.
- `reverification_returned_change` — contact replied but reported a material change (PI departed, IBC scope change, address change). Action: re-screen the affected dimension before reinstatement.
- `reverification_sanctions_delta` — new sanctions hit since last screening. Action: route through m01 / m08 follow-up.
- `reverification_ibc_lapse` — IBC-RMS shows the institution's IBC has lapsed or was deregistered. Action: escalate immediately; suspend SOC ordering until clarified.

## failure_modes_requiring_review

- **Manual workload spike** if re-verifications cluster (e.g., all entities baselined in the same month). Mitigation: stagger initial cycle.
- **Stale institutional contact email.** The contact on file has left; the institution does not auto-route. Backup IBC-RMS contact bridges this for US institutions but not for foreign ones.
- **Foreign institutions** outside US/UK have no equivalent of IBC-RMS; re-verification falls back to direct outreach only.
- **Reply forgery.** A compromised institutional inbox replies "yes, all good" — the SOP catches this only if positive confirmation is paired with at least one out-of-band channel (phone callback, signed PDF, DMARC alignment check).
- **Holiday / sabbatical silence.** Legitimate non-response from a contact who is genuinely on leave; manual override path required.
- **Edge case: institution dissolved or merged.** IBC-RMS or registry source identifies the change, but routing the now-orphaned customer record requires judgment.

## false_positive_qualitative

- Active researchers at legitimate institutions whose institutional administrator simply doesn't reply within the window (very common in academia).
- Researchers at small or foreign institutions with no formal IBC and therefore no IBC-RMS row to confirm against.
- Researchers in transitional employment status (e.g., between postdoc and faculty appointment) where the institutional answer is "it's complicated."
- Government / national-lab customers whose IBCs are administered through agency-internal systems that aren't reflected in IBC-RMS.

## record_left

- Re-verification ticket per cycle: outbound message, reply, IBC-RMS snapshot, sanctions delta result, analyst notes, decision, timestamps.
- Versioned customer-status field: `pre_approved | re_verification_pending | suspended | restored`, with full history.
- A monthly auditor-facing report listing total re-verifications due, completed, suspended, and overdue. Satisfies the "documentary evidence of legitimacy" intent of measure 17.
- The artifact set is constructed to be sufficient for an external biosecurity auditor to confirm the SOP is being followed end-to-end.

## Sourcing notes

- The annual cadence and the auto-suspend on overdue both map directly to standard financial-services KYC refresh practice for high-risk customers ([EY 2024 KYC refresh](https://www.ey.com/en_us/insights/financial-services/kyc-refresh-effective-risk-based-program); [NorthRow review-frequency guide](https://www.northrow.com/blog/how-often-should-you-conduct-a-kyc-data-review); [Finextra event-driven KYC commentary](https://www.finextra.com/blogposting/31323/event-driven-kyc-refresh-why-periodic-review-fails-operationally)). Event-driven triggers complement (do not replace) the annual baseline — the financial-services consensus is that pure-periodic without event triggers misses too much, but pure-event-driven without periodic baseline drifts.
- IBC-RMS public-roster integration is grounded in [NIH OSP IBC FAQs April 2024](https://osp.od.nih.gov/policies/biosafety-and-biosecurity-policy/faqs-on-institutional-biosafety-committee-ibc-administration-april-2024/) and [CITI Program 2024 summary](https://about.citiprogram.org/blog/nih-reinforces-transparency-in-biosafety-oversight-with-new-ibc-requirements/) on the June 1, 2025 transparency rule.
- Per-check cost estimate is benchmarked against the [Plaid](https://plaid.com/resources/banking/what-is-kyc/) industry summary's £10–£100 per KYC check range, biased upward because biosecurity re-verifications involve more analyst judgment than retail bank KYC.
