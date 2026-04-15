# Stage 1: Ideation

Generates many concrete candidate implementation ideas per measure. Stages 1–2 form a loop: ideation generates ideas, the feasibility check (stage 2) reviews them on concreteness + relevance, and ideation revises. Up to 3 iterations.

## Agent setup

- **One agent per measure.** Web search disabled. Measures run in parallel.
- **Context provided:**
  - The measure's full description from `measures.md`
  - The corresponding `attackers/by-measure/measure-{NN}-{slug}.md` file
  - The idea schema (from `run.md`)
  - On iteration 2+: the prior `01-ideation-measure-{NN}-v{N-1}.md` and `02-feasibility-measure-{NN}-v{N-1}.md`
- **Context NOT provided:** other measures, vendor pricing pages, the wg `kyc-bypass-research-idea.md`.

## Prompt (iteration 1)

```
You are generating candidate implementation ideas for a single KYC measure used by DNA synthesis providers to screen customers.

**Your measure:** {{MEASURE_NAME}}

{{MEASURE_DESCRIPTION}}

**Relevant attacker stories:** see `attackers/by-measure/{{MEASURE_FILE}}`. These are the attacker stories from a sibling project whose bypass methods engage this measure. Read them before generating ideas.

**Idea schema:** every idea you generate must populate as many of these fields as possible without web search. Fields you cannot fill in offline (endpoint URL, exact field list, pricing) should be left blank — stage 4 will fill them in. Fields that depend only on your reasoning (manual review handoff, flags thrown, failure modes) should be filled in now.

{{IDEA_SCHEMA}}

**Your task:** generate as many concrete implementation ideas as you can, optimizing for breadth at this stage. An idea is "concrete" if it names a specific data source, vendor, or SOP — not a category. "Check name against research databases" is NOT an idea. "Check author name against the OpenAlex authors index via the OpenAlex public API" IS an idea. If you don't know the name of a specific source, name your best guess and mark it `[best guess]` — stage 2 will challenge it.

Generate ideas from each of these three modes; the same idea may appear in more than one mode (note which modes it covers):

1. **Direct mode.** "What concrete check would address this measure?" Brainstorm data sources, vendors, public APIs, government registries, scientific databases, identity-document checks, payment-processor signals, etc. Aim for at least 6 distinct ideas in this mode.

2. **Attacker-driven mode.** For each attacker story in the mapping file, ask: "what specific check would have caught this story?" Name the data source / vendor / SOP that would catch it. Link the idea back to the story slug. Some attackers may motivate multiple ideas; some ideas may address multiple attackers.

3. **Hardening mode (iteration 2+ only):** revisit ideas the prior feasibility check rejected. If REVISE: try to make them concrete by naming a specific data source. If DROP for relevance: only revisit if you can find a real attacker connection. If DROP for concreteness with no plausible source: drop permanently.

**For each idea, write:**

- `name`: short, names the data source / vendor / SOP
- `summary`: one paragraph — what signal it produces and how
- `attacker_stories_addressed`: list of branch slugs from the mapping file
- `external_dependencies`: APIs, vendors, datasets, human roles (best guess if unknown)
- `manual_review_handoff`: what goes to a human, what they decide, a short standard playbook
- `flags_thrown`: what signals trigger review and the standard human action for each
- `failure_modes_requiring_review`: API errors, ambiguous matches, missing data
- `record_left`: what auditable artifact this check produces
- Other fields: leave blank with a comment `# stage 4` or `# stage 6`

Lean toward including ideas you're not sure about — it's cheaper for stage 2 to drop them than for you to filter prematurely. But do not generate ideas you can't name a specific source for; mark those as questions for yourself instead.

**Output:** `outputs/01-ideation-measure-{{NN}}-v{{N}}.md`. Use one heading per idea. List ideas dropped from previous iterations at the bottom under `## Dropped`.
```

## Prompt (iteration 2+, revision)

```
You previously generated ideas for measure {{MEASURE_NAME}} in `01-ideation-measure-{{NN}}-v{{N-1}}.md`. The feasibility check returned `02-feasibility-measure-{{NN}}-v{{N-1}}.md` with verdicts on each idea.

**Your task:** produce v{{N}}.

For each idea, apply the verdict:

- **PASS** ideas: copy forward unchanged.
- **REVISE** ideas: address the specific issue the feasibility check raised. Usually this means naming a specific data source instead of a category, or pointing to a real attacker story instead of pattern-matching the measure.
- **DROP** ideas: move to the `## Dropped` section with a one-line note on why, but try one revision attempt first if the drop reason might be addressable.

In addition, you may add new ideas if the feasibility check's reasoning surfaced angles you hadn't considered (e.g., it pointed out that a class of attacker stories isn't addressed by any current idea).

Same output format as iteration 1.
```
