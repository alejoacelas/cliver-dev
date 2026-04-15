# OpenCorporates API — Setup Guide

## Status: BLOCKED (API requires paid account)

## What happened
The OpenCorporates API v0.4 now requires authentication. Free-tier unauthenticated access returns HTTP 401. This is a change from the previous behavior documented in our research.

## What's needed
1. **Register for an API account** at https://opencorporates.com/api_accounts/new
2. **Pricing:** Plans start at ~$50/month for basic API access. "Starter" tier includes 1,000 requests/month.
3. **Add to .env:** `OPENCORPORATES_API_KEY=<your-key>`
4. **Auth method:** Append `?api_token=<key>` to API URLs.

## What it would test
- Corporate registry data across 140+ jurisdictions
- Extends Companies House coverage beyond the UK
- Key for detecting shell companies, recently incorporated entities, and non-OECD corporate registrations
- KYC step (a): address-to-institution for corporate entities

## Workaround
The OpenCorporates website (opencorporates.com) still allows manual searches. For manual/spot checks during testing, web search can substitute. For automated pipeline use, the paid API is required.

## Impact on assessment
Without OpenCorporates, the institution-registry group loses its only multi-jurisdiction corporate registry. Companies House covers UK only, GLEIF covers entities with LEIs (biased toward financial). This creates a gap for non-UK, non-financial corporate entities — particularly small biotech companies in non-OECD countries.
