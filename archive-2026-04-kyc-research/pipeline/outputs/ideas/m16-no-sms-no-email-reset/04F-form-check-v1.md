# 4F Form check — m16-no-sms-no-email-reset v1

| Field | Verdict | Notes |
|---|---|---|
| name / measure / modes / summary | PASS | concrete policy + concrete mechanism |
| attacker_stories_addressed | PASS | maps to specific bypass methods in account-hijack, credential-compromise, dormant-account-takeover |
| external_dependencies | PASS | IdP, hardware-token program, IDV, help-desk SOP all named |
| endpoint_details | PASS | this is a config + policy idea, no SaaS endpoint; Okta + Auth0 config paths cited; standards anchors (NIST, CISA) cited |
| fields_returned | PASS-with-caveat | IdP audit-log event names listed as best-guess with searches noted |
| marginal_cost_per_check | PASS | per-recovery best guess, setup-cost best guess, both with reasoning |
| manual_review_handoff | PASS | 6-step SOP with concrete actions |
| flags_thrown | PASS | 5 distinct flags w/ actions |
| failure_modes_requiring_review | PASS | 5 modes incl. social engineering, vendor outage, accessibility |
| false_positive_qualitative | PASS | 4 categories |
| record_left | PASS-with-caveat | retention period explicitly marked unknown with search list |

## For 4C to verify

- NIST SP 800-63B-4 classifying SMS as a "restricted authenticator" — verify [pages.nist.gov/800-63-4/sp800-63b.html](https://pages.nist.gov/800-63-4/sp800-63b.html) and the [TypingDNA explainer](https://blog.typingdna.com/nist-sp-800-63b-rev-4-sms-otp-is-now-a-restricted-authenticator-but-we-have-the-fix/).
- CISA Mobile Communications Best Practices (Dec 2024) saying "do not use SMS as a second factor" — verify [the PDF](https://www.cisa.gov/sites/default/files/2024-12/joint-guidance-mobile-communications-best-practices_v2.pdf).
- CISA Phishing-Resistant MFA fact sheet "disable SMS for each account" — verify [the PDF](https://www.cisa.gov/sites/default/files/publications/fact-sheet-implementing-phishing-resistant-mfa-508c.pdf).
- Okta SMS authenticator can be set Inactive — verify [Okta SMS MFA docs](https://help.okta.com/en-us/content/topics/security/mfa/sms.htm).

## Verdict

**PASS** — every required field is substantively populated or has an explicit unknown / vendor-gated admission.
