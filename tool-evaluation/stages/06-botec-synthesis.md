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

- All stage 3 results: `tool-evaluation/results/{endpoint-slug}.yaml` — the individual test cases and their outcomes, per endpoint.
- All stage 4 assessments: `tool-evaluation/assessments/{kyc-step}.yaml` — the profile groups with time tiers and resolution paths.
- The endpoint manifest: `tool-evaluation/00-endpoint-manifest.yaml` — cost per call.
- Published market data on DNA synthesis customer segments (see step 2 below).

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

For each profile group, estimate what fraction of a provider's orders would fall into it. **Be transparent that we don't have ground-truth order data** — these are desk-research estimates, and the final cost depends heavily on a provider's actual customer mix.

**Sources and their limitations:**

1. **Published market data** — Annual reports, investor presentations, and market research from major providers (Twist, IDT/Danaher, GenScript) and industry reports (Grand View Research, etc.). Use these for the **top-level split** (academic vs. industry vs. government vs. other). These are the most defensible numbers we have.
2. **Common knowledge about the market** — Most DNA synthesis revenue comes from US/EU academic and pharma customers. Community bio labs are a tiny fraction. Chinese academic is significant but provider-dependent.
3. **Stage 3 test results** — useful for understanding which sub-categories *exist* and how they behave, but NOT for estimating their prevalence. The test set is adversarially biased toward hard cases.

**Do not use** `customers.csv` for fraction estimation — it was constructed for test case sourcing, not as a representative sample. Its distribution (overweights sanctioned institutions, non-OECD countries, controlled agent academia) does not reflect any real provider's order mix.

**Show the fraction breakdown at multiple levels of granularity.** Use published market data for the top level, and be explicit about which sub-splits are data-backed vs. judgment calls:

```
Academic (estimated [X]% of orders — source: [market report])
  ├── US academic, in ROR, city match ([Y]% of all orders) → auto [judgment split]
  ├── EU/UK academic, in ROR, city match ([Y]% of all orders) → auto [judgment split]
  ├── Non-OECD academic, in ROR, city mismatch ([Y]%) → investigation [judgment split]
  └── ...

Industry (estimated [X]% of orders — source: [market report])
  ├── ...
```

Tag each number as `[market data]`, `[judgment]`, or `[insufficient data — range]`.

**Reference market data for the top-level split** (gene synthesis-only, by revenue):

| Segment | Share (range) | Sources |
|---|---|---|
| Academic & government | 50-55% | Precedence Research (~56%), Allied Market Research (~54%), Mordor Intelligence (~30-35% — lower because they weight biopharma higher) |
| Pharma & biotech | 35-40% | Mordor Intelligence (45.7% including CROs), Precedence Research (remainder after academic) |
| CROs / CDMOs | 5-10% | Mordor Intelligence (fastest-growing segment, ~17% CAGR), Allied Market Research |
| Other (ag, industrial, community) | 2-5% | Twist 10-K: food/ag = 1% of revenue |

*Geographic:* North America ~40%, Europe ~30%, Asia-Pacific ~25%, Rest of world ~5%.

*Note:* By order count, academic share is likely *higher* than by revenue (academic orders tend to be smaller). The sub-splits below the top level are judgment calls — tag them clearly.

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

### Step 5: Cost drivers and tail risk analysis

This is the most important analytical section. The goal is to help a reader understand **what could make screening unexpectedly expensive** — not just the average cost.

**5a. Cost driver identification:**
For each KYC step, identify the 2-3 profile groups that dominate the cost. Show what fraction of the total human hours come from each. Usually a small number of profile groups drive most of the cost (e.g., community bio labs might be 2% of orders but 15% of the human hours).

**5b. Tail risk analysis:**
For each KYC step, identify scenarios where the average cost figure is misleading:
- A step might average 2 min/order but have a 5% tail at 30+ min (e.g., community bio lab requiring biosafety verification)
- A step might have near-zero cost for most providers but become the dominant cost for a provider with an unusual customer mix (e.g., a provider selling to many Chinese academics will have a much higher step (c) cost due to free email domains)
- Flag any step where there's a plausible scenario that could **drastically** increase the cost — even if that scenario is unlikely for a "typical" provider

**5c. Sensitivity to customer mix:**
Rather than showing 2x sensitivity on individual groups, present 2-3 provider archetypes and compute costs for each:
- "US academic-heavy provider" (70% US academic, 20% US pharma, 10% other)
- "Global biotech-heavy provider" (30% academic, 50% biotech/pharma, 10% CRO, 10% other)
- "Provider with significant Chinese academic customer base" (40% OECD academic, 25% Chinese academic, 20% pharma, 15% other)

This lets readers see which archetype is closest to their situation rather than trying to do the math themselves.

## Constraints

- **Ground every estimate in stage 3 test results.** When you say "established US academic → auto," cite the specific test cases that demonstrate this. Reference per-endpoint result files.
- **Don't invent coverage data.** If stage 3 didn't test a sub-category, say "insufficient data" and give a range.
- **Show the math.** The reader should be able to trace any number back to the profile groups and fractions that produced it.
- **Tag every fraction estimate with its source.** `[market data]` for published numbers, `[judgment]` for our estimates, `[insufficient data]` for ranges where we're guessing.
- **Use $40/hour** as the fully-loaded cost of a customer representative.

## Output

Write to `tool-evaluation/06-cost-coverage-synthesis.md`:

The document should be organized as:

1. **Profile group inventory** — the unified list across all KYC steps
2. **Fraction estimates** — the tree breakdown with sources tagged (`[market data]` / `[judgment]` / `[insufficient data]`)
3. **Per-KYC-step cost tables** — API cost, human time by tier, monthly totals
4. **Cross-step rollup** — per profile group total time, blended monthly cost
5. **Cost drivers and tail risk** — which profile groups dominate cost, where averages are misleading, what scenarios could drastically increase costs
6. **Provider archetypes** — cost computed for 2-3 different customer mix scenarios
7. **Key findings** — which profile groups drive the most cost, which KYC steps are most expensive, where the biggest uncertainties are
