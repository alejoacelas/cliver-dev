# Stage 0: Attacker-story mapping

Maps each attacker story from the sibling wg project onto the measures in this pipeline. Produces one file per measure listing the relevant attacker stories with verbatim bypass excerpts. Used by stages 1, 2, 5, and 8.

## Agent setup

- **Group the measures into batches of ≤4.** Launch one agent per batch in parallel. Each agent only writes to files for its own batch — no shared files.
- **Web search:** disabled.
- **Context provided:**
  - The slice of `measures.md` containing the agent's measures (full descriptions)
  - All files under `attackers/source/` (each is a copy of `09-detailed-table.md` from a wg branch)
  - This prompt
- **Context NOT provided:** other measures, prior pipeline outputs.

## Prompt

```
You are mapping attacker stories onto KYC measures for a DNA synthesis customer-screening pipeline.

**Your measures (this batch):**

{{MEASURE_BATCH_DESCRIPTIONS}}

**Attacker stories:** {{N_BRANCHES}} branches under `attackers/source/`. Each file is the synthesized analytical table for one attacker branch from a sibling project. Read all of them.

**Your task:** For each measure in your batch, produce a file `attackers/by-measure/measure-{NN}-{slug}.md` listing the attacker stories that are relevant to that measure.

An attacker story is **relevant** to a measure if any of its bypass methods would have to defeat, evade, or pre-empt that specific measure for the attack to succeed. A story that simply happens to take place in a context where the measure exists is NOT relevant unless the story actually engages with the measure.

For each relevant story, write an entry with:

- **Branch slug:** the directory name under `attackers/source/`
- **Profile:** which of the four wg attacker profiles this branch belongs to (impersonate-employee / fake-affiliation / exploit-affiliation / purpose-built-organization)
- **Target description:** one or two sentences from the source file
- **Bypass excerpts:** verbatim excerpts of the bypass methods from the source file that engage this measure. Quote at least the method name, expertise, cost, and the operational chain. Do not paraphrase.
- **Why relevant:** one line, your own words, naming the specific reason this story stresses this measure.
- **Persistent supply chain?** Y/N — flagged on the branch in the source file.

Order entries within a measure file by how directly the story engages the measure (most directly first).

If a measure ends up with zero relevant stories, write the file with an explicit "No relevant stories found" header and a one-paragraph explanation of what you searched for and why nothing matched. Do not invent relevance.

**Output paths:** `attackers/by-measure/measure-{NN}-{slug}.md`, one per measure in your batch. Do not write to any file outside your batch.

**After all measure files in your batch are written**, append a one-line summary per measure to `outputs/00-attacker-mapping-summary.md` (use append-only file writes; the file is shared across batches but only appended to). Format: `- measure-{NN}-{slug}: {count} relevant stories ({list of branch slugs})`.
```

## Notes

- File-write isolation is the only concurrency safety mechanism. Each agent's measure files are disjoint from every other agent's. The summary file is append-only and the entries are independent — order doesn't matter.
- Verbatim excerpts (not paraphrase) are critical: stage 5 will read these to do bypass-aware hardening, and paraphrased bypass methods lose the operational detail that makes hardening useful.
