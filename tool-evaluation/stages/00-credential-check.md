# Stage 0 — Credential check & endpoint classification

**Scope:** One agent, sequential.  
**Goal:** Verify every credential works. Classify each endpoint as: `live`, `docs-only`, or `blocked`.  
**Depends on:** Nothing — this is the first stage.

## Tasks

1. Read `.env` and identify all KYC-related API credentials.
2. For each credentialed API: make one minimal test call, confirm it returns data.
3. For each free/no-auth API: make one minimal test call.
4. For blocked APIs (missing credentials): write setup guides in `setup-guides/`.
5. Produce the endpoint manifest and credential check log.

### APIs to test

**Free / no-auth:**
- ROR API v2 — `curl "https://api.ror.org/v2/organizations?query=MIT"`
- GLEIF API — `curl "https://api.gleif.org/api/v1/lei-records?filter[entity.legalName]=Google"`
- RDAP — `curl "https://rdap.org/domain/mit.edu"`
- Consolidated Screening List — `curl "https://api.trade.gov/v1/consolidated_screening_list/search?api_key=$SCREENING_LIST_API_KEY&q=test"`
- OSM Overpass — `curl -d 'data=[out:json];node[name="MIT"][amenity=university];out;' "https://overpass-api.de/api/interpreter"`
- binlist.net — `curl "https://lookup.binlist.net/411111"`
- InCommon/eduGAIN — fetch federation metadata XML

**Credentialed:**
- Smarty — US Street API with auth_id + auth_token
- Stripe test mode — create a test PaymentMethod or retrieve a test charge
- Plaid sandbox — create a sandbox link token
- Companies House — `curl -u "$COMPANIES_HOUSE_API_KEY:" "https://api.company-information.service.gov.uk/search/companies?q=test"`
- Exa — `curl -H "x-api-key: $EXA_API_KEY" -d '{"query":"test","numResults":1}' "https://api.exa.ai/search"`

**Blocked (write setup guides):**
- GeoNames — needs account + web services enabled. Reuse instructions from `archive-2026-04-kyc-research/investigations/a-address-to-institution/00-api-key-setup.md`.
- Google Places — needs Google Cloud API key with Places API enabled.
- BinDB — optional, paid.

## Output: endpoint manifest

Write to `tool-evaluation/00-endpoint-manifest.yaml`:

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

  - id: gleif
    name: Global Legal Entity Identifier Foundation
    url: https://api.gleif.org/api/v1/lei-records
    auth: none
    status: live
    credential_env_var: null
    test_result: ""                 # fill after testing
    rate_limit: "undocumented"
    cost_per_call: "$0"
    cost_source: "free API"
    measures: [M05, M12]
    ideas: [m05-ror-gleif-canonical]
    free_tier_budget: null
    notes: ""

  - id: rdap
    name: RDAP/WHOIS domain lookup
    url: https://rdap.org/domain/{domain}
    auth: none
    status: live
    credential_env_var: null
    test_result: ""
    rate_limit: "varies by registrar"
    cost_per_call: "$0"
    cost_source: "protocol standard"
    measures: [M02]
    ideas: [m02-rdap-age]
    free_tier_budget: null
    notes: ""

  - id: screening-list
    name: Consolidated Screening List (trade.gov)
    url: https://api.trade.gov/v1/consolidated_screening_list/search
    auth: api_key query param
    status: live
    credential_env_var: SCREENING_LIST_API_KEY
    test_result: ""
    rate_limit: "undocumented"
    cost_per_call: "$0"
    cost_source: "free government API"
    measures: [M06]
    ideas: [m06-bis-entity-list]
    free_tier_budget: null
    notes: "Covers OFAC SDN, BIS Entity List, DPL, UVL, MEU"

  - id: osm-overpass
    name: OpenStreetMap Overpass API
    url: https://overpass-api.de/api/interpreter
    auth: none
    status: live
    credential_env_var: null
    test_result: ""
    rate_limit: "~4 queries before 429; add 2s delays"
    cost_per_call: "$0"
    cost_source: "community infrastructure"
    measures: [M05]
    ideas: [m05-ror-gleif-canonical]
    free_tier_budget: null
    notes: "Rate limiting aggressive — retry with exponential backoff"

  - id: binlist
    name: binlist.net BIN lookup
    url: https://lookup.binlist.net/{bin}
    auth: none
    status: live
    credential_env_var: null
    test_result: ""
    rate_limit: "10/min (undocumented)"
    cost_per_call: "$0"
    cost_source: "free community API"
    measures: [M10]
    ideas: [m10-binlist-stack]
    free_tier_budget: null
    notes: "Missing many fintech/prepaid BINs"

  - id: incommon
    name: InCommon/eduGAIN federation
    url: https://md.incommon.org/InCommon/InCommon-metadata.xml
    auth: none
    status: live
    credential_env_var: null
    test_result: ""
    rate_limit: "static file"
    cost_per_call: "$0"
    cost_source: "federation metadata"
    measures: [M07]
    ideas: [m07-incommon-edugain]
    free_tier_budget: null
    notes: "XML metadata — parse for entityID and domain"

  - id: smarty
    name: Smarty US Street API
    url: https://us-street.api.smarty.com/street-address
    auth: auth-id + auth-token query params
    status: live
    credential_env_var: SMARTY_AUTH_ID, SMARTY_AUTH_TOKEN
    test_result: ""
    rate_limit: "250 lookups/month (free tier)"
    cost_per_call: "$0.003-$0.009 (paid); free tier 250/mo"
    cost_source: "smarty.com pricing"
    measures: [M03, M04, M05]
    ideas: [m03-smarty-melissa, m04-usps-rdi]
    free_tier_budget: "250 lookups/month — budget 50 calls for this pipeline"
    notes: "US addresses only. Returns RDI, CMRA, DPV, vacancy."

  - id: stripe-test
    name: Stripe test mode
    url: https://api.stripe.com/v1/
    auth: Bearer token (secret key)
    status: live
    credential_env_var: STRIPE_TEST_SK
    test_result: ""
    rate_limit: "25/sec test mode"
    cost_per_call: "$0"
    cost_source: "test mode is free"
    measures: [M10, M12]
    ideas: [m10-stripe-funding, m12-psp-avs]
    free_tier_budget: null
    notes: "Deterministic AVS responses in test mode — useful for schema validation, not coverage testing"

  - id: stripe-avs-prod
    name: Stripe AVS (production)
    url: https://api.stripe.com/v1/
    auth: Bearer token
    status: docs-only
    credential_env_var: null
    test_result: "N/A — documentation review only"
    rate_limit: "N/A"
    cost_per_call: "included in Stripe processing fee"
    cost_source: "stripe.com docs"
    measures: [M12]
    ideas: [m12-psp-avs]
    free_tier_budget: null
    notes: "Live AVS varies by issuer and country. Use docs + coverage matrices."

  - id: plaid-sandbox
    name: Plaid sandbox
    url: https://sandbox.plaid.com/
    auth: client_id + secret
    status: live
    credential_env_var: PLAID_CLIENT_ID, PLAID_SECRET
    test_result: ""
    rate_limit: "unlimited in sandbox"
    cost_per_call: "$0"
    cost_source: "sandbox is free"
    measures: [M12]
    ideas: [m12-psp-avs]
    free_tier_budget: null
    notes: "Synthetic data — useful for schema validation, not coverage testing"

  - id: plaid-prod
    name: Plaid Identity Match (production)
    url: https://production.plaid.com/
    auth: client_id + secret
    status: docs-only
    credential_env_var: null
    test_result: "N/A — documentation review only"
    rate_limit: "N/A"
    cost_per_call: "$0.20-$1.00"
    cost_source: "plaid.com pricing"
    measures: [M12]
    ideas: [m12-psp-avs]
    free_tier_budget: null
    notes: "US bank accounts only. Production access requires approval."

  - id: companies-house
    name: UK Companies House
    url: https://api.company-information.service.gov.uk/
    auth: HTTP Basic (API key as username)
    status: live
    credential_env_var: COMPANIES_HOUSE_API_KEY
    test_result: ""
    rate_limit: "600 req/5min"
    cost_per_call: "$0"
    cost_source: "free government API"
    measures: [M05, M12]
    ideas: [m05-ror-gleif-canonical]
    free_tier_budget: null
    notes: "UK-registered entities only (~5.5M)"

  - id: exa
    name: Exa neural search
    url: https://api.exa.ai/search
    auth: x-api-key header
    status: live
    credential_env_var: EXA_API_KEY
    test_result: ""
    rate_limit: "varies by plan"
    cost_per_call: "~$0.01-$0.05 per search"
    cost_source: "exa.ai pricing"
    measures: [M02, M03, M04, M05, M12]
    ideas: [llm-exa-search-standalone]
    free_tier_budget: null
    notes: "Standalone LLM+search tool — alternative to structured APIs"

  - id: geonames
    name: GeoNames geographic database
    url: http://api.geonames.org/
    auth: username query param
    status: blocked
    credential_env_var: GEONAMES_USERNAME
    test_result: "N/A — no credentials"
    rate_limit: "20,000 credits/day"
    cost_per_call: "$0"
    cost_source: "free tier"
    measures: [M05]
    ideas: [m05-ror-gleif-canonical]
    free_tier_budget: "20,000 credits/day"
    notes: "Needs account creation + web services enabled"

  - id: google-places
    name: Google Places API
    url: https://maps.googleapis.com/maps/api/place/
    auth: API key
    status: blocked
    credential_env_var: GOOGLE_PLACES_API_KEY
    test_result: "N/A — no credentials"
    rate_limit: "varies"
    cost_per_call: "$0.017 per request"
    cost_source: "cloud.google.com pricing"
    measures: [M04]
    ideas: [m04-google-places-business]
    free_tier_budget: "$200/month free credit"
    notes: "Needs Google Cloud project + Places API enabled. Docs sufficient for coverage assessment."

  # Local logic — no API calls needed
  - id: pobox-regex
    name: PO Box regex detection
    url: null
    auth: none
    status: live
    credential_env_var: null
    test_result: "N/A — local regex"
    rate_limit: null
    cost_per_call: "$0"
    cost_source: "local computation"
    measures: [M03]
    ideas: [m03-pobox-regex-sop]
    free_tier_budget: null
    notes: "Regex patterns for PO Box, APO/FPO, PMB. No API needed."

  - id: iso-country
    name: ISO 3166 country normalization
    url: null
    auth: none
    status: live
    credential_env_var: null
    test_result: "N/A — local logic"
    rate_limit: null
    cost_per_call: "$0"
    cost_source: "local computation"
    measures: [M06]
    ideas: [m06-iso-country-normalize]
    free_tier_budget: null
    notes: "Country code normalization + sanctioned territory lookup. No API needed."
```

## Output: credential check log

Write to `tool-evaluation/00-credential-check.md` — a narrative log of each test call: what was sent, what came back, any issues. Include timestamps.

## Output: setup guides

For each blocked endpoint, write to `tool-evaluation/setup-guides/{endpoint-id}.md` with:
1. What the API does and why we need it.
2. Signup URL.
3. Step-by-step instructions.
4. Expected env vars to set.
5. How to verify the credential works.

Reuse content from `archive-2026-04-kyc-research/investigations/a-address-to-institution/00-api-key-setup.md` where applicable.
