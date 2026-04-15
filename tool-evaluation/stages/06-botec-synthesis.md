# Stage 6 — BOTEC cost & coverage synthesis

**Scope:** One dedicated agent. Sequential.  
**Goal:** Granular cost estimation by walking through the actual test cases from stage 3, using the profile groups from stage 4, and computing fraction-of-fraction coverage and time costs.  
**Depends on:** Stage 4 (profile groups and field assessments) and stage 3 (individual test case results).

## What makes this different from a typical BOTEC

This stage does NOT apply broad category labels ("70% of orders are US academic → auto-pass"). Instead, it:

1. **Reads individual test cases** from stage 3 and their outcomes.
2. **Uses the profile groups** from stage 4, which are already split at meaningful joints (not "all industry customers" but "large US pharma" vs. "small non-US biotech startup").
3. **Distinguishes within categories** — if some industry customers from some countries won't be covered, that should show up as a separate line item, not get averaged away.

The goal is to produce an estimate granular enough that a provider can look at their own customer mix and compute their expected cost, rather than being told "it costs $X for a typical provider."

## Inputs

- All stage 3 results: `tool-evaluation/results/{group-name}.yaml` — the individual test cases and their outcomes.
- All stage 4 assessments: `tool-evaluation/assessments/{kyc-step}.yaml` — the profile groups with time tiers and resolution paths.
- The endpoint manifest: `tool-evaluation/00-endpoint-manifest.yaml` — cost per call.
- The customer dataset: `tool-evaluation/customers.csv` — for understanding the distribution of customer types in a real dataset.

## Task

### Step 1: Build the profile group inventory

Across all 5 KYC steps, collect every profile group from the stage 4 assessments. Many will overlap across steps (e.g., "established US academic" appears in address, email, and residential checks).

Create a unified profile group inventory:

```yaml
profile_groups:
  - id: pg-01
    name: "Established US/EU academic"
    description: "Major university or research institute. In ROR, has .edu domain."
    kyc_steps:
      a-address-to-institution:
        time_tier: auto
        estimated_time: "0 min"
      c-email-to-affiliation:
        time_tier: auto
        estimated_time: "0 min"
      d-residential-address:
        time_tier: quick_review
        estimated_time: "1 min (shipping to campus → auto; shipping to residential → quick check)"
    distinguishing_factors:
      country: [US, EU, UK, AU, JP, KR, SG, IL]
      institution_type: academic
      institution_size: "in ROR (covers ~110K orgs)"
      entity_age: any

  - id: pg-02
    name: "Small non-OECD biotech startup (< 2 years old)"
    description: "Recently founded biotech company in a non-OECD country. Not in ROR or GLEIF. May be in OpenCorporates."
    kyc_steps:
      a-address-to-institution:
        time_tier: investigation
        estimated_time: "10-15 min"
      b-payment-to-institution:
        time_tier: investigation
        estimated_time: "5-10 min"
      c-email-to-affiliation:
        time_tier: investigation
        estimated_time: "5-10 min"
    distinguishing_factors:
      country: non-OECD
      institution_type: biotech_startup
      institution_size: small
      entity_age: "< 2 years"
```

### Step 2: Estimate the real-world fraction of each profile group

For each profile group, estimate what fraction of a provider's orders would fall into it. Use multiple sources:

1. **The customers.csv dataset** — What fraction of the 535 records matches each profile group? This dataset is biased (from patent/publication data) but gives a starting point.
2. **The stage 3 test results** — What fraction of test cases fell into each profile group? (This is adversarially biased — more hard cases than a real order mix — so weight it appropriately.)
3. **Archive estimates** — The previous pipeline's `06-coverage.md` and `ASSESSMENT.md` files have BOTEC estimates of customer mix.
4. **Common sense** — Most DNA synthesis orders come from US/EU academic and pharma. Community bio labs are <5% of the market.

**Critical: show the fraction breakdown at multiple levels of granularity.** Not just "50% academic, 30% industry" but:

```
Academic (estimated 55% of orders)
  ├── US academic, in ROR, city match (35% of all orders) → auto
  ├── EU/UK academic, in ROR, city match (10% of all orders) → auto
  ├── Non-OECD academic, in ROR, city mismatch (5% of all orders) → investigation
  ├── Non-OECD academic, NOT in ROR (3% of all orders) → customer follow-up
  └── Academic at satellite campus (2% of all orders) → quick review

Industry (estimated 30% of orders)
  ├── Large US/EU pharma, in GLEIF (15% of all orders) → auto
  ├── Mid-size US/EU biotech, in OpenCorporates (8% of all orders) → quick review
  ├── Small non-US biotech, < 2 years old (4% of all orders) → investigation
  └── CRO/contract lab (3% of all orders) → quick review

Other (estimated 15% of orders)
  ├── Government lab (5% of all orders) → quick review
  ├── Community bio lab / makerspace (2% of all orders) → customer follow-up
  ├── Independent researcher (3% of all orders) → customer follow-up
  └── Virtual office / coworking tenant (5% of all orders) → investigation
```

### Step 3: Compute per-KYC-step costs

For each KYC step, compute:

**API cost per order:**
Sum the cost_per_call for all endpoints in the recommended combination. Most are free; note the paid ones (Smarty, Google Places) and their impact.

**Human time per order (weighted average):**
```
avg_time = Σ (profile_group_fraction × estimated_time_for_this_step)
```

**Human time by tier:**
```
auto_fraction = Σ fractions of profile groups with time_tier=auto
quick_review_fraction = Σ fractions with time_tier=quick_review
investigation_fraction = Σ fractions with time_tier=investigation
follow_up_fraction = Σ fractions with time_tier=customer_follow_up
```

**Monthly totals at 1,000 orders/month:**
- API cost = 1,000 × API cost per order
- Quick review hours = 1,000 × quick_review_fraction × avg_quick_review_time / 60
- Investigation hours = 1,000 × investigation_fraction × avg_investigation_time / 60
- Follow-up hours = 1,000 × follow_up_fraction × avg_follow_up_time / 60
- Total human hours = sum of above
- Blended cost per order = API cost + (human hours × $40/hr) / 1,000

### Step 4: Cross-step rollup

An order goes through all 5 KYC steps. The same order might be auto for step (a) but investigation for step (c). For each profile group, compute the **total time across all 5 steps:**

```yaml
- profile_group: "Small non-OECD biotech startup"
  per_step_time:
    a-address-to-institution: "10-15 min (investigation)"
    b-payment-to-institution: "5-10 min (investigation)"
    c-email-to-affiliation: "5-10 min (investigation)"
    d-residential-address: "1-3 min (quick review)"
    e-po-box-freight: "0 min (auto — PO box regex + country check)"
  total_time: "21-38 min"
  total_api_cost: "$0.07"
```

Then compute the **blended total across the customer mix:**

```
total_monthly_human_hours = Σ over profile groups:
  (1,000 × fraction × total_time_minutes / 60)
```

### Step 5: Sensitivity analysis

The fraction estimates are uncertain. For the top 5 most time-consuming profile groups, show what happens if the fraction is 2x higher or 2x lower:

```
If "community bio lab" is 2% of orders: 6.7 human hours/month for this group
If "community bio lab" is 4% of orders: 13.3 human hours/month for this group
```

This helps providers assess whether the cost matters for their specific customer mix.

## Constraints

- **Ground every estimate in stage 3 test results.** When you say "established US academic → auto," cite the specific test cases that demonstrate this.
- **Don't invent coverage data.** If stage 3 didn't test a sub-category, say "insufficient data" and give a range.
- **Show the math.** The reader should be able to trace any number back to the profile groups and fractions that produced it.
- **Use $40/hour** as the fully-loaded cost of a customer representative.

## Output

Write to `tool-evaluation/06-cost-coverage-synthesis.md`:

The document should be organized as:

1. **Profile group inventory** — the unified list across all KYC steps
2. **Fraction estimates** — the tree breakdown with evidence
3. **Per-KYC-step cost tables** — API cost, human time by tier, monthly totals
4. **Cross-step rollup** — per profile group total time, blended monthly cost
5. **Sensitivity analysis** — what changes if fractions shift
6. **Key findings** — which profile groups drive the most cost, which KYC steps are most expensive, where the biggest uncertainties are
