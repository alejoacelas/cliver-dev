# Running the pipeline — DNA customer screening implementation ideas

This document tells a new Claude Code session how to execute the implementation-ideas research pipeline. Read this before starting.

## What this pipeline produces

A library of **concrete implementation ideas** for automated checks that DNA synthesis providers could use to catch malicious customers. Each idea is granular (one data source / vendor / SOP per idea) and is researched until it has either (a) a real public/vendor endpoint with documented fields, auth, and rate limits, or (b) an explicit admission that those details are not publicly available, with what was searched.

Per-idea outputs are the deliverable. A per-measure synthesis at the end checks whether coverage gaps across ideas are overlapping or complementary.

The audience for the final write-up is policymakers; the engineering spec exists so we can demonstrate to them concretely how each check would work, what it costs, what it covers, and how it can be bypassed.

## Prerequisites

- Read `reference-kyc-bypass-research-idea.md` for the sibling project's motivation and design patterns. This pipeline borrows heavily from its adversarial-collaboration / per-item-loop / claim-check structure.
- Read `measures.md` for the list of measures this pipeline operates over (sourced from the CSSWG-linked Google Doc; copy in for offline use).
- Read each stage's prompt template before executing it.

## Inputs

| Input | Where | Used by |
|---|---|---|
| Measure list | `measures.md` | Stages 0, 1 |
| Attacker stories | `attackers/source/` (copies of `09-detailed-table.md` from `../wg/pipeline/outputs/<branch>/`) | Stage 0, Stage 5 (bypass-aware hardening) |
| Per-measure attacker mapping | `attackers/by-measure/measure-{NN}-{slug}.md` | Stages 1, 5 |

## Pipeline overview

| Stage | Name | Scope | Parallelism |
|---|---|---|---|
| 0 | Attacker-story mapping | Per measure-group | ~5 agents in parallel (groups of ≤4 measures) |
| 1 | Ideation | Per measure | All measures in parallel |
| 2 | Feasibility check | Per measure | All measures in parallel |
| 3 | Consolidation | Cross-measure | Sequential |
| 4 | Implementation research | Per idea | Ideas in parallel |
| 4F | Form check | Per idea | Subagent |
| 4C | Claim check | Per idea | Subagent |
| 5 | Bypass-aware hardening | Per idea | Ideas in parallel |
| 6 | Coverage research (BOTEC) | Per idea | Ideas in parallel |
| 6F/6C | Form + claim re-check | Per idea | Subagents |
| 7 | Per-idea synthesis | Per idea | Ideas in parallel |
| 8 | Product prioritization | Per measure | Measures in parallel |
| 9 | Per-measure synthesis | Per measure | Measures in parallel |
| 10 | Global product spec | Cross-measure | Sequential |

**Loops:**
- Stages 1–2 loop up to 3 iterations per measure.
- Stage 4 loops up to 3 iterations against 4F (form check) and 4C (claim check).
- Stage 5 flags only. If it surfaces Critical bypass gaps, trigger one re-research iteration: revise stage 4 (and stage 6 if coverage assumptions changed), re-run 4F/4C, then re-run stage 5. Max one such loop per idea.

## Output directories

```
pipeline/
  measures.md
  attackers/
    source/                          # copies of wg 09-detailed-table.md per branch
    by-measure/
      measure-01-{slug}.md           # written by stage 0
      ...
  outputs/
    00-attacker-mapping-summary.md
    01-ideation-measure-{NN}-v{N}.md
    02-feasibility-measure-{NN}-v{N}.md
    03-ideas.md                      # confirmed idea list, the index for stages 4+
    ideas/
      {idea-slug}/
        00-spec.md                   # frozen idea description from stage 3
        04-implementation-v{N}.md
        04F-form-check-v{N}.json
        04C-claim-check-v{N}.json
        05-hardening.md
        06-coverage.md
        07-synthesis.md
    08-product-measure-{NN}.md
    09-measure-{NN}-synthesis.md
    10-bundle-spec.md
    99-run-summary.md
```

Idea slugs are stable across runs: `{measure-NN}-{short-slug}`, e.g. `03-ror-affiliation-lookup`.

## Idea schema

Every idea, from stage 1 onward, carries the same fields. Stages fill in fields as evidence accumulates; missing fields are explicit (`[unknown — searched for X]`), not omitted.

| Field | Filled by | Notes |
|---|---|---|
| `name` | 1 | Short, names the data source / vendor / SOP, not the measure |
| `measure` | 1 | One of the measures from `measures.md` |
| `attacker_stories_addressed` | 1, 5 | List of branch slugs from `attackers/source/` |
| `summary` | 1 | One paragraph: what signal it produces and how |
| `external_dependencies` | 1, 4 | APIs, vendors, datasets, human roles |
| `endpoint_details` | 4 | URL, auth model, rate limits, pricing, ToS — or explicit `[unknown]` |
| `fields_returned` | 4 | Concrete field list from the endpoint or vendor docs |
| `marginal_cost_per_check` | 4 | Plus an optional `setup_cost` note when nontrivial |
| `manual_review_handoff` | 1, 4 | What goes to a human, what they decide, a short standard playbook |
| `flags_thrown` | 1, 4 | What signals trigger review and the standard human action |
| `failure_modes_requiring_review` | 1, 4 | API errors, ambiguous matches, missing data |
| `false_positive_qualitative` | 4, 6 | Which legitimate-customer cases trip this |
| `coverage_gaps` | 6 | Categories of customers or contexts where this gives no/weak signal, with cited proxies |
| `record_left` | 4 | What auditable artifact the check produces (paper trail / deterrence) |
| `bypass_methods_known` | 5 | From wg attacker stories, on demand |
| `bypass_methods_uncovered` | 5 | Bypasses this idea fails to address |

## Execution order

### Stage 0 — Attacker-story mapping

Once-per-pipeline. Reads all files in `attackers/source/` (copies of `wg/pipeline/outputs/<branch>/09-detailed-table.md`) and emits one file per measure listing the relevant attacker stories with verbatim bypass excerpts.

- **Agents:** Group the measures into batches of ≤4. Launch one agent per group in parallel.
- **Inputs:** measure descriptions (the group's slice of `measures.md`); all attacker-story files.
- **Output:** `attackers/by-measure/measure-{NN}-{slug}.md` for each measure in the group.
- Each file lists, for every attacker story that's relevant to the measure: branch slug, target description, the specific bypass methods that touch this measure, and a one-line "why relevant."
- After all groups finish, write `outputs/00-attacker-mapping-summary.md` listing per-measure counts and any measure that ended up with zero relevant stories.

Parallel-write safety: each agent only writes to files for its own measure group. No file is shared.

### Stages 1–2 — Ideation + feasibility loop

Loops up to 3 iterations per measure. One agent per measure on each side; measures run in parallel.

**Stage 1 — Ideation.** No web search.

- **Inputs:** the measure's description from `measures.md`; the corresponding `attackers/by-measure/measure-{NN}-{slug}.md`; the idea schema; on iterations 2+, the prior feasibility output and prior ideation output.
- **Generation modes** (the prompt asks for ideas from each, then dedupes):
  1. Direct: "what concrete check would address measure X" — name a specific data source, vendor, or SOP.
  2. Attacker-driven: for each attacker story in the mapping file, "what check would have caught this story" — concrete data source, not a label.
  3. Hardening: on iteration 2+, take ideas from the prior round that the feasibility check rejected and try to make them concrete.
- **Output:** `outputs/01-ideation-measure-{NN}-v{N}.md` — a list of candidate ideas, each with as much of the schema as the agent can fill in without web search.

**Stage 2 — Feasibility check.** No web search. One agent per measure.

- **Inputs:** the corresponding stage 1 output; the idea schema.
- **Task:** for each candidate idea, decide PASS / REVISE / DROP against two gates:
  - **Concreteness:** does the idea name a specific data source / vendor / SOP, or is it a label like "check name against research databases"? A PASS-on-concreteness idea must name *which* database.
  - **Relevance:** does the idea plausibly address at least one attacker story from the measure's mapping file, or does it just pattern-match the measure?
- **Output:** `outputs/02-feasibility-measure-{NN}-v{N}.md` with verdict and reason per idea.
- **Stop condition:** stop iterating when stage 2 produces no DROP / REVISE verdicts on any idea, or after 3 iterations.

### Stage 3 — Consolidation

One agent. Reads the final stage-1 outputs across all measures.

- **Tasks:**
  1. Dedupe ideas that effectively name the same data source under different framings.
  2. Drop dominated ideas (an idea is dominated if another idea uses the same data source with strictly more or equal coverage and lower cost).
  3. Assign stable slugs.
  4. Freeze each surviving idea into `outputs/ideas/{slug}/00-spec.md` with the schema fields populated as far as possible.
- **Output:** `outputs/03-ideas.md` — index of confirmed ideas with one-line summaries and links into `ideas/{slug}/`.

### Stage 4 — Implementation research

One agent per idea. Web search enabled. Ideas run in parallel.

- **Inputs:** `ideas/{slug}/00-spec.md`; the idea schema; the measure description.
- **Task:** find the actual endpoint / vendor / data source. Fill in `endpoint_details`, `fields_returned`, `marginal_cost_per_check`, `manual_review_handoff`, `flags_thrown`, `failure_modes_requiring_review`, `false_positive_qualitative`, `record_left`, refined `external_dependencies`. For any field that cannot be sourced, write `[unknown — searched for: <query list>]`. Vendor-gated specifics (pricing, auth flows behind sales contact) should be flagged as `[vendor-gated; <what is publicly visible>]`.
- **Output:** `ideas/{slug}/04-implementation-v{N}.md`.

**Stage 4F — Form check.** One subagent per idea. No web search. Verifies that every required schema field is either populated or has an explicit `[unknown — searched for: ...]` / `[vendor-gated — ...]` admission, and flexibly raises borderline cases (e.g., a "populated" field whose content is too vague to be useful, or an `[unknown]` admission whose search-list is implausibly thin). Output: `04F-form-check-v{N}.md`.

**Stage 4C — Claim check.** One subagent per idea. Web search / fetch enabled. For each cited URL or empirical claim in the stage 4 output, verify it resolves and substantively backs the claim. Flags broken URLs, mis-citations, and overstated claims. Output: `04C-claim-check-v{N}.md`.

If 4F or 4C surface issues, re-run stage 4 with the critic outputs attached. Up to 3 iterations.

### Stage 5 — Bypass-aware hardening

One agent per idea. Web search enabled (to read wg attacker stories on demand).

- **Inputs:** the latest stage 4 output; the idea's `00-spec.md`; the relevant `attackers/by-measure/measure-{NN}-*.md`; on-demand access to specific `attackers/source/<branch>/` files.
- **Task:** given the now-concrete implementation (real fields, real coverage), walk each mapped attacker story and ask: with these specific fields, which of this story's bypass methods does the check actually catch, which slip through, and why? Populate `bypass_methods_known` and `bypass_methods_uncovered`.
- **Constraint:** flag only. Do not edit the idea spec. Each finding is labeled Critical / Moderate / Minor.
- **Output:** `ideas/{slug}/05-hardening-v{N}.md`.
- **Re-research trigger:** if any Critical findings, re-run stage 4 (and stage 6 if the finding affects coverage assumptions) with the hardening report attached, re-run 4F/4C, then re-run stage 5. Maximum one such loop per idea. Surviving Critical findings after the loop are routed to human review.

### Stage 6 — Coverage research (BOTEC)

One agent per idea. Web search enabled. Separate from stage 4 because the source pool is different (market data, demographic stats) and conflating the two muddies both.

- **Task:** Pure BOTEC with cited proxies. The agent should:
  1. Identify the coverage gaps that matter for this specific idea (not a fixed checklist — case-dependent).
  2. Define the customer category each gap covers.
  3. Find a numerical proxy with citation to estimate the size of each category.
- **Suggested dimensions to consider** (not mandatory; the agent picks what's relevant):
  - Across countries / regions (US vs international, OECD vs not)
  - Industry vs academic vs government vs independent
  - New vs established entities
  - Has institutional email vs not
- **Output:** `ideas/{slug}/06-coverage.md`. Populates `coverage_gaps` with cited proxies and refines `false_positive_qualitative`.
- **Form/claim check:** Stages 6F and 6C (same prompts as 4F/4C) re-run on the combined idea file after stage 6. Up to 3 iterations of stage 6 if they fail.

### Stage 7 — Per-idea synthesis

One agent per idea. No web search.

- **Inputs:** `00-spec.md`, all stage 4/5/6 outputs, form/claim check verdicts.
- **Output:** `ideas/{slug}/07-synthesis.md` — a single document containing:
  - The full filled-in schema
  - A short narrative: "what this check is, what it catches, what it misses, what it costs, what bypasses survive"
  - Open issues (anything stage 5 flagged that wasn't addressable inside the form)

This is the per-idea deliverable.

### Stage 8 — Product prioritization

One agent per measure. No web search. Measures run in parallel.

- **Inputs:** all `07-synthesis.md` files for ideas under this measure; the measure description from `measures.md`.
- **Task:** Select which ideas form the recommended implementation for this measure, applying a product lens. Evaluate each idea against:
  1. **Pluggability** — Can this be offered as a third-party API call or dropped into a provider's onboarding flow without bespoke internal infrastructure? Ideas requiring providers to curate their own datasets, build internal tooling, or maintain vendor relationships that don't scale across providers score low.
  2. **Interface clarity** — Does the check have a clean input→output contract? ("Submit a name, get a match/no-match with confidence" is clean; "cross-reference five sources and interpret ambiguous overlaps" is not.)
  3. **Attacker-story coverage** — How many mapped attacker stories does this catch?
  4. **Coverage breadth** — Does it work across geographies, institution types, customer profiles?
  5. **Marginal cost & false-positive burden** — Cheap to run, low friction for legitimate customers.
  6. **Incremental value** — What does this add that the other selected ideas for this measure don't already cover? Drop dominated ideas — those whose coverage is strictly subsumed by another selected idea.
  7. **Composability** — Selected ideas should combine cleanly. Parallel API calls into a shared schema is fine; bespoke orchestration between ideas is a red flag. Engineering complexity (field mapping, schema normalization) is acceptable; product complexity (hard to explain, hard to reason about) is not.
- **Output:** `outputs/08-product-measure-{NN}.md` containing:
  - The selected stack with a one-paragraph rationale per idea explaining why it's in.
  - A "dropped ideas" section with a one-line reason each.
  - A brief note on how the selected ideas compose (shared inputs, parallel execution, how outputs combine into a single check result for this measure).

### Stage 9 — Per-measure synthesis

One agent per measure. No web search. Measures run in parallel.

- **Inputs:** `outputs/08-product-measure-{NN}.md` (the selected stack); the `07-synthesis.md` files for **selected ideas only**; the measure's attacker mapping file.
- **Task:**
  - Tabulate the selected ideas with key fields side-by-side.
  - Cross-cut on coverage gaps: which gaps are shared across all selected ideas (structural), which are complementary (pairing two ideas closes them).
  - Cross-cut on bypass methods uncovered: which attacker stories survive the entire selected stack.
  - Flag structural gaps that no selected idea addresses — these go to the run summary as open issues.
- **Output:** `outputs/09-measure-{NN}-synthesis.md`.

### Stage 10 — Global product spec

One agent. No web search. Sequential after stage 9.

- **Inputs:** all `08-product-measure-{NN}.md` files; all `09-measure-{NN}-synthesis.md` files; `measures.md`.
- **Task:** Assemble the per-measure winners into a single recommended screening product. Think like a product manager designing a platform that synthesis providers can adopt or that a third party can offer as a service.
  - The full list of selected checks, grouped by integration point (e.g., "at order submission," "at account creation," "periodic re-screen").
  - For each check: what it takes as input, what it returns, which measure(s) it serves, estimated cost.
  - Shared infrastructure: if multiple checks use the same underlying API or data source (e.g., ROR, OFAC SDN), consolidate into a single integration.
  - Suggested integration architecture: what calls what, what runs in parallel, where human review sits.
  - Total estimated per-order cost (sum of marginal costs).
  - A "what this bundle does NOT cover" section — structural gaps from the stage 9 syntheses that no selected check addresses.
- **Output:** `outputs/10-bundle-spec.md`.

### Run summary

After stage 10, write `outputs/99-run-summary.md`:
- How many ideation iterations each measure took and why they stopped.
- Number of ideas surviving stage 3, per measure.
- Form/claim check pass rates.
- Stage 5 flags that didn't get addressed (open issues for human review).
- Stage 8 selection stats: ideas selected vs dropped per measure, common drop reasons.
- Per-measure synthesis highlights (from stage 9).
- Stage 10 bundle summary: total checks, estimated per-order cost, structural gaps.

## Context files provided to agents

| File | Stages |
|---|---|
| `measures.md` | 0, 1, 2, 4, 5, 6, 8, 10 |
| `attackers/source/<branch>/...` | 0, 5 (on demand) |
| `attackers/by-measure/measure-{NN}-*.md` | 1, 2, 5, 9 |
| Idea schema (this document) | 1, 2, 3, 4, 5, 6, 7 |
| `outputs/08-product-measure-{NN}.md` | 9, 10 |
| `outputs/09-measure-{NN}-synthesis.md` | 10 |
| `reference-kyc-bypass-research-idea.md` (principles reference, not spec) | optional, any stage |

## Notes carried over from wg

- **Adversarial collaboration:** every loop pairs a generator (1, 4, 6) with a different-context critic (2, 4F+4C, 5). Same principle as wg.
- **Modularity:** per-idea pipeline so sampling outputs and improving prompts is cheap.
- **Traceability:** every empirical claim is either cited, marked `[best guess: reasoning]`, or marked `[unknown — searched for X]`. Same conventions as wg stage 6.
- **Form-then-substance critics:** the hard `[unknown]` admission requirement means form check can be a script, freeing the LLM critic (stage 5) to focus on substance (does this catch real bypasses) instead of completeness.
