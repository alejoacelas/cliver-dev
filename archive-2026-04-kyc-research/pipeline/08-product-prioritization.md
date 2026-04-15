# Stage 8: Product prioritization

Selects which ideas form the recommended implementation for each measure, applying a product lens. Filters the full idea set down to what a synthesis provider would actually ship.

## Agent setup

- **One agent per measure.** Web search disabled. Measures run in parallel.
- **Context provided:**
  - All `outputs/ideas/{slug}/07-synthesis.md` files for ideas under this measure (use `outputs/03-ideas.md` to identify which slugs belong to the measure)
  - The measure's description from `measures.md`

## Prompt

```
You are the product prioritization agent for {{MEASURE_NAME}}.

**Inputs:**
- All ideas grouped under measure {{NN}} in `outputs/03-ideas.md`. For each, read its `07-synthesis.md`.
- Measure description: `measures.md`, section {{NN}}

**Your task:**

You are selecting which ideas a synthesis provider should actually implement for this measure. Think like a product manager designing a screening check that providers can adopt — or that a third party can offer as a service.

For each idea under this measure, evaluate against these criteria:

1. **Pluggability.** Can this be offered as a third-party API call or dropped into a provider's onboarding flow without bespoke internal infrastructure? Ideas requiring providers to curate their own datasets, build internal tooling, or maintain vendor relationships that don't scale across providers score low.

2. **Interface clarity.** Does the check have a clean input→output contract? "Submit a name, get a match/no-match with confidence" is clean. "Cross-reference five sources and interpret ambiguous overlaps" is not.

3. **Attacker-story coverage.** How many mapped attacker stories does this catch? Weight this by the severity and realism of the stories, not just count.

4. **Coverage breadth.** Does it work across geographies, institution types, customer profiles? A check that only works for US academic institutions is less valuable than one that works globally.

5. **Marginal cost & false-positive burden.** Cheap to run and low friction for legitimate customers. High false-positive rates impose hidden costs on providers (manual review queues, customer complaints, lost orders).

6. **Incremental value.** What does this idea add that the other selected ideas for this measure don't already cover? Drop dominated ideas — those whose coverage is strictly subsumed by another selected idea.

7. **Composability.** Selected ideas should combine cleanly. Parallel API calls returning results into a shared schema: fine. Engineering complexity like field mapping and schema normalization: fine. Product complexity — bespoke orchestration, ambiguous decision logic when outputs conflict, hard to explain to a provider what the check does: not fine.

**Selection process:**

- Start by ranking all ideas on each criterion.
- Select ideas greedily: pick the highest-value idea first, then ask what the next idea adds on top. Stop adding when the incremental value of the next idea is low relative to the complexity it introduces.
- If two ideas use the same underlying data source with different wrappers, pick the better wrapper and drop the other.
- Be willing to select just one idea if it covers the measure well. Don't pad the stack.

**Output format:**

Write `outputs/08-product-measure-{{NN}}.md` with three sections:

### Selected stack

For each selected idea:
- **Idea name and slug**
- **Why selected:** one paragraph covering which criteria it scores well on and what it adds to the stack.

### Dropped ideas

For each dropped idea:
- **Idea name and slug**
- **Why dropped:** one line (e.g., "dominated by X," "requires provider-specific infrastructure," "high FP rate with no incremental attacker coverage").

### Composition note

A brief note (1–3 paragraphs) on how the selected ideas work together:
- What shared inputs they need (e.g., customer name, institution name, email domain).
- Whether they run in parallel or sequentially.
- How their outputs combine into a single check result for this measure.
- Any integration concerns worth flagging for the downstream product spec (stage 10).
```
