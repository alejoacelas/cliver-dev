# 04C claim check — m13-telesign-phoneid v1

## Claim-by-claim

1. **PhoneID returns phone_type with MOBILE/LANDLINE/FIXED VOIP/NON-FIXED VOIP/etc.**
   - URL: https://developer.telesign.com/enterprise/docs/phone-id-get-started
   - Verdict: SUPPORTED (canonical Telesign developer docs).

2. **Score API returns risk.score 0–1000, risk.level, risk.recommendation.**
   - URL: https://developer.telesign.com/enterprise/docs/score-api-get-started
   - Snippet observed in stage 4 search: "risk.score is a measure… on a scale that ranges from zero to 1000, where a higher value indicates a higher risk… risk.level… risk.recommendation."
   - Verdict: SUPPORTED.

3. **PhoneID pricing $0.005–$0.011 per request.**
   - URL: https://www.dropcowboy.com/blog/how-much-does-telesign-cost/
   - Verdict: WEAKLY-SUPPORTED. dropcowboy is a third-party blog; document already marks as best-guess. Suggested fix: weaken to `[best guess: $0.005–$0.011 per request based on third-party summaries; not on Telesign public pricing page]`.

4. **SIM-swap add-on ~$0.10/query, full-service-only.**
   - URL: https://www.dropcowboy.com/blog/understanding-telesign-pricing-for-businesses/
   - Verdict: WEAKLY-SUPPORTED — same caveat.

5. **PhoneID listed on RapidAPI marketplace.**
   - URL: https://rapidapi.com/telesign/api/telesign-phoneid/pricing
   - Verdict: SUPPORTED.

6. **Porting Status and SIM Swap add-on docs on developer.telesign.com.**
   - URLs: https://developer.telesign.com/enterprise/docs/phoneid-api-add-ons-porting-status, https://developer.telesign.com/enterprise/docs/phone-id-identity-attributes-sim-swap
   - Verdict: SUPPORTED.

## Flags

- Two WEAKLY-SUPPORTED pricing claims (already best-guessed).
- No BROKEN-URL.
- No MIS-CITED.

## Verdict

PASS
