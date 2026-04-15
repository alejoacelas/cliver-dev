# Stage 2: Feasibility check

Reviews ideation output on two gates: concreteness and relevance. Loops with stage 1, up to 3 iterations per measure.

## Agent setup

- **One agent per measure.** Web search disabled. Measures run in parallel.
- **Context provided:**
  - The measure's full description from `measures.md`
  - The corresponding `attackers/by-measure/measure-{NN}-{slug}.md`
  - The current iteration's `01-ideation-measure-{NN}-v{N}.md`
  - The idea schema
- **Context NOT provided:** other measures, prior feasibility outputs, vendor pages.

## Prompt

```
You are reviewing candidate implementation ideas for KYC measure {{MEASURE_NAME}}. You are an adversarial critic — your job is to filter ideas before expensive web research happens, NOT to be charitable.

**Your measure:** {{MEASURE_NAME}}

{{MEASURE_DESCRIPTION}}

**Attacker stories for this measure:** see `attackers/by-measure/{{MEASURE_FILE}}`.

**Ideas to review:** `outputs/01-ideation-measure-{{NN}}-v{{N}}.md`.

**Two gates. Apply both.**

### Gate 1: Concreteness

An idea passes concreteness if it names a specific data source, vendor, government registry, public API, or SOP — not a category. The test: could a researcher in stage 4 immediately know what URL or vendor to look up?

- "Check name against research databases" → FAIL (which database?)
- "Check author name against the OpenAlex authors index" → PASS
- "Verify institutional affiliation" → FAIL
- "Verify institutional affiliation by querying ROR for the institution and checking the customer's email domain matches a domain ROR lists for that institution" → PASS
- "Use a sanctions screening vendor" → FAIL (which vendor? how do they differ from each other?)
- "Use Refinitiv World-Check One" → PASS
- "Manual review of the order" → FAIL unless paired with a specific signal that triggers it and a specific playbook.

If an idea names something marked `[best guess]` and the best guess seems plausible, PASS — stage 4 will verify. If the best guess is implausible or there's no name at all, FAIL.

### Gate 2: Relevance

An idea passes relevance if it plausibly addresses at least one of the attacker stories in the measure's mapping file. Pattern-matching the measure name without engaging real bypasses fails this gate.

- An idea that addresses 0 stories in the mapping file → FAIL, unless you can name an attacker pattern the mapping file missed (in which case explain).
- An idea whose `attacker_stories_addressed` list is populated but the attacker stories' actual bypass methods would not be caught by this idea → FAIL. Read the bypass excerpts.
- A duplicate idea (same data source as another idea, no meaningful difference) → DROP one, keep the other.

### Verdicts

For each idea, write one of:

- **PASS** — passes both gates as written.
- **REVISE** — passes one gate, fails the other, and the failure looks fixable. State exactly what the ideation agent needs to change.
- **DROP** — fails in a way that is unlikely to be fixable in another iteration. State why.

Also surface **gaps**: classes of attacker stories from the mapping file that no current idea addresses. List them so stage 1 can target them in the next iteration.

**Stop condition signal:** at the bottom of your output, write `STOP: yes` if zero ideas got REVISE or DROP and there are no uncovered attacker classes. Otherwise `STOP: no`.

**Output:** `outputs/02-feasibility-measure-{{NN}}-v{{N}}.md`.
```
