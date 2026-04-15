# Stage 4 — Field-level assessment & flag mapping

**Scope:** One sub-agent per KYC step (5 agents in parallel).  
**Goal:** Synthesize per-endpoint test results into per-field assessments for each KYC flag.  
**Depends on:** Stage 3 (need the endpoint test results).

## Per-agent inputs

- All `results/{endpoint-id}.yaml` files for endpoints relevant to this KYC step (from `01-endpoint-relevance.md`).
- The KYC step definition (flag triggers, follow-up actions from the CSSWG table in `run.md`).
- Measure definitions from `archive-2026-04-kyc-research/pipeline/measures.md`.
- The original `07-synthesis.md` files for relevant ideas (for context on intended use of each field).

## Agent assignments

| Agent | KYC step | Measure | Flag |
|---|---|---|---|
| 1 | a-address-to-institution | M05 | No public association between affiliation and shipping address |
| 2 | b-payment-to-institution | M12 (+M10) | Billing address not associated with the institution; gift card BIN |
| 3 | c-email-to-affiliation | M02 | Does not match institution domain / non-institutional domain |
| 4 | d-residential-address | M04 | Residential address |
| 5 | e-po-box-freight | M03 (+M06) | P.O. Box; freight forwarder address |

## Task

For each endpoint relevant to your KYC step, for each field in that endpoint's response that could inform the flag:

### 1. Describe the field
One sentence: what does this field tell you? Where does the data come from?

### 2. Assess usefulness for the flag
- `full` — This field directly answers the flag question in most cases.
- `partial` — This field provides signal but doesn't fully answer the question (e.g., city-level match when you need street-level).
- `none` — This field exists but is not informative for this flag.

### 3. Provide examples from the test results
Pull real examples from the `results/{endpoint-id}.yaml`:
- **good_examples** — Cases where the field clearly supported/refuted the flag.
- **partial_examples** — Cases where the field was ambiguous or incomplete.
- **not_covered_examples** — Cases where the field was missing or uninformative.

### 4. Assess geographic coverage
Based on the test results: where does this field work well and where does it break down? Map to regions (US, EU/UK, Asia, Africa, South America, etc.).

### 5. Classify automation tier
- `rule_based` — Simple deterministic rules can process this field. Example: "if RDI == 'Residential', flag." Include the rule.
- `llm_assisted` — An LLM can interpret this field with context. Example: "address is a coworking space — check if institution is listed as tenant." Describe the judgment required.
- `human_required` — This field can't be processed automatically for this flag. Describe what the human needs to do.

### 6. List false positive cases
What legitimate customers would trip this flag based on this field? For each:
- Description of the customer type.
- Why the field triggers a false flag.
- Rough estimate of frequency ("~X% of orders for a typical provider").
- Possible resolution (how a reviewer or LLM would resolve it).

### 7. Produce the flag verdict
After evaluating all fields across all endpoints for this KYC step:

- **Best endpoint combination** — Which endpoints should be used together, in what order?
- **Coverage summary** — One paragraph: where is this strong, where is it weak?
- **Automation detail** — Break down into Tier 1/2/3 with estimated fraction of orders in each tier and estimated review time.
- **Customer types that fail** — Which customer categories consistently can't be evaluated by any available endpoint? For each: estimated fraction of orders, why they fail, what the resolution path is.

## Output

Two files per KYC step:

### Structured: `tool-evaluation/assessments/{kyc-step}.yaml`

```yaml
kyc_step: a-address-to-institution
measure: M05
flag: "No public association between affiliation and shipping address"
follow_up: "Follow-up if any other flag raised"

endpoints_evaluated:
  - endpoint: ror
    fields:
      - field: addresses[].city
        description: "City where the institution is located, from ROR's curated database"
        useful_for_flag: partial
        good_examples:
          - "MIT — ROR returns 'Cambridge, MA' matching shipping address"
        partial_examples:
          - "Chinese Academy of Sciences — 100+ campuses, ROR returns Beijing HQ only"
        not_covered_examples:
          - "Genspace (community lab) — not in ROR"
        geographic_coverage: "Strong OECD, weak Africa/Central Asia. ~110K orgs globally."
        automation_tier: rule_based
        automation_notes: "If ROR city == shipping city → pass. Else → escalate."
        false_positive_cases:
          - case: "Satellite campuses"
            why: "ROR lists HQ only; researcher at satellite campus in different city"
            frequency: "~10-15% of non-US academic orders"
            resolution: "OSM campus polygon check or LLM web search"
          - case: "Recently relocated institutions"
            why: "ROR may have stale address data"
            frequency: "<1%"
            resolution: "Web search for current address"
        cost_per_call: "$0"

  - endpoint: gleif
    fields:
      - field: entity.legalAddress
        description: "Street-level registered address from the GLEIF database"
        # ... same structure

flag_verdict:
  best_endpoint_combination: "ROR (city match) + GLEIF (street for companies) + Smarty (address normalization)"
  coverage_summary: "Strong for established US/EU academic institutions. Weak for community labs, non-US small companies, recently founded orgs, coworking tenants."
  automation_tier: mostly_rule_based
  automation_detail: |
    Tier 1 (auto-pass, ~50-60%): ROR city matches shipping city, or GLEIF street matches.
    Tier 2 (LLM can judge, ~25-30%): Campus polygon, multi-campus, coworking/incubator.
    Tier 3 (human follow-up, ~10-20%): Not in any registry, different country, new entities.
  estimated_review_time:
    tier_1: "0 min (auto)"
    tier_2: "2-5 min (LLM-assisted)"
    tier_3: "10-30 min (human follow-up with customer)"
  customer_types_that_fail:
    - category: "Community bio labs / makerspaces"
      fraction_of_orders: "~1-3%"
      why_fails: "Not in ROR, GLEIF, or Companies House"
      resolution: "LLM web search fallback or voucher-based"
    - category: "Researchers at satellite campuses"
      fraction_of_orders: "~5-10%"
      why_fails: "ROR only has HQ address"
      resolution: "OSM campus polygon check"
```

### Human-readable: `tool-evaluation/assessments/{kyc-step}.md`

Narrative version of the YAML with tables, examples, and the flag verdict written in prose. This is the version a working group member would read.
