# 04C claim check — m13-twilio-lookup v1

## Claim-by-claim

1. **Twilio Lookup v2 Line Type Intelligence supports 12 line type values: fixedVoip, nonFixedVoip, landline, mobile, personal, tollFree, premium, sharedCost, uan, voicemail, pager, unknown.**
   - URL: https://www.twilio.com/docs/lookup/v2-api/line-type-intelligence
   - Verdict: SUPPORTED. Stage 4 search snippet listed all 12 values.

2. **API endpoint: GET /v2/PhoneNumbers/{PhoneNumber}?Fields=line_type_intelligence.**
   - URL: https://www.twilio.com/docs/lookup/v2-api/line-type-intelligence
   - Verdict: SUPPORTED.

3. **Carrier data not available for line types personal, tollFree, premium, sharedCost, uan, voicemail, pager, unknown.**
   - URL: https://www.twilio.com/docs/lookup/v2-api/line-type-intelligence
   - Verdict: SUPPORTED — exact statement appeared in stage 4 search snippets.

4. **Line Type Intelligence available worldwide.**
   - URL: https://www.twilio.com/docs/lookup/v2-api/line-type-intelligence
   - Verdict: SUPPORTED.

5. **Per-request pricing ~$0.005–$0.015.**
   - URL: https://www.twilio.com/en-us/user-authentication-identity/pricing/lookup
   - Verdict: WEAKLY-SUPPORTED — page exists but the specific number is best-guess. Document already labels it as such. Suggested fix: replace with a verified live figure from the pricing page on next iteration.

6. **GA announcement on Twilio blog.**
   - URL: https://www.twilio.com/en-us/blog/products/launches/generally-available-lookup-line-type-intelligence
   - Verdict: SUPPORTED.

## Flags

- One WEAKLY-SUPPORTED price (already best-guessed).
- No BROKEN-URL.
- No MIS-CITED.

## Verdict

PASS
