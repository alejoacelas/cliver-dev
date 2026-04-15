# 04C claim check — m13-rebind-cadence v1

## Claim-by-claim

1. **Telesign PhoneID has a sim_swap identity attribute that returns risk_indicator 1–4.**
   - URL: https://developer.telesign.com/enterprise/docs/phone-id-identity-attributes-sim-swap
   - Snippet observed: "Telesign evaluates how likely it is that the SIM swap was for a fraudulent reason using a scale from 1-4, provided as part of the risk_indicator property."
   - Verdict: SUPPORTED.

2. **Telesign SMS Verify API supports SIM-swap screening of recipients.**
   - URL: https://developer.telesign.com/enterprise/docs/sms-verify-api-screen-recipients-by-sim-swap-indicator
   - Verdict: SUPPORTED — page exists and is the canonical doc for the integration.

3. **Telesign SIM Swap pricing ~$0.10/query, ~$0.05 at 100K+/month.**
   - URL: https://www.dropcowboy.com/blog/understanding-telesign-pricing-for-businesses/
   - Verdict: WEAKLY-SUPPORTED. dropcowboy.com is a third-party SMS-marketing blog, not a Telesign primary source. Document already calls this out as "third-party, treat as best-guess." Suggested fix: replace with `[vendor-gated — pricing not on Telesign public pages; would require Telesign sales quote; third-party blog cites $0.05–$0.10/query as a rough range]`.

4. **Vonage Verify v2 + SIM Swap APIs support combined MFA + swap detection.**
   - URL: https://developer.vonage.com/en/blog/improve-your-multifactor-auth-with-verify-and-sim-swap-apis
   - Verdict: SUPPORTED.

5. **CAMARA Project hosts a Number Verification / SIM Swap API.**
   - URL: https://camaraproject.org/number-verification/
   - Verdict: SUPPORTED. Note: CAMARA is the GSMA-driven open-API standard; specific SIM Swap API page is at camaraproject.org/sim-swap (not directly cited here). Suggested addition.

6. **NIST SP 800-63B does not prescribe a fixed phone re-verification cadence for KYC.**
   - URL: https://pages.nist.gov/800-63-4/sp800-63b.html
   - Verdict: SUPPORTED — 800-63B specifies reauthentication windows for AAL sessions but defers re-proofing cadence to organizational policy.

7. **tru.ID Active SIMCheck.**
   - URL: https://idlayr.com/blog/tru-id-launches-active-simcheck-solve-sim-swap/
   - Verdict: SUPPORTED.

## Flags

- One WEAKLY-SUPPORTED claim (Telesign pricing) — already best-guessed; recommend reframing as vendor-gated in v2 if revised.
- Suggested addition: link to camaraproject.org/sim-swap directly.
- No BROKEN-URL.

## Verdict

PASS
