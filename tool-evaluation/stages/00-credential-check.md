# Stage 0 — Credential check & endpoint classification

**Scope:** One agent, sequential.  
**Goal:** Verify every credential works. Classify each endpoint as: `live`, `docs-only`, or `blocked`. Document rate limits and set test budgets.  
**Depends on:** Nothing — this is the first stage.

## Tasks

1. Read `.env` and identify all KYC-related API credentials.
2. For each credentialed API: make one minimal test call, confirm it returns data.
3. For each free/no-auth API: make one minimal test call.
4. For blocked APIs (missing credentials): write setup guides in `00-setup-guides/`.
5. For each API: determine the rate limit (from docs or testing) and set a `max_test_budget` for stage 3.
6. Produce the endpoint manifest and credential check log.

## APIs to test

**Free / no-auth (network calls):**
- ROR API v2 — `curl "https://api.ror.org/v2/organizations?query=MIT"`
- GLEIF API — `curl "https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]=Google"`
- RDAP — `curl "https://rdap.org/domain/mit.edu"`
- OSM Overpass — `curl -d 'data=[out:json];node[name="MIT"][amenity=university];out;' "https://overpass-api.de/api/interpreter"`
- binlist.net — `curl "https://lookup.binlist.net/411111"`
- InCommon/eduGAIN — fetch federation metadata XML from `https://md.incommon.org/InCommon/InCommon-metadata.xml`
- NIH RePORTER — `curl "https://api.reporter.nih.gov/v2/projects/search" -d '{"criteria":{"org_names":["MASSACHUSETTS INSTITUTE OF TECHNOLOGY"]},"limit":1}'`
- NSF Awards — `curl "https://api.nsf.gov/services/v1/awards.json?keyword=MIT&printFields=id,title&offset=0&rpp=1"`
- UKRI Gateway — `curl "https://gtr.ukri.org/gtr/api/organisations?q=Oxford&s=0&p=1"` (Accept: application/json)
- EU CORDIS — `curl "https://cordis.europa.eu/api/search/project?q=contenttype%3D%27project%27%20AND%20organization%2Fname%3D%27Massachusetts%20Institute%20of%20Technology%27&format=json&num=1"`
- SEC EDGAR — `curl -H "User-Agent: KYC-Eval admin@example.com" "https://efts.sec.gov/LATEST/search-index?q=%22Pfizer%22&dateRange=custom&startdt=2024-01-01&forms=10-K"`
- PubMed (NCBI E-utilities) — `curl "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=MIT[Affiliation]&retmax=1&retmode=json"`
- OpenCorporates — `curl "https://api.opencorporates.com/v0.4/companies/search?q=ginkgo+bioworks"`
- ORCID public API — `curl -H "Accept: application/json" "https://pub.orcid.org/v3.0/search?q=affiliation-org-name:MIT&rows=1"`
- OpenAlex — `curl "https://api.openalex.org/institutions?search=MIT&per_page=1"`

**Credentialed:**
- Smarty — US Street API with auth_id + auth_token. `curl "https://us-street.api.smarty.com/street-address?auth-id=$SMARTY_AUTH_ID&auth-token=$SMARTY_AUTH_TOKEN&street=77+Massachusetts+Ave&city=Cambridge&state=MA&zipcode=02139"`
- Stripe test mode — `curl https://api.stripe.com/v1/tokens -u $STRIPE_TEST_SK: -d "card[number]=4242424242424242" -d "card[exp_month]=12" -d "card[exp_year]=2027" -d "card[cvc]=123"`
- Plaid sandbox — create a sandbox link token via API
- Companies House — `curl -u "$COMPANIES_HOUSE_API_KEY:" "https://api.company-information.service.gov.uk/search/companies?q=ginkgo"`
- Exa — `curl https://api.exa.ai/search -H "x-api-key: $EXA_API_KEY" -H "Content-Type: application/json" -d '{"query":"MIT biosafety","numResults":1}'`
- OpenRouter (for LLM+Exa script) — `curl -s https://openrouter.ai/api/v1/models -H "Authorization: Bearer $OPENROUTER_API_KEY" | python3 -c "import json,sys; d=json.load(sys.stdin); print('OK' if 'data' in d else d)"`
- LLM+Exa end-to-end — `uv run tool-evaluation/llm-exa-search.py --json "Is MIT located in Cambridge, MA?"`
- GeoNames — `curl "http://api.geonames.org/searchJSON?q=MIT&maxRows=1&username=$GEONAMES_USERNAME"`
- Google Places Text Search — `curl -H "X-Goog-Api-Key: $GOOGLE_MAPS_API_KEY" -H "X-Goog-FieldMask: places.displayName,places.formattedAddress,places.types,places.primaryType" -H "Content-Type: application/json" -d '{"textQuery":"Massachusetts Institute of Technology"}' "https://places.googleapis.com/v1/places:searchText"`
- Google Places Nearby Search — `curl -H "X-Goog-Api-Key: $GOOGLE_MAPS_API_KEY" -H "X-Goog-FieldMask: places.displayName,places.types,places.primaryType" -H "Content-Type: application/json" -d '{"includedTypes":["shipping_service"],"locationRestriction":{"circle":{"center":{"latitude":40.6602,"longitude":-73.7526},"radius":200}}}' "https://places.googleapis.com/v1/places:searchNearby"` (test with Elmont NY freight cluster coordinates)
- Melissa Global Address — `curl "https://address.melissadata.net/v3/WEB/GlobalAddress/doGlobalAddress?id=$MELISSA_LICENSE_KEY&a1=77+Massachusetts+Ave&ctry=US&loc=Cambridge&admarea=MA&postal=02139&format=json"` (requires free trial key from melissa.com)

**Local logic (verify the logic works, no network call):**
- Disposable/free-mail blocklist — test against a known disposable domain and a known legitimate domain
- MX/SPF/DMARC — `dig MX mit.edu`, `dig TXT mit.edu` (look for SPF), check DMARC at `_dmarc.mit.edu`
- Lookalike/homoglyph domain detector — test with `rnit.edu` vs `mit.edu` (homoglyph)
- PO Box regex — test patterns: "PO Box 123", "P.O. Box 456", "PMB 789", "APO AE 09001"
- BIS Country Group D/E — verify the country group lookup table is correct
- ISO 3166 normalization — test common variants: "USA" → "US", "United Kingdom" → "GB"
- Billing-shipping-institution consistency — verify comparison logic with sample addresses
- Fintech-neobank BIN denylist — verify against known Mercury/Brex BIN prefixes

**Docs-only (no test call, just note status):**
- Stripe AVS (production) — document that test mode is deterministic
- Plaid Identity Match (production) — document that sandbox is synthetic
- MaxMind minFraud / Binbase — document BIN database coverage, pricing, and field availability vs. binlist.net
- ORCID OAuth — document the OAuth flow for proof-of-control and what it adds beyond the public API (identity binding vs. association verification)

## Output: endpoint manifest

Write to `tool-evaluation/00-endpoint-manifest.yaml`.

**Manifest schema** — every endpoint gets these fields:

```yaml
endpoints:
  - id: ror
    name: Research Organization Registry
    url: https://api.ror.org/v2/organizations
    auth: none
    status: live                      # live | docs-only | blocked | local
    credential_env_var: null
    test_result: "OK — returned MIT record"
    rate_limit: "2000/5min (undocumented soft limit)"
    max_test_budget: 100              # max calls for this pipeline run (stage 3)
    cost_per_call: "$0"
    cost_source: "free API"
    measures: [M02, M05, M07, M12]
    kyc_steps: [a, c]
    group: institution-registry       # from 01-endpoint-map.md grouping
    notes: ""

  - id: smarty
    name: Smarty US Street API
    url: https://us-street.api.smarty.com/street-address
    auth: auth-id + auth-token query params
    status: live
    credential_env_var: SMARTY_AUTH_ID, SMARTY_AUTH_TOKEN
    test_result: ""
    rate_limit: "250 lookups/month (free tier)"
    max_test_budget: 50               # hard cap — free tier shared across months
    cost_per_call: "$0 (free tier) / $0.003-$0.009 (paid)"
    cost_source: "smarty.com pricing"
    measures: [M03, M04, M05]
    kyc_steps: [a, d, e]
    group: address-classification
    notes: "US addresses only. Prioritize adversarial cases — don't waste budget on easy ones."

  - id: google-places-new
    name: Google Places API (New)
    url: https://places.googleapis.com/v1/places:searchText
    auth: X-Goog-Api-Key header
    status: live
    credential_env_var: GOOGLE_MAPS_API_KEY
    test_result: ""
    rate_limit: "varies by endpoint — Text Search: no documented limit; Nearby Search: no documented limit"
    max_test_budget: 200              # $200/month free credit; ~$0.032/call = ~6,000 calls
    cost_per_call: "$0.032 (Text Search) / $0.032 (Nearby Search)"
    cost_source: "cloud.google.com/maps-platform/pricing"
    measures: [M04, M05]
    kyc_steps: [a, d]
    group: address-classification
    notes: "Use New API (not legacy). Two-step: Text Search to geocode → Nearby Search to find institutions near the address. primaryType field is the key signal."

  - id: geonames
    name: GeoNames geographic database
    url: http://api.geonames.org/
    auth: username query param
    status: live
    credential_env_var: GEONAMES_USERNAME
    test_result: ""
    rate_limit: "20,000 credits/day"
    max_test_budget: 200
    cost_per_call: "$0"
    cost_source: "free tier"
    measures: [M05]
    kyc_steps: [a]
    group: address-classification
    notes: "Coarser type taxonomy than Google Places. Useful for reverse geocoding and campus-center coordinates."

  # ... continue for all 31 endpoints from 01-endpoint-map.md
  # The agent should fill in ALL endpoints, including local logic ones
```

**Key fields the agent must determine:**
- `rate_limit`: From documentation or by testing (e.g., hit the API rapidly and see when it throttles).
- `max_test_budget`: How many calls stage 3 should make. Set based on rate limit, free tier constraints, and cost. For free unlimited APIs, set 100-200. For constrained APIs (Smarty: 250/month), set conservatively.

## Output: credential check log

Write to `tool-evaluation/00-credential-check.md` — a narrative log of each test call: what was sent, what came back, any issues. Include timestamps.

## Output: setup guides

For each blocked endpoint (if any remain after adding GeoNames and Google Places credentials), write to `tool-evaluation/00-setup-guides/{endpoint-id}.md`.
