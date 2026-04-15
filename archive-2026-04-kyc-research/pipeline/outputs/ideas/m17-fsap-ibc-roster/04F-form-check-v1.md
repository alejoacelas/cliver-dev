# m17-fsap-ibc-roster — Form check v1

**Document under review:** `04-implementation-v1.md`

## Field verdicts

### name
**PASS.** "FSAP + NIH OSP IBC roster ingestion" — specific.

### measure
**PASS.** M17 (pre-approval-list).

### attacker_stories_addressed
**PASS.** Six attacker branches analyzed with direct/weak/NOT distinctions. Correctly identifies that the IBC check is institution-level, not order-level.

### summary
**PASS.** Clear description. Honestly acknowledges the central limitation: FSAP entity list is not publicly disclosed.

### external_dependencies
**PASS.** Three dependencies named: FSAP (with the eFSAP system description and non-public status), NIH OSP IBC-RMS (with June 2025 transparency date and three supporting citations), and institution name normalization.

### endpoint_details
**PASS.** FSAP correctly documented as having no public API, with explicit searched-for markers for three queries. IBC-RMS documented with URL, public data description, auth (public web), pricing ($0), and coverage description. No documented API for IBC-RMS correctly marked with `[unknown — searched for: ...]` with three queries. FSAP workaround (manual attestation + RO callback) described.

### fields_returned
**PASS.** IBC-RMS fields (8 fields), FSAP aggregate fields (3), and internal pre-approval fields (5) all listed.

### marginal_cost_per_check
**PASS.** IBC-RMS at $0, FSAP human cost estimated with `[best guess: $5–$25]`, setup cost estimated at 2–4 engineer-weeks with `[best guess]`.

### manual_review_handoff
**PASS.** Detailed 7-step SOP covering auto-match, BSO confirmation email, FSAP attestation, timeout handling, and negative confirmation. Concrete and implementable.

### flags_thrown
**PASS.** Five distinct flags with actions. Includes the important `fsap_attestation_unverifiable` flag.

### failure_modes_requiring_review
**PASS.** Seven modes documented. The FSAP non-public list is correctly identified as structural and unfixable. IBC-RMS scraper fragility, name mismatch, BSO data freshness, protocol-vs-order gap, foreign institutions, and commercial biotechs all covered.

### false_positive_qualitative
**PASS.** Three categories: out-of-scope researchers, adjunct/visiting researchers, core facility staff.

### record_left
**PASS.** IBC-RMS snapshot, BSO confirmation email thread, FSAP RO email thread, cross-link to subsequent orders.

## Borderline observations

1. The document mentions that IBC-RMS rosters became publicly available as of June 1, 2025 (citing NOT-OD-25-082). This is a recent policy change — if the implementation is built on this data, the stability of the public-disclosure policy should be considered a risk factor.

2. The FSAP 230-entity count from the 2024 annual report is good data, but the document does not discuss whether a provider could obtain the entity list through a formal data-sharing agreement with CDC/APHIS (as opposed to FOIA). This is a "searched for" gap — is there a formal partnership pathway?

## For 4C to verify

- NIH OSP IBC-RMS transparency announcement URL (osp.od.nih.gov).
- CITI Program blog about NIH IBC transparency.
- NIH Guide notice NOT-OD-25-082.
- 2024 FSAP Annual Report PDF URL at selectagents.gov.
- eFSAP "what is it" page at selectagents.gov.
- The claim that 230 entities were FSAP-registered in 2024.
- The June 1, 2025 effective date for IBC-RMS public roster availability.

## Verdict

**PASS.** All required fields are populated. The FSAP non-public limitation is honestly documented as structural. IBC-RMS is well-sourced with three independent citations for the transparency policy.
