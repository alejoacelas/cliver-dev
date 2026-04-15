# Stage 4 — Field-level assessment & flag mapping

**Scope:** One sub-agent per KYC step (5 agents in parallel).  
**Goal:** Synthesize per-endpoint test results into per-field assessments for each KYC flag, then identify customer profile groups and estimate the human time cost for each.  
**Depends on:** Stage 3 (adversarial testing results, including any expansions from the stage 5 loop).

## Per-agent inputs

- All `results/{group-name}.yaml` files for endpoint groups relevant to this KYC step (from `01-endpoint-map.md`).
- The KYC step definition (flag triggers, follow-up actions from the CSSWG table in `run.md`).
- Measure definitions from `archive-2026-04-kyc-research/pipeline/measures.md`.
- The original `07-synthesis.md` files for relevant ideas (for context on intended use of each field).
- Any adversarial review finals: `adversarial-reviews/{group-name}-final.md` (for unresolved findings).

## Agent assignments

| Agent | KYC step | Measure | Flag |
|---|---|---|---|
| 1 | a-address-to-institution | M05 | No public association between affiliation and shipping address |
| 2 | b-payment-to-institution | M12 (+M10) | Billing address not associated with the institution; gift card BIN |
| 3 | c-email-to-affiliation | M02 (+M07) | Does not match institution domain / non-institutional domain |
| 4 | d-residential-address | M04 | Residential address |
| 5 | e-po-box-freight | M03 (+M06) | P.O. Box; freight forwarder address |

## Part 1: Field assessment

For each endpoint relevant to your KYC step, for each field in that endpoint's response that could inform the flag:

### 1. Describe the field
One sentence: what does this field tell you? Where does the data come from?

### 2. Assess usefulness for the flag
- `full` — This field directly answers the flag question in most cases.
- `partial` — This field provides signal but doesn't fully answer the question.
- `none` — This field is not informative for this flag.

### 3. Provide examples from the test results
Pull real examples from the stage 3 results:
- **good_examples** — Cases where the field clearly supported/refuted the flag.
- **partial_examples** — Cases where the field was ambiguous or incomplete.
- **not_covered_examples** — Cases where the field was missing or uninformative.

### 4. Assess geographic coverage
Based on the test results: where does this field work well and where does it break down?

### 5. Produce the flag verdict
After evaluating all fields across all endpoints:
- **Best endpoint combination** — Which endpoints should be used together, in what order?
- **Coverage summary** — Where is this strong, where is it weak?

## Part 2: Customer profile groups and resolution time

This is the core output for cost estimation. **Do not classify fields by automation tier.** Instead, identify **customer profile groups** — clusters of customers who will have a similar experience when this KYC flag is evaluated.

### How to identify profile groups

Look at the stage 3 test results. Group the test cases by how long it would take a human to resolve the flag for that case. Cases that would take similar time and involve similar work should be in the same profile group.

The groups should emerge from the data — don't force them into predefined categories. But expect something like:

**Time-based tiers:**
- **Auto (0 min):** Deterministic rule resolves it. No human sees it.
- **Quick review (1-3 min):** Human glances at the flag + context, makes a call. No customer contact.
- **Investigation (5-15 min):** Human needs to dig — cross-reference sources, search the web. No customer contact.
- **Customer follow-up (15-60 min):** Human must contact the customer and wait for a response.

But within each tier, there will be sub-groups. For example, "quick review" might include:
- Large US pharma company where the billing address is a known HQ → 1 min (look it up, confirm, pass)
- Small non-US biotech at a coworking address → 3 min (check if the company is a tenant, check incorporation date)

These sub-groups are the profile groups.

### What each profile group needs

For each profile group, document:

```yaml
- group: "Established US/EU academic institution"
  description: "Large university or research institute in the US or EU. In ROR, has .edu domain, well-known."
  time_tier: auto
  estimated_time: "0 min"
  resolution_path: "ROR city match + domain match → auto-pass. No human involvement."
  fraction_of_test_cases: "18/38 (47%)"
  examples_from_tests:
    - "MIT (case 1): ROR city match, domain match → auto-pass"
    - "University of Oxford (case 3): same"
  what_they_share: "In ROR, .edu or .ac.uk domain, ROR city matches shipping address"

- group: "Non-OECD academic, in ROR but city mismatch"
  description: "University in Africa/Asia/South America that is in ROR but the shipping address city doesn't match the ROR city (satellite campus, collaborator address, etc.)"
  time_tier: investigation
  estimated_time: "5-10 min"
  resolution_path: "ROR returns the institution but city doesn't match. Reviewer checks: (1) Does the institution have multiple campuses? (2) Is the shipping city near the ROR city? (3) Web search for institution + shipping city."
  fraction_of_test_cases: "4/38 (11%)"
  examples_from_tests:
    - "Chinese Academy of Sciences, Wuhan campus (case 14): ROR returns Beijing. Reviewer would need to check if CAS has a Wuhan campus."
    - "University of Cape Town, Stellenbosch satellite (case 19): ROR returns Cape Town. Shipping was Stellenbosch (30km away)."
  what_they_share: "Institution exists in registries but address doesn't match due to multi-campus or collaborator shipping"

- group: "Community bio lab / makerspace"
  description: "Small community lab not in any institutional registry. Often at a shared or residential address."
  time_tier: customer_follow_up
  estimated_time: "15-30 min"
  resolution_path: "No registry match. Reviewer must: (1) Web search for the entity, (2) Check if it's a known community lab, (3) If unclear, email the customer asking about institutional affiliation and biosafety setup."
  fraction_of_test_cases: "5/38 (13%)"
  examples_from_tests:
    - "Genspace (case 12): Not in any registry. Reviewer would need to search and find it's a known Brooklyn community lab."
    - "Open Science Network (case 22): Not in any registry, very minimal web presence."
  what_they_share: "Not in ROR/GLEIF/Companies House/OpenCorporates. Often at non-institutional addresses."
```

### Important: granularity within categories

Do NOT assume all customers of a type behave the same. For example:
- "Industry customers" is too broad. Large pharma (Pfizer) will auto-pass. Small biotech startups won't.
- "International academic" is too broad. Major international universities (University of Tokyo) will be in ROR. Small new universities in sub-Saharan Africa may not be.
- The profile groups should split wherever the resolution path or time differs meaningfully.

Use the actual test cases from stage 3 to justify the splits. If 3 industry customers in the test set had very different outcomes, they should be in different profile groups.

### Country-specific and size-specific distinctions

Flag cases where coverage depends on:
- Country or region (US vs. EU vs. non-OECD)
- Institution size (top-100 university vs. small regional college)
- Company size (publicly traded vs. 2-person startup)
- Entity age (established vs. founded in the last 2 years)

These distinctions feed directly into stage 6's cost estimation.

## Output

Two files per KYC step:

### Structured: `tool-evaluation/assessments/{kyc-step}.yaml`

```yaml
kyc_step: a-address-to-institution
measure: M05
flag: "No public association between affiliation and shipping address"
follow_up: "Follow-up if any other flag raised"

field_assessments:
  - endpoint: ror
    fields:
      - field: addresses[].city
        description: "City where the institution is located"
        useful_for_flag: partial
        good_examples: [...]
        partial_examples: [...]
        not_covered_examples: [...]
        geographic_coverage: "Strong OECD, weak Africa/Central Asia"
        cost_per_call: "$0"
  # ... all endpoints and fields

flag_verdict:
  best_endpoint_combination: "ROR + GLEIF + Companies House + OpenCorporates + Smarty"
  coverage_summary: "..."

profile_groups:
  - group: "Established US/EU academic institution"
    description: "..."
    time_tier: auto          # auto | quick_review | investigation | customer_follow_up
    estimated_time: "0 min"
    resolution_path: "..."
    fraction_of_test_cases: "18/38 (47%)"
    examples_from_tests: [...]
    what_they_share: "..."
    distinguishing_factors:
      - country: "US, EU, UK, AU, JP"
      - institution_size: "any (as long as in ROR)"
      - entity_age: "any (as long as in ROR)"

  - group: "Non-OECD academic, in ROR but city mismatch"
    description: "..."
    time_tier: investigation
    estimated_time: "5-10 min"
    resolution_path: "..."
    fraction_of_test_cases: "4/38 (11%)"
    examples_from_tests: [...]
    what_they_share: "..."
    distinguishing_factors:
      - country: "non-OECD"
      - institution_size: "medium to large (small ones not in ROR)"
      - entity_age: "established"

  # ... more profile groups

unresolved_issues:
  - "3 high-severity findings from adversarial review remain unresolved after 3 iterations: [list]"
```

### Human-readable: `tool-evaluation/assessments/{kyc-step}.md`

Narrative version with tables, examples, and the profile group descriptions. This is what a working group member would read.
