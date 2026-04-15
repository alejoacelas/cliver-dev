# KYC Tool Evaluation Pipeline

## Context

The CSSWG working group has defined 20 KYC screening measures. The previous pipeline (in `archive-2026-04-kyc-research/`) researched 103 implementation ideas across all 20 measures — identifying endpoints, costs, coverage gaps, and bypass methods. That work was desk research: documented what each API *claims* to do.

This pipeline is the empirical follow-up for 5 priority measures. The goal is to **actually call the APIs** with real (and adversarial) test cases, document what the responses look like in practice, map out where coverage breaks down, and produce per-field assessments of how each field feeds into the KYC flags from the CSSWG meeting table.

The 5 KYC steps (mapping to existing measure numbers):
- **(a) Address → institution** — M05 shipping-institution-match
- **(b) Payment → institution/individual** — M12 billing-institution-match (+ M10 BIN gift card)
- **(c) Email → affiliation** — M02 email-affiliation-whois
- **(d) Residential address** — M04 shipping-residential
- **(e) PO box / freight forwarder** — M03 shipping-po-box (+ M06 freight forwarder)

Adjacent measures pulled in because they share endpoints: M06, M07, M10.

## Pipeline location

All outputs go to `tool-evaluation/` at the project root.

## Inputs

| Input | Path | Notes |
|---|---|---|
| Existing idea syntheses | `archive-2026-04-kyc-research/pipeline/outputs/ideas/*/07-synthesis.md` | Per-idea research from previous pipeline |
| Product selections | `archive-2026-04-kyc-research/pipeline/outputs/08-product-measure-{NN}.md` | Which ideas were selected per measure |
| API investigations | `archive-2026-04-kyc-research/investigations/a-address-to-institution/` | Deep-dive API docs for M05 stack |
| Measure definitions | `archive-2026-04-kyc-research/pipeline/measures.md` | Canonical measure list |
| Customer dataset | `tool-evaluation/customers.csv` | 535 deanonymized records (name, institution, email, order) |
| Credentials | `.env` | API keys for Smarty, Stripe, Plaid, Companies House, Exa, Tavily, Screening List |

## Endpoint inventory (from previous pipeline)

21 selected ideas across the 8 measures, plus the **LLM+Exa web search** tool as a standalone alternative. After deduplication by underlying API, the distinct endpoints to test are roughly:

**Free / no-auth (hit live):**
- ROR API (M02, M05, M07, M12, M18)
- GLEIF API (M05, M12)
- RDAP/WHOIS (M02)
- OpenSanctions / OFAC SDN / Consolidated Screening List (M06)
- OSM Overpass (M05)
- binlist.net (M10)
- InCommon/eduGAIN federation list (M07)
- ISO country normalization (M06) — local logic, no API
- PO Box regex (M03) — local logic
- BIS Entity List / DPL (M06) — Consolidated Screening List API

**Credentialed (have keys):**
- Smarty US Street API (M03, M04, M05) — 250 free/month
- Stripe test mode (M10, M12) — free, but returns canned AVS data
- Plaid sandbox (M12) — free, synthetic data
- Companies House (M05, M12) — free, 600 req/5 min
- Exa search (standalone LLM+search tool)
- Tavily search (fallback)

**Missing credentials:**
- GeoNames (M05) — need to create account + enable web services
- Google Places API (M04) — need API key
- BinDB (M10) — optional, paid

**Documentation-only (no live testing, use docs + coverage matrices):**
- Stripe AVS in production (live AVS varies by issuer/country — test mode is deterministic)
- Plaid Identity Match in production (sandbox is synthetic)
- Google Places business detection (need API key; docs sufficient for coverage assessment)

---

## Pipeline stages

### Stage 0 — Credential check & endpoint classification

**Scope:** Sequential, one agent.  
**Goal:** Verify every credential works. Classify each endpoint into: live-testable, documentation-only, or blocked (needs credential setup).

**Tasks:**
1. For each credentialed API in `.env`: make a minimal test call, confirm it returns data.
2. For each free/no-auth API: make a minimal test call.
3. For APIs where we lack credentials (GeoNames, Google Places): write a short setup guide (can reuse `00-api-key-setup.md` from investigations).
4. Produce a manifest: `tool-evaluation/00-endpoint-manifest.yaml`

**Manifest schema (YAML):**
```yaml
endpoints:
  - id: ror
    name: Research Organization Registry
    url: https://api.ror.org/v2/organizations
    auth: none
    status: live        # live | docs-only | blocked
    credential_env_var: null
    test_result: "OK — returned MIT record"
    rate_limit: "2000/5min (undocumented soft limit)"
    cost_per_call: "$0"
    cost_source: "free API"
    measures: [M02, M05, M07, M12]
    ideas: [m02-ror-domain-match, m05-ror-gleif-canonical]
    free_tier_budget: null    # or "250 lookups/month"
    notes: ""
    
  - id: smarty
    name: Smarty US Street API
    # ...
    status: live
    free_tier_budget: "250 lookups/month — budget carefully"
```

**Output:** `tool-evaluation/00-endpoint-manifest.yaml` + `tool-evaluation/00-credential-check.md` (log of what was tested and results).

**Blocked endpoints:** For each, output a `tool-evaluation/setup-guides/{endpoint-id}.md` with step-by-step instructions to get credentials.

---

### Stage 1 — Endpoint relevance re-classification

**Scope:** 2 sub-agents in parallel.  
**Goal:** Starting from the 21 selected ideas + adjacent ideas, re-classify which endpoints are relevant to the 5 priority KYC steps. The previous pipeline's stage 8 selections were made with a product lens; this re-classification uses an empirical testing lens ("which endpoints could we test to learn something useful about these 5 flags?").

**Agent A:** Reads all `07-synthesis.md` files for M02, M03, M04, M05, M06, M07, M10, M12 ideas. Produces a ranked list of endpoints per KYC step, with rationale for inclusion/exclusion.

**Agent B:** Reads the CSSWG meeting table (measures.md) + the 5 KYC step definitions. Independently maps "what data would you need to evaluate this flag?" to available endpoints. This catches endpoints the previous pipeline might have missed or under-weighted.

**Output:** `tool-evaluation/01-endpoint-relevance.md` — merged classification with any disagreements flagged. Final list of endpoints to test, grouped by underlying API (so each API is tested once, results cross-referenced to multiple measures).

**Expected result:** ~12-18 distinct API endpoints to test, each tagged with which of the 5 KYC steps it serves.

---

### Stage 2 — Adversarial test set construction

**Scope:** One sub-agent per endpoint group (grouped by shared API). Up to 8 agents in parallel.  
**Goal:** For each endpoint, build a test set of 20-50 cases designed to find the edges of coverage.

**Inputs per agent:**
- The endpoint's entry from `00-endpoint-manifest.yaml`
- The relevant `07-synthesis.md` files (which document known coverage gaps)
- The `06-coverage.md` files (which list BOTEC coverage dimensions)
- The customer dataset (`customers.csv`) for sampling real cases
- The KYC step definitions (which flags this endpoint feeds into)

**Test set construction approach:**
1. **Sample from customers.csv** — Pick 5-10 real cases that span the dataset (different countries, institution types, order types).
2. **Generate adversarial cases** — Using Exa web search, actively find:
   - Institutions outside the US/EU (Africa, Southeast Asia, Central Asia, South America)
   - Community bio labs, makerspaces, iGEM teams
   - Coworking spaces, incubators, virtual offices
   - Very new institutions (< 2 years old)
   - Institutions with name changes, mergers, or multiple campuses
   - Individual researchers without institutional affiliation
   - Freight forwarders, PO boxes, residential-to-commercial conversions
   - Edge cases specific to this endpoint (e.g., for ROR: organizations not in the registry; for Smarty: international addresses; for RDAP: privacy-proxied domains)
3. **Document each case** with: name, type, country, why it's an edge case, expected difficulty.

**Output per endpoint group:** `tool-evaluation/test-sets/{endpoint-id}.yaml`

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
    notes: "From investigations/01-ror-api.md — confirmed not in ROR as of investigation"
    
  # ... 20-50 cases total
```

**Budget constraint:** Each agent should spend ≤$50 on Exa/Tavily searches for case discovery. Rate limits permitting, aim for 30-50 cases per endpoint. Simpler endpoints (PO box regex, ISO country normalization) can use fewer (20).

---

### Stage 3 — Endpoint testing

**Scope:** One sub-agent per endpoint. Up to 8 agents in parallel (respecting rate limits).  
**Goal:** Run every test case through the actual API. Record the full response. Classify each result.

**For live-testable endpoints:**
- Make the actual API call for each test case.
- Record the raw response (or key fields — not dumping multi-KB JSON).
- Classify: **covered** (API returned useful, informative data), **partially covered** (API returned data but it's ambiguous/incomplete), **not covered** (API returned nothing, error, or uninformative result).
- For each relevant field in the response, note whether it's useful for the target KYC flag(s).

**For docs-only endpoints (Stripe prod AVS, Plaid prod, Google Places):**
- Read the official documentation thoroughly.
- Document the response schema, field meanings, and coverage claims.
- Use documentation + known coverage matrices to estimate covered/not-covered for the test cases.
- Flag where documentation is insufficient to assess.

**For the LLM+Exa web search tool (standalone):**
- For each of the 5 KYC measures, write a targeted search prompt.
- Run the LLM+Exa loop on 20-30 test cases from the test set.
- Record what the search found, how long it took, whether it answered the flag question.
- This is the "can an LLM with web search substitute for a structured API?" comparison.

**Rate limit management:**
- Smarty: 250/month free tier. Budget 50 calls across all test sets that need Smarty. Prioritize adversarial cases.
- Companies House: 600/5min — no issue.
- OSM Overpass: prone to 429s — add 2s delay between calls, retry with backoff.
- Free APIs (ROR, GLEIF, etc.): no hard limits but be respectful.

**Output per endpoint:** `tool-evaluation/results/{endpoint-id}.yaml` + `tool-evaluation/results/{endpoint-id}.md` (human-readable summary)

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
    notes: ""
    
  - case_id: 2
    query: "Genspace"
    status: not_covered
    response_summary: "No results returned"
    notes: "Community bio lab not in ROR. Would need alternative data source."
```

---

### Stage 4 — Field-level assessment & flag mapping

**Scope:** One sub-agent per KYC step (5 agents in parallel).  
**Goal:** Synthesize the per-endpoint test results into a per-field assessment for each KYC flag.

**Inputs:**
- All `results/{endpoint-id}.yaml` files for endpoints relevant to this KYC step.
- The KYC step definition (flag triggers, follow-up actions from CSSWG table).
- The measure definitions from `measures.md`.

**Output per KYC step:** `tool-evaluation/assessments/{kyc-step}.yaml` + `.md`

**YAML schema for per-field assessment:**

```yaml
kyc_step: a-address-to-institution
measure: M05
flag: "No public association between affiliation and shipping address"
follow_up: "Follow-up if any other flag raised"

endpoints_evaluated:
  - endpoint: ror
    fields:
      - field: addresses[].city
        description: "City where the institution is located, from ROR's curated database"
        useful_for_flag: partial
        good_examples:
          - "MIT — ROR returns 'Cambridge, MA' which matches a Cambridge shipping address"
        partial_examples:
          - "Chinese Academy of Sciences — has 100+ campuses, ROR returns Beijing HQ only"
        not_covered_examples:
          - "Genspace (community lab) — not in ROR at all"
        geographic_coverage: "Strong OECD, weak Africa/Central Asia. ~110K orgs globally."
        automation_tier: rule_based
        automation_notes: "If ROR city == shipping city → pass. Else → escalate. Simple string match after normalization."
        false_positive_cases:
          - "Satellite campuses — institution in ROR with HQ city, researcher at satellite campus in different city"
          - "Recently relocated institutions"
        false_positive_fraction_estimate: "~10-15% of non-US academic orders"
        cost_per_call: "$0"
        
      - field: domains[]
        description: "Web domains associated with the institution"
        # ... same structure
        
  - endpoint: gleif
    fields:
      - field: entity.legalAddress
        # ...

flag_verdict:
  best_endpoint_combination: "ROR (city match) + GLEIF (street address for companies) + Smarty (address normalization)"
  coverage_summary: "Strong for established US/EU academic institutions. Weak for: community labs, non-US small companies, recently founded orgs, coworking tenants."
  automation_tier: mostly_rule_based
  automation_detail: |
    Tier 1 (auto-pass, ~50-60%): ROR city matches shipping city, or GLEIF street matches.
    Tier 2 (LLM can judge, ~25-30%): ROR city doesn't match but campus polygon contains address. Multi-campus institutions. Coworking/incubator addresses.
    Tier 3 (human follow-up, ~10-20%): Institution not in any registry. Address in different country from institution. Recently founded entities.
  estimated_review_time:
    tier_1: "0 min (auto)"
    tier_2: "2-5 min (LLM-assisted)"
    tier_3: "10-30 min (human follow-up with customer)"
  customer_types_that_fail:
    - category: "Community bio labs / makerspaces"
      fraction_of_orders: "~1-3%"
      why_fails: "Not in ROR, GLEIF, or Companies House"
      resolution: "LLM web search fallback or voucher-based"
    - category: "Researchers at satellite campuses"
      fraction_of_orders: "~5-10%"
      why_fails: "ROR only has HQ address"
      resolution: "OSM campus polygon check"
```

---

### Stage 5 — Adversarial review of assessments

**Scope:** One sub-agent per KYC step (5 agents in parallel). Each agent reviews a *different* KYC step's assessment (not the one it produced).  
**Goal:** Challenge the assessment — find missed edge cases, question the automation tier classifications, stress-test the false positive estimates.

**Tasks:**
1. For each field assessment: "What customer type would this fail on that isn't listed?"
2. For each automation tier: "Give me a concrete case where a rule-based approach would get it wrong."
3. For each coverage claim: "What's the weakest link in this evidence chain?"
4. For the overall flag verdict: "If I were trying to pass this check fraudulently, how would I do it?"

**Output:** `tool-evaluation/adversarial-reviews/{kyc-step}.md` — additions, corrections, and challenges to the stage 4 assessment.

The stage 4 agent then revises its assessment based on the adversarial review. One iteration only.

---

### Stage 6 — BOTEC cost & coverage synthesis

**Scope:** One dedicated agent. Sequential (after stages 4-5).  
**Goal:** Produce the quantitative estimates using predefined rules.

**Inputs:**
- All revised assessments from stage 4 (post adversarial review).
- Provider archetype definitions (predefined):
  - **US academic-heavy:** 70% US university, 15% US biotech, 10% international academic, 5% other
  - **Global pharma:** 40% US/EU pharma, 30% international pharma, 20% academic, 10% CRO/startup
  - **Mixed biotech:** 40% biotech startup, 25% academic, 20% pharma, 15% international
  - **Small provider:** 50% local academic, 30% small biotech, 20% varied

**For each provider archetype × each KYC step:**
1. Estimate what fraction of orders would: auto-pass, need LLM-assisted review, need human follow-up.
2. Estimate average review time for each tier.
3. Estimate API cost per order (sum of all endpoint calls).
4. Estimate total monthly cost for a provider processing 1,000 orders/month.

**Output:** `tool-evaluation/06-cost-coverage-synthesis.md` with tables.

This agent uses the qualitative findings from stage 4 + the predefined archetype distributions. It should NOT invent new coverage data — only combine what's already been measured.

---

### Stage 7 — Final synthesis

**Scope:** One agent. Sequential.  
**Goal:** Produce the final deliverable.

**Output:** `tool-evaluation/07-final-synthesis.md`

Contents:
1. **Executive summary** — For each of the 5 KYC steps: can we do it, what does it cost, what fraction of cases need human review.
2. **Per-KYC-step detail** — One section each with the flag verdict, endpoint recommendations, coverage map, automation tiers, cost estimate.
3. **Cross-cutting findings** — Shared endpoints, shared gaps, the "customer types that fail everything" list.
4. **LLM+search as alternative** — How did the standalone Exa-based approach compare to structured APIs?
5. **Credential gaps & next steps** — What we couldn't test and what's needed to test it.
6. **Open questions for the working group** — Things that came up during testing that affect the standard itself.

---

## Output directory structure

```
tool-evaluation/
  customers.csv                          # deanonymized test data
  00-endpoint-manifest.yaml              # stage 0
  00-credential-check.md                 # stage 0
  setup-guides/                          # stage 0 (for blocked endpoints)
    geonames.md
    google-places.md
  01-endpoint-relevance.md               # stage 1
  test-sets/                             # stage 2
    ror.yaml
    gleif.yaml
    smarty.yaml
    # ...one per endpoint
  results/                               # stage 3
    ror.yaml + ror.md
    gleif.yaml + gleif.md
    # ...one pair per endpoint
  assessments/                           # stage 4 (revised after stage 5)
    a-address-to-institution.yaml + .md
    b-payment-to-institution.yaml + .md
    c-email-to-affiliation.yaml + .md
    d-residential-address.yaml + .md
    e-po-box-freight.yaml + .md
  adversarial-reviews/                   # stage 5
    a-address-to-institution.md
    # ...
  06-cost-coverage-synthesis.md          # stage 6
  07-final-synthesis.md                  # stage 7
```

## Execution plan

| Stage | Agents | Parallelism | Depends on | Estimated effort |
|---|---|---|---|---|
| 0 — Credential check | 1 | Sequential | — | Light (API pings) |
| 1 — Relevance classification | 2 | Parallel | Stage 0 | Light (reading) |
| 2 — Test set construction | ~8 | Parallel | Stage 1 | Medium (Exa searches) |
| 3 — Endpoint testing | ~8 | Parallel | Stage 2 | Heavy (API calls + LLM search runs) |
| 4 — Field assessment | 5 | Parallel | Stage 3 | Medium (synthesis) |
| 5 — Adversarial review | 5 | Parallel | Stage 4 | Medium (critique + revision) |
| 6 — BOTEC synthesis | 1 | Sequential | Stage 5 | Light (arithmetic) |
| 7 — Final synthesis | 1 | Sequential | Stage 6 | Light (writing) |

## Verification

After the pipeline completes:
1. Check that every endpoint in the manifest has a corresponding results file.
2. Check that every assessment references real test results (not hallucinated).
3. Spot-check 2-3 API responses by re-running the calls manually.
4. Read the final synthesis and verify the cost numbers are internally consistent.

## Notes

- **Resumability:** Each stage writes its outputs before the next stage starts. If the pipeline is interrupted, re-run from the last incomplete stage. The YAML outputs are the source of truth; markdown summaries are derived.
- **Rate limit safety:** Stage 3 agents for rate-limited APIs (Smarty, OSM Overpass) should implement delays and respect the budget in the manifest.
- **No credential setup automation:** Stage 0 documents what's missing but does NOT create accounts or sign up for services. That's a manual step for Alejo.
- **LLM+Exa tool:** Runs as a standalone "endpoint" alongside the structured APIs. Uses Exa's neural search mode by default (better for finding institutional affiliations than keyword search). Each search prompt is measure-specific.
