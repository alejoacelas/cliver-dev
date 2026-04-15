# Stage 1 — Endpoint relevance re-classification

**Scope:** 2 sub-agents in parallel, then merge.  
**Goal:** Re-classify which endpoints are relevant to the 5 KYC steps. The previous pipeline selected ideas with a product lens; this uses an empirical testing lens ("which endpoints could we test to learn something useful about these 5 flags?").  
**Depends on:** Stage 0 (need the endpoint manifest to know what's testable).

## Agent A — Synthesis-driven classification

**Inputs:**
- All `07-synthesis.md` files for ideas under measures M02, M03, M04, M05, M06, M07, M10, M12.
  Path pattern: `archive-2026-04-kyc-research/pipeline/outputs/ideas/m{02,03,04,05,06,07,10,12}-*/07-synthesis.md`
- The `08-product-measure-{NN}.md` files for those measures.
  Path: `archive-2026-04-kyc-research/pipeline/outputs/08-product-measure-{02,03,04,05,06,07,10,12}.md`
- The endpoint manifest from stage 0: `tool-evaluation/00-endpoint-manifest.yaml`

**Task:**
For each of the 5 KYC steps, produce a ranked list of endpoints with:
- Why this endpoint is relevant to this flag.
- Which specific fields from the endpoint matter.
- Whether it was selected in stage 8 product prioritization (and if dropped, why — check the 08 file).
- Priority: high (core to the flag), medium (supplementary signal), low (marginal or redundant).

Include endpoints that were *dropped* in stage 8 if they're still worth empirical testing (e.g., dropped for product reasons but informative for coverage assessment).

## Agent B — First-principles classification

**Inputs:**
- Measure definitions: `archive-2026-04-kyc-research/pipeline/measures.md`
- The 5 KYC step definitions from `run.md` (the table in the "5 KYC steps" section).
- The endpoint manifest from stage 0: `tool-evaluation/00-endpoint-manifest.yaml`

**Task:**
For each KYC step, independently ask: "What data would I need to evaluate this flag?" Map that to available endpoints. This agent should NOT read the synthesis files — it works from the flag definitions and endpoint descriptions only.

This catches endpoints the previous pipeline might have missed or under-weighted because they were owned by a different measure.

## Merge

The orchestrator reads both outputs, then:
1. Combines the two ranked lists per KYC step.
2. Flags disagreements (endpoint ranked high by one agent, low or absent by the other).
3. For each disagreement, writes a one-line resolution.
4. Produces the final endpoint-to-KYC-step mapping.

**Grouping rule:** Endpoints that share an underlying API are grouped together (e.g., `smarty` serves M03, M04, M05 — test it once, cross-reference results to all three).

## Output

Write to `tool-evaluation/01-endpoint-relevance.md`:

```markdown
# Endpoint relevance classification

## Per KYC step

### (a) Address → institution (M05)
| Endpoint | Priority | Fields of interest | Notes |
|---|---|---|---|
| ror | high | addresses[].city, domains[] | Core institution lookup |
| gleif | high | entity.legalAddress | Street-level for companies |
| ...

### (b) Payment → institution (M12 + M10)
...

## Grouped by API (for stage 2 test set construction)
| API | KYC steps served | Total distinct fields | Test priority |
|---|---|---|---|
| ror | a, c | 6 | high |
| smarty | a, d, e | 8 | high |
| ...

## Disagreements resolved
| Endpoint | Agent A said | Agent B said | Resolution |
|---|---|---|---|
| ... | ... | ... | ... |
```

Expected result: ~12-18 distinct endpoints, each tagged with which KYC steps it serves.
