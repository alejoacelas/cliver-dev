# Stage 3: Consolidation

Cross-measure dedupe + dominance pruning + slug assignment + per-idea spec freeze. Produces the index that stages 4+ operate on.

## Agent setup

- **One agent.** Web search disabled.
- **Context provided:**
  - All final-iteration `01-ideation-measure-{NN}-v{N}.md` files
  - All `attackers/by-measure/measure-{NN}-{slug}.md` files
  - The idea schema
  - `measures.md`

## Prompt

```
You are consolidating implementation ideas across all measures into a single index.

**Inputs:**
- Final ideation outputs: `outputs/01-ideation-measure-*-v*.md` (use the highest-numbered version per measure)
- Attacker mapping files: `attackers/by-measure/measure-*.md`
- Measure list: `measures.md`

**Tasks, in order:**

### 1. Dedupe across measures

The same data source may have been proposed under multiple measures. If two ideas refer to the same underlying data source / vendor / API, decide:

- **Same data source, same use:** merge. Keep the more complete description; list both originating measures.
- **Same data source, different use:** keep both. Note the relationship in the slug.
- **Different data sources that look similar:** keep both.

### 2. Dominance pruning

Drop dominated ideas. An idea A is **dominated** by idea B if:

- A and B target the same measure AND
- B addresses every attacker story A addresses AND
- B's marginal cost is not higher AND
- B's coverage is not narrower (use ideation-stage descriptions; this is a soft check, stage 6 will refine)

Be conservative — when in doubt, keep both. Stage 8 will do a more rigorous cross-cut. Document every drop with one line of reasoning.

### 3. Assign slugs

Each surviving idea gets a stable slug: `{measure-NN}-{short-name}`. Examples:
- `03-ror-affiliation-lookup`
- `03-openalex-author-affiliation`
- `05-google-maps-shipping-address`
- `11-opensanctions-screening`

Slugs are stable across runs — once assigned, never change them.

### 4. Freeze per-idea specs

For each surviving idea, write `outputs/ideas/{slug}/00-spec.md` containing:
- The full schema (from `run.md`), with every field the ideation agent populated
- Fields that stage 4 will fill in: marked `# stage 4 — implementation research`
- Fields that stage 6 will fill in: marked `# stage 6 — coverage research`
- Fields that stage 5 will fill in: marked `# stage 5 — hardening`

### 5. Write the index

`outputs/03-ideas.md`:
- Grouped by measure
- One line per idea: slug, name, one-sentence summary, link to spec file
- A `## Dropped` section listing every dropped idea with the reason and what dominated it (if applicable)

**Output paths:**
- `outputs/03-ideas.md`
- `outputs/ideas/{slug}/00-spec.md` for each surviving idea
```
