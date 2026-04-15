# Coverage research: Independent-switchboard callback SOP

## Coverage gaps

### Gap 1: Customers without a reachable institutional switchboard (independent researchers, small biotechs, contract labs)
- **Category:** Independent researchers, small biotech startups, contract research organizations, community bio-labs, and consultants who do not have an institutional switchboard that a reviewer can call. They have no university, no government lab, no large-company operator to route through.
- **Estimated size:** Biopharmaceutical/diagnostics companies hold ~42% of the DNA synthesis market by revenue. [source](https://www.grandviewresearch.com/industry-analysis/us-dna-synthesis-market-report) Most small-to-medium biotechs (sub-50 employees) do not have switchboards. [best guess: 15–25% of all synthesis customers are at organizations too small for a real switchboard — small biotechs, solo consultants, contract labs, community bio-labs. In life sciences research, "two thirds of investigators were employed by institutions of higher learning; 14% by federal government, 10% by industry" — the remaining ~10% by miscellaneous nonprofits and self-employed. [source](https://www.ncbi.nlm.nih.gov/books/NBK224367/) For the industry segment, only large pharma/biotech would have corporate switchboards; smaller players would not.]
- **Behavior of the check on this category:** no-signal (no switchboard to call; the SOP cannot execute)
- **Reasoning:** The implementation acknowledges this: "Independent researchers / consultancies / contract labs without a switchboard at all. The check is not appropriate for these customers."

### Gap 2: Researchers not listed in their institution's directory (new hires, visiting scholars, postdocs, adjuncts)
- **Category:** Legitimate researchers at institutions that have switchboards, but whose names do not appear in the institution's online directory or cannot be located by the operator — new hires, visiting scholars, postdocs on short-term contracts, adjunct faculty, and staff in large multi-tenant research buildings.
- **Estimated size:** [unknown — searched for: "percentage university staff not listed in online directory", "university directory coverage rate new hires"] No public data found on directory coverage rates. [best guess: at any given time, 5–15% of active researchers at a large university may be absent from or difficult to find in the directory — based on typical onboarding lags of 2–4 weeks for new hires, high turnover among postdocs (median postdoc duration ~2–3 years), and visiting scholars who may never be added to the directory]
- **Behavior of the check on this category:** false-positive (`callback_no_such_person` or `callback_transfer_failed` fires for a legitimate customer)
- **Reasoning:** The implementation notes: "Customer is a legitimate visiting scholar whose name is not yet in the institution's directory."

### Gap 3: Researchers unreachable during the callback window (time zones, fieldwork, sabbatical, parental leave)
- **Category:** Legitimate institutional researchers who are physically unreachable by phone during business hours — on fieldwork, sabbatical, parental leave, in a different time zone, or simply not answering the lab phone.
- **Estimated size:** [unknown — searched for: "percentage researchers unreachable by phone fieldwork sabbatical parental leave"] [best guess: at any given time, 10–20% of active researchers may be unreachable by phone on a given day — sabbaticals (~7% of tenured faculty per year), fieldwork (especially ecology/environmental biology), conference travel, and cross-time-zone situations for international institutions]
- **Behavior of the check on this category:** false-positive (`callback_voicemail_only`; order paused indefinitely)
- **Reasoning:** The SOP specifies: "voicemail-only → leave a callback request... pause the order; do not unblock until human contact." This means unreachable researchers experience indefinite order delays.

### Gap 4: Non-English-speaking institutions
- **Category:** Researchers at non-US/UK institutions where the switchboard operates in a language the reviewer does not speak — common for institutions in China, Japan, Korea, Germany, France, Brazil, etc.
- **Estimated size:** Gene synthesis market outside North America and UK is ~55–60% by revenue. [source](https://www.gminsights.com/industry-analysis/gene-synthesis-market) Among non-English-speaking institutional customers, the callback SOP requires a translator or a reviewer fluent in the relevant language. [best guess: 30–40% of international institutional customers are at non-English-speaking institutions where the switchboard would be in the local language]
- **Behavior of the check on this category:** weak-signal (the call can be placed but may fail or produce unreliable results due to language barriers)
- **Reasoning:** The implementation notes: "Non-US institutions with switchboards in non-English languages — reviewer may need a translator."

### Gap 5: Institutions with privacy-restrictive switchboards
- **Category:** Institutions whose switchboard operators refuse to confirm whether a named individual works there, refuse to transfer calls to specific researchers, or route all external calls through a gatekeeper (common in hospitals, military-adjacent labs, some European institutions under GDPR).
- **Estimated size:** [unknown — searched for: "university switchboard privacy policy refuse transfer external calls percentage"] [best guess: 5–10% of institutions may have policies restricting switchboard transfers to unknown external callers, particularly hospitals and government-adjacent labs]
- **Behavior of the check on this category:** weak-signal (call connects but verification cannot be completed)
- **Reasoning:** The implementation notes: "Switchboard refuses to confirm any information (privacy policy). Mitigation: ask only for transfer, not for information disclosure." Even with this mitigation, some switchboards will not transfer.

### Gap 6: Scalability constraint — high-volume providers
- **Category:** Not a customer category but a structural coverage gap: the SOP requires 5–15 minutes of analyst time per case. A provider processing thousands of orders per day cannot callback-verify every order.
- **Estimated size:** At $2.50–$15 per check and 5–15 minutes per case, a provider handling 100 escalations/day would need 8–25 FTE analysts dedicated to callbacks. [best guess: the callback SOP is realistically limited to 5–20 escalations per day per analyst, meaning it can only cover the tail of high-risk orders, not serve as a mass screening tool]
- **Behavior of the check on this category:** no-signal (orders that should be escalated but are not, due to capacity constraints)
- **Reasoning:** The implementation frames this as an escalation-only SOP, not a universal check. But the coverage gap is real: if the escalation threshold is set too high to manage volume, some suspicious orders will never be called.

## Refined false-positive qualitative

The primary false-positive-generating categories are:
1. **Gap 2 (not in directory):** Fires `callback_no_such_person` or `callback_transfer_failed` for legitimate researchers. This is the most damaging false positive because the SOP specifies "block and route to senior compliance" — a very aggressive action for what may be a directory-lag issue.
2. **Gap 3 (unreachable):** Fires `callback_voicemail_only` and pauses the order indefinitely. Less aggressive than Gap 2 but potentially a worse customer experience (indefinite delay with no resolution path).
3. **Gap 4 (language barrier):** Does not produce a false-positive flag per se, but may produce an unreliable `callback_confirmed` or an incorrect `callback_no_such_person` due to miscommunication.

## Notes for stage 7 synthesis

- The callback SOP is the strongest identity-verification signal available (active human confirmation) but is inherently unscalable and geographically/linguistically constrained.
- It is correctly positioned as an escalation tool, not a mass screening check. Its coverage gaps are acceptable if the triggering checks (m13-twilio-lookup, m13-telesign-phoneid) are well-calibrated.
- The directory-lag false positive (Gap 2) is the most operationally dangerous: it generates the strongest negative signal (`no_such_person`) for a legitimate customer. The SOP should include a "directory-not-found but institution confirmed" intermediate state rather than routing directly to "block."
- International coverage is structurally weak. For non-English-speaking institutions, the SOP degrades to a best-effort attempt.
