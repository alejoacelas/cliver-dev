# Stage 5 — Adversarial review & coverage expansion (loop)

**Scope:** One sub-agent per endpoint group (matching the stage 3 groups). Up to 9 in parallel. Loops up to 3 iterations.  
**Goal:** Review stage 3 results, identify coverage gaps and missed edge cases, then send the stage 3 agent back to test more cases. Repeat until gaps are addressed or 3 iterations are exhausted.  
**Depends on:** Stage 3 (adversarial testing results). Stage 5 does not need stage 4 outputs — it reads stage 3 results directly. The pipeline runs: stage 3 → stage 5 → (loop if needed) → stage 4 (after loop completes).

## How the loop works

```
Stage 3 results → Stage 5 review → [high-severity findings?]
                                      ├── yes → Stage 3 re-run (expanded) → Stage 5 review → ...
                                      └── no → done (pass to stage 4/6/7)
```

Maximum 3 iterations of the stage 5 → stage 3 loop per endpoint group. After 3 iterations, any remaining high-severity findings are documented and forwarded to the final synthesis (stage 7) as unresolved issues.

## Per-agent inputs

- Stage 3 results for this endpoint group: `tool-evaluation/results/{group-name}.yaml` + `.md`
- The endpoint map: `tool-evaluation/stages/01-endpoint-map.md` (which KYC steps this group serves)
- The pre-committed reasoning from stage 2: `tool-evaluation/seed-cases/{group-name}.yaml`
- The archive's coverage research for relevant ideas: `archive-2026-04-kyc-research/pipeline/outputs/ideas/{idea-slug}/06-coverage.md`
- The archive's attacker stories for relevant measures: `archive-2026-04-kyc-research/pipeline/attackers/by-measure/measure-{NN}-*.md`

## Review tasks

For each endpoint group's stage 3 results:

### 1. Coverage gap analysis

Look at the `coverage_boundaries` section of the stage 3 results. For each boundary:
- Is the evidence sufficient? (How many cases tested this boundary? Were they diverse enough?)
- Are there sub-categories within this boundary that weren't explored? (e.g., "non-OECD academic" was tested with 3 African universities — what about Southeast Asian or Central Asian institutions?)
- Are there entire categories of customers/institutions that stage 3 didn't test at all?

Cross-reference against:
- The customer types in `customers.csv` — were all 4 types tested (Controlled Agent Academia, General Life Science, Sanctioned Institution, Controlled Agent Industry)?
- The attacker stories — would any attacker story bypass the endpoint in a way that wasn't tested?
- The archive's coverage dimensions (from `06-coverage.md`) — were all identified gaps empirically probed?

### 2. Field assessment challenge

For each field in the stage 3 results that was classified as "useful for flag X":
- Are there cases where this field is misleading? (Returns data that looks informative but would lead to a wrong flag decision)
- Are there cases where different endpoints disagree on the same entity?
- Is the field assessment consistent across the test cases, or does it depend on the specific entity tested?

### 3. Adversarial bypass analysis

For each KYC step this endpoint group serves:
- If an attacker knew how this check works, how would they evade it?
- Were any evasion strategies tested in stage 3? If not, construct specific test cases that simulate them.
- Reference the attacker stories from the archive — which bypass methods are relevant here?

### 4. Severity classification

Classify each finding as:

- **High severity:** A significant category of customers or a plausible attack vector is untested or poorly covered. The assessment would be materially different if this were tested. Examples: "No non-US addresses tested for Smarty (which is US-only)." "No community labs tested against the institution registry."
- **Medium severity:** A sub-category or edge case is undertested. The overall assessment might shift slightly. Examples: "Only 2 multi-campus universities tested — need more to confirm the satellite campus boundary."
- **Low severity:** A minor gap that doesn't change the overall picture. Examples: "Could test one more country in Central Asia."

**High-severity findings trigger a stage 3 re-run.** Medium and low do not.

## Stage 3 re-run protocol

When high-severity findings exist:

1. Write the findings to `tool-evaluation/adversarial-reviews/{group-name}-v{N}.md` (where N is the iteration number).
2. For each high-severity finding, specify:
   - What additional test cases should be run (be specific — give entity names, addresses, domains, etc., or describe what to search for).
   - Which endpoint(s) to call.
   - What the expected outcome is and what would change the assessment.
3. The stage 3 agent re-runs with these additional cases appended to the existing results file. It adds new cases to the `results` list and updates the `coverage_boundaries` and `summary` sections.
4. Stage 5 reviews the updated results. If high-severity findings remain, loop again. Maximum 3 total iterations.

## Output

### Per iteration: `tool-evaluation/adversarial-reviews/{group-name}-v{N}.md`

```markdown
# Adversarial review: institution-registry (iteration 1)

## Findings

### HIGH: No community labs tested outside the US
Stage 3 tested 5 US community labs (Genspace, BioCurious, etc.) — none in ROR.
But no non-US community labs were tested. European community labs (La Paillasse in Paris,
London Biohackspace) may behave differently — La Paillasse is a registered association
and might appear in OpenCorporates.

**Action:** Test 3-5 non-US community labs: La Paillasse (FR), London Biohackspace (UK),
Hackuarium (CH), BioClub (JP), Open Bioeconomy Lab (UK).

### HIGH: Attacker story "shell company with coworking address" not tested
The archive's attacker stories include a shell company registered at a virtual office.
Stage 3 tested coworking addresses but not virtual offices (Regus, Spaces).

**Action:** Test 3 virtual office addresses: Regus address in London, Spaces address in NYC,
HQ address in Singapore. Check if OpenCorporates returns the shell vs. the virtual office provider.

### MEDIUM: Only 2 multi-campus universities tested
Both were in the US (UC Berkeley, MIT Lincoln Lab). Need international multi-campus: Chinese Academy of Sciences, Max Planck Institutes.

### LOW: No dissolved companies tested against Companies House
Minor gap — dissolved flag is documented in the API response schema.

## Stage 3 re-run required: YES (2 high-severity findings)
```

### Final state: `tool-evaluation/adversarial-reviews/{group-name}-final.md`

After the loop completes (either no high-severity findings or 3 iterations exhausted):

```markdown
# Adversarial review: institution-registry (FINAL)

**Iterations:** 2 (stopped after iteration 2 — no remaining high-severity findings)

## Resolved findings
- [v1 HIGH] Non-US community labs: tested 5. La Paillasse appeared in OpenCorporates (FR).
  Others absent from all registries. Assessment updated.
- [v1 HIGH] Shell company at virtual office: tested 3. All appeared in OpenCorporates
  with virtual office address. ROR/GLEIF had none. Confirmed evasion vector.

## Unresolved findings (forwarded to final synthesis)
- None

## Open medium/low findings (informational, not blocking)
- [v1 MEDIUM] Multi-campus: tested 4 additional. CAS returns Beijing HQ only (confirmed).
  Max Planck returns individual institute addresses (partially addressed).
- [v1 LOW] Dissolved companies: deferred — documented in schema, not worth a test call.
```

## Important: what gets forwarded to later stages

- **Stage 4 (field assessment):** reads the updated stage 3 results (which now include the expanded test cases from the loop).
- **Stage 6 (BOTEC):** reads the updated stage 3 results for per-case cost estimation.
- **Stage 7 (final synthesis):** reads the `{group-name}-final.md` files. Any unresolved high-severity findings from 3-iteration exhaustion get their own section in the final synthesis.
