# 4F Form check — m16-spycloud-breach v1

| Field | Verdict | Notes |
|---|---|---|
| name / measure / modes / summary | PASS | three vendors named, mechanism concrete |
| attacker_stories_addressed | PASS | maps to credential-compromise, account-hijack methods, with explicit non-coverage of AitM |
| external_dependencies | PASS | SpyCloud, Constella, HIBP, internal IdP all named with cites |
| endpoint_details | PASS | HIBP fully documented; SpyCloud/Constella vendor-gated with public visible parts; rate limits and pricing explicitly vendor-gated |
| fields_returned | PASS | concrete field lists for all three with vendor-described markers |
| marginal_cost_per_check | PASS | HIBP $0; SpyCloud/Constella best-guess with reasoning; setup-cost best guess |
| manual_review_handoff | PASS | 7-step SOP including periodic sweep |
| flags_thrown | PASS | 4 distinct flags including infostealer escalation |
| failure_modes_requiring_review | PASS | 5 modes incl. legal/privacy concerns |
| false_positive_qualitative | PASS | 3 categories |
| record_left | PASS | per-check log + IdP event + cross-link to order |

## For 4C to verify

- HIBP k-anonymity range endpoint average ~478 hash suffixes — verify [Troy Hunt's k-anonymity post](https://www.troyhunt.com/understanding-have-i-been-pwneds-use-of-sha-1-and-k-anonymity/).
- SpyCloud Consumer ATO API supports lookups by email/username/phone/IP/partial-password-hash — verify [SpyCloud Consumer ATO product page](https://spycloud.com/products/consumer-ato-prevention/).
- SpyCloud pricing is "contact sales" — verify [SpyCloud pricing page](https://spycloud.com/pricing/).
- Constella Identity Intelligence API claim of 1T+ records — verify [Constella API page](https://constella.ai/data/intelligence-api/).
- Constella supports IdP integration triggering "password resets, session invalidations, MFA re-enrollment" — verify quoted text on [Constella API datasheet](https://constella.ai/intelligence-api-datasheet/).
- HIBP API v3 endpoint URL — verify [haveibeenpwned.com/api/v3](https://haveibeenpwned.com/api/v3).

## Verdict

**PASS**
