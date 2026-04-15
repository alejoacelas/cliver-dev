# Stage 7 — Final synthesis

**Scope:** One agent. Sequential.  
**Goal:** Produce the final deliverable — a single document that a CSSWG working group member or provider can read to understand what's feasible, what it costs, and what the gaps are.  
**Depends on:** Stage 6 (need the BOTEC synthesis). Also reads all prior stage outputs for detail.

## Inputs

- All revised assessments: `tool-evaluation/assessments/{kyc-step}.yaml` + `.md` (5 files each).
- All adversarial reviews: `tool-evaluation/adversarial-reviews/{kyc-step}.md` (5 files).
- BOTEC synthesis: `tool-evaluation/06-cost-coverage-synthesis.md`.
- Endpoint manifest: `tool-evaluation/00-endpoint-manifest.yaml`.
- Endpoint relevance: `tool-evaluation/01-endpoint-relevance.md`.
- LLM+Exa results: `tool-evaluation/results/exa.yaml` + `.md` (if it exists as its own endpoint).
- Credential check: `tool-evaluation/00-credential-check.md`.

## Output structure

Write to `tool-evaluation/07-final-synthesis.md`:

### 1. Executive summary

One page. For each of the 5 KYC steps, answer in 2-3 sentences:
- Can we do it with available tools?
- What does it cost (API + human time)?
- What fraction of cases need human review?
- What's the biggest gap?

### 2. Per-KYC-step detail

One section per step. Each section contains:

**Flag definition** — from the CSSWG table. What are we trying to detect?

**Recommended endpoint combination** — from the flag verdict in the assessment. Which APIs, in what order, with what decision logic?

**Coverage map** — table showing coverage by customer type and region. Pull from the assessment's `geographic_coverage` and `customer_types_that_fail`.

**Automation tiers** — the Tier 1/2/3 breakdown with examples of what falls into each tier. Include the adversarial review's challenges to these classifications.

**Cost** — from the BOTEC synthesis. API cost per order, human time per 1,000 orders, blended cost by provider archetype.

**Open issues** — unresolved findings from the adversarial review. Things that need more data, more testing, or working group input.

### 3. Cross-cutting findings

**Shared endpoints** — which APIs serve multiple KYC steps and how to avoid redundant calls. Reference the grouping from stage 1.

**Shared gaps** — customer types that fail across multiple KYC steps. "Community bio labs fail address-to-institution AND email-to-affiliation AND residential check." What's the combined impact?

**The "hard customers" list** — customer types that no available tool handles well across any KYC step. For each: who they are, why they're hard, and what the fallback is (manual review? voucher? skip?).

### 4. LLM+search as alternative

How did the standalone Exa-based approach compare to structured APIs?

For each KYC step:
- Did LLM+search find information that the structured APIs missed?
- Did it produce more false positives?
- How much did it cost compared to the API approach?
- How long did each search take?
- When is it a good substitute, and when is the structured API better?

Overall verdict: is LLM+search a viable fallback for cases where structured APIs have no coverage? A replacement? Neither?

### 5. Credential gaps & next steps

What we couldn't test and what's needed:
- List each blocked/docs-only endpoint.
- What would change about the assessment if we could test it live?
- Link to the setup guides in `setup-guides/` for each.
- Priority order for getting credentials.

### 6. Open questions for the working group

Things that came up during testing that affect the standard itself:
- KYC steps where the flag definition is ambiguous (what counts as "association" between an address and an institution?).
- Cases where the flag triggers but the follow-up action isn't clear.
- Gaps that are structural — no tool can address them — and the working group needs to decide whether to accept the gap, change the standard, or invest in new tools.
- Cost/burden implications for providers of different sizes.

## Style guidance

- Write for the CSSWG working group audience: policymakers, providers, and biosecurity researchers.
- Be concrete — use real examples from the test results, not hypotheticals.
- When citing coverage numbers, note the evidence basis ("based on 35 test cases" vs. "extrapolated from documentation").
- Don't overstate automation capabilities. If something is classified as "rule_based" but the adversarial review found edge cases, say so.
- The document should be self-contained — a reader shouldn't need to read the per-stage outputs to understand the conclusions. But do link to the detailed files for readers who want to dig deeper.
