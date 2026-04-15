# 04C claim check — m10-binlist-stack v1

## Claims verified

1. **binlist.net is free, returns prepaid boolean, has rate limit.** Confirmed by search results: "service is free as long as you don't have more than 10 requests per minute" and "API's response includes a 'prepaid' field that can identify whether a card is prepaid or not." PASS.

2. **binlist.net rate-limit conflicting numbers (5/hour vs 10/minute).** Document reports both honestly. The search results literally surface both: "throttled at 5 per hour with a burst allowance of 5, according to the official binlist.net documentation. However, one source mentions requests are throttled at 10 per minute." PASS.

3. **binlist.net ceased updates and users must transition by August 15, 2023.** Confirmed by search result. The cited URL is a Scribd-hosted copy of the transition notice — UPGRADE-SUGGESTED to find the original notice on binlist.net or its successor IIN List service.

4. **BinDB advertises 12,000+ prepaid/virtual/gift card identifications, with reloadable distinction.** Confirmed by search results: "BinDB can currently identify over 12,000 different prepaid, virtual and gift cards. Extended Prepaid, Gift and Virtual cards detection includes Reloadable and Non-Reloadable cards." PASS.

5. **BinDB monthly updates.** Confirmed: "Monthly updates provide high-level of accuracy." PASS.

6. **BinDB pricing not publicly listed per call.** Confirmed: "While the search results reference a pricing page, the specific pricing details aren't fully displayed... For detailed pricing information, you would need to visit their pricing page directly at bindb.com/pricing." Valid `[vendor-gated]` admission. PASS.

7. **NeutrinoAPI returns `is-prepaid` boolean field.** Confirmed: "NeutrinoAPI's BIN Lookup API includes a boolean field called 'is-prepaid' to help with card categorization." PASS.

## Flags

- **UPGRADE-SUGGESTED** — replace Scribd citation for the binlist.net transition notice with the canonical source if it can be found (likely a binlist.net page or successor IIN List page).
- **UPGRADE-SUGGESTED** — Visa/Mastercard 8-digit BIN expansion claim is `[best guess]` but is well-documented public industry guidance and could be cited to a Visa or Mastercard product bulletin.

No BROKEN-URL, MIS-CITED, or OVERSTATED.

**Verdict:** PASS.
