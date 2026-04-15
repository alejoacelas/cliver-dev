# Stage 7: Per-idea synthesis

Combines all stage outputs for one idea into the per-idea deliverable.

## Agent setup

- **One agent per idea.** Web search disabled.
- **Context provided:**
  - `outputs/ideas/{{SLUG}}/00-spec.md`
  - The latest `04-implementation-v{N}.md`
  - The latest `04F-form-check-v{N}.md` and `04C-claim-check-v{N}.md`
  - The latest `05-hardening-v{N}.md`
  - The latest `06-coverage-v{N}.md` (and its 6F/6C reports)
  - The idea schema

## Prompt

```
You are producing the per-idea deliverable for implementation idea {{SLUG}}.

**Inputs:**
- Spec: `00-spec.md`
- Implementation research (latest): `04-implementation-v*.md`
- Form + claim check verdicts (latest): `04F-form-check-v*.md`, `04C-claim-check-v*.md`
- Bypass hardening (latest): `05-hardening-v*.md`
- Coverage research (latest): `06-coverage-v*.md`, `06F-form-check-v*.md`, `06C-claim-check-v*.md`

**Your task:** produce a single document containing:

### Section 1: Filled-in schema

The full idea schema (from `run.md`), with every field populated from the merged stage outputs. Where stages disagreed, prefer the latest iteration; if a Critical hardening finding survived re-research, the affected fields should reflect the gap honestly (do not paper over it).

`bypass_methods_known` and `bypass_methods_uncovered` come from the stage 5 report. `coverage_gaps` and refined `false_positive_qualitative` come from stage 6.

### Section 2: Narrative

A 4–6 paragraph narrative covering:

1. **What this check is and how it works** — written for a policymaker. Name the data source, describe what it returns, describe how a check using it would run.
2. **What it catches** — which attacker stories from the mapping file it addresses, with concrete reference to the bypass methods caught.
3. **What it misses** — the bypass methods uncovered (from stage 5) and the coverage gaps (from stage 6). Be specific.
4. **What it costs** — marginal cost per check, setup cost if nontrivial, manual review burden.
5. **Operational realism** — what the manual review handoff looks like in practice, how flags are dispositioned, what record is left for audit.
6. **Open questions** — anything the form check, claim check, or hardening flagged that didn't get resolved by re-research.

### Section 3: Open issues for human review

Bullet list of:
- Surviving Critical hardening findings (if any)
- Surviving `[unknown — searched for: ...]` fields whose absence affects the policy implications
- `[vendor-gated]` fields that would need a sales conversation to resolve
- Any other flag the upstream stages raised that couldn't be addressed

**Output:** `outputs/ideas/{{SLUG}}/07-synthesis.md`. This is the per-idea deliverable.
```
