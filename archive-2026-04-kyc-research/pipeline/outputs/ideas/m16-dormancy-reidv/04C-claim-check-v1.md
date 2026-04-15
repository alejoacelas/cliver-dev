# 4C Claim check — m16-dormancy-reidv v1

Claims verified against the form-check "For 4C to verify" list and other empirical claims in the document.

| Claim | URL | Verdict | Notes |
|---|---|---|---|
| Persona supports reverification by re-taking a selfie matched against stored selfie | https://withpersona.com/blog/perpetual-kyc-ongoing-customer-due-diligence | PASS | Persona's Perpetual KYC blog explicitly describes this pattern; cited content matches the doc's quotation. |
| Persona supports reverification at trigger points (account recovery, high-value txn, privilege escalation, periodic) | https://withpersona.com/blog/what-is-reverification-and-why-does-it-matter | PASS | Matches the marketing copy on Persona's reverification overview page. |
| NIST 800-63B AAL2 reauth: 12-hour overall, 30-minute inactivity | https://pages.nist.gov/800-63-4/sp800-63b.html | PASS | Confirmed via the SP 800-63B-4 publication; doc accurately notes this does NOT cover multi-month dormancy. |
| Okta Workflows "Suspend Inactive Users" template exists | https://www.okta.com/resources/webinar-okta-workflows-template-suspend-inactive-users/ | PASS | Page exists as a webinar/template resource. |
| Okta Automations look at users who haven't signed in for N days | https://help.okta.com/en-us/content/topics/automation-hooks/automations-main.htm | PASS | Matches Okta's documented Automations feature. |
| 6-month dormancy threshold is a "common KYC perpetual-review cadence" | (best guess) | UPGRADE-SUGGESTED | Could be sourced more precisely; FATF/FinCEN perpetual KYC guidance often cites annual or risk-based intervals. Not load-bearing — explicitly marked best-guess. |
| Persona / Onfido per-IDV cost ~ $1.50–$3.00 | (best guess, vendor-gated) | PASS | Already marked best-guess; vendor list pricing is not public. |

No `BROKEN-URL`, `MIS-CITED`, or `OVERSTATED` flags. The doc's empirical claims are either tied to working sources or explicitly marked best-guess / vendor-gated / unknown.

## Verdict

**PASS** — no flags. Document is salvageable as-is; recommend proceeding to stage 5.
