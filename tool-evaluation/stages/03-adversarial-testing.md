# Stage 3 — Adversarial endpoint testing

**Scope:** One sub-agent per endpoint group. Up to 9 in parallel.  
**Goal:** This is the core of the pipeline. For each endpoint group, iteratively test the APIs — start with seed cases, observe what works and what doesn't, search for harder cases, and keep pushing until you've mapped out the coverage boundaries.  
**Depends on:** Stage 0 (manifest with rate limits and cost budgets) and stage 2 (seed cases and info sources).

## The job

You are red-teaming this API. Your goal is NOT to confirm that it works — it's to find where it fails, where its output is ambiguous, where coverage drops off, and where the fields it returns are uninformative or misleading for the KYC flag you're evaluating.

A good result from this stage looks like: "This endpoint covers X well but fails on Y, is ambiguous on Z, and completely misses W. Here are 30 real examples proving each of those claims."

A bad result looks like: "I tested 30 well-known institutions and they all worked."

## Per-agent inputs

- Seed cases and info sources: `tool-evaluation/seed-cases/{group-name}.yaml`
- Endpoint manifest: `tool-evaluation/00-endpoint-manifest.yaml` — **read the `rate_limit` and `max_test_budget` fields** for each endpoint in your group. These are your hard constraints.
- Pre-committed reasoning from stage 2 — treat this as a starting hypothesis, not a conclusion.
- Idea syntheses from the archive: `archive-2026-04-kyc-research/pipeline/outputs/ideas/{idea-slug}/07-synthesis.md` (known coverage gaps from desk research).
- The customer dataset: `tool-evaluation/customers.csv`

## Iterative testing protocol

### Round 1 — Run the seed cases (5-10 calls)

Make the actual API calls for the seed cases from stage 2. For each:
1. Record the query and the key response fields.
2. Classify: **covered** (useful data for the KYC flag), **partially covered** (ambiguous/incomplete), **not covered** (nothing/error/uninformative).
3. For each field in the response, note: does this help answer the KYC flag question? How? What's missing?

After round 1, pause and reflect:
- What patterns do you see? Which types of inputs work well? Which fail?
- Does the pre-committed reasoning from stage 2 hold up, or was it wrong?
- What specific categories of inputs should you try next to probe the boundaries you've found?

### Round 2+ — Targeted adversarial probing (20-40 additional calls)

Based on what you learned in round 1, design the next batch of test cases. Use the information sources from stage 2, your own web search, and the customer dataset to find cases that test the specific boundaries you identified.

**The iteration loop:**
1. **Identify a coverage boundary** from the previous round ("ROR seems to miss community labs").
2. **Search for cases that test it** — use the info sources, web search, or construct cases from known data.
3. **Run the cases** through the API.
4. **Update your mental model** — did the boundary hold? Is it narrower or wider than expected?
5. **Go deeper** — find the next boundary to probe.

Keep iterating until you feel you've mapped the major coverage boundaries for this endpoint group. Aim for **20-50 total test cases** (including seeds), but quality matters more than quantity. 10 well-chosen adversarial cases that demonstrate real boundaries are worth more than 40 easy cases that all pass.

### What to probe for

For each endpoint, you're looking for failures along these axes:

**Geographic coverage:** Does this work for institutions in Kenya? Uganda? Kazakhstan? Brazil? Indonesia? Don't just test US and UK.

**Institution type coverage:** Universities are the easy case. What about biotech startups? Government labs? CROs? Community bio labs? Makerspaces? Nonprofit research institutes? Virtual companies?

**Temporal coverage:** Does this work for institutions founded last year? What about institutions that changed names, merged, or dissolved?

**Data quality:** When the API returns data, is it accurate? Current? Complete? Are there fields that look populated but contain stale or misleading information?

**Edge cases:** Multi-campus institutions (which campus does the API return?). Institutions at shared addresses (coworking spaces, incubators). Institutions with similar names (disambiguation). Transliterated names. Abbreviated names.

**For the KYC flag specifically:** Even when the API returns data, does that data actually help determine whether to raise the flag? An API that returns "city: Boston" doesn't help if the flag is about street-level address association.

## Rate limits and cost constraints

**Do not hardcode rate limits in your testing loop.** Read them from the endpoint manifest (`00-endpoint-manifest.yaml`):

- `rate_limit`: How many calls per time window. Respect this with appropriate delays.
- `max_test_budget`: Maximum number of calls or maximum dollar spend for this pipeline run. When you approach the budget, prioritize adversarial cases over easy ones.

If you hit a rate limit (429 response), back off exponentially (2s → 4s → 8s → 16s). If you exhaust the budget, document what you would have tested with more budget and stop.

## Web search for case discovery

Use your own web search capabilities to find adversarial cases. Good search strategies:

- `"community bio lab" [country]` — find community labs in specific regions
- `site:igem.org [country] team` — find iGEM teams at unusual institutions
- `"biotech startup" founded 2025 [country]` — find recently founded companies
- `"coworking lab" OR "shared lab space" [city]` — find coworking lab addresses
- Search the info sources listed in the stage 2 seed cases file

## The LLM+Exa endpoints

LLM+Exa is split into 5 separate endpoints, one per KYC step. Each endpoint has a **pre-designed prompt** (hardcoded before the pipeline runs) and is tested identically to any structured API endpoint — same seed cases, same iterative probing, same per-endpoint result file.

The prompts are designed by us ahead of time based on the known coverage gaps from prior pipeline iterations and the structured API results. They target the specific cases where structured APIs are weak, so that LLM+Exa serves as complementary coverage. The prompt files live in `tool-evaluation/llm-exa-prompts/`:

- `llm-exa-prompts/a-address-institution.txt`
- `llm-exa-prompts/b-payment-institution.txt`
- `llm-exa-prompts/c-email-affiliation.txt`
- `llm-exa-prompts/d-residential.txt`
- `llm-exa-prompts/e-pobox-freight.txt`

Each prompt defines:
1. A **system instruction** with the KYC flag question, known pitfalls, and output format requirements.
2. A **template** with placeholders for the case-specific fields (institution name, address, email domain, etc.).
3. A **structured output schema** the LLM must follow (verdict, confidence, evidence, sources).

Use the `llm-exa-search.py` script to run each case:

```bash
# Pipeline integration (structured JSON with tool call details and Exa cost)
uv run tool-evaluation/llm-exa-search.py --prompt-file query.txt --json

# Verbose mode (shows each iteration and search query on stderr)
uv run tool-evaluation/llm-exa-search.py -v --json --prompt-file query.txt
```

The script runs Gemini 3.1 Pro via OpenRouter with Exa neural search as a tool. The model decides when and what to search. It loops until it has enough information to answer, then returns its verdict.

For each LLM+Exa endpoint, run 20-30 test cases. Record the JSON output from `--json` mode (includes the answer, Exa search queries, number of results per search, per-call duration, and total Exa cost). Write results to `results/llm-exa-{step}.yaml` (e.g., `results/llm-exa-a.yaml`).

## Output

**One result file per endpoint** (not per group). The stage 3 agent runs per group (sharing cases across endpoints and comparing their responses), but writes a separate result file for each endpoint. This makes each endpoint independently assessable in later stages.

### Structured results: `tool-evaluation/results/{endpoint-slug}.yaml`

```yaml
endpoint: ror
group: institution-registry
kyc_steps: [a, c]
tested_at: "2026-04-14"
total_cases: 38
rounds: 3

# From the per-endpoint rationale in stage 2 — carried forward for context
known_non_coverage: |
  Community bio labs, makerspaces, and very small biotech startups are not in ROR's scope.
  Commercial entities without a research mission are generally absent.

summary:
  covered: 22
  partially_covered: 8
  not_covered: 8

coverage_boundaries:
  - boundary: "Community bio labs / makerspaces"
    status: not_covered
    evidence: "Tested 5 community labs (Genspace, BioCurious, La Paillasse, Open Science Network, Bosslab). None in ROR."
    cases: [12, 15, 18, 22, 25]
  - boundary: "Non-OECD academic institutions"
    status: partially_covered
    evidence: "ROR covered 4/6 African universities but missed 2 recently founded ones."
    cases: [8, 9, 14, 19, 27, 31]

results:
  - case_id: 1
    round: 1
    name: "Massachusetts Institute of Technology"
    type: academic
    country: US
    difficulty: easy
    query: "GET https://api.ror.org/v2/organizations?query=Massachusetts+Institute+of+Technology"
    status: covered
    response_summary:
      ror_id: "https://ror.org/042nb2s44"
      name: "Massachusetts Institute of Technology"
      country: "United States"
      city: "Cambridge"
      types: ["education", "facs"]
      domains: ["mit.edu"]
    relevant_fields:
      - field: domains
        useful_for: [c-email-affiliation]
        assessment: "Direct match — mit.edu in domains list"
      - field: addresses[0].city
        useful_for: [a-address-institution]
        assessment: "City-level only — cannot confirm street address"
    notes: "Baseline easy case. ROR covers it well."

  - case_id: 12
    round: 2
    name: "Genspace"
    type: community_lab
    country: US
    difficulty: hard
    # ... adversarial case with detailed results
```

Note: cases are shared across endpoints in the same group (the same MIT case appears in `ror.yaml`, `gleif.yaml`, etc.), but each file records only the query and response for that specific endpoint.

### Human-readable summary: `tool-evaluation/results/{endpoint-slug}.md`

```markdown
# ROR API v2 — Test Results

**Tested:** 2026-04-14 | **Cases:** 38 (3 rounds) | **Covered:** 22 (58%) | **Partial:** 8 (21%) | **Not covered:** 8 (21%)

**Known non-coverage:** Community bio labs, makerspaces, small biotech startups, commercial entities without research mission.

## Coverage boundaries found

### 1. Non-OECD academic institutions — PARTIALLY COVERED
ROR covered 4/6 African universities but missed 2 recently founded ones.
Evidence: [case 8, 9, 14, 19, 27, 31]

## Key fields and their usefulness
| Field | Useful for flag | Coverage quality |
|---|---|---|
| domains[] | (c) email match | Strong for academic, weak for companies |
| addresses[].city | (a) address match | City-level only — insufficient for street-level |

## Iteration log
### Round 1 (seed cases 1-8)
...

## What I'd test with more budget
- [Cases I ran out of budget to test]
```

### Per-group cross-comparison: `tool-evaluation/results/{group-name}-comparison.md`

In addition to the per-endpoint files, write one short comparison file per group summarizing how the endpoints performed relative to each other on the shared cases. This is the cross-referencing value of running endpoints together.

```markdown
# Institution Registry — Cross-Endpoint Comparison

| Case | ROR | GLEIF | Companies House | OpenCorporates |
|---|---|---|---|---|
| MIT | covered (city-level) | covered (street-level) | n/a (US entity) | covered |
| Genspace | not covered | not covered | not covered | covered (as LLC) |
| University of Nairobi | covered | not covered | n/a | partially covered |
...

## Key takeaways
- ROR and OpenCorporates are complementary: ROR covers academic, OpenCorporates covers commercial.
- GLEIF adds street-level addresses but only for entities with LEIs (~15% of test cases).
- Companies House is useful only for UK entities but provides dissolved status, which no other endpoint has.
```
