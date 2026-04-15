# Stage 4: Implementation research

Web research to fill in the concrete implementation fields for each idea: endpoint URL, auth model, fields returned, rate limits, pricing, manual review playbook, etc. One agent per idea, in parallel. Loops with stages 4F + 4C up to 3 iterations.

## Agent setup

- **One agent per idea.** Web search + fetch enabled.
- **Context provided:**
  - `outputs/ideas/{slug}/00-spec.md`
  - The measure's description from `measures.md`
  - The relevant `attackers/by-measure/measure-{NN}-*.md` (for context on what the check needs to catch)
  - The idea schema
  - On iteration 2+: prior `04-implementation-v{N-1}.md`, `04F-form-check-v{N-1}.md`, `04C-claim-check-v{N-1}.md`, and (if this iteration was triggered by stage 5) the `05-hardening-v{N}.md` report
- **Context NOT provided:** other ideas, other measures.

## Sourcing conventions

Same as the wg pipeline:

- `[source](url)` — direct empirical citation.
- `[best guess: reasoning]` — bottom-up estimate when no direct source. Spell out the reasoning.
- `[unknown — searched for: "<query 1>", "<query 2>", ...]` — searched but found nothing. List the actual queries you tried; the form check will challenge implausibly thin search lists.
- `[vendor-gated — <what is publicly visible>; would require sales contact for <X>]` — vendor exists but specific details are behind a sales wall.

## Prompt (iteration 1)

```
You are researching a single concrete implementation idea for a DNA synthesis customer-screening check.

**The idea:** see `outputs/ideas/{{SLUG}}/00-spec.md`. Read it before searching.

**Your measure:** {{MEASURE_NAME}} — {{MEASURE_DESCRIPTION}}

**Attacker context:** the relevant attacker stories are in `attackers/by-measure/{{MEASURE_FILE}}`. You don't need to harden against them in this stage (stage 5 does that), but skim them so you understand what fields actually matter.

**Your task:** fill in every field in the idea schema that isn't already populated, by web research. Update fields that ARE populated if your research contradicts them.

**Fields to populate (or explicitly mark as unknown / vendor-gated):**

- `external_dependencies`: refine from your research. Name the actual vendor/API/dataset.
- `endpoint_details`: URL of the API or product page; auth model (API key / OAuth / vendor portal / batch upload); rate limits; pricing tier(s); ToS constraints relevant to using this for customer screening.
- `fields_returned`: the actual fields the endpoint returns or the vendor advertises. Be concrete — list them. If the vendor only describes them in marketing copy, list what they describe and mark `[vendor-described, not technically documented]`.
- `marginal_cost_per_check`: dollar cost of running this check on one customer. If setup cost is nontrivial, add a `setup_cost` line.
- `manual_review_handoff`: the standard playbook a human follows when this check raises a flag. Should be concrete enough to put in a written SOP.
- `flags_thrown`: each distinct signal that triggers review, plus the standard human action.
- `failure_modes_requiring_review`: API errors, ambiguous matches, missing data, edge cases.
- `false_positive_qualitative`: which legitimate-customer cases this check would incorrectly trip on. Qualitative — coverage stage (6) handles quantitative.
- `record_left`: what auditable artifact the check produces (record the API response? log the matched fields? screenshot the vendor portal? nothing?).

**Sourcing:** every empirical claim needs a citation, a `[best guess: ...]`, an `[unknown — searched for: ...]`, or a `[vendor-gated — ...]`. Do not write empirical claims without one of these markers.

**Search guidance:** start with the vendor or data source's official documentation. Then check developer portals, API reference pages, pricing pages, ToS. If the source is a government registry, check whether there's a documented API or only a web search interface — the difference matters for the implementation. If the source is a research database (OpenAlex, ROR, ORCID, Crossref), check what the public API actually returns vs. what the bulk download contains.

**Output:** `outputs/ideas/{{SLUG}}/04-implementation-v{{N}}.md`. Use the same field structure as `00-spec.md`, with the new content.
```

## Prompt (iteration 2+, revision)

```
You previously researched implementation idea {{SLUG}} in `04-implementation-v{{N-1}}.md`. The form check (`04F-form-check-v{{N-1}}.md`), claim check (`04C-claim-check-v{{N-1}}.md`){{, and hardening report (`05-hardening-v{{N-1}}.md`) IF triggered by stage 5}} surfaced issues.

**Your task:** produce v{{N}}.

For each issue raised by the critics:

- **Form check issues:** populate the missing field with research, OR write an explicit `[unknown — searched for: ...]` admission with a real search list, OR write a `[vendor-gated — ...]` admission with what's publicly visible.
- **Claim check issues:** if a URL is broken, find a working source or drop the claim. If a claim is overstated relative to the source, weaken the claim or find a better source.
- **Hardening issues (if attached):** the hardening agent identified Critical bypass gaps. For each, decide whether the implementation can be tightened (add a field to query, change the matching logic, add a secondary check) or whether the gap is structural. If structural, document it explicitly in the relevant field — do not pretend it doesn't exist.

Same output format as iteration 1. Path: `outputs/ideas/{{SLUG}}/04-implementation-v{{N}}.md`.
```
