# Stage 4 — Field-level assessment & flag mapping

**Scope:** One sub-agent per KYC step (5 agents in parallel).  
**Goal:** Synthesize per-endpoint test results into per-field assessments for each KYC flag, then identify customer profile groups and estimate the human time cost for each.  
**Depends on:** Stages 3 and 5 — stage 4 starts only after the stage 3↔5 loop completes for all endpoint groups. Reads the final (expanded) stage 3 results and the adversarial review finals from stage 5.

## Per-agent inputs

- All `results/{endpoint-slug}.yaml` files for endpoints relevant to this KYC step (from `01-endpoint-map.md`), plus the `results/{group-name}-comparison.md` cross-comparison files.
- The KYC step definition (flag triggers, follow-up actions from the CSSWG table in `run.md`).
- Measure definitions from `archive-2026-04-kyc-research/pipeline/measures.md`.
- The original `07-synthesis.md` files for relevant ideas (for context on intended use of each field).
- Adversarial review finals: `tool-evaluation/adversarial-reviews/{group-name}-final.md` (one per endpoint group — contains any unresolved high- or medium-severity findings from the stage 3↔5 loop).

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

This is the core output for cost estimation. Do not classify individual fields (e.g., "this field is auto-resolvable") — that's too abstract to be useful. Instead, identify **customer profile groups**: clusters of customers who will have a similar resolution path and time cost when this KYC flag is evaluated. The time tier is a property of the profile group (which depends on multiple fields and endpoints together), not of any single field.

### How to identify profile groups

Look at the stage 3 test results. Group the test cases by how long it would take a human to resolve the flag for that case. Cases that would take similar time and involve similar work should be in the same profile group.

The groups should emerge from the data — don't force them into predefined categories. But expect something like:

**Time-based tiers:**
- **Auto (0 min):** Deterministic rule resolves it. No human or LLM sees it.
- **LLM review (0.5-2 min):** An LLM agent with web search + API access runs a prescribed procedure and makes a pass/escalate decision. No human sees the case unless the LLM escalates. Use this tier when the resolution path is fully procedural — a sequence of API calls and web lookups with a binary pass/fail rule at the end. Cost: ~$0.01-0.03/case in inference.
- **LLM review + human audit:** The LLM runs the structured portion, but a human reviews the LLM's output for a subset of cases (e.g., compliance-sensitive decisions, soft thresholds). Use this when the procedure is automatable but the final call has liability or judgment implications.
- **Human review (1-15 min):** A human reviewer handles the case. No customer contact. Use this when the resolution path requires subjective judgment that can't be reduced to a procedure, or when the evidence is genuinely ambiguous.
- **Customer follow-up (15-60 min):** Human must contact the customer and wait for a response.

But within each tier, there will be sub-groups. For example, "LLM review" might include:
- Multi-campus university with city mismatch → 0.5 min (LLM web-searches "[institution] [city] campus", confirms satellite)
- Mid-size biotech not in ROR → 0.5 min (LLM web-searches company name, confirms website + LinkedIn exist)

And "human review" might include:
- Small biotech with minimal web presence → 10 min (evidence is ambiguous, human judges credibility)
- Prepaid card investigation → 7 min (human checks whether corporate virtual card vs. gift card)

These sub-groups are the profile groups.

**How to decide between LLM review and human review:** Write out the resolution path step by step. If every step is either (a) an API call with a deterministic interpretation, or (b) a web search where the pass/fail rule can be stated in one sentence, the group is `llm_review`. If any step requires weighing ambiguous evidence, applying a subjective threshold ("is this company real enough?"), or contacting the customer, it's `human_review` or `customer_follow_up`.

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
  time_tier: llm_review
  estimated_time: "0.5 min"
  resolution_path: "ROR returns the institution but city doesn't match. LLM agent: (1) web search '[institution] [shipping city] campus', (2) check geographic proximity. If campus confirmed or cities within 50km → pass. If no evidence → escalate to human."
  escalation_rate: "~10% (rare — most mismatches are real satellite campuses)"
  fraction_of_test_cases: "4/38 (11%)"
  examples_from_tests:
    - "Chinese Academy of Sciences, Wuhan campus (case 14): ROR returns Beijing. Web search 'CAS Wuhan' confirms Wuhan Institute of Virology. LLM resolves in seconds."
    - "University of Cape Town, Stellenbosch satellite (case 19): ROR returns Cape Town. Stellenbosch is 50km away. Geocode check passes."
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
    time_tier: auto          # auto | llm_review | llm_review_human_audit | human_review | customer_follow_up
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
    time_tier: llm_review
    estimated_time: "0.5 min"
    resolution_path: "LLM web-searches '[institution] [shipping city] campus', checks proximity. Pass if confirmed, escalate if not."
    escalation_rate: "~10%"  # fraction of cases where LLM escalates to human
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
