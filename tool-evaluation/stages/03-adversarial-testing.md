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
- The relevant `07-synthesis.md` files from the archive (known coverage gaps from desk research).
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

Use your own web search capabilities (not Exa — that's reserved for the LLM+Exa standalone endpoint testing) to find adversarial cases. Good search strategies:

- `"community bio lab" [country]` — find community labs in specific regions
- `site:igem.org [country] team` — find iGEM teams at unusual institutions
- `"biotech startup" founded 2025 [country]` — find recently founded companies
- `"coworking lab" OR "shared lab space" [city]` — find coworking lab addresses
- Search the info sources listed in the stage 2 seed cases file

## The LLM+Exa standalone endpoint

The LLM+Exa group has a different protocol. Instead of calling a structured API, you're testing whether an LLM with web search can answer the KYC flag question:

For each of the 5 KYC steps, write a targeted prompt and run it against 20-30 test cases (drawn from the seed cases and your own adversarial cases):

- **(a):** "Does institution [X] have a presence at address [Y]? Search for the institution's official address, campus locations, and any connection to this address."
- **(b):** "Is the billing entity [X] associated with institution [Y]? Search for the institution's payment office, official billing addresses."
- **(c):** "Does the email domain [X] belong to institution [Y]? Search for the institution's official domains and email systems."
- **(d):** "Is the address [X] residential or business/institutional? Search for the address to determine its classification."
- **(e):** "Is the address [X] a PO box, mail forwarding service, or freight forwarder?"

Record: what Exa found, whether the LLM reached a correct/confident verdict, how long it took, and the Exa API cost.

## Output

Two files per endpoint group:

### Structured results: `tool-evaluation/results/{group-name}.yaml`

```yaml
group: institution-registry
endpoints: [ror, gleif, companies-house, opencorporates]
kyc_steps: [a]
tested_at: "2026-04-14"
total_cases: 38
rounds: 3

summary:
  covered: 22
  partially_covered: 8
  not_covered: 8

coverage_boundaries:
  - boundary: "Community bio labs / makerspaces"
    status: not_covered
    evidence: "Tested 5 community labs (Genspace, BioCurious, La Paillasse, Open Science Network, Bosslab). None in ROR, none in GLEIF, none in Companies House. OpenCorporates had 2/5."
    cases: [12, 15, 18, 22, 25]
  - boundary: "Non-OECD academic institutions"
    status: partially_covered
    evidence: "ROR covered 4/6 African universities but missed 2 recently founded ones. GLEIF had 0/6."
    cases: [8, 9, 14, 19, 27, 31]

results:
  - case_id: 1
    round: 1
    name: "Massachusetts Institute of Technology"
    type: academic
    country: US
    difficulty: easy
    endpoints_tested:
      - endpoint: ror
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
      - endpoint: gleif
        query: "GET https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]=Massachusetts+Institute+of+Technology"
        status: covered
        response_summary:
          lei: "..."
          legal_address: "77 Massachusetts Avenue, Cambridge, MA 02139"
        relevant_fields:
          - field: entity.legalAddress
            useful_for: [a-address-institution]
            assessment: "Street-level match — full address available"
    notes: "Baseline easy case. Both ROR and GLEIF cover it well."

  - case_id: 12
    round: 2
    name: "Genspace"
    type: community_lab
    country: US
    difficulty: hard
    # ... adversarial case with detailed results
```

### Human-readable summary: `tool-evaluation/results/{group-name}.md`

```markdown
# Institution Registry — Test Results

**Tested:** 2026-04-14 | **Cases:** 38 (3 rounds) | **Covered:** 22 (58%) | **Partial:** 8 (21%) | **Not covered:** 8 (21%)

## Coverage boundaries found

### 1. Community bio labs / makerspaces — NOT COVERED
Tested 5 community labs. None appeared in ROR or GLEIF. OpenCorporates had 2/5.
Evidence: [case 12, 15, 18, 22, 25]

### 2. Non-OECD academic institutions — PARTIALLY COVERED
ROR covered 4/6 African universities but missed 2 recently founded ones.
Evidence: [case 8, 9, 14, 19, 27, 31]

## Iteration log

### Round 1 (seed cases 1-8)
Ran 8 seed cases. 6 covered, 1 partial, 1 not covered. Confirmed ROR is strong for established universities, weak for non-academic entities. Decided to probe: community labs, non-OECD, recently founded.

### Round 2 (cases 9-25)
Targeted community labs and non-OECD institutions. Found the community lab boundary — none in any registry. African universities hit-or-miss in ROR. Decided to probe: name changes, multi-campus, coworking tenants.

### Round 3 (cases 26-38)
...

## Key fields and their usefulness
| Endpoint | Field | Useful for flag | Coverage quality |
|---|---|---|---|
| ROR | domains[] | (c) email match | Strong for academic, weak for companies |
| ROR | addresses[].city | (a) address match | City-level only — insufficient for street-level |
| GLEIF | entity.legalAddress | (a) address match | Street-level but only for entities with LEI |
| ...

## What I'd test with more budget
- [Cases I ran out of budget to test]
```
