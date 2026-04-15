# m15-screening-reconciliation — Implementation v1

- **measure:** M15 — soc-self-declaration
- **name:** Sequence-screening / declaration reconciliation across Aclid + Battelle UltraSEQ + SecureDNA
- **modes:** D, A
- **summary:** Run every order through one or more sequence-screening services (Aclid, Battelle UltraSEQ, SecureDNA) and reconcile the screening output with the customer's SOC self-declaration. If the screening identifies an SOC the customer didn't declare, or if vendors disagree with each other on whether an SOC is present, escalate to scientific review. Multi-vendor reconciliation also catches single-vendor coverage gaps.

## external_dependencies

- [Aclid](https://www.aclid.bio/) — commercial sequence + customer screening with API.
- [Battelle UltraSEQ](https://www.battelle.org/markets/health/public-health/epidemiology/ultraseq) — commercial Threat Identification Algorithm against a curated SOC database.
- [SecureDNA](https://securedna.org/) — free, multi-party oblivious-hashing screening provided by SecureDNA Foundation (Switzerland).
- Internal reconciliation engine that diffs vendor outputs against the m15-structured-form / m15-llm-extraction declaration.
- Scientific reviewer (BSL+ trained).

## endpoint_details

### Aclid

- **API:** Aclid offers REST integration; documentation publicly references "built-in integrations or their API" but the actual API spec is `[vendor-gated — Aclid product pages describe an API for compliance integrations; would require sales contact for the OpenAPI spec, auth model, and endpoint URL]` ([Aclid biosecurity solutions](https://www.aclid.bio/solutions/biosecurity)).
- **Performance:** "average turnaround time for screening sequences up to 100,000 base pairs is 2.49 seconds" ([Aclid resources](https://www.aclid.bio/resources/guide-to-the-screening-certification-process)).
- **Pricing:** `[vendor-gated — pricing not publicly listed; would require sales contact]`. Case studies (Agilent, Ansa) suggest enterprise pricing.
- **ToS:** standard SaaS, customer data processed under Aclid's commercial terms.

### Battelle UltraSEQ

- **Product page:** https://www.battelle.org/markets/health/public-health/epidemiology/ultraseq
- **API:** `[vendor-gated — Battelle's product page describes UltraSEQ as a service with both per-sequence and per-dataset modes; would require sales contact for the API spec, deployment model (cloud vs on-prem), and pricing]`.
- **Algorithm:** Proprietary SOC database + Threat Identification Algorithm; outputs threat type and ranking.
- **Validation:** [Sensitivity study on >140k sequences](https://pmc.ncbi.nlm.nih.gov/articles/PMC11447129/) shows the dominant tunable parameters are minimum hit homology, region length, and uniqueness to a select agent.

### SecureDNA

- **API:** Public, free. FASTA in → JSON out with hazard locations + boolean SOC flag ([SecureDNA features](https://securedna.org/features/)).
- **Auth model:** API key from SecureDNA Foundation; provider-side hashing means customer sequence content never leaves the provider in cleartext (multi-party oblivious hashing).
- **Cost:** $0 (free service from a Swiss nonprofit; [SecureDNA FAQ](https://securedna.org/faq/)).
- **Specific endpoint URL:** `[unknown — searched for: "SecureDNA API endpoint URL", "SecureDNA hdb screening API documentation"]`. The GitHub org [SecureDNA](https://github.com/SecureDNA) hosts the client code; deployment guide is in repo READMEs.
- **ToS:** Free service; nonprofit terms.

## fields_returned

Per vendor, normalized:

- `sequence_id` (provider-side order line)
- `vendor`
- `flagged` (bool)
- `threat_class` (e.g. select-agent, BWC, EAR-controlled, toxin, none)
- `organism_inferred` (when vendor identifies the source organism)
- `confidence` / `homology_score`
- `region` (start/end of the matching region)
- `vendor_response_id` (immutable)

Reconciler emits:

- `vendors_run`
- `vendors_agreed_on_flag` (bool)
- `vendor_disagreement` (which vendors flagged, which didn't)
- `declaration_agreement` (does the customer's declared `intended_use_category` and `host_organism` line up with the inferred organism / threat class?)
- `severity` (low / med / high)

## marginal_cost_per_check

- SecureDNA: $0.
- Aclid: `[vendor-gated]`. `[best guess: $0.10–$2 per sequence at enterprise tier — order of magnitude based on the existence of customers like Agilent and Ansa scaling, but no public list]`.
- Battelle UltraSEQ: `[vendor-gated]`. Likely similar order of magnitude.
- For a provider running all three: rough best guess $0.20–$4 per order line.
- **setup_cost:** 4–8 engineer-weeks to integrate three vendors (assuming Aclid + Battelle contracts in place), build the reconciler, and train reviewers.

## manual_review_handoff

1. Order → all three (or all configured) vendors in parallel.
2. Reconciler diffs flags. Cases:
   - All vendors agree no flag, declaration consistent → pass.
   - All vendors flag the same SOC, customer declared the SOC → process per the declared use, normal SOC review.
   - All vendors flag the same SOC, customer did NOT declare → priority queue (this is the M15 cross-check classic case): contact customer with the screening result and ask for explanation.
   - Vendors disagree → reviewer adjudicates (which vendor's coverage is broader for this organism class).
   - Customer declared SOC, no vendor flag → reviewer reviews; possible the customer's declaration is broader than the actual sequence (benign) or the sequence is novel and not in any DB.
3. For each flag, the reviewer reads the matched region, the threat class, and the customer's declared use; decides hold / proceed / deny / report.
4. Reports for confirmed-malicious go to FBI Weapons of Mass Destruction Coordinator per HHS guidance `[best guess based on standard provider practice — would require legal review of current reporting framework]`.

## flags_thrown

- `soc_screening_disagreement` — at least one vendor flags an SOC the customer didn't declare → priority queue.
- `vendor_disagreement` — vendors disagree among themselves → reviewer queue.
- `declared_soc_no_vendor_hit` — declared SOC but no vendor confirms → reviewer queue (novel sequence, or false declaration).
- `inferred_organism_mismatch` — vendor inferred organism differs from customer-declared host organism.

## failure_modes_requiring_review

- One or more vendor APIs unavailable — fall back to the others; if SecureDNA is down and is the only configured vendor, queue manually.
- Novel SOCs not in any DB — known structural gap of all sequence-screening tools.
- Functionally equivalent sequences with optimized codons that evade homology-based detection — known weakness ([Battelle blog: How does DNA sequence screening need to evolve?](https://inside.battelle.org/blog-details/how-does-dna-sequence-screening-need-to-evolve)).
- Short order lines below the per-vendor minimum length (200 bp for some Battelle parameter sets — see [Why screen 200 bp at a time?](https://inside.battelle.org/blog-details/why-screen-sequences-200-bp-at-a-time)).

## false_positive_qualitative

- Researchers ordering benign housekeeping genes from organisms that happen to be select agents (e.g., a metabolic gene from *B. anthracis* that has no virulence function but lives in the SOC database). Sensitivity study found 7–9% of screened sequences are non-regulated SOC matches ([sensitivity study](https://pmc.ncbi.nlm.nih.gov/articles/PMC11447129/)).
- Vaccine developers ordering attenuated-strain sequences from regulated pathogens.
- Diagnostic developers ordering primer/probe regions from select agents.
- Researchers using open-source plasmids whose backbones share regions with controlled vectors.

## record_left

- Per-vendor JSON response (immutable).
- Reconciler diff (which vendors flagged, which fields disagreed).
- Reviewer adjudication.
- Audit trail of which vendors were live at order time.

## Notes on cross-check vs. attacker stories

- This is M15's deepest implementation. It catches `inbox-compromise` exemption-claim straightforwardly (SOC vendor flag overrides "exemption" assertion). It catches naive `unrelated-dept-student` and `lab-manager-voucher` declarations because the screening output contradicts the vague declaration.
- It does NOT catch `cro-framing` / `gradual-legitimacy-accumulation` because in those branches the declared use is *consistent* with the screening output by construction. The reconciler finds nothing wrong because the attacker engineered the alignment.
- It does NOT catch novel functional analogs of SOCs that aren't in any vendor DB.
