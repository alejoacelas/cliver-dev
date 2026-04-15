# Pipeline Iteration — Structural Refinements

**Date:** 2026-04-15  
**Status:** Applied  
**Scope:** Changes to pipeline stage specs based on review of iteration 1 outputs.

---

## Change 1: Per-endpoint rationale in stage 2 (seed cases)

**Problem:** Stage 2 produced seed cases per endpoint group with a single rationale paragraph covering the whole group. This doesn't give the stage 3 agent enough guidance about what's specifically hard for each individual endpoint — and it wastes test budget on things we can predict from documentation (e.g., testing whether Companies House covers a Kenyan university).

**Change:** Added `per_endpoint_rationale` structure to stage 2 output. Each endpoint gets:
- `known_non_coverage`: Things we know from docs/scope that this endpoint can't do. Noted for downstream stages but not tested.
- `boundary_hypotheses`: Cases where coverage is genuinely uncertain — where the stage 3 agent should focus testing budget.

**Files changed:** `stages/02-seed-cases.md`

---

## Change 2: Per-endpoint result files in stage 3

**Problem:** Results were written per endpoint group (`results/institution-registry.yaml`), making it hard to assess individual endpoints or compare an endpoint's performance to LLM+Exa for the same KYC step.

**Change:** Stage 3 now writes one result file per endpoint (`results/ror.yaml`, `results/gleif.yaml`, etc.). The stage 3 agent still runs per group (to share cases and compare endpoints), but outputs per-endpoint files plus a group-level `{group-name}-comparison.md` cross-comparison.

**Files changed:** `stages/03-adversarial-testing.md`, `stages/04-field-assessment.md` (inputs), `stages/05-adversarial-review.md` (inputs), `stages/07-final-synthesis.md` (inputs)

---

## Change 3: LLM+Exa split into 5 fixed endpoints

**Problem:** LLM+Exa was a single endpoint group tested with generic prompts across all 5 KYC steps. The prompts weren't designed to target the specific cases where structured APIs fail, so LLM+Exa wasn't being evaluated as complementary coverage — just as a general-purpose tool.

**Change:**
- Split into 5 endpoints: `llm-exa-a` through `llm-exa-e`, one per KYC step.
- Each has a pre-designed prompt (hardcoded before pipeline run) stored in `tool-evaluation/llm-exa-prompts/`.
- Prompts are designed by us based on prior iteration findings, targeting the specific coverage gaps from structured API testing.
- Each endpoint gets its own seed cases, results file, and adversarial review — treated identically to structured APIs.
- This is NOT an added pipeline stage — prompt design happens before the pipeline runs.

**Files changed:** `stages/03-adversarial-testing.md`, `stages/01-endpoint-map.md` (grouping table)

---

## Change 4: Adversarial review threshold lowered

**Problem:** Stage 5 only triggered stage 3 reruns for high-severity findings. Medium-severity findings (undertested sub-categories, edge cases) were documented but never re-tested, leaving coverage gaps in the final assessment.

**Change:** Stage 5 now triggers reruns on high OR medium severity findings. Low-severity findings are documented and the rerun attempts to address them if budget allows, but don't trigger on their own.

**Files changed:** `stages/05-adversarial-review.md`

---

## Change 5: BOTEC fraction sources and cost presentation

**Problem:** Stage 6 used `customers.csv` as a fraction source, but the dataset wasn't constructed to be representative of any real provider's order mix. The cost presentation focused on averages, not on what drives costs up in edge cases.

**Changes:**
1. **Dropped `customers.csv` as a fraction source.** It's still used for sourcing test cases but not for estimating real-world distribution.
2. **Added published market data reference.** Gene synthesis market reports (Precedence Research, Mordor Intelligence, Allied Market Research, Twist 10-K) provide the top-level split: ~50-55% academic/government, ~35-40% pharma/biotech, ~5-10% CRO, ~2-5% other.
3. **Source tagging.** Every fraction estimate must be tagged as `[market data]`, `[judgment]`, or `[insufficient data — range]`.
4. **Replaced sensitivity analysis with cost driver and tail risk analysis.** Identify which profile groups dominate cost, flag steps where the average is misleading (low average but high tail), and highlight scenarios that could drastically increase costs.
5. **Added provider archetype scenarios.** Compute costs for 2-3 different customer mixes (US academic-heavy, global biotech-heavy, significant Chinese academic base) so readers can find the one closest to their situation.

**Files changed:** `stages/06-botec-synthesis.md`

---

## Remaining work (not in this changeset)

- **LLM+Exa prompt design:** Back-and-forth to design the 5 pre-baked prompts. Will be done separately before next pipeline run.
- **Endpoint inventory expansion:** Handled by the parallel `01-pipeline-changes.md` changeset (OFAC SDN, OpenSanctions, Google Places Nearby, CORDIS, Melissa, SEC EDGAR, etc.).
- **Audit of endpoint utilization:** Verifying all 31 endpoints were actually tested — handled in separate agent session.
