# 04C claim-check v1 — m14-onfido

## Verified

- **Entrust acquired Onfido in April 2024.** The Entrust newsroom page on the Airside acquisition (a related Onfido transaction) and multiple industry trackers confirm the April 2024 timing. PASS.
- **API v3.6 is current; bearer token "Token token=..." auth; region-specific base URLs (api.eu/api.us/api.ca).** The Entrust IDV developer portal at documentation.identity.entrust.com is the canonical reference and confirms v3.6 + the regional split. PASS.
- **SDK tokens scoped to one applicant, 90-minute expiry.** Documented on the API reference page. PASS.
- **Document report breakdown structure (`data_validation`, `visual_authenticity`, `compromised_document`, etc.).** Documented on the Onfido Document report guide page. PASS.
- **Motion defends against camera + network injection.** The Onfido blog post on Motion explicitly describes detection of fake webcams, emulators, and network injection. PASS.
- **NIST 800-63 IAL2 / Kantara listing (Entrust IDV).** The Entrust 2025 blog post explicitly claims certification and Kantara listing. PASS-with-hedge: the v1 doc reflects vendor's own assertion; direct Kantara registry lookup not performed in this round.
- **"One deepfake attack every five minutes" stat.** Sourced to the Entrust 2024 Identity Fraud Report and reproduced verbatim by Biometric Update and Infosecurity Magazine. PASS-with-stale-risk (vendor self-report, annual cadence).

## Flags

- **OVERSTATED (minor):** v1 says Motion is "iBeta Level 2 compliant." This appears in 04F's verification list but the v1 narrative does not actually carry the iBeta claim — it only references Motion's injection defense. No fix needed; the form-check item is moot. NO-OP.
- **UPGRADE-SUGGESTED:** Marginal cost `[best guess]` could be tightened with US state procurement records mentioning Onfido. Suggested search: `"Onfido" site:gov RFP per verification`.
- **MINOR:** v1 lists v3.6 as current, but the developer portal shows separate v2, v3.0, v3.1, v3.2, v3.6 pages. v3.6 is the latest documented version; statement holds.

## Verdict

REVISE-OPTIONAL — all critical claims hold. Document is salvageable as v1; v2 not required.
