# Stage 7 — Final synthesis

**Scope:** One agent. Sequential.  
**Goal:** Produce the final deliverable — a single document that a CSSWG working group member or provider can read to understand what's feasible, what it costs, and what the gaps are.  
**Depends on:** Stage 6 (BOTEC synthesis). Also reads all prior stage outputs for detail.

## Inputs

- Field assessments: `tool-evaluation/04-assessments/{kyc-step}.yaml` + `.md` (5 files each). Contains profile groups, time tiers, and flag verdicts.
- Adversarial review finals: `tool-evaluation/05-adversarial-reviews/{group-name}-final.md` (one per endpoint group). Contains unresolved findings.
- BOTEC synthesis: `tool-evaluation/06-cost-coverage-synthesis.md`. Contains profile group inventory, fraction estimates (with source tags), cost tables, cost drivers, tail risk analysis, and provider archetype scenarios.
- Per-endpoint results: `tool-evaluation/03-results/{endpoint-slug}.yaml` + `.md`. Individual endpoint test results.
- LLM+Exa prompt test analysis: `tool-evaluation/llm-exa-prompts/test-results.md`. Contains prompt-level findings from pre-pipeline testing — guardrail assessment, per-step pass rates, cost model, and known limitations (e.g., step (e) cannot detect freight forwarders by address). Use this alongside the stage 3 raw results for section 4a.
- Cross-endpoint comparisons: `tool-evaluation/03-results/{group-name}-comparison.md`.
- Endpoint manifest: `tool-evaluation/00-endpoint-manifest.yaml`.
- Endpoint map: `tool-evaluation/stages/01-endpoint-map.md` (static endpoint-to-KYC-step mapping).
- Credential check: `tool-evaluation/00-credential-check.md`.

## Output structure

Write to `tool-evaluation/07-final-synthesis.md`:

### 1. Executive summary

One page. For each of the 5 KYC steps, answer in 2-3 sentences:
- Can we do it with available tools?
- What does it cost (API + LLM + human time)?
- What fraction of cases are auto / LLM-delegable / human-required?
- What's the biggest gap?

### 2. Per-KYC-step detail

One section per step. Each section contains:

**Flag definition** — from the CSSWG table. What are we trying to detect?

**Recommended endpoint combination** — from the flag verdict in the assessment. Which APIs, in what order, with what decision logic?

**Coverage map** — table showing coverage by profile group and region. Pull from the assessment's profile groups and their `distinguishing_factors`.

**Resolution by profile group** — from the stage 4 assessments. For each profile group relevant to this KYC step: description, time tier (auto / llm_review / llm_review_human_audit / human_review / customer_follow_up), estimated time/cost, and the resolution path. Include concrete examples from the test results.

**Cost** — from the BOTEC synthesis. Three cost streams: API cost per order, LLM review cost per order, human cost per order. Show the per-profile-group breakdown, not just the aggregate. Present both a "human-only" scenario (all non-auto review done by humans) and a "with LLM delegation" scenario so the reader can see the delta.

**Open issues** — unresolved findings from the adversarial review finals (`{group-name}-final.md`). Things that need more data, more testing, or working group input.

### 3. Cross-cutting findings

**Shared endpoints** — which APIs serve multiple KYC steps and how to avoid redundant calls. Reference the grouping from `01-endpoint-map.md`.

**Shared gaps** — profile groups that fail across multiple KYC steps. "Community bio labs fail address-to-institution AND email-to-affiliation AND residential check." What's the combined impact?

**The "hard customers" list** — profile groups that remain expensive even after LLM delegation. These are the cases where the fallback is human review or customer follow-up because the resolution path requires subjective judgment or external communication. For each: who they are, why they can't be LLM-delegated, and what the fallback is (human review? customer follow-up? voucher? policy decision?).

### 4. LLM as endpoint and LLM as reviewer

This section covers two distinct roles LLMs play in the pipeline — they are different capabilities and should not be conflated:

#### 4a. LLM+Exa as an endpoint (data source)

How did the standalone Exa-based approach compare to structured APIs as a source of screening data?

For each KYC step:
- Did LLM+search find information that the structured APIs missed?
- Did it produce more false positives?
- How much did it cost compared to the API approach?
- How long did each search take?
- When is it a good substitute, and when is the structured API better?

Overall verdict: is LLM+search a viable fallback for cases where structured APIs have no coverage? A replacement? Neither?

#### 4b. LLM as reviewer (decision-maker on procedural cases)

Separately from using LLMs as data sources, the stage 4 assessments identify profile groups where the resolution path is fully procedural — a sequence of API calls and web lookups with a binary pass/fail rule. These cases can be delegated to an LLM agent that executes the prescribed procedure and either passes the case or escalates to a human.

Summarize:
- Which profile groups are classified as `llm_review` vs. `human_review` vs. `customer_follow_up`, and why?
- What is the total cost impact of LLM delegation (from the stage 6 automation frontier analysis)?
- What are the risks of LLM delegation — false passes, hallucinated evidence, compliance liability?
- What validation would be needed before deploying LLM-as-reviewer in production (accuracy benchmarks, human audit sampling rates, regulatory review)?

The goal is to give the working group a clear picture of the automation opportunity beyond deterministic API checks, without overselling it.

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
- **Framework observations:** Note empirical findings about the 5-step structure itself — specifically: (1) steps (a) and (d) are operationally one step (if step (a) confirms an institution at the address, step (d) is moot; if step (a) fails, that failure IS the residential signal), and (2) step (e) bundles three unrelated problems with radically different automation feasibility (PO box detection = solved, export control country screening = solved, freight forwarder detection = unsolved). Frame these as observations for the working group to consider, not as changes to the pipeline's structure.

### 7. Tools not evaluated

List tools that exist in the market but were not tested in this pipeline, with rough pricing and expected impact. The goal is to give the CSSWG audience a menu of "what else is available" beyond the tools we tested.

For each category, provide:
- Tool names and rough pricing
- What gap it would address (reference specific profile groups and KYC steps)
- Expected impact on the assessment (would it change a verdict, reduce investigation time, close a structural gap?)
- Whether the archive research evaluated and deliberately excluded it (and why)

**Categories to cover:**

1. **Corporate verification databases** (Dun & Bradstreet, Bureau van Dijk/Orbis) — would reduce PG-07 (small biotech at own address) investigation time by providing multi-jurisdiction corporate registry data. OpenCorporates covers the same function at lower cost but is currently blocked (requires paid API access). Rough pricing: D&B/Orbis = mid-to-high five figures/year.

2. **Sanctions / denied party screening vendors** (Visual Compliance, Descartes, ComplyAdvantage, OpenSanctions) — entity-level screening against OFAC SDN, BIS Entity List, and international sanctions. Not evaluated in this pipeline because entity-level sanctions screening was scoped out (the pipeline covers BIS country-group screening only). Rough pricing: $5K-50K/year for commercial vendors; OpenSanctions self-hosted is free (CC-BY-SA) or EUR 0.10/call via API.

3. **Identity verification services** (Persona, Jumio, Onfido, Stripe Identity) — document + biometric identity verification. Addresses the identity binding gap identified across all 5 steps (every tool we tested verifies association, not identity). Rough pricing: $1.20-$3.50/verification. Requires a policy decision from the working group on whether the standard requires identity binding.

4. **International address verification** (Melissa, Loqate) — residential/commercial classification, PO Box detection, and address normalization for 240+ countries. Addresses the non-US coverage gap for steps (d) and (e). Melissa is included in this pipeline iteration; Loqate is an alternative. Rough pricing: $0.003-$0.05/check.

5. **Academic databases** (Scopus, Web of Science) — the archive research evaluated these and deliberately excluded them as providing "near-zero incremental bypass detection over free sources" (OpenAlex, PubMed) at $10K-50K/year.

## Style guidance

- Write for the CSSWG working group audience: policymakers, providers, and biosecurity researchers.
- Be concrete — use real examples from the test results, not hypotheticals.
- When citing coverage numbers, note the evidence basis ("based on 35 test cases" vs. "extrapolated from documentation").
- Don't overstate automation capabilities. If the adversarial review found edge cases that undermine a profile group's time tier classification, say so.
- The document should be self-contained — a reader shouldn't need to read the per-stage outputs to understand the conclusions. But do link to the detailed files for readers who want to dig deeper.
