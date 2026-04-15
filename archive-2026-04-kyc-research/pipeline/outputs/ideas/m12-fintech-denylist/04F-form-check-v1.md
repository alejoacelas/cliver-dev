# m12-fintech-denylist — Form check v1

**Document under review:** `04-implementation-v1.md`

## Field verdicts

### name
**PASS.** "Mercury / Brex / Wise consumer-fintech denylist" — specific, names the data sources.

### measure
**PASS.** M12 (billing-institution-association).

### attacker_stories_addressed
**PASS.** Detailed per-story analysis with direct/partial/NOT distinctions. Cites specific source file excerpts from the attacker mapping.

### summary
**PASS.** Clear one-paragraph description of the check mechanism.

### external_dependencies
**PASS.** Names three concrete options (binlist.net, BinDB, Stripe Radar) plus the internal denylist. Includes the BIN-sponsor mapping challenge.

### endpoint_details
**PASS.** Three endpoints documented (binlist.net, Stripe Radar, BinDB) with URLs, auth models, rate limits, and pricing. BinDB pricing correctly marked `[vendor-gated]`.

### fields_returned
**PASS.** Concrete field lists for both the BIN lookup return and the internal denylist match record.

### marginal_cost_per_check
**PASS.** $0–$0.07 range with breakdown by source. Denylist maintenance cost estimated with `[best guess]` marker.

### manual_review_handoff
**PASS.** Concrete SOP with three customer-type branches and escalation path.

### flags_thrown
**PASS.** Three distinct flags with actions.

### failure_modes_requiring_review
**PASS.** Six modes identified, including BIN sponsor churn, legitimate small institutions, and international fintechs.

### false_positive_qualitative
**PASS.** Three categories identified. Correctly identifies the core problem: legitimate small biotechs use the same banks as shells.

### record_left
**PASS.** Specifies BIN lookup result, denylist match details, reviewer memo, and denylist version.

## Borderline observations

1. The internal fintech-BIN denylist is described as "maintained internally" but the document does not specify how the initial BIN-to-fintech mapping is constructed. The claim that Mercury uses Choice Financial Group / Evolve Bank & Trust as BIN sponsors is presented without a direct citation — it is widely discussed in fintech forums but should be verified by 4C.

2. The `fintech_billing_name_mismatch` flag (issuing bank name vs. claimed institution) overlaps significantly with what a standard AVS or billing-name check would already catch. The document does not discuss whether this flag adds signal beyond existing billing consistency checks.

## For 4C to verify

- binlist.net rate limit claim (10 requests/minute).
- binlist.net field list (scheme, type, brand, prepaid, country, bank.name, etc.).
- Stripe Radar pricing ($0.05/transaction standard, $0.07/transaction Fraud Teams).
- Stripe Radar `:card_bin:` attribute availability in rules.
- The claim that 8-digit BINs became mandatory after April 2022.
- BinDB coverage claim (250,000+ BIN records).

## Verdict

**PASS.** All required fields are populated with substantive content and sourcing markers. The borderline observations are minor and do not affect the document's usability.
