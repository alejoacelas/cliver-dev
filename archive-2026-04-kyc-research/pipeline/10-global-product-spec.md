# Stage 10: Global product spec

Assembles the per-measure winners into a single recommended screening product that synthesis providers can adopt or that a third party can offer as a service.

## Agent setup

- **One agent.** Web search disabled. Sequential after stage 9.
- **Context provided:**
  - All `outputs/08-product-measure-{NN}.md` files (per-measure selections)
  - All `outputs/09-measure-{NN}-synthesis.md` files (per-measure coverage/bypass analysis)
  - `measures.md`

## Prompt

```
You are producing the global product spec — the final deliverable that describes a complete customer screening product for DNA synthesis providers.

**Inputs:**
- All stage 8 selections: `outputs/08-product-measure-{NN}.md` for each measure.
- All stage 9 syntheses: `outputs/09-measure-{NN}-synthesis.md` for each measure.
- Measure descriptions: `measures.md`

**Your task:**

Design the product as if you are writing a spec for an engineering team that will build a screening platform. The audience is also policymakers who need to see that these measures are concretely implementable and what they cost.

### 1. Check inventory

A table listing every selected check across all measures:
- Check name and idea slug
- Which measure(s) it serves (some checks may serve multiple measures via cross-references)
- Data source / API
- Input required from the customer or provider
- Output returned
- Marginal cost per check

### 2. Shared infrastructure

Identify where multiple checks use the same underlying API or data source. Consolidate these into a single integration. For example, if five checks query ROR, that is one ROR integration used by five checks — not five separate integrations.

List each shared integration with:
- Which checks use it
- API endpoint, auth model, rate limits (from the stage 7 syntheses)
- Whether it's free, paid, or vendor-gated

### 3. Integration architecture

Group the checks by when they run in the provider's workflow:
- **At account creation** (one-time checks on the customer entity)
- **At order submission** (per-order checks)
- **Periodic re-screening** (ongoing monitoring)

For each group:
- What runs in parallel vs. sequentially
- Where human review decision points sit
- What the combined decision logic looks like (e.g., "if any check flags, route to review queue; if sanctions check flags, block immediately")

### 4. Cost estimate

- Per-order cost: sum of marginal costs for checks that run per order.
- Per-customer cost: one-time checks at account creation.
- Ongoing costs: periodic re-screening frequency and cost.
- Note any checks that are free (public APIs) vs. paid (vendor contracts).

### 5. What this bundle does NOT cover

Pull from the stage 9 structural gap findings across all measures:
- Coverage gaps that are structural to the selected checks (customer profiles that slip through).
- Attacker stories that survive the entire bundle.
- Measures where the selected stack is weak or where no good pluggable option exists.

This section is critical — it tells policymakers what remains unsolved.

**Output:** `outputs/10-bundle-spec.md`.
```
