# m13-callback-sop — Implementation v1

- **measure:** M13 — phone-voip-check (extended: out-of-band callback to verify the human)
- **name:** Independent-switchboard callback SOP
- **modes:** A (asymmetric — produces a positive identity assertion the attacker cannot fabricate)
- **summary:** When an order escalates (M13 VoIP flag, M12 billing mismatch, supporting-doc anomaly, SOC content), the reviewer places an outbound call to the customer's claimed institution by first **independently** looking up the institution's main switchboard number (university registrar / department directory / `arizona.edu/contact-us`-style page, **never** the number the customer provided), then asking the switchboard to transfer to the named individual. The reviewer confirms the order with the person who picks up. This is the canonical out-of-band verification that BEC fraud guidance recommends.
- **attacker_stories_addressed:** inbox-compromise (fabricated letter with attacker-controlled VoIP callback number — the reviewer's independent lookup defeats this), account-hijack (PI's real number on file but reviewer asks for the live person — attacker cannot answer the institution-routed call), credential-compromise (same), it-persona-manufacturing (no actual person at the claimed institution to transfer to), shell-company / shell-nonprofit / cro-* / community-bio-lab (no legitimate switchboard at all, or the switchboard exists but cannot vouch for the named individual).

## external_dependencies

- Reviewer (provider's onboarding/compliance analyst). Trained per SOP.
- Independent-source phone lookup. Recommended sources, in order of trust:
  1. The institution's `.edu` (or `.gov`, `.org`) "Contact Us" page reached by typing the institution name into a search engine (not by following a link the customer provided).
  2. The institution's online directory (e.g., `directory.arizona.edu`, `iam.uiowa.edu/whitepages/search`). [source](https://directory.arizona.edu/) [source](https://iam.uiowa.edu/whitepages/search)
  3. ROR (Research Organization Registry, ror.org) for the canonical institution record, then click through to the homepage.
  4. Country phone book / national directory for non-US institutions.
- Outbound call infrastructure. Anything (desk phone, softphone, Twilio Programmable Voice, Aircall) that supports recording/logging is fine.

## endpoint_details

- This is a manual SOP, not an API. The "endpoint" is the institution's switchboard number, looked up per case.
- ToS: institutions generally publish switchboard numbers explicitly to receive inbound public calls. No use restriction beyond standard call etiquette.
- Cost of outbound calls: $0.013–$0.015/min for US PSTN via Twilio Programmable Voice. [best guess: based on standard Twilio voice pricing tiers]
- BEC out-of-band verification is the documented industry standard for high-stakes confirmations. JPM Cybersecurity, FBI BEC guidance, and Nacha all explicitly recommend independent-callback verification with outbound calls. [source](https://www.jpmorgan.com/insights/cybersecurity/business-email-compromise/when-callbacks-go-wrong) [source](https://www.fbi.gov/how-we-can-help-you/scams-and-safety/common-frauds-and-scams/business-email-compromise) [source](https://www.nacha.org/content/business-email-compromise)

## fields_returned

The SOP produces a structured call-log record:

- `lookup_source` (URL or "ROR" or "search engine result")
- `switchboard_number_used`
- `time_of_call`, `duration`
- `transferred_to` (department / person name)
- `verification_outcome` (`confirmed` / `denied` / `no-such-person` / `voicemail-only` / `transfer-failed`)
- `verifier_voice_notes` (free-text reviewer notes)
- `recording_id` (if call was recorded under jurisdictionally-permitted recording rules)

## marginal_cost_per_check

- Reviewer time: 5–15 minutes per case (lookup + call + write-up). At $30–$60/hour fully loaded, $2.50–$15 per check. `[best guess]`
- Telephony: $0.05–$0.20 per call at typical Twilio rates for a 5–10 minute call.
- **setup_cost:** Writing the SOP, training reviewers, integrating call-log into the case-management system. ~1 person-week of analyst-lead time. `[best guess]`

## manual_review_handoff

The SOP itself:

1. **Trigger:** order is flagged by any combination of {M13 VoIP, M12 mismatch, suspicious supporting doc, SOC content, customer cannot answer institutional questions}.
2. **Independent lookup:**
   a. Open a fresh browser tab. In a search engine, type `<institution name> switchboard` or `<institution name> contact`.
   b. Land on the institution's `.edu` / `.gov` / official domain. Do **not** click any link the customer sent or that appears in the customer's email signature.
   c. If the institution is small or the search is ambiguous, look up the canonical record in ROR (ror.org) → click through to the institution's `homepage_url`.
   d. Record the URL and the switchboard number on the case.
3. **Place the call:**
   a. Outbound only. Never accept an inbound call from the customer for this verification.
   b. Ask switchboard to transfer to the named individual or their department/lab.
   c. If transferred, ask the person two questions: (i) "Did you place an order with [provider] for [synthesis description]?"; (ii) "Can you confirm the institutional billing path you intend to use?"
   d. Document answers verbatim.
4. **Outcomes and actions:**
   - `confirmed` → release the order; record `callback_confirmed` on the file.
   - `denied` ("I never placed that order") → block, file SAR/incident report, alert the institution's IT-security contact (looked up the same way).
   - `no-such-person` → block; treat as fabricated identity; route to senior compliance.
   - `voicemail-only` → leave a callback request to the institution's main number; pause the order; do not unblock until human contact. Do not call back the number the voicemail offers unless it matches the switchboard listing.
   - `transfer-failed` (switchboard cannot find person) → re-attempt with alternative spellings; if still unfound, block and route to senior compliance.
5. **Recording:** if the reviewer's jurisdiction permits one-party recording, record the call and store with the case file. Otherwise, type a contemporaneous transcript.

## flags_thrown

- `callback_denied` — person denies placing order; block + escalate.
- `callback_no_such_person` — switchboard has no record; block + escalate.
- `callback_voicemail_only` — pending; do not release.
- `callback_transfer_failed` — switchboard could not transfer; pending.
- `callback_confirmed` — release.

## failure_modes_requiring_review

- Customer is at a large institution where the switchboard cannot route to a specific researcher (e.g., big hospital systems with thousands of staff). Mitigation: route to the department / lab head instead of the individual.
- Time zones and after-hours calls. Plan callbacks during the institution's business hours; pause the order rather than push for an answer.
- Customer is a legitimate visiting scholar whose name is not yet in the institution's directory. Mitigation: ask switchboard to transfer to the host PI / department admin and confirm the visit.
- Switchboard refuses to confirm any information (privacy policy). Mitigation: ask only for transfer, not for information disclosure; rely on the call-back recipient's confirmation.
- BEC tactic: attacker is sitting on the institution's mail server and can intercept the call routing if the institution uses VoIP-based switchboard with email-based call forwarding. Lower-likelihood but not zero. Mitigation: ask a question only the legitimate customer would be able to answer (a detail from the order).

## false_positive_qualitative

- Legitimate but reachable-only-by-email researchers (sabbatical, fieldwork, parental leave).
- New hires not yet in directory.
- Multi-tenant research buildings where the lab phone is shared across PIs and the wrong person picks up.
- Non-US institutions with switchboards in non-English languages — reviewer may need a translator.
- Independent researchers / consultancies / contract labs without a switchboard at all. The check is not appropriate for these customers; M12 procurement-network and M14 identity-evidence checks apply instead.

## record_left

A structured call log on the case file plus (where lawful) an audio recording. Schema as in `fields_returned`. This is the strongest auditable artifact across all M13 ideas: it demonstrates active human verification rather than a passive lookup.

## sources

- [JPM — When Callbacks Go Wrong (BEC out-of-band guidance)](https://www.jpmorgan.com/insights/cybersecurity/business-email-compromise/when-callbacks-go-wrong)
- [FBI — Business Email Compromise scams](https://www.fbi.gov/how-we-can-help-you/scams-and-safety/common-frauds-and-scams/business-email-compromise)
- [Nacha — Business Email Compromise](https://www.nacha.org/content/business-email-compromise)
- [University of Arizona Contact Us](https://www.arizona.edu/contact-us)
- [University of Arizona Campus Directory](https://directory.arizona.edu/)
- [University of Iowa Directory Search](https://iam.uiowa.edu/whitepages/search)
- [Boston University Operator Services](https://www.bu.edu/tech/services/cccs/phone/calling-services/operator-services/)
