# KYC Tool Evaluation Pipeline

This document tells a new Claude Code session how to execute the tool evaluation pipeline. Read this fully before starting.

## What this pipeline produces

Empirical assessments of KYC screening endpoints — tested against real and adversarial cases — answering: what does each API actually return in practice, where does coverage break down, how do the response fields map to the CSSWG flags, and what fraction of cases can be automated vs. need human review?

The audience is the CSSWG working group and DNA synthesis providers evaluating which tools to adopt.

## Context

The previous pipeline (in `archive-2026-04-kyc-research/`) researched 103 implementation ideas across 20 measures — desk research documenting what each API *claims* to do. This pipeline is the empirical follow-up for 5 priority KYC steps: actually call the APIs with adversarial test cases, record what happens, and produce field-level assessments.

## The 5 KYC steps

| Step | Measure | Flag | CSSWG table reference |
|---|---|---|---|
| **(a) Address → institution** | M05 | No public association between affiliation and shipping address | Line 77 |
| **(b) Payment → institution** | M12 (+M10) | Billing address not associated with the institution; gift card BIN | Lines 82, 84 |
| **(c) Email → affiliation** | M02 | Does not match institution domain / non-institutional domain | Line 74 |
| **(d) Residential address** | M04 | Residential address | Line 76 |
| **(e) PO box / freight forwarder** | M03 (+M06) | P.O. Box; freight forwarder address | Line 75 |

Adjacent measures pulled in because they share endpoints: M06, M07, M10.

## Inputs

| Input | Path | Notes |
|---|---|---|
| Existing idea syntheses | `archive-2026-04-kyc-research/pipeline/outputs/ideas/*/07-synthesis.md` | Per-idea research from previous pipeline |
| Product selections | `archive-2026-04-kyc-research/pipeline/outputs/08-product-measure-{NN}.md` | Which ideas were selected per measure |
| API investigations | `archive-2026-04-kyc-research/investigations/a-address-to-institution/` | Deep-dive API docs (ROR, GLEIF, Companies House, OSM, Smarty, Stripe, Plaid, BIN, GeoNames) |
| Measure definitions | `archive-2026-04-kyc-research/pipeline/measures.md` | Canonical measure list with stable numbering |
| Customer dataset | `tool-evaluation/customers.csv` | 535 deanonymized records (name, institution, email, order) from patent/LinkedIn data |
| Credentials | `.env` | Keys for Smarty, Stripe, Plaid, Companies House, Exa, Tavily, Screening List |

## Endpoint inventory

After deduplication by underlying API, the distinct endpoints:

**Free / no-auth (hit live):**
- ROR API v2 — research org registry (~110K orgs). Measures: M02, M05, M07, M12.
- GLEIF API — legal entity identifiers (~2.9M entities). Measures: M05, M12.
- RDAP/WHOIS — domain registration data. Measures: M02.
- Consolidated Screening List API — OFAC SDN, BIS Entity List, DPL, UVL, etc. Measures: M06.
- OSM Overpass — campus polygon containment. Measures: M05.
- binlist.net — free BIN lookup. Measures: M10.
- InCommon/eduGAIN — academic federation IdP list. Measures: M07.
- ISO country normalization — local logic, no API. Measures: M06.
- PO Box regex — local logic. Measures: M03.

**Credentialed (have keys in .env):**
- Smarty US Street API — address verification (RDI, CMRA, DPV). 250 free/month. Measures: M03, M04, M05.
- Stripe test mode — card metadata + AVS. Free, deterministic test responses. Measures: M10, M12.
- Plaid sandbox — bank account Identity Match. Free, synthetic data. Measures: M12.
- Companies House — UK company registry. Free, 600 req/5min. Measures: M05, M12.
- Exa neural search — standalone LLM+search tool. Measures: all (as alternative to structured APIs).
- Tavily search — fallback web search.

**Missing credentials (document setup, don't test):**
- GeoNames — reverse geocoding, campus coordinates. Needs account creation.
- Google Places — business presence detection. Needs API key.
- BinDB — commercial BIN database. Optional, paid.

**Documentation-only (use docs + coverage matrices, not live calls):**
- Stripe AVS in production — live responses vary by issuer/country; test mode is deterministic.
- Plaid Identity Match in production — sandbox is synthetic.
- Google Places business detection — docs sufficient for coverage assessment.

---

## Pipeline stages

### Stage 0 — Credential check & endpoint classification

**Scope:** One agent, sequential.
**Goal:** Verify every credential works. Classify each endpoint as: `live`, `docs-only`, or `blocked`.

**Tasks:**
1. For each credentialed API in `.env`: make one minimal test call, confirm it returns data.
2. For each free/no-auth API: make one minimal test call.
3. For blocked APIs (GeoNames, Google Places): write setup guides in `setup-guides/`.
4. Produce: `00-endpoint-manifest.yaml` + `00-credential-check.md`.

**Manifest schema:**
```yaml
endpoints:
  - id: ror
    name: Research Organization Registry
    url: https://api.ror.org/v2/organizations
    auth: none
    status: live                    # live | docs-only | blocked
    credential_env_var: null
    test_result: "OK — returned MIT record"
    rate_limit: "2000/5min (undocumented soft limit)"
    cost_per_call: "$0"
    cost_source: "free API"
    measures: [M02, M05, M07, M12]
    ideas: [m02-ror-domain-match, m05-ror-gleif-canonical]
    free_tier_budget: null
    notes: ""
```

**Outputs:**
- `tool-evaluation/00-endpoint-manifest.yaml`
- `tool-evaluation/00-credential-check.md`
- `tool-evaluation/setup-guides/{endpoint-id}.md` (for blocked endpoints)

---

### Stage 1 — Endpoint relevance re-classification

**Scope:** 2 sub-agents in parallel, then merge.
**Goal:** Re-classify which endpoints are relevant to the 5 KYC steps. The previous pipeline selected ideas with a product lens; this uses an empirical testing lens.

**Agent A** reads all `07-synthesis.md` files for M02/M03/M04/M05/M06/M07/M10/M12 ideas. Produces a ranked list of endpoints per KYC step with inclusion/exclusion rationale.

**Agent B** reads the CSSWG meeting table + the 5 KYC step definitions. Independently maps "what data would you need to evaluate this flag?" to available endpoints. This catches things the previous pipeline missed.

**Merge:** The orchestrator combines the two lists, flags disagreements, and writes the final endpoint-to-KYC-step mapping.

**Output:** `tool-evaluation/01-endpoint-relevance.md`
Expected: ~12-18 distinct API endpoints, each tagged with which KYC steps it serves.

---

### Stage 2 — Adversarial test set construction

**Scope:** One sub-agent per endpoint group (grouped by shared API). Up to 8 agents in parallel.
**Goal:** For each endpoint, build 20-50 test cases designed to find coverage edges.

**Per-agent inputs:**
- Endpoint entry from `00-endpoint-manifest.yaml`
- Relevant `07-synthesis.md` files (known coverage gaps)
- Relevant `06-coverage.md` files (BOTEC coverage dimensions)
- Customer dataset (`customers.csv`) for sampling real cases
- KYC step definitions (which flags this endpoint feeds into)

**Construction approach:**
1. **Sample from customers.csv** — 5-10 real cases spanning countries, institution types, order types.
2. **Generate adversarial cases via Exa search** — actively find:
   - Institutions outside US/EU (Africa, Southeast Asia, Central Asia, South America)
   - Community bio labs, makerspaces, iGEM teams
   - Coworking spaces, incubators, virtual offices
   - Very new institutions (< 2 years old)
   - Name changes, mergers, multi-campus institutions
   - Individuals without institutional affiliation
   - Freight forwarders, PO boxes, residential-to-commercial conversions
   - Endpoint-specific edge cases (e.g., ROR: orgs not in registry; Smarty: international addresses; RDAP: privacy-proxied domains)
3. **Document each case** with: name, type, country, source, edge rationale.

**Budget:** ≤$50 Exa/Tavily spend per agent. 30-50 cases for complex endpoints, 20 for simple ones (PO box regex, ISO normalization).

**Output per endpoint:** `tool-evaluation/test-sets/{endpoint-id}.yaml`

```yaml
endpoint: ror
measures: [M02, M05, M07]
cases:
  - id: 1
    name: "Indian Institute of Technology Kanpur"
    type: academic
    country: IN
    source: customers.csv
    edge_case: false
    notes: "Large established institution, should be easy"
  - id: 2
    name: "Genspace"
    type: community_lab
    country: US
    source: adversarial_search
    edge_case: true
    edge_reason: "Community bio lab — may not be in ROR"
```

---

### Stage 3 — Endpoint testing

**Scope:** One sub-agent per endpoint. Up to 8 in parallel (respecting rate limits).
**Goal:** Run every test case through the actual API. Record responses. Classify results.

**For live endpoints:**
- Make the actual API call for each test case.
- Record key response fields (not raw multi-KB JSON).
- Classify: **covered** (useful data), **partially covered** (ambiguous/incomplete), **not covered** (nothing/error/uninformative).
- For each relevant field, note whether it's useful for the target KYC flag(s).

**For docs-only endpoints (Stripe prod AVS, Plaid prod, Google Places):**
- Read official documentation thoroughly.
- Document response schema, field meanings, coverage claims.
- Estimate covered/not-covered for the test cases based on docs + coverage matrices.
- Flag where documentation is insufficient.

**For LLM+Exa web search (standalone tool):**
- For each of the 5 KYC measures, write a targeted search prompt.
- Run the LLM+Exa loop on 20-30 test cases.
- Record: what the search found, time taken, whether it answered the flag question.
- This is the "can LLM+search substitute for structured APIs?" comparison.

**Rate limit management:**
- Smarty: 250/month. Budget 50 calls total. Prioritize adversarial cases.
- Companies House: 600/5min — no issue.
- OSM Overpass: prone to 429s — 2s delay between calls, retry with backoff.
- Free APIs (ROR, GLEIF): no hard limits but add 500ms courtesy delays.

**Output per endpoint:** `tool-evaluation/results/{endpoint-id}.yaml` + `.md`

```yaml
endpoint: ror
tested_at: "2026-04-14"
total_cases: 35
covered: 22
partially_covered: 5
not_covered: 8

results:
  - case_id: 1
    query: "Indian Institute of Technology Kanpur"
    status: covered
    response_summary:
      ror_id: "https://ror.org/03f0f3294"
      name: "Indian Institute of Technology Kanpur"
      country: "India"
      city: "Kanpur"
      types: ["education", "facs"]
      domains: ["iitk.ac.in"]
    relevant_fields:
      - field: domains
        useful_for: [M02-email-domain-match]
        assessment: "Direct match — email domain matches ROR domains list"
      - field: addresses[0].city
        useful_for: [M05-address-institution-match]
        assessment: "City-level only — cannot confirm street address"
```

---

### Stage 4 — Field-level assessment & flag mapping

**Scope:** One sub-agent per KYC step (5 agents in parallel).
**Goal:** Synthesize per-endpoint test results into per-field assessments for each KYC flag.

**Inputs:**
- All `results/{endpoint-id}.yaml` for endpoints relevant to this KYC step.
- KYC step definition (flag triggers, follow-up actions from CSSWG table).
- Measure definitions from `measures.md`.

**Output per KYC step:** `tool-evaluation/assessments/{kyc-step}.yaml` + `.md`

**Assessment schema:**
```yaml
kyc_step: a-address-to-institution
measure: M05
flag: "No public association between affiliation and shipping address"
follow_up: "Follow-up if any other flag raised"

endpoints_evaluated:
  - endpoint: ror
    fields:
      - field: addresses[].city
        description: "City where the institution is located"
        useful_for_flag: partial            # full | partial | none
        good_examples:
          - "MIT — ROR returns 'Cambridge, MA' matching shipping address"
        partial_examples:
          - "Chinese Academy of Sciences — 100+ campuses, ROR returns Beijing HQ only"
        not_covered_examples:
          - "Genspace (community lab) — not in ROR"
        geographic_coverage: "Strong OECD, weak Africa/Central Asia"
        automation_tier: rule_based          # rule_based | llm_assisted | human_required
        automation_notes: "If ROR city == shipping city → pass. Else → escalate."
        false_positive_cases:
          - "Satellite campuses"
          - "Recently relocated institutions"
        false_positive_fraction_estimate: "~10-15% of non-US academic orders"
        cost_per_call: "$0"

flag_verdict:
  best_endpoint_combination: "ROR + GLEIF + Smarty"
  coverage_summary: "Strong for established US/EU academic. Weak for community labs, non-US small companies, coworking tenants."
  automation_tier: mostly_rule_based
  automation_detail: |
    Tier 1 (auto-pass, ~50-60%): ROR city matches shipping city, or GLEIF street matches.
    Tier 2 (LLM can judge, ~25-30%): Campus polygon, multi-campus, coworking.
    Tier 3 (human follow-up, ~10-20%): Not in any registry, different country, new entities.
  estimated_review_time:
    tier_1: "0 min (auto)"
    tier_2: "2-5 min (LLM-assisted)"
    tier_3: "10-30 min (human follow-up)"
  customer_types_that_fail:
    - category: "Community bio labs / makerspaces"
      fraction_of_orders: "~1-3%"
      why_fails: "Not in ROR, GLEIF, or Companies House"
      resolution: "LLM web search fallback or voucher-based"
```

---

### Stage 5 — Adversarial review of assessments

**Scope:** One sub-agent per KYC step (5 in parallel). Each agent reviews a *different* step's assessment (cross-review, not self-review).
**Goal:** Challenge the assessment — find missed edge cases, question automation tier classifications, stress-test false positive estimates.

**Tasks per review:**
1. "What customer type would this fail on that isn't listed?"
2. "Give me a concrete case where the rule-based approach would get it wrong."
3. "What's the weakest link in this evidence chain?"
4. "If I were trying to pass this check fraudulently, how would I do it?"

**Output:** `tool-evaluation/adversarial-reviews/{kyc-step}.md`

After adversarial review, the stage 4 agent revises its assessment. One iteration only.

---

### Stage 6 — BOTEC cost & coverage synthesis

**Scope:** One dedicated agent. Sequential (after stages 4-5).
**Goal:** Quantitative estimates using predefined rules applied to qualitative findings.

**Inputs:**
- All revised assessments from stage 4.
- Provider archetype definitions:
  - **US academic-heavy:** 70% US university, 15% US biotech, 10% international academic, 5% other
  - **Global pharma:** 40% US/EU pharma, 30% international pharma, 20% academic, 10% CRO/startup
  - **Mixed biotech:** 40% biotech startup, 25% academic, 20% pharma, 15% international
  - **Small provider:** 50% local academic, 30% small biotech, 20% varied

**Per archetype × per KYC step, estimate:**
1. Fraction of orders: auto-pass vs. LLM-assisted vs. human follow-up
2. Average review time per tier
3. API cost per order (sum of endpoint calls)
4. Total monthly cost at 1,000 orders/month

**Constraint:** Do NOT invent coverage data. Only combine what stages 3-5 measured.

**Output:** `tool-evaluation/06-cost-coverage-synthesis.md`

---

### Stage 7 — Final synthesis

**Scope:** One agent. Sequential.
**Goal:** Final deliverable.

**Output:** `tool-evaluation/07-final-synthesis.md`

**Contents:**
1. **Executive summary** — per KYC step: can we do it, what does it cost, what fraction needs human review.
2. **Per-KYC-step detail** — flag verdict, endpoint recommendations, coverage map, automation tiers, cost.
3. **Cross-cutting findings** — shared endpoints, shared gaps, "customer types that fail everything" list.
4. **LLM+search as alternative** — how the standalone Exa approach compared to structured APIs.
5. **Credential gaps & next steps** — what we couldn't test and what's needed.
6. **Open questions for the working group** — things that affect the standard itself.

---

## Output directory structure

```
tool-evaluation/
  run.md                                 # this file
  customers.csv                          # deanonymized test data (535 records)
  00-endpoint-manifest.yaml              # stage 0
  00-credential-check.md                 # stage 0
  setup-guides/                          # stage 0 (blocked endpoints)
    geonames.md
    google-places.md
  01-endpoint-relevance.md               # stage 1
  test-sets/                             # stage 2
    {endpoint-id}.yaml                   # one per endpoint
  results/                              # stage 3
    {endpoint-id}.yaml                   # structured results
    {endpoint-id}.md                     # human-readable summary
  assessments/                           # stage 4 (revised after stage 5)
    {kyc-step}.yaml                      # structured assessment
    {kyc-step}.md                        # human-readable
  adversarial-reviews/                   # stage 5
    {kyc-step}.md
  06-cost-coverage-synthesis.md          # stage 6
  07-final-synthesis.md                  # stage 7
```

## Execution plan

| Stage | Agents | Parallelism | Depends on | Effort |
|---|---|---|---|---|
| 0 — Credential check | 1 | Sequential | — | Light |
| 1 — Relevance classification | 2 | Parallel | Stage 0 | Light |
| 2 — Test set construction | ~8 | Parallel | Stage 1 | Medium |
| 3 — Endpoint testing | ~8 | Parallel | Stage 2 | Heavy |
| 4 — Field assessment | 5 | Parallel | Stage 3 | Medium |
| 5 — Adversarial review | 5 | Parallel | Stage 4 | Medium |
| 6 — BOTEC synthesis | 1 | Sequential | Stage 5 | Light |
| 7 — Final synthesis | 1 | Sequential | Stage 6 | Light |

## Verification

After the pipeline completes:
1. Every endpoint in the manifest has a corresponding results file.
2. Every assessment references real test results (not hallucinated).
3. Spot-check 2-3 API responses by re-running calls manually.
4. Cost numbers in the final synthesis are internally consistent.

## Notes

- **Resumability:** Each stage writes outputs before the next starts. If interrupted, re-run from the last incomplete stage. YAML outputs are source of truth; markdown is derived.
- **Rate limit safety:** Stage 3 agents for rate-limited APIs (Smarty, OSM Overpass) implement delays and respect the budget in the manifest.
- **No credential setup automation:** Stage 0 documents what's missing but does NOT create accounts. That's a manual step.
- **LLM+Exa tool:** Runs as a standalone "endpoint" alongside structured APIs. Uses Exa's neural search mode by default. Each search prompt is measure-specific.
- **Cross-referencing:** Each API is tested once; results are cross-referenced to multiple KYC steps in stage 4. The agent testing an endpoint knows which measures it serves and evaluates fields against all relevant flags.
