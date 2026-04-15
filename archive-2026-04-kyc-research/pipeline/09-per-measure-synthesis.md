# Stage 9: Per-measure synthesis

Cross-cuts the per-idea outputs for the **selected ideas** under one measure to identify whether coverage gaps are overlapping (structural) or complementary (closeable by bundling).

## Agent setup

- **One agent per measure.** Web search disabled. Measures run in parallel.
- **Context provided:**
  - `outputs/08-product-measure-{NN}.md` (the stage 8 selection for this measure)
  - The `outputs/ideas/{slug}/07-synthesis.md` files for **selected ideas only**
  - The corresponding `attackers/by-measure/measure-{NN}-{slug}.md`
  - The measure's description from `measures.md`

## Prompt

```
You are producing the per-measure synthesis for {{MEASURE_NAME}}.

**Inputs:**
- The stage 8 product selection: `outputs/08-product-measure-{{NN}}.md`. This tells you which ideas were selected and which were dropped.
- For each selected idea, read its `07-synthesis.md`.
- Attacker mapping: `attackers/by-measure/{{MEASURE_FILE}}`
- Measure description: `measures.md`, section {{NN}}

**Important:** Only analyze the selected ideas from stage 8. Dropped ideas are out of scope.

**Your task in four parts:**

### 1. Side-by-side comparison table

A table with one row per selected idea and columns for:
- Name
- Data source
- Marginal cost
- Manual review burden (one-line characterization)
- Number of attacker stories addressed (and which)
- Headline coverage gap (one line)
- Headline uncovered bypass (one line)

### 2. Coverage gap cross-cut

Across the selected ideas under this measure:

- **Shared gaps (structural):** which customer categories are in EVERY selected idea's coverage-gap list? These are gaps that the selected stack cannot address. Surface them — they're findings for policymakers about the measure, not just the implementation.
- **Complementary gaps:** which customer categories are in some ideas' gap lists but covered by others? For each, identify which idea(s) close the gap.
- **Net coverage estimate:** with the selected stack implemented, what fraction of legitimate customers (rough qualitative bands: most / many / some / few) would still fall in a coverage gap? Cite the BOTEC numbers from the per-idea coverage docs.

### 3. Bypass cross-cut

Across the selected ideas under this measure:

- **Universally uncovered bypasses:** which attacker bypass methods slip through EVERY selected idea's check? These are the attacker patterns the selected stack cannot defend against.
- **Bypass methods caught by at least one idea:** which bypasses are caught by some selected idea(s) but not others? For each, identify the catching idea(s).
- **Attacker stories where every selected idea fails:** the highest-priority output. List the branch slugs.

### 4. Structural gaps for human review

A short section listing:
- Coverage gaps and uncovered bypasses that are structural to the selected stack (not fixable by adding more ideas from the dropped list).
- These are flagged as open issues for the run summary and for the global product spec (stage 10).

**Output:** `outputs/09-measure-{{NN}}-synthesis.md`.
```
