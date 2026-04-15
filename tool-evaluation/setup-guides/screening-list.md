# Consolidated Screening List API — Setup Guide

## Status: BLOCKED (API endpoint deprecated/migrated)

## What happened
The Consolidated Screening List API at `api.trade.gov/v1/consolidated_screening_list/search` now returns HTTP 301 redirect to the developer.trade.gov HTML portal. The v2 gateway endpoint also returns HTML instead of JSON. The API key in `.env` (SCREENING_LIST_API_KEY) is valid but the endpoint is non-functional.

## What's needed
1. **Check for new endpoint:** The ITA Data Services Platform at developer.trade.gov may have a new API location. Register at https://developer.trade.gov/ and check current documentation.
2. **Alternative: OFAC bulk download:** Download the SDN list directly from https://sanctionssearch.ofac.treas.gov/ or https://www.treasury.gov/ofac/downloads/ in CSV/XML format. Process locally.
3. **Alternative: opensanctions.org API:** Open-source consolidated sanctions data with API access.

## What it would test
- OFAC SDN (Specially Designated Nationals)
- BIS Entity List, Denied Persons List, Unverified List, Military End-User List
- Catches denied parties/entities at the shipping address
- KYC step (e): PO box / freight forwarder / export control

## Impact on assessment
The Screening List is the primary tool for export control entity screening. Without it, step (e) relies on BIS country groups (country-level, not entity-level), PO Box regex, and Smarty CMRA. Entity-level screening — the most important export control check — is untested. This is a significant gap.

## Workaround for pipeline
Use the Smarty, PO Box regex, BIS country groups, and ISO normalization endpoints for step (e). Document the Screening List gap as a critical untested component in the final synthesis.
