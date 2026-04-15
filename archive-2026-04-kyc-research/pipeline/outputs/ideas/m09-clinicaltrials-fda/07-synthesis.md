# Per-idea synthesis: m09-clinicaltrials-fda

## Section 1: Filled-in schema

**name**

ClinicalTrials.gov + FDA establishment registration cross-check

**measure**

M09 — institution-real-life-sciences

**attacker_stories_addressed**

shell-nonprofit, paper-shell-research-org (per spec). Stage 5 found the check provides zero friction against 6 purpose-built-organization stories (shell-company, cro-framing, cro-identity-rotation, biotech-incubator-tenant, gradual-legitimacy-accumulation, community-bio-lab-network) because non-clinical, non-regulatory entities are structurally absent from both databases. The check's value is as a positive corroboration signal when it fires, not as a screen.

**summary**

Cross-check the institution name against ClinicalTrials.gov v2 API (as sponsor/collaborator/site) and the FDA establishment registration database (openFDA device registration + CDRH text-search fallback). Either presence is positive evidence the institution is a real, regulated life-sciences entity. Absence is non-diagnostic — the check is designed as positive corroboration, not a blocking gate.

**external_dependencies**

ClinicalTrials.gov REST API v2 (no auth, free, public dataset); openFDA device registration & listing endpoint (free API key for higher rate limits); FDA CDRH establishment registration text search (web UI fallback).

**endpoint_details**

**ClinicalTrials.gov v2:** `https://clinicaltrials.gov/api/v2/studies` — REST + JSON, OpenAPI 3.0, no auth, free. Sponsor name at `protocolSection.sponsorCollaboratorsModule.leadSponsor.name`. Rate limits: [unknown — searched for: "ClinicalTrials.gov API v2 rate limit", "clinicaltrials.gov api throttle requests per second" — not officially published]. **openFDA device registration:** `https://api.fda.gov/device/registrationlisting.json` — REST + JSON; no key: 240 req/min, 1,000 req/day per IP; with free API key: 240 req/min, 120,000 req/day [best guess: standard openFDA quotas]. Updated weekly (usually Mondays). **FDA CDRH text search:** HTML form at `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfrl/textsearch.cfm`; manual fallback. **Auth:** none (CT.gov), free API key (openFDA). **Pricing:** $0 marginal. **ToS:** both are US federal public datasets; no commercial restriction [best guess: openFDA terms permit commercial use with attribution; CT.gov is public domain].

**fields_returned**

**CT.gov v2:** NCT ID, brief/official title, lead sponsor name and class (INDUSTRY/NIH/OTHER_GOV/OTHER), collaborators, study type, phase, status, start/completion dates, locations (facility name + city + country), conditions, interventions. **openFDA device registration:** `firm_name`, `owner_operator_number`, registration number, FEI number, address, establishment_type, products (k_number, product_code, device class).

**marginal_cost_per_check**

$0 per check (both APIs free). **Setup cost:** ~1-2 engineering days for both API integrations + name-normalization layer (lowercased, stopwords stripped, suffix-tolerant).

**manual_review_handoff**

3-step playbook: (1) >= 1 CT.gov sponsor/collaborator hit AND/OR >= 1 openFDA establishment hit at same registered address: pass on M09; record IDs. (2) 0 hits: do NOT auto-deny — many legitimate basic-research labs have neither; reviewer reads institution website/registry and falls through to other M09 ideas (corp-registry-stack, pubmed-affiliation, irs-990). (3) Fuzzy/partial match with multiple candidates: reviewer disambiguates by registered address and incorporation year against parallel corp-registry check.

**flags_thrown**


- `no_ctgov_no_fda_registration` — neither source returns a hit; route to reviewer; non-blocking on its own.

- `ctgov_match_but_role_unclear` — institution appears as CT.gov site but not sponsor/collaborator; weaker positive evidence.

- `fda_registration_address_mismatch` — openFDA returns registration but registered address differs materially; possible name collision or stale registration.

**failure_modes_requiring_review**

Name normalization ambiguity (common 2-3 word names collide); API outage / 5xx (check recorded as "deferred"); openFDA weekly refresh staleness (up to 7 days); CT.gov sponsor name vs. registered legal name mismatch (e.g., "Stanford" vs. "Leland Stanford Junior University").

**false_positive_qualitative**

The check's error profile is asymmetric: the failure mode is overwhelmingly **false negatives**, not false positives. Legitimate customers incorrectly flagged as `no_ctgov_no_fda_registration`: basic-research labs (~60-80% of university-based synthesis customers); small/early-stage biotech (~70-85% of biotech companies); foreign institutions not in US registries (~40-60% of non-US customers); DIY/community labs (~100%). True false positives (wrong institution matched) are rare but possible through name collisions.

**coverage_gaps**


- **Gap 1 — Basic-research academic labs:** ~60-80% of university-based life-sciences researchers work in labs with no CT.gov/FDA presence. CT.gov has ~12,000-15,000 unique sponsors vs. thousands of university departments doing life-sciences research.

- **Gap 2 — Small biotech/CROs:** ~70-85% of biotech companies are pre-IND or non-clinical; no CT.gov/FDA presence.

- **Gap 3 — Foreign institutions:** ~40-60% of non-US institutional customers produce no CT.gov hit; FDA registration is US-centric.

- **Gap 4 — DIY/community labs:** ~50-100 worldwide; 100% false-negative rate.

- **Gap 5 — Name-normalization ambiguity:** ~15-25% of queries may face challenges; CT.gov sponsor names are self-reported and not standardized.

**record_left**

JSON snapshot of CT.gov query response and openFDA query response, stored in customer file with query timestamp. Paper trail of "we checked these public registries on date X and got these results."

**bypass_methods_known**

No attacker story is reliably caught by this check. The check is a positive-corroboration signal: when it fires, it validates the institution. For purpose-built-organization attackers (shell-company, cro-framing, etc.), absence is indistinguishable from legitimate thin-profile entities. For dormant-domain, historical CT.gov records may provide false positive evidence for the attacker. For shell-nonprofit, name-collision could produce false positive evidence.

**bypass_methods_uncovered**

**Structural — non-clinical, non-regulatory entities absent from both databases:** shell-company, cro-framing, cro-identity-rotation, biotech-incubator-tenant, gradual-legitimacy-accumulation, community-bio-lab-network (all 6 purpose-built-org stories). **Implementation-specific:** name-collision reflected legitimacy (shell-nonprofit); historical CT.gov records lack liveness/recency filter (dormant-domain).


## Section 2: Narrative


### What this check is and how it works

This check queries two free US federal databases to determine whether a customer's institution appears as a real, regulated life-sciences entity. ClinicalTrials.gov v2 is queried for the institution name as a trial sponsor, collaborator, or site — a match indicates the institution runs or hosts clinical trials, which is strong evidence of legitimate translational research activity. The openFDA device registration endpoint is queried for the institution as a registered establishment — a match indicates the institution manufactures or distributes FDA-regulated products. Both APIs are free, require no authentication (or a free API key for higher rate limits), and return structured data including entity names, addresses, trial details, and registration identifiers. For each customer, the check runs a name-normalized query against both databases and reports the result.


### What it catches

The check provides high-confidence positive corroboration when it fires. A match against ClinicalTrials.gov or the FDA establishment database is strong evidence that the institution is a real, regulated life-sciences entity — not a shell company, not a recently fabricated nonprofit, not a dormant-domain impostor. This is most valuable for established pharmaceutical companies, device manufacturers, large academic medical centers, and hospitals that routinely sponsor clinical trials or hold FDA registrations. The check costs $0 per query and adds no latency, making it worth including as part of a multi-signal M09 assessment even though its coverage is narrow.


### What it misses

The check misses the majority of legitimate synthesis customers and all modeled purpose-built-organization attackers. ClinicalTrials.gov and the FDA establishment database cover only institutions in the clinical/translational/regulatory pipeline. An estimated 60-80% of university-based life-sciences researchers work in basic-research labs with no CT.gov presence; 70-85% of biotech companies are pre-IND or non-clinical; 40-60% of non-US customers are outside the US-centric databases; and DIY/community labs have a 100% false-negative rate. All six purpose-built-organization attacker stories (shell-company, cro-framing, cro-identity-rotation, biotech-incubator-tenant, gradual-legitimacy-accumulation, community-bio-lab-network) exploit this structural gap — their entities are designed to be non-clinical and non-regulatory, making their absence from these databases indistinguishable from legitimate thin-profile entities. The `no_ctgov_no_fda_registration` flag is therefore non-diagnostic and should not contribute meaningfully to a risk score.


### What it costs

Both APIs are free — $0 per query with no subscription or setup fee. Engineering setup is ~1-2 days for the API integrations and a name-normalization layer. This is the cheapest M09 check by a wide margin, which justifies its inclusion despite the narrow coverage: the signal-to-cost ratio is favorable because the cost is effectively zero.


### Operational realism

The check runs fully automated with no human involvement for positive matches (auto-pass on M09). The manual review handoff occurs only for zero-hit results, and the SOP explicitly instructs reviewers not to auto-deny on absence — the reviewer falls through to other M09 checks (pubmed-affiliation, corp-registry-stack, irs-990). This makes the check low-friction operationally. The main operational concerns are name-normalization quality (CT.gov sponsor names are self-reported and unstandardized, creating ~15-25% of queries with potential disambiguation issues) and the weekly refresh lag for openFDA (up to 7 days for newly registered establishments). The audit trail is straightforward: JSON snapshots of both API responses with timestamps.


### Open questions

The ClinicalTrials.gov v2 API rate limit is not officially published and remains unknown. The openFDA rate-limit figures (240 req/min, 120k req/day with API key) are marked as best guesses and should be verified against the openFDA authentication page. Stage 5 suggested two refinements that were not implemented in v1: (1) a recency filter for CT.gov matches to distinguish active trials from historical records of defunct entities (addresses the dormant-domain scenario), and (2) an address cross-validation step for CT.gov positive matches to address the name-collision scenario (shell-nonprofit). Both are minor and implementable.

## Section 3: Open issues for human review


- **No Critical findings from Stage 5.** The structural false-negative rate (Finding 1, Moderate) is acknowledged and correctly handled by the implementation's non-blocking design. No re-research was triggered.


- **Structural false-negative rate is dominant:** ~60-80% of academic customers, ~70-85% of small biotech, ~40-60% of non-US customers, and 100% of DIY/community labs produce no signal. The `no_ctgov_no_fda_registration` flag should be treated as non-diagnostic — it does not distinguish malicious entities from legitimate thin-profile entities.


- **Name-collision risk (Finding 2, Minor):** CT.gov sponsor-name search may return results for a similarly-named real institution, providing false positive evidence for a name-collision attacker (shell-nonprofit scenario). Stage 5 suggests address cross-validation for CT.gov positive matches.


- **Historical records lack liveness check (Finding 3, Minor):** CT.gov trial records are permanent; a defunct entity's historical trials could provide false positive evidence for a dormant-domain attacker. Stage 5 suggests a recency filter (count only trials with completion date within last 5 years as positive evidence).


- **[unknown — searched for: "ClinicalTrials.gov API v2 rate limit", "clinicaltrials.gov api throttle requests per second"]:** API rate limit not officially published.


- **[best guess]:** openFDA rate-limit figures (240 req/min, 120k req/day) should be verified against `https://open.fda.gov/apis/authentication/`.


- **[best guess]:** ToS for both APIs are assumed to permit commercial use; should be verified directly.


- **04F and 04C both returned REVISE** with upgrade-suggested items (sourcing quality, not field completeness). A v2 iteration was deemed optional since the document is substantively complete.
