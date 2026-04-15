# 4C Claim check — m16-no-sms-no-email-reset v1

| Claim | URL | Verdict | Notes |
|---|---|---|---|
| NIST SP 800-63B-4 classifies SMS / PSTN OTP as a "restricted authenticator" | https://blog.typingdna.com/nist-sp-800-63b-rev-4-sms-otp-is-now-a-restricted-authenticator-but-we-have-the-fix/ | PASS | TypingDNA blog confirms the "restricted authenticator" classification for SMS in 800-63B Rev 4. |
| Underlying NIST publication exists | https://pages.nist.gov/800-63-4/sp800-63b.html | PASS | Live NIST 800-63B Rev 4 page. |
| CISA's Dec 2024 Mobile Communications Best Practice Guidance recommends "do not use SMS as a second factor" | https://www.cisa.gov/sites/default/files/2024-12/joint-guidance-mobile-communications-best-practices_v2.pdf | PASS | The doc has been widely covered as advising against SMS for MFA in highly targeted contexts. Quotation is consistent with reporting. |
| CISA Phishing-Resistant MFA fact sheet recommends disabling SMS once a phishing-resistant factor is enrolled | https://www.cisa.gov/sites/default/files/publications/fact-sheet-implementing-phishing-resistant-mfa-508c.pdf | PASS | Fact sheet exists; matches the doc's quoted guidance. |
| Okta SMS authenticator can be set Inactive | https://help.okta.com/en-us/content/topics/security/mfa/sms.htm | PASS | Matches the Okta docs confirming Active/Inactive toggle. |
| Okta password recovery rule configurable to remove email | https://help.okta.com/oie/en-us/content/topics/identity-engine/policies/oamp-configure-account-recovery.htm | PASS | Account-recovery rule documentation includes options to enable/disable factors. |
| Okta system log retention defaults | (marked unknown) | PASS-as-unknown | Explicitly marked unknown with reasonable search queries listed. |
| IdP audit log event names | (best guess) | UPGRADE-SUGGESTED | Could be tightened against Okta System Log API event catalog; not load-bearing. |

No `BROKEN-URL`, `MIS-CITED`, or `OVERSTATED` flags surfaced.

## Verdict

**PASS**
