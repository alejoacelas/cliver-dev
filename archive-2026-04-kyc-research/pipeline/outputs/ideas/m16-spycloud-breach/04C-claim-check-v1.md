# 4C Claim check — m16-spycloud-breach v1

| Claim | URL | Verdict | Notes |
|---|---|---|---|
| HIBP range endpoint returns ~478 hash suffixes on average | https://www.troyhunt.com/understanding-have-i-been-pwneds-use-of-sha-1-and-k-anonymity/ | PASS | Troy Hunt's blog explicitly cites the average and the smallest/largest range counts. |
| HIBP k-anonymity model preserves password privacy | https://blog.cloudflare.com/validating-leaked-passwords-with-k-anonymity/ | PASS | Cloudflare's blog walks through k-anonymity exactly as described. |
| HIBP Pwned Passwords range API endpoint URL is public, no auth | https://haveibeenpwned.com/api/v3 | PASS | API v3 doc page describes the range endpoint and that Pwned Passwords range is auth-free. |
| SpyCloud Consumer ATO supports lookup by email/username/phone/IP/partial password hash | https://spycloud.com/products/consumer-ato-prevention/ | PASS | Product page describes these lookup types. |
| SpyCloud advertises "high-volume REST-based APIs" | https://spycloud.com/products/spycloud-api/ | PASS | API product page uses this language. |
| SpyCloud pricing is "contact us for a quote" / tiered by accounts | https://spycloud.com/pricing/ + https://www.g2.com/products/spycloud/pricing | PASS | Pricing page is sales-contact only; G2 confirms tiered model. |
| Constella claims 1 trillion+ records | https://constella.ai/data/intelligence-api/ | PASS | Marketing page makes the 1T+ claim. |
| Constella triggers downstream "password resets, session invalidations, MFA re-enrollment" via integrations | https://constella.ai/intelligence-api-datasheet/ | PASS | Datasheet describes these downstream automation patterns. |
| Constella SDKs in Python/JS/Go | https://constella.ai/intelligence-api-datasheet/ | PASS | Listed on the datasheet page. |
| SpyCloud per-lookup amortized cost ~ $0.001–$0.01 | (best guess, vendor-gated) | PASS-as-best-guess | Explicitly marked best guess with reasoning. |

No `BROKEN-URL`, `MIS-CITED`, or `OVERSTATED` flags.

## Verdict

**PASS**
