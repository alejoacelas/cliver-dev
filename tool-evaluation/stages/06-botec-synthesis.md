# Stage 6 — BOTEC cost & coverage synthesis

**Scope:** One dedicated agent. Sequential.  
**Goal:** Quantitative estimates using predefined rules applied to qualitative findings from stages 3-5.  
**Depends on:** Stage 5 (need the revised assessments).

## Inputs

- All revised assessments: `tool-evaluation/assessments/{kyc-step}.yaml` (5 files, post-adversarial-review).
- The endpoint manifest: `tool-evaluation/00-endpoint-manifest.yaml` (for cost-per-call data).

## Provider archetypes

Use these predefined customer mix distributions. Each archetype represents a different type of DNA synthesis provider:

### US academic-heavy
Typical US-based provider serving mostly domestic universities.
- 70% US university researchers
- 15% US biotech companies
- 10% international academic
- 5% other (government, independent, community lab)

### Global pharma
Large provider with international pharma/biotech customer base.
- 40% US/EU pharma companies
- 30% international pharma companies
- 20% academic (mixed US and international)
- 10% CRO / startup / other

### Mixed biotech
Mid-size provider with diverse startup and academic mix.
- 40% biotech startup
- 25% academic (mixed)
- 20% pharma
- 15% international (varied)

### Small provider
Small or regional provider with mostly local customers.
- 50% local academic
- 30% small biotech
- 20% varied (independent researchers, community labs, international)

## Task

### For each provider archetype × each KYC step:

**1. Estimate tier distribution**

Using the `automation_detail` from the stage 4 assessment and the `customer_types_that_fail` list, estimate what fraction of this provider archetype's orders would fall into each tier:

- **Tier 1 (auto-pass):** No flag raised. No human time.
- **Tier 2 (LLM-assisted):** Flag raised but an LLM can resolve it with available data.
- **Tier 3 (human follow-up):** Flag raised and a human must follow up with the customer.

Show your work: which customer categories in the archetype map to which tier, and what fraction of orders they represent.

**2. Estimate review time per tier**

Use the `estimated_review_time` from the assessment. Adjust if the adversarial review challenged these estimates.

- Tier 1: 0 minutes
- Tier 2: [from assessment] minutes average
- Tier 3: [from assessment] minutes average

**3. Estimate API cost per order**

Sum the `cost_per_call` for all endpoints in the `best_endpoint_combination` for this KYC step. This is the marginal API cost per order.

For endpoints with free tiers, note the ceiling (e.g., "free for first 250 orders/month, then $X/call").

**4. Estimate monthly totals at 1,000 orders/month**

- Total API cost = 1,000 × cost per order
- Total human review hours = (1,000 × tier_2_fraction × tier_2_time + 1,000 × tier_3_fraction × tier_3_time) / 60
- Blended cost per order = API cost + (human review hours × assumed hourly rate)

Use **$40/hour** as the assumed fully-loaded cost of a customer representative.

### Cross-KYC-step rollup

After computing per-step estimates, produce a combined view:

- Total API cost per order if all 5 KYC steps are run.
- Total human review hours per month if all 5 steps are run (noting that the *same* order might trigger review on multiple steps, but probably not — estimate overlap).
- Which KYC step is the most expensive in human time? Which is cheapest?
- Which provider archetype has the highest total cost? Which has the lowest?

## Constraints

- **Do NOT invent coverage data.** Only use the fractions and categories from the stage 4 assessments.
- If a fraction is marked as "insufficient data" in the assessment, propagate that uncertainty — give a range, not a point estimate.
- Be explicit about which numbers are from test results vs. extrapolated from archetype distributions.

## Output

Write to `tool-evaluation/06-cost-coverage-synthesis.md`:

```markdown
# BOTEC: Cost & coverage synthesis

## Per KYC step × per provider archetype

### (a) Address → institution (M05)

| Provider archetype | Tier 1 (auto) | Tier 2 (LLM) | Tier 3 (human) | API cost/order | Human hrs/mo (1K orders) |
|---|---|---|---|---|---|
| US academic-heavy | ~65% | ~25% | ~10% | $0.00 | ~25h |
| Global pharma | ~55% | ~25% | ~20% | $0.00 | ~42h |
| Mixed biotech | ~50% | ~30% | ~20% | $0.00 | ~45h |
| Small provider | ~60% | ~25% | ~15% | $0.00 | ~33h |

**Derivation:**
- US academic-heavy: 70% US university → mostly Tier 1 (ROR covers well)...
- ...

### (b) Payment → institution (M12 + M10)
... [same format]

## Cross-step rollup

### Total cost per order (all 5 steps)
| Provider archetype | API cost | Avg human time | Blended cost/order |
|---|---|---|---|
| US academic-heavy | $X.XX | X min | $X.XX |
| ...

### Most expensive step by human time
...

### Key findings
- [Finding 1]
- [Finding 2]
```
