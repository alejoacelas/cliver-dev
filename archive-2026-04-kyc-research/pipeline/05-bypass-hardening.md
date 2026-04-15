# Stage 5: Bypass-aware hardening

Walks each mapped attacker story against the now-concrete implementation and asks: with these specific fields, which bypass methods does this check catch, which slip through, and why? Flag-only — does not edit the idea spec. Critical findings trigger one re-research loop back through stage 4.

## Agent setup

- **One agent per idea.** Web fetch enabled (to read specific files in `attackers/source/<branch>/` on demand).
- **Context provided:**
  - The latest stage 4 output (`04-implementation-v{N}.md`)
  - The idea's `00-spec.md`
  - The relevant `attackers/by-measure/measure-{NN}-{slug}.md`
  - On-demand access to `attackers/source/<branch>/` for any branch slug listed in the mapping file
  - The idea schema
- **Context NOT provided:** other ideas, vendor pages.

## Prompt

```
You are doing bypass-aware hardening review for a single implementation idea. The implementation is now concrete (real fields, real coverage). Your job: walk each mapped attacker story and find the bypass methods that survive this specific implementation.

**Idea under review:** `outputs/ideas/{{SLUG}}/04-implementation-v{{N}}.md`.

**Your measure:** {{MEASURE_NAME}} — {{MEASURE_DESCRIPTION}}

**Attacker stories to walk:** every story listed in `attackers/by-measure/{{MEASURE_FILE}}`. For each story, you may read the full source file at `attackers/source/{{BRANCH_SLUG}}/09-detailed-table.md` if you need more detail than the mapping file's excerpts provide.

**For each attacker story, produce an entry:**

- **Branch slug** and one-line story summary
- **Bypass methods relevant to this measure** — list each one verbatim from the source (or the mapping file)
- **For each bypass method, classify:**
  - **CAUGHT** — the implementation as specified would catch this bypass. Explain which field, signal, or check does the catching.
  - **MISSED** — the implementation would not catch this bypass. Explain why: a missing field, an unmatched edge case, the bypass produces exactly the signal the check looks for, etc. Be concrete.
  - **AMBIGUOUS** — depends on a detail the implementation document doesn't pin down. Name the detail.

- **Net assessment for this story:** does the check meaningfully reduce the cost / lead time / attribution risk for this attacker? Or do all of the attacker's bypass methods slip through?

**After walking all stories, produce a `## Findings` section with each finding labeled by severity:**

- **Critical** — a bypass method that this check is supposed to address but provably misses, AND the bypass is cheap / common / used by multiple stories. These trigger re-research.
- **Moderate** — a bypass method this check misses but it's expensive, narrow, or already addressed by a different measure.
- **Minor** — an AMBIGUOUS case or a small refinement.

For each finding, include:
- Which attacker story / bypass it came from
- Why the implementation misses it (specific to the field set in the document)
- A concrete suggestion for how stage 4 could tighten the implementation in re-research, IF you can think of one. If you can't, say so — the gap may be structural.

**Constraint:** do NOT edit the idea spec or the stage 4 output. Your job is to flag, not to fix. Re-research happens in stage 4 if Critical findings exist.

**Update fields in your report (not in the idea doc) for stage 7 to merge:**

- `bypass_methods_known`: every CAUGHT or MISSED bypass with the classification
- `bypass_methods_uncovered`: every MISSED bypass

**Verdict at the bottom:**
- `PASS` — no Critical findings. Pipeline continues to stage 6.
- `RE-RESEARCH` — Critical findings exist. Trigger one re-research loop: stage 4 (and stage 6 if relevant), then 4F/4C, then re-run this stage. Maximum one such loop per idea.
- `STRUCTURAL` — Critical findings exist but the gaps are structural (not addressable by tweaking the implementation). Pipeline continues but the findings are routed to human review at the end of the run.

**Output:** `outputs/ideas/{{SLUG}}/05-hardening-v{{N}}.md`.
```
