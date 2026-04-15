# Stage 5 — Adversarial review of assessments

**Scope:** One sub-agent per KYC step (5 in parallel). Each agent reviews a *different* step's assessment (cross-review, not self-review).  
**Goal:** Challenge the assessment — find missed edge cases, question automation tier classifications, stress-test false positive estimates.  
**Depends on:** Stage 4 (need the field assessments to review).

## Cross-review assignment

| Reviewer | Reviews assessment for | Rationale |
|---|---|---|
| Agent 1 | (b) payment-to-institution | Payment agent reviews address-adjacent step |
| Agent 2 | (c) email-to-affiliation | Email agent reviews payment step |
| Agent 3 | (d) residential-address | Residential agent reviews email step |
| Agent 4 | (e) po-box-freight | PO box agent reviews residential step |
| Agent 5 | (a) address-to-institution | Address agent reviews PO box step |

The point of cross-review: the reviewer has context from a related-but-different KYC step, so they can spot assumptions that wouldn't survive contact with a different flag.

## Per-agent inputs

- The assessment to review: `tool-evaluation/assessments/{kyc-step}.yaml` + `.md`
- The test results that the assessment is based on: all `results/{endpoint-id}.yaml` files cited in the assessment.
- The CSSWG measure definitions: `archive-2026-04-kyc-research/pipeline/measures.md`
- The attacker stories for the relevant measure: `archive-2026-04-kyc-research/pipeline/attackers/by-measure/measure-{NN}-*.md`

## Review tasks

For each field assessment in the YAML:

### 1. Missing customer types
"What customer type would this fail on that isn't listed in `false_positive_cases`?"

Think about:
- Customers the test set didn't include (because stage 2 didn't think of them).
- Customers who exist in the test set but whose failure mode wasn't categorized.
- Customers at the intersection of two edge cases (e.g., community lab AND non-US AND recently founded).

### 2. Rule-based failure cases
"Give me a concrete case where the `rule_based` automation approach would get it wrong."

For each field classified as `rule_based`, construct a specific scenario where the rule fires incorrectly (false positive) or doesn't fire when it should (false negative). Include enough detail to make it testable.

### 3. Evidence chain weakness
"What's the weakest link in this evidence chain?"

For each `coverage_summary` and `automation_detail` claim:
- Is the claim supported by the test results, or is it extrapolated?
- How many test cases actually support this claim?
- If it's based on 2-3 cases, flag it as "thin evidence."

### 4. Adversarial bypass
"If I were trying to pass this check fraudulently, how would I do it?"

For the overall `flag_verdict`, construct 2-3 attack scenarios where a malicious actor could pass the automated checks. Reference the attacker stories from the pipeline where relevant.

### 5. Quantitative challenge
"Are the fraction estimates plausible?"

For each `fraction_of_orders` and `false_positive_fraction_estimate`:
- Is this consistent with what the test results actually showed?
- Could it be off by 2-3x in either direction?
- What would change the estimate (different provider, different customer mix)?

## Output

Write to `tool-evaluation/adversarial-reviews/{kyc-step}.md`:

```markdown
# Adversarial review: (a) Address → institution

**Reviewer:** Agent 5 (assigned from PO box step)
**Assessment reviewed:** assessments/a-address-to-institution.yaml

## Missing customer types
- [Customer type 1]: [Why it's missing and how it would fail]
- [Customer type 2]: ...

## Rule-based failure cases
- **Field:** ROR addresses[].city, rule: "if city matches → pass"
  **Failure scenario:** [Specific case where this rule breaks]
  **Impact:** [How often this might happen]

## Evidence chain weaknesses
- **Claim:** "~50-60% auto-pass rate"
  **Weakness:** [Why this might be wrong]
  **Suggested revision:** [What the number should be, or "insufficient data"]

## Adversarial bypass scenarios
1. [Scenario 1: how to beat the check]
2. [Scenario 2]

## Quantitative challenges
- [Which estimates seem off and why]

## Recommended revisions
- [Specific changes to make to the assessment]
```

## Post-review revision

After all 5 adversarial reviews are complete, each stage 4 agent revises its assessment:

1. Read the adversarial review of its KYC step.
2. For each recommendation: accept (revise the assessment), reject (explain why in a "Rejected review findings" section), or flag (needs more data — note what data).
3. Write the revised assessment back to the same files (`assessments/{kyc-step}.yaml` + `.md`), adding a "Revision notes" section at the end documenting what changed.

**One iteration only.** No back-and-forth between reviewer and author.
