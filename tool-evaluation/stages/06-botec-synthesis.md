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

### Step 3: Compute per-KYC-step costs (split into API-only and full-workflow)

Present costs in two layers so the reader can see what's hard data vs. estimate:

#### Layer 1: API-only automation cost (hard number)

Sum the cost_per_call for all endpoints in the recommended combination. This is deterministic — it's just API pricing times call volume. Present as a single table:

```
| Step | Endpoints used | Cost/order | Monthly (1K orders) |
```

#### Layer 2: Full-workflow cost (API + LLM review + human review, with ranges)

The stage 4 assessments classify each profile group into one of five tiers: `auto`, `llm_review`, `llm_review_human_audit`, `human_review`, or `customer_follow_up`. Use these tiers to compute a three-layer cost model:

**Cost per case by tier:**
- `auto`: $0 incremental (API cost only, already in Layer 1)
- `llm_review`: ~$0.01-0.03/case (LLM inference + any Exa/web search calls). Wall-clock time ~0.5-2 min but no human cost.
- `llm_review_human_audit`: ~$0.02-0.03 LLM cost + human audits a fraction of cases. Use the `escalation_rate` from the profile group to estimate the human portion.
- `human_review`: $40/hr × estimated_time. The human does the full review.
- `customer_follow_up`: $40/hr × estimated_time. Human contacts the customer.

**Time and cost by tier (weighted):**
```
auto_fraction = Σ fractions of profile groups with time_tier=auto
llm_review_fraction = Σ fractions with time_tier=llm_review or llm_review_human_audit
human_review_fraction = Σ fractions with time_tier=human_review
follow_up_fraction = Σ fractions with time_tier=customer_follow_up
```

For `llm_review_human_audit` groups, split the fraction: `(1 - escalation_rate)` goes to LLM cost, `escalation_rate` goes to human cost.

**Monthly totals at 1,000 orders/month:**
- API cost = 1,000 × API cost per order
- LLM review cost = 1,000 × llm_review_fraction × avg_llm_cost_per_case
- Human review hours = 1,000 × human_review_fraction × avg_human_review_time / 60
- Human audit hours (from LLM escalations) = 1,000 × Σ(llm_audit_fraction × escalation_rate × audit_time) / 60
- Follow-up hours = 1,000 × follow_up_fraction × avg_follow_up_time / 60
- Total human hours = human review + human audit + follow-up
- Blended cost per order = API cost + LLM cost + (human hours × $40/hr) / 1,000

### Step 4: Cross-step rollup

An order goes through all 5 KYC steps. The same order might be auto for step (a) but human_review for step (c). For each profile group, compute the **total cost across all 5 steps**, broken down by who handles each step:

```yaml
- profile_group: "Small non-OECD biotech startup"
  per_step:
    a-address-to-institution:
      tier: human_review
      time: "10-15 min"
      cost_type: human
    b-payment-to-institution:
      tier: llm_review
      time: "1 min"
      cost_type: llm  # LLM checks fintech BIN + web-searches company
    c-email-to-affiliation:
      tier: human_review
      time: "5-10 min"
      cost_type: human  # company has no institutional email, free email, ambiguous
    d-residential-address:
      tier: llm_review
      time: "0.5 min"
      cost_type: llm  # step (a) already flagged; LLM confirms residential
    e-po-box-freight:
      tier: auto
      time: "0 min"
      cost_type: api
  total_human_time: "15-25 min"
  total_llm_cost: "$0.03"
  total_api_cost: "$0.07"
```

Then compute the **blended total across the customer mix**, separating the three cost streams:

```
total_monthly_human_hours = Σ over profile groups:
  (1,000 × fraction × human_time_minutes / 60)

total_monthly_llm_cost = Σ over profile groups:
  (1,000 × fraction × llm_cost_per_case)
```

#### Cross-step overlap adjustment

When one reviewer handles multiple KYC steps for the same order, context gained in step (a) may speed up steps (c) and (d). Present this as an **explicit assumption with a range**, not a point estimate:

- **0% overlap (parallel queues):** Different reviewers handle each step independently. No context sharing. Use this as the upper bound on human time.
- **15-25% overlap (sequential single reviewer):** One person does all 5 steps for an order. Estimated based on shared signals (ROR lookup serves both address and email verification). Use this as the lower bound.
- **Present the final cost as a range:** "$X/order (parallel queues) to $Y/order (single-reviewer sequential)"

#### Workflow simulation (ground-truth check)

After computing the estimates above, validate them with a walkthrough of 15-20 real cases:

1. Select 15-20 orders from `customers.csv` spanning PG-01 through PG-11 (at least 1 per profile group)
2. For each order, trace through the 5-step decision logic using existing stage 3 results — which endpoints fire, what they return, what the reviewer would need to do
3. For non-auto-pass cases, estimate the actual review workflow step by step (what would the reviewer look at, in what order, how long each lookup would take)
4. Compare the simulated times against the profile group time estimates from stage 4
5. Compute the actual overlap between steps — did step (a) investigation genuinely speed up step (c) for the same order?
6. Report any cases where the simulated time diverged significantly from the profile group estimate, and adjust the estimates if warranted

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

**5d. Automation frontier:**
Summarize what fraction of the total review workload falls into each tier, and what the cost picture looks like with vs. without LLM delegation:

1. **Current state (human-only):** All non-auto cases handled by human reviewers. Total human hours/month and blended cost/order.
2. **With LLM delegation:** `llm_review` and `llm_review_human_audit` cases handled by LLM agents. Total human hours/month, total LLM cost/month, and blended cost/order.
3. **Delta:** How much human time and cost are saved, and what remains human-only.

For each profile group that is `llm_review` or `llm_review_human_audit`, briefly note what would need to be validated before deploying this in production — e.g., accuracy benchmarks on a held-out set, compliance review of LLM-in-the-loop for export control, etc. The goal is to show the working group the automation opportunity and what stands between the current state and realizing it.

## Constraints

- **Ground every estimate in stage 3 test results.** When you say "established US academic → auto," cite the specific test cases that demonstrate this. Reference per-endpoint result files.
- **Don't invent coverage data.** If stage 3 didn't test a sub-category, say "insufficient data" and give a range.
- **Show the math.** The reader should be able to trace any number back to the profile groups and fractions that produced it.
- **Tag every fraction estimate with its source.** `[market data]` for published numbers, `[judgment]` for our estimates, `[insufficient data]` for ranges where we're guessing.
- **Use $40/hour** as the fully-loaded cost of a customer representative.

## Output

Write to `tool-evaluation/06-cost-coverage-synthesis.md`:

The document should be organized as:

1. **Profile group inventory** — the unified list across all KYC steps, with each group's tier (auto / llm_review / llm_review_human_audit / human_review / customer_follow_up)
2. **Fraction estimates** — the tree breakdown with sources tagged (`[market data]` / `[judgment]` / `[insufficient data]`)
3. **API-only automation cost** — hard numbers: API fees per order and monthly, deterministic
4. **Full-workflow cost tables** — three cost streams (API + LLM + human) by tier, monthly totals, presented as range reflecting overlap assumption
5. **Cross-step rollup** — per profile group: which steps are auto/LLM/human, total human time, total LLM cost, blended monthly cost, overlap range
6. **Workflow simulation results** — 15-20 case walkthroughs validating the estimates
7. **Cost drivers and tail risk** — which profile groups dominate cost, where averages are misleading, what scenarios could drastically increase costs
8. **Provider archetypes** — cost computed for 2-3 different customer mix scenarios
9. **Automation frontier** — side-by-side comparison of human-only vs. LLM-delegated cost, with notes on what needs validation before deployment
10. **Key findings** — which profile groups drive the most cost, which KYC steps are most expensive, where the biggest uncertainties are
