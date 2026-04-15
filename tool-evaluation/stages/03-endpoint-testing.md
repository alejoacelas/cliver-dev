# Stage 3 — Endpoint testing

**Scope:** One sub-agent per endpoint. Up to 8 in parallel (respecting rate limits).  
**Goal:** Run every test case through the actual API. Record responses. Classify results.  
**Depends on:** Stage 2 (need the test sets).

## General protocol

For each test case in the endpoint's test set:

1. Construct the API call from `query_params`.
2. Make the call.
3. Record the key response fields (not raw multi-KB JSON — extract the fields that matter for the KYC flags).
4. Classify the result:
   - **covered** — API returned useful, informative data for the KYC flag(s).
   - **partially_covered** — API returned data but it's ambiguous, incomplete, or requires interpretation.
   - **not_covered** — API returned nothing, an error, or uninformative data.
5. For each relevant field, note whether it's useful for the target KYC flag(s) and why.

## Endpoint-specific instructions

### Live API endpoints

Make actual calls. Respect rate limits.

**Rate limit management:**
- **Smarty:** 250/month free tier. Budget **50 calls max** across all test sets that need Smarty (M03, M04, M05 share a test set). Prioritize adversarial/edge cases over easy cases. If budget runs out, note remaining cases as "not tested — budget exhausted."
- **Companies House:** 600/5min — no issue. Add 200ms delay between calls as courtesy.
- **OSM Overpass:** Prone to 429 errors. Add **2-second delay** between calls. On 429, wait 60 seconds and retry. Max 3 retries per case.
- **Free APIs (ROR, GLEIF, binlist, Screening List):** Add 500ms courtesy delays between calls.
- **RDAP:** Varies by registrar. Some throttle aggressively. Add 1s delays, retry on 429.
- **Exa:** Rate limits vary by plan. Start with 1s delays, back off on errors.

### Documentation-only endpoints

For `stripe-avs-prod`, `plaid-prod`, `google-places`:

1. Read the official documentation thoroughly (use WebFetch on docs URLs from the investigation files).
2. Document the response schema and field meanings.
3. Document the coverage claims (which countries, which card networks, which bank types).
4. For each test case, estimate whether it would be covered/partially/not based on the documentation.
5. Flag where documentation is insufficient to make an assessment.

Reference the existing investigation files:
- Stripe: `archive-2026-04-kyc-research/investigations/a-address-to-institution/08-stripe-avs.md`
- Plaid: `archive-2026-04-kyc-research/investigations/a-address-to-institution/09-plaid-identity-match.md`

### LLM+Exa web search (standalone tool)

This is tested as an endpoint in its own right — "can an LLM with web search answer the KYC flag question?"

For each of the 5 KYC steps, write a targeted search prompt:

**(a) Address → institution:** "Does the institution [X] have a presence at the address [Y]? Search for the institution's official address, campus locations, and any connection to [Y]."

**(b) Payment → institution:** "Is the billing entity [X] associated with the institution [Y]? Search for the institution's payment/procurement office, official billing addresses."

**(c) Email → affiliation:** "Does the email domain [X] belong to the institution [Y]? Search for the institution's official domains, email systems."

**(d) Residential address:** "Is the address [X] a residential address or a business/institutional address? Search for the address to determine its classification."

**(e) PO box / freight forwarder:** "Is the address [X] a PO box, mail forwarding service, or freight forwarder? Search for the address to determine its nature."

Run each prompt on 20-30 test cases from the relevant test sets. Record:
- The search queries Exa generated.
- The results returned.
- Whether the LLM reached a correct/confident answer to the flag question.
- How long the search loop took.
- Total Exa API cost for the batch.

### Stripe and Plaid test mode

For `stripe-test` and `plaid-sandbox`: make the actual calls to understand the response schema and field structure, but note in the results that the data is synthetic/deterministic and should not be used for coverage assessment.

For Stripe test mode, use the documented test card numbers:
- `4242424242424242` — Visa, US, passes AVS
- `4000000000000002` — Visa, US, card declined
- `4000000760000002` — Visa, BR (Brazil)
- Test with various address combinations to see what AVS codes come back.

For Plaid sandbox, use sandbox credentials to create a test link and retrieve Identity Match data.

## Output

Two files per endpoint:

### Structured results: `tool-evaluation/results/{endpoint-id}.yaml`

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
    api_call: "GET https://api.ror.org/v2/organizations?query=Indian+Institute+of+Technology+Kanpur"
    status: covered
    response_summary:
      ror_id: "https://ror.org/03f0f3294"
      name: "Indian Institute of Technology Kanpur"
      country: "India"
      city: "Kanpur"
      types: ["education", "facs"]
      domains: ["iitk.ac.in"]
      established: 1959
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
    api_call: "GET https://api.ror.org/v2/organizations?query=Genspace"
    status: not_covered
    response_summary: null
    relevant_fields: []
    notes: "Community bio lab not in ROR. Zero results returned."
```

### Human-readable summary: `tool-evaluation/results/{endpoint-id}.md`

```markdown
# ROR API — Test Results

**Tested:** 2026-04-14 | **Cases:** 35 | **Covered:** 22 (63%) | **Partial:** 5 (14%) | **Not covered:** 8 (23%)

## Coverage by category
| Category | Tested | Covered | Partial | Not covered |
|---|---|---|---|---|
| US academic | 8 | 8 | 0 | 0 |
| International academic | 7 | 5 | 1 | 1 |
| Biotech/pharma | 6 | 4 | 1 | 1 |
| Community lab | 4 | 0 | 1 | 3 |
| ...

## Key findings
- [Finding 1]
- [Finding 2]

## Notable edge cases
- [Case description and what happened]

## Fields useful for KYC flags
| Field | Useful for | Coverage quality |
|---|---|---|
| domains[] | M02 email domain match | Strong for academic, weak for companies |
| addresses[].city | M05 address-institution match | City-level only |
| ...
```
